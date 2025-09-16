import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export function isAdmin(user: any) {
  return user?.role === "ADMIN";
}

export function isUser(user: any) {
  return user?.role === "USER";
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdmin(user)) {
    throw new Error("Admin access required");
  }
  return user;
}

export function canAccessAdmin(user: any) {
  return isAdmin(user);
}

export function canManageUsers(user: any) {
  return isAdmin(user);
}

export function canViewAllLeads(user: any) {
  return isAdmin(user);
}

export function canEditLead(user: any, leadOwnerId?: string) {
  // Admins can edit any lead, users can only edit their own leads
  return isAdmin(user) || user?.id === leadOwnerId;
}
