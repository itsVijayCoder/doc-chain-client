import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
   "/login",
   "/register",
   "/forgot-password",
   "/reset-password",
];

// Define admin-only routes
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;

   // Skip middleware in development with mock auth
   const useMockAuth =
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true" ||
      process.env.NODE_ENV === "development";
   if (useMockAuth) {
      return NextResponse.next();
   }

   // Check if the route is public
   const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
   );

   // Get the token from cookies
   const token = request.cookies.get("token")?.value;

   // Get user role from cookies (you should set this during login)
   const userRole = request.cookies.get("userRole")?.value;

   // If trying to access a protected route without a token
   if (!isPublicRoute && !token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
   }

   // If trying to access admin route without admin role
   const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
   if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
   }

   // If already logged in and trying to access public routes
   if (isPublicRoute && token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
   }

   return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
   matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - public files (public directory)
       */
      "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
   ],
};
