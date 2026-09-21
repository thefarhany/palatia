/** Shared role constants — safe for both client and server. */
export type Role = "ADMIN" | "CHEF" | "WAITER" | "CUSTOMER";

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  CHEF: "/kitchen",
  WAITER: "/waiter/orders",
  CUSTOMER: "/menu",
};