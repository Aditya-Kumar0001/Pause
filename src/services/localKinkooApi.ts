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
  const user = auth?.currentUser;
  if (!user) throw new LocalKinkooApiError('Sign in to continue.', 401);
  const idToken = await user.getIdToken();
  const response = await fetch(`/api/kinkoo${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new LocalKinkooApiError(result.error || 'Kinkoo request failed.', response.status);
  return result as T;
}
