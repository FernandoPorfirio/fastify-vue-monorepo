# Fastify Vue Monorepo

Template para projetos full-stack com Fastify (API) e Vue (Web) usando pnpm workspaces.

## Estrutura

```
├── apps/
│   ├── api/          # API Fastify + TypeScript
│   ├── migrations/   # Migrations Knex.js + PostgreSQL
│   └── web/          # Frontend Vue (em desenvolvimento)
├── packages/
│   ├── contracts/    # Schemas compartilhados
│   └── i18n/         # Internacionalização
└── docker-compose.yml
```

## Pré-requisitos

- Node.js 20+
- pnpm 10+
- Docker e Docker Compose

## Setup

1. **Clone o repositório**
```bash
git clone <repo-url>
cd fastify-vue-monorepo
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
# As envs já estão configuradas com valores padrão para desenvolvimento
# Para produção, atualize os valores em apps/api/.env e apps/migrations/.env
```

4. **Inicie o banco de dados**
```bash
docker-compose up -d
```

5. **Execute as migrations**
```bash
cd apps/migrations
pnpm migrate:latest
```

6. **Execute os seeds (opcional)**
```bash
pnpm seed:run
```

7. **Inicie a API**
```bash
cd apps/api
pnpm dev
```

## Comandos Úteis

> Todos os comandos abaixo podem ser executados da raiz do monorepo

### Docker
```bash
# Iniciar banco de dados
docker-compose up -d

# Parar banco de dados
docker-compose down

# Ver logs
docker-compose logs -f postgres

# Resetar banco de dados (CUIDADO: apaga todos os dados)
docker-compose down -v
```

### Migrations
```bash
# Criar nova migration
pnpm migrate:make nome_da_migration

# Executar migrations pendentes
pnpm migrate:latest

# Reverter última migration
pnpm migrate:rollback

# Executar seeds
pnpm seed:run
```

### API
```bash
# Desenvolvimento com hot reload
pnpm dev:api

# Build para produção (dentro de apps/api)
cd apps/api && pnpm build

# Executar build (dentro de apps/api)
cd apps/api && pnpm start

# Formatar código da API
pnpm format:api

# Formatar todo o monorepo
pnpm format
```

## Endpoints

- **API**: http://localhost:3333
- **Health Check**: http://localhost:3333/health
- **API Docs**: http://localhost:3333/api-docs

## Banco de Dados

### Credenciais Padrão (Development)
- **Host**: localhost
- **Port**: 5432
- **Database**: appdb
- **User**: postgres
- **Password**: postgres

### Schema

- **tenants**: Multi-tenancy
- **users**: Usuários
- **tenant_users**: Relação N:N entre tenants e users
- **profiles**: Perfis RBAC
- **routes**: Rotas do sistema (API e Frontend)
- **profile_routes**: Relação N:N entre perfis e rotas
- **user_profiles**: Relação N:N entre users e perfis (por tenant)
- **audit_logs**: Logs de auditoria
- **invites**: Convites para novos usuários
- **password_resets**: Tokens de reset de senha
- **refresh_tokens**: Tokens de refresh JWT

## Tecnologias

### API
- Fastify 5
- TypeScript
- Zod (validação)
- Fastify Type Provider Zod
- Scalar API Reference (docs)

### Database
- PostgreSQL 16
- Knex.js (query builder + migrations)

### Monorepo
- pnpm workspaces
- Biome (linter + formatter)

## TODO

- [ ] Implementar autenticação JWT
- [ ] Implementar middleware RBAC
- [ ] Criar frontend Vue
- [ ] Configurar packages compartilhados (contracts, i18n)
- [ ] Adicionar testes
- [ ] Configurar CI/CD

## Licença

ISC
