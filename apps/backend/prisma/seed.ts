import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { ensureAdminSeed } from '../src/database/seed-admin';

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

loadEnvFromRepo();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

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

  const result = await ensureAdminSeed(prisma, { login, passwordHash });
  if (result.createdRole) {
    console.log('Papel administrator criado');
  }
  if (result.createdUser) {
    console.log(`Usuário administrador inicial criado: ${login.toLowerCase()}`);
  }
  if (!result.createdRole && !result.createdUser) {
    console.log('Seed já aplicado (admin existente)');
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
