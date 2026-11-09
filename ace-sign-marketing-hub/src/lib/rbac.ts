export const ROLES = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "content:create",
  "content:approve",
  "ads:create",
  "ads:approve",
  "ads:publish",
  "email:send",
  "leads:view",
  "leads:edit",
  "data:import",
  "settings:manage",
  "users:manage",
  "integrations:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  MANAGER: [
    "dashboard:view",
    "content:create",
    "content:approve",
    "ads:create",
    "ads:approve",
    "ads:publish",
    "email:send",
    "leads:view",
    "leads:edit",
    "data:import",
  ],
  EDITOR: ["dashboard:view", "content:create", "ads:create", "leads:view"],
  VIEWER: ["dashboard:view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full access including users, roles and integrations.",
  MANAGER: "Approves and publishes campaigns, sends email, imports data.",
  EDITOR: "Drafts ads and content; cannot approve or publish.",
  VIEWER: "Read-only access to dashboards and reports.",
};
