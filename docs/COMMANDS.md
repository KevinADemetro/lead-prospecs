# Comandos — banco, seed e entidades

Guia dos comandos usados no dia a dia neste template. O banco é **PostgreSQL**; o acesso no backend passa por **Prisma** (ORM).

Pré-requisitos: Node 22+, pnpm 10, Docker (PostgreSQL local e testes de integração do backend).

Os scripts `db:*` também existem na raiz (`pnpm db:migrate`, …) e no pacote `@app/backend`.

---

## 1. Ambiente local

| Comando | O que faz |
| --- | --- |
| `cp .env.example .env` | Cria o arquivo de secrets local. Ajuste `JWT_ACCESS_SECRET`, `INITIAL_ADMIN_PASSWORD` e, em produção, a senha do Postgres. |
| `docker compose up -d postgres` | Sobe só o PostgreSQL 17 na porta `5432`, com volume persistente. Necessário antes de `pnpm dev` ou de migrations. |
| `pnpm install` | Instala dependências e roda `prisma generate` (postinstall) para criar o cliente tipado. |
| `pnpm db:migrate` | Cria/aplica migrations de **desenvolvimento** a partir de `apps/backend/prisma/schema.prisma`, atualiza o banco e gera o client. |
| `pnpm db:seed` | Executa `apps/backend/prisma/seed.ts`: cria o papel `administrator` e o usuário inicial (`INITIAL_ADMIN_*`), de forma idempotente. |
| `pnpm dev` | Compila `@app/shared` e sobe API + SPA em watch. No boot, o backend também garante o admin (mesmo efeito do seed) se ainda não existir. |

URLs: frontend http://localhost:3000 — API http://localhost:3001/api/v1.

O seed automático no boot **não substitui** `pnpm db:migrate`. Sem migration, as tabelas não existem.

---

## 2. Prisma — schema, migration e client

Fonte da verdade: `apps/backend/prisma/schema.prisma`.  
Configuração da CLI (URL, pasta de migrations, seed): `apps/backend/prisma.config.ts`.

| Comando | O que faz |
| --- | --- |
| `pnpm db:generate` | Regenera o Prisma Client em `apps/backend/src/generated/prisma`. Rode após puxar o repo ou mudar o schema se o client estiver desatualizado. **Não** altera o banco. |
| `pnpm db:migrate` | `prisma migrate dev`. Compara o schema com o banco, pede um nome, grava SQL em `prisma/migrations/`, aplica no Postgres local e gera o client. Use no desenvolvimento. |
| `pnpm db:migrate:deploy` | `prisma migrate deploy`. Aplica migrations **já versionadas**, sem criar arquivo novo. É o que o container de produção executa no start. |
| `pnpm db:reset` | `prisma migrate reset`. **Apaga todos os dados**, reaplica migrations e roda o seed. Só em desenvolvimento. |
| `pnpm db:seed` | Roda o seed configurado em `prisma.config.ts` (`tsx prisma/seed.ts`). Idempotente: não duplica admin. |
| `pnpm db:studio` | Abre o Prisma Studio (UI) para inspecionar tabelas. Não use em produção com secrets fracos. |

Fluxo típico ao mudar o modelo:

1. Edite `schema.prisma` (ou use `pnpm generate:entity`).
2. `pnpm db:migrate` — nomeie a migration (`add_products`, etc.).
3. Implemente repositório/service/controller.
4. Commit do `schema.prisma` **e** da pasta `prisma/migrations/`.

Não edite na mão um arquivo de migration já aplicada em outros ambientes. Crie uma migration nova.

---

## 3. Criar uma entidade de negócio

```bash
pnpm generate:entity Product
```

O que o gerador faz:

- Anexa o `model Product` em `schema.prisma` (UUID, timestamps, soft delete)
- Cria esqueleto NestJS: module, controller, service, repository (Prisma)
- Cria página React em `apps/frontend/src/features/product`

O que ele **não** faz (você completa):

1. `pnpm db:migrate` — cria a tabela no PostgreSQL
2. Permissões em `packages/shared/src/permissions.ts` (`product.read`, …)
3. Registrar `ProductsModule` em `app.module.ts`
4. Item de menu em `apps/frontend/src/config/navigation.ts`
5. CRUD, validação Zod, testes e regras no service

O gerador **não** é um scaffolding completo de CRUD. Prefira qualidade da regra de negócio a um CRUD genérico.

---

## 4. Qualidade e build

| Comando | O que faz |
| --- | --- |
| `pnpm lint` | ESLint em todos os workspaces. |
| `pnpm typecheck` | `tsc --noEmit` (o backend gera o Prisma Client antes). |
| `pnpm test` | Vitest (frontend) + Jest (backend). Os testes de API sobem um PostgreSQL isolado via Testcontainers (**Docker obrigatório**). |
| `pnpm test:backend` / `pnpm test:frontend` | Recortes isolados. |
| `pnpm build` | Compila shared, API e SPA. |
| `pnpm format` | Prettier. |

---

## 5. Docker e deploy

| Comando | O que faz |
| --- | --- |
| `docker compose up -d --build` | Stack local completa: `postgres`, `backend`, `frontend`. O backend aplica `prisma migrate deploy` no start e depois sobe a API. |
| `docker compose -f docker-compose.prod.yml up -d --build` | Produção: Postgres **sem** porta publicada; Nginx na borda. Ver [DEPLOY.md](../DEPLOY.md). |

Variáveis relevantes:

- `DATABASE_URL` — string Prisma/Nest (`postgresql://user:pass@host:5432/db`)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — criam o banco no container; **devem coincidir** com a URL

Se a senha tiver caracteres especiais (`@`, `#`, `%`, …), faça URL-encode em `DATABASE_URL`.

---

## 6. Atalhos úteis (Prisma CLI direta)

A partir de `apps/backend` (ou `pnpm --filter @app/backend exec …`):

```bash
pnpm exec prisma migrate status    # quais migrations faltam aplicar
pnpm exec prisma migrate diff      # diff schema ↔ banco (não aplica)
pnpm exec prisma format            # formata schema.prisma
pnpm exec prisma validate          # valida o schema
```
