"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import ChatInbox from "@/app/components/ChatInbox";

type Doctor = {
  id: string;
  full_name: string;
  phone: string;
  specialization: string | null;
  license_number: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  language: string;
  is_available: boolean;
  verified: boolean;
  lat: number | null;
  lng: number | null;
};

type Consultation = {
  id: string;
  patient_id: string;
  symptoms: string | null;
  status: string;
  mode: string;
  created_at: string;
  prescription: string | null;
  notes: string | null;
};

type PatientInfo = {
  id: string;
  full_name: string;
  age: number | null;
  village: string | null;
  last_seen: string | null;
};

const statusColor: Record<string, string> = {
  pending: "#b45309", active: "#1a5c45", completed: "#1e40af", cancelled: "#dc2626",
};
const statusBg: Record<string, string> = {
  pending: "#fef3c7", active: "#d1fae5", completed: "#dbeafe", cancelled: "#fee2e2",
};

// ✅ FIX 1: Widened from 60s → 90s to tolerate ngrok/network latency
function isOnlineNow(last_seen: string | null): boolean {
  if (!last_seen) return false;
  const diff = Date.now() - new Date(last_seen).getTime();
  return diff < 90000;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Shared constants ────────────────────────────────────────────────────────
const BLUE  = "#1a4a7a";
const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";
const CREAM = "#f0f5fb";
const CARD  = "#ffffff";

// ─── Edit Profile Modal ──────────────────────────────────────────────────────
function EditProfileModal({
  doctor, onClose, onSave,
}: {
  doctor: Doctor;
  onClose: () => void;
  onSave: (updated: Doctor) => void;
}) {
  const [form, setForm]     = useState({ ...doctor });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (field: keyof Doctor, value: string | number | boolean | null) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    if (!form.phone.trim())     { setError("Phone is required."); return; }
    setSaving(true); setError(null);

    const { error: supaErr } = await supabase
      .from("doctors")
      .update({
        full_name:        form.full_name.trim(),
        phone:            form.phone.trim(),
        specialization:   form.specialization || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        language:         form.language || "english",
        is_available:     form.is_available,
      })
      .eq("id", doctor.id);

    setSaving(false);
    if (supaErr) { setError("Failed to save. Please try again."); return; }
    onSave(form);
  };

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={m.backdrop} onClick={onBackdrop}>
      <div style={m.modal}>
        <div style={m.header}>
          <div style={m.headerTitle}>Edit Profile</div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={m.body}>
          {error && <div style={m.errorBanner}>{error}</div>}

          <div style={m.row}>
            <label style={m.label}>Full Name *</label>
            <input style={m.input} value={form.full_name}
              onChange={e => set("full_name", e.target.value)} placeholder="Dr. Full Name" />
          </div>

          <div style={m.twoCol}>
            <div style={m.row}>
              <label style={m.label}>Phone *</label>
              <input style={m.input} value={form.phone}
                onChange={e => set("phone", e.target.value)} placeholder="Phone" />
            </div>
            <div style={m.row}>
              <label style={m.label}>Language</label>
              <select style={m.input} value={form.language} onChange={e => set("language", e.target.value)}>
                {["english","hindi","tamil","telugu","marathi","punjabi","bengali","gujarati","kannada"].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={m.twoCol}>
            <div style={m.row}>
              <label style={m.label}>Experience (yrs)</label>
              <input style={m.input} type="number" value={form.experience_years ?? ""}
                onChange={e => set("experience_years", e.target.value ? Number(e.target.value) : null)}
                placeholder="5" />
            </div>
            <div style={m.row}>
              <label style={m.label}>Fee (₹)</label>
              <input style={m.input} type="number" value={form.consultation_fee ?? ""}
                onChange={e => set("consultation_fee", e.target.value ? Number(e.target.value) : null)}
                placeholder="200" />
            </div>
          </div>

          <div style={m.row}>
            <label style={m.label}>Availability</label>
            <select style={m.input} value={form.is_available ? "true" : "false"}
              onChange={e => set("is_available", e.target.value === "true")}>
              <option value="true">✅ Available</option>
              <option value="false">🔴 Not Available</option>
            </select>
          </div>
        </div>
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

// ─── Consultation Detail Modal ───────────────────────────────────────────────
function ConsultDetailModal({
  consult, patient, onClose, onUpdate,
}: {
  consult: Consultation;
  patient: PatientInfo | null;
  onClose: () => void;
  onUpdate: (updated: Consultation) => void;
}) {
  const [prescription, setPrescription] = useState(consult.prescription ?? "");
  const [notes, setNotes]               = useState(consult.notes ?? "");
  const [status, setStatus]             = useState(consult.status);
  const [saving, setSaving]             = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("consultations").update({ prescription, notes, status }).eq("id", consult.id);
    setSaving(false);
    if (!error) onUpdate({ ...consult, prescription, notes, status });
  };

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={m.backdrop} onClick={onBackdrop}>
      <div style={{ ...m.modal, maxWidth: 520 }}>
        <div style={m.header}>
          <div style={m.headerTitle}>🩺 Consultation Details</div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={m.body}>
          {/* Patient info */}
          <div style={{ background: "#eff6ff", borderRadius: 10, padding: "12px 14px", border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 11, color: "#718096", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 6 }}>Patient</div>
            <div style={{ fontWeight: 600, color: "#1a202c", fontSize: 15 }}>{patient?.full_name ?? "Unknown"}</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
              {patient?.age ? `${patient.age} yrs` : "Age unknown"} · {patient?.village ?? "Location unknown"}
            </div>
          </div>

          {/* Symptoms */}
          <div style={m.row}>
            <label style={m.label}>Symptoms</label>
            <div style={{ padding: "10px 13px", background: "#fef3c7", borderRadius: 9, fontSize: 14, color: "#92400e", fontFamily: SANS }}>
              {consult.symptoms ?? "No symptoms recorded"}
            </div>
          </div>

          {/* Status */}
          <div style={m.row}>
            <label style={m.label}>Status</label>
            <select style={m.input} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">⏳ Pending</option>
              <option value="active">🟢 Active</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          {/* Prescription */}
          <div style={m.row}>
            <label style={m.label}>Prescription</label>
            <textarea style={{ ...m.input, minHeight: 80, resize: "vertical" as const }}
              value={prescription} onChange={e => setPrescription(e.target.value)}
              placeholder="e.g. Paracetamol 500mg twice daily for 5 days…" />
          </div>

          {/* Notes */}
          <div style={m.row}>
            <label style={m.label}>Doctor Notes</label>
            <textarea style={{ ...m.input, minHeight: 70, resize: "vertical" as const }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes, follow-up instructions…" />
          </div>

          <div style={{ fontSize: 11, color: "#a0aec0" }}>Booked on {formatDate(consult.created_at)} · Mode: {consult.mode}</div>
        </div>
        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose}>Close</button>
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
  header:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #e8f0fb" },
  headerTitle: { fontSize: 17, fontWeight: 700, color: "#0f1a2e", fontFamily: SERIF },
  closeBtn:    { width: 30, height: 30, borderRadius: 8, border: "1px solid #dbe8f5", background: "transparent", cursor: "pointer", fontSize: 13, color: "#718096", display: "flex", alignItems: "center", justifyContent: "center" },
  body:        { padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  footer:      { padding: "16px 24px", borderTop: "1px solid #e8f0fb", display: "flex", gap: 10, justifyContent: "flex-end" },
  row:         { display: "flex", flexDirection: "column", gap: 6 },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  label:       { fontSize: 11, fontWeight: 700, color: "#a0aec0", textTransform: "uppercase" as const, letterSpacing: "0.5px", fontFamily: SANS },
  input:       { padding: "10px 13px", border: "1.5px solid #dbe8f5", borderRadius: 9, fontSize: 14, fontFamily: SANS, color: "#1a202c", background: "#f8fbff", outline: "none", width: "100%" },
  errorBanner: { background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 8 },
  cancelBtn:   { padding: "10px 20px", borderRadius: 9, border: "1.5px solid #dbe8f5", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, color: "#4a5568" },
  saveBtn:     { padding: "10px 24px", borderRadius: 9, border: "none", background: BLUE, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 14px rgba(26,74,122,.25)", display: "flex", alignItems: "center" },
  spinner:     { width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
};

// ─── Doctor Dashboard ────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor]               = useState<Doctor | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients]           = useState<Record<string, PatientInfo>>({});
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "consultations" | "patients" | "messages">("overview");
  const [isOnline, setIsOnline]           = useState(true);
  const [greeting, setGreeting]           = useState("Good day");
  const [editOpen, setEditOpen]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ✅ FIX 2: Call refresh() immediately on mount + remove `consultations` from deps
  //           so the interval never resets when consultation state changes.
  //           Patient IDs are captured once when doctor loads; the list is stable.
  useEffect(() => {
    if (!doctor) return;

    const patientIds = [...new Set(consultations.map(c => c.patient_id))];
    if (!patientIds.length) return;

    const refresh = async () => {
      const { data: pats } = await supabase
        .from("patients").select("id, full_name, age, village, last_seen").in("id", patientIds);
      if (pats) {
        const map: Record<string, PatientInfo> = {};
        pats.forEach(p => { map[p.id] = p; });
        setPatients(map);
      }
    };

    refresh(); // ✅ show status immediately on load — don't wait 15s
    const interval = setInterval(refresh, 15000); // ✅ 15s interval, well within 90s threshold
    return () => clearInterval(interval);
  }, [doctor]); // ✅ only re-run when doctor changes, NOT on every consultation update

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/auth/doctor"); return; }
    const uid = session.user.id;

    const { data: doc } = await supabase.from("doctors").select("*").eq("id", uid).single();
    if (!doc) { router.replace("/auth/doctor"); return; }
    setDoctor(doc);

    const loadConsultations = async () => {
      const { data: cons } = await supabase
        .from("consultations").select("*").eq("doctor_id", uid)
        .order("created_at", { ascending: false }).limit(20);

      if (cons && cons.length > 0) {
        setConsultations(cons);
        const patientIds = [...new Set(cons.map(c => c.patient_id).filter(Boolean))];
        if (patientIds.length > 0) {
          const { data: pats } = await supabase
            .from("patients").select("id, full_name, age, village, last_seen").in("id", patientIds);
          if (pats) {
            const map: Record<string, PatientInfo> = {};
            pats.forEach(p => { map[p.id] = p; });
            setPatients(map);
          }
        }
      }
    };

    await loadConsultations();
    setLoading(false);

    // ← ADD THIS: poll every 10s for new bookings
    const poll = setInterval(loadConsultations, 10000);
    return () => clearInterval(poll);
  };

  init();
}, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/doctor");
  };

  const handleToggleAvailability = async () => {
    if (!doctor) return;
    const newVal = !doctor.is_available;
    const { error } = await supabase.from("doctors").update({ is_available: newVal }).eq("id", doctor.id);
    if (!error) setDoctor(prev => prev ? { ...prev, is_available: newVal } : prev);
  };

  const handleDeleteAccount = async () => {
    if (!doctor) return;
    setLoading(true);
    const res = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: doctor.id }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Failed to delete account"); setLoading(false); return; }
    await supabase.auth.signOut();
    router.replace("/auth/doctor");
  };

  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
      <p style={s.loaderText}>Loading your doctor dashboard…</p>
    </div>
  );

  const firstName      = doctor?.full_name ?? "Doctor";
  const pendingCount   = consultations.filter(c => c.status === "pending").length;
  const activeCount    = consultations.filter(c => c.status === "active").length;
  const completedCount = consultations.filter(c => c.status === "completed").length;
  const uniquePatients = [...new Set(consultations.map(c => c.patient_id))].length;

  const tabs = [
    { id: "overview",      icon: "🏠", label: "Overview"      },
    { id: "consultations", icon: "🩺", label: "Consultations" },
    { id: "patients",      icon: "👥", label: "Patients"      },
    { id: "messages",      icon: "💬", label: "Messages"      },
  ] as const;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }

        .dash-card  { animation: fadeUp .4s ease both; }
        .row-item   { transition: background .15s; }
        .row-item:hover { background: #eff6ff !important; cursor: pointer; }
        .tab-btn    { -webkit-tap-highlight-color: transparent; transition: background .15s; }
        .tab-btn:hover { background: rgba(26,74,122,.06) !important; }
        .action-btn { transition: transform .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent; }
        .action-btn:hover  { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(26,74,122,.22) !important; }
        .action-btn:active { transform: scale(.97); }
        .sign-out   { transition: background .2s, color .2s; }
        .sign-out:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        input:focus, select:focus, textarea:focus {
          border-color: #1a4a7a !important;
          box-shadow: 0 0 0 3px rgba(26,74,122,.1) !important;
          background: white !important;
        }
        .avail-toggle { transition: background .2s, transform .1s; }
        .avail-toggle:active { transform: scale(.97); }

        .dash-sidebar { display: flex; }
        .dash-main    { margin-left: 240px; }
        .bottom-nav   { display: none; }
        .mob-topbar   { display: none; }

        @media (max-width: 700px) {
          .dash-sidebar { display: none !important; }
          .mob-topbar {
            display: flex !important; position: fixed; top: 0; left: 0; right: 0; z-index: 60;
            height: 56px; background: white; border-bottom: 1px solid #dbe8f5;
            align-items: center; justify-content: space-between; padding: 0 18px;
          }
          .dash-main { margin-left: 0 !important; padding: 72px 16px 84px !important; }
          .bottom-nav {
            display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
            background: white; border-top: 1px solid #dbe8f5;
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
          .page-header   { flex-direction: column !important; gap: 14px !important; align-items: flex-start !important; }
          .tab-content   { padding: 0 !important; }
          .edit-two-col  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Offline banner */}
      {!isOnline && (
        <div style={s.offlineBanner}>
          📴 Offline — showing cached data. Actions will sync when reconnected.
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && doctor && (
        <div style={m.backdrop} onClick={() => setDeleteConfirm(false)}>
          <div style={{ ...m.modal, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={m.header}>
              <div style={{ ...m.headerTitle, color: "#dc2626" }}>⚠️ Delete Account</div>
              <button style={m.closeBtn} onClick={() => setDeleteConfirm(false)}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              This will permanently delete your doctor account and all associated data. This action cannot be undone.
            </div>
            <div style={m.footer}>
              <button style={m.cancelBtn} onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button style={{ ...m.saveBtn, background: "#dc2626", boxShadow: "0 4px 14px rgba(220,38,38,.25)" }}
                onClick={handleDeleteAccount} disabled={loading}>
                {loading ? "Deleting…" : "Yes, Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && doctor && (
        <EditProfileModal
          doctor={doctor}
          onClose={() => setEditOpen(false)}
          onSave={updated => { setDoctor(updated); setEditOpen(false); }}
        />
      )}

      {/* Consultation Detail Modal */}
      {selectedConsult && (
        <ConsultDetailModal
          consult={selectedConsult}
          patient={patients[selectedConsult.patient_id] ?? null}
          onClose={() => setSelectedConsult(null)}
          onUpdate={updated => {
            setConsultations(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedConsult(null);
          }}
        />
      )}

      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside className="dash-sidebar" style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.sideLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>
          <div style={s.doctorPortalBadge}>Doctor Portal</div>
          <nav style={s.sideNav}>
            {tabs.map(item => (
              <button key={item.id} className="tab-btn" style={{
                ...s.sideNavBtn,
                background: activeTab === item.id ? "rgba(26,74,122,.1)" : "transparent",
                color:      activeTab === item.id ? BLUE : "#4a5568",
                fontWeight: activeTab === item.id ? 700 : 500,
                borderLeft: activeTab === item.id ? `3px solid ${BLUE}` : "3px solid transparent",
              }} onClick={() => setActiveTab(item.id)}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideProfile}>
          <div style={s.sideAvatar}>{doctor?.full_name?.charAt(0).toUpperCase() ?? "D"}</div>
          <div style={s.sideProfileInfo}>
            <div style={s.sideProfileName}>{doctor?.full_name ?? "—"}</div>
            <div style={s.sideProfileSub}>{doctor?.specialization ?? "Doctor"}</div>
          </div>
          <button className="sign-out" style={s.signOutBtn} onClick={handleSignOut} title="Sign out">↩</button>
          <button className="sign-out" style={{ ...s.signOutBtn, borderColor: "#fca5a5", color: "#dc2626" }}
            onClick={() => setDeleteConfirm(true)} title="Delete account">🗑</button>
        </div>
      </aside>

      {/* ══ MOBILE TOP BAR ══ */}
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
            {doctor?.full_name?.charAt(0).toUpperCase() ?? "D"}
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
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
                  <h1 style={s.pageH1}>{greeting}, Dr. {firstName} 👋</h1>
                  <p style={s.pageSubtitle}>Here's your practice summary</p>
                </div>
                {/* Availability toggle */}
                <button className="avail-toggle" style={{
                  ...s.availBtn,
                  background: doctor?.is_available ? "#d1fae5" : "#fee2e2",
                  color: doctor?.is_available ? "#065f46" : "#991b1b",
                  border: `1.5px solid ${doctor?.is_available ? "#6ee7b7" : "#fca5a5"}`,
                }} onClick={handleToggleAvailability}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: doctor?.is_available ? "#22c55e" : "#ef4444", display: "inline-block", animation: doctor?.is_available ? "pulse 2s infinite" : "none" }} />
                  {doctor?.is_available ? "Available" : "Unavailable"}
                </button>
              </div>

              {/* Verification banner */}
              {!doctor?.verified && (
                <div style={s.verifyBanner}>
                  🔍 Your account is pending verification. You can still receive and respond to consultations while we review your license.
                </div>
              )}

              {/* Stats */}
              <div className="stats-row dash-card" style={s.statsRow}>
                {[
                  { icon: "🩺", val: consultations.length, label: "Total",    color: BLUE      },
                  { icon: "⏳", val: pendingCount,          label: "Pending",  color: "#b45309" },
                  { icon: "🟢", val: activeCount,           label: "Active",   color: "#1a5c45" },
                  { icon: "👥", val: uniquePatients,         label: "Patients", color: "#7c3aed" },
                ].map((st, i) => (
                  <div key={st.label} className="dash-card" style={{ ...s.statCard, animationDelay: `${i*80}ms` }}>
                    <div style={{ ...s.statIcon, background: st.color + "15" }}>{st.icon}</div>
                    <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                    <div style={s.statLabel}>{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Profile + Recent Consultations */}
              <div className="overview-grid" style={s.overviewGrid}>
                <div className="dash-card" style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.cardTitle}>👨‍⚕️ Your Profile</div>
                    <button style={s.editBtn} onClick={() => setEditOpen(true)}>Edit</button>
                  </div>
                  {[
                    ["Full Name",      doctor?.full_name],
                    ["Specialization", doctor?.specialization],
                    ["License No.",    doctor?.license_number],
                    ["Experience",     doctor?.experience_years ? `${doctor.experience_years} yrs` : null],
                    ["Fee",            doctor?.consultation_fee ? `₹${doctor.consultation_fee}` : null],
                    ["Phone",          doctor?.phone],
                    ["Language",       doctor?.language],
                    ["Verified",       doctor?.verified ? "✅ Verified" : "⏳ Pending"],
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
                      <div style={{ fontSize: 12, color: "#a0aec0" }}>Patients will appear here once they book with you</div>
                    </div>
                  ) : (
                    consultations.slice(0, 4).map(c => (
                      <div key={c.id} className="row-item" style={s.listRow} onClick={() => setSelectedConsult(c)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={s.listRowTitle}>{patients[c.patient_id]?.full_name ?? "Patient"}</div>
                            {patients[c.patient_id] && (
                              <span style={{
                                width: 7, height: 7, borderRadius: "50%",
                                background: isOnlineNow(patients[c.patient_id].last_seen) ? "#22c55e" : "#d1d5db",
                                display: "inline-block", flexShrink: 0,
                                animation: isOnlineNow(patients[c.patient_id].last_seen) ? "pulse 2s infinite" : "none",
                              }} />
                            )}
                          </div>
                          <div style={s.listRowSub}>{c.symptoms?.slice(0, 38) ?? "General consultation"}</div>
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

              {/* Quick Actions */}
              <div className="dash-card" style={s.quickActions}>
                <div style={s.cardTitle}>⚡ Quick Actions</div>
                <div className="actions-grid" style={s.actionsGrid}>
                  {[
                    { icon: "⏳", label: "Pending Queue", color: "#b45309", onClick: () => { setActiveTab("consultations"); } },
                    { icon: "👥", label: "All Patients",   color: BLUE,      onClick: () => setActiveTab("patients") },
                    { icon: "✅", label: "Mark Available", color: "#1a5c45", onClick: handleToggleAvailability },
                    { icon: "🏥", label: "Patient Portal", color: "#7c3aed", onClick: () => router.push("/auth") },
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
                  <p style={s.pageSubtitle}>Tap any consultation to review and update</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {pendingCount > 0 && (
                    <span style={{ ...s.statusBadge, background: "#fef3c7", color: "#b45309", fontSize: 12, padding: "6px 12px" }}>
                      {pendingCount} pending
                    </span>
                  )}
                  {activeCount > 0 && (
                    <span style={{ ...s.statusBadge, background: "#d1fae5", color: "#065f46", fontSize: 12, padding: "6px 12px" }}>
                      {activeCount} active
                    </span>
                  )}
                </div>
              </div>

              {consultations.length === 0 ? (
                <div style={s.emptyFull}>
                  <div style={{ fontSize: 52 }}>🩺</div>
                  <div style={s.emptyFullTitle}>No consultations yet</div>
                  <div style={s.emptyFullSub}>Patients will appear here once they book with you</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {consultations.map((c, i) => (
                    <div key={c.id} className="dash-card row-item" style={{ ...s.consultCard, animationDelay: `${i*50}ms` }}
                      onClick={() => setSelectedConsult(c)}>
                      <div style={s.consultTop}>
                        <div style={{ flex: 1 }}>
                          <div style={s.consultPatientName}>{patients[c.patient_id]?.full_name ?? "Unknown Patient"}</div>
                          <div style={s.consultSymptoms}>{c.symptoms ?? "General consultation"}</div>
                          <div style={s.consultDate}>
                            {patients[c.patient_id]?.village ? `📍 ${patients[c.patient_id].village}  ·  ` : ""}
                            {formatDate(c.created_at)}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                          <span style={{ ...s.statusBadge, background: statusBg[c.status] ?? "#f3f4f6", color: statusColor[c.status] ?? "#374151" }}>
                            {c.status}
                          </span>
                          <span style={s.modeBadge}>📱 {c.mode}</span>
                        </div>
                      </div>
                      {c.prescription && (
                        <div style={s.consultPrescription}>💊 <strong>Rx:</strong> {c.prescription}</div>
                      )}
                      <div style={s.tapHint}>Tap to open →</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ PATIENTS ═══ */}
          {activeTab === "patients" && (
            <>
              <div className="page-header" style={s.pageHeader}>
                <div>
                  <h1 style={s.pageH1}>Patients</h1>
                  <p style={s.pageSubtitle}>{uniquePatients} unique patient{uniquePatients !== 1 ? "s" : ""} seen</p>
                </div>
              </div>

              {uniquePatients === 0 ? (
                <div style={s.emptyFull}>
                  <div style={{ fontSize: 52 }}>👥</div>
                  <div style={s.emptyFullTitle}>No patients yet</div>
                  <div style={s.emptyFullSub}>Patients who book consultations will appear here</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {Object.values(patients).map((p, i) => {
                    const patConsults = consultations.filter(c => c.patient_id === p.id);
                    const lastConsult = patConsults[0];
                    return (
                      <div key={p.id} className="dash-card" style={{ ...s.patientCard, animationDelay: `${i*60}ms` }}>
                        <div style={s.patientAvatar}>{p.full_name.charAt(0).toUpperCase()}</div>
                        <div style={s.patientName}>{p.full_name}</div>
                        <div style={s.patientMeta}>
                          {p.age ? `${p.age} yrs` : "Age unknown"} · {p.village ?? "Location unknown"}
                        </div>
                        <div style={s.patientStats}>
                          <span>{patConsults.length} visit{patConsults.length !== 1 ? "s" : ""}</span>
                          {lastConsult && (
                            <span style={{ ...s.statusBadge, background: statusBg[lastConsult.status] ?? "#f3f4f6", color: statusColor[lastConsult.status] ?? "#374151", fontSize: 10 }}>
                              {lastConsult.status}
                            </span>
                          )}
                        </div>
                        {lastConsult && (
                          <div style={s.patientLastSeen}>Last: {formatDate(lastConsult.created_at)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "messages" && doctor && (
            <ChatInbox
              currentUserId={doctor.id}
              currentUserType="doctor"
              accentColor="#1a4a7a"
            />
          )}

        </div>
      </main>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="bottom-nav">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ color: activeTab === item.id ? BLUE : "#a0aec0" }}>
            <span className="bnav-icon">{item.icon}</span>
            <span className="bnav-label" style={{ fontWeight: activeTab === item.id ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  loader:          { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: CREAM, fontFamily: SANS, gap: 16 },
  loaderSpinner:   { width: 40, height: 40, border: `3px solid ${BLUE}22`, borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite" },
  loaderText:      { fontSize: 14, color: "#718096" },
  root:            { display: "flex", minHeight: "100vh", background: CREAM, fontFamily: SANS },
  offlineBanner:   { position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#fef3c7", borderBottom: "1px solid #f59e0b", color: "#92400e", fontSize: 13, fontWeight: 600, padding: "10px 24px", textAlign: "center" as const },
  verifyBanner:    { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: 13, fontWeight: 500, padding: "12px 16px", borderRadius: 10, marginBottom: 20, lineHeight: 1.5 },
  sidebar:         { width: 240, background: CARD, borderRight: "1px solid #dbe8f5", flexDirection: "column" as const, justifyContent: "space-between", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 },
  sideTop:         { padding: "24px 0 16px" },
  sideLogo:        { display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 8 },
  logoMark:        { width: 32, height: 32, borderRadius: 8, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  logoText:        { fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: BLUE },
  doctorPortalBadge: { margin: "0 20px 20px", display: "inline-block", background: "#eff6ff", color: BLUE, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: "3px 10px", borderRadius: 20, border: "1px solid #bfdbfe" },
  sideNav:         { display: "flex", flexDirection: "column" as const, gap: 2, padding: "0 12px" },
  sideNavBtn:      { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 14, textAlign: "left" as const, width: "100%" },
  sideProfile:     { display: "flex", alignItems: "center", gap: 10, padding: "16px", borderTop: "1px solid #e8f0fb" },
  sideAvatar:      { width: 36, height: 36, borderRadius: "50%", background: BLUE, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  sideProfileInfo: { flex: 1, minWidth: 0 },
  sideProfileName: { fontSize: 13, fontWeight: 600, color: "#1a202c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  sideProfileSub:  { fontSize: 11, color: "#a0aec0", marginTop: 1 },
  signOutBtn:      { width: 30, height: 30, borderRadius: 8, border: "1px solid #dbe8f5", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  main:            { marginLeft: 240, flex: 1, padding: "32px 32px", minHeight: "100vh" },
  tabContent:      { maxWidth: 960, margin: "0 auto" },
  pageHeader:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  greetingTag:     { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#718096", marginBottom: 8, background: "#e8f0fb", padding: "4px 12px", borderRadius: 20 },
  onlineDot:       { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  pageH1:          { fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#0f1a2e", marginBottom: 4 },
  pageSubtitle:    { fontSize: 14, color: "#718096" },
  availBtn:        { padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" as const },
  statsRow:        { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 },
  statCard:        { background: CARD, borderRadius: 14, padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #e8f0fb" },
  statIcon:        { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 },
  statVal:         { fontFamily: SERIF, fontSize: 26, fontWeight: 700, marginBottom: 3 },
  statLabel:       { fontSize: 11, color: "#718096", fontWeight: 500 },
  overviewGrid:    { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18, marginBottom: 18 },
  card:            { background: CARD, borderRadius: 16, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #e8f0fb" },
  cardHeader:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  cardTitle:       { fontSize: 15, fontWeight: 700, color: "#1a202c", fontFamily: SERIF },
  editBtn:         { fontSize: 12, color: BLUE, background: "rgba(26,74,122,.06)", border: "none", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  viewAllBtn:      { fontSize: 12, color: BLUE, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  profileRow:      { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0f5fb" },
  profileLabel:    { fontSize: 11, color: "#a0aec0", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  profileVal:      { fontSize: 13, color: "#1a202c", fontWeight: 500 },
  listRow:         { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "11px 8px", borderRadius: 8 },
  listRowTitle:    { fontSize: 13, color: "#1a202c", fontWeight: 600, marginBottom: 2 },
  listRowSub:      { fontSize: 12, color: "#718096", marginBottom: 2 },
  listRowDate:     { fontSize: 11, color: "#a0aec0" },
  statusBadge:     { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const },
  modeBadge:       { fontSize: 11, color: "#718096", background: "#e8f0fb", padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const },
  emptyState:      { textAlign: "center" as const, padding: "32px 20px" },
  emptyText:       { fontSize: 14, color: "#a0aec0", marginBottom: 8 },
  emptyFull:       { textAlign: "center" as const, padding: "64px 20px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12 },
  emptyFullTitle:  { fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#1a202c" },
  emptyFullSub:    { fontSize: 14, color: "#a0aec0", marginBottom: 8 },
  quickActions:    { background: CARD, borderRadius: 16, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #e8f0fb" },
  actionsGrid:     { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 },
  quickBtn:        { background: CARD, border: "1px solid #dbe8f5", borderRadius: 12, padding: "18px 12px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS },
  quickBtnLabel:   { fontSize: 12, fontWeight: 600, color: "#1a202c", textAlign: "center" as const },
  consultCard:     { background: CARD, borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #e8f0fb" },
  consultTop:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  consultPatientName: { fontSize: 15, fontWeight: 700, color: "#0f1a2e", marginBottom: 3, fontFamily: SERIF },
  consultSymptoms: { fontSize: 13, color: "#4a5568", marginBottom: 4 },
  consultDate:     { fontSize: 11, color: "#a0aec0" },
  consultPrescription: { fontSize: 12, color: "#1e40af", background: "#dbeafe", padding: "7px 11px", borderRadius: 7, marginTop: 10 },
  tapHint:         { fontSize: 11, color: "#93c5fd", marginTop: 10, textAlign: "right" as const },
  patientCard:     { background: CARD, borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #e8f0fb", display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const, gap: 6 },
  patientAvatar:   { width: 48, height: 48, borderRadius: "50%", background: BLUE, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, marginBottom: 4 },
  patientName:     { fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#1a202c" },
  patientMeta:     { fontSize: 12, color: "#718096" },
  patientStats:    { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  patientLastSeen: { fontSize: 11, color: "#a0aec0" },
};