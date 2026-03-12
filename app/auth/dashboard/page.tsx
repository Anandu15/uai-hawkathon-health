"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type Patient = {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string;
  village: string | null;
  district: string | null;
  language: string;
};

type Consultation = {
  id: string;
  symptoms: string | null;
  status: string;
  mode: string;
  created_at: string;
  prescription: string | null;
  notes: string | null;
};

type MedicalRecord = {
  id: string;
  record_type: string;
  content: string | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  pending:   "#b45309",
  active:    "#1a5c45",
  completed: "#1e40af",
  cancelled: "#dc2626",
};

const statusBg: Record<string, string> = {
  pending:   "#fef3c7",
  active:    "#d1fae5",
  completed: "#dbeafe",
  cancelled: "#fee2e2",
};

const recordIcon: Record<string, string> = {
  blood_test:   "🩸",
  prescription: "💊",
  scan:         "🔬",
  note:         "📝",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  const [patient, setPatient]             = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [records, setRecords]             = useState<MedicalRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<"overview" | "consultations" | "records">("overview");
  const [isOnline, setIsOnline]           = useState(true);
  const [greeting, setGreeting]           = useState("Good day");

  // ── online/offline banner ──────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── greeting ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // ── auth + data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }

      const uid = session.user.id;

      // fetch patient profile
      const { data: pat } = await supabase
        .from("patients")
        .select("*")
        .eq("id", uid)
        .single();

      if (pat) setPatient(pat);

      // fetch consultations
      const { data: cons } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", uid)
        .order("created_at", { ascending: false })
        .limit(10);

      if (cons) setConsultations(cons);

      // fetch medical records
      const { data: recs } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", uid)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recs) setRecords(recs);

      setLoading(false);
    };

    init();
  }, [router]);

  // ── sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // ── book consultation (placeholder) ───────────────────────────────────────
  const handleBook = async () => {
    if (!patient) return;
    const { error } = await supabase.from("consultations").insert({
      patient_id: patient.id,
      symptoms: "To be filled",
      status: "pending",
      mode: "chat",
    });
    if (!error) {
      // refresh consultations
      const { data } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setConsultations(data);
      setActiveTab("consultations");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderSpinner} />
      <div style={s.loaderText}>Loading your health dashboard…</div>
    </div>
  );

  const firstName = patient?.full_name?.split(" ")[0] ?? "there";
  const pendingCount   = consultations.filter(c => c.status === "pending").length;
  const completedCount = consultations.filter(c => c.status === "completed").length;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .dash-card { animation: fadeUp .4s ease both; }
        .action-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 12px 32px rgba(26,92,69,.25) !important; }
        .action-btn { transition: transform .2s, box-shadow .2s !important; }
        .tab-btn:hover { background: rgba(26,92,69,.06) !important; }
        .row-item:hover { background: #f7f3ee !important; }
        .row-item { transition: background .15s; }
        .sign-out:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        .sign-out { transition: background .2s, color .2s; }
      `}</style>

      {/* ── offline banner ── */}
      {!isOnline && (
        <div style={s.offlineBanner}>
          📴 You're offline — showing cached data. New actions will sync when you reconnect.
        </div>
      )}

      {/* ── sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.sideLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>

          <nav style={s.sideNav}>
            {([
              { id: "overview",      icon: "🏠", label: "Overview"      },
              { id: "consultations", icon: "🩺", label: "Consultations" },
              { id: "records",       icon: "📁", label: "Records"       },
            ] as const).map(item => (
              <button
                key={item.id}
                className="tab-btn"
                style={{
                  ...s.sideNavBtn,
                  background: activeTab === item.id ? "rgba(26,92,69,.1)" : "transparent",
                  color:      activeTab === item.id ? GREEN : "#4a5568",
                  fontWeight: activeTab === item.id ? 700 : 500,
                  borderLeft: activeTab === item.id ? `3px solid ${GREEN}` : "3px solid transparent",
                }}
                onClick={() => setActiveTab(item.id)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* profile mini */}
        <div style={s.sideProfile}>
          <div style={s.sideAvatar}>
            {patient?.full_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div style={s.sideProfileInfo}>
            <div style={s.sideProfileName}>{patient?.full_name ?? "—"}</div>
            <div style={s.sideProfileSub}>{patient?.village ?? "Patient"}</div>
          </div>
          <button
            className="sign-out"
            style={s.signOutBtn}
            onClick={handleSignOut}
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </aside>

      {/* ── main content ── */}
      <main style={s.main}>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        {activeTab === "overview" && (
          <div style={s.tabContent}>
            {/* header */}
            <div style={s.pageHeader}>
              <div>
                <div style={s.greetingTag}>
                  <span style={{ ...s.onlineDot, background: isOnline ? "#22c55e" : "#ef4444", animation: isOnline ? "pulse 2s infinite" : "none" }} />
                  {isOnline ? "Connected" : "Offline mode"}
                </div>
                <h1 style={s.pageH1}>{greeting}, {firstName} 👋</h1>
                <p style={s.pageSubtitle}>Here's your health summary</p>
              </div>
              <button
                className="action-btn"
                style={s.bookBtn}
                onClick={handleBook}
              >
                + Book Consultation
              </button>
            </div>

            {/* stat cards */}
            <div style={s.statsRow} className="dash-card">
              {[
                { icon: "🩺", val: consultations.length, label: "Total Consultations", color: GREEN },
                { icon: "⏳", val: pendingCount,          label: "Pending",             color: "#b45309" },
                { icon: "✅", val: completedCount,        label: "Completed",            color: "#1e40af" },
                { icon: "📁", val: records.length,        label: "Medical Records",      color: "#7c3aed" },
              ].map((st, i) => (
                <div key={st.label} style={{ ...s.statCard, animationDelay: `${i * 80}ms` }} className="dash-card">
                  <div style={{ ...s.statIcon, background: st.color + "15" }}>{st.icon}</div>
                  <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                  <div style={s.statLabel}>{st.label}</div>
                </div>
              ))}
            </div>

            {/* profile card + recent */}
            <div style={s.overviewGrid}>
              {/* profile */}
              <div style={s.profileCard} className="dash-card">
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>👤 Your Profile</div>
                  <button style={s.editBtn}>Edit</button>
                </div>
                <div style={s.profileRows}>
                  {[
                    { label: "Full Name",  val: patient?.full_name ?? "—" },
                    { label: "Age",        val: patient?.age ? `${patient.age} years` : "—" },
                    { label: "Gender",     val: patient?.gender ?? "—" },
                    { label: "Phone",      val: patient?.phone ?? "—" },
                    { label: "Village",    val: patient?.village ?? "—" },
                    { label: "District",   val: patient?.district ?? "—" },
                    { label: "Language",   val: patient?.language ?? "—" },
                  ].map(row => (
                    <div key={row.label} style={s.profileRow}>
                      <span style={s.profileLabel}>{row.label}</span>
                      <span style={s.profileVal}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* recent consultations */}
              <div style={s.recentCard} className="dash-card">
                <div style={s.cardHeader}>
                  <div style={s.cardTitle}>🩺 Recent Consultations</div>
                  <button
                    style={s.viewAllBtn}
                    onClick={() => setActiveTab("consultations")}
                  >
                    View all →
                  </button>
                </div>

                {consultations.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>🩺</div>
                    <div style={s.emptyText}>No consultations yet</div>
                    <button style={s.emptyBtn} onClick={handleBook}>
                      Book your first one →
                    </button>
                  </div>
                ) : (
                  <div style={s.listRows}>
                    {consultations.slice(0, 4).map(c => (
                      <div key={c.id} className="row-item" style={s.listRow}>
                        <div style={s.listRowLeft}>
                          <div style={s.listRowTitle}>
                            {c.symptoms?.slice(0, 40) ?? "General consultation"}
                          </div>
                          <div style={s.listRowDate}>{formatDate(c.created_at)}</div>
                        </div>
                        <span style={{
                          ...s.statusBadge,
                          background: statusBg[c.status] ?? "#f3f4f6",
                          color: statusColor[c.status] ?? "#374151",
                        }}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* quick actions */}
            <div style={s.quickActions} className="dash-card">
              <div style={s.cardTitle}>⚡ Quick Actions</div>
              <div style={s.actionsGrid}>
                {[
                  { icon: "🤒", label: "Check Symptoms",    color: "#1a5c45", onClick: () => {} },
                  { icon: "💊", label: "Find Medicine",     color: "#1e40af", onClick: () => {} },
                  { icon: "📋", label: "View Records",      color: "#7c3aed", onClick: () => setActiveTab("records") },
                  { icon: "🚨", label: "Emergency",         color: "#dc2626", onClick: () => {} },
                ].map(a => (
                  <button
                    key={a.label}
                    className="action-btn"
                    style={{ ...s.quickBtn, borderTop: `3px solid ${a.color}` }}
                    onClick={a.onClick}
                  >
                    <span style={{ fontSize: 28 }}>{a.icon}</span>
                    <span style={s.quickBtnLabel}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ CONSULTATIONS TAB ═══════════════ */}
        {activeTab === "consultations" && (
          <div style={s.tabContent}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageH1}>Consultations</h1>
                <p style={s.pageSubtitle}>All your consultation history</p>
              </div>
              <button className="action-btn" style={s.bookBtn} onClick={handleBook}>
                + New Consultation
              </button>
            </div>

            {consultations.length === 0 ? (
              <div style={s.emptyFull}>
                <div style={{ fontSize: 56 }}>🩺</div>
                <div style={s.emptyFullTitle}>No consultations yet</div>
                <div style={s.emptyFullSub}>Book your first consultation to get started</div>
                <button style={s.bookBtn} onClick={handleBook}>Book Now →</button>
              </div>
            ) : (
              <div style={s.cardList}>
                {consultations.map((c, i) => (
                  <div
                    key={c.id}
                    className="dash-card"
                    style={{ ...s.consultCard, animationDelay: `${i * 60}ms` }}
                  >
                    <div style={s.consultTop}>
                      <div style={s.consultLeft}>
                        <div style={s.consultSymptoms}>
                          {c.symptoms ?? "General consultation"}
                        </div>
                        <div style={s.consultDate}>{formatDate(c.created_at)}</div>
                      </div>
                      <div style={s.consultRight}>
                        <span style={{
                          ...s.statusBadge,
                          background: statusBg[c.status] ?? "#f3f4f6",
                          color: statusColor[c.status] ?? "#374151",
                        }}>
                          {c.status}
                        </span>
                        <span style={s.modeBadge}>📱 {c.mode}</span>
                      </div>
                    </div>
                    {c.prescription && (
                      <div style={s.consultPrescription}>
                        💊 <strong>Prescription:</strong> {c.prescription}
                      </div>
                    )}
                    {c.notes && (
                      <div style={s.consultNotes}>
                        📝 <strong>Notes:</strong> {c.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ RECORDS TAB ═══════════════ */}
        {activeTab === "records" && (
          <div style={s.tabContent}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageH1}>Medical Records</h1>
                <p style={s.pageSubtitle}>Your health history in one place</p>
              </div>
            </div>

            {records.length === 0 ? (
              <div style={s.emptyFull}>
                <div style={{ fontSize: 56 }}>📁</div>
                <div style={s.emptyFullTitle}>No records yet</div>
                <div style={s.emptyFullSub}>Records will appear here after consultations</div>
              </div>
            ) : (
              <div style={s.recordsGrid}>
                {records.map((r, i) => (
                  <div
                    key={r.id}
                    className="dash-card"
                    style={{ ...s.recordCard, animationDelay: `${i * 60}ms` }}
                  >
                    <div style={s.recordIcon}>
                      {recordIcon[r.record_type] ?? "📄"}
                    </div>
                    <div style={s.recordType}>
                      {r.record_type.replace("_", " ")}
                    </div>
                    <div style={s.recordContent}>
                      {r.content ?? "No content"}
                    </div>
                    <div style={s.recordDate}>{formatDate(r.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GREEN  = "#1a5c45";
const CREAM  = "#f7f3ee";
const SERIF  = "'Lora', Georgia, serif";
const SANS   = "'DM Sans', system-ui, sans-serif";
const CARD   = "#ffffff";

const s: Record<string, React.CSSProperties> = {
  // Loading
  loader: { minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: CREAM, fontFamily: SANS, gap: 16 },
  loaderSpinner: { width: 40, height: 40, border: `3px solid ${GREEN}22`, borderTop: `3px solid ${GREEN}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loaderText: { fontSize: 14, color: "#718096" },

  // Layout
  root: { display: "flex", minHeight: "100vh", background: CREAM, fontFamily: SANS },

  // Offline banner
  offlineBanner: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#fef3c7", borderBottom: "1px solid #f59e0b", color: "#92400e", fontSize: 13, fontWeight: 600, padding: "10px 24px", textAlign: "center" as const },

  // Sidebar
  sidebar: { width: 240, background: CARD, borderRight: "1px solid #e8e0d5", display: "flex", flexDirection: "column" as const, justifyContent: "space-between", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 },
  sideTop: { padding: "24px 0 16px" },
  sideLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 32 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  logoText: { fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: GREEN },
  sideNav: { display: "flex", flexDirection: "column" as const, gap: 2, padding: "0 12px" },
  sideNavBtn: { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 14, textAlign: "left" as const, width: "100%" },

  // Sidebar profile
  sideProfile: { display: "flex", alignItems: "center", gap: 10, padding: "16px 16px", borderTop: "1px solid #f0ebe3" },
  sideAvatar: { width: 36, height: 36, borderRadius: "50%", background: GREEN, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  sideProfileInfo: { flex: 1, minWidth: 0 },
  sideProfileName: { fontSize: 13, fontWeight: 600, color: "#1a202c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  sideProfileSub: { fontSize: 11, color: "#a0aec0", marginTop: 1 },
  signOutBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid #e2d9ce", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // Main
  main: { marginLeft: 240, flex: 1, padding: "32px 36px", minHeight: "100vh" },
  tabContent: { maxWidth: 1000, margin: "0 auto" },

  // Page header
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 },
  greetingTag: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#718096", marginBottom: 8, background: "#f0ebe3", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  pageH1: { fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: "#0f1a10", marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: "#718096" },
  bookBtn: { background: GREEN, color: "white", border: "none", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 6px 20px rgba(26,92,69,.2)", whiteSpace: "nowrap" as const },

  // Stat cards
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 },
  statCard: { background: CARD, borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 },
  statVal: { fontFamily: SERIF, fontSize: 28, fontWeight: 700, marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#718096", fontWeight: 500 },

  // Overview grid
  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, marginBottom: 20 },

  // Profile card
  profileCard: { background: CARD, borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#1a202c", fontFamily: SERIF },
  editBtn: { fontSize: 12, color: GREEN, background: "rgba(26,92,69,.06)", border: "none", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  viewAllBtn: { fontSize: 12, color: GREEN, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  profileRows: { display: "flex", flexDirection: "column" as const, gap: 0 },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f7f3ee" },
  profileLabel: { fontSize: 12, color: "#a0aec0", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  profileVal: { fontSize: 13, color: "#1a202c", fontWeight: 500 },

  // Recent card
  recentCard: { background: CARD, borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  listRows: { display: "flex", flexDirection: "column" as const, gap: 0 },
  listRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px", borderRadius: 8, cursor: "pointer" },
  listRowLeft: { flex: 1 },
  listRowTitle: { fontSize: 13, color: "#1a202c", fontWeight: 500, marginBottom: 3 },
  listRowDate: { fontSize: 11, color: "#a0aec0" },

  // Status badge
  statusBadge: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const },
  modeBadge: { fontSize: 11, color: "#718096", background: "#f0ebe3", padding: "4px 10px", borderRadius: 20 },

  // Empty state
  emptyState: { textAlign: "center" as const, padding: "32px 20px" },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#a0aec0", marginBottom: 14 },
  emptyBtn: { background: GREEN, color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 },
  emptyFull: { textAlign: "center" as const, padding: "80px 20px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12 },
  emptyFullTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#1a202c" },
  emptyFullSub: { fontSize: 14, color: "#a0aec0", marginBottom: 8 },

  // Quick actions
  quickActions: { background: CARD, borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  actionsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 16 },
  quickBtn: { background: CARD, border: "1px solid #e8e0d5", borderRadius: 12, padding: "20px 14px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, cursor: "pointer", fontFamily: SANS },
  quickBtnLabel: { fontSize: 13, fontWeight: 600, color: "#1a202c" },

  // Consultation cards
  cardList: { display: "flex", flexDirection: "column" as const, gap: 14 },
  consultCard: { background: CARD, borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  consultTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  consultLeft: { flex: 1 },
  consultRight: { display: "flex", gap: 8, flexShrink: 0 },
  consultSymptoms: { fontSize: 15, fontWeight: 600, color: "#1a202c", marginBottom: 4, fontFamily: SERIF },
  consultDate: { fontSize: 12, color: "#a0aec0" },
  consultPrescription: { fontSize: 13, color: "#1e40af", background: "#dbeafe", padding: "8px 12px", borderRadius: 8, marginTop: 8 },
  consultNotes: { fontSize: 13, color: "#4a5568", background: "#f7f3ee", padding: "8px 12px", borderRadius: 8, marginTop: 8 },

  // Records
  recordsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 },
  recordCard: { background: CARD, borderRadius: 14, padding: "24px 20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0ebe3" },
  recordIcon: { fontSize: 32, marginBottom: 12 },
  recordType: { fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#1a202c", marginBottom: 8, textTransform: "capitalize" as const },
  recordContent: { fontSize: 13, color: "#718096", lineHeight: 1.6, marginBottom: 12 },
  recordDate: { fontSize: 11, color: "#a0aec0", fontWeight: 500 },
};