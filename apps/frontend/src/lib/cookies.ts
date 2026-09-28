export function readCookie(name: string): string | null {
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export type ApiError = {
  status: number;
  message: string;
};

export function isApiError(value: unknown): value is ApiError {
  return Boolean(value && typeof value === 'object' && 'status' in value && 'message' in value);
}
