import { CookieOptions, Response } from 'express';
import { AppEnv } from './env';
import { COOKIE } from './constants';

function baseCookie(env: AppEnv): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setCsrfCookie(res: Response, env: AppEnv, csrfToken: string): void {
  const base = baseCookie(env);
  const refreshMs = env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE.CSRF, csrfToken, {
    ...base,
    httpOnly: false,
    maxAge: refreshMs,
  });
}

export function setAuthCookies(
  res: Response,
  env: AppEnv,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string },
): void {
  const base = baseCookie(env);
  const refreshMs = env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

  res.cookie(COOKIE.ACCESS, tokens.accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(COOKIE.REFRESH, tokens.refreshToken, {
    ...base,
    maxAge: refreshMs,
  });

  setCsrfCookie(res, env, tokens.csrfToken);
}

export function clearAuthCookies(res: Response, env: AppEnv): void {
  const base = baseCookie(env);
  res.clearCookie(COOKIE.ACCESS, base);
  res.clearCookie(COOKIE.REFRESH, base);
  res.clearCookie(COOKIE.CSRF, { ...base, httpOnly: false });
}
