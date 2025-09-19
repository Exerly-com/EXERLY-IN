import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Admin check via profiles.is_admin
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    console.error("Admin check error:", profErr);
    return NextResponse.json({ error: "Admin check failed" }, { status: 500 });
  }

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Update KYC
  const { error, data } = await supabase
    .from("kyc_submissions")
    .update({ status })
    .eq("id", id)
    .select("user_id,name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "KYC record not found" }, { status: 404 });
  }

  // Insert audit log
  await supabase.from("kyc_logs").insert({
    kyc_id: id,
    admin_id: user.id,
    action: status,
  });

  // Send email to team
  try {
    await resend.emails.send({
      from: "aman@exerly.in",
      to: ["aman@exerly.in"], // change to your real team email
      subject: `KYC ${status.toUpperCase()} for ${data.name}`,
      html: `<p>KYC <b>${status}</b> for user ${data.name}</p>`,
    });
  } catch (err) {
    console.error("Email send error:", err);
  }

  return NextResponse.json({ success: true, status });
}
