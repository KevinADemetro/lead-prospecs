import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { EnvService } from '../../config/env.service';
import { PasswordService } from '../../common/security/password.service';
import { randomToken, sha256 } from '../../common/security/crypto.util';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { toAuthContext } from '../../common/mappers/public.mapper';
import { AuthContext } from '../../common/types/auth-context';
import { UserRecord } from '../../common/database/records';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly passwords: PasswordService,
    private readonly users: UsersRepository,
    private readonly roles: RolesRepository,
    private readonly refreshTokens: RefreshTokensRepository,
  ) {}

  async login(login: string, password: string, req: Request) {
    const user = await this.users.findByLoginForAuth(login);
    if (!user) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await this.passwords.verify(user.passwordHash ?? '', password);
    if (!valid) {
      await this.registerFailure(user);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.users.updateById(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const context = await this.buildContext(user);
    const tokens = await this.issueSession(context.id, req);
    return { user: context, tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const stored = await this.refreshTokens.findByHash(sha256(refreshToken));
    if (stored && !stored.revokedAt) {
      await this.refreshTokens.revoke(stored.id);
    }
  }

  async refresh(refreshToken: string | undefined, req: Request) {
    if (!refreshToken) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const tokenHash = sha256(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    if (stored.revokedAt) {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const user = await this.users.findById(stored.userId);
    if (!user || user.status !== 'active') {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    const nextRefresh = randomToken();
    const nextHash = sha256(nextRefresh);
    await this.refreshTokens.markReplaced(stored.id, nextHash);
    await this.refreshTokens.create({
      userId: stored.userId,
      tokenHash: nextHash,
      familyId: stored.familyId,
      expiresAt: this.refreshExpiry(),
      userAgent: this.safeUa(req),
      ip: this.safeIp(req),
    });

    const context = await this.buildContext(user);
    return {
      user: context,
      tokens: {
        accessToken: await this.signAccess(context.id),
        refreshToken: nextRefresh,
        csrfToken: randomToken(24),
      },
    };
  }

  async authenticateAccessToken(token: string): Promise<AuthContext> {
    let payload: { sub?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    if (!payload.sub) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    return this.buildContext(user);
  }

  async getMe(userId: string): Promise<AuthContext> {
    const user = await this.users.findByIdOrFail(userId);
    if (user.status !== 'active') {
      throw new ForbiddenException('Conta desativada');
    }
    return this.buildContext(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findByIdForAuth(userId);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    const valid = await this.passwords.verify(user.passwordHash ?? '', currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    await this.users.updateById(userId, {
      passwordHash: await this.passwords.hash(newPassword),
    });
    await this.refreshTokens.revokeAllForUser(userId);
  }

  csrfToken(): string {
    return randomToken(24);
  }

  private async issueSession(userId: string, req: Request) {
    const refreshToken = randomToken();
    await this.refreshTokens.create({
      userId,
      tokenHash: sha256(refreshToken),
      familyId: randomUUID(),
      expiresAt: this.refreshExpiry(),
      userAgent: this.safeUa(req),
      ip: this.safeIp(req),
    });
    return {
      accessToken: await this.signAccess(userId),
      refreshToken,
      csrfToken: randomToken(24),
    };
  }

  private signAccess(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.env.values.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  }

  private async buildContext(user: UserRecord): Promise<AuthContext> {
    const roles = await this.roles.findByIds(user.roleIds);
    return toAuthContext(user, roles);
  }

  private async registerFailure(user: UserRecord): Promise<void> {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;
    await this.users.updateById(user.id, {
      failedLoginAttempts: attempts,
      lockedUntil,
    });
  }

  private safeUa(req: Request): string {
    return String(req.headers['user-agent'] ?? '').slice(0, 180);
  }

  private safeIp(req: Request): string {
    return String(req.ip ?? '').slice(0, 64);
  }
}
