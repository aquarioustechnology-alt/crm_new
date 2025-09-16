import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Ensure NextAuth runs on Node.js runtime in production
export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
