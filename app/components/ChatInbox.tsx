"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  consultation_id: string;
  sender_id: string;
  sender_type: "patient" | "doctor";
  content: string | null;
  file_url: string | null;
  file_type: "image" | "pdf" | null;
  file_name: string | null;
  created_at: string;
};

type Consultation = {
  id: string;
  symptoms: string | null;
  status: string;
  patient_id: string;
  doctor_id: string | null;
  created_at: string;
};

type OtherParty = {
  id: string;
  full_name: string;
};

export type ChatInboxProps = {
  currentUserId: string;
  currentUserType: "patient" | "doctor";
  accentColor: string; // green for patient, blue for doctor
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatInbox({ currentUserId, currentUserType, accentColor }: ChatInboxProps) {
  const [consultations, setConsultations]   = useState<Consultation[]>([]);
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [otherParties, setOtherParties]     = useState<Record<string, OtherParty>>({});
  const [text, setText]                     = useState("");
  const [sending, setSending]               = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [unreadCounts, setUnreadCounts]     = useState<Record<string, number>>({});
  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load consultations ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const col = currentUserType === "patient" ? "patient_id" : "doctor_id";
      const { data: cons } = await supabase
        .from("consultations")
        .select("*")
        .eq(col, currentUserId)
        .in("status", ["pending", "active", "completed"])
        .order("created_at", { ascending: false });

      if (!cons?.length) return;
      setConsultations(cons);

      // Fetch other party info
      const ids = cons.map(c => currentUserType === "patient" ? c.doctor_id : c.patient_id).filter(Boolean);
      const table = currentUserType === "patient" ? "doctors" : "patients";
      if (ids.length) {
        const { data: parties } = await supabase
          .from(table).select("id, full_name").in("id", ids);
        if (parties) {
          const map: Record<string, OtherParty> = {};
          parties.forEach(p => { map[p.id] = p; });
          setOtherParties(map);
        }
      }

      // Get unread counts (messages from other side not yet seen)
      const consIds = cons.map(c => c.id);
      const otherType = currentUserType === "patient" ? "doctor" : "patient";
      const { data: msgs } = await supabase
        .from("messages")
        .select("consultation_id, sender_type")
        .in("consultation_id", consIds)
        .eq("sender_type", otherType);

      if (msgs) {
        const counts: Record<string, number> = {};
        msgs.forEach(m => { counts[m.consultation_id] = (counts[m.consultation_id] || 0) + 1; });
        setUnreadCounts(counts);
      }
    };
    load();
  }, [currentUserId, currentUserType]);

  // ── Load messages for selected consultation ─────────────────────────────────
  useEffect(() => {
    if (!selectedConsult) return;
    setLoadingMsgs(true);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("consultation_id", selectedConsult.id)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
      setLoadingMsgs(false);
    };
    fetchMessages();

    // Realtime subscription
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`messages:${selectedConsult.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `consultation_id=eq.${selectedConsult.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [selectedConsult]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send text message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !selectedConsult || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      consultation_id: selectedConsult.id,
      sender_id:       currentUserId,
      sender_type:     currentUserType,
      content:         text.trim(),
      file_url:        null,
      file_type:       null,
      file_name:       null,
    });
    setSending(false);
    if (!error) setText("");
  };

  // ── Upload file ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConsult) return;

    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";
    if (!isImage && !isPdf) { alert("Only images and PDFs are supported."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10MB."); return; }

    setUploading(true);
    const ext      = file.name.split(".").pop();
    const path     = `${selectedConsult.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("message-attachments")
      .upload(path, file);

    if (upErr) { alert("Upload failed: " + upErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(path);

    const { error: msgErr } = await supabase.from("messages").insert({
      consultation_id: selectedConsult.id,
      sender_id:       currentUserId,
      sender_type:     currentUserType,
      content:         null,
      file_url:        urlData.publicUrl,
      file_type:       isImage ? "image" : "pdf",
      file_name:       file.name,
    });

    setUploading(false);
    if (msgErr) alert("Message failed: " + msgErr.message);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const otherPartyId = selectedConsult
    ? (currentUserType === "patient" ? selectedConsult.doctor_id : selectedConsult.patient_id)
    : null;
  const otherParty = otherPartyId ? otherParties[otherPartyId] : null;

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const dateLabel = formatDateHeader(msg.created_at);
    const last = acc[acc.length - 1];
    if (last && last.date === dateLabel) { last.msgs.push(msg); }
    else { acc.push({ date: dateLabel, msgs: [msg] }); }
    return acc;
  }, []);

  return (
    <div style={c.root}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .msg-bubble { animation: fadeUp .2s ease both; }
        .consult-row { transition: background .15s; cursor: pointer; }
        .consult-row:hover { background: ${accentColor}10 !important; }
        .send-btn { transition: background .15s, transform .1s; }
        .send-btn:hover  { filter: brightness(1.1); }
        .send-btn:active { transform: scale(.95); }
        .attach-btn { transition: background .15s; }
        .attach-btn:hover { background: #f0f0f0 !important; }
        .msg-input:focus { outline: none; border-color: ${accentColor} !important; box-shadow: 0 0 0 3px ${accentColor}18 !important; }
        .img-msg { transition: transform .2s; cursor: pointer; }
        .img-msg:hover { transform: scale(1.02); }
        @media (max-width: 700px) {
          .chat-panel { display: ${selectedConsult ? "flex" : "none"} !important; }
          .inbox-list { display: ${selectedConsult ? "none" : "flex"} !important; width: 100% !important; }
        }
      `}</style>

      {/* ── Left: Consultation list ── */}
      <div className="inbox-list" style={c.inboxList}>
        <div style={c.inboxHeader}>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: "#1a202c" }}>💬 Inbox</div>
          <div style={{ fontSize: 12, color: "#a0aec0" }}>{consultations.length} conversation{consultations.length !== 1 ? "s" : ""}</div>
        </div>

        {consultations.length === 0 ? (
          <div style={c.emptyInbox}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 14, color: "#a0aec0", textAlign: "center" as const }}>
              {currentUserType === "patient"
                ? "No active consultations yet"
                : "No patient consultations yet"}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" as const }}>
            {consultations.map(con => {
              const otherId = currentUserType === "patient" ? con.doctor_id : con.patient_id;
              const other   = otherId ? otherParties[otherId] : null;
              const isSelected = selectedConsult?.id === con.id;
              const unread  = unreadCounts[con.id] || 0;
              return (
                <div
                  key={con.id}
                  className="consult-row"
                  style={{
                    ...c.consultRow,
                    background: isSelected ? `${accentColor}12` : "transparent",
                    borderLeft: isSelected ? `3px solid ${accentColor}` : "3px solid transparent",
                  }}
                  onClick={() => setSelectedConsult(con)}
                >
                  <div style={{ ...c.consultAvatar, background: accentColor }}>
                    {other?.full_name?.charAt(0).toUpperCase() ?? (currentUserType === "patient" ? "D" : "P")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={c.consultRowName}>
                      {other?.full_name ?? (currentUserType === "patient" ? "Assigned Doctor" : "Patient")}
                    </div>
                    <div style={c.consultRowSub} title={con.symptoms ?? ""}>
                      {con.symptoms?.slice(0, 32) ?? "General consultation"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                      background: con.status === "active" ? "#d1fae5" : con.status === "pending" ? "#fef3c7" : "#e2e8f0",
                      color: con.status === "active" ? "#065f46" : con.status === "pending" ? "#92400e" : "#64748b",
                    }}>{con.status}</span>
                    {unread > 0 && (
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: accentColor, color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: Chat panel ── */}
      <div className="chat-panel" style={c.chatPanel}>
        {!selectedConsult ? (
          <div style={c.noChatSelected}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: "#1a202c", marginBottom: 6 }}>
              Select a conversation
            </div>
            <div style={{ fontSize: 13, color: "#a0aec0" }}>Choose a consultation from the left to start messaging</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ ...c.chatHeader, borderBottom: `2px solid ${accentColor}20` }}>
              <button
                className="back-btn"
                style={c.backBtn}
                onClick={() => setSelectedConsult(null)}
              >←</button>
              <div style={{ ...c.chatHeaderAvatar, background: accentColor }}>
                {otherParty?.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={c.chatHeaderName}>
                  {otherParty?.full_name ?? (currentUserType === "patient" ? "Your Doctor" : "Patient")}
                </div>
                <div style={c.chatHeaderSub}>
                  {selectedConsult.symptoms?.slice(0, 40) ?? "General consultation"} ·{" "}
                  <span style={{ color: selectedConsult.status === "active" ? "#22c55e" : "#a0aec0", fontWeight: 600 }}>
                    {selectedConsult.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={c.messagesArea}>
              {loadingMsgs ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${accentColor}30`, borderTop: `2px solid ${accentColor}`, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={c.noMessages}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                  <div style={{ fontSize: 13, color: "#a0aec0", textAlign: "center" as const }}>
                    No messages yet. Say hello!
                  </div>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    {/* Date divider */}
                    <div style={c.dateDivider}>
                      <div style={c.dateDividerLine} />
                      <span style={c.dateDividerLabel}>{group.date}</span>
                      <div style={c.dateDividerLine} />
                    </div>

                    {group.msgs.map(msg => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <div key={msg.id} className="msg-bubble" style={{
                          display: "flex",
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          marginBottom: 8,
                          padding: "0 16px",
                        }}>
                          {!isMine && (
                            <div style={{ ...c.msgAvatar, background: accentColor, marginRight: 8 }}>
                              {otherParty?.full_name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column" as const, alignItems: isMine ? "flex-end" : "flex-start" }}>
                            {/* Text message */}
                            {msg.content && (
                              <div style={{
                                background: isMine ? accentColor : "#f1f5f9",
                                color: isMine ? "white" : "#1a202c",
                                padding: "10px 14px",
                                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                fontSize: 14,
                                lineHeight: 1.55,
                                fontFamily: SANS,
                                wordBreak: "break-word" as const,
                                boxShadow: isMine ? `0 4px 12px ${accentColor}35` : "0 2px 8px rgba(0,0,0,.06)",
                              }}>
                                {msg.content}
                              </div>
                            )}

                            {/* Image message */}
                            {msg.file_type === "image" && msg.file_url && (
                              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.12)", maxWidth: 260 }}>
                                <img
                                  className="img-msg"
                                  src={msg.file_url}
                                  alt="Image"
                                  style={{ width: "100%", display: "block", maxHeight: 300, objectFit: "cover" as const }}
                                  onClick={() => window.open(msg.file_url!, "_blank")}
                                />
                              </div>
                            )}

                            {/* PDF message */}
                            {msg.file_type === "pdf" && msg.file_url && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  background: isMine ? accentColor : "#f1f5f9",
                                  color: isMine ? "white" : "#1a202c",
                                  padding: "10px 14px", borderRadius: 12,
                                  textDecoration: "none", fontSize: 13,
                                  fontFamily: SANS, fontWeight: 600,
                                  boxShadow: isMine ? `0 4px 12px ${accentColor}35` : "0 2px 8px rgba(0,0,0,.06)",
                                  maxWidth: 240,
                                }}
                              >
                                <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 1 }}>PDF Document</div>
                                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                    {msg.file_name ?? "Document"}
                                  </div>
                                </div>
                                <span style={{ fontSize: 14, opacity: 0.7, flexShrink: 0 }}>↗</span>
                              </a>
                            )}

                            <div style={c.msgTime}>{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={c.inputBar}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                className="attach-btn"
                style={c.attachBtn}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Attach image or PDF"
              >
                {uploading ? (
                  <span style={{ width: 16, height: 16, border: "2px solid #ccc", borderTop: `2px solid ${accentColor}`, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                ) : "📎"}
              </button>

              <input
                className="msg-input"
                style={c.msgInput}
                placeholder="Type a message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />

              <button
                className="send-btn"
                style={{ ...c.sendBtn, background: accentColor, opacity: (!text.trim() || sending) ? 0.5 : 1 }}
                onClick={handleSend}
                disabled={!text.trim() || sending}
              >
                {sending ? "…" : "↑"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const c: Record<string, React.CSSProperties> = {
  root:         { display: "flex", height: "calc(100vh - 120px)", minHeight: 500, background: "#ffffff", borderRadius: 18, overflow: "hidden", border: "1px solid #e8f0fb", boxShadow: "0 4px 24px rgba(0,0,0,.06)" },

  // Left panel
  inboxList:    { width: 300, flexShrink: 0, borderRight: "1px solid #f0f4f8", display: "flex", flexDirection: "column" as const, background: "#fafbfd" },
  inboxHeader:  { padding: "18px 16px 14px", borderBottom: "1px solid #f0f4f8", display: "flex", justifyContent: "space-between", alignItems: "center" },
  consultRow:   { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" },
  consultAvatar:{ width: 38, height: 38, borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  consultRowName:{ fontSize: 13, fontWeight: 600, color: "#1a202c", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  consultRowSub: { fontSize: 11, color: "#a0aec0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  emptyInbox:   { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: 24 },

  // Right panel
  chatPanel:    { flex: 1, display: "flex", flexDirection: "column" as const, minWidth: 0 },
  noChatSelected:{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: 32 },

  chatHeader:       { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "white" },
  backBtn:          { display: "none", background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#4a5568", padding: "4px 8px" },
  chatHeaderAvatar: { width: 38, height: 38, borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  chatHeaderName:   { fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#1a202c" },
  chatHeaderSub:    { fontSize: 11, color: "#a0aec0", marginTop: 1 },

  messagesArea: { flex: 1, overflowY: "auto" as const, padding: "16px 0", background: "#f8fafc" },
  noMessages:   { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100%", padding: 32 },

  dateDivider:      { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px" },
  dateDividerLine:  { flex: 1, height: 1, background: "#e2e8f0" },
  dateDividerLabel: { fontSize: 11, color: "#a0aec0", fontWeight: 600, whiteSpace: "nowrap" as const },

  msgAvatar:    { width: 28, height: 28, borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0, alignSelf: "flex-end" },
  msgTime:      { fontSize: 10, color: "#a0aec0", marginTop: 4, padding: "0 2px" },

  inputBar:     { display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid #f0f4f8", background: "white" },
  attachBtn:    { width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  msgInput:     { flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontFamily: SANS, color: "#1a202c", background: "#f8fafc", outline: "none" },
  sendBtn:      { width: 38, height: 38, borderRadius: 12, border: "none", color: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};