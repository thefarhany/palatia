import type { Role } from "@/lib/roles";

export type { Role };

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatar?: string | null;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CHEF" | "WAITER";
  isActive: boolean;
}

export interface StaffForm {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "CHEF" | "WAITER";
}
