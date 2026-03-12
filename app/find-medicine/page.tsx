"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Medicine = {
  name: string;
  use: string;
  dosage: string;
  warning: string;
  keywords: string[];
};

type History = {
  query: string;
  created_at: string;
};

const medicineDB: Medicine[] = [
  {
    name: "Paracetamol",
    use: "Fever, headache and mild pain",
    dosage: "500mg every 6 hours",
    warning: "Do not exceed 4 tablets per day",
    keywords: ["fever", "headache", "pain", "sore throat"]
  },
  {
    name: "Ibuprofen",
    use: "Body pain and inflammation",
    dosage: "200-400mg every 6 hours",
    warning: "Avoid on empty stomach",
    keywords: ["body pain", "pain"]
  },
  {
    name: "Cetirizine",
    use: "Cold, cough and allergy",
    dosage: "10mg once daily",
    warning: "May cause drowsiness",
    keywords: ["cold", "allergy", "cough"]
  },
  {
    name: "ORS",
    use: "Dehydration and diarrhea",
    dosage: "1 sachet in 1L water",
    warning: "Drink within 24 hours",
    keywords: ["diarrhea", "vomiting", "dehydration"]
  },
  {
    name: "Isabgol",
    use: "Relief from constipation",
    dosage: "1–2 teaspoons with warm water before bed",
    warning: "Drink plenty of water",
    keywords: ["constipation"]
  },
  {
    name: "Digene",
    use: "Acidity and stomach upset",
    dosage: "1 tablet after meals",
    warning: "Do not exceed recommended dosage",
    keywords: ["acidity", "stomach pain"]
  }
];

const healthTips: any = {
  fever: ["Drink water", "Take rest", "Use paracetamol if needed"],
  cold: ["Drink warm fluids", "Steam inhalation"],
  cough: ["Drink warm water", "Honey helps soothe throat"],
  headache: ["Rest in quiet place", "Drink water"],
  "body pain": ["Take rest", "Apply warm compress"],
  allergy: ["Avoid dust", "Use antihistamine"],
  diarrhea: ["Drink ORS", "Avoid oily food"],
  "stomach pain": ["Eat light food", "Avoid spicy food"],
  vomiting: ["Drink ORS slowly"],
  constipation: ["Eat fiber food", "Drink more water"],
  dehydration: ["Drink ORS", "Drink coconut water"],
  acidity: ["Avoid spicy food", "Eat small meals"]
};

const symptomMedicineMap: any = {
  fever: ["Paracetamol"],
  cold: ["Cetirizine"],
  cough: ["Cetirizine"],
  headache: ["Paracetamol"],
  "body pain": ["Ibuprofen"],
  allergy: ["Cetirizine"],
  diarrhea: ["ORS"],
  "stomach pain": ["Digene"],
  vomiting: ["ORS"],
  dehydration: ["ORS"],
  constipation: ["Isabgol"],
  acidity: ["Digene"]
};

export default function FindMedicinePage() {

  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [suggested, setSuggested] = useState<Medicine[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setHistory(data);
  };

  const performSearch = (text: string) => {

    const q = text.toLowerCase().trim();

    const filtered = medicineDB.filter(
      med =>
        med.name.toLowerCase().includes(q) ||
        med.keywords.some(k => q.includes(k))
    );

    setResults(filtered);

    const foundSymptom = Object.keys(symptomMedicineMap).find(symptom =>
      q.includes(symptom)
    );

    if (foundSymptom) {
      const meds = medicineDB.filter(m =>
        symptomMedicineMap[foundSymptom].includes(m.name)
      );
      setSuggested(meds);
    } else {
      setSuggested([]);
    }
  };

  const searchMedicine = async () => {

    if (!query) return;

    performSearch(query);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("search_history").insert([
        { user_id: user.id, query: query }
      ]);
    }

    loadHistory();
  };

  const startVoiceSearch = () => {

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    setListening(true);

    recognition.onresult = (event: any) => {

      const text = event.results[0][0].transcript.toLowerCase().trim();

      setVoiceText(text);
      setQuery(text);

      performSearch(text);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const findNearbyPharmacy = () => {

    navigator.geolocation.getCurrentPosition((pos) => {

      const url =
        `https://www.google.com/maps/search/pharmacy/@${pos.coords.latitude},${pos.coords.longitude},15z`;

      window.open(url, "_blank");

    });

  };

  const symptoms = [
    "fever", "cold", "cough", "headache", "body pain",
    "allergy", "diarrhea", "stomach pain",
    "vomiting", "constipation", "dehydration", "acidity"
  ];

  return (

    <div style={styles.page}>

      <div style={styles.header}>
        <h1>💊 Find Medicine</h1>
        <p style={{ opacity: 0.7 }}>Offline Rural Healthcare Assistant</p>
      </div>

      <div style={styles.card}>

        <div style={{ display: "flex", gap: 10 }}>

          <input
            style={styles.input}
            placeholder="Search medicine or symptom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button style={styles.searchBtn} onClick={searchMedicine}>
            Search
          </button>

        </div>

        <button style={styles.voice} onClick={startVoiceSearch}>
          🎤 Voice Search
        </button>

        {listening && (
          <p style={{ marginTop: 10, color: "#2563eb" }}>
            🎤 Listening... Please speak
          </p>
        )}

        {voiceText && (
          <p style={{ marginTop: 10 }}>
            Detected: <b>{voiceText}</b>
          </p>
        )}

        <div style={styles.voiceHelp}>
          <b>Voice Search Tips:</b>
          <ul>
            <li>fever</li>
            <li>I have headache</li>
            <li>medicine for cold</li>
            <li>body pain</li>
          </ul>
        </div>

      </div>

      <div style={styles.card}>

        <h3>Search by Health Problem</h3>

        <div style={styles.symptoms}>

          {symptoms.map((s) => (

            <button
              key={s}
              style={styles.symptom}
              onClick={() => {
                setQuery(s);
                performSearch(s);
              }}
            >
              {s}
            </button>

          ))}

        </div>

      </div>

      <div style={styles.actions}>

        <button style={styles.pharmacy} onClick={findNearbyPharmacy}>
          📍 Nearby Pharmacy
        </button>

        <a href="tel:108" style={styles.emergency}>
          🚑 Emergency Call
        </a>

      </div>

      {healthTips[query] && (

        <div style={styles.card}>

          <h3>💡 Health Tips</h3>

          {healthTips[query].map((tip: string, i: number) => (
            <p key={i}>• {tip}</p>
          ))}

        </div>

      )}

      {suggested.length > 0 && (

        <div style={styles.card}>

          <h3>💊 Suggested Medicines</h3>

          {suggested.map((med, i) => (

            <div key={i} style={styles.medicineCard}>

              <h3>{med.name}</h3>
              <p><b>Use:</b> {med.use}</p>
              <p><b>Dosage:</b> {med.dosage}</p>
              <p><b>Warning:</b> {med.warning}</p>

            </div>

          ))}

        </div>

      )}

      <div style={styles.card}>

        <h3>Recent Searches</h3>

        {history.map((h, i) => (
          <p key={i}>
            {h.query} — {new Date(h.created_at).toLocaleString()}
          </p>
        ))}

      </div>

      <button style={styles.back} onClick={() => router.back()}>
        ← Back
      </button>

    </div>
  );
}

const styles: any = {
  page: { maxWidth: 700, margin: "40px auto", fontFamily: "DM Sans", padding: 20 },
  header: { textAlign: "center", marginBottom: 25 },
  card: { background: "#fff", padding: 20, borderRadius: 14, boxShadow: "0 4px 15px rgba(0,0,0,0.08)", marginBottom: 20 },
  input: { flex: 1, padding: 14, borderRadius: 10, border: "1px solid #ddd", fontSize: 16 },
  searchBtn: { background: "#2563eb", color: "white", border: "none", padding: "12px 16px", borderRadius: 8 },
  voice: { marginTop: 10, background: "#6366f1", color: "white", border: "none", padding: "10px 16px", borderRadius: 8 },
  voiceHelp: { marginTop: 15, background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 14 },
  symptoms: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 },
  symptom: { padding: "8px 14px", borderRadius: 20, border: "1px solid #ddd", background: "#f1f5f9", cursor: "pointer" },
  actions: { display: "flex", gap: 10, marginBottom: 20 },
  pharmacy: { flex: 1, background: "#16a34a", color: "white", border: "none", padding: 12, borderRadius: 10 },
  emergency: { flex: 1, background: "#dc2626", color: "white", padding: 12, borderRadius: 10, textAlign: "center", textDecoration: "none" },
  medicineCard: { background: "#f3f4f6", padding: 18, borderRadius: 12, marginBottom: 12 },
  back: { marginTop: 20, border: "none", background: "transparent", cursor: "pointer", fontSize: 16 }
};