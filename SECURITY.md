# Segurança

Este documento descreve os controles da base. Toda autorização real vive no **backend**. O frontend apenas oculta menus.

## Autenticação

- Access token JWT de 15 minutos em cookie `HttpOnly`
- Refresh token opaco, hash SHA-256 no PostgreSQL, cookie `HttpOnly`, rotação a cada uso
- Reapresentação de refresh revogado invalida a família da sessão
- Payload do JWT contém apenas `sub`; permissões são lidas do banco
- Usuário `inactive` ou soft-deleted não autentica
- Senhas com Argon2id (`memoryCost` 65536, `timeCost` 3, `parallelism` 1 em produção)

## Cookies

| Cookie | HttpOnly | Função |
| --- | --- | --- |
| `access_token` | sim | sessão curta |
| `refresh_token` | sim | renovação |
| `csrf_token` | não | double-submit |

Produção: `Secure=true`, `SameSite=strict`. Desenvolvimento: `SameSite=lax`.

## CSRF e CORS

- Métodos mutáveis exigem header `X-CSRF-Token` igual ao cookie (incluindo login e refresh)
- `GET /auth/csrf` emite o cookie CSRF antes do login
- `Origin` precisa estar em `CORS_ORIGINS` (obrigatório em produção)
- CORS com `credentials: true` e origens explícitas
- Browser fala com a mesma origem (`/api/v1` via Vite/Nginx)

## Autorização / RBAC

- Permissões versionadas em `@app/shared`
- Roles no PostgreSQL; usuário tem N roles (tabela `user_roles`)
- Guards `@RequirePermissions(...)`
- Ator só atribui permissões que já possui
- Role `administrator` é de sistema: não pode ser excluída
- Último admin ativo não pode ser desativado/excluído
- Usuário não se auto-exclui

## Validação e mass assignment

- Zod `.strict()` nos bodies
- Campos internos (`passwordHash`, `deletedAt`, `createdAt`) não entram nos schemas
- UUIDs validados; filtros montados no servidor
- Queries Prisma parametrizadas (sem SQL concatenado)
- Busca textual com `contains` (não regex no banco)

## Abuso

- Rate limit global e mais restrito em login/refresh
- Lockout após 5 falhas (15 min), mensagem de login sempre genérica
- Hash dummy para logins inexistentes (timing)
- Payload limitado a 100kb
- Helmet na API; headers de segurança no Nginx

## Soft delete

Nenhuma entidade de negócio é removida fisicamente. Consultas padrão filtram `deletedAt: null`. Restore existe na API.

## Secrets

Somente variáveis de ambiente. `JWT_ACCESS_SECRET` ≥ 32 caracteres. Senha do admin inicial validada pelo mesmo schema forte. Nada disso vai para a imagem Docker.

## Produção — checklist

- `COOKIE_SECURE=true`
- PostgreSQL **sem** porta pública
- Backend apenas na rede interna
- HTTPS no host (Let's Encrypt)
- Secrets fortes e únicos por ambiente
- Trocar a senha do admin após o primeiro login
- Revisar `CORS_ORIGINS` e `COOKIE_DOMAIN`

## O que esta base não cobre (ainda)

- Upload de arquivos
- 2FA / WebAuthn
- Captcha
- WAF
- Persistência dedicada de auditoria (hoje há hook de log)
