const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';
const API_BASE = GRAPHQL_URL.replace(/\/graphql$/, '');

export async function uploadFile(
  campaignId: string,
  entity: 'npc' | 'character' | 'location' | 'species',
  entityId: string,
  file: File,
): Promise<string> {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload/${campaignId}/${entity}/${entityId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }

  const { path } = await res.json();
  return path;
}
