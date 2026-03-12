// app/api/delete-account/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin client — uses SERVICE ROLE key (never expose this on the frontend)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← server-only env var
);

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

// Delete child rows first, then parent
await supabaseAdmin.from("medical_records").delete().eq("patient_id", userId);
await supabaseAdmin.from("consultations").delete().eq("patient_id", userId);
await supabaseAdmin.from("patients").delete().eq("id", userId);
await supabaseAdmin.from("doctors").delete().eq("id", userId); // ← add this

const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
