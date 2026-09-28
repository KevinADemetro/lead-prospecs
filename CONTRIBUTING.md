# Contribuindo

## Branches

- `main` — estável / produção
- `develop` — integração
- `feature/*` — trabalho isolado

PRs entram em `develop` ou `main` conforme o fluxo do time. Deploy automático só em `main`.

## Padrão de código

- TypeScript strict, sem `any`
- ESLint + Prettier
- Backend: Controller → Service → Repository
- Frontend: páginas orquestram; HTTP só em `services/api`
- Cores apenas via tokens (`bg-primary`, `text-foreground`, …)

## Checklist de PR

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test` (backend precisa de Docker — Testcontainers)
- [ ] `pnpm build`
- [ ] Nenhuma secret commitada
- [ ] Autorização no backend se a tela for protegida
- [ ] Soft delete em entidades novas

## Novas entidades

```bash
pnpm generate:entity Product
pnpm db:migrate
```

Depois:

1. Permissões em `packages/shared`
2. Registrar o módulo Nest
3. Item em `config/navigation.ts`
4. Testes do recorte crítico

Comandos comentados: [docs/COMMANDS.md](./docs/COMMANDS.md).

## Commits

Mensagens curtas no imperativo, em português ou inglês, consistentes no repositório. Ex.: `feat: adiciona filtro de papéis`.
