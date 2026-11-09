import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { can, type Permission, type Role } from "@/lib/rbac";

/**
 * LOCAL DEMO SESSION. Until Auth.js sign-in is enabled, the current user is one of
 * the seeded demo users, selected with a cookie from Settings. This lets you test
 * role-based permissions locally. It is not authentication - do not expose this
 * build on the internet.
 */
export const DEMO_USER_COOKIE = "acesign_demo_user";
export const DEFAULT_DEMO_EMAIL = "demo.manager@example.com";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function getCurrentUser(): Promise<SessionUser> {
  const email = (await cookies()).get(DEMO_USER_COOKIE)?.value ?? DEFAULT_DEMO_EMAIL;
  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.findUnique({ where: { email: DEFAULT_DEMO_EMAIL } }));
  if (!user) throw new Error("No demo user found. Run `npm run db:seed`.");
  return { id: user.id, name: user.name ?? user.email, email: user.email, role: user.role };
}

export class PermissionError extends Error {
  constructor(permission: Permission) {
    super(`Your role does not allow this action (${permission}).`);
    this.name = "PermissionError";
  }
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!can(user.role, permission)) throw new PermissionError(permission);
  return user;
}
