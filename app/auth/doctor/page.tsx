"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Mode = "login" | "register";
type Step = 1 | 2 | 3;

const SPECIALIZATIONS = [
  "General Physician","Pediatrician","Gynecologist","Cardiologist",
  "Dermatologist","Orthopedic","ENT Specialist","Ophthalmologist",
  "Psychiatrist","Neurologist","Dentist","Ayurvedic / BAMS",
  "Homeopathic","Community Health Worker","Other",
];

const LANGUAGES = ["english","hindi","tamil","telugu","marathi","punjabi","bengali","gujarati","kannada"];

export default function DoctorAuthPage() {
  const router = useRouter();
  const [mode, setMode]       = useState<Mode>("login");
  const [step, setStep]       = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Step 1 — credentials
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — professional info
  const [fullName, setFullName]         = useState("");
  const [phone, setPhone]               = useState("");
  const [specialization, setSpec]       = useState(SPECIALIZATIONS[0]);
  const [licenseNumber, setLicense]     = useState("");
  const [experienceYears, setExp]       = useState("");
  const [consultationFee, setFee]       = useState("");
  const [language, setLanguage]         = useState("english");

  // Step 3 — location
  const [lat, setLat]           = useState<number | null>(null);
  const [lng, setLng]           = useState<number | null>(null);
  const [locCity, setLocCity]   = useState("");
  const [locStatus, setLocStatus] = useState<"idle"|"requesting"|"done"|"error">("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkDoctorAndRedirect(session.user.id);
    });
  }, []);

  async function checkDoctorAndRedirect(uid: string) {
    const { data } = await supabase.from("doctors").select("id").eq("id", uid).single();
    if (data) router.replace("/doctor/dashboard");
  }

  const reset      = () => setError("");
  const switchMode = (m: Mode) => { reset(); setMode(m); setStep(1); };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  async function handleLogin() {
    reset();
    if (!email || !password) return setError("Please fill all fields.");
    setLoading(true);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr || !authData.user) { setLoading(false); return setError(authErr?.message || "Login failed."); }
    // verify this user is a doctor
    const { data: doc } = await supabase.from("doctors").select("id").eq("id", authData.user.id).single();
    setLoading(false);
    if (!doc) { await supabase.auth.signOut(); return setError("No doctor account found for this email."); }
    router.replace("/doctor/dashboard");
  }

  // ── REGISTER STEP VALIDATORS ───────────────────────────────────────────────
  function handleStep1() {
    reset();
    if (!email || !password) return setError("Email and password are required.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    setStep(2);
  }

  function handleStep2() {
    reset();
    if (!fullName || !phone)    return setError("Full name and phone are required.");
    if (!licenseNumber.trim())  return setError("Medical license number is required.");
    setStep(3);
  }

  // ── LOCATION ───────────────────────────────────────────────────────────────
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude); setLng(longitude);
        setLocStatus("done");
        // reverse geocode for display
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const d = await r.json();
          const city = d?.address?.city || d?.address?.town || d?.address?.village || d?.address?.county || "your area";
          setLocCity(city);
        } catch { setLocCity("location detected"); }
      },
      () => setLocStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── FINAL REGISTER ─────────────────────────────────────────────────────────
  async function handleRegister() {
    reset();
    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr || !authData.user) { setLoading(false); return setError(authErr?.message || "Signup failed."); }

    // sign in immediately so insert is authenticated
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) { setLoading(false); return setError(signInErr.message); }

    const { error: dbErr } = await supabase.from("doctors").insert({
      id:                authData.user.id,
      full_name:         fullName,
      phone,
      specialization,
      license_number:    licenseNumber,
      experience_years:  experienceYears ? parseInt(experienceYears) : null,
      consultation_fee:  consultationFee ? parseInt(consultationFee) : null,
      language,
      is_available:      true,
      verified:          false,
      lat:               lat ?? null,
      lng:               lng ?? null,
    });

    setLoading(false);
    if (dbErr) return setError(dbErr.message);
    router.replace("/doctor/dashboard");
  }

  const totalSteps = 3;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

        .auth-input {
          width: 100%; padding: 13px 16px;
          border: 1.5px solid #e2d9ce; border-radius: 10px;
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          background: #fdfaf7; color: #1a202c; outline: none;
          transition: border-color .2s, box-shadow .2s;
          -webkit-appearance: none;
        }
        .auth-input:focus {
          border-color: #1a4a7a;
          box-shadow: 0 0 0 3px rgba(26,74,122,.1);
          background: white;
        }
        .auth-input::placeholder { color: #a0aec0; }
        select.auth-input { cursor: pointer; }

        .btn-primary {
          width: 100%; padding: 15px;
          background: #1a4a7a; color: white;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background .2s, transform .1s;
          box-shadow: 0 6px 20px rgba(26,74,122,.28);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-primary:active:not(:disabled) { background: #153b63; transform: scale(.98); }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }

        .btn-ghost {
          padding: 14px; background: transparent;
          color: #1a4a7a; border: 1.5px solid #1a4a7a; border-radius: 12px;
          font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background .2s;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-ghost:active { background: rgba(26,74,122,.06); }

        .loc-btn {
          width: 100%; padding: 15px;
          border: 1.5px dashed #1a4a7a; background: rgba(26,74,122,.04);
          color: #1a4a7a; border-radius: 12px;
          font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background .2s;
        }
        .loc-btn:hover { background: rgba(26,74,122,.08); }

        .tab-btn { cursor: pointer; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .card     { animation: fadeUp .4s ease both; }
        .field-row { display: flex; gap: 12px; }

        @media (max-width: 700px) {
          .auth-left  { display: none !important; }
          .auth-right { padding: 0 !important; align-items: stretch !important; background: #f0f5fb !important; }
          .auth-card  { border-radius: 0 !important; box-shadow: none !important; min-height: 100vh !important; padding: 48px 24px 40px !important; }
          .mobile-logo { display: flex !important; }
          .field-row  { flex-direction: column !important; gap: 14px !important; }
          .auth-input { font-size: 16px !important; }
        }
      `}</style>

      {/* ── LEFT panel ── */}
      <div className="auth-left" style={s.left}>
        <div style={s.leftInner}>
          <div style={s.leftLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>TeleCare</span>
          </div>
          <div style={s.leftBadge}>Doctor Portal</div>
          <div style={s.leftQuote}>
            "Connect with patients in your community.<br />Deliver care where it's needed most."
          </div>
          <div style={s.statsGrid}>
            {[
              { val: "500+", label: "Doctors" },
              { val: "173+", label: "Villages" },
              { val: "24/7", label: "Access" },
              { val: "Free", label: "Platform" },
            ].map(st => (
              <div key={st.label} style={s.statBox}>
                <div style={s.statVal}>{st.val}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
          <div style={s.leftFeats}>
            {[
              "✓ Verified doctor profiles",
              "✓ Proximity-based patient matching",
              "✓ Secure in-app messaging",
              "✓ Offline-capable on 2G",
            ].map(f => <div key={f} style={s.leftFeat}>{f}</div>)}
          </div>
        </div>
        <div style={s.circle1} /><div style={s.circle2} />
      </div>

      {/* ── RIGHT panel ── */}
      <div className="auth-right" style={s.right}>

        {/* Mobile logo */}
        <div className="mobile-logo" style={{ ...s.mobileLogo, display: "none" }}>
          <div style={s.mobileLogoMark}>✚</div>
          <span style={s.mobileLogoText}>TeleCare — Doctor Portal</span>
        </div>

        <div className="auth-card card" style={s.card}>

          {/* Tabs */}
          <div style={s.tabs}>
            {(["login","register"] as Mode[]).map(m => (
              <button key={m} className="tab-btn" style={{
                ...s.tab,
                color:        mode === m ? "#1a4a7a" : "#a0aec0",
                borderBottom: mode === m ? "2px solid #1a4a7a" : "2px solid transparent",
                fontWeight:   mode === m ? 700 : 500,
              }} onClick={() => switchMode(m)}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={s.heading}>
            {mode === "login" ? (
              <>
                <div style={s.roleChip}>👨‍⚕️ Doctor</div>
                <h1 style={s.h1}>Welcome back</h1>
                <p style={s.sub}>Sign in to your doctor account</p>
              </>
            ) : (
              <>
                <div style={s.roleChip}>👨‍⚕️ Doctor Registration</div>
                <h1 style={s.h1}>
                  {step === 1 ? "Create account"
                   : step === 2 ? "Professional details"
                   : "Your location"}
                </h1>
                <p style={s.sub}>
                  {step === 1 ? "Step 1 of 3 — Account credentials"
                   : step === 2 ? "Step 2 of 3 — Qualification & info"
                   : "Step 3 of 3 — Location for patient matching"}
                </p>
              </>
            )}
          </div>

          {/* Step bar */}
          {mode === "register" && (
            <div style={s.stepBar}>
              {[1,2,3].map(n => (
                <div key={n} style={{ ...s.stepSeg, background: n <= step ? "#1a4a7a" : "#e2d9ce" }} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <div style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input className="auth-input" type="email" placeholder="doctor@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoComplete="email" inputMode="email" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input className="auth-input" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoComplete="current-password" />
              </div>
              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <p style={s.switchText}>
                New doctor?{" "}
                <span style={s.switchLink} onClick={() => switchMode("register")}>Register here</span>
              </p>
              <div style={s.divider}><span>Are you a patient?</span></div>
              <button className="btn-ghost" onClick={() => router.push("/auth")} style={{ width: "100%" }}>
                Go to Patient Login
              </button>
            </div>
          )}

          {/* ── REGISTER STEP 1 — Credentials ── */}
          {mode === "register" && step === 1 && (
            <div style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email address *</label>
                <input className="auth-input" type="email" placeholder="doctor@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" inputMode="email" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password * (min 6 chars)</label>
                <input className="auth-input" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password" />
              </div>
              <button className="btn-primary" onClick={handleStep1}>Continue →</button>
              <p style={s.switchText}>
                Already registered?{" "}
                <span style={s.switchLink} onClick={() => switchMode("login")}>Sign in</span>
              </p>
            </div>
          )}

          {/* ── REGISTER STEP 2 — Professional info ── */}
          {mode === "register" && step === 2 && (
            <div style={s.form}>
              <div className="field-row">
                <div style={s.field}>
                  <label style={s.label}>Full Name *</label>
                  <input className="auth-input" placeholder="Dr. Arun Sharma"
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    autoComplete="name" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone *</label>
                  <input className="auth-input" placeholder="+91 98765 43210"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    inputMode="tel" autoComplete="tel" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Specialization *</label>
                <select className="auth-input" value={specialization} onChange={e => setSpec(e.target.value)}>
                  {SPECIALIZATIONS.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>Medical License Number *</label>
                <input className="auth-input" placeholder="MCI-12345 / State reg. number"
                  value={licenseNumber} onChange={e => setLicense(e.target.value)} />
              </div>

              <div className="field-row">
                <div style={s.field}>
                  <label style={s.label}>Years of Experience</label>
                  <input className="auth-input" type="number" placeholder="5"
                    value={experienceYears} onChange={e => setExp(e.target.value)}
                    inputMode="numeric" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Consultation Fee (₹)</label>
                  <input className="auth-input" type="number" placeholder="200"
                    value={consultationFee} onChange={e => setFee(e.target.value)}
                    inputMode="numeric" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Preferred Language</label>
                <select className="auth-input" value={language} onChange={e => setLanguage(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                </select>
              </div>

              <div style={s.btnGroup}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { reset(); setStep(1); }}>← Back</button>
                <button className="btn-primary" onClick={handleStep2} style={{ flex: 2 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── REGISTER STEP 3 — Location ── */}
          {mode === "register" && step === 3 && (
            <div style={s.form}>
              <div style={s.locCard}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
                <div style={{ fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 700, color: "#1a202c", marginBottom: 8 }}>
                  Share your location
                </div>
                <div style={{ fontSize: 13, color: "#718096", lineHeight: 1.6, marginBottom: 20, maxWidth: 300 }}>
                  Your location helps patients nearby find and connect with you. It is only used for proximity matching and is never shared publicly.
                </div>

                {locStatus === "idle" && (
                  <button className="loc-btn" onClick={requestLocation}>
                    📍 Detect My Location
                  </button>
                )}

                {locStatus === "requesting" && (
                  <div style={s.locRow}>
                    <span style={{ width:16, height:16, border:"2px solid rgba(26,74,122,.2)", borderTop:"2px solid #1a4a7a", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
                    <span style={{ fontSize: 14, color: "#1a4a7a", fontWeight: 600 }}>Detecting location…</span>
                  </div>
                )}

                {locStatus === "done" && (
                  <div style={s.locSuccess}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
                    <div style={{ fontWeight: 700, color: "#276749", fontSize: 14 }}>Location detected</div>
                    <div style={{ color: "#4a5568", fontSize: 13, marginTop: 2 }}>{locCity}</div>
                    <button className="loc-btn" onClick={requestLocation} style={{ marginTop: 12, fontSize: 13, padding: "8px 16px", width: "auto" }}>
                      🔄 Re-detect
                    </button>
                  </div>
                )}

                {locStatus === "error" && (
                  <div>
                    <div style={{ color: "#c53030", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
                      ⚠️ Could not get location. You can skip this and add it later from your dashboard.
                    </div>
                    <button className="loc-btn" onClick={requestLocation}>Try Again</button>
                  </div>
                )}
              </div>

              {(locStatus === "error" || locStatus === "idle") && (
                <div style={s.skipNote}>
                  Location is optional — you can add it from your dashboard later.
                </div>
              )}

              <div style={s.btnGroup}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { reset(); setStep(2); }}>← Back</button>
                <button className="btn-primary" onClick={handleRegister} disabled={loading} style={{ flex: 2 }}>
                  {loading ? "Creating account…" : "Create Account ✓"}
                </button>
              </div>

              <p style={s.disclaimer}>
                Your profile will show as <strong>unverified</strong> until the TeleCare team reviews your license. You can still receive and respond to patient requests.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const BLUE  = "#1a4a7a";
const CREAM = "#f0f5fb";
const SERIF = "'Lora', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

const s: Record<string, React.CSSProperties> = {
  root:  { display: "flex", minHeight: "100vh", fontFamily: SANS, background: CREAM },

  left:      { width: 420, background: BLUE, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "60px 48px", flexShrink: 0 },
  leftInner: { position: "relative", zIndex: 2, width: "100%" },
  leftLogo:  { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  logoMark:  { width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 },
  logoText:  { fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: "white" },
  leftBadge: { display: "inline-block", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "4px 12px", borderRadius: 20, marginBottom: 28 },
  leftQuote: { fontFamily: SERIF, fontSize: 17, color: "rgba(255,255,255,.88)", lineHeight: 1.7, marginBottom: 40, fontStyle: "italic" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 },
  statBox:   { background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,.15)" },
  statVal:   { fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "white", marginBottom: 3 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 500 },
  leftFeats: { display: "flex", flexDirection: "column" as const, gap: 10 },
  leftFeat:  { fontSize: 13, color: "rgba(255,255,255,.7)", fontWeight: 500 },
  circle1:   { position: "absolute", bottom: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" },
  circle2:   { position: "absolute", top: -60, right: 60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" },

  mobileLogo:     { alignItems: "center", gap: 10, padding: "18px 24px 0", position: "fixed", top: 0, left: 0, right: 0, background: CREAM, zIndex: 10, borderBottom: "1px solid #dbe8f5", height: 56 },
  mobileLogoMark: { width: 30, height: 30, borderRadius: 8, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 },
  mobileLogoText: { fontFamily: SERIF, fontWeight: 700, fontSize: 14, color: BLUE },

  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: CREAM },
  card:  { width: "100%", maxWidth: 500, background: "white", borderRadius: 20, padding: "36px 36px 32px", boxShadow: "0 4px 40px rgba(26,74,122,.1), 0 0 0 1px rgba(26,74,122,.06)" },

  tabs: { display: "flex", borderBottom: "1px solid #e8f0fb", marginBottom: 28 },
  tab:  { flex: 1, padding: "11px 0", background: "none", border: "none", fontSize: 15, fontFamily: SANS, letterSpacing: "-.2px", textTransform: "capitalize" as const },

  heading:  { marginBottom: 20 },
  roleChip: { display: "inline-block", background: "#eff6ff", color: BLUE, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 10, border: "1px solid #bfdbfe" },
  h1:       { fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#0f1a2e", marginBottom: 6 },
  sub:      { fontSize: 14, color: "#718096" },

  stepBar: { display: "flex", gap: 6, marginBottom: 24 },
  stepSeg: { flex: 1, height: 3, borderRadius: 4, transition: "background .3s" },

  errorBox: { background: "#fff5f5", border: "1px solid #fed7d7", color: "#c53030", borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 16 },

  form:       { display: "flex", flexDirection: "column" as const, gap: 16 },
  field:      { display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 },
  label:      { fontSize: 13, fontWeight: 600, color: "#4a5568" },
  btnGroup:   { display: "flex", gap: 10, marginTop: 4 },
  switchText: { fontSize: 13, color: "#718096", textAlign: "center" as const, marginTop: 4 },
  switchLink: { color: BLUE, fontWeight: 600, cursor: "pointer" },
  disclaimer: { fontSize: 11, color: "#a0aec0", textAlign: "center" as const, lineHeight: 1.6, marginTop: 4 },
  divider:    { display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#a0aec0", margin: "4px 0" },

  // Location step
  locCard:    { background: "#f8fbff", border: "1.5px solid #bfdbfe", borderRadius: 16, padding: "28px 24px", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center" },
  locRow:     { display: "flex", alignItems: "center", gap: 10, justifyContent: "center" },
  locSuccess: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  skipNote:   { fontSize: 12, color: "#a0aec0", textAlign: "center" as const },
};