"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  return m;
}

export default function TeleHealthLanding() {
  const mounted = useMounted();
  const [activeStep, setActiveStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: patient } = await supabase
          .from("patients").select("full_name")
          .eq("id", session.user.id).single();
        if (patient) setUserName(patient.full_name);
      }
    };
    checkUser();
  }, []);

  const goAuth = () => router.push(userName ? "/dashboard" : "/auth");

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #f7f3ee; }

        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        @keyframes scroll-x {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }

        .nav-link {
          color: #4a5568; text-decoration: none;
          font-size: 15px; font-weight: 500; transition: color .2s;
          display: block; padding: 16px 24px; border-bottom: 1px solid #f7f3ee;
        }
        .nav-link:hover { color: #1a5c45; }
        .feat-card { transition: transform .25s, box-shadow .25s; }
        .feat-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(26,92,69,.12) !important; }
        .badge-pulse::after {
          content: ''; position: absolute; inset: -3px; border-radius: 50%;
          border: 2px solid #1a5c45; animation: pulse-ring 1.8s ease-out infinite;
        }

        /* ── DESKTOP LAYOUT ── */
        .d-flex   { display: flex; }
        .d-none   { display: none; }
        .hero-row { display: flex; align-items: center; gap: 52px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .feat-grid  { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .cta-btns   { display: flex; gap: 12px; justify-content: center; }

        /* ══════ MOBILE ══════ */
        @media (max-width: 700px) {
          /* Show/hide helpers */
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }

          /* Mobile menu */
          .mobile-menu {
            position: fixed; top: 56px; left: 0; right: 0; bottom: 0;
            background: white; z-index: 98;
            padding: 8px 0 60px; overflow-y: auto;
            display: flex; flex-direction: column;
            border-top: 1px solid #e8e0d5;
          }
          .mob-cta-btn {
            margin: 16px 20px 0;
            background: #1a5c45; color: white; border: none; border-radius: 12px;
            padding: 15px; font-size: 16px; font-weight: 600;
            font-family: 'DM Sans', sans-serif; cursor: pointer;
            width: calc(100% - 40px); text-align: center;
          }
          .mob-sec-btn {
            margin: 10px 20px 0;
            background: transparent; color: #1a5c45; border: 1.5px solid #1a5c45; border-radius: 12px;
            padding: 14px; font-size: 15px; font-weight: 600;
            font-family: 'DM Sans', sans-serif; cursor: pointer;
            width: calc(100% - 40px);
          }

          /* Hero stacks vertically */
          .hero-row { flex-direction: column !important; gap: 28px !important; text-align: center; }
          .hero-left { align-items: center !important; }
          .hero-tag, .trust-row { justify-content: center !important; }
          .hero-btns { justify-content: center !important; }
          .hero-btns button { flex: 1; }
          .hero-card-col { width: 100% !important; align-items: center !important; }
          .float-card { max-width: 100% !important; }
          .mini-stat { align-self: center !important; }

          /* Grids collapse */
          .steps-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .feat-wide  { grid-column: span 1 !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }

          /* Section spacing */
          .sec { padding: 48px 18px !important; }
          .hero-sec { padding-top: 72px !important; padding-bottom: 36px !important; }

          /* CTA */
          .cta-inner { padding: 32px 18px !important; border-radius: 18px !important; }
          .cta-btns  { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns button { width: 100% !important; }

          /* Footer */
          .foot-inner { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .foot-note  { text-align: left !important; }
        }
      `}</style>

      <div style={s.noise} />

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>✚</div>
            <span style={s.logoText}>CareConnect</span>
          </div>

          {/* Desktop links */}
          <div className="d-flex desktop-only" style={{ gap: 32 }}>
            <a href="#features" className="nav-link" style={{ padding: 0, display: "inline" }}>Features</a>
            <a href="#how"      className="nav-link" style={{ padding: 0, display: "inline" }}>How It Works</a>
            <a href="#about"    className="nav-link" style={{ padding: 0, display: "inline" }}>About</a>
          </div>

          {/* Desktop buttons */}
          <div className="d-flex desktop-only" style={{ gap: 10, alignItems: "center" }}>
            {userName ? (
              <>
                <button style={s.navSignIn} onClick={() => router.push("/dashboard")}>👤 {userName.split(" ")[0]}</button>
                <button style={s.navCta}    onClick={() => router.push("/dashboard")}>Dashboard →</button>
              </>
            ) : (
              <>
                <button style={s.navSignIn} onClick={() => router.push("/auth")}>Sign In</button>
                <button style={s.navCta}    onClick={() => router.push("/auth")}>Get Started Free</button>
              </>
            )}
          </div>

          {/* Mobile right: name + hamburger */}
          <div className="d-none mobile-only" style={{ alignItems: "center", gap: 10 }}>
            {userName && (
              <button style={s.navSignIn} onClick={() => router.push("/dashboard")}>
                👤 {userName.split(" ")[0]}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 24, color: "#1a5c45", lineHeight: 1 }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile full-screen menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how"      className="nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#about"    className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
            <button className="mob-cta-btn" onClick={() => { goAuth(); setMenuOpen(false); }}>
              {userName ? "Go to Dashboard →" : "Get Started Free →"}
            </button>
            {!userName && (
              <button className="mob-sec-btn" onClick={() => { router.push("/auth"); setMenuOpen(false); }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="hero-sec" style={{ ...s.hero, ...(mounted ? s.heroVisible : {}) }}>
        <div style={s.blob1} />
        <div style={s.blob2} />
        <div style={s.wrap}>
          <div className="hero-row">

            {/* Text */}
            <div className="hero-left" style={s.heroLeft}>
              <div style={s.heroTag} className="hero-tag">
                <span style={s.tagDot} className="badge-pulse" />
                <span>Live · Available 24/7</span>
              </div>
              <h1 style={s.heroH1}>
                Healthcare for<br />
                <span style={{ color: "#1a5c45" }}>every village,</span><br />
                every family.
              </h1>
              <p style={s.heroP}>
                Connect with certified doctors from home — even on 2G.
                Check symptoms, store records, find medicines nearby.
              </p>
              <div className="hero-btns" style={s.heroBtns}>
                <button style={s.btnPrimary} onClick={goAuth}>
                  🩺 {userName ? "Go to Dashboard" : "Start Free Consultation"}
                </button>
                <button style={s.btnOutline}>▶ Watch Demo</button>
              </div>
              <div className="trust-row" style={s.trustRow}>
                {["Works offline", "Hindi · English", "Free forever"].map(t => (
                  <span key={t} style={s.trustChip}>✓ {t}</span>
                ))}
              </div>
            </div>

            {/* Float card */}
            <div className="hero-card-col" style={s.heroRight}>
              <div className="float-card" style={{ ...s.floatCard, animation: "float 5s ease-in-out infinite" }}>
                <div style={s.fcHeader}>
                  <div style={s.fcAvatar}>👨‍⚕️</div>
                  <div>
                    <div style={s.fcName}>Dr. Arjun Mehta</div>
                    <div style={s.fcSpec}>General Physician · Available now</div>
                  </div>
                  <div style={s.fcBadge}>LIVE</div>
                </div>
                <div style={s.fcDivider} />
                <div style={s.fcRows}>
                  {[
                    { icon: "🌡️", label: "Fever & Cold", time: "< 2 min" },
                    { icon: "💊", label: "Prescription",  time: "< 5 min" },
                    { icon: "🩸", label: "Lab Review",    time: "< 3 min" },
                  ].map(r => (
                    <div key={r.label} style={s.fcRow}>
                      <span>{r.icon}</span>
                      <span style={s.fcRowLabel}>{r.label}</span>
                      <span style={s.fcRowTime}>{r.time}</span>
                    </div>
                  ))}
                </div>
                <button style={s.fcBtn} onClick={goAuth}>Book Consultation →</button>
              </div>
              <div className="mini-stat" style={s.miniStat}>
                <div style={s.miniStatNum}>12,400+</div>
                <div style={s.miniStatLabel}>Consultations Done</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STRIP ── */}
      <div style={s.strip}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 48, whiteSpace: "nowrap" as const, flexShrink: 0, animation: "scroll-x 20s linear infinite" }}>
            {[...Array(2)].map((_, gi) =>
              ["AIIMS Delhi", "Max Healthcare", "Apollo", "Fortis Health", "Govt. Hospital", "Rural Health Mission", "WHO Certified"].map(name => (
                <span key={`${gi}-${name}`} style={s.stripItem}>{name}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="sec" style={s.sec}>
        <div style={s.wrap}>
          <div style={s.eyebrow}>Simple · Fast · Reliable</div>
          <h2 style={s.h2}>Three steps to a consultation</h2>
          <div className="steps-grid">
            {[
              { n: "01", icon: "📋", color: "#1a5c45", title: "Describe Symptoms", desc: "Type, speak, or upload your lab report. Works in Hindi, Tamil, Telugu & more." },
              { n: "02", icon: "🤖", color: "#b45309", title: "AI Pre-Screening",  desc: "Our checker flags urgent cases and suggests the right specialist instantly." },
              { n: "03", icon: "👨‍⚕️", color: "#1e40af", title: "Talk to a Doctor",  desc: "Connect via chat or audio. Get prescription & follow-up reminders." },
            ].map((step, i) => (
              <div key={step.n} style={{
                ...s.stepCard,
                borderTop: `4px solid ${step.color}`,
                opacity: activeStep === i ? 1 : 0.7,
                transform: activeStep === i ? "scale(1.02)" : "scale(1)",
                transition: "opacity .4s, transform .4s",
              }}>
                <div style={{ ...s.stepNum, color: step.color }}>{step.n}</div>
                <div style={s.stepIcon}>{step.icon}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="sec" style={{ ...s.sec, position: "relative" as const }}>
        <div style={s.featBg} />
        <div style={s.wrap}>
          <div style={s.eyebrow}>Built for India's last mile</div>
          <h2 style={s.h2}>Everything your community needs</h2>
          <div className="feat-grid">
            {[
              { icon: "📶", title: "Offline-First",    desc: "Works on 2G. Queue consultations offline, sync when signal returns.",   color: "#1a5c45", wide: true  },
              { icon: "🗣️", title: "Voice Input",      desc: "Speak symptoms in your language. No typing needed.",                     color: "#b45309", wide: false },
              { icon: "💊", title: "Medicine Finder",  desc: "Check pharmacy stock nearby. Get alternatives if unavailable.",         color: "#1e40af", wide: false },
              { icon: "📁", title: "Health Records",   desc: "Every visit, prescription, and report saved securely — forever.",       color: "#7c3aed", wide: false },
              { icon: "🚨", title: "Emergency Triage", desc: "Instant escalation to nearest hospital for critical symptoms.",         color: "#dc2626", wide: false },
              { icon: "🔒", title: "100% Private",     desc: "Your data stays on your device unless you choose to share.",            color: "#0891b2", wide: true  },
            ].map(f => (
              <div
                key={f.title}
                className={`feat-card${f.wide ? " feat-wide" : ""}`}
                style={{ ...s.featCard, gridColumn: f.wide ? "span 2" : "span 1", borderLeft: `4px solid ${f.color}` }}
              >
                <div style={{ ...s.featIcon, background: f.color + "18" }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                </div>
                <div style={s.featTitle}>{f.title}</div>
                <div style={s.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="sec" style={s.sec}>
        <div style={s.wrap}>
          <div className="stats-grid">
            {[
              { val: "10,000+", label: "Patients Helped",    icon: "🧑‍🤝‍🧑" },
              { val: "< 3 min", label: "Avg. Response Time", icon: "⚡" },
              { val: "20+",     label: "Languages",          icon: "🗣️" },
              { val: "99.2%",   label: "Satisfaction",       icon: "⭐" },
            ].map(st => (
              <div key={st.label} style={s.statBlock}>
                <div style={s.statEmoji}>{st.icon}</div>
                <div style={s.statVal}>{st.val}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="sec" style={s.sec}>
        <div style={s.wrap}>
          <div className="cta-inner" style={s.ctaCard}>
            <div style={s.ctaOrb} />
            <div style={s.eyebrowLight}>Free · No credit card · No signup</div>
            <h2 style={s.ctaH2}>Start your first<br />consultation today</h2>
            <p style={s.ctaP}>Book a doctor or use our AI symptom checker — right from your phone, anywhere in India.</p>
            <div className="cta-btns">
              <button style={s.ctaBtnPrimary} onClick={goAuth}>
                🩺 {userName ? "Open Dashboard" : "Get Started Free"}
              </button>
              <button style={s.ctaBtnOutline}>Learn more →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div className="foot-inner" style={s.footInner}>
          <div style={s.footLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, color: "#1a5c45", fontSize: 16 }}>CareConnect</span>
          </div>
          <p className="foot-note" style={s.footNote}>
            For informational purposes only. Not a substitute for professional medical advice.
          </p>
          <div style={s.footLinks}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={s.footLink}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GREEN       = "#1a5c45";
const GREEN_LIGHT = "#e8f5f0";
const AMBER       = "#b45309";
const CREAM       = "#f7f3ee";
const CARD        = "#ffffff";
const SERIF       = "'Lora', Georgia, serif";
const SANS        = "'DM Sans', system-ui, sans-serif";

const s: Record<string, React.CSSProperties> = {
  root:  { fontFamily: SANS, background: CREAM, color: "#1a202c", minHeight: "100vh", overflowX: "hidden" },
  noise: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")", opacity: 0.4 },
  wrap:  { maxWidth: 1160, margin: "0 auto", padding: "0 20px" },

  // Nav
  nav:       { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(16px)", background: "rgba(247,243,238,0.95)", borderBottom: "1px solid rgba(26,92,69,0.1)" },
  navInner:  { maxWidth: 1160, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:      { display: "flex", alignItems: "center", gap: 9 },
  logoMark:  { width: 32, height: 32, borderRadius: 9, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  logoText:  { fontFamily: SERIF, fontWeight: 700, fontSize: 17, color: GREEN },
  navSignIn: { background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS },
  navCta:    { background: GREEN, border: "none", color: "white", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 14px rgba(26,92,69,.25)" },

  // Hero
  hero:        { paddingTop: 80, paddingBottom: 60, position: "relative", overflow: "hidden", opacity: 0, transform: "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" },
  heroVisible: { opacity: 1, transform: "translateY(0)" },
  blob1: { position: "absolute", top: -80,  right: -100, width: 440, height: 440, borderRadius: "60% 40% 50% 70%", background: "radial-gradient(circle, rgba(26,92,69,.08) 0%, transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -80, left: -60, width: 340, height: 340, borderRadius: "50% 60% 40% 70%", background: "radial-gradient(circle, rgba(180,83,9,.06) 0%, transparent 70%)",  pointerEvents: "none" },

  heroLeft:  { flex: 1.1, display: "flex", flexDirection: "column", gap: 20 },
  heroRight: { flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 },
  heroTag:   { display: "inline-flex", alignItems: "center", gap: 9, background: GREEN_LIGHT, border: `1px solid ${GREEN}33`, color: GREEN, padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, width: "fit-content", position: "relative" },
  tagDot:    { width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0, position: "relative" },
  heroH1:    { fontFamily: SERIF, fontSize: "clamp(28px, 7vw, 60px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#0f1a10" },
  heroP:     { fontSize: 15, color: "#4a5568", lineHeight: 1.8, maxWidth: 460 },
  heroBtns:  { display: "flex", gap: 10, flexWrap: "wrap" as const },
  btnPrimary:{ background: GREEN, color: "white", border: "none", padding: "13px 22px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: SANS, boxShadow: "0 8px 24px rgba(26,92,69,.28)" },
  btnOutline:{ background: "transparent", color: "#1a202c", border: "1.5px solid #cbd5e0", padding: "13px 22px", borderRadius: 12, fontSize: 15, cursor: "pointer", fontFamily: SANS },
  trustRow:  { display: "flex", gap: 8, flexWrap: "wrap" as const },
  trustChip: { fontSize: 12, color: "#4a5568", background: "#edf2f7", padding: "4px 10px", borderRadius: 20, fontWeight: 500 },

  floatCard:     { background: CARD, borderRadius: 18, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.1), 0 0 0 1px rgba(26,92,69,.08)", width: "100%", maxWidth: 360 },
  fcHeader:      { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  fcAvatar:      { fontSize: 28, width: 44, height: 44, background: GREEN_LIGHT, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  fcName:        { fontFamily: SERIF, fontWeight: 700, fontSize: 14, color: "#1a202c" },
  fcSpec:        { fontSize: 11, color: "#718096", marginTop: 2 },
  fcBadge:       { marginLeft: "auto", background: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, border: "1px solid #86efac", letterSpacing: 1, flexShrink: 0 },
  fcDivider:     { height: 1, background: "#f0f0f0", marginBottom: 12 },
  fcRows:        { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 },
  fcRow:         { display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "#fafaf9", borderRadius: 9, border: "1px solid #f0ede8" },
  fcRowLabel:    { flex: 1, fontSize: 13, color: "#2d3748", fontWeight: 500 },
  fcRowTime:     { fontSize: 11, color: GREEN, fontWeight: 600, background: GREEN_LIGHT, padding: "2px 7px", borderRadius: 7 },
  fcBtn:         { width: "100%", background: GREEN, color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS },
  miniStat:      { background: CARD, borderRadius: 12, padding: "12px 18px", boxShadow: "0 6px 20px rgba(0,0,0,.08)", border: `1px solid ${GREEN}20`, alignSelf: "flex-end" },
  miniStatNum:   { fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: GREEN },
  miniStatLabel: { fontSize: 11, color: "#718096", marginTop: 2 },

  strip:     { background: CARD, borderTop: "1px solid #e8e0d5", borderBottom: "1px solid #e8e0d5", padding: "12px 0", overflow: "hidden" },
  stripItem: { fontSize: 12, fontWeight: 600, color: "#9ba8a0", letterSpacing: "0.5px", textTransform: "uppercase" as const },

  sec:     { padding: "76px 20px" },
  featBg:  { position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, rgba(26,92,69,.03) 0%, transparent 100%)", pointerEvents: "none" as const },

  eyebrow:      { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: AMBER, marginBottom: 12 },
  eyebrowLight: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: `${GREEN}cc`, marginBottom: 12 },
  h2:           { fontFamily: SERIF, fontSize: "clamp(22px, 5vw, 42px)", fontWeight: 700, marginBottom: 36, letterSpacing: "-0.5px", color: "#0f1a10" },

  stepCard:  { background: CARD, borderRadius: 14, padding: "22px 18px", boxShadow: "0 3px 14px rgba(0,0,0,.06)" },
  stepNum:   { fontFamily: SERIF, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 },
  stepIcon:  { fontSize: 30, marginBottom: 10 },
  stepTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#1a202c" },
  stepDesc:  { fontSize: 13, color: "#718096", lineHeight: 1.75 },

  featCard:  { background: CARD, borderRadius: 14, padding: "20px 18px", boxShadow: "0 3px 12px rgba(0,0,0,.05)" },
  featIcon:  { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  featTitle: { fontFamily: SERIF, fontSize: 15, fontWeight: 700, marginBottom: 7, color: "#1a202c" },
  featDesc:  { fontSize: 13, color: "#718096", lineHeight: 1.7 },

  statBlock: { background: CARD, border: `1px solid ${GREEN}20`, borderRadius: 14, padding: "22px 14px", textAlign: "center" as const, boxShadow: "0 3px 12px rgba(26,92,69,.04)" },
  statEmoji: { fontSize: 26, marginBottom: 8 },
  statVal:   { fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: GREEN, marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#718096", fontWeight: 500 },

  ctaCard:       { maxWidth: 720, margin: "0 auto", background: GREEN, borderRadius: 24, padding: "56px 44px", textAlign: "center" as const, position: "relative" as const, overflow: "hidden", boxShadow: "0 20px 56px rgba(26,92,69,.32)" },
  ctaOrb:        { position: "absolute" as const, top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" as const },
  ctaH2:         { fontFamily: SERIF, fontSize: "clamp(22px, 6vw, 42px)", fontWeight: 700, color: "white", marginBottom: 14, letterSpacing: "-0.5px" },
  ctaP:          { fontSize: 15, color: "rgba(255,255,255,.7)", lineHeight: 1.8, marginBottom: 28 },
  ctaBtnPrimary: { background: "white", color: GREEN, border: "none", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: SANS, boxShadow: "0 4px 16px rgba(0,0,0,.12)" },
  ctaBtnOutline: { background: "transparent", color: "rgba(255,255,255,.85)", border: "1.5px solid rgba(255,255,255,.3)", padding: "14px 28px", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: SANS },

  footer:    { borderTop: "1px solid #e8e0d5", padding: "28px 20px", background: "#f0ebe3" },
  footInner: { maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const },
  footLogo:  { display: "flex", alignItems: "center", gap: 9 },
  footNote:  { fontSize: 12, color: "#9ba8a0", maxWidth: 340, textAlign: "center" as const, lineHeight: 1.6 },
  footLinks: { display: "flex", gap: 20 },
  footLink:  { fontSize: 13, color: "#718096", textDecoration: "none" } as React.CSSProperties,
};