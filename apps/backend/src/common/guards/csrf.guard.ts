import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_CSRF_KEY } from '../decorators/public.decorator';
import { COOKIE, HEADER } from '../../config/constants';
import { safeEqual } from '../security/crypto.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const cookie = request.cookies?.[COOKIE.CSRF];
    const header = request.header(HEADER.CSRF);
    if (!cookie || !header || typeof cookie !== 'string' || typeof header !== 'string') {
      throw new ForbiddenException('Falha de validação CSRF');
    }
    if (!safeEqual(cookie, header)) {
      throw new ForbiddenException('Falha de validação CSRF');
    }
    return true;
  }
}
