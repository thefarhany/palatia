import { apiClient } from "@/lib/api-client";
import type { AuditLog } from "@/lib/types";

export const auditService = {
  list: () => apiClient<{ logs: AuditLog[] }>("/bo/audit").then((r) => r.logs),
};
