# Deploy em uma VM

Fluxo previsto:

```text
GitHub → VM (SSH) → Docker Compose → Nginx (SPA + /api) → NestJS → PostgreSQL interno
```

O PostgreSQL **não** é publicado na internet no compose de produção.

## 1. Preparar o repositório

1. Faça fork deste template.
2. Crie o repositório do sistema novo.
3. Altere marca (`brand.ts`, `theme.css`, logo em `apps/frontend/public/logo.svg`).
4. Confirme que `.env` **não** está versionado.

## 2. VM limpa (Ubuntu)

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
# Docker: siga a documentação oficial da distro
sudo usermod -aG docker "$USER"
```

Instale Docker Engine + Compose plugin. Faça logout/login para o grupo `docker`.

## 3. Código na VM

```bash
git clone git@github.com:ORG/seu-sistema.git /opt/app
cd /opt/app
cp .env.example .env
```

Edite `.env` com secrets **fortes**:

- `JWT_ACCESS_SECRET` (≥ 32 chars aleatórios)
- `INITIAL_ADMIN_PASSWORD`
- `CORS_ORIGINS=https://dominio.com`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=strict`
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
- `DATABASE_URL=postgresql://USER:PASSWORD@postgres:5432/DB` (host = nome do serviço Compose)

A senha em `DATABASE_URL` deve ser a mesma de `POSTGRES_PASSWORD`. Se tiver caracteres especiais, use URL-encode.

Chaves SSH da VM ficam em `~/.ssh` do usuário de deploy. **Nunca** no Git.

## 4. Subir produção

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

No start, o backend executa `prisma migrate deploy` e depois a API. O frontend escuta em `8080` no host. API e Postgres permanecem na rede interna.

## 5. HTTPS (Let's Encrypt)

Use o Nginx **do host** (ou Caddy) na frente da porta 8080.

Exemplo: `docker/nginx.host.conf.example`.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
# configure o server_name e rode:
sudo certbot --nginx -d dominio.com
```

Aponte o DNS do domínio para o IP da VM **antes** do certbot.

## 6. GitHub Actions

Secrets do ambiente `production`:

| Secret | Uso |
| --- | --- |
| `SSH_HOST` | IP ou hostname da VM |
| `SSH_USER` | usuário com Docker |
| `SSH_KEY` | chave **privada** do Actions (não commitar) |
| `SSH_PORT` | 22 ou outro |
| `APP_DIR` | `/opt/app` |

O workflow `.github/workflows/deploy.yml` só roda em `main` (e `workflow_dispatch`). `develop` não faz deploy.

No servidor, o clone deve ter `origin` apontando para o repositório e o usuário precisa conseguir `git pull` + `docker compose`.

O `.env` da VM **não** vem do GitHub; você o cria uma vez na máquina. Novas migrations entram pelo `git pull` e são aplicadas no próximo `up` do backend.

## 7. Pós-deploy

1. Abra `https://dominio.com`
2. Entre com o admin inicial
3. Troque a senha em **Meu perfil**
4. Crie usuários operacionais
5. Confirme que `http://VM:5432` **não** está aberto no firewall

Portas públicas típicas: `22`, `80`, `443`. Nada de PostgreSQL, nada de `3001`.
