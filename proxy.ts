import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 proxy middleware. This app uses bearer-token auth stored in
// client-side memory/localStorage, so the proxy cannot see tokens and does
// NOT perform authorization. Route protection is handled client-side via
// <AuthGuard> in app/(dashboard)/layout.tsx.
//
// Kept as a pass-through with the matcher config so future additions (edge
// headers, logging, feature flags) have an obvious home. If auth ever moves
// to httpOnly cookies, this file is where cookie-based guards would live.

export default function proxy(_request: NextRequest) {
   return NextResponse.next();
}

export const config = {
   matcher: [
      "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
   ],
};
