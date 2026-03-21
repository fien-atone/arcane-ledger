type HttpMethod = 'get' | 'post' | 'put' | 'delete';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(method: HttpMethod, url: string, _data?: unknown): Promise<T> {
  await delay(200);
  console.log(`[mockClient] ${method.toUpperCase()} ${url}`);
  throw new Error(`Mock not implemented for ${method.toUpperCase()} ${url}`);
}

export const mockClient = {
  get: <T>(url: string) => request<T>('get', url),
  post: <T>(url: string, data: unknown) => request<T>('post', url, data),
  put: <T>(url: string, data: unknown) => request<T>('put', url, data),
  delete: <T>(url: string) => request<T>('delete', url),
};
