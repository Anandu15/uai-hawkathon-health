"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

// ─── Offline symptom rules ────────────────────────────────────────────────────
const SYMPTOM_RULES: Record<string, {
  severity: "mild" | "moderate" | "urgent";
  advice: string;
  action: string;
  hindi: string;
}> = {
  fever: {
    severity: "moderate",
    advice: "Stay hydrated, rest, and take paracetamol if temperature exceeds 38°C. Monitor every 4 hours.",
    action: "Visit doctor if fever persists more than 2 days or exceeds 40°C.",
    hindi: "पानी पियें, आराम करें। बुखार 2 दिन से ज्यादा रहे तो डॉक्टर से मिलें।",
  },
  headache: {
    severity: "mild",
    advice: "Rest in a quiet dark room, stay hydrated. Paracetamol may help.",
    action: "See a doctor if headache is severe, sudden, or accompanied by vomiting.",
    hindi: "आराम करें, पानी पियें। अगर सिरदर्द बहुत तेज हो तो डॉक्टर से मिलें।",
  },
  cough: {
    severity: "mild",
    advice: "Drink warm water with honey. Avoid cold drinks and dusty environments.",
    action: "See a doctor if cough lasts more than 2 weeks or there is blood in mucus.",
    hindi: "गर्म पानी शहद के साथ पियें। 2 हफ्ते से ज्यादा खांसी हो तो डॉक्टर से मिलें।",
  },
  "chest pain": {
    severity: "urgent",
    advice: "This could be a serious cardiac or respiratory emergency.",
    action: "Go to Nabha Civil Hospital IMMEDIATELY or call 108.",
    hindi: "यह गंभीर हो सकता है। तुरंत नाभा सिविल हॉस्पिटल जाएं या 108 पर कॉल करें।",
  },
  "difficulty breathing": {
    severity: "urgent",
    advice: "Breathing difficulty is a medical emergency.",
    action: "Call 108 immediately or go to the nearest emergency room.",
    hindi: "सांस लेने में तकलीफ - तुरंत 108 पर कॉल करें।",
  },
  diarrhea: {
    severity: "moderate",
    advice: "Drink ORS (Oral Rehydration Solution) frequently. Avoid solid food initially.",
    action: "Go to doctor if there is blood in stool, high fever, or symptoms last more than 2 days.",
    hindi: "ORS घोल पियें। खून आए या 2 दिन से ज्यादा हो तो डॉक्टर से मिलें।",
  },
  vomiting: {
    severity: "moderate",
    advice: "Sip small amounts of water or ORS. Avoid solid food for a few hours.",
    action: "See a doctor if vomiting is persistent, contains blood, or is accompanied by severe pain.",
    hindi: "थोड़ा-थोड़ा पानी पियें। लगातार उल्टी हो तो डॉक्टर से मिलें।",
  },
  "stomach pain": {
    severity: "moderate",
    advice: "Rest, avoid spicy food. A hot water bottle may ease cramps.",
    action: "See a doctor if pain is severe, concentrated on right side, or lasts more than 6 hours.",
    hindi: "आराम करें, मसालेदार खाना न खाएं। दर्द तेज हो तो डॉक्टर से मिलें।",
  },
  "joint pain": {
    severity: "mild",
    advice: "Rest the joint, apply cold or warm compress. Avoid strenuous activity.",
    action: "See a doctor if swelling, redness, or fever is also present.",
    hindi: "जोड़ को आराम दें। सूजन या बुखार हो तो डॉक्टर से मिलें।",
  },
  weakness: {
    severity: "mild",
    advice: "Eat nutritious food, rest, and stay hydrated.",
    action: "See a doctor if weakness is sudden, severe, or accompanied by other symptoms.",
    hindi: "पोषक खाना खाएं, आराम करें। अचानक बहुत ज्यादा कमजोरी हो तो डॉक्टर से मिलें।",
  },
  rash: {
    severity: "moderate",
    advice: "Avoid scratching. Keep the area clean and dry.",
    action: "See a doctor if rash is spreading rapidly, has blisters, or is accompanied by fever.",
    hindi: "खुजाएं नहीं। तेजी से फैले या बुखार हो तो डॉक्टर से मिलें।",
  },
  "eye pain": {
    severity: "moderate",
    advice: "Avoid rubbing eyes. Rinse with clean water if something entered the eye.",
    action: "See a doctor if there is vision change, severe pain, or eye redness with discharge.",
    hindi: "आंखें मत रगड़ें। दर्द तेज हो या दिखने में दिक्कत हो तो डॉक्टर से मिलें।",
  },
  "high blood pressure": {
    severity: "urgent",
    advice: "Sit down and stay calm. Avoid salt and physical exertion.",
    action: "Go to Nabha Civil Hospital immediately if BP is very high or you feel unwell.",
    hindi: "बैठें और शांत रहें। तुरंत नाभा सिविल हॉस्पिटल जाएं।",
  },
  diabetes: {
    severity: "moderate",
    advice: "Monitor blood sugar. If feeling dizzy or shaky, consume sugar immediately.",
    action: "See a doctor for regular checkups and medication management.",
    hindi: "शुगर की जांच करें। चक्कर आए तो मीठा खाएं और डॉक्टर से मिलें।",
  },
  burn: {
    severity: "moderate",
    advice: "Cool the burn under running water for 10 minutes. Do not use toothpaste or ice.",
    action: "Go to hospital if burn is large, deep, or on face/hands/genitals.",
    hindi: "जले हिस्से पर 10 मिनट ठंडा पानी डालें। बड़ा जला हो तो अस्पताल जाएं।",
  },
  "snake bite": {
    severity: "urgent",
    advice: "Keep the person calm and still. Remove jewelry near the bite. Do NOT suck the wound.",
    action: "Call 108 IMMEDIATELY and go to Nabha Civil Hospital for antivenom.",
    hindi: "मरीज को शांत रखें। तुरंत 108 पर कॉल करें और नाभा सिविल हॉस्पिटल जाएं।",
  },
};

// ─── Constants (outside component — no hooks here, just data) ────────────────

const COMMON_SYMPTOMS = [
  "Fever", "Headache", "Cough", "Chest Pain", "Difficulty Breathing",
  "Diarrhea", "Vomiting", "Stomach Pain", "Joint Pain", "Weakness",
  "Rash", "Eye Pain", "High Blood Pressure", "Diabetes", "Burn", "Snake Bite",
];

// ✅ VITALS_GUIDE is plain data — lives outside the component, no hooks
const VITALS_GUIDE = [
  { name: "Pulse", icon: "❤️", steps: "Place 2 fingers on wrist below thumb. Count beats for 15 sec × 4.", normal: "60–100 bpm", warning: ">120 or <50 bpm — see a doctor", hindi: "कलाई पर 2 उंगलियां रखें। 15 सेकंड की धड़कन × 4 = नाड़ी दर।" },
  { name: "Breathing", icon: "🫁", steps: "Watch chest rise for 60 seconds. Each rise = 1 breath.", normal: "12–20 breaths/min", warning: ">30 or laboured — seek immediate care", hindi: "60 सेकंड में छाती कितनी बार ऊपर जाती है गिनें।" },
  { name: "Fever check", icon: "🌡️", steps: "Touch forehead with back of hand. Compare to your own forehead.", normal: "Skin feels same as yours", warning: "Very hot to touch → paracetamol + fluids", hindi: "थर्मामीटर न हो तो हाथ के पिछले हिस्से से माथा छुएं।" },
  { name: "Hydration", icon: "💧", steps: "Pinch skin on back of hand. Release — should snap back in <2 seconds.", normal: "Skin returns quickly", warning: "Slow return = dehydrated → drink ORS immediately", hindi: "हाथ की चमड़ी खींचें — 2 सेकंड में वापस आनी चाहिए।" },
];

const severityConfig = {
  mild:     { color: "#1a5c45", bg: "#d1fae5", border: "#6ee7b7", label: "Mild",     icon: "🟢", emoji: "😐" },
  moderate: { color: "#b45309", bg: "#fef3c7", border: "#fcd34d", label: "Moderate", icon: "🟡", emoji: "😟" },
  urgent:   { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", label: "Urgent",   icon: "🔴", emoji: "🚨" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Result = {
  severity: "mild" | "moderate" | "urgent";
  advice: string;
  action: string;
  hindi: string;
  source: "offline" | "ai";
};

// ✅ HistoryEntry type lives outside the component — it's just a type, fine anywhere
type HistoryEntry = {
  id: string;
  symptoms: string[];
  severity: "mild" | "moderate" | "urgent";
  date: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SymptomCheckerPage() {
  const router = useRouter();

  // ── All useState hooks grouped together at the top ──
  const [isOnline, setIsOnline]         = useState(true);
  const [selected, setSelected]         = useState<string[]>([]);
  const [customInput, setCustomInput]   = useState("");
  const [result, setResult]             = useState<Result | null>(null);
  const [loading, setLoading]           = useState(false);
  const [showHindi, setShowHindi]       = useState(false);
  const [language, setLanguage]         = useState("english");
  // ✅ Feature: Symptom History
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory]   = useState(false);
  // ✅ Feature: Vitals Guide
  const [showVitals, setShowVitals]     = useState(false);

  // ── All useEffect hooks grouped together ──

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Load user language from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("patients").select("language").eq("id", session.user.id).single();
        if (data?.language) setLanguage(data.language);
      }
    };
    load();
  }, []);

  // ✅ Feature: Load symptom history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("symptom_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // ── Helper functions ──

  const toggleSymptom = (sym: string) => {
    const key = sym.toLowerCase();
    setSelected(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
    setResult(null);
  };

  const enhanceOfflineSeverity = (
    symptoms: string[],
    baseSeverity: "mild" | "moderate" | "urgent"
  ): "mild" | "moderate" | "urgent" => {
    let score = 0;
    if (baseSeverity === "moderate") score += 2;
    if (baseSeverity === "urgent")   score += 5;
    if (symptoms.includes("fever") && symptoms.includes("difficulty breathing")) score += 5;
    if (symptoms.includes("chest pain") && symptoms.includes("weakness"))        score += 5;
    if (symptoms.includes("vomiting") && symptoms.includes("diarrhea"))          score += 2;
    if (symptoms.length >= 4) score += 2;
    if (score >= 7) return "urgent";
    if (score >= 3) return "moderate";
    return "mild";
  };

  const checkOffline = (symptoms: string[]): Result => {
    if (symptoms.length === 0) {
      return {
        severity: "mild",
        advice: "No symptoms selected. Monitor how you feel and rest.",
        action: "Visit Nabha Civil Hospital if you feel unwell.",
        hindi: "कोई लक्षण नहीं चुना। आराम करें और डॉक्टर से मिलें अगर तकलीफ हो।",
        source: "offline",
      };
    }

    let worstSeverity: "mild" | "moderate" | "urgent" = "mild";
    let matchedKey: string | null = null;

    for (const sym of symptoms) {
      const rule = SYMPTOM_RULES[sym];
      if (!rule) continue;
      if (rule.severity === "urgent") { worstSeverity = "urgent"; matchedKey = sym; break; }
      if (rule.severity === "moderate" && worstSeverity !== "urgent") { worstSeverity = "moderate"; matchedKey = sym; }
      if (rule.severity === "mild" && matchedKey === null) { matchedKey = sym; }
    }

    const rule          = matchedKey ? SYMPTOM_RULES[matchedKey] : null;
    const finalSeverity = enhanceOfflineSeverity(symptoms, worstSeverity);

    return {
      severity: finalSeverity,
      advice:   rule?.advice ?? "Rest, stay hydrated, and monitor your symptoms closely.",
      action:   rule?.action ?? "Visit Nabha Civil Hospital if symptoms worsen or persist.",
      hindi:    rule?.hindi  ?? "आराम करें और पानी पियें। लक्षण बढ़ें तो नाभा सिविल हॉस्पिटल जाएं।",
      source:   "offline",
    };
  };

  const checkOnline = async (symptoms: string[]): Promise<Result> => {
    try {
      const response = await fetch("/api/symptom-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Patient symptoms: ${symptoms.join(", ")}. 
            Context: Rural patient near Nabha, Punjab, India. Limited access to healthcare.
            
            Respond in this exact JSON format only, no extra text, no markdown:
            {
              "severity": "mild" or "moderate" or "urgent",
              "advice": "2-3 sentence home care advice",
              "action": "1 sentence on when/where to seek care. If urgent mention Nabha Civil Hospital or 108.",
              "hindi": "Hindi translation of the advice in 1-2 sentences"
            }`
          }]
        }),
      });

      const data = await response.json();
      const text =
        data?.choices?.[0]?.message?.content
        ?? data?.content?.[0]?.text
        ?? data?.message
        ?? "";

      if (!text) throw new Error("Empty response");

      const clean    = text.replace(/```json|```/g, "").trim();
      const parsed   = JSON.parse(clean);
      const severity = (parsed.severity ?? "mild").toLowerCase() as "mild" | "moderate" | "urgent";
      const validSeverity = (["mild", "moderate", "urgent"] as const).includes(severity) ? severity : "mild";

      return {
        severity: validSeverity,
        advice:   parsed.advice ?? "Rest and monitor your symptoms.",
        action:   parsed.action ?? "Visit Nabha Civil Hospital if symptoms worsen.",
        hindi:    parsed.hindi  ?? "आराम करें। लक्षण बढ़ें तो डॉक्टर से मिलें।",
        source:   "ai",
      };
    } catch {
      return checkOffline(symptoms);
    }
  };

  // ✅ Feature: Save a check to localStorage history
  // Defined outside handleCheck so it's a stable function, not recreated each call
  const saveToHistory = (symptoms: string[], severity: "mild" | "moderate" | "urgent") => {
    const entry: HistoryEntry = {
      id:       Date.now().toString(),
      symptoms,
      severity,
      date:     new Date().toISOString(),
    };
    // Use functional updater so we don't depend on stale `history` closure
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem("symptom_history", JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Feature: Request a browser notification reminder
  const requestReminder = async (hours: number) => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Please allow notifications to set a reminder.");
      return;
    }
    setTimeout(() => {
      new Notification("CareConnect Reminder", {
        body: `It's been ${hours} hour(s). How are you feeling? Check your symptoms again.`,
      });
    }, hours * 60 * 60 * 1000);
    alert(`✅ Reminder set for ${hours} hour(s) from now.`);
  };

  const handleCheck = async () => {
    const allSymptoms = [
      ...selected,
      ...(customInput.trim() ? customInput.toLowerCase().split(",").map(s => s.trim()) : [])
    ];
    if (allSymptoms.length === 0) return;

    setLoading(true);
    setResult(null);

    let res: Result;
    if (isOnline) {
      res = await checkOnline(allSymptoms);
    } else {
      await new Promise(r => setTimeout(r, 600));
      res = checkOffline(allSymptoms);
    }

    setResult(res);
    // ✅ Save to history after every check
    saveToHistory(allSymptoms, res.severity);
    setLoading(false);
  };

  const reset = () => { setSelected([]); setCustomInput(""); setResult(null); };

  const sev = result ? severityConfig[result.severity] : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .sym-chip {
          padding: 9px 16px; border-radius: 24px; border: 1.5px solid #e2d9ce;
          background: white; font-family: 'DM Sans', sans-serif; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all .18s; color: #4a5568;
          -webkit-tap-highlight-color: transparent;
        }
        .sym-chip:hover  { border-color: #1a5c45; color: #1a5c45; background: #e8f5f0; }
        .sym-chip.active { border-color: #1a5c45; background: #1a5c45; color: white; font-weight: 600; }
        .sym-chip:active { transform: scale(.96); }

        .check-btn {
          background: #1a5c45; color: white; border: none; padding: 15px 32px;
          border-radius: 12px; font-size: 16px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          box-shadow: 0 8px 24px rgba(26,92,69,.28); transition: background .2s, transform .1s;
          -webkit-tap-highlight-color: transparent;
        }
        .check-btn:hover  { background: #155238; }
        .check-btn:active { transform: scale(.97); }
        .check-btn:disabled { opacity: .6; cursor: not-allowed; }

        .result-card { animation: slideIn .4s ease both; }

        .toggle-hindi {
          background: none; border: 1.5px solid #e2d9ce; padding: 6px 14px;
          border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; color: #4a5568; transition: all .2s;
        }
        .toggle-hindi:hover { border-color: #1a5c45; color: #1a5c45; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px; background: none;
          border: none; cursor: pointer; font-size: 14px; font-weight: 500;
          color: #718096; font-family: 'DM Sans', sans-serif; padding: 0;
          margin-bottom: 24px; -webkit-tap-highlight-color: transparent;
        }
        .back-btn:hover { color: #1a5c45; }

        .symptom-input {
          width: 100%; padding: 13px 16px; border: 1.5px solid #e2d9ce; border-radius: 10px;
          font-size: 15px; font-family: 'DM Sans', sans-serif; background: #fdfaf7;
          color: #1a202c; outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .symptom-input:focus { border-color: #1a5c45; box-shadow: 0 0 0 3px rgba(26,92,69,.1); background: white; }
        .symptom-input::placeholder { color: #a0aec0; }

        @media (max-width: 700px) {
          .page-wrap { padding: 20px 16px 40px !important; }
          .chips-grid { gap: 8px !important; }
          .sym-chip   { font-size: 12px !important; padding: 8px 13px !important; }
          .result-inner { padding: 20px !important; }
          .action-row { flex-direction: column !important; gap: 10px !important; }
          .action-row button { width: 100% !important; }
          .vitals-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <nav style={s.topbar}>
        <div style={s.topbarInner}>
          <button className="back-btn" style={{ marginBottom: 0 }} onClick={() => router.push("/dashboard")}>
            ← Dashboard
          </button>
          <div style={s.topLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>
          <div style={s.onlinePill}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#22c55e" : "#f59e0b", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: isOnline ? "#166534" : "#92400e" }}>
              {isOnline ? "AI Mode" : "Offline Mode"}
            </span>
          </div>
        </div>
      </nav>

      <div className="page-wrap" style={s.pageWrap}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.eyebrow}>Powered by AI · Works offline</div>
          <h1 style={s.h1}>Symptom Checker</h1>
          <p style={s.subtitle}>
            Select your symptoms below. {isOnline ? "Our AI will analyze and advise you." : "Using offline rules — no internet needed."}
          </p>
          {!isOnline && (
            <div style={s.offlineNote}>
              📴 You're offline. Basic guidance is still available without internet.
            </div>
          )}
        </div>

        {!result ? (
          <div style={s.inputSection}>

            {/* ─────────────────────────────────────────────────────────────────
                ✅ FEATURE 1: Symptom History panel
                Shows above the chips. Only renders if history exists.
            ───────────────────────────────────────────────────────────────── */}
            {history.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <button className="toggle-hindi" onClick={() => setShowHistory(h => !h)} style={{ marginBottom: 10 }}>
                  {showHistory ? "Hide history" : `📋 Past checks (${history.length})`}
                </button>
                {showHistory && (
                  <div style={{ background: "#fdfaf7", border: "1px solid #e8e0d5", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>Recent checks</div>
                    {history.map(h => (
                      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0ebe3" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#1a202c" }}>
                            {h.symptoms.slice(0, 3).join(", ")}{h.symptoms.length > 3 ? "…" : ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#a0aec0" }}>
                            {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: h.severity === "urgent" ? "#fee2e2" : h.severity === "moderate" ? "#fef3c7" : "#d1fae5",
                          color:      h.severity === "urgent" ? "#dc2626" : h.severity === "moderate" ? "#b45309" : "#1a5c45",
                        }}>
                          {h.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                ✅ FEATURE 2: Vitals self-check guide
                Shows above the chips, below history.
            ───────────────────────────────────────────────────────────────── */}
            <div style={s.section}>
              <button className="toggle-hindi" style={{ marginBottom: 12 }} onClick={() => setShowVitals(v => !v)}>
                {showVitals ? "Hide vitals guide" : "🩺 Self-check vitals (offline)"}
              </button>
              {showVitals && (
                <div className="vitals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                  {VITALS_GUIDE.map(v => (
                    <div key={v.name} style={{ background: "white", border: "1px solid #f0ebe3", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{v.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a202c", marginBottom: 4 }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: "#4a5568", lineHeight: 1.6, marginBottom: 6 }}>{v.steps}</div>
                      <div style={{ fontSize: 11, color: "#1a5c45", fontWeight: 600 }}>✓ Normal: {v.normal}</div>
                      <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>⚠ {v.warning}</div>
                      {language === "hindi" && (
                        <div style={{ fontSize: 11, color: "#718096", marginTop: 6, fontStyle: "italic" }}>{v.hindi}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Symptom chips ── */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Common symptoms <span style={s.sectionSub}>(tap to select)</span></div>
              <div className="chips-grid" style={s.chipsGrid}>
                {COMMON_SYMPTOMS.map(sym => (
                  <button
                    key={sym}
                    className={`sym-chip ${selected.includes(sym.toLowerCase()) ? "active" : ""}`}
                    onClick={() => toggleSymptom(sym)}
                  >
                    {selected.includes(sym.toLowerCase()) ? "✓ " : ""}{sym}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Custom input ── */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Describe other symptoms <span style={s.sectionSub}>(optional)</span></div>
              <input
                className="symptom-input"
                placeholder="e.g. sore throat, back pain, dizziness…"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
              />
            </div>

            {/* ── Selected count ── */}
            {(selected.length > 0 || customInput.trim()) && (
              <div style={s.selectedBadge}>
                {selected.length + (customInput.trim() ? 1 : 0)} symptom(s) selected
              </div>
            )}

            {/* ── Check button ── */}
            <div style={{ textAlign: "center" as const, marginTop: 8 }}>
              <button
                className="check-btn"
                onClick={handleCheck}
                disabled={loading || (selected.length === 0 && !customInput.trim())}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                    Analyzing…
                  </span>
                ) : "🔍 Check Symptoms"}
              </button>
              <p style={s.disclaimer}>
                This is for guidance only — not a medical diagnosis.
              </p>
            </div>
          </div>
        ) : (
          /* ── RESULT ── */
          <div className="result-card">
            {sev && (
              <div style={{ ...s.resultCard, borderTop: `4px solid ${sev.color}`, background: sev.bg }}>
                <div className="result-inner" style={s.resultInner}>

                  {/* Severity header */}
                  <div style={s.severityRow}>
                    <span style={{ fontSize: 36 }}>{sev.emoji}</span>
                    <div>
                      <div style={{ ...s.severityBadge, background: sev.color, color: "white" }}>
                        {sev.icon} {sev.label.toUpperCase()} — {result.severity === "urgent" ? "Seek care immediately" : result.severity === "moderate" ? "Monitor closely" : "Rest & recover"}
                      </div>
                      <div style={s.symptomsLine}>
                        Symptoms: {selected.join(", ")}{customInput ? `, ${customInput}` : ""}
                      </div>
                    </div>
                  </div>

                  <div style={s.divider} />

                  {/* Advice */}
                  <div style={s.adviceBlock}>
                    <div style={s.adviceLabel}>💡 What to do</div>
                    <p style={s.adviceText}>{result.advice}</p>
                  </div>

                  {/* Action */}
                  <div style={{ ...s.adviceBlock, background: result.severity === "urgent" ? "#fee2e2" : "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: `1px solid ${sev.border}` }}>
                    <div style={s.adviceLabel}>
                      {result.severity === "urgent" ? "🚨 Urgent Action" : "🏥 When to see a doctor"}
                    </div>
                    <p style={{ ...s.adviceText, fontWeight: result.severity === "urgent" ? 700 : 500, color: result.severity === "urgent" ? "#dc2626" : "#1a202c" }}>
                      {result.action}
                    </p>
                  </div>

                  {/* Hindi toggle */}
                  {result.hindi && (
                    <div style={s.hindiBlock}>
                      <button className="toggle-hindi" onClick={() => setShowHindi(h => !h)}>
                        {showHindi ? "Hide Hindi" : "हिंदी में देखें"}
                      </button>
                      {showHindi && (
                        <div style={s.hindiText}>{result.hindi}</div>
                      )}
                    </div>
                  )}

                  {/* Source */}
                  <div style={s.sourceNote}>
                    {result.source === "ai" ? "✨ Analysis by AI · " : "📋 Offline rules · "}
                    This is guidance only, not a diagnosis.
                  </div>

                  {/* Emergency numbers */}
                  {result.severity === "urgent" && (
                    <div style={s.emergencyBox}>
                      <div style={s.emergencyTitle}>📞 Emergency Contacts</div>
                      <div style={s.emergencyGrid}>
                        <a href="tel:108" style={s.emergencyBtn}>108 — Ambulance</a>
                        <a href="tel:104" style={s.emergencyBtn}>104 — Health Helpline</a>
                      </div>
                      <div style={s.hospitalNote}>
                        🏥 Nabha Civil Hospital — Serving 173+ villages
                      </div>
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="action-row" style={s.actionRow}>
                    <button style={s.resetBtn} onClick={reset}>← Check Again</button>
                    <button style={s.bookBtn} onClick={() => router.push("/dashboard")}>
                      📋 Book Consultation
                    </button>
                  </div>

                  {/* ─────────────────────────────────────────────────────────
                      ✅ FEATURE 3: Follow-up reminder
                      Shows only for moderate or urgent results, below action row.
                  ───────────────────────────────────────────────────────── */}
                  {(result.severity === "moderate" || result.severity === "urgent") && (
                    <div style={{ marginTop: 12, padding: "12px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #6ee7b7" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a5c45", marginBottom: 8 }}>
                        ⏰ Set a follow-up reminder
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[2, 6, 12].map(h => (
                          <button
                            key={h}
                            style={{ ...s.resetBtn, flex: "none", padding: "7px 14px", fontSize: 12 }}
                            onClick={() => requestReminder(h)}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Info cards ── */}
        {!result && (
          <div style={s.infoCards}>
            {[
              { icon: "📴", title: "Works Offline",  desc: "Basic guidance available even without internet on 2G networks." },
              { icon: "🌐", title: "AI Enhanced",    desc: "When online, AI provides detailed personalized advice." },
              { icon: "🇮🇳", title: "Hindi Support", desc: "All results available in Hindi for easy understanding." },
            ].map(c => (
              <div key={c.title} style={s.infoCard}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                <div style={s.infoCardTitle}>{c.title}</div>
                <div style={s.infoCardDesc}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GREEN = "#1a5c45";
const CREAM = "#f7f3ee";
const SERIF = "'Lora', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";
const CARD  = "#ffffff";

const s: Record<string, React.CSSProperties> = {
  root:    { minHeight: "100vh", background: CREAM, fontFamily: SANS },

  topbar:      { position: "sticky", top: 0, zIndex: 50, background: "rgba(247,243,238,.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(26,92,69,.1)" },
  topbarInner: { maxWidth: 760, margin: "0 auto", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" },
  topLogo:     { display: "flex", alignItems: "center", gap: 8 },
  logoMark:    { width: 28, height: 28, borderRadius: 7, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 },
  logoText:    { fontFamily: SERIF, fontWeight: 700, fontSize: 15, color: GREEN },
  onlinePill:  { display: "flex", alignItems: "center", gap: 6, background: CARD, border: "1px solid #e8e0d5", padding: "5px 12px", borderRadius: 20 },

  pageWrap:  { maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" },

  header:     { marginBottom: 36, textAlign: "center" as const },
  eyebrow:    { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#b45309", marginBottom: 10 },
  h1:         { fontFamily: SERIF, fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "#0f1a10", marginBottom: 10, letterSpacing: "-0.5px" },
  subtitle:   { fontSize: 15, color: "#718096", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" },
  offlineNote:{ display: "inline-block", marginTop: 14, background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 20 },

  inputSection: {},
  section:      { marginBottom: 28 },
  sectionLabel: { fontSize: 14, fontWeight: 700, color: "#1a202c", marginBottom: 14 },
  sectionSub:   { fontWeight: 400, color: "#a0aec0", fontSize: 13 },
  chipsGrid:    { display: "flex", flexWrap: "wrap" as const, gap: 10 },

  selectedBadge: { display: "inline-flex", background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}40`, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20 },
  disclaimer:    { marginTop: 14, fontSize: 12, color: "#a0aec0" },

  resultCard:   { borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.1)" },
  resultInner:  { padding: "28px" },
  severityRow:  { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  severityBadge:{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 24, fontSize: 13, fontWeight: 700, marginBottom: 6 },
  symptomsLine: { fontSize: 12, color: "#718096", marginTop: 4 },
  divider:      { height: 1, background: "rgba(0,0,0,.08)", margin: "18px 0" },
  adviceBlock:  { marginBottom: 16 },
  adviceLabel:  { fontSize: 12, fontWeight: 700, color: "#4a5568", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 },
  adviceText:   { fontSize: 14, color: "#1a202c", lineHeight: 1.75 },

  hindiBlock: { marginBottom: 16 },
  hindiText:  { marginTop: 10, fontSize: 14, color: "#1a202c", lineHeight: 1.8, background: "rgba(255,255,255,.6)", padding: "12px 14px", borderRadius: 10, fontStyle: "italic" },

  sourceNote: { fontSize: 11, color: "#a0aec0", marginBottom: 18 },

  emergencyBox:   { background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px", marginBottom: 18 },
  emergencyTitle: { fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 12 },
  emergencyGrid:  { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" as const },
  emergencyBtn:   { flex: 1, textAlign: "center" as const, padding: "11px", background: "#dc2626", color: "white", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", minWidth: 140 },
  hospitalNote:   { fontSize: 12, color: "#9b1c1c", fontWeight: 500 },

  actionRow: { display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" as const },
  resetBtn:  { flex: 1, padding: "12px", background: "white", border: "1.5px solid #e2d9ce", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, color: "#4a5568" },
  bookBtn:   { flex: 2, padding: "12px", background: GREEN, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 6px 20px rgba(26,92,69,.25)" },

  infoCards:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 40 },
  infoCard:     { background: CARD, borderRadius: 14, padding: "20px 16px", boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #f0ebe3", textAlign: "center" as const },
  infoCardTitle:{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: "#1a202c", marginBottom: 6 },
  infoCardDesc: { fontSize: 12, color: "#718096", lineHeight: 1.65 },
};