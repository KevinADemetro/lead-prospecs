import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { isEntityId } from '../../common/database/ids';
import { RefreshTokenRecord } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

type RefreshTokenRow = Prisma.RefreshTokenGetPayload<object>;

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    userAgent: string;
    ip: string;
  }): Promise<RefreshTokenRecord> {
    const token = await this.prisma.refreshToken.create({ data });
    return this.toRecord(token);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return token ? this.toRecord(token) : null;
  }

  async revoke(id: string): Promise<void> {
    if (!isEntityId(id)) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    if (!isEntityId(userId)) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async markReplaced(id: string, replacedByHash: string): Promise<void> {
    if (!isEntityId(id)) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { id },
      data: { revokedAt: new Date(), replacedByHash },
    });
  }

  private toRecord(token: RefreshTokenRow): RefreshTokenRecord {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      replacedByHash: token.replacedByHash,
      userAgent: token.userAgent,
      ip: token.ip,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    };
  }
}
