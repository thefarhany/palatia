import { create } from "zustand";
import { auditService } from "@/services/audit-service";
import type { AuditLog } from "@/lib/types";

interface AuditState {
  logs: AuditLog[];
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useAuditStore = create<AuditState>()((set) => ({
  logs: [],
  loaded: false,
  fetch: async () => {
    const logs = await auditService.list().catch(() => []);
    set({ logs, loaded: true });
  },
}));
