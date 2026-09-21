export async function apiClient<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(`/api/proxy${path}`, {
    method: opts.method ?? "GET",
    headers:
      opts.body !== undefined && !isForm
        ? { "Content-Type": "application/json" }
        : undefined,
    body: isForm
      ? (opts.body as FormData)
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || (json && json.success === false)) {
    const message = json.message || json.error || `API ${res.status}`;
    const e = new Error(message) as Error & {
      errorCode?: string;
      details?: Record<string, string[]>;
    };
    e.errorCode = json.errorCode;
    e.details = json.details;
    throw e;
  }

  if (res.status === 204) return undefined as T;

  // Transparently unwrap BaseResponse envelope if present
  if (json && typeof json === "object" && "success" in json && "data" in json && json.data !== null) {
    return json.data as T;
  }

  return json as T;
}
