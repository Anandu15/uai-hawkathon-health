"use client";

import { useEffect, useRef, useState } from "react";

const GREEN        = "#1a5c45";
const GREEN_MID    = "#2d7a5f";
const GREEN_LIGHT  = "#e8f5f0";
const GREEN_GLOW   = "rgba(26,92,69,0.18)";
const AMBER        = "#b45309";
const AMBER_LIGHT  = "#fef3c7";
const CREAM        = "#f7f3ee";
const CREAM_DARK   = "#ede8e1";
const CARD         = "#ffffff";
const DARK         = "#0c1a12";
const SERIF        = "'Lora', Georgia, serif";
const SANS         = "'DM Sans', system-ui, sans-serif";

// ── Intersection observer hook ────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── Animated reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children, delay = 0, from = "bottom", className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  from?: "bottom" | "left" | "right" | "scale";
  className?: string;
}) {
  const { ref, inView } = useInView();
  const transforms: Record<string, string> = {
    bottom: "translateY(40px)",
    left:   "translateX(-40px)",
    right:  "translateX(40px)",
    scale:  "scale(0.92)",
  };
  return (
    <div ref={ref} className={className} style={{
      opacity:    inView ? 1 : 0,
      transform:  inView ? "none" : transforms[from],
      transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const stats = [
  { num: 173,  suffix: "",  label: "Villages",       sub: "Served by Nabha Civil Hospital",         icon: "🏘️",  color: GREEN },
  { num: 11,   suffix: "",  label: "Doctors Active", sub: "Out of 23 sanctioned posts",              icon: "👨‍⚕️", color: "#1e40af" },
  { num: 31,   suffix: "%", label: "Internet Access",sub: "Rural households with reliable signal",   icon: "📶",  color: AMBER },
  { num: 31,   suffix: "%", label: "Telemedicine CAGR", sub: "Growth in India 2020–25",              icon: "📈",  color: "#7c3aed" },
];

const timeline = [
  { year: "Problem",   icon: "🔍", title: "Staff shortage & distance barriers",   desc: "Only 11 of 23 sanctioned doctors serve 173 villages, forcing patients to travel hours for basic care." },
  { year: "Insight",   icon: "💡", title: "Technology can bridge the gap",         desc: "Telemedicine growing at 31% CAGR in India — the infrastructure exists, the last-mile solution doesn't." },
  { year: "Solution",  icon: "🛠️", title: "CareConnect is born",                   desc: "A low-bandwidth, offline-first telemedicine platform designed from the ground up for rural India." },
  { year: "Impact",    icon: "🚀", title: "Reach every village, every family",     desc: "Remote consultations, digital health records, AI symptom checking — in 20+ languages, even on 2G." },
];

const problems = [
  { icon: "🏥", title: "Staff Shortage",         desc: "Nabha Civil Hospital runs at under 50% capacity — only 11 of 23 doctors are available, leaving thousands without care.", color: "#dc2626" },
  { icon: "🚗", title: "Distance & Travel",      desc: "Patients travel hours on poor roads to find specialists unavailable or medicines out of stock, losing full days of income.", color: AMBER },
  { icon: "💸", title: "Financial Loss",         desc: "Daily-wage workers can't afford to lose a day's work for a hospital visit, forcing many to delay or skip treatment entirely.", color: "#b45309" },
  { icon: "📡", title: "Limited Connectivity",   desc: "Only ~31% of rural households have reliable internet, demanding offline-first solutions that work in low-bandwidth environments.", color: "#0891b2" },
  { icon: "⏳", title: "Delayed Consultation",   desc: "Postponed visits lead to worsening conditions, preventable complications, and higher long-term burden on families.", color: "#7c3aed" },
  { icon: "🏗️", title: "Overburdened Hospitals", desc: "As more patients converge on the single facility, existing staff become overwhelmed, reducing care quality for everyone.", color: GREEN },
];

const features = [
  { icon: "📹", color: GREEN,     title: "Remote Doctor Consultations", desc: "Schedule or request audio/video consultations without traveling — enabling doctors to serve more patients efficiently." },
  { icon: "📁", color: "#1e40af", title: "Digital Health Records",       desc: "Medical history, prescriptions, and consultations stored securely — accessible offline for poor connectivity areas." },
  { icon: "💊", color: "#7c3aed", title: "Medicine Availability",        desc: "Real-time pharmacy stock updates so patients know where medicines are available before making the trip." },
  { icon: "🤖", color: AMBER,     title: "AI Symptom Checker",           desc: "Enter symptoms and receive health guidance — designed specifically for low-bandwidth, rural use cases." },
  { icon: "📶", color: "#0891b2", title: "Offline-First Design",         desc: "Works on 2G. Queue consultations offline and sync when signal returns — built for India's last mile." },
  { icon: "🌐", color: "#dc2626", title: "Multilingual Access",          desc: "Hindi, Punjabi, Tamil, Telugu and more — with voice input options for patients with limited digital literacy." },
];

const beneficiaries = [
  { icon: "🧑‍🌾", group: "Rural Patients",          desc: "Access medical consultation from home without long-distance travel or losing a day's wages.", color: GREEN },
  { icon: "🩺",   group: "Hospital Staff",           desc: "Serve more patients through digital consultations, reducing physical overcrowding at the facility.", color: "#1e40af" },
  { icon: "🏛️",  group: "Punjab Health Dept.",       desc: "Improve rural healthcare delivery and optimize resource utilization across the district.", color: "#7c3aed" },
  { icon: "💊",  group: "Local Pharmacies",          desc: "Share live stock information and help patients obtain medicines faster and more reliably.", color: AMBER },
  { icon: "👷",  group: "Daily-Wage Workers",         desc: "Fewer work disruptions when seeking medical care — protecting both income and health simultaneously.", color: "#dc2626" },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: SANS, background: CREAM, color: "#1a202c", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes pulse-dot   { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.5);opacity:1} }
        @keyframes float-slow  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes spin-slow   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer-bg  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes line-grow   { from{height:0;opacity:0} to{height:100%;opacity:1} }
        @keyframes badge-in    { from{opacity:0;transform:scale(.8) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes hero-text-in{ from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes card-glow   { 0%,100%{box-shadow:0 0 0 0 ${GREEN_GLOW}} 50%{box-shadow:0 0 40px 8px ${GREEN_GLOW}} }
        @keyframes count-up    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orb-drift   { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,15px) scale(.97)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes border-run  { 0%{stroke-dashoffset:1000} 100%{stroke-dashoffset:0} }

        .prob-card { transition: all .3s cubic-bezier(.16,1,.3,1); cursor: default; }
        .prob-card:hover { transform: translateY(-6px) !important; box-shadow: 0 24px 60px rgba(0,0,0,.12) !important; }

        .feat-card { transition: all .3s cubic-bezier(.16,1,.3,1); cursor: default; }
        .feat-card:hover { transform: translateY(-5px) !important; box-shadow: 0 20px 48px rgba(0,0,0,.1) !important; }

        .bene-card { transition: all .3s cubic-bezier(.16,1,.3,1); cursor: default; }
        .bene-card:hover { transform: translateX(6px) !important; }

        .stat-pill { transition: all .3s cubic-bezier(.16,1,.3,1); }
        .stat-pill:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(26,92,69,.15) !important; }

        .tab-btn { transition: all .25s ease; border: none; cursor: pointer; font-family: '${SANS}'; }
        .tab-btn:hover { opacity: .85; }

        .timeline-dot { transition: transform .3s ease; }
        .timeline-item:hover .timeline-dot { transform: scale(1.3); }

        .tag-chip { transition: all .2s ease; }
        .tag-chip:hover { transform: scale(1.05); }

        .hero-orb-1 { animation: orb-drift 18s ease-in-out infinite; }
        .hero-orb-2 { animation: orb-drift 24s ease-in-out infinite reverse; }
        .hero-orb-3 { animation: orb-drift 14s ease-in-out infinite 4s; }

        @media (max-width: 768px) {
          .hero-grid    { flex-direction: column !important; }
          .stats-row    { grid-template-columns: repeat(2,1fr) !important; }
          .prob-grid    { grid-template-columns: 1fr !important; }
          .feat-grid    { grid-template-columns: 1fr !important; }
          .bene-grid    { grid-template-columns: 1fr !important; }
          .timeline-grid{ grid-template-columns: 1fr !important; }
          .hero-card    { display: none !important; }
          .mission-inner{ padding: 36px 22px !important; }
        }
      `}</style>

      {/* ══════════════════════════ HERO ══════════════════════════════════════ */}
      <section style={{ background: `linear-gradient(140deg, ${DARK} 0%, #0a2e1c 40%, #0f3d2b 100%)`, padding: "88px 24px 96px", position: "relative", overflow: "hidden" }}>

        {/* Animated background orbs */}
        <div className="hero-orb-1" style={{ position: "absolute", top: -80, right: -60, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN_GLOW} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div className="hero-orb-2" style={{ position: "absolute", bottom: -100, left: -80, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,83,9,.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="hero-orb-3" style={{ position: "absolute", top: "40%", left: "40%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.03) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Subtle grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1140, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64 }}>

            {/* Left text */}
            <div style={{ flex: 1.3, display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10, width: "fit-content",
                background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 24, padding: "7px 16px",
                animation: heroLoaded ? "badge-in .6s cubic-bezier(.16,1,.3,1) .1s both" : "none",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse-dot 2s infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.8)", letterSpacing: 1.5, textTransform: "uppercase" }}>Hawkathon 2026 · Nabha, Punjab</span>
              </div>

              {/* Headline */}
              <div style={{ animation: heroLoaded ? "hero-text-in .8s cubic-bezier(.16,1,.3,1) .2s both" : "none" }}>
                <h1 style={{ fontFamily: SERIF, fontSize: "clamp(30px, 5.5vw, 58px)", fontWeight: 700, color: "white", lineHeight: 1.08, letterSpacing: "-1.5px" }}>
                  Bridging the<br />
                  Healthcare Gap<br />
                  <span style={{ color: "#6ee7b7", fontStyle: "italic" }}>for Rural India</span>
                </h1>
              </div>

              <p style={{
                fontSize: 16, color: "rgba(255,255,255,.65)", lineHeight: 1.85, maxWidth: 480,
                animation: heroLoaded ? "hero-text-in .8s cubic-bezier(.16,1,.3,1) .35s both" : "none",
              }}>
                CareConnect is a low-bandwidth telemedicine system built for Nabha and its <strong style={{ color: "rgba(255,255,255,.85)" }}>173 surrounding villages</strong> — bringing doctors, digital health records, and medicine availability to every household, even on 2G.
              </p>

              {/* Tags */}
              <div style={{
                display: "flex", gap: 8, flexWrap: "wrap",
                animation: heroLoaded ? "hero-text-in .8s cubic-bezier(.16,1,.3,1) .5s both" : "none",
              }}>
                {["Remote Consultations", "Offline-First", "AI Symptom Check", "20+ Languages"].map((tag, i) => (
                  <span key={tag} className="tag-chip" style={{
                    fontSize: 12, fontWeight: 600, color: "#6ee7b7",
                    background: "rgba(110,231,183,.1)", border: "1px solid rgba(110,231,183,.2)",
                    padding: "5px 13px", borderRadius: 20,
                    animationDelay: `${0.55 + i * 0.07}s`,
                  }}>
                    ✓ {tag}
                  </span>
                ))}
              </div>

              {/* Mini stat row */}
              <div style={{
                display: "flex", gap: 24, marginTop: 8,
                animation: heroLoaded ? "hero-text-in .8s cubic-bezier(.16,1,.3,1) .65s both" : "none",
              }}>
                {[{ v: "173", l: "Villages" }, { v: "11/23", l: "Doctors" }, { v: "31%", l: "CAGR" }].map(s => (
                  <div key={s.l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#6ee7b7" }}>{s.v}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 500, letterSpacing: .5 }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right glass card */}
            <div className="hero-card" style={{
              flex: 1, background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 24, padding: 32, backdropFilter: "blur(20px)",
              animation: heroLoaded ? "hero-text-in .9s cubic-bezier(.16,1,.3,1) .4s both" : "none",
              boxShadow: "0 32px 80px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 24 }}>The Crisis in Numbers</div>

              {[
                { val: "11 / 23", label: "Doctors at Nabha Civil Hospital", accent: "#f87171" },
                { val: "173+",    label: "Villages dependent on one hospital", accent: "#fbbf24" },
                { val: "~31%",    label: "Rural households with internet",    accent: "#60a5fa" },
                { val: "Hours",   label: "Average travel time for consultation", accent: "#a78bfa" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 18,
                  marginBottom: i < 3 ? 20 : 0,
                  paddingBottom: i < 3 ? 20 : 0,
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none",
                }}>
                  <div style={{
                    fontFamily: SERIF, fontSize: 20, fontWeight: 700,
                    color: item.accent, minWidth: 80, lineHeight: 1,
                  }}>{item.val}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>{item.label}</div>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: "14px 16px", background: "rgba(110,231,183,.08)", border: "1px solid rgba(110,231,183,.15)", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 600, marginBottom: 4 }}>💡 The Opportunity</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>Telemedicine in India growing at 31% CAGR — the technology exists, the rural-first solution doesn't.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════ STATS BAR ════════════════════════════════ */}
      <div style={{ background: CARD, borderBottom: `1px solid ${CREAM_DARK}`, boxShadow: "0 4px 24px rgba(0,0,0,.04)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>
          <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
            {stats.map((st, i) => (
              <Reveal key={i} delay={i * 90} from="bottom">
                <div className="stat-pill" style={{
                  padding: "32px 24px", textAlign: "center",
                  borderRight: i < 3 ? `1px solid ${CREAM_DARK}` : "none",
                  position: "relative",
                }}>
                  {/* Top accent line */}
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 40, height: 3, background: st.color, borderRadius: "0 0 3px 3px" }} />

                  <div style={{ fontSize: 30, marginBottom: 8 }}>{st.icon}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: st.color, lineHeight: 1, marginBottom: 4 }}>
                    <Counter target={st.num} suffix={st.suffix} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: .3 }}>{st.label}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>{st.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════ STORY TIMELINE ═══════════════════════════ */}
      <section style={{ padding: "88px 24px", background: `linear-gradient(180deg, ${CREAM} 0%, #eee8de 100%)` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <Reveal delay={0}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: GREEN, marginBottom: 12 }}>Our Story</div>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: DARK, letterSpacing: "-0.8px" }}>
                From problem to platform
              </h2>
            </div>
          </Reveal>

          <div className="timeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 36, left: "12.5%", right: "12.5%", height: 2, background: `linear-gradient(90deg, ${GREEN}40, ${GREEN}, ${GREEN}40)`, zIndex: 0 }} />

            {timeline.map((item, i) => (
              <Reveal key={i} delay={i * 120} from="bottom">
                <div className="timeline-item" style={{ textAlign: "center", padding: "0 16px", position: "relative", zIndex: 1 }}>
                  {/* Dot */}
                  <div className="timeline-dot" style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: i === 0 ? "#fee2e2" : i === 1 ? AMBER_LIGHT : i === 2 ? GREEN_LIGHT : "#ede9fe",
                    border: `3px solid ${i === 0 ? "#f87171" : i === 1 ? AMBER : i === 2 ? GREEN : "#a78bfa"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: i === 2 ? GREEN : AMBER, marginBottom: 8 }}>{item.year}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ PROBLEMS ════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: DARK, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(26,92,69,.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(180,83,9,.08) 0%, transparent 40%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1140, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#f87171", marginBottom: 12 }}>The Problem</div>
                <h2 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, color: "white", letterSpacing: "-0.8px", lineHeight: 1.15 }}>
                  Why rural healthcare<br /><span style={{ color: "#f87171", fontStyle: "italic" }}>is broken</span>
                </h2>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.8, maxWidth: 380 }}>
                In Nabha and its surrounding villages, thousands face daily struggles to access basic medical care. The barriers are systemic, compounding, and urgent.
              </p>
            </div>
          </Reveal>

          <div className="prob-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {problems.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} from="bottom">
                <div className="prob-card" style={{
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 20, padding: "28px 24px", height: "100%",
                  borderTop: `3px solid ${p.color}`,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, fontSize: 22,
                    background: p.color + "18", display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16, border: `1px solid ${p.color}30`,
                  }}>{p.icon}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: "white", marginBottom: 10 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.8 }}>{p.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ SOLUTION TABS ════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: CREAM }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: GREEN, marginBottom: 12 }}>Our Solution</div>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, color: DARK, letterSpacing: "-0.8px" }}>
                What CareConnect delivers
              </h2>
              <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.8, maxWidth: 580, margin: "16px auto 0" }}>
                A practical, scalable telemedicine platform designed from the ground up for rural India — prioritizing offline access, low bandwidth, and digital literacy.
              </p>
            </div>
          </Reveal>

          {/* Tab nav */}
          <Reveal delay={100}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48, flexWrap: "wrap" }}>
              {["All Features", "Connectivity", "Health Data", "AI Tools"].map((tab, i) => (
                <button key={tab} className="tab-btn" onClick={() => setActiveTab(i)} style={{
                  padding: "9px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                  background: activeTab === i ? GREEN : "transparent",
                  color: activeTab === i ? "white" : "#6b7280",
                  border: activeTab === i ? "none" : `1.5px solid ${CREAM_DARK}`,
                  boxShadow: activeTab === i ? `0 4px 16px ${GREEN_GLOW}` : "none",
                }}>
                  {tab}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} from="bottom">
                <div className="feat-card" style={{
                  background: CARD, borderRadius: 20, padding: "28px 24px",
                  borderLeft: `4px solid ${f.color}`, height: "100%",
                  boxShadow: "0 4px 20px rgba(0,0,0,.06)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Subtle background tint */}
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: f.color + "0a", pointerEvents: "none" }} />

                  <div style={{
                    width: 48, height: 48, borderRadius: 14, fontSize: 22,
                    background: f.color + "15", display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: 16,
                    boxShadow: `0 4px 12px ${f.color}25`,
                  }}>{f.icon}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>{f.desc}</div>

                  {/* Color tag */}
                  <div style={{ marginTop: 16, display: "inline-block", width: 28, height: 3, borderRadius: 2, background: f.color }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ BENEFICIARIES ════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: `linear-gradient(180deg, #eee8de 0%, ${CREAM} 100%)` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>

          <div style={{ display: "flex", gap: 64, alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* Left sticky label */}
            <div style={{ flex: "0 0 280px" }}>
              <Reveal from="left">
                <div style={{ position: "sticky", top: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: AMBER, marginBottom: 12 }}>Who Benefits</div>
                  <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 700, color: DARK, letterSpacing: "-0.5px", marginBottom: 16, lineHeight: 1.2 }}>
                    Built for every stakeholder
                  </h2>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8, marginBottom: 28 }}>
                    CareConnect creates measurable value for patients, providers, and the broader healthcare ecosystem in rural Punjab.
                  </p>
                  <div style={{ width: 48, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${GREEN}, ${AMBER})` }} />
                </div>
              </Reveal>
            </div>

            {/* Right cards stack */}
            <div className="bene-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {beneficiaries.map((b, i) => (
                <Reveal key={b.group} delay={i * 90} from={i % 2 === 0 ? "left" : "right"}>
                  <div className="bene-card" style={{
                    background: CARD, borderRadius: 16, padding: "20px 22px",
                    display: "flex", gap: 16, alignItems: "flex-start",
                    border: `1px solid ${CREAM_DARK}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,.04)",
                    borderLeft: `4px solid ${b.color}`,
                    gridColumn: i === 4 ? "span 2" : "span 1",
                  }}>
                    <div style={{
                      fontSize: 26, width: 48, height: 48, borderRadius: 12,
                      background: b.color + "12", display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                    }}>{b.icon}</div>
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{b.group}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{b.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════ MISSION ══════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: CREAM }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <Reveal from="scale">
            <div className="mission-inner" style={{
              background: `linear-gradient(140deg, ${DARK} 0%, #0a2e1c 50%, #0f3d2b 100%)`,
              borderRadius: 32, padding: "72px 64px", textAlign: "center",
              position: "relative", overflow: "hidden",
              boxShadow: `0 40px 100px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.05)`,
            }}>
              {/* Orb decorations */}
              <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(110,231,183,.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(180,83,9,.07)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Quote mark */}
                <div style={{ fontFamily: SERIF, fontSize: 80, color: "rgba(110,231,183,.15)", lineHeight: .8, marginBottom: 8, fontStyle: "italic" }}>"</div>

                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 20 }}>Our Mission</div>

                <blockquote style={{
                  fontFamily: SERIF, fontSize: "clamp(18px, 3.5vw, 30px)", fontWeight: 700,
                  color: "white", lineHeight: 1.5, maxWidth: 760, margin: "0 auto 24px",
                  letterSpacing: "-0.3px", fontStyle: "italic",
                }}>
                  No patient in rural India should have to choose between losing a day's wages and receiving medical care.
                </blockquote>

                <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.8 }}>
                  CareConnect was built for Hawkathon 2026 in response to the real healthcare crisis facing Nabha's 173 villages. We believe technology, designed responsibly for its context, can bridge even the deepest gaps.
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  {[
                    { label: "Hawkathon 2026",   color: "#6ee7b7" },
                    { label: "Nabha, Punjab",     color: "#93c5fd" },
                    { label: "Rural TeleHealth",  color: "#fbbf24" },
                    { label: "Made for Bharat",   color: "#f9a8d4" },
                  ].map(tag => (
                    <span key={tag.label} className="tag-chip" style={{
                      fontSize: 12, fontWeight: 600, color: tag.color,
                      background: tag.color + "15", border: `1px solid ${tag.color}30`,
                      padding: "7px 16px", borderRadius: 24,
                    }}>
                      {tag.label}
                    </span>
                  ))}
                </div>

                {/* Bottom stat strip */}
                <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,.08)", flexWrap: "wrap" }}>
                  {[
                    { val: "173", label: "Villages" },
                    { val: "2G+", label: "Works on" },
                    { val: "20+", label: "Languages" },
                    { val: "∞",   label: "Impact" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "#6ee7b7", marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}