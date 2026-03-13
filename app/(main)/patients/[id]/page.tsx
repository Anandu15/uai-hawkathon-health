"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  village: string | null;
  district: string | null;
  language: string | null;
}

export default function PatientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchPatient = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender, village, district, language")
        .eq("id", patientId)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else {
        setPatient(data as Patient | null);
      }

      setLoading(false);
    };

    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div style={pageStyles.root}>
        <div style={pageStyles.card}>Loading patient profile...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={pageStyles.root}>
        <div style={pageStyles.card}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>
            Could not load patient profile
          </div>
          <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 16 }}>
            {error || "Patient not found."}
          </div>
          <button
            style={pageStyles.backBtn}
            onClick={() => router.push("/doctor/dashboard")}
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const location = [patient.village, patient.district]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={pageStyles.root}>
      <div style={pageStyles.card}>
        <button
          style={pageStyles.backLink}
          onClick={() => router.push("/doctor/dashboard")}
        >
          ← Back to dashboard
        </button>

        <h1 style={pageStyles.title}>{patient.full_name}</h1>

        <div style={pageStyles.metaRow}>
          {patient.gender && (
            <span style={pageStyles.metaTag}>{patient.gender}</span>
          )}
          {patient.age != null && (
            <span style={pageStyles.metaTag}>Age {patient.age}</span>
          )}
          {patient.language && (
            <span style={pageStyles.metaTag}>Language: {patient.language}</span>
          )}
        </div>

        <div style={pageStyles.section}>
          <h2 style={pageStyles.sectionTitle}>Basic details</h2>
          <div style={pageStyles.fieldRow}>
            <span style={pageStyles.fieldLabel}>Location</span>
            <span style={pageStyles.fieldValue}>
              {location || "Not specified"}
            </span>
          </div>
          <div style={pageStyles.fieldRow}>
            <span style={pageStyles.fieldLabel}>Patient ID</span>
            <span style={pageStyles.fieldValue}>{patient.id}</span>
          </div>
        </div>

        {/* Later you can add medical history, prescriptions, notes, etc. */}
      </div>
    </div>
  );
}

const pageStyles: { [k: string]: React.CSSProperties } = {
  root: {
    minHeight: "100vh",
    background: "#f7f3ee",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "white",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont",
  },
  backLink: {
    border: "none",
    background: "transparent",
    color: "#1a5c45",
    fontSize: 14,
    marginBottom: 10,
    cursor: "pointer",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1a202c",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  metaTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#edf2f7",
    color: "#4a5568",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    color: "#2d3748",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #edf2f7",
    fontSize: 14,
  },
  fieldLabel: {
    color: "#718096",
  },
  fieldValue: {
    color: "#2d3748",
    fontWeight: 500,
    maxWidth: 260,
    textAlign: "right",
  }}