import { create } from "zustand";
import { staffService } from "@/services/auth-service";
import type { StaffMember } from "@/lib/types";

interface StaffState {
  staff: StaffMember[];
  loaded: boolean;
  fetch: () => Promise<void>;
  toggleActive: (member: StaffMember) => Promise<void>;
  save: (id: number | null, data: { name: string; role: StaffMember["role"]; email?: string; password?: string }) => Promise<void>;
}

export const useStaffStore = create<StaffState>()((set, get) => ({
  staff: [],
  loaded: false,
  fetch: async () => set({ staff: await staffService.list(), loaded: true }),
  toggleActive: async (member) => {
    await staffService.update(member.id, { isActive: !member.isActive });
    await get().fetch();
  },
  save: async (id, data) => {
    if (id) await staffService.update(id, { name: data.name, role: data.role });
    else
      await staffService.create({
        name: data.name,
        email: data.email!,
        password: data.password!,
        role: data.role,
      });
    await get().fetch();
  },
}));
