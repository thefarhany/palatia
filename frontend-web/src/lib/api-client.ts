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

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      details?: Record<string, string[]>;
    };
    const e = new Error(err.error ?? `API ${res.status}`) as Error & {
      details?: Record<string, string[]>;
    };
    e.details = err.details;
    throw e;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
