"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import ChatWidget from "../components/ChatWidget";


function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  return m;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  language: string | null;
  is_available: boolean | null;
  verified: boolean | null;
}

interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  village: string | null;
  district: string | null;
  language: string | null;
}

// ── resolve user type from uid ─────────────────────────────────────────────
async function resolveUser(uid: string): Promise<{ name: string; type: "patient" | "doctor" } | null> {
  const { data: p } = await supabase
    .from("patients")
    .select("full_name")
    .eq("id", uid)
    .maybeSingle();
  if (p?.full_name) return { name: p.full_name, type: "patient" };

  const { data: d } = await supabase
    .from("doctors")
    .select("full_name")
    .eq("id", uid)
    .maybeSingle();
  if (d?.full_name) return { name: d.full_name, type: "doctor" };

  return null;
}

// ── Skeleton ──────────────────────────────────────────────────────────────
const skBase: React.CSSProperties = {
  background: "linear-gradient(90deg,#f0ede8 25%,#e8e3dc 50%,#f0ede8 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: 6,
};

function SkeletonCard() {
  return (
    <div style={{ ...S.floatCard, display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ ...skBase, width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ ...skBase, height: 14 }} />
          <div style={{ ...skBase, height: 10, width: "60%" }} />
        </div>
      </div>
      {[1, 2, 3].map(i => <div key={i} style={{ ...skBase, height: 38, borderRadius: 9 }} />)}
      <div style={{ ...skBase, height: 42, borderRadius: 10 }} />
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div style={{ ...S.floatCard, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 200, padding: 24 }}>
      <div style={{ fontSize: 38 }}>🏥</div>
      <div style={{ fontSize: 12, color: "#718096", textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-line" }}>{message}</div>
    </div>
  );
}

// ── Doctor Slideshow (shown to logged-in patients) ────────────────────────
function DoctorSlideshow({ sessionToken, onBook }: { 
  sessionToken: string; 
  onBook: (doctorId: string) => void  // was: () => void
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [idx, setIdx]         = useState(0);
  const [status, setStatus]   = useState<"loading" | "ok" | "error" | "empty">("loading");
  const [errMsg, setErrMsg]   = useState("");

  useEffect(() => {
    if (!sessionToken) return;

    setStatus("loading");
    (async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, full_name, specialization, experience_years, consultation_fee, language, is_available, verified")
        .order("full_name");

      if (error) { setErrMsg(error.message); setStatus("error"); return; }
      if (!data || data.length === 0) { setStatus("empty"); return; }
      setDoctors(data);
      setStatus("ok");
    })();
  }, [sessionToken]);

  const next = useCallback(() => setIdx(i => (i + 1) % doctors.length), [doctors.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + doctors.length) % doctors.length), [doctors.length]);

  useEffect(() => {
    if (doctors.length < 2) return;
    const t = setInterval(next, 3200);
    return () => clearInterval(t);
  }, [doctors.length, next]);

  if (status === "loading") return <SkeletonCard />;
  if (status === "error")   return (
    <EmptyCard message={`Could not load doctors.\n\n${errMsg}\n\nFix: In Supabase → Authentication → Policies, add a SELECT policy on the "doctors" table for role = authenticated.`} />
  );
  if (status === "empty")   return <EmptyCard message="No doctors registered yet." />;

  const doc = doctors[idx];
  const available = doc.is_available !== false;

  return (
    <div style={{ ...S.floatCard, animation: "float 5s ease-in-out infinite", position: "relative" }}>
      {doctors.length > 1 && (
        <div style={S.dots}>
          {doctors.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ ...S.dot, background: i === idx ? "#1a5c45" : "#cbd5e0", border: "none", cursor: "pointer", padding: 0 }} />
          ))}
        </div>
      )}

      <div style={S.fcHeader}>
        <div style={S.fcAvatar}>👨‍⚕️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.fcName}>{doc.full_name}</div>
          <div style={S.fcSpec}>
            {doc.specialization || "General Physician"}
            {doc.experience_years ? ` · ${doc.experience_years}yr exp` : ""}
          </div>
        </div>
        <div style={{
          ...S.fcBadge,
          background: available ? "#dcfce7" : "#fee2e2",
          color:      available ? "#166534" : "#991b1b",
          border:     `1px solid ${available ? "#86efac" : "#fca5a5"}`,
        }}>
          {available ? "LIVE" : "BUSY"}
        </div>
      </div>

      <div style={S.fcDivider} />

      <div style={S.fcRows}>
        <div style={S.fcRow}>
          <span>💰</span>
          <span style={S.fcRowLabel}>Consultation Fee</span>
          <span style={S.fcRowTime}>{doc.consultation_fee != null ? `₹${doc.consultation_fee}` : "Free"}</span>
        </div>
        <div style={S.fcRow}>
          <span>🗣️</span>
          <span style={S.fcRowLabel}>Language</span>
          <span style={S.fcRowTime}>{doc.language || "English"}</span>
        </div>
        <div style={S.fcRow}>
          <span>✅</span>
          <span style={S.fcRowLabel}>Verified</span>
          <span style={{ ...S.fcRowTime, background: doc.verified ? "#dcfce7" : "#fef9c3", color: doc.verified ? "#166534" : "#854d0e" }}>
            {doc.verified ? "Yes" : "Pending"}
          </span>
        </div>
      </div>

      {doctors.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
          <button onClick={prev} style={S.arrowBtn}>‹</button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9ba8a0" }}>{idx + 1} / {doctors.length}</span>
          <button onClick={next} style={S.arrowBtn}>›</button>
        </div>
      )}

<button style={S.fcBtn} onClick={() => onBook(doc.id)}>
  Book with Dr. {doc.full_name} →
</button>
    </div>
  );
}

// ── Patient Slideshow (shown to logged-in doctors) ────────────────────────
function PatientSlideshow({ 
  sessionToken, 
  onViewPatient  // ← rename to avoid confusion
}: { 
  sessionToken: string; 
  onViewPatient: (patientId: string) => void 
}) {

  const [patients, setPatients] = useState<Patient[]>([]);
  const [idx, setIdx]           = useState(0);
  const [status, setStatus]     = useState<"loading" | "ok" | "error" | "empty">("loading");
  const [errMsg, setErrMsg]     = useState("");

  useEffect(() => {
    if (!sessionToken) return;

    setStatus("loading");
    (async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender, village, district, language")
        .order("full_name");

      if (error) { setErrMsg(error.message); setStatus("error"); return; }
      if (!data || data.length === 0) { setStatus("empty"); return; }
      setPatients(data);
      setStatus("ok");
    })();
  }, [sessionToken]);

  const next = useCallback(() => setIdx(i => (i + 1) % patients.length), [patients.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + patients.length) % patients.length), [patients.length]);

  useEffect(() => {
    if (patients.length < 2) return;
    const t = setInterval(next, 3200);
    return () => clearInterval(t);
  }, [patients.length, next]);

  if (status === "loading") return <SkeletonCard />;
  if (status === "error")   return (
    <EmptyCard message={`Could not load patients.\n\n${errMsg}\n\nFix: In Supabase → Authentication → Policies, add a SELECT policy on the "patients" table for role = authenticated.`} />
  );
  if (status === "empty")   return <EmptyCard message="No patients registered yet." />;

  const pat = patients[idx];
  const location = [pat.village, pat.district].filter(Boolean).join(", ");
  const isFemale = pat.gender?.toLowerCase() === "female";

  return (
    <div style={{ ...S.floatCard, animation: "float 5s ease-in-out infinite", position: "relative" }}>
      {patients.length > 1 && (
        <div style={S.dots}>
          {patients.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ ...S.dot, background: i === idx ? "#1e40af" : "#cbd5e0", border: "none", cursor: "pointer", padding: 0 }} />
          ))}
        </div>
      )}

      <div style={S.fcHeader}>
        <div style={{ ...S.fcAvatar, background: "#eff6ff" }}>{isFemale ? "👩" : "🧑"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.fcName}>{pat.full_name}</div>
          <div style={S.fcSpec}>
            {[pat.gender, pat.age ? `Age ${pat.age}` : null].filter(Boolean).join(" · ") || "Patient"}
          </div>
        </div>
        <div style={{ ...S.fcBadge, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" }}>
          WAITING
        </div>
      </div>

      <div style={S.fcDivider} />

      <div style={S.fcRows}>
        <div style={S.fcRow}>
          <span>📍</span>
          <span style={S.fcRowLabel}>Location</span>
          <span style={{ ...S.fcRowTime, background: "#eff6ff", color: "#1e40af" }}>{location || "Unknown"}</span>
        </div>
        <div style={S.fcRow}>
          <span>🗣️</span>
          <span style={S.fcRowLabel}>Language</span>
          <span style={{ ...S.fcRowTime, background: "#eff6ff", color: "#1e40af" }}>{pat.language || "Not set"}</span>
        </div>
        <div style={S.fcRow}>
          <span>📋</span>
          <span style={S.fcRowLabel}>Consultation</span>
          <span style={{ ...S.fcRowTime, background: "#fef9c3", color: "#854d0e" }}>Pending</span>
        </div>
      </div>

      {patients.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
          <button onClick={prev} style={{ ...S.arrowBtn, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>‹</button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9ba8a0" }}>{idx + 1} / {patients.length}</span>
          <button onClick={next} style={{ ...S.arrowBtn, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>›</button>
        </div>
      )}


<button
  style={{ ...S.fcBtn, background: "#1e40af" }}
  onClick={() => onViewPatient(pat.id)}
>
  View {pat.full_name.split(" ")[0]}'s Profile →
</button>

    </div>
  );
}

// ── Default card (logged out) ─────────────────────────────────────────────
function DefaultCard({ onBook }: { onBook: () => void }) {
  return (
    <div style={{ ...S.floatCard, animation: "float 5s ease-in-out infinite" }}>
      <div style={S.fcHeader}>
        <div style={S.fcAvatar}>👨‍⚕️</div>
        <div>
          <div style={S.fcName}>Dr. Arjun Mehta</div>
          <div style={S.fcSpec}>General Physician · Available now</div>
        </div>
        <div style={S.fcBadge}>LIVE</div>
      </div>
      <div style={S.fcDivider} />
      <div style={S.fcRows}>
        {[
          { icon: "🌡️", label: "Fever & Cold",  time: "< 2 min" },
          { icon: "💊", label: "Prescription",   time: "< 5 min" },
          { icon: "🩸", label: "Lab Review",     time: "< 3 min" },
        ].map(r => (
          <div key={r.label} style={S.fcRow}>
            <span>{r.icon}</span>
            <span style={S.fcRowLabel}>{r.label}</span>
            <span style={S.fcRowTime}>{r.time}</span>
          </div>
        ))}
      </div>
      <button style={S.fcBtn} onClick={onBook}>Book Consultation →</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function TeleHealthLanding() {
  const mounted = useMounted();
  const [activeStep, setActiveStep]     = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userName, setUserName]         = useState<string | null>(null);
  const [userType, setUserType]         = useState<"patient" | "doctor" | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [authReady, setAuthReady]       = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleSession = async (session: any) => {
      setSessionToken(session?.access_token ?? "");

      const uid = session?.user?.id ?? null;
      if (!uid) {
        setUserName(null);
        setUserType(null);
        setAuthReady(true);
        return;
      }

      const result = await resolveUser(uid);
      setUserName(result?.name ?? null);
      setUserType(result?.type ?? null);
      setAuthReady(true);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const dashboardPath = userType === "doctor" ? "/doctor/dashboard" : "/dashboard";
  const goAuth = () => router.push(userName ? dashboardPath : "/auth");

const renderCard = () => {
  if (!authReady) return <SkeletonCard />;
  if (userType === "patient") return (
  <DoctorSlideshow 
    sessionToken={sessionToken} 
    onBook={(doctorId: string) => router.push("/doctor/" + doctorId)} 
  />
);
  if (userType === "doctor") return (
    <PatientSlideshow 
      sessionToken={sessionToken} 
      onViewPatient={(patientId: string) => router.push("/patients/"+ patientId)}
    />
  );
  return <DefaultCard onBook={goAuth} />;
};


  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #f7f3ee; }

        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
        @keyframes scroll-x   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .nav-link { color:#4a5568; text-decoration:none; font-size:15px; font-weight:500; transition:color .2s; display:block; padding:16px 24px; border-bottom:1px solid #f7f3ee; }
        .nav-link:hover { color:#1a5c45; }
        .feat-card { transition:transform .25s, box-shadow .25s; }
        .feat-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(26,92,69,.12)!important; }
        .badge-pulse::after { content:''; position:absolute; inset:-3px; border-radius:50%; border:2px solid #1a5c45; animation:pulse-ring 1.8s ease-out infinite; }
        .d-flex   { display:flex; }
        .d-none   { display:none; }
        .hero-row   { display:flex; align-items:center; gap:52px; }
        .steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .feat-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .cta-btns   { display:flex; gap:12px; justify-content:center; }

        @media(max-width:700px){
          .desktop-only { display:none!important; }
          .mobile-only  { display:flex!important; }
          .mobile-menu  { position:fixed; top:56px; left:0; right:0; bottom:0; background:white; z-index:98; padding:8px 0 60px; overflow-y:auto; display:flex; flex-direction:column; border-top:1px solid #e8e0d5; }
          .mob-cta-btn  { margin:16px 20px 0; background:#1a5c45; color:white; border:none; border-radius:12px; padding:15px; font-size:16px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; width:calc(100% - 40px); text-align:center; }
          .mob-sec-btn  { margin:10px 20px 0; background:transparent; color:#1a5c45; border:1.5px solid #1a5c45; border-radius:12px; padding:14px; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; width:calc(100% - 40px); }
          .hero-row     { flex-direction:column!important; gap:28px!important; text-align:center; }
          .hero-left    { align-items:center!important; }
          .hero-tag, .trust-row { justify-content:center!important; }
          .hero-btns    { justify-content:center!important; }
          .hero-btns button { flex:1; }
          .hero-card-col { width:100%!important; align-items:center!important; }
          .float-card   { max-width:100%!important; }
          .mini-stat    { align-self:center!important; }
          .steps-grid   { grid-template-columns:1fr!important; gap:12px!important; }
          .feat-grid    { grid-template-columns:1fr!important; }
          .feat-wide    { grid-column:span 1!important; }
          .stats-grid   { grid-template-columns:repeat(2,1fr)!important; gap:10px!important; }
          .sec          { padding:48px 18px!important; }
          .hero-sec     { padding-top:72px!important; padding-bottom:36px!important; }
          .cta-inner    { padding:32px 18px!important; border-radius:18px!important; }
          .cta-btns     { flex-direction:column!important; align-items:stretch!important; }
          .cta-btns button { width:100%!important; }
          .foot-inner   { flex-direction:column!important; align-items:flex-start!important; gap:16px!important; }
          .foot-note    { text-align:left!important; }
        }
      `}</style>

      <div style={S.noise} />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>✚</div>
            <span style={S.logoText}>TeleCare</span>
          </div>
          <div className="d-flex desktop-only" style={{ gap: 32 }}>
            <a href="#features" className="nav-link" style={{ padding: 0, display: "inline" }}>Features</a>
            <a href="#how"      className="nav-link" style={{ padding: 0, display: "inline" }}>How It Works</a>
            <button onClick={() => router.push("/about")} className="nav-link" style={{ padding: 0, display: "inline", background: "none", border: "none", cursor: "pointer" }}>About</button>
          </div>
          <div className="d-flex desktop-only" style={{ gap: 10, alignItems: "center" }}>
            {userName ? (
              <>
                {/* ✅ FIX: Show full name instead of first name only */}
                <button style={S.navSignIn} onClick={() => router.push(dashboardPath)}>👤 {userName}</button>
                <button style={S.navCta}    onClick={() => router.push(dashboardPath)}>Dashboard →</button>
              </>
            ) : (
              <>
                <button style={S.navSignIn} onClick={() => router.push("/auth")}>Sign In</button>
                <button style={S.navCta}    onClick={() => router.push("/auth")}>Get Started Free</button>
              </>
            )}
          </div>
          <div className="d-none mobile-only" style={{ alignItems: "center", gap: 10 }}>
            {/* ✅ FIX: Show full name on mobile too */}
            {userName && <button style={S.navSignIn} onClick={() => router.push(dashboardPath)}>👤 {userName}</button>}
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 24, color: "#1a5c45", lineHeight: 1 }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
{menuOpen && (
  <div className="mobile-menu">
    <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
    <a href="#how"      className="nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
    <button
      className="nav-link"
      onClick={() => { router.push("/about"); setMenuOpen(false); }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontFamily: SANS,
        fontSize: 15,
        fontWeight: 500,
        color: "#4a5568",
        padding: "16px 24px",
        borderBottom: "1px solid #f7f3ee",
        display: "block",
      }}
    >
      About
    </button>
    <button className="mob-cta-btn" onClick={() => { goAuth(); setMenuOpen(false); }}>{userName ? "Go to Dashboard →" : "Get Started Free →"}</button>
    {!userName && <button className="mob-sec-btn" onClick={() => { router.push("/auth"); setMenuOpen(false); }}>Sign In</button>}
  </div>
)}
      </nav>

      {/* HERO */}
      <section className="hero-sec" style={{ ...S.hero, ...(mounted ? S.heroVisible : {}) }}>
        <div style={S.blob1} /><div style={S.blob2} />
        <div style={S.wrap}>
          <div className="hero-row">
            <div className="hero-left" style={S.heroLeft}>
              <div style={S.heroTag} className="hero-tag">
                <span style={S.tagDot} className="badge-pulse" />
                <span>Live · Available 24/7</span>
              </div>
              <h1 style={S.heroH1}>
                Healthcare for<br />
                <span style={{ color: "#1a5c45" }}>every village,</span><br />
                every family.
              </h1>
              <p style={S.heroP}>Connect with certified doctors from home — even on 2G. Check symptoms, store records, find medicines nearby.</p>
              <div className="hero-btns" style={S.heroBtns}>
                <button style={S.btnPrimary} onClick={goAuth}>
                  🩺 {!userName ? "Start Free Consultation" : userType === "doctor" ? "Go to Dashboard" : "Book a Doctor"}
                </button>
                
              </div>
              <div className="trust-row" style={S.trustRow}>
                {["Works offline", "Hindi · English", "Free forever"].map(t => (
                  <span key={t} style={S.trustChip}>✓ {t}</span>
                ))}
              </div>
            </div>

            <div className="hero-card-col" style={S.heroRight}>
              {authReady && userType && (
                <div style={S.cardLabel}>{userType === "patient" ? "👨‍⚕️ Available Doctors" : "🧑‍🦱 Registered Patients"}</div>
              )}
              {renderCard()}
              <div className="mini-stat" style={S.miniStat}>
                <div style={S.miniStatNum}>12,400+</div>
                <div style={S.miniStatLabel}>Consultations Done</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div style={S.strip}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 48, whiteSpace: "nowrap" as const, flexShrink: 0, animation: "scroll-x 20s linear infinite" }}>
            {[...Array(2)].map((_, gi) =>
              ["AIIMS Delhi","Max Healthcare","Apollo","Fortis Health","Govt. Hospital","Rural Health Mission","WHO Certified"].map(name => (
                <span key={`${gi}-${name}`} style={S.stripItem}>{name}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="sec" style={S.sec}>
        <div style={S.wrap}>
          <div style={S.eyebrow}>Simple · Fast · Reliable</div>
          <h2 style={S.h2}>Three steps to a consultation</h2>
          <div className="steps-grid">
            {[
              { n:"01", icon:"📋", color:"#1a5c45", title:"Describe Symptoms", desc:"Type, speak, or upload your lab report. Works in Hindi, Tamil, Telugu & more." },
              { n:"02", icon:"🤖", color:"#b45309", title:"AI Pre-Screening",  desc:"Our checker flags urgent cases and suggests the right specialist instantly." },
              { n:"03", icon:"👨‍⚕️", color:"#1e40af", title:"Talk to a Doctor",  desc:"Connect via chat or audio. Get prescription & follow-up reminders." },
            ].map((step, i) => (
              <div key={step.n} style={{ ...S.stepCard, borderTop:`4px solid ${step.color}`, opacity:activeStep===i?1:0.7, transform:activeStep===i?"scale(1.02)":"scale(1)", transition:"opacity .4s, transform .4s" }}>
                <div style={{ ...S.stepNum, color:step.color }}>{step.n}</div>
                <div style={S.stepIcon}>{step.icon}</div>
                <div style={S.stepTitle}>{step.title}</div>
                <div style={S.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="sec" style={{ ...S.sec, position:"relative" }}>
        <div style={S.featBg} />
        <div style={S.wrap}>
          <div style={S.eyebrow}>Built for India's last mile</div>
          <h2 style={S.h2}>Everything your community needs</h2>
          <div className="feat-grid">
            {[
              { icon:"📶", title:"Offline-First",    desc:"Works on 2G. Queue consultations offline, sync when signal returns.",  color:"#1a5c45", wide:true  },
              { icon:"🗣️", title:"Voice Input",      desc:"Speak symptoms in your language. No typing needed.",                    color:"#b45309", wide:false },
              { icon:"💊", title:"Medicine Finder",  desc:"Check pharmacy stock nearby. Get alternatives if unavailable.",        color:"#1e40af", wide:false },
              { icon:"📁", title:"Health Records",   desc:"Every visit, prescription, and report saved securely — forever.",      color:"#7c3aed", wide:false },
              { icon:"🚨", title:"Emergency Triage", desc:"Instant escalation to nearest hospital for critical symptoms.",        color:"#dc2626", wide:false },
              { icon:"🔒", title:"100% Private",     desc:"Your data stays on your device unless you choose to share.",           color:"#0891b2", wide:true  },
            ].map(f => (
              <div key={f.title} className={`feat-card${f.wide?" feat-wide":""}`}
                style={{ ...S.featCard, gridColumn:f.wide?"span 2":"span 1", borderLeft:`4px solid ${f.color}` }}>
                <div style={{ ...S.featIcon, background:f.color+"18" }}><span style={{ fontSize:22 }}>{f.icon}</span></div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="sec" style={S.sec}>
        <div style={S.wrap}>
          <div className="stats-grid">
            {[
              { val:"10,000+", label:"Patients Helped",    icon:"🧑‍🤝‍🧑" },
              { val:"< 3 min", label:"Avg. Response Time", icon:"⚡" },
              { val:"20+",     label:"Languages",          icon:"🗣️" },
              { val:"99.2%",   label:"Satisfaction",       icon:"⭐" },
            ].map(st => (
              <div key={st.label} style={S.statBlock}>
                <div style={S.statEmoji}>{st.icon}</div>
                <div style={S.statVal}>{st.val}</div>
                <div style={S.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec" style={S.sec}>
        <div style={S.wrap}>
          <div className="cta-inner" style={S.ctaCard}>
            <div style={S.ctaOrb} />
            <div style={S.eyebrowLight}>Free · No credit card · No signup</div>
            <h2 style={S.ctaH2}>Start your first<br />consultation today</h2>
            <p style={S.ctaP}>Book a doctor or use our AI symptom checker — right from your phone, anywhere in India.</p>
            <div className="cta-btns">
              <button style={S.ctaBtnPrimary} onClick={goAuth}>🩺 {userName ? "Open Dashboard" : "Get Started Free"}</button>
              <button style={S.ctaBtnOutline}>Learn more →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div className="foot-inner" style={S.footInner}>
          <div style={S.footLogo}>
            <div style={S.logoMark}>✚</div>
            <span style={{ fontFamily:"'Lora',serif", fontWeight:700, color:"#1a5c45", fontSize:16 }}>TeleCare</span>
          </div>
          <p className="foot-note" style={S.footNote}>For informational purposes only. Not a substitute for professional medical advice.</p>
          <div style={S.footLinks}>
            {["Privacy","Terms","Contact"].map(l => <a key={l} href="#" style={S.footLink}>{l}</a>)}
          </div>
        </div>
      </footer>
      <ChatWidget/>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const GREEN       = "#1a5c45";
const GREEN_LIGHT = "#e8f5f0";
const AMBER       = "#b45309";
const CREAM       = "#f7f3ee";
const CARD        = "#ffffff";
const SERIF       = "'Lora', Georgia, serif";
const SANS        = "'DM Sans', system-ui, sans-serif";

const S: Record<string, React.CSSProperties> = {
  root:        { fontFamily:SANS, background:CREAM, color:"#1a202c", minHeight:"100vh", overflowX:"hidden" },
  noise:       { position:"fixed", inset:0, pointerEvents:"none", zIndex:999, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")", opacity:0.4 },
  wrap:        { maxWidth:1160, margin:"0 auto", padding:"0 20px" },
  nav:         { position:"fixed", top:0, left:0, right:0, zIndex:100, backdropFilter:"blur(16px)", background:"rgba(247,243,238,0.95)", borderBottom:"1px solid rgba(26,92,69,0.1)" },
  navInner:    { maxWidth:1160, margin:"0 auto", padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo:        { display:"flex", alignItems:"center", gap:9 },
  logoMark:    { width:32, height:32, borderRadius:9, background:GREEN, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:14, flexShrink:0 },
  logoText:    { fontFamily:SERIF, fontWeight:700, fontSize:17, color:GREEN },
  navSignIn:   { background:"none", border:`1.5px solid ${GREEN}`, color:GREEN, padding:"7px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:SANS },
  navCta:      { background:GREEN, border:"none", color:"white", padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:SANS, boxShadow:"0 4px 14px rgba(26,92,69,.25)" },
  hero:        { paddingTop:80, paddingBottom:60, position:"relative", overflow:"hidden", opacity:0, transform:"translateY(20px)", transition:"opacity .7s ease, transform .7s ease" },
  heroVisible: { opacity:1, transform:"translateY(0)" },
  blob1:       { position:"absolute", top:-80,  right:-100, width:440, height:440, borderRadius:"60% 40% 50% 70%", background:"radial-gradient(circle,rgba(26,92,69,.08) 0%,transparent 70%)", pointerEvents:"none" },
  blob2:       { position:"absolute", bottom:-80, left:-60, width:340, height:340, borderRadius:"50% 60% 40% 70%", background:"radial-gradient(circle,rgba(180,83,9,.06) 0%,transparent 70%)",  pointerEvents:"none" },
  heroLeft:    { flex:1.1, display:"flex", flexDirection:"column", gap:20 },
  heroRight:   { flex:1, display:"flex", flexDirection:"column", alignItems:"flex-start", gap:14 },
  heroTag:     { display:"inline-flex", alignItems:"center", gap:9, background:GREEN_LIGHT, border:`1px solid ${GREEN}33`, color:GREEN, padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, width:"fit-content", position:"relative" },
  tagDot:      { width:7, height:7, borderRadius:"50%", background:GREEN, flexShrink:0, position:"relative" },
  heroH1:      { fontFamily:SERIF, fontSize:"clamp(28px,7vw,60px)", fontWeight:700, lineHeight:1.1, letterSpacing:"-1.5px", color:"#0f1a10" },
  heroP:       { fontSize:15, color:"#4a5568", lineHeight:1.8, maxWidth:460 },
  heroBtns:    { display:"flex", gap:10, flexWrap:"wrap" as const },
  btnPrimary:  { background:GREEN, color:"white", border:"none", padding:"13px 22px", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:SANS, boxShadow:"0 8px 24px rgba(26,92,69,.28)" },
  btnOutline:  { background:"transparent", color:"#1a202c", border:"1.5px solid #cbd5e0", padding:"13px 22px", borderRadius:12, fontSize:15, cursor:"pointer", fontFamily:SANS },
  trustRow:    { display:"flex", gap:8, flexWrap:"wrap" as const },
  trustChip:   { fontSize:12, color:"#4a5568", background:"#edf2f7", padding:"4px 10px", borderRadius:20, fontWeight:500 },
  cardLabel:   { fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" as const, color:GREEN, marginBottom:2 },
  floatCard:   { background:CARD, borderRadius:18, padding:20, boxShadow:"0 20px 50px rgba(0,0,0,.1),0 0 0 1px rgba(26,92,69,.08)", width:"100%", maxWidth:360 },
  fcHeader:    { display:"flex", alignItems:"center", gap:12, marginBottom:14 },
  fcAvatar:    { fontSize:26, width:44, height:44, background:GREEN_LIGHT, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  fcName:      { fontFamily:SERIF, fontWeight:700, fontSize:14, color:"#1a202c", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  fcSpec:      { fontSize:11, color:"#718096", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  fcBadge:     { marginLeft:"auto", background:"#dcfce7", color:"#166534", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:8, border:"1px solid #86efac", letterSpacing:1, flexShrink:0 },
  fcDivider:   { height:1, background:"#f0f0f0", marginBottom:12 },
  fcRows:      { display:"flex", flexDirection:"column" as const, gap:8, marginBottom:14 },
  fcRow:       { display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:"#fafaf9", borderRadius:9, border:"1px solid #f0ede8" },
  fcRowLabel:  { flex:1, fontSize:13, color:"#2d3748", fontWeight:500 },
  fcRowTime:   { fontSize:11, color:GREEN, fontWeight:600, background:GREEN_LIGHT, padding:"2px 7px", borderRadius:7 },
  fcBtn:       { width:"100%", background:GREEN, color:"white", border:"none", padding:"12px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:SANS },
  dots:        { display:"flex", gap:5, justifyContent:"center", marginBottom:12 },
  dot:         { width:7, height:7, borderRadius:"50%", transition:"background .3s", flexShrink:0 },
  arrowBtn:    { flex:1, background:GREEN_LIGHT, border:`1px solid ${GREEN}22`, color:GREEN, borderRadius:8, padding:"6px 0", fontSize:18, cursor:"pointer", fontFamily:SANS, fontWeight:700 },
  miniStat:    { background:CARD, borderRadius:12, padding:"12px 18px", boxShadow:"0 6px 20px rgba(0,0,0,.08)", border:`1px solid ${GREEN}20`, alignSelf:"flex-end" },
  miniStatNum: { fontFamily:SERIF, fontSize:20, fontWeight:700, color:GREEN },
  miniStatLabel:{ fontSize:11, color:"#718096", marginTop:2 },
  strip:       { background:CARD, borderTop:"1px solid #e8e0d5", borderBottom:"1px solid #e8e0d5", padding:"12px 0", overflow:"hidden" },
  stripItem:   { fontSize:12, fontWeight:600, color:"#9ba8a0", letterSpacing:"0.5px", textTransform:"uppercase" as const },
  sec:         { padding:"76px 20px" },
  featBg:      { position:"absolute" as const, inset:0, background:"linear-gradient(180deg,rgba(26,92,69,.03) 0%,transparent 100%)", pointerEvents:"none" as const },
  eyebrow:     { fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase" as const, color:AMBER, marginBottom:12 },
  eyebrowLight:{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase" as const, color:`${GREEN}cc`, marginBottom:12 },
  h2:          { fontFamily:SERIF, fontSize:"clamp(22px,5vw,42px)", fontWeight:700, marginBottom:36, letterSpacing:"-0.5px", color:"#0f1a10" },
  stepCard:    { background:CARD, borderRadius:14, padding:"22px 18px", boxShadow:"0 3px 14px rgba(0,0,0,.06)" },
  stepNum:     { fontFamily:SERIF, fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:10 },
  stepIcon:    { fontSize:30, marginBottom:10 },
  stepTitle:   { fontFamily:SERIF, fontSize:16, fontWeight:700, marginBottom:8, color:"#1a202c" },
  stepDesc:    { fontSize:13, color:"#718096", lineHeight:1.75 },
  featCard:    { background:CARD, borderRadius:14, padding:"20px 18px", boxShadow:"0 3px 12px rgba(0,0,0,.05)" },
  featIcon:    { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 },
  featTitle:   { fontFamily:SERIF, fontSize:15, fontWeight:700, marginBottom:7, color:"#1a202c" },
  featDesc:    { fontSize:13, color:"#718096", lineHeight:1.7 },
  statBlock:   { background:CARD, border:`1px solid ${GREEN}20`, borderRadius:14, padding:"22px 14px", textAlign:"center" as const, boxShadow:"0 3px 12px rgba(26,92,69,.04)" },
  statEmoji:   { fontSize:26, marginBottom:8 },
  statVal:     { fontFamily:SERIF, fontSize:24, fontWeight:700, color:GREEN, marginBottom:4 },
  statLabel:   { fontSize:11, color:"#718096", fontWeight:500 },
  ctaCard:     { maxWidth:720, margin:"0 auto", background:GREEN, borderRadius:24, padding:"56px 44px", textAlign:"center" as const, position:"relative" as const, overflow:"hidden", boxShadow:"0 20px 56px rgba(26,92,69,.32)" },
  ctaOrb:      { position:"absolute" as const, top:-80, right:-80, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,.06)", pointerEvents:"none" as const },
  ctaH2:       { fontFamily:SERIF, fontSize:"clamp(22px,6vw,42px)", fontWeight:700, color:"white", marginBottom:14, letterSpacing:"-0.5px" },
  ctaP:        { fontSize:15, color:"rgba(255,255,255,.7)", lineHeight:1.8, marginBottom:28 },
  ctaBtnPrimary:{ background:"white", color:GREEN, border:"none", padding:"14px 28px", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:SANS, boxShadow:"0 4px 16px rgba(0,0,0,.12)" },
  ctaBtnOutline:{ background:"transparent", color:"rgba(255,255,255,.85)", border:"1.5px solid rgba(255,255,255,.3)", padding:"14px 28px", borderRadius:10, fontSize:15, cursor:"pointer", fontFamily:SANS },
  footer:      { borderTop:"1px solid #e8e0d5", padding:"28px 20px", background:"#f0ebe3" },
  footInner:   { maxWidth:1160, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" as const },
  footLogo:    { display:"flex", alignItems:"center", gap:9 },
  footNote:    { fontSize:12, color:"#9ba8a0", maxWidth:340, textAlign:"center" as const, lineHeight:1.6 },
  footLinks:   { display:"flex", gap:20 },
  footLink:    { fontSize:13, color:"#718096", textDecoration:"none" } as React.CSSProperties,
};