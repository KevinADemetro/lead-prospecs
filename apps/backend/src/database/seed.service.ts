import { SYSTEM_ADMIN_ROLE_NAME } from '@app/shared';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EnvService } from '../config/env.service';
import { PasswordService } from '../common/security/password.service';
import { PrismaService } from './prisma.service';
import { ensureAdminSeed } from './seed-admin';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly env: EnvService,
    private readonly passwords: PasswordService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.env.values.isTest) {
      return;
    }
    await this.ensureAdmin();
  }

  async ensureAdmin(): Promise<void> {
    const result = await ensureAdminSeed(this.prisma, {
      login: this.env.values.INITIAL_ADMIN_LOGIN,
      passwordHash: await this.passwords.hash(this.env.values.INITIAL_ADMIN_PASSWORD),
    });
    if (result.createdRole) {
      this.logger.log(`Papel ${SYSTEM_ADMIN_ROLE_NAME} criado`);
    }
    if (result.createdUser) {
      this.logger.log(`Usuário administrador inicial criado: ${this.env.values.INITIAL_ADMIN_LOGIN.toLowerCase()}`);
    }
  }
}
