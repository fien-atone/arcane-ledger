const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const realClient = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, data: unknown) => request<T>('POST', url, data),
  put: <T>(url: string, data: unknown) => request<T>('PUT', url, data),
  delete: <T>(url: string) => request<T>('DELETE', url),
};
