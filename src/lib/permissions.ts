/**
 * Role-based access control, defined per feature area.
 *
 * The matrix below is the single source of truth: API routes and UI both read
 * it, so a role can never be allowed in the interface but rejected by the
 * server (or worse, the reverse).
 */

export const ROLES = ["owner", "admin", "manager", "accountant", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const FEATURES = [
  "sales",
  "purchases",
  "inventory",
  "notes",
  "masters",
  "reports",
  "settings",
  "members",
  "data",
] as const;
export type Feature = (typeof FEATURES)[number];

/** none = invisible, view = read-only, manage = read + write. */
export type AccessLevel = "none" | "view" | "manage";
export type Action = "view" | "manage";

export interface RoleDefinition {
  label: string;
  description: string;
  /** Whether this role can be handed out in the invite UI. */
  assignable: boolean;
  access: Record<Feature, AccessLevel>;
}

const ALL_MANAGE: Record<Feature, AccessLevel> = {
  sales: "manage",
  purchases: "manage",
  inventory: "manage",
  notes: "manage",
  masters: "manage",
  reports: "manage",
  settings: "manage",
  members: "manage",
  data: "manage",
};

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  owner: {
    label: "Owner",
    description: "Full control, including billing data export and deleting the company.",
    // Ownership is established by creating or importing a company, not by invite.
    assignable: false,
    access: { ...ALL_MANAGE },
  },
  admin: {
    label: "Admin",
    description: "Everything an owner can do day to day, including inviting people.",
    assignable: true,
    access: { ...ALL_MANAGE },
  },
  manager: {
    label: "Manager",
    description: "Runs the books: sales, purchases, stock and returns. No settings or team access.",
    assignable: true,
    access: {
      sales: "manage",
      purchases: "manage",
      inventory: "manage",
      notes: "manage",
      masters: "manage",
      reports: "view",
      settings: "none",
      members: "none",
      data: "none",
    },
  },
  accountant: {
    label: "Accountant",
    description: "Reads every document and can export data for filing, but changes nothing.",
    assignable: true,
    access: {
      sales: "view",
      purchases: "view",
      inventory: "view",
      notes: "view",
      masters: "view",
      reports: "view",
      settings: "view",
      members: "none",
      // Export only — importing would create a company, which is an owner action.
      data: "view",
    },
  },
  viewer: {
    label: "Guest (view only)",
    description: "Read-only access to the books. Cannot change or export anything.",
    assignable: true,
    access: {
      sales: "view",
      purchases: "view",
      inventory: "view",
      notes: "view",
      masters: "view",
      reports: "view",
      settings: "none",
      members: "none",
      data: "none",
    },
  },
};

/** Roles that can actually be handed out from the invite screen. */
export const ASSIGNABLE_ROLES: Role[] = ROLES.filter(
  (role) => ROLE_DEFINITIONS[role].assignable
);

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Whether `role` may perform `action` on `feature`. */
export function can(role: Role, feature: Feature, action: Action): boolean {
  const level = ROLE_DEFINITIONS[role]?.access[feature] ?? "none";
  if (level === "none") return false;
  return action === "view" ? true : level === "manage";
}

/** True when the role cannot change anything at all — drives the guest banner. */
export function isReadOnly(role: Role): boolean {
  return FEATURES.every((feature) => !can(role, feature, "manage"));
}

/** Serialisable snapshot for the client, so the UI never re-derives the matrix. */
export type PermissionMap = Record<Feature, AccessLevel>;

export function permissionsFor(role: Role): PermissionMap {
  return { ...ROLE_DEFINITIONS[role].access };
}
