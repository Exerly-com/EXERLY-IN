import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If NOT logged in and trying to access /dashboard
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login"; // 👈 change to your login/signup route
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Apply middleware only to dashboard pages
export const config = {
  matcher: ["/dashboard/:path*"],
};
