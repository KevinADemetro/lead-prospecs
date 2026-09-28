# Como preparar testes E2E

A base está pronta para Playwright. Não está no CI padrão para manter o pipeline leve.

```bash
pnpm --filter @app/frontend exec playwright install --with-deps
```

Crie `apps/frontend/e2e/smoke.spec.ts` cobrindo:

1. login
2. dashboard
3. listagem de usuários
4. logout

Suba a stack (`pnpm dev` ou `docker compose up`) antes de executar.
