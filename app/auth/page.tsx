"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Mode = "login" | "register";
type Step = 1 | 2; // register has 2 steps

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── form fields ──────────────────────────────────────────────
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [age, setAge]           = useState("");
  const [gender, setGender]     = useState("male");
  const [village, setVillage]   = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("english");
  // ── redirect if already logged in ──────────────────────────
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) router.replace("/dashboard");
  };
  checkSession();
}, []);

  // ── helpers ──────────────────────────────────────────────────
  const reset = () => {
    setError(""); setSuccess("");
  };

  const switchMode = (m: Mode) => {
    reset(); setMode(m); setStep(1);
  };

  // ── LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    reset();
    if (!email || !password) return setError("Please fill all fields.");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) return setError(err.message);
    router.replace("/dashboard");
  };

  // ── REGISTER step 1 → step 2 ──────────────────────────────────
  const handleStep1 = () => {
    reset();
    if (!email || !password || !fullName || !phone)
      return setError("Please fill all required fields.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    setStep(2);
  };

  

// ── REGISTER step 2 → create account ─────────────────────────
const handleRegister = async () => {
  reset();
  setLoading(true);

  // 1. Create auth user
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authErr || !authData.user) {
    setLoading(false);
    return setError(authErr?.message || "Signup failed.");
  }

  // 2. Sign in immediately so session is active
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    setLoading(false);
    return setError(signInErr.message);
  }

  // 3. NOW insert patient profile (auth.uid() is active)
  const { error: dbErr } = await supabase.from("patients").insert({
    id: authData.user.id,
    full_name: fullName,
    phone,
    age: age ? parseInt(age) : null,
    gender,
    village: village || null,
    district: district || null,
    language,
  });

  setLoading(false);

  if (dbErr) return setError(dbErr.message);
// 4. Go straight to dashboard
  router.replace("/dashboard");
};


  // ─────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2d9ce;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          background: #fdfaf7;
          color: #1a202c;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .auth-input:focus {
          border-color: #1a5c45;
          box-shadow: 0 0 0 3px rgba(26,92,69,.1);
          background: white;
        }
        .auth-input::placeholder { color: #a0aec0; }

        select.auth-input { cursor: pointer; }

        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #1a5c45;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background .2s, transform .1s, box-shadow .2s;
          box-shadow: 0 6px 20px rgba(26,92,69,.25);
        }
        .btn-primary:hover:not(:disabled) {
          background: #155238;
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(26,92,69,.3);
        }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }

        .btn-ghost {
          width: 100%;
          padding: 13px;
          background: transparent;
          color: #1a5c45;
          border: 1.5px solid #1a5c45;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background .2s;
        }
        .btn-ghost:hover { background: rgba(26,92,69,.06); }

        .tab { cursor: pointer; transition: color .2s; }
        .tab:hover { color: #1a5c45; }

        .card { animation: fadeUp .45s ease both; }
      `}</style>

      {/* ── left panel (decorative) ── */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.leftLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>

          <div style={s.leftQuote}>
            "Healthcare should reach every home, <br />
            not just every city."
          </div>

          <div style={s.statsGrid}>
            {[
              { val: "10k+", label: "Patients" },
              { val: "< 3min", label: "Response" },
              { val: "20+", label: "Languages" },
              { val: "Free", label: "Always" },
            ].map(stat => (
              <div key={stat.label} style={s.statBox}>
                <div style={s.statVal}>{stat.val}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={s.leftFeats}>
            {[
              "✓ Works offline on 2G",
              "✓ Voice symptom input",
              "✓ Hindi & regional languages",
              "✓ Private & secure",
            ].map(f => (
              <div key={f} style={s.leftFeat}>{f}</div>
            ))}
          </div>
        </div>
        {/* decorative circles */}
        <div style={s.circle1} />
        <div style={s.circle2} />
      </div>

      {/* ── right panel (form) ── */}
      <div style={s.right}>
        <div style={s.card} className="card">

          {/* tabs */}
          <div style={s.tabs}>
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                className="tab"
                style={{
                  ...s.tab,
                  color: mode === m ? "#1a5c45" : "#a0aec0",
                  borderBottom: mode === m ? "2px solid #1a5c45" : "2px solid transparent",
                  fontWeight: mode === m ? 700 : 500,
                }}
                onClick={() => switchMode(m)}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* heading */}
          <div style={s.heading}>
            {mode === "login" ? (
              <>
                <h1 style={s.h1}>Welcome back 👋</h1>
                <p style={s.sub}>Sign in to your CareConnect account</p>
              </>
            ) : step === 1 ? (
              <>
                <h1 style={s.h1}>Create account</h1>
                <p style={s.sub}>Step 1 of 2 — Basic details</p>
              </>
            ) : (
              <>
                <h1 style={s.h1}>Almost there!</h1>
                <p style={s.sub}>Step 2 of 2 — Your location & preferences</p>
              </>
            )}
          </div>

          {/* step indicator for register */}
          {mode === "register" && (
            <div style={s.stepBar}>
              <div style={{ ...s.stepSegment, background: "#1a5c45" }} />
              <div style={{ ...s.stepSegment, background: step === 2 ? "#1a5c45" : "#e2d9ce" }} />
            </div>
          )}

          {/* error / success */}
          {error && <div style={s.errorBox}>⚠️ {error}</div>}
          {success && <div style={s.successBox}>✅ {success}</div>}

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <div style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>

              <p style={s.switchText}>
                Don't have an account?{" "}
                <span
                  style={s.switchLink}
                  onClick={() => switchMode("register")}
                >
                  Register free
                </span>
              </p>
            </div>
          )}

          {/* ── REGISTER STEP 1 ── */}
          {mode === "register" && step === 1 && (
            <div style={s.form}>
              <div style={s.fieldRow}>
                <div style={s.field}>
                  <label style={s.label}>Full Name *</label>
                  <input
                    className="auth-input"
                    placeholder="Ravi Kumar"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone *</label>
                  <input
                    className="auth-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Email address *</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Password * (min 6 chars)</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <button className="btn-primary" onClick={handleStep1}>
                Continue →
              </button>

              <p style={s.switchText}>
                Already have an account?{" "}
                <span style={s.switchLink} onClick={() => switchMode("login")}>
                  Sign in
                </span>
              </p>
            </div>
          )}

          {/* ── REGISTER STEP 2 ── */}
          {mode === "register" && step === 2 && (
            <div style={s.form}>
              <div style={s.fieldRow}>
                <div style={s.field}>
                  <label style={s.label}>Age</label>
                  <input
                    className="auth-input"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Gender</label>
                  <select
                    className="auth-input"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={s.fieldRow}>
                <div style={s.field}>
                  <label style={s.label}>Village / Town</label>
                  <input
                    className="auth-input"
                    placeholder="Rampur"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>District</label>
                  <input
                    className="auth-input"
                    placeholder="Lucknow"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Preferred Language</label>
                <select
                  className="auth-input"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {["english", "hindi", "tamil", "telugu", "marathi", "punjabi", "bengali"].map(l => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={s.btnGroup}>
                <button
                  className="btn-ghost"
                  onClick={() => { reset(); setStep(1); }}
                >
                  ← Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRegister}
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? "Creating account…" : "Create Account ✓"}
                </button>
              </div>

              <p style={s.disclaimer}>
                By registering, you agree that this service is for informational
                purposes only and not a substitute for professional medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const GREEN   = "#1a5c45";
const CREAM   = "#f7f3ee";
const SERIF   = "'Lora', Georgia, serif";
const SANS    = "'DM Sans', system-ui, sans-serif";

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex", minHeight: "100vh",
    fontFamily: SANS, background: CREAM,
  },

  // Left decorative panel
  left: {
    width: 420, background: GREEN, position: "relative",
    overflow: "hidden", display: "flex", alignItems: "center",
    padding: "60px 48px",
    flexShrink: 0,
  },
  leftInner: { position: "relative", zIndex: 2, width: "100%" },
  leftLogo: { display: "flex", alignItems: "center", gap: 12, marginBottom: 56 },
  logoMark: {
    width: 38, height: 38, borderRadius: 10,
    background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontWeight: 700, fontSize: 18,
  },
  logoText: { fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: "white" },
  leftQuote: {
    fontFamily: SERIF, fontSize: 19, color: "rgba(255,255,255,.9)",
    lineHeight: 1.65, marginBottom: 48, fontStyle: "italic",
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40,
  },
  statBox: {
    background: "rgba(255,255,255,.1)", borderRadius: 12,
    padding: "16px 18px", border: "1px solid rgba(255,255,255,.15)",
  },
  statVal: { fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "white", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 500 },
  leftFeats: { display: "flex", flexDirection: "column" as const, gap: 10 },
  leftFeat: { fontSize: 13, color: "rgba(255,255,255,.75)", fontWeight: 500 },
  circle1: {
    position: "absolute", bottom: -80, right: -80,
    width: 260, height: 260, borderRadius: "50%",
    background: "rgba(255,255,255,.06)", pointerEvents: "none",
  },
  circle2: {
    position: "absolute", top: -60, right: 60,
    width: 160, height: 160, borderRadius: "50%",
    background: "rgba(255,255,255,.04)", pointerEvents: "none",
  },

  // Right form panel
  right: {
    flex: 1, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "40px 32px",
    background: CREAM,
  },
  card: {
    width: "100%", maxWidth: 480,
    background: "white", borderRadius: 20,
    padding: "40px 40px 36px",
    boxShadow: "0 4px 40px rgba(0,0,0,.08), 0 0 0 1px rgba(26,92,69,.06)",
  },

  // Tabs
  tabs: {
    display: "flex", gap: 0, borderBottom: "1px solid #f0ebe3",
    marginBottom: 28,
  },
  tab: {
    flex: 1, padding: "10px 0", background: "none", border: "none",
    fontSize: 15, fontFamily: SANS, letterSpacing: "-.2px",
    textTransform: "capitalize" as const,
  },

  // Heading
  heading: { marginBottom: 20 },
  h1: { fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#0f1a10", marginBottom: 6 },
  sub: { fontSize: 14, color: "#718096" },

  // Step bar
  stepBar: { display: "flex", gap: 6, marginBottom: 24 },
  stepSegment: { flex: 1, height: 3, borderRadius: 4, transition: "background .3s" },

  // Alerts
  errorBox: {
    background: "#fff5f5", border: "1px solid #fed7d7",
    color: "#c53030", borderRadius: 10, padding: "12px 16px",
    fontSize: 13, marginBottom: 16,
  },
  successBox: {
    background: "#f0fff4", border: "1px solid #9ae6b4",
    color: "#276749", borderRadius: 10, padding: "12px 16px",
    fontSize: 13, marginBottom: 16,
  },

  // Form
  form: { display: "flex", flexDirection: "column" as const, gap: 16 },
  field: { display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 },
  fieldRow: { display: "flex", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#4a5568" },
  btnGroup: { display: "flex", gap: 10, marginTop: 4 },

  // Footer text
  switchText: { fontSize: 13, color: "#718096", textAlign: "center" as const, marginTop: 4 },
  switchLink: { color: GREEN, fontWeight: 600, cursor: "pointer" },
  disclaimer: {
    fontSize: 11, color: "#a0aec0", textAlign: "center" as const,
    lineHeight: 1.6, marginTop: 4,
  },
};