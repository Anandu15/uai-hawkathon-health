"use client";

import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
  fileName?: string;
  isAnalysis?: boolean;
};

function downloadPDF(text: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (h: number) => {
    if (y + h > pageHeight - margin) { doc.addPage(); y = margin; drawHeader(); }
  };

  const drawHeader = () => {
    doc.setFillColor(0, 180, 130);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("MediScan AI - Health Report", margin, 14);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), pageWidth - margin, 14, { align: "right" });
    y = 30;
  };

  drawHeader();
  doc.setDrawColor(0, 180, 130); doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y); y += 6;

  for (const line of text.split("\n")) {
    const clean = line.replace(/📋|🔬|✅|⚠️|💡|🌟|🔴|💚|🟡|🟠|💙|🥗|🏃|💧|🧘|🏥|📎|🎵|👋/g, "").replace(/\*\*/g, "").trim();
    if (!clean) { y += 4; continue; }

    if (line.match(/^[📋🔬✅⚠️💡🌟]/)) {
      addPageIfNeeded(12);
      doc.setFillColor(0, 180, 130); doc.rect(margin, y - 4, maxWidth, 10, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(clean, margin + 3, y + 3); y += 12;
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      addPageIfNeeded(8);
      doc.setTextColor(60, 60, 60); doc.setFontSize(10); doc.setFont("helvetica", "normal");
      for (const w of doc.splitTextToSize("•  " + clean.replace(/^[-•]\s*/, ""), maxWidth - 6)) {
        addPageIfNeeded(6); doc.text(w, margin + 4, y); y += 6;
      }
    } else {
      addPageIfNeeded(6); doc.setFontSize(10);
      doc.setFont("helvetica", clean.includes("NORMAL") || clean.includes("HIGH") ? "bold" : "normal");
      doc.setTextColor(clean.includes("NORMAL") ? 0 : 60, clean.includes("NORMAL") ? 150 : 60, clean.includes("NORMAL") ? 100 : 60);
      for (const w of doc.splitTextToSize(clean, maxWidth)) { addPageIfNeeded(6); doc.text(w, margin, y); y += 6; }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245); doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
    doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "italic");
    doc.text("AI-generated report. Not a substitute for professional medical advice.", margin, pageHeight - 6);
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }
  doc.save(`MediScan_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function formatBotText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h2 key={i} style={s.h2}>{line.slice(2)}</h2>;
    if (line.startsWith("## ")) return <h3 key={i} style={s.h3}>{line.slice(3)}</h3>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} style={s.li}>{line.slice(2)}</li>;
    if (line.match(/^[📋🔬✅⚠️💡🌟]/)) return <p key={i} style={s.section}>{line}</p>;
    if (line.startsWith("**") && line.endsWith("**")) return <strong key={i} style={s.bold}>{line.slice(2, -2)}</strong>;
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} style={s.para}>{line}</p>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 0, sender: "bot",
    text: "👋 Hi! I'm MediScan AI.\n\n📎 Upload a report · 🎤 Use voice · 💬 Type symptoms",
  }]);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, open]);

  const handleAudioUpload = async (audioFile: File) => {
    setIsTranscribing(true);
    setMessages(p => [...p, { id: Date.now(), sender: "bot", text: `🎵 Transcribing **${audioFile.name}**...` }]);
    try {
      const fd = new FormData(); fd.append("audio", audioFile);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) {
        setInput(data.text);
        setMessages(p => [...p, { id: Date.now(), sender: "bot", text: `✅ Heard: "${data.text}"\n\nHit Send ➤ to analyze!` }]);
      }
    } catch {
      setMessages(p => [...p, { id: Date.now(), sender: "bot", text: "❌ Transcription failed." }]);
    } finally { setIsTranscribing(false); }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR(); r.lang = "en-IN"; r.continuous = false; r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r; r.start();
  };

  const handleNewChat = () => {
    setMessages([{ id: Date.now(), sender: "bot", text: "👋 New chat started!" }]);
    setHistory([]); setInput(""); setFile(null);
  };

  const handleSend = async () => {
    if (!input.trim() && !file) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    const userMsg: Message = { id: Date.now(), sender: "user", text: input || "Please analyze this report.", fileName: file?.name };
    setMessages(p => [...p, userMsg]); setInput(""); setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("message", input || "Please analyze this medical report.");
      fd.append("history", JSON.stringify(history));
      if (file) fd.append("file", file);
      const res = await fetch("/api/medical", { method: "POST", body: fd });
      const data = await res.json();
      const reply = data.reply;
      setHistory(p => [...p, { role: "user", content: input }, { role: "assistant", content: reply }]);
      setMessages(p => [...p, { id: Date.now() + 1, sender: "bot", text: reply, isAnalysis: reply.includes("📋") || reply.includes("🔬") }]);
    } catch {
      setMessages(p => [...p, { id: Date.now() + 1, sender: "bot", text: "Something went wrong. Please try again." }]);
    } finally { setIsLoading(false); setFile(null); }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={s.chatWindow}>
          <div style={s.chatHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={s.chatLogo}>🩺</div>
              <div>
                <div style={s.chatTitle}>MediScan AI</div>
                <div style={s.chatOnline}>● Online</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={s.headerBtn} onClick={handleNewChat}>↺</button>
              <button style={s.headerBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div style={s.messages}>
            {messages.map(msg => (
              <div key={msg.id} style={{ ...s.msgRow, justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                {msg.sender === "bot" && <div style={s.avatar}>🩺</div>}
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ ...s.bubble, ...(msg.sender === "user" ? s.userBubble : s.botBubble) }}>
                    {msg.fileName && <div style={s.fileTag}>📎 {msg.fileName}</div>}
                    {msg.sender === "bot" ? formatBotText(msg.text) : <p style={{ margin: 0 }}>{msg.text}</p>}
                  </div>
                  {msg.isAnalysis && (
                    <button style={s.dlBtn} onClick={() => downloadPDF(msg.text)}>📄 Download PDF</button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <div style={s.avatar}>🩺</div>
                <div style={{ ...s.bubble, ...s.botBubble }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <div style={{ ...s.dot, animationDelay: "0s" }} />
                    <div style={{ ...s.dot, animationDelay: "0.2s" }} />
                    <div style={{ ...s.dot, animationDelay: "0.4s" }} />
                    <span style={{ color: "#00e5a0", fontSize: "12px", marginLeft: "4px" }}>Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {file && (
            <div style={s.statusBar}>
              <span style={{ color: "#00e5a0" }}>📎 {file.name}</span>
              <button style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer" }} onClick={() => setFile(null)}>✕</button>
            </div>
          )}
          {isListening && (
            <div style={{ ...s.statusBar, borderColor: "rgba(255,50,50,0.3)" }}>
              <div style={{ ...s.statusDot, background: "#ff4444" }} />
              <span style={{ color: "#ff8888", fontSize: "12px" }}>Listening... click mic to stop</span>
            </div>
          )}
          {isTranscribing && (
            <div style={{ ...s.statusBar, borderColor: "rgba(150,100,255,0.3)" }}>
              <div style={{ ...s.statusDot, background: "#a070ff" }} />
              <span style={{ color: "#c0a0ff", fontSize: "12px" }}>Transcribing with Whisper...</span>
            </div>
          )}

          <div
            style={{ ...s.dropZone, ...(dragOver ? s.dropActive : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
              {dragOver ? "Drop here! 🎯" : "📂 Upload report (image / PDF)"}
            </span>
          </div>

          <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); e.target.value = ""; }} />

          <div style={s.inputRow}>
            {voiceSupported && (
              <button style={{ ...s.iconBtn, ...(isListening ? { background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.5)" } : {}) }} onClick={toggleVoice}>
                {isListening ? "🔴" : "🎤"}
              </button>
            )}
            <button style={{ ...s.iconBtn, ...(isTranscribing ? { background: "rgba(150,100,255,0.2)" } : {}) }}
              onClick={() => audioRef.current?.click()} disabled={isTranscribing}>
              {isTranscribing ? "⏳" : "🎵"}
            </button>
            <input
              style={s.textInput} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask or describe symptoms..."}
            />
            <button style={s.sendBtn} onClick={handleSend} disabled={isLoading}>➤</button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button style={s.fab} onClick={() => setOpen(o => !o)}>
        <span style={{ position: "relative", zIndex: 1 }}>{open ? "✕" : "🩺"}</span>
        {!open && <span style={s.fabPulse} />}
      </button>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0;transform:scale(2)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  chatWindow: { position: "fixed", bottom: "90px", left: "24px", width: "380px", height: "600px", background: "#0f1623", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.08)", zIndex: 9999, animation: "fadeUp 0.3s ease", overflow: "hidden" },
  chatHeader: { padding: "14px 16px", background: "linear-gradient(135deg, rgba(0,200,150,0.25), rgba(0,120,255,0.25))", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  chatLogo: { fontSize: "22px", width: "36px", height: "36px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  chatTitle: { color: "white", fontWeight: "700", fontSize: "14px" },
  chatOnline: { color: "#00e5a0", fontSize: "11px" },
  headerBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  messages: { flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" },
  msgRow: { display: "flex", alignItems: "flex-start", gap: "8px" },
  avatar: { fontSize: "16px", width: "30px", height: "30px", background: "rgba(0,229,160,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(0,229,160,0.2)" },
  bubble: { maxWidth: "100%", padding: "10px 12px", borderRadius: "14px", fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word" },
  userBubble: { background: "linear-gradient(135deg, #00c896, #0078ff)", color: "white", borderBottomRightRadius: "4px" },
  botBubble: { background: "rgba(255,255,255,0.05)", color: "#d0d8e8", borderBottomLeftRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" },
  fileTag: { fontSize: "11px", background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "6px", marginBottom: "6px", display: "inline-block" },
  dlBtn: { marginTop: "6px", padding: "6px 12px", background: "linear-gradient(135deg, #00c896, #0078ff)", border: "none", borderRadius: "14px", color: "white", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  dot: { width: "7px", height: "7px", borderRadius: "50%", background: "#00e5a0", animation: "bounce 1.2s infinite" },
  statusBar: { margin: "0 12px", padding: "6px 10px", background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%", animation: "pulse 1s infinite", flexShrink: 0 },
  dropZone: { margin: "8px 12px", padding: "8px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", textAlign: "center" },
  dropActive: { borderColor: "#00e5a0", background: "rgba(0,229,160,0.05)" },
  inputRow: { display: "flex", padding: "10px 12px", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", alignItems: "center" },
  iconBtn: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  textInput: { flex: 1, padding: "9px 14px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "13px", outline: "none" },
  sendBtn: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #00c896, #0078ff)", border: "none", color: "white", fontSize: "14px", cursor: "pointer", flexShrink: 0 },
  h2: { color: "#00e5a0", fontSize: "14px", fontWeight: "700", margin: "6px 0 3px" },
  h3: { color: "#7dd3fc", fontSize: "13px", fontWeight: "600", margin: "5px 0 3px" },
  section: { color: "#a5f3d0", fontWeight: "600", margin: "6px 0 3px", fontSize: "13px" },
  para: { margin: "2px 0", color: "#d0d8e8", fontSize: "13px" },
  li: { margin: "2px 0 2px 14px", color: "#d0d8e8", fontSize: "13px" },
  bold: { color: "white", fontWeight: "700" },
  fab: { position: "fixed", bottom: "24px", left: "24px", width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #00c896, #0078ff)", border: "none", fontSize: "26px", cursor: "pointer", boxShadow: "0 8px 30px rgba(0,200,150,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
  fabPulse: { position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,229,160,0.4)", animation: "pulse 2s infinite", pointerEvents: "none" },
};