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

export default function DoctorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params?.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.card}>Loading doctor profile...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div style={S.root}>
        <div style={S.card}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>Could not load doctor profile</div>
          <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 16 }}>{error || "Doctor not found."}</div>
          <button style={S.backBtn} onClick={() => router.push("/")}>← Back to home</button>
        </div>
      </div>
    );
  }

  const available = doctor.is_available !== false;

  return (
    <div style={S.root}>
      <div style={S.card}>
        <button style={S.backBtn} onClick={() => router.push("/")}>← Back to home</button>

        <h1 style={S.title}>Dr. {doctor.full_name}</h1>

        <div style={S.metaRow}>
          {doctor.specialization && <span style={S.metaTag}>{doctor.specialization}</span>}
          {doctor.experience_years != null && <span style={S.metaTag}>{doctor.experience_years} yrs experience</span>}
          {doctor.language && <span style={S.metaTag}>🗣️ {doctor.language}</span>}
          <span style={{ ...S.metaTag, background: available ? "#dcfce7" : "#fee2e2", color: available ? "#166534" : "#991b1b" }}>
            {available ? "✅ Available" : "🔴 Unavailable"}
          </span>
        </div>

        <div style={S.section}>
          <h2 style={S.sectionTitle}>Consultation details</h2>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Fee</span>
            <span style={S.fieldValue}>{doctor.consultation_fee != null ? "₹" + doctor.consultation_fee : "Free"}</span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Verified</span>
            <span style={S.fieldValue}>{doctor.verified ? "Yes ✅" : "Pending"}</span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Doctor ID</span>
            <span style={S.fieldValue}>{doctor.id}</span>
          </div>
        </div>

        <button
          style={S.bookBtn}
          onClick={() => router.push("/auth")}
        >
          🩺 Book Consultation
        </button>
      </div>
    </div>
  );
}

const S: { [k: string]: React.CSSProperties } = {
  root: {
    minHeight: "100vh",
    background: "#f7f3ee",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "white",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  backBtn: {
    border: "none",
    background: "transparent",
    color: "#1a5c45",
    fontSize: 14,
    marginBottom: 16,
    cursor: "pointer",
    padding: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 10,
    color: "#1a202c",
    fontFamily: "'Lora', Georgia, serif",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 24,
  },
  metaTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#e8f5f0",
    color: "#1a5c45",
  },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    color: "#2d3748",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #edf2f7",
    fontSize: 14,
  },
  fieldLabel: { color: "#718096" },
  fieldValue: {
    color: "#2d3748",
    fontWeight: 500,
    maxWidth: 260,
    textAlign: "right" as const,
  },
  bookBtn: {
    marginTop: 24,
    width: "100%",
    background: "#1a5c45",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
};