import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@app/shared';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { hasAllPermissions } from '../security/rbac.util';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.currentUser;
    if (!user) {
      throw new ForbiddenException('Acesso negado');
    }
    if (!hasAllPermissions(user.permissions, required)) {
      throw new ForbiddenException('Acesso negado');
    }
    return true;
  }
}
