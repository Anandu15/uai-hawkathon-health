"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Patient = {
  id: string; full_name: string; age: number | null;
  gender: string | null; phone: string; village: string | null;
  district: string | null; language: string;
};
type Consultation = {
  id: string; symptoms: string | null; status: string; mode: string;
  created_at: string; prescription: string | null; notes: string | null;
};
type MedicalRecord = {
  id: string; record_type: string; content: string | null; created_at: string;
};

const statusColor: Record<string, string> = { pending: "#b45309", active: "#1a5c45", completed: "#1e40af", cancelled: "#dc2626" };
const statusBg:    Record<string, string> = { pending: "#fef3c7", active: "#d1fae5", completed: "#dbeafe",  cancelled: "#fee2e2"  };
const recordIcon:  Record<string, string> = { blood_test: "🩸", prescription: "💊", scan: "🔬", note: "📝" };


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Shared constants (needed by both modal and dashboard styles) ─────────────
const GREEN = "#1a5c45";
const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";
const CREAM = "#f7f3ee";
const CARD  = "#ffffff";

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (updated: Patient) => void;
}) {
  const [form, setForm]     = useState({ ...patient });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (field: keyof Patient, value: string | number | null) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    if (!form.phone.trim())     { setError("Phone is required."); return; }
    setSaving(true);
    setError(null);

    const { error: supaErr } = await supabase
      .from("patients")
      .update({
        full_name: form.full_name.trim(),
        age:       form.age ? Number(form.age) : null,
        gender:    form.gender || null,
        phone:     form.phone.trim(),
        village:   form.village?.trim() || null,
        district:  form.district?.trim() || null,
        language:  form.language || "english",
      })
      .eq("id", patient.id);

    setSaving(false);
    if (supaErr) { setError("Failed to save. Please try again."); return; }
    onSave(form);
  };

  // Close on backdrop click
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={m.backdrop} onClick={onBackdrop}>
      <div style={m.modal}>
        {/* Header */}
        <div style={m.header}>
          <div style={m.headerTitle}>Edit Profile</div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Fields */}
        <div style={m.body}>
          {error && <div style={m.errorBanner}>{error}</div>}

          <div style={m.row}>
            <label style={m.label}>Full Name *</label>
            <input
              style={m.input}
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="edit-two-col" style={m.twoCol}>
            <div style={m.row}>
              <label style={m.label}>Age</label>
              <input
                style={m.input}
                type="number"
                min={0}
                max={120}
                value={form.age ?? ""}
                onChange={e => set("age", e.target.value ? Number(e.target.value) : null)}
                placeholder="Age"
              />
            </div>
            <div style={m.row}>
              <label style={m.label}>Gender</label>
              <select style={m.input} value={form.gender ?? ""} onChange={e => set("gender", e.target.value || null)}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={m.row}>
            <label style={m.label}>Phone *</label>
            <input
              style={m.input}
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className="edit-two-col" style={m.twoCol}>
            <div style={m.row}>
              <label style={m.label}>Village</label>
              <input
                style={m.input}
                value={form.village ?? ""}
                onChange={e => set("village", e.target.value || null)}
                placeholder="Village"
              />
            </div>
            <div style={m.row}>
              <label style={m.label}>District</label>
              <input
                style={m.input}
                value={form.district ?? ""}
                onChange={e => set("district", e.target.value || null)}
                placeholder="District"
              />
            </div>
          </div>

          <div style={m.row}>
            <label style={m.label}>Preferred Language</label>
            <select style={m.input} value={form.language} onChange={e => set("language", e.target.value)}>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="punjabi">Punjabi</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={{ ...m.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={m.spinner} /> Saving…
              </span>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m: Record<string, React.CSSProperties> = {
  backdrop:    { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modal:       { background: "white", borderRadius: 18, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.2)" },
  header:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #f0ebe3" },
  headerTitle: { fontSize: 17, fontWeight: 700, color: "#0f1a10", fontFamily: SERIF },
  closeBtn:    { width: 30, height: 30, borderRadius: 8, border: "1px solid #e2d9ce", background: "transparent", cursor: "pointer", fontSize: 13, color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" },
  body:        { padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  footer:      { padding: "16px 24px", borderTop: "1px solid #f0ebe3", display: "flex", gap: 10, justifyContent: "flex-end" },
  row:         { display: "flex", flexDirection: "column", gap: 6 },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  label:       { fontSize: 11, fontWeight: 700, color: "#a0aec0", textTransform: "uppercase" as const, letterSpacing: "0.5px", fontFamily: SANS },
  input:       { padding: "10px 13px", border: "1.5px solid #e2d9ce", borderRadius: 9, fontSize: 14, fontFamily: SANS, color: "#1a202c", background: "#fdfaf7", outline: "none", width: "100%" },
  errorBanner: { background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 8 },
  cancelBtn:   { padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2d9ce", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, color: "#4a5568" },
  saveBtn:     { padding: "10px 24px", borderRadius: 9, border: "none", background: GREEN, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 14px rgba(26,92,69,.25)", display: "flex", alignItems: "center" },
  spinner:     { width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [patient, setPatient]             = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [records, setRecords]             = useState<MedicalRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<"overview" | "consultations" | "records">("overview");
  const [isOnline, setIsOnline]           = useState(true);
  const [greeting, setGreeting]           = useState("Good day");
  const [sideOpen, setSideOpen]           = useState(false);
  // ✅ Controls the edit modal
  const [editOpen, setEditOpen]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);


  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }
      const uid = session.user.id;
      const { data: pat }  = await supabase.from("patients").select("*").eq("id", uid).single();
      const { data: cons } = await supabase.from("consultations").select("*").eq("patient_id", uid).order("created_at", { ascending: false }).limit(10);
      const { data: recs } = await supabase.from("medical_records").select("*").eq("patient_id", uid).order("created_at", { ascending: false }).limit(10);
      if (pat)  setPatient(pat);
      if (cons) setConsultations(cons);
      if (recs) setRecords(recs);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const handleBook = async () => {
    if (!patient) return;
    const { error } = await supabase.from("consultations").insert({ patient_id: patient.id, symptoms: "To be filled", status: "pending", mode: "chat" });
    if (!error) {
      const { data } = await supabase.from("consultations").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(10);
      if (data) setConsultations(data);
      setActiveTab("consultations");
    }
  };

  // ✅ Called by modal after successful Supabase update — updates UI instantly, no refetch needed
const handleDeleteAccount = async () => {
  if (!patient) return;
  setLoading(true);

  const res = await fetch("/api/delete-account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: patient.id }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error ?? "Failed to delete account");
    setLoading(false);
    return;
  }

  // Auth user is gone — sign out locally and redirect
  await supabase.auth.signOut();
  router.replace("/auth");
};
  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
      <p style={s.loaderText}>Loading your health dashboard…</p>
    </div>
  );

  const firstName    = patient?.full_name?.split(" ")[0] ?? "there";
  const pendingCount   = consultations.filter(c => c.status === "pending").length;
  const completedCount = consultations.filter(c => c.status === "completed").length;

  const tabs = [
    { id: "overview",      icon: "🏠", label: "Home"     },
    { id: "consultations", icon: "🩺", label: "Consults" },
    { id: "records",       icon: "📁", label: "Records"  },
  ] as const;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes slideIn{ from{transform:translateX(-100%)} to{transform:translateX(0)} }

        .dash-card  { animation: fadeUp .4s ease both; }
        .row-item   { transition: background .15s; }
        .row-item:hover { background: #f7f3ee !important; }
        .tab-btn    { -webkit-tap-highlight-color: transparent; transition: background .15s; }
        .tab-btn:hover { background: rgba(26,92,69,.06) !important; }
        .action-btn { transition: transform .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent; }
        .action-btn:hover  { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(26,92,69,.22) !important; }
        .action-btn:active { transform: scale(.97); }
        .sign-out   { transition: background .2s, color .2s; }
        .sign-out:hover { background: #fee2e2 !important; color: #dc2626 !important; }

        /* Modal input focus ring */
        input:focus, select:focus { border-color: #1a5c45 !important; box-shadow: 0 0 0 3px rgba(26,92,69,.1) !important; background: white !important; }

        .dash-sidebar { display: flex; }
        .dash-main    { margin-left: 240px; }
        .bottom-nav   { display: none; }
        .mob-topbar   { display: none; }

        @media (max-width: 700px) {
          .dash-sidebar { display: none !important; }
          .mob-topbar {
            display: flex !important; position: fixed; top: 0; left: 0; right: 0; z-index: 60;
            height: 56px; background: white; border-bottom: 1px solid #e8e0d5;
            align-items: center; justify-content: space-between; padding: 0 18px;
          }
          .dash-main { margin-left: 0 !important; padding: 72px 16px 84px !important; }
          .bottom-nav {
            display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
            background: white; border-top: 1px solid #e8e0d5;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .bottom-nav button {
            flex: 1; padding: 10px 4px 8px; background: none; border: none; cursor: pointer;
            display: flex; flex-direction: column; align-items: center; gap: 3px;
            -webkit-tap-highlight-color: transparent;
          }
          .bottom-nav .bnav-icon  { font-size: 22px; }
          .bottom-nav .bnav-label { font-size: 10px; font-weight: 600; font-family: 'DM Sans', sans-serif; }
          .stats-row     { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .overview-grid { grid-template-columns: 1fr !important; }
          .actions-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .records-grid  { grid-template-columns: 1fr !important; }
          .page-header   { flex-direction: column !important; gap: 14px !important; align-items: flex-start !important; }
          .page-header .book-btn { width: 100% !important; text-align: center; }
          .consult-right { flex-wrap: wrap !important; justify-content: flex-end; }
          .tab-content   { padding: 0 !important; }
          /* Modal goes full-screen on mobile */
          .edit-two-col  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── offline banner ── */}
      {!isOnline && (
        <div style={s.offlineBanner}>
          📴 Offline — showing cached data. Actions will sync when reconnected.
        </div>
      )}
{/* ✅ Delete Account Modal */}
{deleteConfirm && patient && (
  <div style={m.backdrop} onClick={() => setDeleteConfirm(false)}>
    <div
      style={{ ...m.modal, maxWidth: 380 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={m.header}>
        <div style={{ ...m.headerTitle, color: "#dc2626" }}>
          ⚠️ Delete Account
        </div>
        <button
          style={m.closeBtn}
          onClick={() => setDeleteConfirm(false)}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          padding: "20px 24px",
          fontSize: 14,
          color: "#4a5568",
          lineHeight: 1.6,
        }}
      >
        This will permanently delete your account and all your data.
        This action cannot be undone.
      </div>

      <div style={m.footer}>
        <button
          style={m.cancelBtn}
          onClick={() => setDeleteConfirm(false)}
        >
          Cancel
        </button>

        <button
          style={{
            ...m.saveBtn,
            background: "#dc2626",
            boxShadow: "0 4px 14px rgba(220,38,38,.25)",
          }}
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? "Deleting…" : "Yes, Delete Everything"}
        </button>
      </div>
    </div>
  </div>
)}
      {/* ══════════════ DESKTOP SIDEBAR ══════════════ */}
      <aside className="dash-sidebar" style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.sideLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>
          <nav style={s.sideNav}>
            {tabs.map(item => (
              <button key={item.id} className="tab-btn" style={{
                ...s.sideNavBtn,
                background: activeTab === item.id ? "rgba(26,92,69,.1)" : "transparent",
                color:      activeTab === item.id ? GREEN : "#4a5568",
                fontWeight: activeTab === item.id ? 700 : 500,
                borderLeft: activeTab === item.id ? `3px solid ${GREEN}` : "3px solid transparent",
              }} onClick={() => setActiveTab(item.id)}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label === "Home" ? "Overview" : item.label === "Consults" ? "Consultations" : "Records"}
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideProfile}>
          <div style={s.sideAvatar}>{patient?.full_name?.charAt(0).toUpperCase() ?? "?"}</div>
          <div style={s.sideProfileInfo}>
            <div style={s.sideProfileName}>{patient?.full_name ?? "—"}</div>
            <div style={s.sideProfileSub}>{patient?.village ?? "Patient"}</div>
          </div>
          <button className="sign-out" style={s.signOutBtn} onClick={handleSignOut} title="Sign out">↩</button>
          <button
  className="sign-out"
  style={{ ...s.signOutBtn, borderColor: "#fca5a5", color: "#dc2626" }}
  onClick={() => setDeleteConfirm(true)}
  title="Delete account"
>🗑</button>
        </div>
      </aside>

      {/* ══════════════ MOBILE TOP BAR ══════════════ */}
      <div className="mob-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={s.logoMark}>✚</div>
          <span style={s.logoText}>CareConnect</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>{isOnline ? "Online" : "Offline"}</span>
          </div>
          <div style={{ ...s.sideAvatar, width: 32, height: 32, fontSize: 13, cursor: "pointer" }} onClick={handleSignOut}>
            {patient?.full_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        </div>
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main className="dash-main" style={s.main}>
        <div className="tab-content" style={s.tabContent}>

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === "overview" && (
            <>
              <div className="page-header" style={s.pageHeader}>
                <div>
                  <div style={s.greetingTag}>
                    <span style={{ ...s.onlineDot, background: isOnline ? "#22c55e" : "#ef4444", animation: isOnline ? "pulse 2s infinite" : "none" }} />
                    {isOnline ? "Connected" : "Offline mode"}
                  </div>
                  <h1 style={s.pageH1}>{greeting}, {firstName} 👋</h1>
                  <p style={s.pageSubtitle}>Here's your health summary</p>
                </div>
                <button className="action-btn book-btn" style={s.bookBtn} onClick={handleBook}>
                  + Book Consultation
                </button>
              </div>

              {/* Stats */}
              <div className="stats-row dash-card" style={s.statsRow}>
                {[
                  { icon: "🩺", val: consultations.length, label: "Total",   color: GREEN     },
                  { icon: "⏳", val: pendingCount,          label: "Pending", color: "#b45309" },
                  { icon: "✅", val: completedCount,        label: "Done",    color: "#1e40af" },
                  { icon: "📁", val: records.length,        label: "Records", color: "#7c3aed" },
                ].map((st, i) => (
                  <div key={st.label} className="dash-card" style={{ ...s.statCard, animationDelay: `${i*80}ms` }}>
                    <div style={{ ...s.statIcon, background: st.color + "15" }}>{st.icon}</div>
                    <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                    <div style={s.statLabel}>{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Profile + Recent */}
              <div className="overview-grid" style={s.overviewGrid}>
                <div className="dash-card" style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.cardTitle}>👤 Your Profile</div>
                    {/* ✅ This is the only change to the existing JSX — onClick opens modal */}
                    <button style={s.editBtn} onClick={() => setEditOpen(true)}>Edit</button>
                  </div>
                  {[
                    ["Full Name", patient?.full_name],
                    ["Age",       patient?.age ? `${patient.age} yrs` : null],
                    ["Gender",    patient?.gender],
                    ["Phone",     patient?.phone],
                    ["Village",   patient?.village],
                    ["District",  patient?.district],
                    ["Language",  patient?.language],
                  ].map(([label, val]) => (
                    <div key={label as string} style={s.profileRow}>
                      <span style={s.profileLabel}>{label}</span>
                      <span style={s.profileVal}>{val ?? "—"}</span>
                    </div>
                  ))}
                </div>

                <div className="dash-card" style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.cardTitle}>🩺 Recent Consultations</div>
                    <button style={s.viewAllBtn} onClick={() => setActiveTab("consultations")}>View all →</button>
                  </div>
                  {consultations.length === 0 ? (
                    <div style={s.emptyState}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🩺</div>
                      <div style={s.emptyText}>No consultations yet</div>
                      <button style={s.emptyBtn} onClick={handleBook}>Book your first one →</button>
                    </div>
                  ) : (
                    consultations.slice(0, 4).map(c => (
                      <div key={c.id} className="row-item" style={s.listRow}>
                        <div style={{ flex: 1 }}>
                          <div style={s.listRowTitle}>{c.symptoms?.slice(0, 40) ?? "General consultation"}</div>
                          <div style={s.listRowDate}>{formatDate(c.created_at)}</div>
                        </div>
                        <span style={{ ...s.statusBadge, background: statusBg[c.status] ?? "#f3f4f6", color: statusColor[c.status] ?? "#374151" }}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="dash-card" style={s.quickActions}>
                <div style={s.cardTitle}>⚡ Quick Actions</div>
                <div className="actions-grid" style={s.actionsGrid}>
                  {[
                    { icon: "🤒", label: "Check Symptoms", color: "#1a5c45", onClick: () => router.push("/symptom-checker") },
                    { icon: "💊", label: "Find Medicine",  color: "#1e40af", onClick: () => router.push("/find-medicine")},
                    { icon: "📋", label: "View Records",   color: "#7c3aed", onClick: () => setActiveTab("records") },
                    { icon: "🚨", label: "Emergency",      color: "#dc2626", onClick: () => router.push("/emergency") },
                  ].map(a => (
                    <button key={a.label} className="action-btn" style={{ ...s.quickBtn, borderTop: `3px solid ${a.color}` }} onClick={a.onClick}>
                      <span style={{ fontSize: 26 }}>{a.icon}</span>
                      <span style={s.quickBtnLabel}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ CONSULTATIONS ═══ */}
          {activeTab === "consultations" && (
            <>
              <div className="page-header" style={s.pageHeader}>
                <div>
                  <h1 style={s.pageH1}>Consultations</h1>
                  <p style={s.pageSubtitle}>All your consultation history</p>
                </div>
                <button className="action-btn book-btn" style={s.bookBtn} onClick={handleBook}>+ New</button>
              </div>
              {consultations.length === 0 ? (
                <div style={s.emptyFull}>
                  <div style={{ fontSize: 52 }}>🩺</div>
                  <div style={s.emptyFullTitle}>No consultations yet</div>
                  <div style={s.emptyFullSub}>Book your first to get started</div>
                  <button style={s.bookBtn} onClick={handleBook}>Book Now →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {consultations.map((c, i) => (
                    <div key={c.id} className="dash-card" style={{ ...s.consultCard, animationDelay: `${i*60}ms` }}>
                      <div style={s.consultTop}>
                        <div style={{ flex: 1 }}>
                          <div style={s.consultSymptoms}>{c.symptoms ?? "General consultation"}</div>
                          <div style={s.consultDate}>{formatDate(c.created_at)}</div>
                        </div>
                        <div className="consult-right" style={s.consultRight}>
                          <span style={{ ...s.statusBadge, background: statusBg[c.status] ?? "#f3f4f6", color: statusColor[c.status] ?? "#374151" }}>{c.status}</span>
                          <span style={s.modeBadge}>📱 {c.mode}</span>
                        </div>
                      </div>
                      {c.prescription && <div style={s.consultPrescription}>💊 <strong>Prescription:</strong> {c.prescription}</div>}
                      {c.notes        && <div style={s.consultNotes}>📝 <strong>Notes:</strong> {c.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ RECORDS ═══ */}
          {activeTab === "records" && (
            <>
              <div className="page-header" style={s.pageHeader}>
                <div>
                  <h1 style={s.pageH1}>Medical Records</h1>
                  <p style={s.pageSubtitle}>Your health history in one place</p>
                </div>
              </div>
              {records.length === 0 ? (
                <div style={s.emptyFull}>
                  <div style={{ fontSize: 52 }}>📁</div>
                  <div style={s.emptyFullTitle}>No records yet</div>
                  <div style={s.emptyFullSub}>Records appear after consultations</div>
                </div>
              ) : (
                <div className="records-grid" style={s.recordsGrid}>
                  {records.map((r, i) => (
                    <div key={r.id} className="dash-card" style={{ ...s.recordCard, animationDelay: `${i*60}ms` }}>
                      <div style={{ fontSize: 30, marginBottom: 10 }}>{recordIcon[r.record_type] ?? "📄"}</div>
                      <div style={s.recordType}>{r.record_type.replace("_", " ")}</div>
                      <div style={s.recordContent}>{r.content ?? "No content"}</div>
                      <div style={s.recordDate}>{formatDate(r.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ══════════════ MOBILE BOTTOM NAV ══════════════ */}
      <nav className="bottom-nav">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ color: activeTab === item.id ? GREEN : "#a0aec0" }}>
            <span className="bnav-icon">{item.icon}</span>
            <span className="bnav-label" style={{ fontWeight: activeTab === item.id ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Dashboard styles ─────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  loader:         { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: CREAM, fontFamily: SANS, gap: 16 },
  loaderSpinner:  { width: 40, height: 40, border: `3px solid ${GREEN}22`, borderTop: `3px solid ${GREEN}`, borderRadius: "50%", animation: "spin .8s linear infinite" },
  loaderText:     { fontSize: 14, color: "#718096" },
  root:           { display: "flex", minHeight: "100vh", background: CREAM, fontFamily: SANS },
  offlineBanner:  { position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#fef3c7", borderBottom: "1px solid #f59e0b", color: "#92400e", fontSize: 13, fontWeight: 600, padding: "10px 24px", textAlign: "center" as const },
  sidebar:        { width: 240, background: CARD, borderRight: "1px solid #e8e0d5", flexDirection: "column" as const, justifyContent: "space-between", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 },
  sideTop:        { padding: "24px 0 16px" },
  sideLogo:       { display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 32 },
  logoMark:       { width: 32, height: 32, borderRadius: 8, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  logoText:       { fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: GREEN },
  sideNav:        { display: "flex", flexDirection: "column" as const, gap: 2, padding: "0 12px" },
  sideNavBtn:     { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 14, textAlign: "left" as const, width: "100%" },
  sideProfile:    { display: "flex", alignItems: "center", gap: 10, padding: "16px", borderTop: "1px solid #f0ebe3" },
  sideAvatar:     { width: 36, height: 36, borderRadius: "50%", background: GREEN, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  sideProfileInfo:{ flex: 1, minWidth: 0 },
  sideProfileName:{ fontSize: 13, fontWeight: 600, color: "#1a202c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  sideProfileSub: { fontSize: 11, color: "#a0aec0", marginTop: 1 },
  signOutBtn:     { width: 30, height: 30, borderRadius: 8, border: "1px solid #e2d9ce", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  main:           { marginLeft: 240, flex: 1, padding: "32px 32px", minHeight: "100vh" },
  tabContent:     { maxWidth: 960, margin: "0 auto" },
  pageHeader:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 },
  greetingTag:    { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#718096", marginBottom: 8, background: "#f0ebe3", padding: "4px 12px", borderRadius: 20 },
  onlineDot:      { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  pageH1:         { fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#0f1a10", marginBottom: 4 },
  pageSubtitle:   { fontSize: 14, color: "#718096" },
  bookBtn:        { background: GREEN, color: "white", border: "none", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 6px 20px rgba(26,92,69,.2)", whiteSpace: "nowrap" as const },
  statsRow:       { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 },
  statCard:       { background: CARD, borderRadius: 14, padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  statIcon:       { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 },
  statVal:        { fontFamily: SERIF, fontSize: 26, fontWeight: 700, marginBottom: 3 },
  statLabel:      { fontSize: 11, color: "#718096", fontWeight: 500 },
  overviewGrid:   { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18, marginBottom: 18 },
  card:           { background: CARD, borderRadius: 16, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  cardHeader:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  cardTitle:      { fontSize: 15, fontWeight: 700, color: "#1a202c", fontFamily: SERIF },
  editBtn:        { fontSize: 12, color: GREEN, background: "rgba(26,92,69,.06)", border: "none", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  viewAllBtn:     { fontSize: 12, color: GREEN, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  profileRow:     { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f7f3ee" },
  profileLabel:   { fontSize: 11, color: "#a0aec0", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  profileVal:     { fontSize: 13, color: "#1a202c", fontWeight: 500 },
  listRow:        { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 8px", borderRadius: 8, cursor: "pointer" },
  listRowTitle:   { fontSize: 13, color: "#1a202c", fontWeight: 500, marginBottom: 3 },
  listRowDate:    { fontSize: 11, color: "#a0aec0" },
  statusBadge:    { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const },
  modeBadge:      { fontSize: 11, color: "#718096", background: "#f0ebe3", padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const },
  emptyState:     { textAlign: "center" as const, padding: "32px 20px" },
  emptyText:      { fontSize: 14, color: "#a0aec0", marginBottom: 14 },
  emptyBtn:       { background: GREEN, color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  emptyFull:      { textAlign: "center" as const, padding: "64px 20px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12 },
  emptyFullTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#1a202c" },
  emptyFullSub:   { fontSize: 14, color: "#a0aec0", marginBottom: 8 },
  quickActions:   { background: CARD, borderRadius: 16, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  actionsGrid:    { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 },
  quickBtn:       { background: CARD, border: "1px solid #e8e0d5", borderRadius: 12, padding: "18px 12px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS },
  quickBtnLabel:  { fontSize: 12, fontWeight: 600, color: "#1a202c", textAlign: "center" as const },
  consultCard:        { background: CARD, borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  consultTop:         { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 10 },
  consultRight:       { display: "flex", gap: 6, flexShrink: 0 },
  consultSymptoms:    { fontSize: 15, fontWeight: 600, color: "#1a202c", marginBottom: 3, fontFamily: SERIF },
  consultDate:        { fontSize: 12, color: "#a0aec0" },
  consultPrescription:{ fontSize: 13, color: "#1e40af", background: "#dbeafe", padding: "8px 12px", borderRadius: 8, marginTop: 8 },
  consultNotes:       { fontSize: 13, color: "#4a5568", background: "#f7f3ee", padding: "8px 12px", borderRadius: 8, marginTop: 8 },
  recordsGrid:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 },
  recordCard:     { background: CARD, borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  recordType:     { fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: "#1a202c", marginBottom: 7, textTransform: "capitalize" as const },
  recordContent:  { fontSize: 13, color: "#718096", lineHeight: 1.6, marginBottom: 10 },
  recordDate:     { fontSize: 11, color: "#a0aec0", fontWeight: 500 },
};