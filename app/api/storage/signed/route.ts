import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "missing path" }, { status: 400 });

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // RLS ensures the user can only sign their own files unless admin
  const { data, error } = await supabase.storage.from("kyc-docs").createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.redirect(data.signedUrl);
}
