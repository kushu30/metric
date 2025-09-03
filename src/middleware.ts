// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // After signing in, if user hasn't selected a role yet,
    // redirect them to the role selection page.
    if (!token?.role && pathname !== "/select-role") {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }

    // If they have a role but try to access the role selection page,
    // redirect them to their dashboard.
    if (token?.role && pathname === "/select-role") {
      const destination = token.role === 'lender' ? '/lender-dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(destination, req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/", // Redirect unauthenticated users to the homepage
    },
  }
);

// Add all protected routes to the matcher
export const config = {
  matcher: ["/dashboard/:path*", "/lender-dashboard/:path*", "/profile/:path*", "/repayments/:path*", "/select-role", "/vouch"],
};