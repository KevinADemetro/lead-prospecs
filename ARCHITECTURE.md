# Arquitetura — Fullstack Base

Template empresarial reutilizável (React SPA + NestJS + PostgreSQL) para novos sistemas.
Este documento registra decisões tomadas **antes** da implementação.

## 1. Objetivo

Fornecer uma base segura, modular e previsível para:

- autenticação e sessão
- RBAC (User → Roles → Permissions)
- CRUD administrativo (usuários e papéis)
- identidade visual configurável (tokens de tema)
- deploy em VM com Docker Compose

Não é um produto de negócio. É um **framework de aplicação**.

## 2. Princípios

Ordem de prioridade:

1. Segurança
2. Manutenibilidade
3. Clareza
4. Reutilização
5. Responsividade
6. Testabilidade
7. Simplicidade
8. Performance

Quando dois requisitos entram em conflito, prevalece a opção **mais segura e mais fácil de manter**.

## 3. Monorepo

**Ferramenta:** pnpm workspaces (sem Turborepo).

Turborepo foi descartado para reduzir ferramentas, caches e conceitos extras. Scripts raiz com `pnpm --filter` são suficientes.

```text
/
├── apps/
│   ├── frontend/          # React + Vite SPA
│   └── backend/           # NestJS API
├── packages/
│   ├── shared/            # permissões, schemas Zod, tipos
│   ├── eslint-config/
│   └── typescript-config/
├── docker/                # Dockerfiles e Nginx
├── docs/
├── scripts/               # gerador de entidade
├── docs/                  # COMMANDS.md e extras
├── .github/workflows/
├── docker-compose.yml
├── docker-compose.prod.yml
└── ARCHITECTURE.md
```

### Workspaces

| Pacote | Nome | Função |
| --- | --- | --- |
| `apps/frontend` | `@app/frontend` | SPA |
| `apps/backend` | `@app/backend` | API REST |
| `packages/shared` | `@app/shared` | contratos compartilhados |
| `packages/eslint-config` | `@app/eslint-config` | ESLint flat config |
| `packages/typescript-config` | `@app/typescript-config` | tsconfig base |

O pacote `shared` é compilado para `dist` (CommonJS + `.d.ts`) para o NestJS consumir sem transpilação de `node_modules`.

## 4. Frontend

- React 19 + TypeScript + Vite
- SPA obrigatória: **sem Next.js, SSR ou SSG**
- React Router para navegação client-side
- Tailwind CSS com **tokens de tema** (nunca cores utilitárias cruas espalhadas)
- React Hook Form + Zod
- SweetAlert2 para sucesso/erro/confirmações (não para validação de campo)
- Lucide React para ícones
- Mobile first

### Organização

Feature-based, com uma camada fina de Design System:

```text
src/
  app/                 # providers, router
  components/          # UI, layout, forms, feedback
  features/            # auth, users, roles, profile, dashboard
  services/api/        # cliente HTTP único
  config/              # brand, navigation, theme
  stores/              # sessão (memória + /auth/me)
```

Regras:

- Componentes de página orquestram; não acessam PostgreSQL/HTTP diretamente além dos services.
- Navegação vem de `config/navigation.ts` (label, ícone, rota, permissão).
- Menus sem permissão são ocultados no frontend (**somente UX**). O backend autoriza de verdade.

### Tema e marca

Tokens CSS (`--color-primary`, `--color-background`, …) mapeados no Tailwind (`bg-primary`, `text-foreground`, `bg-surface`).

Troca de identidade:

1. `apps/frontend/src/config/brand.ts` — nome e logo
2. `apps/frontend/src/styles/theme.css` — paleta (light/dark)

Dark mode via classe `dark` no `<html>`, persistida em `localStorage`.

## 5. Backend

Clean-ish modular NestJS:

```text
Controller → Service → Repository → Prisma → PostgreSQL
```

- Controllers não falam com o banco.
- Services não conhecem Request/Response HTTP além do necessário.
- Repositório base encapsula **soft delete**.
- Validação de entrada: Zod (pipe global). Schemas alinhados com `@app/shared` quando o contrato é o mesmo.
- DTOs efetivos = schemas Zod com `.strict()` para impedir mass assignment.

Prefixo da API: `/api/v1`.

## 6. Banco de dados

PostgreSQL 17 + **Prisma ORM 7**.

O ORM é intencional neste template (não é acesso SQL cru). Motivos:

- PostgreSQL exige evolução de schema explícita; o Prisma versiona isso em SQL (`prisma/migrations`) em vez de “campos opcionais no código”
- Cliente TypeScript gerado a partir de `schema.prisma` (erros de query em compile time)
- CLI única para migrate, generate, seed e studio — ver [docs/COMMANDS.md](./docs/COMMANDS.md)
- Queries parametrizadas (mitiga SQL injection)
- Integração oficial com NestJS 11 (`PrismaClient` + adapter `pg`)

TypeORM também funcionaria no NestJS; Prisma foi escolhido pela DX de migrations e pelo schema como fonte da verdade. Repositórios da aplicação **continuam** encapsulando o Prisma — services não importam o client.

Identificadores: **UUID** (`gen` no client via `@default(uuid())`), não ObjectId.

Padrões:

- `createdAt` / `updatedAt` mapeados para `created_at` / `updated_at`
- soft delete: `deleted_at`, `deleted_by`
- consultas padrão filtram `deletedAt: null`
- índices em `login`, `status`, `created_at`, `deleted_at` e FKs de `user_roles`
- login único **incluindo** registros soft-deleted (constraint UNIQUE no Postgres; evita reaproveitar identidade)
- relação User ↔ Role em tabela `user_roles` (N:N)
- refresh tokens em `refresh_tokens`, com hash SHA-256 único

Evolução de schema: editar `schema.prisma` → `pnpm db:migrate` (dev) ou `pnpm db:migrate:deploy` (prod). O container do backend aplica deploy no start.

Produção: Postgres **sem** porta publicada; só a rede interna do Compose.

## 7. Autenticação

Estratégia escolhida (mais segura que JWT no `localStorage`):

| Artefato | Tipo | Onde vive | TTL |
| --- | --- | --- | --- |
| Access token | JWT (claim `sub` apenas) | Cookie `HttpOnly` | 15 min |
| Refresh token | Opaco (32 bytes aleatórios) | Cookie `HttpOnly` + hash SHA-256 no PostgreSQL | 7 dias |
| CSRF token | Aleatório | Cookie **não** HttpOnly + header `X-CSRF-Token` | acompanha a sessão |

Decisões:

- **Não** armazenar tokens no `localStorage`.
- Refresh **não** é JWT: precisa ser revogável e rotacionável.
- Payload do access token contém só `sub`. Permissões são lidas do banco a cada request (revogação imediata de acesso).
- Cookies: `HttpOnly`, `SameSite=Strict` em produção, `Lax` em desenvolvimento, `Secure` em produção.
- Rotação de refresh: cada refresh emite um novo token e invalida o anterior.
- Reuse detection: se um refresh já revogado for reapresentado, a família inteira da sessão é revogada.
- Senhas: **Argon2id** (nunca bcrypt legado neste template). Nunca retornar `password` / `passwordHash`.
- Usuário desativado ou soft-deleted não autentica, mesmo com JWT válido.

Fluxo do browser (dev e prod): o frontend fala com a **mesma origem** (`/api/v1/...`). Vite (dev) e Nginx (prod/Docker) fazem proxy para o backend. Cookies são first-party.

## 8. Autorização (RBAC)

```text
Permission (catálogo no código)
     ↑
   Role  (tabela `roles`: nome + permissions[])
     ↑
   User  (tabela `users` + `user_roles`)
```

- Permissões são constantes em `@app/shared` (`users.read`, `roles.create`, …).
- O cliente **não** pode inventar permissões: o backend valida contra o catálogo.
- Um usuário tem N roles; permissões efetivas = união.
- Guard NestJS `@RequirePermissions('users.update')`.
- Escalação de privilégio: só é permitido atribuir roles/permissões que o ator **já possui**. Role de sistema `administrator` só pode ser atribuída por quem já a tem.
- Role `administrator` é `isSystem`: não pode ser excluída nem ter o nome alterado.
- Último administrador ativo não pode ser desativado/excluído.
- Usuário não pode auto-excluir-se.

O frontend esconde rotas/menus. **Toda** operação mutável é revalidada no backend.

## 9. Segurança

Camadas implementadas nesta base:

| Ameaça | Mitigação |
| --- | --- |
| XSS | CSP via Helmet (API) + Nginx; React escapa por padrão; cookies HttpOnly |
| CSRF | SameSite + cookie CSRF double-submit em métodos mutáveis; Origin allowlist |
| CORS | origens explícitas via env; `credentials: true` |
| Brute force / stuffing | rate limit específico no login + lockout progressivo |
| Session fixation | novos tokens após login; cookies substituídos |
| IDOR | autorização por permissão + acesso somente a IDs existentes e não deletados |
| Mass assignment | Zod `.strict()`; campos internos fora do schema |
| SQL injection | Zod + Prisma parametrizado; filtros montados no servidor |
| Privilege escalation | união de permissões do ator como teto |
| Information disclosure | filtro global de erros; sem stack em produção; mensagens genéricas de login |
| Enumeração de usuários | resposta de login uniforme; rate limit |
| Secrets | somente env; nunca na imagem Docker |
| PostgreSQL exposure | porta não publicada em produção |
| Path traversal / upload | sem upload nesta base |
| Prototype pollution | `Object.create(null)` onde há merge; body validado por Zod `.strict()` |
| Headers | Helmet + limites de payload (100kb) |

Rate limiting:

- global: por IP
- `/auth/login` e `/auth/refresh`: mais restritivos

Logging: request id, método, rota, status, user id. **Nunca** senha, tokens, cookies ou secrets.

Auditoria: interceptor/hook estável (`who`, `action`, `entity`, `entityId`, `result`) pronto para persistência futura. Nesta versão, eventos relevantes vão para o logger estruturado.

## 10. Soft delete

Todas as entidades de negócio herdam:

```text
deletedAt: Date | null
deletedBy: UUID | null
```

Repositório base:

- `create` / `find` / `findById` / `update` ignoram deletados
- `softDelete` preenche `deletedAt`/`deletedBy`
- `restore` existe na API de dados (endpoint opcional)

Não há `deleteOne` de negócio.

## 11. Docker e deploy

Containers independentes: `frontend`, `backend`, `postgres`.

| Arquivo | Uso |
| --- | --- |
| `docker-compose.yml` | desenvolvimento local (três serviços) |
| `docker-compose.prod.yml` | VM: frontend (Nginx) na borda, API e PostgreSQL internos |

Portas locais:

- frontend `3000`
- backend `3001`
- PostgreSQL `5432` (somente compose de desenvolvimento)

Produção:

```text
Internet → Nginx (frontend container, 80/443)
              ├─ /          SPA
              └─ /api/v1    proxy → backend
                              └─ PostgreSQL (rede interna)
```

- Builds multi-stage
- Processo não-root
- Healthchecks
- Backend faz retry de conexão no PostgreSQL e `prisma migrate deploy` no start do container
- Secrets só via env / arquivo `.env` na VM (não commitado)

CI (GitHub Actions): install, lint, typecheck, test, build em `main` e `develop`.
Deploy: workflow separado, **não** dispara em qualquer branch (apenas `main` + `workflow_dispatch`).

## 12. Testes

- Backend: Jest — autenticação, autorização, users, roles, soft delete
- Frontend: Vitest + Testing Library — forms, guards, permissões, componentes críticos
- E2E: Playwright configurado em `apps/frontend/e2e` como base (smoke opcional)

## 13. Gerador de entidades

CLI simples: `pnpm generate:entity Product`

Gera esqueleto backend + frontend + model Prisma. Depois rode `pnpm db:migrate`. **Não** é um framework de scaffolding completo. Qualidade da base > gerador sofisticado. Comandos: [docs/COMMANDS.md](./docs/COMMANDS.md).

## 14. Decisões críticas registradas

1. **pnpm workspaces sem Turborepo** — menos superfície, mesmo isolamento.
2. **Refresh opaco + hash no banco**, não JWT de longa duração — revogação real.
3. **Permissões no código, roles no banco** — catálogo versionado; papéis configuráveis.
4. **Proxy same-origin** — cookies first-party sem `SameSite=None`.
5. **Teto de permissões do ator** — bloqueia escalação via `users.update` / `roles.update`.
6. **Argon2id** em vez de bcrypt — requisito de hashing moderno.
7. **PostgreSQL não público em produção** — o compose local expõe 5432 só para DX.
8. **Prisma ORM** — migrations SQL versionadas; schema como fonte da verdade.

## 15. Como estender

1. Adicionar permissões em `packages/shared`.
2. (Opcional) `pnpm generate:entity Nome`.
3. Implementar regras no service.
4. Registrar rotas/menu em `config/navigation.ts`.
5. Proteger o controller com `@RequirePermissions`.
