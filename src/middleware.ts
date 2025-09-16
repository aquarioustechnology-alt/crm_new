import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;
        // Always allow sign-in page
        if (p === "/signin") return true;

        // In development, allow unauthenticated access to diagnostic and upload endpoints
        if (process.env.NODE_ENV !== 'production') {
          if (
            p.startsWith('/api/upload') ||
            p.startsWith('/api/diag') ||
            p.startsWith('/api/health')
          ) {
            return true;
          }
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - signin (sign-in page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|signin).*)",
  ],
};
