"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase'
// ─── tiny hook: mount animation ───────────────────────────────────────────────
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  return m;
}

export default function TeleHealthLanding() {
  const mounted = useMounted();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={s.root}>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #f7f3ee; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0;   }
        }
        @keyframes scroll-x {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .nav-link { color: #4a5568; text-decoration: none; font-size: 14px; font-weight: 500; transition: color .2s; }
        .nav-link:hover { color: #1a5c45; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(26,92,69,.12) !important; }
        .feat-card { transition: transform .25s, box-shadow .25s; }
        .stat-pill:hover { background: #1a5c45 !important; color: white !important; }
        .stat-pill { transition: background .2s, color .2s; }
        .badge-pulse::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid #1a5c45;
          animation: pulse-ring 1.8s ease-out infinite;
        }
        section { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
        section.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* ─────────────── NOISE TEXTURE OVERLAY ─────────────── */}
      <div style={s.noise} />

      {/* ─────────────── NAV ─────────────── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <span style={{ fontSize: 16 }}>✚</span>
            </div>
            <span style={s.logoText}>CareConnect</span>
          </div>
          <div style={s.navLinks}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How It Works</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <div style={s.navRight}>
            <button style={s.navSignIn}>Sign In</button>
            <button style={s.navCta}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section
        style={{ ...s.hero, ...(mounted ? s.heroVisible : {}) }}
        className={mounted ? "visible" : ""}
      >
        {/* decorative blobs */}
        <div style={s.blob1} />
        <div style={s.blob2} />

        <div style={s.heroInner}>
          {/* left column */}
          <div style={s.heroLeft}>
            <div style={s.heroTag}>
              <span style={s.tagDot} className="badge-pulse" />
              <span>Live · Available 24/7</span>
            </div>

            <h1 style={s.heroH1}>
              Healthcare for<br />
              <span style={s.heroAccent}>every village,</span><br />
              every family.
            </h1>

            <p style={s.heroP}>
              Connect with certified doctors from home — even with low internet.
              Check symptoms, store medical records, find medicines nearby.
            </p>

            <div style={s.heroBtns}>
              <button style={s.btnPrimary}>🩺 Start Free Consultation</button>
              <button style={s.btnOutline}>▶ Watch Demo</button>
            </div>

            <div style={s.trustRow}>
              {["No signup needed", "Works offline", "Hindi · English · Regional"].map(t => (
                <span key={t} style={s.trustChip}>✓ {t}</span>
              ))}
            </div>
          </div>

          {/* right column — floating card */}
          <div style={s.heroRight}>
            <div style={{ ...s.floatCard, animation: "float 5s ease-in-out infinite" }}>
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
                  { icon: "🌡️", label: "Fever & Cold", time: "< 2 min wait" },
                  { icon: "💊", label: "Prescription Renewal", time: "< 5 min wait" },
                  { icon: "🩸", label: "Blood Report Review", time: "< 3 min wait" },
                ].map(r => (
                  <div key={r.label} style={s.fcRow}>
                    <span>{r.icon}</span>
                    <span style={s.fcRowLabel}>{r.label}</span>
                    <span style={s.fcRowTime}>{r.time}</span>
                  </div>
                ))}
              </div>
              <button style={s.fcBtn}>Book Consultation →</button>
            </div>

            {/* mini floating stat */}
            <div style={s.miniStat}>
              <div style={s.miniStatNum}>12,400+</div>
              <div style={s.miniStatLabel}>Consultations Done</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── SCROLLING LOGOS STRIP ─────────────── */}
      <div style={s.strip}>
        <div style={s.stripInner}>
          <div style={{ ...s.stripTrack, animation: "scroll-x 18s linear infinite" }}>
            {[...Array(2)].map((_, gi) =>
              ["AIIMS Delhi", "Max Healthcare", "Apollo Hospitals",
               "Fortis Health", "Govt. District Hospital", "Rural Health Mission",
               "NHRC Partner", "WHO Certified"].map(name => (
                <span key={`${gi}-${name}`} style={s.stripItem}>{name}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─────────────── HOW IT WORKS ─────────────── */}
      <section id="how" style={s.howSection}>
        <div style={s.sectionInner}>
          <div style={s.eyebrow}>Simple · Fast · Reliable</div>
          <h2 style={s.sectionH2}>Three steps to a consultation</h2>

          <div style={s.stepsRow}>
            {[
              {
                n: "01", icon: "📋", color: "#1a5c45",
                title: "Describe Symptoms",
                desc: "Type, speak, or upload your lab report. Works in Hindi, Tamil, Telugu & more.",
              },
              {
                n: "02", icon: "🤖", color: "#b45309",
                title: "AI Pre-Screening",
                desc: "Our symptom checker flags urgent cases immediately and suggests the right specialist.",
              },
              {
                n: "03", icon: "👨‍⚕️", color: "#1e40af",
                title: "Talk to a Doctor",
                desc: "Connect via chat, audio, or video. Receive prescription & follow-up reminders.",
              },
            ].map((step, i) => (
              <div
                key={step.n}
                style={{
                  ...s.stepCard,
                  borderTop: `4px solid ${step.color}`,
                  opacity: activeStep === i ? 1 : 0.72,
                  transform: activeStep === i ? "scale(1.03)" : "scale(1)",
                  transition: "opacity .4s, transform .4s",
                }}
              >
                <div style={{ ...s.stepNum, color: step.color }}>{step.n}</div>
                <div style={s.stepIcon}>{step.icon}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section id="features" style={s.featSection}>
        <div style={s.featBg} />
        <div style={s.sectionInner}>
          <div style={s.eyebrow}>Built for India's last mile</div>
          <h2 style={s.sectionH2}>Everything your community needs</h2>

          <div style={s.featGrid}>
            {[
              {
                icon: "📶", title: "Offline-First",
                desc: "Works on 2G. Queue consultations offline, auto-sync when signal returns.",
                color: "#1a5c45", wide: true,
              },
              {
                icon: "🗣️", title: "Voice Symptom Input",
                desc: "Speak symptoms in your language. No typing needed.",
                color: "#b45309", wide: false,
              },
              {
                icon: "💊", title: "Medicine Finder",
                desc: "Check stock at local pharmacies. Get alternatives if unavailable.",
                color: "#1e40af", wide: false,
              },
              {
                icon: "📁", title: "Health Records",
                desc: "Every visit, prescription, and report saved securely in one place — forever.",
                color: "#7c3aed", wide: false,
              },
              {
                icon: "🚨", title: "Emergency Triage",
                desc: "Instant escalation to nearest hospital for critical symptoms.",
                color: "#dc2626", wide: false,
              },
              {
                icon: "🔒", title: "100% Private",
                desc: "Your data never leaves your device unless you choose to share.",
                color: "#0891b2", wide: true,
              },
            ].map(f => (
              <div
                key={f.title}
                className="feat-card"
                style={{
                  ...s.featCard,
                  gridColumn: f.wide ? "span 2" : "span 1",
                  borderLeft: `4px solid ${f.color}`,
                }}
              >
                <div style={{ ...s.featIconBox, background: f.color + "18" }}>
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                </div>
                <div style={s.featTitle}>{f.title}</div>
                <div style={s.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── STATS ─────────────── */}
      <section style={s.statsSection}>
        <div style={s.sectionInner}>
          <div style={s.statsGrid}>
            {[
              { val: "10,000+", label: "Patients Helped", icon: "🧑‍🤝‍🧑" },
              { val: "< 3 min", label: "Avg. Response Time", icon: "⚡" },
              { val: "20+", label: "Languages Supported", icon: "🗣️" },
              { val: "99.2%", label: "Patient Satisfaction", icon: "⭐" },
            ].map(s2 => (
              <div key={s2.label} style={s.statBlock}>
                <div style={s.statEmoji}>{s2.icon}</div>
                <div style={s.statVal}>{s2.val}</div>
                <div style={s.statLabel}>{s2.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section style={s.ctaSection}>
        <div style={s.ctaCard}>
          <div style={s.ctaOrb} />
          <div style={s.eyebrowLight}>Free · No credit card · No signup</div>
          <h2 style={s.ctaH2}>
            Start your first<br />consultation today
          </h2>
          <p style={s.ctaP}>
            Click the chat button in the corner to speak with our AI health assistant — or book a real doctor in under a minute.
          </p>
          <div style={s.ctaBtns}>
            <button style={s.ctaBtnPrimary}>🩺 Open Health Chat</button>
            <button style={s.ctaBtnOutline}>Learn more →</button>
          </div>
          <div style={s.ctaNote}>↙ Chat is already open in the corner</div>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <div style={s.logoMark}>✚</div>
            <span style={{ fontFamily: "'Lora', serif", fontWeight: 700, color: "#1a5c45" }}>CareConnect</span>
          </div>
          <div style={s.footerNote}>
            For informational purposes only. Not a substitute for professional medical advice.
          </div>
          <div style={s.footerLinks}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={s.footerLink}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/*
        ── CHATBOT WIDGET ──
        Uncomment this once ChatWidget is ready:
        import ChatWidget from "../components/ChatWidget";
        <ChatWidget />
      */}
    </div>
  );
}


// ─── STYLES ───────────────────────────────────────────────────────────────────
const FONT_SERIF = "'Lora', Georgia, serif";
const FONT_SANS  = "'DM Sans', system-ui, sans-serif";
const GREEN      = "#1a5c45";
const GREEN_LIGHT = "#e8f5f0";
const AMBER      = "#b45309";
const CREAM      = "#f7f3ee";
const CARD_BG    = "#ffffff";

const s: Record<string, React.CSSProperties> = {
  root: { fontFamily: FONT_SANS, background: CREAM, color: "#1a202c", minHeight: "100vh", position: "relative", overflowX: "hidden" },

  // Noise overlay
  noise: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    opacity: 0.4,
  },

  // Nav
  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(16px)", background: "rgba(247,243,238,0.88)", borderBottom: "1px solid rgba(26,92,69,0.1)" },
  navInner: { maxWidth: 1160, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 },
  logoText: { fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 18, color: GREEN },
  navLinks: { display: "flex", gap: 36 },
  navRight: { display: "flex", gap: 12, alignItems: "center" },
  navSignIn: { background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT_SANS },
  navCta: { background: GREEN, border: "none", color: "white", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS, boxShadow: "0 4px 14px rgba(26,92,69,.25)" },

  // Hero
  hero: { paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden", opacity: 0, transform: "translateY(20px)", transition: "opacity .7s ease, transform .7s ease" },
  heroVisible: { opacity: 1, transform: "translateY(0)" },
  blob1: { position: "absolute", top: -80, right: -120, width: 520, height: 520, borderRadius: "60% 40% 50% 70% / 50% 60% 40% 50%", background: "radial-gradient(circle, rgba(26,92,69,.09) 0%, transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -100, left: -80, width: 400, height: 400, borderRadius: "50% 60% 40% 70%", background: "radial-gradient(circle, rgba(180,83,9,.07) 0%, transparent 70%)", pointerEvents: "none" },
  heroInner: { maxWidth: 1160, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", gap: 60 },
  heroLeft: { flex: 1.1, display: "flex", flexDirection: "column", gap: 24 },
  heroTag: { display: "inline-flex", alignItems: "center", gap: 10, background: GREEN_LIGHT, border: `1px solid ${GREEN}33`, color: GREEN, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, width: "fit-content", position: "relative" },
  tagDot: { width: 9, height: 9, borderRadius: "50%", background: GREEN, flexShrink: 0, position: "relative" },
  heroH1: { fontFamily: FONT_SERIF, fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#0f1a10" },
  heroAccent: { color: GREEN },
  heroP: { fontSize: 17, color: "#4a5568", lineHeight: 1.8, maxWidth: 480 },
  heroBtns: { display: "flex", gap: 14, flexWrap: "wrap" as const },
  btnPrimary: { background: GREEN, color: "white", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS, boxShadow: "0 8px 28px rgba(26,92,69,.3)", letterSpacing: "-.2px" },
  btnOutline: { background: "transparent", color: "#1a202c", border: "1.5px solid #cbd5e0", padding: "14px 28px", borderRadius: 12, fontSize: 15, cursor: "pointer", fontFamily: FONT_SANS, letterSpacing: "-.2px" },
  trustRow: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  trustChip: { fontSize: 12, color: "#4a5568", background: "#edf2f7", padding: "5px 12px", borderRadius: 20, fontWeight: 500 },

  // Float card
  heroRight: { flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 },
  floatCard: { background: CARD_BG, borderRadius: 20, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,.1), 0 0 0 1px rgba(26,92,69,.08)", width: "100%", maxWidth: 380 },
  fcHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  fcAvatar: { fontSize: 36, width: 52, height: 52, background: GREEN_LIGHT, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  fcName: { fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 16, color: "#1a202c" },
  fcSpec: { fontSize: 12, color: "#718096", marginTop: 2 },
  fcBadge: { marginLeft: "auto", background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, border: "1px solid #86efac", letterSpacing: 1 },
  fcDivider: { height: 1, background: "#f0f0f0", marginBottom: 14 },
  fcRows: { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 18 },
  fcRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fafaf9", borderRadius: 10, border: "1px solid #f0ede8" },
  fcRowLabel: { flex: 1, fontSize: 13, color: "#2d3748", fontWeight: 500 },
  fcRowTime: { fontSize: 11, color: GREEN, fontWeight: 600, background: GREEN_LIGHT, padding: "3px 8px", borderRadius: 8 },
  fcBtn: { width: "100%", background: GREEN, color: "white", border: "none", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS },
  miniStat: { background: CARD_BG, borderRadius: 14, padding: "14px 20px", boxShadow: "0 8px 24px rgba(0,0,0,.08)", border: `1px solid ${GREEN}20`, alignSelf: "flex-end" },
  miniStatNum: { fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 700, color: GREEN },
  miniStatLabel: { fontSize: 11, color: "#718096", marginTop: 2 },

  // Strip
  strip: { background: CARD_BG, borderTop: "1px solid #e8e0d5", borderBottom: "1px solid #e8e0d5", padding: "16px 0", overflow: "hidden" },
  stripInner: { display: "flex", overflow: "hidden" },
  stripTrack: { display: "flex", gap: 56, whiteSpace: "nowrap" as const, flexShrink: 0 },
  stripItem: { fontSize: 13, fontWeight: 600, color: "#9ba8a0", letterSpacing: "0.5px", textTransform: "uppercase" as const },

  // How it works
  howSection: { padding: "96px 32px", opacity: 1, transform: "none" },
  sectionInner: { maxWidth: 1160, margin: "0 auto" },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: AMBER, marginBottom: 14 },
  eyebrowLight: { fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: `${GREEN}bb`, marginBottom: 14 },
  sectionH2: { fontFamily: FONT_SERIF, fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 700, marginBottom: 52, letterSpacing: "-1px", color: "#0f1a10" },
  stepsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 },
  stepCard: { background: CARD_BG, borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 20px rgba(0,0,0,.06)" },
  stepNum: { fontFamily: FONT_SERIF, fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 14 },
  stepIcon: { fontSize: 36, marginBottom: 14 },
  stepTitle: { fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#1a202c" },
  stepDesc: { fontSize: 14, color: "#718096", lineHeight: 1.75 },

  // Features
  featSection: { padding: "96px 32px", position: "relative", opacity: 1, transform: "none" },
  featBg: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(26,92,69,.03) 0%, transparent 100%)", pointerEvents: "none" },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 },
  featCard: { background: CARD_BG, borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 16px rgba(0,0,0,.05)" },
  featIconBox: { width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  featTitle: { fontFamily: FONT_SERIF, fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#1a202c" },
  featDesc: { fontSize: 14, color: "#718096", lineHeight: 1.72 },

  // Stats
  statsSection: { padding: "72px 32px", opacity: 1, transform: "none" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },
  statBlock: { background: CARD_BG, border: `1px solid ${GREEN}22`, borderRadius: 16, padding: "32px 20px", textAlign: "center" as const, boxShadow: "0 4px 16px rgba(26,92,69,.05)" },
  statEmoji: { fontSize: 32, marginBottom: 12 },
  statVal: { fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 700, color: GREEN, marginBottom: 6 },
  statLabel: { fontSize: 13, color: "#718096", fontWeight: 500 },

  // CTA
  ctaSection: { padding: "80px 32px", opacity: 1, transform: "none" },
  ctaCard: { maxWidth: 760, margin: "0 auto", background: GREEN, borderRadius: 28, padding: "72px 60px", textAlign: "center" as const, position: "relative", overflow: "hidden", boxShadow: "0 24px 60px rgba(26,92,69,.35)" },
  ctaOrb: { position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" },
  ctaH2: { fontFamily: FONT_SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "-1px" },
  ctaP: { fontSize: 16, color: "rgba(255,255,255,.7)", lineHeight: 1.8, marginBottom: 36 },
  ctaBtns: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const },
  ctaBtnPrimary: { background: "white", color: GREEN, border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT_SANS, boxShadow: "0 4px 20px rgba(0,0,0,.15)" },
  ctaBtnOutline: { background: "transparent", color: "rgba(255,255,255,.85)", border: "1.5px solid rgba(255,255,255,.3)", padding: "14px 28px", borderRadius: 12, fontSize: 15, cursor: "pointer", fontFamily: FONT_SANS },
  ctaNote: { marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.5)" },

  // Footer
  footer: { borderTop: "1px solid #e8e0d5", padding: "36px 32px", background: "#f0ebe3" },
  footerInner: { maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" as const },
  footerLogo: { display: "flex", alignItems: "center", gap: 10 },
  footerNote: { fontSize: 12, color: "#9ba8a0", maxWidth: 360, textAlign: "center" as const, lineHeight: 1.6 },
  footerLinks: { display: "flex", gap: 24 },
  footerLink: { fontSize: 13, color: "#718096", textDecoration: "none" } as React.CSSProperties,
};