import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { EnvService } from '../../config/env.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const allowed = this.env.values.corsOrigins;
    const origin = request.headers.origin;
    if (origin) {
      if (!allowed.includes(origin)) {
        throw new ForbiddenException('Origin não permitida');
      }
      return true;
    }

    const referer = request.headers.referer;
    if (referer) {
      try {
        const url = new URL(referer);
        const refererOrigin = `${url.protocol}//${url.host}`;
        if (!allowed.includes(refererOrigin)) {
          throw new ForbiddenException('Origin não permitida');
        }
        return true;
      } catch {
        throw new ForbiddenException('Origin não permitida');
      }
    }

    // Same-origin proxied requests may omit Origin (e.g. some same-site navigations).
    // Mutating API calls from browsers typically send Origin; require it in production.
    if (this.env.values.isProduction) {
      throw new ForbiddenException('Origin não permitida');
    }
    return true;
  }
}
