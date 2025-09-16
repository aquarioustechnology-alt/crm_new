import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    firstName: string;
    lastName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    id: string;
    firstName: string;
    lastName: string;
  }
}
