import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

function loadEnvFromRepo(): void {
  let dir = process.cwd();
  for (;;) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) return;
    dir = parent;
  }
}

loadEnvFromRepo();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main(): Promise<void> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  const data = {
    roles: await prisma.role.findMany({ orderBy: { createdAt: 'asc' } }),
    users: users.map(({ passwordHash: _passwordHash, ...user }) => ({
      ...user,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })),
    userRoles: await prisma.userRole.findMany(),
    campaigns: await prisma.campaign.findMany({ orderBy: { createdAt: 'asc' } }),
    companies: await prisma.company.findMany({ orderBy: { createdAt: 'asc' } }),
    painPoints: await prisma.painPoint.findMany({ orderBy: { createdAt: 'asc' } }),
    leads: await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } }),
    outreach: await prisma.outreach.findMany({ orderBy: { createdAt: 'asc' } }),
    outreachMessages: await prisma.outreachMessage.findMany({ orderBy: { createdAt: 'asc' } }),
  };

  const out = resolve(__dirname, 'seed-data.json');
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    'Wrote',
    out,
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
