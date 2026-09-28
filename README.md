# Fullstack Base

Base empresarial reutilizável para sistemas internos: **React SPA + NestJS + PostgreSQL (Prisma)**, com autenticação por cookies, RBAC e Docker.

Use este repositório como template: faça fork, altere a marca e comece a adicionar entidades de negócio.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind, React Router, React Hook Form, Zod, SweetAlert2, Lucide |
| Backend | NestJS, PostgreSQL, Prisma ORM, Zod, Argon2id |
| Monorepo | pnpm workspaces |
| Infra | Docker Compose, Nginx |

O Prisma é o ORM adotado: schema versionado, migrations SQL e cliente TypeScript gerado. Ver [ARCHITECTURE.md](./ARCHITECTURE.md) (decisão) e [docs/COMMANDS.md](./docs/COMMANDS.md) (comandos).

## Requisitos

- Node.js 22+
- pnpm 10 (`corepack enable`)
- Docker e Docker Compose (PostgreSQL local e testes de integração do backend)

## Instalação local (hot reload)

```bash
cp .env.example .env
# ajuste JWT_ACCESS_SECRET e INITIAL_ADMIN_PASSWORD
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1
- Login inicial: valores de `INITIAL_ADMIN_LOGIN` / `INITIAL_ADMIN_PASSWORD` no `.env`

O backend também cria o admin no boot se ele ainda não existir. `pnpm db:migrate` é obrigatório para criar as tabelas.

## Docker (stack completa)

```bash
cp .env.example .env
docker compose up -d --build
```

Sobe `frontend` (3000), `backend` (3001) e `postgres` (5432). O backend aplica as migrations no start.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm generate:entity Product
pnpm db:migrate
pnpm db:seed
```

Lista comentada: [docs/COMMANDS.md](./docs/COMMANDS.md).

## Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) — decisões de arquitetura
- [SECURITY.md](./SECURITY.md) — modelo de ameaça e controles
- [DEPLOY.md](./DEPLOY.md) — VM, HTTPS e GitHub Actions
- [docs/COMMANDS.md](./docs/COMMANDS.md) — migrate, seed, entidade, Docker
- [CONTRIBUTING.md](./CONTRIBUTING.md) — convenções

## Como criar um novo sistema a partir desta base

1. Fork ou use o repositório como template no GitHub.
2. Ajuste `apps/frontend/src/config/brand.ts` e `apps/frontend/src/styles/theme.css`.
3. Substitua `INITIAL_ADMIN_PASSWORD`, `JWT_ACCESS_SECRET` e `POSTGRES_PASSWORD`.
4. Configure o domínio em `CORS_ORIGINS` e no Nginx.
5. Adicione permissões e módulos conforme o negócio.

Nunca commite `.env`, chaves SSH ou secrets.
