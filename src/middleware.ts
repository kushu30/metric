import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token?.role && pathname !== "/select-role") {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }

    if (token?.role && pathname === "/select-role") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

// Ensure '/profile' is included in this list
export const config = {
  matcher: ["/dashboard", "/lender-dashboard", "/select-role", "/profile"],
};