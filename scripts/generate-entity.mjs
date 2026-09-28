#!/usr/bin/env node
/**
 * Simple entity scaffolding. Not a full CRUD generator.
 * Usage: pnpm generate:entity Product
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const name = process.argv[2];
if (!name || !/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error('Use: pnpm generate:entity Product');
  process.exit(1);
}

const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const snake = kebab.replace(/-/g, '_');
const camel = name[0].toLowerCase() + name.slice(1);
const table = `${snake}s`;
const permission = `${kebab.replace(/-/g, '')}`;

const backendDir = join('apps/backend/src/modules', kebab);
const frontendDir = join('apps/frontend/src/features', kebab);
const schemaPath = join('apps/backend/prisma/schema.prisma');

if (existsSync(backendDir) || existsSync(frontendDir)) {
  console.error('Entity already exists');
  process.exit(1);
}

if (!existsSync(schemaPath)) {
  console.error('Prisma schema not found at apps/backend/prisma/schema.prisma');
  process.exit(1);
}

const schema = readFileSync(schemaPath, 'utf8');
if (schema.includes(`model ${name} `) || schema.includes(`model ${name}{`)) {
  console.error(`Prisma model ${name} already exists`);
  process.exit(1);
}

mkdirSync(backendDir, { recursive: true });
mkdirSync(join(frontendDir, 'pages'), { recursive: true });

appendFileSync(
  schemaPath,
  `
model ${name} {
  id        String    @id @default(uuid()) @db.Uuid
  name      String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @db.Uuid @map("deleted_by")

  @@map("${table}")
}
`,
);

writeFileSync(
  join(backendDir, `${kebab}.repository.ts`),
  `import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../../common/database/base.repository';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ${name}sRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    if (!this.isUsableId(id)) {
      return null;
    }
    return this.prisma.${camel}.findFirst({
      where: { id, ...this.notDeleted() },
    });
  }

  async findByIdOrFail(id: string) {
    const item = await this.findById(id);
    if (!item) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return item;
  }
}
`,
);

writeFileSync(
  join(backendDir, `${kebab}.module.ts`),
  `import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { ${name}sController } from './${kebab}.controller';
import { ${name}sService } from './${kebab}.service';
import { ${name}sRepository } from './${kebab}.repository';

@Module({
  imports: [PersistenceModule],
  controllers: [${name}sController],
  providers: [${name}sService, ${name}sRepository],
})
export class ${name}sModule {}
`,
);

writeFileSync(
  join(backendDir, `${kebab}.service.ts`),
  `import { Injectable } from '@nestjs/common';
import { ${name}sRepository } from './${kebab}.repository';

@Injectable()
export class ${name}sService {
  constructor(private readonly ${camel}s: ${name}sRepository) {}
}
`,
);

writeFileSync(
  join(backendDir, `${kebab}.controller.ts`),
  `import { Controller } from '@nestjs/common';
import { ${name}sService } from './${kebab}.service';

@Controller('${kebab}')
export class ${name}sController {
  constructor(private readonly ${camel}s: ${name}sService) {}
}
`,
);

writeFileSync(
  join(frontendDir, 'pages', `${kebab}-page.tsx`),
  `export function ${name}sPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">${name}s</h1>
      <p className="mt-2 text-muted">Implementar listagem e formulários.</p>
    </div>
  );
}
`,
);

console.log(`Created ${backendDir} and ${frontendDir}`);
console.log(`Prisma model ${name} appended to ${schemaPath}`);
console.log(`Next:
1. pnpm db:migrate
   Creates and applies a SQL migration for the new table.
2. Add permissions ${permission}.read|create|update|delete in packages/shared/src/permissions.ts
3. Register ${name}sModule in apps/backend/src/app.module.ts
4. Add a navigation item in apps/frontend/src/config/navigation.ts
5. Implement service/controller rules and tests
`);
