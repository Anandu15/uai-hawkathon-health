"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Medicine = {
  name: string; use: string; dosage: string; warning: string;
  keywords: string[]; category: string; icon: string;
};
type History = { id?: string; query: string; created_at: string; };

const GREEN = "#1a5c45";
const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

const medicineDB: Medicine[] = [
  { name: "Paracetamol",  icon: "🌡️", category: "Pain Relief",       use: "Fever, headache and mild pain relief",             dosage: "500mg every 6 hours (max 4 tablets/day)",      warning: "Do not exceed 4 tablets per day. Avoid alcohol.",             keywords: ["fever","headache","pain","sore throat","temperature"] },
  { name: "Ibuprofen",    icon: "💪", category: "Anti-inflammatory",  use: "Body pain, inflammation and joint pain",            dosage: "200–400mg every 6–8 hours with food",           warning: "Always take with food. Avoid if you have stomach ulcers.",    keywords: ["body pain","pain","inflammation","joint","muscle"] },
  { name: "Cetirizine",   icon: "🤧", category: "Antihistamine",      use: "Cold, runny nose, cough and allergy relief",        dosage: "10mg once daily at bedtime",                    warning: "May cause drowsiness. Avoid driving after use.",              keywords: ["cold","allergy","cough","runny nose","sneezing","itching"] },
  { name: "ORS",          icon: "💧", category: "Rehydration",        use: "Rehydration for diarrhea and vomiting",             dosage: "1 sachet dissolved in 1 litre of clean water",  warning: "Use fresh solution. Drink within 24 hours.",                  keywords: ["diarrhea","vomiting","dehydration","loose motions","weakness"] },
  { name: "Isabgol",      icon: "🌾", category: "Laxative",           use: "Constipation and irregular bowel movements",        dosage: "1–2 teaspoons in warm water before bedtime",    warning: "Drink plenty of water throughout the day.",                   keywords: ["constipation","hard stool","irregular"] },
  { name: "Digene",       icon: "🔥", category: "Antacid",            use: "Acidity, heartburn and indigestion",                dosage: "1–2 tablets after meals or when needed",        warning: "Do not use more than 3 times per day.",                       keywords: ["acidity","stomach pain","heartburn","gas","bloating","indigestion"] },
  { name: "Azithromycin", icon: "🦠", category: "Antibiotic",         use: "Bacterial infections, throat and chest infections", dosage: "500mg once daily for 3–5 days",                 warning: "Complete the full course. Consult doctor before use.",        keywords: ["infection","throat infection","bacterial","chest"] },
  { name: "Pantoprazole", icon: "🩺", category: "Antacid",            use: "Acid reflux and stomach ulcers",                    dosage: "40mg once daily before breakfast",              warning: "Take on empty stomach. Long-term use needs doctor guidance.", keywords: ["acid reflux","ulcer","acidity","burning"] },
];

const healthTips: Record<string, string[]> = {
  fever:          ["Drink 8–10 glasses of water daily","Rest and avoid exertion","Cool wet cloth on forehead","Paracetamol if above 38.5°C"],
  cold:           ["Drink warm fluids and herbal tea","Steam inhalation twice a day","Gargle with warm salt water","Rest and avoid cold drinks"],
  cough:          ["Warm water with honey","Avoid cold drinks and ice cream","Steam inhalation helps","Elevate head while sleeping"],
  headache:       ["Rest in a quiet, dark room","Drink water — dehydration is common","Cold or warm compress helps","Avoid screen time"],
  "body pain":    ["Rest and avoid strenuous activity","Warm compress to affected area","Gentle stretching may help","Stay well hydrated"],
  allergy:        ["Identify and avoid triggers","Keep windows closed in pollen season","Use antihistamine as needed","Wear a mask outdoors"],
  diarrhea:       ["Drink ORS solution frequently","Eat plain rice, bananas or toast","Avoid dairy and oily food","Wash hands frequently"],
  "stomach pain": ["Eat small, light meals","Avoid spicy and oily food","Drink warm water with hing","Rest after meals"],
  vomiting:       ["Sip ORS or clear fluids slowly","Avoid solid food for a few hours","Ginger tea may help","Rest lying flat"],
  constipation:   ["Eat high-fibre foods daily","Drink at least 8 glasses of water","Walk 15–20 mins after meals","Avoid excess tea and coffee"],
  dehydration:    ["Drink ORS or coconut water","Avoid caffeine and alcohol","Eat water-rich fruits","Rest in cool environment"],
  acidity:        ["Eat smaller, frequent meals","Avoid lying down after eating","Reduce tea, coffee, spicy food","Cold milk gives quick relief"],
};

const symptomMedicineMap: Record<string, string[]> = {
  fever: ["Paracetamol"], cold: ["Cetirizine"], cough: ["Cetirizine"],
  headache: ["Paracetamol"], "body pain": ["Ibuprofen"], allergy: ["Cetirizine"],
  diarrhea: ["ORS"], "stomach pain": ["Digene","Pantoprazole"], vomiting: ["ORS"],
  dehydration: ["ORS"], constipation: ["Isabgol"], acidity: ["Digene","Pantoprazole"],
  "acid reflux": ["Pantoprazole"], infection: ["Azithromycin"],
};

const symptoms = [
  { label: "Fever",        icon: "🌡️", value: "fever"        },
  { label: "Cold",         icon: "🤧", value: "cold"         },
  { label: "Cough",        icon: "😮‍💨", value: "cough"        },
  { label: "Headache",     icon: "🤕", value: "headache"     },
  { label: "Body Pain",    icon: "💪", value: "body pain"    },
  { label: "Allergy",      icon: "🌿", value: "allergy"      },
  { label: "Diarrhea",     icon: "💧", value: "diarrhea"     },
  { label: "Stomach Pain", icon: "🔥", value: "stomach pain" },
  { label: "Vomiting",     icon: "🤢", value: "vomiting"     },
  { label: "Constipation", icon: "🌾", value: "constipation" },
  { label: "Dehydration",  icon: "🫙", value: "dehydration"  },
  { label: "Acidity",      icon: "⚡", value: "acidity"      },
];

const catColor: Record<string, { bg: string; text: string }> = {
  "Pain Relief":       { bg: "#fef3c7", text: "#b45309" },
  "Anti-inflammatory": { bg: "#fee2e2", text: "#991b1b" },
  "Antihistamine":     { bg: "#ede9fe", text: "#6d28d9" },
  "Rehydration":       { bg: "#dbeafe", text: "#1e40af" },
  "Laxative":          { bg: "#d1fae5", text: "#065f46" },
  "Antacid":           { bg: "#f0fdf4", text: "#166534" },
  "Antibiotic":        { bg: "#fce7f3", text: "#9d174d" },
};

function MedCard({ med, expanded, onToggle, highlight }: {
  med: Medicine; expanded: boolean; onToggle: () => void; highlight?: boolean;
}) {
  const cc = catColor[med.category] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <div
      onClick={onToggle}
      style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${highlight ? GREEN : "#f0ebe3"}`, padding: "16px 18px", cursor: "pointer", transition: "box-shadow .2s, transform .2s", boxShadow: highlight ? "0 4px 16px rgba(26,92,69,.1)" : "0 2px 8px rgba(0,0,0,.04)" }}
      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = "translateY(-2px)"; d.style.boxShadow = "0 8px 24px rgba(26,92,69,.13)"; }}
      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ""; d.style.boxShadow = highlight ? "0 4px 16px rgba(26,92,69,.1)" : "0 2px 8px rgba(0,0,0,.04)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 3 }}>{med.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 4 }}>
            <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#0f1a10" }}>{med.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: cc.bg, color: cc.text }}>{med.category}</span>
          </div>
          <div style={{ fontSize: 13, color: "#718096", lineHeight: 1.45 }}>{med.use}</div>
        </div>
        <span style={{ fontSize: 16, color: "#a0aec0", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink: 0 }}>▾</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>💊</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>Dosage</div>
              <div style={{ fontSize: 13, color: "#1a202c", lineHeight: 1.5 }}>{med.dosage}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#c2410c", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>Warning</div>
              <div style={{ fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>{med.warning}</div>
            </div>
          </div>
        </div>
      )}
      {!expanded && <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 8, textAlign: "right" as const }}>Tap to see dosage & warnings →</div>}
    </div>
  );
}

export default function FindMedicinePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef   = useRef<any>(null);

  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<Medicine[]>([]);
  const [suggested, setSuggested]   = useState<Medicine[]>([]);
  const [tips, setTips]             = useState<string[]>([]);
  const [history, setHistory]       = useState<History[]>([]);
  const [voiceState, setVoiceState] = useState<"idle"|"listening"|"done"|"error">("idle");
  const [transcript, setTranscript] = useState("");
  const [activeSymptom, setActiveSymptom] = useState<string | null>(null);
  const [expandedMed, setExpandedMed]     = useState<string | null>(null);
  const [searched, setSearched]           = useState(false);
  const [showHistory, setShowHistory]     = useState(false);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => () => { recRef.current?.abort(); }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("search_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
    if (data) setHistory(data);
  };

  const saveSearch = async (q: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await supabase.from("search_history").insert([{ user_id: user.id, query: q.trim() }]); loadHistory(); }
  };

  const runSearch = useCallback((text: string) => {
    const q = text.toLowerCase().trim();
    if (!q) return;
    setResults(medicineDB.filter(m => m.name.toLowerCase().includes(q) || m.use.toLowerCase().includes(q) || m.keywords.some(k => q.includes(k) || k.includes(q))));
    setSearched(true);
    const sym = Object.keys(symptomMedicineMap).find(s => q.includes(s));
    if (sym) { setSuggested(medicineDB.filter(m => symptomMedicineMap[sym].includes(m.name))); setTips(healthTips[sym] ?? []); }
    else { setSuggested([]); setTips([]); }
  }, []);

  const handleSearch = () => { if (!query.trim()) return; runSearch(query); saveSearch(query); };

  const handleSymptom = (val: string) => { setQuery(val); setActiveSymptom(val); runSearch(val); saveSearch(val); };

  const clearAll = () => {
    setQuery(""); setResults([]); setSuggested([]); setTips([]);
    setSearched(false); setActiveSymptom(null); setTranscript(""); setVoiceState("idle");
    inputRef.current?.focus();
  };

  // ── Robust voice search ────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (voiceState === "listening") {
      recRef.current?.stop();
      setVoiceState("idle");
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceState("error"); return; }

    recRef.current?.abort();
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart  = () => setVoiceState("listening");
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript.toLowerCase().trim();
      setTranscript(text);
      setQuery(text);
      setVoiceState("done");
      runSearch(text);
      saveSearch(text);
    };
    rec.onerror = (e: any) => { setVoiceState(e.error === "aborted" ? "idle" : "error"); recRef.current = null; };
    rec.onend   = () => { setVoiceState(v => v === "listening" ? "idle" : v); recRef.current = null; };

    try { rec.start(); }
    catch { setVoiceState("error"); recRef.current = null; }
  };

  const findPharmacy = () => navigator.geolocation.getCurrentPosition(
    p => window.open(`https://www.google.com/maps/search/pharmacy/@${p.coords.latitude},${p.coords.longitude},15z`, "_blank"),
    () => window.open("https://www.google.com/maps/search/pharmacy+near+me", "_blank")
  );

  const isListening = voiceState === "listening";

  return (
    <div style={{ background: "#f7f3ee", minHeight: "100vh", fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f7f3ee !important; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.2)} }
        @keyframes ring   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }

        .w          { max-width: 900px; margin: 0 auto; padding: 0 28px 80px; }
        .fu         { animation: fadeUp .35s ease both; }
        .card       { background:#fff; border-radius:20px; border:1px solid #f0ebe3; box-shadow:0 2px 14px rgba(0,0,0,.05); }
        .pill:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(26,92,69,.2)!important; }
        .pill:active{ transform:scale(.95); }
        .btn:hover  { transform:translateY(-2px); }
        .btn:active { transform:scale(.97); }
        .hrow:hover { background:#f7f3ee!important; }
        .back:hover { background:rgba(26,92,69,.07)!important; color:#1a5c45!important; }
        input:focus { outline:none; }

        .ring { position:absolute;inset:-5px;border-radius:50%;border:2px solid ${GREEN};animation:ring 1.1s ease-out infinite;pointer-events:none; }

        .sym-grid  { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
        .two-col   { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        @media(max-width:700px){
          .w        { padding:0 14px 80px; }
          .sym-grid { grid-template-columns:repeat(4,1fr); gap:8px; }
          .two-col  { grid-template-columns:1fr; }
        }
        @media(max-width:360px){
          .sym-grid { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>

      {/* ── Sticky Nav ─────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e0d5", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="w" style={{ padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
            <button className="back" onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1.5px solid #e8e0d5", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#718096", fontFamily: SANS, transition: "all .15s" }}>
              ← Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>✚</div>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: GREEN }}>CareConnect</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w">

        {/* ── Hero ───────────────────────────────────────── */}
        <div className="fu" style={{ textAlign: "center", padding: "36px 0 24px" }}>
          <div style={{ fontSize: 54, marginBottom: 12, lineHeight: 1 }}>💊</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: "#0f1a10", marginBottom: 8 }}>Find Medicine</h1>
          <p style={{ fontSize: 14, color: "#718096", maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>Search by symptom or medicine name for trusted health guidance</p>
        </div>

        {/* ── Search Card ────────────────────────────────── */}
        <div className="card fu" style={{ padding: "22px", marginBottom: 18, animationDelay: "60ms" }}>

          {/* Input + button */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div
              id="input-wrap"
              style={{ flex: 1, display: "flex", alignItems: "center", border: "1.5px solid #e8e0d5", borderRadius: 13, background: "#fdfaf7", overflow: "hidden", paddingLeft: 12, transition: "border-color .2s, box-shadow .2s" }}
            >
              <span style={{ fontSize: 14, color: "#a0aec0", flexShrink: 0 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                onFocus={() => { const w = document.getElementById("input-wrap"); if(w){ w.style.borderColor=GREEN; w.style.boxShadow="0 0 0 3px rgba(26,92,69,.1)"; } }}
                onBlur={() =>  { const w = document.getElementById("input-wrap"); if(w){ w.style.borderColor="#e8e0d5"; w.style.boxShadow="none"; } }}
                placeholder="Search symptom or medicine…"
                style={{ flex: 1, padding: "13px 8px", border: "none", background: "transparent", fontSize: 14, fontFamily: SANS, color: "#1a202c" }}
              />
              {query && (
                <button onClick={clearAll} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#a0aec0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 4 }}>✕</button>
              )}
            </div>
            <button className="btn" onClick={handleSearch} style={{ padding: "0 26px", height: 50, borderRadius: 13, border: "none", background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 14px rgba(26,92,69,.28)", whiteSpace: "nowrap" as const, transition: "transform .18s, box-shadow .18s" }}>
              Search
            </button>
          </div>

          {/* Voice button + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 12 }}>
            <button
              className="btn"
              onClick={toggleVoice}
              style={{
                position: "relative", display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS,
                border: `1.5px solid ${isListening ? "#fca5a5" : "rgba(26,92,69,.18)"}`,
                background: isListening ? "#fff5f5" : "rgba(26,92,69,.05)",
                color: isListening ? "#dc2626" : GREEN,
                transition: "all .18s",
              }}
            >
              {isListening && <span className="ring" />}
              <span style={{ fontSize: 16, animation: isListening ? "pulse 1s infinite" : "none", display: "inline-block" }}>🎤</span>
              {isListening ? "Tap to stop" : "Voice Search"}
            </button>

            {voiceState === "listening" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#b45309", background: "#fef3c7", padding: "6px 13px", borderRadius: 20 }}>
                <span style={{ animation: "pulse 1s infinite", display: "inline-block" }}>●</span>
                Listening… speak now
              </div>
            )}
            {voiceState === "done" && transcript && (
              <div style={{ fontSize: 13, color: "#065f46", background: "#d1fae5", padding: "6px 13px", borderRadius: 20 }}>
                ✓ Heard: <strong>"{transcript}"</strong>
              </div>
            )}
            {voiceState === "error" && (
              <div style={{ fontSize: 13, color: "#dc2626", background: "#fee2e2", padding: "6px 13px", borderRadius: 20 }}>
                ❌ Voice not supported — use Chrome
              </div>
            )}
          </div>

          {/* Voice examples */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, padding: "10px 14px", background: "#f7f3ee", borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a0aec0", textTransform: "uppercase" as const, letterSpacing: "0.4px", whiteSpace: "nowrap" as const }}>Try saying:</span>
            {["fever", "I have headache", "medicine for cold", "stomach pain"].map(t => (
              <span key={t} style={{ fontSize: 12, background: "#fff", color: "#718096", padding: "3px 10px", borderRadius: 20, border: "1px solid #e8e0d5" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Symptom Pills ──────────────────────────────── */}
        <div className="card fu" style={{ padding: "22px", marginBottom: 18, animationDelay: "100ms" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#0f1a10" }}>🩺 Search by Health Problem</h2>
            <span style={{ fontSize: 12, color: "#a0aec0" }}>Tap a symptom</span>
          </div>
          <div className="sym-grid">
            {symptoms.map((s, i) => (
              <button
                key={s.value}
                className="pill fu"
                onClick={() => handleSymptom(s.value)}
                style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5,
                  padding: "12px 4px", borderRadius: 14,
                  border: `1.5px solid ${activeSymptom === s.value ? GREEN : "#e8e0d5"}`,
                  background: activeSymptom === s.value ? GREEN : "#fff",
                  color: activeSymptom === s.value ? "#fff" : "#1a202c",
                  cursor: "pointer", fontFamily: SANS,
                  boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  transition: "all .18s",
                  animationDelay: `${120 + i * 30}ms`,
                }}
              >
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textAlign: "center" as const, lineHeight: 1.2 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────── */}
        <div className="two-col fu" style={{ marginBottom: 18, animationDelay: "140ms" }}>
          <button className="btn" onClick={findPharmacy} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderRadius: 16, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontFamily: SANS, boxShadow: "0 6px 20px rgba(26,92,69,.28)", textAlign: "left" as const, transition: "transform .18s, box-shadow .18s", width: "100%" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>📍</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Nearby Pharmacy</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Find one on Google Maps</div>
            </div>
          </button>
<button
  className="btn"
  onClick={() => router.push("/emergency")}
  style={{
    display: "flex", alignItems: "center", gap: 14, padding: "18px 22px",
    borderRadius: 16, border: "none", background: "#dc2626", color: "#fff",
    cursor: "pointer", fontFamily: SANS,
    boxShadow: "0 6px 20px rgba(220,38,38,.28)",
    textAlign: "left" as const,
    transition: "transform .18s, box-shadow .18s",
    width: "100%",
  }}
>
  <span style={{ fontSize: 28, flexShrink: 0 }}>🚑</span>
  <div>
    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Emergency: 108</div>
    <div style={{ fontSize: 12, opacity: 0.75 }}>Tap to call ambulance</div>
  </div>
</button>
        </div>

        {/* ── Health Tips ────────────────────────────────── */}
        {tips.length > 0 && (
          <div className="fu" style={{ background: "#f0fdf4", borderRadius: 20, padding: "20px 22px", border: "1px solid #bbf7d0", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>💡</span>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: "#0f1a10" }}>Health Tips</div>
                <div style={{ fontSize: 12, color: "#718096", textTransform: "capitalize" as const, marginTop: 2 }}>For {activeSymptom ?? query}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {tips.map((tip, i) => (
                <div key={i} className="fu" style={{ display: "flex", alignItems: "flex-start", gap: 10, animationDelay: `${i * 55}ms` }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 13, color: "#1a202c", lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Suggested Medicines ────────────────────────── */}
        {suggested.length > 0 && (
          <div className="card fu" style={{ padding: "22px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#0f1a10" }}>💊 Recommended Medicines</h2>
              <span style={{ fontSize: 12, color: "#a0aec0", textTransform: "capitalize" as const }}>for {activeSymptom ?? query}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {suggested.map(med => <MedCard key={med.name} med={med} highlight expanded={expandedMed === med.name} onToggle={() => setExpandedMed(expandedMed === med.name ? null : med.name)} />)}
            </div>
          </div>
        )}

        {/* ── Search Results ─────────────────────────────── */}
        {searched && results.length === 0 && (
          <div className="card fu" style={{ padding: "52px 24px", textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: "#1a202c", marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 13, color: "#a0aec0" }}>Try a different symptom or tap one of the health problem buttons above</div>
          </div>
        )}

        {searched && results.length > 0 && (
          <div className="card fu" style={{ padding: "22px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#0f1a10" }}>🗂️ All Results</h2>
              <span style={{ fontSize: 12, color: "#a0aec0" }}>{results.length} found</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {results.map(med => <MedCard key={med.name} med={med} expanded={expandedMed === med.name} onToggle={() => setExpandedMed(expandedMed === med.name ? null : med.name)} />)}
            </div>
          </div>
        )}

        {/* ── Recent Searches ────────────────────────────── */}
        {history.length > 0 && (
          <div className="card fu" style={{ padding: "22px", marginBottom: 18, animationDelay: "180ms" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }} onClick={() => setShowHistory(h => !h)}>
              <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#0f1a10" }}>🕒 Recent Searches</h2>
              <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{showHistory ? "Hide ▲" : `Show ${history.length} ▼`}</span>
            </div>
            {showHistory && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {history.map((h, i) => (
                  <div key={i} className="hrow" style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", background: "#fdfaf7", border: "1px solid #f0ebe3", transition: "background .15s" }}>
                    <button onClick={() => { setQuery(h.query); setActiveSymptom(null); runSearch(h.query); }} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: SANS, textAlign: "left" as const }}>
                      <span style={{ color: "#a0aec0", fontSize: 13 }}>🔍</span>
                      <span style={{ flex: 1, fontSize: 13, color: "#1a202c", fontWeight: 500, textTransform: "capitalize" as const }}>{h.query}</span>
                      <span style={{ fontSize: 11, color: "#a0aec0", flexShrink: 0 }}>{new Date(h.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </button>
                    {h.id && <button onClick={() => { supabase.from("search_history").delete().eq("id", h.id!).then(loadHistory); }} style={{ padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "#fca5a5" }}>✕</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Disclaimer ─────────────────────────────────── */}
        <div style={{ fontSize: 12, color: "#a0aec0", textAlign: "center" as const, lineHeight: 1.75, padding: "16px 0", borderTop: "1px solid #e8e0d5", marginTop: 8 }}>
          ⚠️ This tool provides general health information only.<br />
          Always consult a qualified doctor before taking any medication.
        </div>

      </div>
    </div>
  );
}