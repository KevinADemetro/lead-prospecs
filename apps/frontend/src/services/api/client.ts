import type { AuthUser } from '@app/shared';
import { isApiError, readCookie, type ApiError } from '@/lib/cookies';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let refreshPromise: Promise<boolean> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function ensureCsrf(): Promise<void> {
  if (!readCookie('csrf_token')) {
    await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  await ensureCsrf();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const csrf = readCookie('csrf_token');
  if (csrf) {
    headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, init, false);
    }
    onUnauthorized?.();
    throw { status: 401, message: 'Sessão expirada' } satisfies ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    user?: AuthUser;
  };

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: payload.message ?? 'Não foi possível concluir a operação',
    };
    if (response.status === 401) {
      onUnauthorized?.();
    }
    throw error;
  }

  return payload as T;
}

export async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': readCookie('csrf_token') ?? '',
      },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export { isApiError };
