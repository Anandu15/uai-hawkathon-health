"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const EMERGENCY_CONTACTS = [
  { name: "Ambulance",       number: "108",  icon: "🚑", desc: "Medical emergency, accident" },
  { name: "Police",          number: "100",  icon: "🚔", desc: "Crime, violence, safety threat" },
  { name: "Fire Brigade",    number: "101",  icon: "🚒", desc: "Fire, gas leak, rescue" },
  { name: "Health Helpline", number: "104",  icon: "🏥", desc: "Medical advice, ambulance" },
  { name: "Women Helpline",  number: "1091", icon: "🆘", desc: "Women in distress" },
  { name: "Disaster Mgmt",   number: "1078", icon: "⛑️",  desc: "Natural disaster, flood" },
];

const FIRST_AID_TIPS = [
  { situation: "Unconscious person", steps: ["Check breathing & pulse", "Place in recovery position", "Call 108 immediately", "Do NOT give water or food"] },
  { situation: "Snake bite",         steps: ["Keep person still & calm", "Remove jewellery near bite", "Do NOT suck the wound", "Rush to nearest hospital for antivenom"] },
  { situation: "Severe bleeding",    steps: ["Apply firm pressure with cloth", "Keep elevated above heart", "Do NOT remove the cloth", "Call 108 or rush to hospital"] },
  { situation: "Burn injury",        steps: ["Cool under running water 10 min", "Do NOT use ice or toothpaste", "Cover loosely with clean cloth", "Go to hospital if severe"] },
  { situation: "Choking (adult)",    steps: ["5 back blows between shoulder blades", "5 abdominal thrusts (Heimlich)", "Repeat until object dislodges", "Call 108 if unconscious"] },
  { situation: "Heart attack signs", steps: ["Sit upright, loosen clothing", "Give aspirin if not allergic", "Call 108 immediately", "Do NOT leave person alone"] },
];

type Hospital = {
  name: string;
  address: string;
  dist: string;
  distMeters: number;
  lat: number;
  lng: number;
  type: string;
  placeId: string;
};

type LocState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "fetching"; lat: number; lng: number }
  | { status: "done"; lat: number; lng: number; city: string }
  | { status: "error"; message: string };

function haversineM(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371000, r = Math.PI / 180;
  const dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
}

export default function EmergencyPage() {
  const router = useRouter();
  const [activeTip,   setActiveTip]   = useState<number | null>(null);
  const [callTarget,  setCallTarget]  = useState<{name:string; number:string} | null>(null);
  const [loc,         setLoc]         = useState<LocState>({ status: "idle" });
  const [hospitals,   setHospitals]   = useState<Hospital[]>([]);
  const [hospLoading, setHospLoading] = useState(false);
  const [hospError,   setHospError]   = useState<string | null>(null);

  useEffect(() => { requestLocation(); }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLoc({ status: "error", message: "Geolocation not supported by this browser." });
      return;
    }
    setLoc({ status: "requesting" });
    setHospitals([]);
    setHospError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLoc({ status: "fetching", lat, lng });
        reverseGeocode(lat, lng);
        fetchHospitals(lat, lng);
      },
      err => {
        const msg =
          err.code === 1 ? "Location access denied. Tap 'Detect Location' and allow access when prompted." :
          err.code === 2 ? "Could not detect your location. Check device GPS and try again." :
                           "Location request timed out. Please try again.";
        setLoc({ status: "error", message: msg });
        setHospError("Enable location to find hospitals near you.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const d = await r.json();
      const city = d?.address?.city || d?.address?.town || d?.address?.village || d?.address?.county || "your area";
      setLoc({ status: "done", lat, lng, city });
    } catch {
      setLoc({ status: "done", lat, lng, city: "your area" });
    }
  }

  // Overpass API — OpenStreetMap, zero API key needed, works everywhere
  async function fetchHospitals(lat: number, lng: number) {
    setHospLoading(true);
    try {
      const q = `[out:json][timeout:25];
        (
          node["amenity"="hospital"](around:15000,${lat},${lng});
          way["amenity"="hospital"](around:15000,${lat},${lng});
          node["amenity"="clinic"](around:15000,${lat},${lng});
          node["healthcare"="hospital"](around:15000,${lat},${lng});
          node["healthcare"="clinic"](around:15000,${lat},${lng});
          node["amenity"="doctors"](around:10000,${lat},${lng});
        );
        out center 30;`;
      const r    = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: q });
      const data = await r.json();

      const list: Hospital[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any): Hospital | null => {
          const hLat = el.lat ?? el.center?.lat;
          const hLng = el.lon ?? el.center?.lon;
          if (!hLat || !hLng) return null;
          const dm = haversineM(lat, lng, hLat, hLng);
          const addr = [
            el.tags["addr:houseno"],
            el.tags["addr:street"],
            el.tags["addr:city"] || el.tags["addr:town"] || el.tags["addr:village"],
          ].filter(Boolean).join(", ") || el.tags["addr:full"] || "";
          const rawType = el.tags["amenity"] || el.tags["healthcare"] || "hospital";
          const type = rawType === "doctors" ? "Clinic / Doctor" : rawType.charAt(0).toUpperCase() + rawType.slice(1);
          return { name: el.tags.name, address: addr, dist: fmtDist(dm), distMeters: dm, lat: hLat, lng: hLng, type, placeId: String(el.id) };
        })
        .filter(Boolean)
        .sort((a: Hospital, b: Hospital) => a.distMeters - b.distMeters)
        .slice(0, 8);

      if (list.length === 0) setHospError("No hospitals found within 15 km. Use the Maps button to search.");
      setHospitals(list);
    } catch {
      setHospError("Could not load hospital data. Check your internet connection.");
    } finally {
      setHospLoading(false);
    }
  }

  function openDirections(h: Hospital) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`, "_blank");
  }

  function openMapsSearch() {
    const l = loc as any;
    const url = (l.lat && l.lng)
      ? `https://www.google.com/maps/search/hospital/@${l.lat},${l.lng},14z`
      : "https://www.google.com/maps/search/hospital+near+me";
    window.open(url, "_blank");
  }

  const isLocating = loc.status === "requesting" || loc.status === "fetching";

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes fadeUp    {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ripple    {0%{box-shadow:0 0 0 0 rgba(220,38,38,.45)}70%{box-shadow:0 0 0 22px rgba(220,38,38,0)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}}
        @keyframes strobe    {0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin      {to{transform:rotate(360deg)}}
        @keyframes shimmer   {0%{background-position:-400px 0}100%{background-position:400px 0}}

        .cbtn{transition:transform .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent}
        .cbtn:hover{transform:translateY(-2px)}
        .cbtn:active{transform:scale(.97)}
        .tip{transition:background .15s,border-color .15s;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .tip:hover{background:#fff7f7!important;border-color:#fca5a5!important}
        .hcard{transition:border-color .15s,box-shadow .15s}
        .hcard:hover{border-color:#fca5a5!important;box-shadow:0 4px 18px rgba(220,38,38,.1)!important}
        .dbtn{transition:background .15s,color .15s}
        .dbtn:hover{background:#dc2626!important;color:#fff!important}
        .bbtn{transition:background .15s,color .15s}
        .bbtn:hover{background:#fee2e2!important;color:#dc2626!important}
        .sk{background:linear-gradient(90deg,#f0ebe3 25%,#e8e0d5 50%,#f0ebe3 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}

        @media(max-width:640px){
          .cg{grid-template-columns:1fr 1fr!important}
          .hg{grid-template-columns:1fr!important}
          .hn{font-size:80px!important}
          .st{font-size:22px!important}
          .dd{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── Call confirm modal ── */}
      {callTarget && (
        <div style={s.overlay} onClick={() => setCallTarget(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:10}}>📞</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:"#1a0505",marginBottom:6}}>
              Call {callTarget.name}?
            </div>
            <div style={{fontSize:38,fontWeight:900,fontFamily:"'Barlow Condensed',sans-serif",color:"#dc2626",marginBottom:22,letterSpacing:2}}>
              {callTarget.number}
            </div>
            <div style={{display:"flex",gap:12,width:"100%"}}>
              <button style={s.cancelBtn} onClick={() => setCallTarget(null)}>Cancel</button>
              <button style={s.confirmBtn} onClick={() => { window.location.href=`tel:${callTarget.number}`; setCallTarget(null); }}>
                📞 Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert stripe ── */}
      <div style={s.stripe}>
        <span style={{animation:"strobe 1s infinite",fontWeight:700,letterSpacing:1}}>🚨 EMERGENCY</span>
        <span style={{opacity:.5}}>·</span>
        <span>If life is at risk — call 108 immediately</span>
        <span style={{opacity:.5}}>·</span>
        <span style={{animation:"strobe 1s infinite",fontWeight:700,letterSpacing:1}}>🚨 EMERGENCY</span>
      </div>

      <button className="bbtn" style={s.back} onClick={() => router.back()}>← Back</button>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={{animation:"fadeUp .4s ease both"}}>
          <div style={s.badge}>EMERGENCY SERVICES</div>
          <h1 style={s.heroTitle}>Need help <em style={{fontStyle:"italic",color:"#dc2626"}}>right now?</em></h1>
          <p style={s.heroSub}>Don't wait. Call emergency services immediately.</p>
        </div>
        <div style={{animation:"fadeUp .4s .1s ease both",textAlign:"center" as const}}>
          <button className="cbtn" style={{...s.bigBtn,animation:"ripple 1.8s infinite"}}
            onClick={() => setCallTarget({name:"Ambulance",number:"108"})}>
            <span style={{fontSize:34}}>🚑</span>
            <span className="hn" style={s.bigNum}>108</span>
            <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.75)",letterSpacing:2,fontFamily:"'DM Sans',sans-serif"}}>
              TAP TO CALL AMBULANCE
            </span>
          </button>
          <p style={{marginTop:13,fontSize:13,color:"#6b7280",fontFamily:"'DM Sans',sans-serif"}}>
            Free · Available 24/7 · National Medical Emergency
          </p>
        </div>
      </section>

      <div style={s.body}>

        {/* ── Contacts ── */}
        <section style={{...s.sec,animation:"fadeUp .4s .15s ease both"}}>
          <div style={s.secHead}>
            <div className="st" style={s.secTitle}>Emergency Contacts</div>
            <div style={s.secSub}>Tap to call</div>
          </div>
          <div className="cg" style={s.contactGrid}>
            {EMERGENCY_CONTACTS.map(c => (
              <button key={c.number} className="cbtn" style={s.contactCard}
                onClick={() => setCallTarget({name:c.name,number:c.number})}>
                <div style={{fontSize:24,marginBottom:5}}>{c.icon}</div>
                <div style={s.cNum}>{c.number}</div>
                <div style={s.cName}>{c.name}</div>
                <div style={s.cDesc}>{c.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Nearby Hospitals ── */}
        <section style={{...s.sec,animation:"fadeUp .4s .25s ease both"}}>
          <div style={s.secHead}>
            <div>
              <div className="st" style={s.secTitle}>Nearby Hospitals</div>
              {loc.status === "done" && (
                <div style={{fontSize:12,color:"#6b7280",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>
                  📍 Showing results near <strong>{(loc as any).city}</strong>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap" as const,alignItems:"center"}}>
              {(loc.status === "error" || loc.status === "idle") && (
                <button style={s.detectBtn} onClick={requestLocation}>📍 Detect Location</button>
              )}
              {loc.status === "done" && (
                <button style={s.detectBtn} onClick={requestLocation}>🔄 Refresh</button>
              )}
              <button style={s.mapsBtn} onClick={openMapsSearch}>🗺 Maps</button>
            </div>
          </div>

          {/* Banners */}
          {isLocating && (
            <div style={s.locBanner}>
              <span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}/>
              {loc.status === "requesting" ? "Requesting location access…" : "Detecting your location…"}
            </div>
          )}
          {loc.status === "error" && (
            <div style={s.errBanner}>
              <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
              <div>
                <div style={{fontWeight:600,marginBottom:3}}>{loc.message}</div>
                <div style={{fontSize:12,opacity:.85}}>You can still tap Maps to search nearby hospitals manually.</div>
              </div>
            </div>
          )}

          {/* Skeletons */}
          {hospLoading && (
            <div className="hg" style={s.hospGrid}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{background:"#fff",border:"1px solid #f0ebe3",borderRadius:14,padding:18}}>
                  <div className="sk" style={{height:15,width:"65%",marginBottom:10}}/>
                  <div className="sk" style={{height:12,width:"85%",marginBottom:8}}/>
                  <div className="sk" style={{height:12,width:"40%",marginBottom:14}}/>
                  <div className="sk" style={{height:34,width:"100%"}}/>
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          {!hospLoading && hospitals.length > 0 && (
            <div className="hg" style={s.hospGrid}>
              {hospitals.map((h, i) => (
                <div key={h.placeId} className="hcard" style={{...s.hospCard,animationDelay:`${i*40}ms`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
                    <div style={{flex:1}}>
                      <div style={s.hName}>{h.name}</div>
                      {h.address && <div style={s.hAddr}>📍 {h.address}</div>}
                    </div>
                    <div style={s.hDist}>{h.dist}</div>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" as const}}>
                    {i === 0 && <span style={s.nearBadge}>⭐ Nearest</span>}
                    <span style={s.typeBadge}>{h.type}</span>
                  </div>
                  <button className="dbtn" style={s.dirBtn} onClick={() => openDirections(h)}>
                    🗺 Get Directions
                  </button>
                </div>
              ))}
            </div>
          )}

          {!hospLoading && hospError && hospitals.length === 0 && (
            <div style={s.emptyCard}>
              <div style={{fontSize:38,marginBottom:10}}>🏥</div>
              <div style={{fontWeight:600,color:"#1a0505",marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>{hospError}</div>
              <button style={s.mapsBtn} onClick={openMapsSearch}>🗺 Search on Google Maps</button>
            </div>
          )}
        </section>

        {/* ── First aid ── */}
        <section style={{...s.sec,animation:"fadeUp .4s .35s ease both"}}>
          <div style={s.secHead}>
            <div className="st" style={s.secTitle}>First Aid Guide</div>
            <div style={s.secSub}>Tap to expand</div>
          </div>
          <div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
            {FIRST_AID_TIPS.map((tip, i) => (
              <div key={tip.situation} className="tip"
                style={{...s.tipCard,background:activeTip===i?"#fff7f7":"#fff",borderColor:activeTip===i?"#fca5a5":"#f0ebe3"}}
                onClick={() => setActiveTip(activeTip===i?null:i)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{...s.tipNum,background:activeTip===i?"#dc2626":"#f0ebe3",color:activeTip===i?"#fff":"#6b7280",transition:"all .2s"}}>
                      {i+1}
                    </div>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,color:"#1a0505"}}>{tip.situation}</span>
                  </div>
                  <span style={{fontSize:12,color:"#6b7280",transition:"transform .2s",transform:activeTip===i?"rotate(180deg)":"none"}}>▼</span>
                </div>
                {activeTip === i && (
                  <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #fecaca",animation:"slideDown .2s ease"}}>
                    <ol style={{paddingLeft:20,display:"flex",flexDirection:"column" as const,gap:8}}>
                      {tip.steps.map((step,j) => (
                        <li key={j} style={{fontSize:14,color:"#374151",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Do / Don't ── */}
        <section style={{...s.sec,animation:"fadeUp .4s .45s ease both"}}>
          <div className="st" style={{...s.secTitle,marginBottom:16}}>General Rules</div>
          <div className="dd" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={s.doCard}>
              <div style={{fontSize:14,fontWeight:700,color:"#15803d",marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>✅ Do</div>
              {["Stay calm","Call 108 first","Keep patient still","Follow dispatcher instructions","Send someone to guide ambulance"].map(d => (
                <div key={d} style={{fontSize:13,color:"#166534",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>• {d}</div>
              ))}
            </div>
            <div style={s.dontCard}>
              <div style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>❌ Don't</div>
              {["Move injured person unnecessarily","Give food/water to unconscious","Panic or leave patient alone","Treat serious injuries yourself","Block the ambulance route"].map(d => (
                <div key={d} style={{fontSize:13,color:"#9f1239",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>• {d}</div>
              ))}
            </div>
          </div>
        </section>

        <div style={s.footer}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:"#dc2626",marginBottom:4}}>CareConnect Emergency</div>
          <div style={{fontSize:12,color:"#6b7280"}}>Hospital data © OpenStreetMap contributors · Distances are approximate</div>
        </div>
      </div>
    </div>
  );
}

const SERIF = "'Barlow Condensed',sans-serif";
const SANS  = "'DM Sans',sans-serif";

const s: Record<string, React.CSSProperties> = {
  page:   {minHeight:"100vh",background:"#fdfbf7",fontFamily:SANS,paddingTop:40},
  stripe: {position:"fixed",top:0,left:0,right:0,zIndex:100,background:"#dc2626",color:"#fff",fontSize:12,fontWeight:600,letterSpacing:1,padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:SANS},
  back:   {position:"absolute",top:52,left:20,background:"#fff",border:"1px solid #e5e7eb",padding:"7px 14px",borderRadius:8,fontWeight:500,color:"#374151",cursor:"pointer",fontSize:13,fontFamily:SANS},

  hero:     {display:"flex",flexDirection:"column" as const,alignItems:"center",padding:"58px 20px 38px",gap:30,textAlign:"center" as const},
  badge:    {display:"inline-block",background:"#dc2626",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:2,padding:"5px 14px",borderRadius:4,marginBottom:14,fontFamily:SANS},
  heroTitle:{fontFamily:SERIF,fontSize:"clamp(42px,8vw,70px)",fontWeight:900,color:"#1a0505",lineHeight:1.05,marginBottom:10,letterSpacing:"-1px"},
  heroSub:  {fontSize:16,color:"#6b7280",maxWidth:340,fontFamily:SANS},
  bigBtn:   {display:"flex",flexDirection:"column" as const,alignItems:"center",gap:4,background:"#dc2626",border:"none",borderRadius:24,padding:"26px 50px",cursor:"pointer",boxShadow:"0 12px 40px rgba(220,38,38,.35)"},
  bigNum:   {fontSize:96,fontFamily:SERIF,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:4},

  body:    {maxWidth:760,margin:"0 auto",padding:"0 20px 60px"},
  sec:     {marginBottom:40},
  secHead: {display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap" as const,gap:10},
  secTitle:{fontFamily:SERIF,fontSize:28,fontWeight:800,color:"#1a0505",letterSpacing:"-0.5px"},
  secSub:  {fontSize:13,color:"#6b7280",fontFamily:SANS},

  contactGrid: {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12},
  contactCard: {background:"#fff",border:"1.5px solid #f0ebe3",borderRadius:14,padding:"18px 12px",cursor:"pointer",textAlign:"center" as const,display:"flex",flexDirection:"column" as const,alignItems:"center",boxShadow:"0 2px 10px rgba(0,0,0,.04)"},
  cNum:  {fontFamily:SERIF,fontSize:30,fontWeight:900,color:"#dc2626",letterSpacing:1,lineHeight:1},
  cName: {fontSize:12,fontWeight:700,color:"#1a0505",marginTop:4,marginBottom:4,fontFamily:SANS},
  cDesc: {fontSize:11,color:"#6b7280",lineHeight:1.4,fontFamily:SANS},

  locBanner: {display:"flex",alignItems:"center",gap:10,background:"#1d4ed8",color:"#fff",padding:"12px 16px",borderRadius:10,fontSize:14,fontWeight:600,marginBottom:16,fontFamily:SANS},
  errBanner: {display:"flex",alignItems:"flex-start",gap:10,background:"#fef3c7",border:"1px solid #fcd34d",color:"#92400e",padding:"12px 16px",borderRadius:10,fontSize:13,fontWeight:500,marginBottom:16,fontFamily:SANS},

  detectBtn: {background:"#1a0505",color:"#fff",border:"none",padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:SANS},
  mapsBtn:   {background:"#1d4ed8",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:SANS},

  hospGrid: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  hospCard: {background:"#fff",border:"1.5px solid #f0ebe3",borderRadius:14,padding:"16px 18px",boxShadow:"0 2px 10px rgba(0,0,0,.04)",display:"flex",flexDirection:"column" as const,animation:"fadeUp .35s ease both"},
  hName:    {fontSize:14,fontWeight:700,color:"#1a0505",lineHeight:1.4,fontFamily:SANS},
  hAddr:    {fontSize:12,color:"#6b7280",marginTop:2,fontFamily:SANS},
  hDist:    {background:"#fee2e2",color:"#dc2626",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,whiteSpace:"nowrap" as const,flexShrink:0,fontFamily:SANS},
  nearBadge:{background:"#fef3c7",color:"#b45309",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,fontFamily:SANS},
  typeBadge:{background:"#f0fdf4",color:"#15803d",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,fontFamily:SANS},
  dirBtn:   {marginTop:"auto" as const,padding:"9px 14px",border:"1.5px solid #dc2626",borderRadius:9,background:"transparent",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"center" as const,fontFamily:SANS},
  emptyCard:{background:"#fff",border:"1px solid #f0ebe3",borderRadius:14,padding:"32px 20px",textAlign:"center" as const,boxShadow:"0 2px 10px rgba(0,0,0,.04)"},

  tipCard: {background:"#fff",border:"1.5px solid #f0ebe3",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.04)"},
  tipNum:  {width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,fontFamily:SANS},

  doCard:   {background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:14,padding:18},
  dontCard: {background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:14,padding:18},

  overlay:    {position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modal:      {background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:340,width:"100%",textAlign:"center" as const,boxShadow:"0 24px 64px rgba(0,0,0,.2)"},
  cancelBtn:  {flex:1,padding:"12px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"transparent",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:SANS,color:"#374151"},
  confirmBtn: {flex:2,padding:"12px",borderRadius:10,border:"none",background:"#dc2626",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:SANS,boxShadow:"0 6px 20px rgba(220,38,38,.3)"},

  footer: {textAlign:"center" as const,paddingTop:32,borderTop:"1px solid #f0ebe3",marginTop:20,fontFamily:SANS},
};