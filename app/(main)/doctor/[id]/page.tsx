"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

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

const GREEN = "#1a5c45";
const SANS  = "'DM Sans', system-ui, sans-serif";
const SERIF = "'Lora', Georgia, serif";

export default function DoctorProfilePage() {
  const router   = useRouter();
  const params   = useParams();
  const doctorId = params?.id as string;

  const [doctor, setDoctor]   = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Booking form state
  const [showForm, setShowForm]       = useState(false);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone]             = useState("");
  const [symptoms, setSymptoms]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  // Check if already logged in as patient
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from("patients")
          .select("id, full_name, phone")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data) {
          setPatientId(data.id);
          setPatientName(data.full_name ?? "");
          setPhone(data.phone ?? "");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctors")
        .select("id, full_name, specialization, experience_years, consultation_fee, language, is_available, verified")
        .eq("id", doctorId)
        .maybeSingle();
      if (error) setError(error.message);
      else setDoctor(data as Doctor | null);
      setLoading(false);
    })();
  }, [doctorId]);

  const handleSubmit = async () => {
    if (!patientName.trim()) { setFormError("Please enter your name."); return; }
    if (!phone.trim())       { setFormError("Please enter your phone number."); return; }
    if (!symptoms.trim())    { setFormError("Please describe your symptoms."); return; }

    setSubmitting(true);
    setFormError(null);

    // If logged in as patient, use their id; else create a guest consultation
const insertData: Record<string, string | null> = {
  doctor_id: doctorId,          // ← this must always be set
  patient_id: patientId ?? null,
  symptoms:  symptoms.trim(),
  status:    "pending",
  mode:      "chat",
};
    if (patientId) insertData.patient_id = patientId;

    const { error } = await supabase.from("consultations").insert(insertData);

    setSubmitting(false);
    if (error) { setFormError("Failed to book. Please try again."); return; }
    setSubmitted(true);
  };

  if (loading) return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.loadingText}>Loading doctor profile…</div>
      </div>
    </div>
  );

  if (error || !doctor) return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={{ marginBottom: 12, fontWeight: 600 }}>Could not load doctor profile</div>
        <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 16 }}>{error || "Doctor not found."}</div>
        <button style={S.backBtn} onClick={() => router.push("/")}>← Back to home</button>
      </div>
    </div>
  );

  const available = doctor.is_available !== false;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={S.root}>
      <div style={{ ...S.card, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#0f1a10", marginBottom: 10 }}>
          Consultation Requested!
        </h2>
        <p style={{ fontSize: 14, color: "#718096", lineHeight: 1.7, marginBottom: 24 }}>
          Dr. {doctor.full_name} has been notified and will review your request shortly.
          You'll receive a response via the platform.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={S.bookBtn} onClick={() => router.push("/dashboard")}>Go to Dashboard →</button>
          <button style={S.outlineBtn} onClick={() => router.push("/")}>Back to Home</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 3px rgba(26,92,69,.1) !important; outline: none; }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .booking-form { animation: slideUp .3s ease both; }
      `}</style>

      <div style={S.card}>
        <button style={S.backBtn} onClick={() => router.push("/")}>← Back to home</button>

        {/* Doctor header */}
        <div style={S.docHeader}>
          <div style={S.avatar}>👨‍⚕️</div>
          <div style={{ flex: 1 }}>
            <h1 style={S.title}>Dr. {doctor.full_name}</h1>
            <div style={S.metaRow}>
              {doctor.specialization && <span style={S.metaTag}>{doctor.specialization}</span>}
              {doctor.experience_years != null && <span style={S.metaTag}>{doctor.experience_years} yrs exp</span>}
              {doctor.language && <span style={S.metaTag}>🗣️ {doctor.language}</span>}
              <span style={{ ...S.metaTag, background: available ? "#dcfce7" : "#fee2e2", color: available ? "#166534" : "#991b1b" }}>
                {available ? "✅ Available" : "🔴 Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={S.section}>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Consultation Fee</span>
            <span style={{ ...S.fieldValue, color: GREEN, fontWeight: 700 }}>
              {doctor.consultation_fee != null ? `₹${doctor.consultation_fee}` : "Free"}
            </span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Verified</span>
            <span style={S.fieldValue}>{doctor.verified ? "✅ Verified" : "⏳ Pending"}</span>
          </div>
        </div>

        <div style={S.divider} />

        {/* Booking form or trigger */}
        {!showForm ? (
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            {available ? (
              <>
                <p style={{ fontSize: 14, color: "#718096", marginBottom: 18 }}>
                  Ready to consult with Dr. {doctor.full_name}? Fill in a few details to get started.
                </p>
                <button style={S.bookBtn} onClick={() => setShowForm(true)}>
                  🩺 Book Consultation
                </button>
              </>
            ) : (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", color: "#991b1b", fontSize: 14, fontWeight: 500 }}>
                Dr. {doctor.full_name} is currently unavailable. Please check back later or choose another doctor.
              </div>
            )}
          </div>
        ) : (
          <div className="booking-form">
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#0f1a10", marginBottom: 18 }}>
              📋 Consultation Details
            </h2>

            {formError && (
              <div style={S.errorBanner}>{formError}</div>
            )}

            <div style={S.formRow}>
              <label style={S.label}>Your Name *</label>
              <input
                style={S.input}
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div style={S.formRow}>
              <label style={S.label}>Phone Number *</label>
              <input
                style={S.input}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div style={S.formRow}>
              <label style={S.label}>Describe Your Symptoms *</label>
              <textarea
                style={{ ...S.input, minHeight: 100, resize: "vertical" }}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. Fever for 2 days, headache, sore throat…"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={S.outlineBtn} onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </button>
              <button
                style={{ ...S.bookBtn, flex: 1, opacity: submitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send Consultation Request →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#f7f3ee",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    fontFamily: SANS,
  },
  card: {
    width: "100%",
    maxWidth: 600,
    background: "white",
    borderRadius: 20,
    padding: "28px 28px 32px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.09)",
  },
  loadingText: { fontSize: 14, color: "#718096", padding: "20px 0" },
  backBtn: {
    border: "none", background: "transparent", color: GREEN,
    fontSize: 14, marginBottom: 20, cursor: "pointer", padding: 0,
    fontFamily: SANS,
  },
  docHeader: { display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 },
  avatar: {
    fontSize: 36, width: 60, height: 60, background: "#e8f5f0",
    borderRadius: 16, display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  title: {
    fontFamily: SERIF, fontSize: 22, fontWeight: 700,
    color: "#1a202c", marginBottom: 10,
  },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  metaTag: {
    fontSize: 12, padding: "4px 10px", borderRadius: 999,
    background: "#e8f5f0", color: GREEN,
  },
  section: { marginBottom: 20 },
  fieldRow: {
    display: "flex", justifyContent: "space-between",
    padding: "10px 0", borderBottom: "1px solid #edf2f7", fontSize: 14,
  },
  fieldLabel: { color: "#718096" },
  fieldValue: { color: "#2d3748", fontWeight: 500 },
  divider: { height: 1, background: "#f0ebe3", margin: "4px 0 24px" },
  formRow: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: 700, color: "#a0aec0",
    textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: SANS,
  },
  input: {
    padding: "11px 14px", border: "1.5px solid #e2d9ce", borderRadius: 10,
    fontSize: 14, fontFamily: SANS, color: "#1a202c",
    background: "#fdfaf7", width: "100%",
  },
  errorBanner: {
    background: "#fee2e2", border: "1px solid #fca5a5",
    color: "#dc2626", fontSize: 13, fontWeight: 600,
    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
  },
  bookBtn: {
    background: GREEN, color: "white", border: "none",
    padding: "13px 24px", borderRadius: 12, fontSize: 15,
    fontWeight: 600, cursor: "pointer", fontFamily: SANS,
    boxShadow: "0 6px 20px rgba(26,92,69,.25)",
  },
  outlineBtn: {
    background: "transparent", color: "#4a5568",
    border: "1.5px solid #e2d9ce", padding: "13px 20px",
    borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: SANS,
  },
};