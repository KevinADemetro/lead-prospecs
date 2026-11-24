import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { ensureAdminSeed } from '../src/database/seed-admin';

type SeedSnapshot = {
  roles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deletedBy: string | null;
  }>;
  users: Array<{
    id: string;
    login: string;
    status: 'active' | 'inactive';
    failedLoginAttempts: number;
    lockedUntil: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deletedBy: string | null;
  }>;
  userRoles: Array<{ userId: string; roleId: string }>;
  campaigns: Array<Record<string, unknown>>;
  companies: Array<Record<string, unknown>>;
  painPoints: Array<Record<string, unknown>>;
  leads: Array<Record<string, unknown>>;
  outreach: Array<Record<string, unknown>>;
  outreachMessages: Array<Record<string, unknown>>;
};

function loadEnvFromRepo(): void {
  let dir = process.cwd();
  for (;;) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      return;
    }
    dir = parent;
  }
}

function asDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function remapId(
  value: string | null | undefined,
  idMap: Map<string, string>,
): string | null | undefined {
  if (value == null) return value;
  return idMap.get(value) ?? value;
}

loadEnvFromRepo();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function seedSnapshot(passwordHash: string): Promise<void> {
  const snapshotPath = resolve(__dirname, 'seed-data.json');
  if (!existsSync(snapshotPath)) {
    console.log('seed-data.json não encontrado — apenas admin será garantido');
    return;
  }

  const data = JSON.parse(readFileSync(snapshotPath, 'utf8')) as SeedSnapshot;
  const userIdMap = new Map<string, string>();
  const roleIdMap = new Map<string, string>();
  const painPointIdMap = new Map<string, string>();

  for (const role of data.roles) {
    const existingByName = await prisma.role.findUnique({ where: { name: role.name } });
    if (existingByName) {
      roleIdMap.set(role.id, existingByName.id);
      await prisma.role.update({
        where: { id: existingByName.id },
        data: {
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          deletedAt: asDate(role.deletedAt),
        },
      });
      continue;
    }

    await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        createdAt: asDate(role.createdAt)!,
        updatedAt: asDate(role.updatedAt)!,
        deletedAt: asDate(role.deletedAt),
        deletedBy: role.deletedBy,
      },
    });
    roleIdMap.set(role.id, role.id);
  }

  for (const user of data.users) {
    const existingByLogin = await prisma.user.findUnique({ where: { login: user.login } });
    if (existingByLogin) {
      userIdMap.set(user.id, existingByLogin.id);
      await prisma.user.update({
        where: { id: existingByLogin.id },
        data: {
          status: user.status,
          failedLoginAttempts: 0,
          lockedUntil: null,
          deletedAt: asDate(user.deletedAt),
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        id: user.id,
        login: user.login,
        passwordHash,
        status: user.status,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: asDate(user.createdAt)!,
        updatedAt: asDate(user.updatedAt)!,
        deletedAt: asDate(user.deletedAt),
        deletedBy: user.deletedBy,
      },
    });
    userIdMap.set(user.id, user.id);
  }

  for (const link of data.userRoles) {
    const userId = userIdMap.get(link.userId) ?? link.userId;
    const roleId = roleIdMap.get(link.roleId) ?? link.roleId;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }

  for (const campaign of data.campaigns) {
    const id = String(campaign.id);
    await prisma.campaign.upsert({
      where: { id },
      create: {
        id,
        name: String(campaign.name),
        description: String(campaign.description ?? ''),
        location: String(campaign.location),
        city: String(campaign.city ?? ''),
        state: String(campaign.state ?? ''),
        categories: (campaign.categories as string[]) ?? [],
        status: campaign.status as never,
        createdAt: asDate(campaign.createdAt)!,
        updatedAt: asDate(campaign.updatedAt)!,
        deletedAt: asDate(campaign.deletedAt),
        deletedBy: remapId(campaign.deletedBy as string | null, userIdMap) ?? null,
      },
      update: {
        name: String(campaign.name),
        description: String(campaign.description ?? ''),
        location: String(campaign.location),
        city: String(campaign.city ?? ''),
        state: String(campaign.state ?? ''),
        categories: (campaign.categories as string[]) ?? [],
        status: campaign.status as never,
        deletedAt: asDate(campaign.deletedAt),
        deletedBy: remapId(campaign.deletedBy as string | null, userIdMap) ?? null,
      },
    });
  }

  for (const company of data.companies) {
    const id = String(company.id);
    await prisma.company.upsert({
      where: { id },
      create: {
        id,
        name: String(company.name),
        legalName: (company.legalName as string | null) ?? null,
        cnpj: (company.cnpj as string | null) ?? null,
        category: (company.category as string | null) ?? null,
        niche: (company.niche as string | null) ?? null,
        phone: (company.phone as string | null) ?? null,
        email: (company.email as string | null) ?? null,
        website: (company.website as string | null) ?? null,
        address: (company.address as string | null) ?? null,
        neighborhood: (company.neighborhood as string | null) ?? null,
        city: (company.city as string | null) ?? null,
        state: (company.state as string | null) ?? null,
        country: (company.country as string | null) ?? null,
        googlePlaceId: (company.googlePlaceId as string | null) ?? null,
        googleMapsUrl: (company.googleMapsUrl as string | null) ?? null,
        whatsappUrl: (company.whatsappUrl as string | null) ?? null,
        instagramUrl: (company.instagramUrl as string | null) ?? null,
        facebookUrl: (company.facebookUrl as string | null) ?? null,
        openingHours:
          company.openingHours === undefined
            ? undefined
            : ((company.openingHours as Prisma.InputJsonValue | null) ?? Prisma.JsonNull),
        dedupeKey: (company.dedupeKey as string | null) ?? null,
        createdAt: asDate(company.createdAt)!,
        updatedAt: asDate(company.updatedAt)!,
        deletedAt: asDate(company.deletedAt),
        deletedBy: remapId(company.deletedBy as string | null, userIdMap) ?? null,
      },
      update: {
        name: String(company.name),
        legalName: (company.legalName as string | null) ?? null,
        cnpj: (company.cnpj as string | null) ?? null,
        category: (company.category as string | null) ?? null,
        niche: (company.niche as string | null) ?? null,
        phone: (company.phone as string | null) ?? null,
        email: (company.email as string | null) ?? null,
        website: (company.website as string | null) ?? null,
        address: (company.address as string | null) ?? null,
        neighborhood: (company.neighborhood as string | null) ?? null,
        city: (company.city as string | null) ?? null,
        state: (company.state as string | null) ?? null,
        country: (company.country as string | null) ?? null,
        googlePlaceId: (company.googlePlaceId as string | null) ?? null,
        googleMapsUrl: (company.googleMapsUrl as string | null) ?? null,
        whatsappUrl: (company.whatsappUrl as string | null) ?? null,
        instagramUrl: (company.instagramUrl as string | null) ?? null,
        facebookUrl: (company.facebookUrl as string | null) ?? null,
        openingHours:
          company.openingHours === undefined
            ? undefined
            : ((company.openingHours as Prisma.InputJsonValue | null) ?? Prisma.JsonNull),
        dedupeKey: (company.dedupeKey as string | null) ?? null,
        deletedAt: asDate(company.deletedAt),
        deletedBy: remapId(company.deletedBy as string | null, userIdMap) ?? null,
      },
    });
  }

  for (const painPoint of data.painPoints) {
    const id = String(painPoint.id);
    const name = String(painPoint.name);
    const existingByName = await prisma.painPoint.findUnique({ where: { name } });
    if (existingByName) {
      painPointIdMap.set(id, existingByName.id);
      await prisma.painPoint.update({
        where: { id: existingByName.id },
        data: {
          description: String(painPoint.description ?? ''),
          deletedAt: asDate(painPoint.deletedAt),
          deletedBy: remapId(painPoint.deletedBy as string | null, userIdMap) ?? null,
        },
      });
      continue;
    }

    await prisma.painPoint.create({
      data: {
        id,
        name,
        description: String(painPoint.description ?? ''),
        createdAt: asDate(painPoint.createdAt)!,
        updatedAt: asDate(painPoint.updatedAt)!,
        deletedAt: asDate(painPoint.deletedAt),
        deletedBy: remapId(painPoint.deletedBy as string | null, userIdMap) ?? null,
      },
    });
    painPointIdMap.set(id, id);
  }

  for (const lead of data.leads) {
    const id = String(lead.id);
    const rawPainPointId = (lead.painPointId as string | null) ?? null;
    const painPointId = rawPainPointId
      ? (painPointIdMap.get(rawPainPointId) ?? rawPainPointId)
      : null;
    await prisma.lead.upsert({
      where: { id },
      create: {
        id,
        companyId: String(lead.companyId),
        campaignId: String(lead.campaignId),
        painPointId,
        websiteStatus: lead.websiteStatus as never,
        qualificationStatus: lead.qualificationStatus as never,
        priority: Boolean(lead.priority),
        notes: (lead.notes as string | null) ?? null,
        createdAt: asDate(lead.createdAt)!,
        updatedAt: asDate(lead.updatedAt)!,
        deletedAt: asDate(lead.deletedAt),
        deletedBy: remapId(lead.deletedBy as string | null, userIdMap) ?? null,
      },
      update: {
        companyId: String(lead.companyId),
        campaignId: String(lead.campaignId),
        painPointId,
        websiteStatus: lead.websiteStatus as never,
        qualificationStatus: lead.qualificationStatus as never,
        priority: Boolean(lead.priority),
        notes: (lead.notes as string | null) ?? null,
        deletedAt: asDate(lead.deletedAt),
        deletedBy: remapId(lead.deletedBy as string | null, userIdMap) ?? null,
      },
    });
  }

  for (const item of data.outreach) {
    const id = String(item.id);
    await prisma.outreach.upsert({
      where: { id },
      create: {
        id,
        leadId: String(item.leadId),
        status: item.status as never,
        startedAt: asDate(item.startedAt)!,
        nextFollowUpAt: asDate(item.nextFollowUpAt),
        createdAt: asDate(item.createdAt)!,
        updatedAt: asDate(item.updatedAt)!,
        deletedAt: asDate(item.deletedAt),
        deletedBy: remapId(item.deletedBy as string | null, userIdMap) ?? null,
      },
      update: {
        leadId: String(item.leadId),
        status: item.status as never,
        startedAt: asDate(item.startedAt)!,
        nextFollowUpAt: asDate(item.nextFollowUpAt),
        deletedAt: asDate(item.deletedAt),
        deletedBy: remapId(item.deletedBy as string | null, userIdMap) ?? null,
      },
    });
  }

  for (const message of data.outreachMessages) {
    const id = String(message.id);
    await prisma.outreachMessage.upsert({
      where: { id },
      create: {
        id,
        outreachId: String(message.outreachId),
        sentAt: asDate(message.sentAt)!,
        message: String(message.message),
        step: message.step as never,
        createdAt: asDate(message.createdAt)!,
      },
      update: {
        outreachId: String(message.outreachId),
        sentAt: asDate(message.sentAt)!,
        message: String(message.message),
        step: message.step as never,
      },
    });
  }

  console.log(
    [
      `Snapshot: ${data.roles.length} roles`,
      `${data.users.length} users`,
      `${data.campaigns.length} campaigns`,
      `${data.companies.length} companies`,
      `${data.painPoints.length} pain points`,
      `${data.leads.length} leads`,
      `${data.outreach.length} outreach`,
      `${data.outreachMessages.length} outreach messages`,
    ].join(', '),
  );
}

async function main(): Promise<void> {
  const login = process.env.INITIAL_ADMIN_LOGIN ?? 'admin';
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('INITIAL_ADMIN_PASSWORD is required to seed');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 65536),
    timeCost: Number(process.env.ARGON2_TIME_COST ?? 3),
    parallelism: 1,
  });

  await seedSnapshot(passwordHash);

  const result = await ensureAdminSeed(prisma, { login, passwordHash });
  if (result.createdRole) {
    console.log('Papel administrator criado');
  }
  if (result.createdUser) {
    console.log(`Usuário administrador inicial criado: ${login.toLowerCase()}`);
  }
  if (!result.createdRole && !result.createdUser) {
    console.log('Admin já presente');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
