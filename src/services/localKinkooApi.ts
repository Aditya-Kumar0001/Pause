import { auth } from '../firebase/auth';

export class LocalKinkooApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LocalKinkooApiError';
    this.status = status;
  }
}

export async function kinkooApi<T>(path: string, body?: unknown): Promise<T> {
  if (!auth) throw new LocalKinkooApiError('Firebase is not configured.', 401);
  await auth.authStateReady();
  const user = auth?.currentUser;
  if (!user) throw new LocalKinkooApiError('Sign in to continue.', 401);
  const idToken = await user.getIdToken();
  const apiOrigin = (import.meta.env.VITE_KINKOO_API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${apiOrigin}/api/kinkoo${path}`;
  const serializedBody = body === undefined ? undefined : JSON.stringify(body);
  const request = (token: string) => fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    body: serializedBody
  });

  let response = await request(idToken);
  if (response.status === 401) {
    response = await request(await user.getIdToken(true));
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new LocalKinkooApiError(result.error || 'Kinkoo request failed.', response.status);
  return result as T;
}
