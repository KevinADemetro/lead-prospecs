export const COOKIE = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  CSRF: 'csrf_token',
} as const;

export const HEADER = {
  CSRF: 'x-csrf-token',
  REQUEST_ID: 'x-request-id',
} as const;
