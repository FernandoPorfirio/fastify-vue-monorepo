# Fastify Vue Monorepo

Template para projetos full-stack com Fastify (API) e Vue (Web) usando pnpm workspaces.

## Estrutura

```
├── apps/
│   ├── api/          # API Fastify + TypeScript
│   ├── migrations/   # Migrations Knex.js + PostgreSQL
│   └── web/          # Frontend Vue (não implementado)
├── packages/
│   ├── contracts/    # Schemas compartilhados (não implementado)
│   └── i18n/         # Internacionalização (não implementado)
└── docker-compose.yml
```

## Pré-requisitos

- Node.js 20+
- pnpm 10+
- Docker e Docker Compose

## Setup Rápido

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
# Copie o arquivo de exemplo para os apps
cp .env.example apps/api/.env
cp .env.example apps/migrations/.env

# As configurações padrão já funcionam para desenvolvimento local
# Para produção, edite os arquivos .env com valores seguros
```

4. **Inicie o banco de dados**

```bash
docker-compose up -d
```

5. **Execute as migrations**

```bash
pnpm migrate:latest
```

6. **Execute os seeds**

```bash
pnpm seed:run
```

7. **Inicie a API**

```bash
pnpm dev:api
```

## Comandos Úteis

> Todos os comandos devem ser executados da raiz do monorepo

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
# Criar nova migration (será criada em apps/migrations/migrations/)
pnpm migrate:make nome_da_migration

# Executar migrations pendentes
pnpm migrate:latest

# Reverter última migration
pnpm migrate:rollback

# Executar seeds (cria dados iniciais)
pnpm seed:run
```

### API

```bash
# Desenvolvimento com hot reload
pnpm dev:api

# Formatar código da API
pnpm format:api

# Formatar todo o monorepo
pnpm format
```

## Endpoints da API

A API está disponível em http://localhost:3333

### Documentação

- **Swagger UI**: http://localhost:3333/api-docs
- **Health Check**: http://localhost:3333/health

### Autenticação

#### POST /auth/login

Autentica um usuário e retorna JWT + Refresh Token

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response 200:**

```json
{
  "token": "eyJhbGc...",
  "refreshToken": "abc123...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

#### POST /auth/refresh

Renova o access token usando o refresh token

**Body:**

```json
{
  "refreshToken": "abc123..."
}
```

**Response 200:**

```json
{
  "token": "eyJhbGc...",
  "refreshToken": "def456..."
}
```

#### POST /auth/logout

Revoga o refresh token (requer autenticação)

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "refreshToken": "abc123..."
}
```

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

## Banco de Dados

### Credenciais Padrão (Development)

- **Host**: localhost
- **Port**: 5432
- **Database**: appdb
- **User**: postgres
- **Password**: postgres

### Usuário Inicial

Após executar os seeds, você terá:

- **Email**: admin@example.com
- **Senha**: admin123
- **Tenant**: Default Tenant
- **Perfil**: Super Admin (acesso total)

### Schema do Banco

O banco de dados possui as seguintes tabelas:

#### Autenticação e Usuários

- **users**: Dados dos usuários (email, senha hash, nome)
- **tenants**: Multi-tenancy (empresas/organizações)
- **tenant_users**: Relação N:N entre tenants e users
- **refresh_tokens**: Tokens de refresh JWT

#### RBAC (Role-Based Access Control)

- **profiles**: Perfis de acesso (Super Admin, Admin, User, etc)
- **routes**: Rotas do sistema (API e Frontend) com controle de acesso
- **profile_routes**: Permissões - relação N:N entre perfis e rotas
- **user_profiles**: Atribuição de perfis aos usuários (por tenant)

#### Outros

- **audit_logs**: Logs de auditoria de ações do sistema
- **invites**: Convites para novos usuários
- **password_resets**: Tokens de recuperação de senha

## Stack Tecnológico

### API (apps/api)

- **Fastify 5**: Framework web rápido e de baixo overhead
- **TypeScript**: Tipagem estática
- **Zod**: Validação de schemas em runtime
- **Fastify Type Provider Zod**: Integração Zod + Fastify
- **Scalar API Reference**: Documentação interativa da API (Swagger UI alternativo)
- **bcrypt**: Hash de senhas
- **jsonwebtoken**: Autenticação JWT
- **Knex.js**: Query builder para consultas ao banco
- **@fastify/cors**: CORS configurável

### Database

- **PostgreSQL 16**: Banco de dados relacional
- **Knex.js**: Query builder + migrations + seeds

### Monorepo

- **pnpm workspaces**: Gerenciamento de monorepo
- **Biome**: Linter e formatter (alternativa ao ESLint + Prettier)

## Arquitetura da API

A API segue a filosofia do Fastify: **simplicidade e performance**. Não utilizamos camadas desnecessárias.

### Estrutura do Código

```
apps/api/src/
├── lib/          # Funções puras, lógica de negócio reutilizável
│   ├── auth.ts   # Hash de senhas, JWT, refresh tokens
│   └── db.ts     # Conexão com o banco (Knex)
├── plugins/      # Plugins do Fastify (decorators, hooks)
│   └── auth.ts   # Middleware de autenticação e autorização
├── modules/      # Módulos funcionais (controller + service + routes)
│   └── auth/
│       ├── auth.controller.ts  # Handlers das rotas
│       ├── auth.service.ts     # Lógica de negócio
│       ├── auth.routes.ts      # Definição de rotas + schemas
│       └── index.ts
├── routes/       # Registro de rotas
│   ├── health.ts
│   └── index.ts
├── errors/       # Tratamento global de erros
│   └── handler.ts
└── server.ts     # Bootstrap da aplicação
```

### Padrões Utilizados

#### **lib/** - Funções Puras

Lógica de negócio sem dependência do Fastify. Fácil de testar e reutilizar.

```typescript
// Exemplo: lib/auth.ts
export async function hashPassword(password: string): Promise<string>
export function signToken(payload: JWTPayload): string
export function verifyToken(token: string): JWTPayload
```

#### **plugins/** - Extensões do Fastify

Adiciona funcionalidades via decorators (middleware, helpers globais).

```typescript
// Exemplo: plugins/auth.ts
app.decorate('authenticate', async (request, reply) => { ... })
app.decorate('authorize', (route, method) => async (request, reply) => { ... })
```

#### **modules/** - Módulos Funcionais

Agrupa rotas relacionadas com sua lógica de negócio.

- **Controller**: Recebe requisição, valida, chama service, retorna resposta
- **Service**: Lógica de negócio, regras, acesso ao banco
- **Routes**: Define endpoints, schemas Zod, vincula ao controller

```typescript
// auth.routes.ts
app.post('/auth/login', {
  schema: { body: z.object({ ... }) }
}, authController.login)
```

#### **Quando usar cada camada:**

- **lib/**: Lógica reutilizável sem contexto de requisição HTTP
- **plugins/**: Middleware, decorators, funcionalidades globais
- **modules/**: Organização de features (auth, users, etc)
- **services**: Lógica de negócio complexa com múltiplas dependências
- **controllers**: Ponte entre HTTP e lógica de negócio

## Autenticação e Autorização

### ✅ Sistema Implementado

#### JWT + Refresh Tokens

- **Access Token**: Válido por 15 minutos (configurável)
- **Refresh Token**: Válido por 7 dias (configurável)
- **Armazenamento**: Refresh tokens são salvos no banco com controle de revogação

#### RBAC (Role-Based Access Control)

Sistema completo de controle de acesso baseado em:

- **Perfis**: Conjuntos de permissões (Super Admin, Admin, User, etc)
- **Rotas**: Endpoints cadastrados com controle de acesso
- **Profile Routes**: Define quais perfis podem acessar quais rotas

### Credenciais de Teste

```
Email: admin@example.com
Senha: admin123
Perfil: Super Admin (acesso total)
```

### Como Proteger Rotas

#### 1. Apenas Autenticação

```typescript
app.get(
  '/protected',
  {
    onRequest: [app.authenticate],
  },
  async (request, reply) => {
    // request.user está disponível
    return { user: request.user }
  }
)
```

#### 2. Autenticação + Autorização RBAC

```typescript
app.delete(
  '/users/:id',
  {
    onRequest: [app.authenticate, app.authorize('/api/users/:id', 'DELETE')],
  },
  async (request, reply) => {
    // Só executa se o usuário tem permissão
  }
)
```

### Middleware Disponíveis

#### `app.authenticate`

- Verifica o JWT no header `Authorization: Bearer <token>`
- Carrega dados do usuário em `request.user`
- Retorna 401 se token inválido ou expirado

#### `app.authorize(route, method)`

- Verifica se o perfil do usuário tem permissão para acessar a rota
- Consulta tabelas `routes` e `profile_routes`
- Retorna 403 se sem permissão
- **Importante**: Se a rota não estiver cadastrada no banco, permite acesso

### Objeto `request.user`

```typescript
interface User {
  userId: number
  email: string
  tenantId: number
  profileIds: number[] // IDs dos perfis do usuário
}
```

## Variáveis de Ambiente

### apps/api/.env

```bash
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=appdb

# Servidor
PORT=3333
HOST=0.0.0.0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### apps/migrations/.env

```bash
# Banco de Dados (mesmo do apps/api/.env)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=appdb
```

> **Dica**: Use o arquivo `.env.example` na raiz como referência.

## Multi-Tenancy

O sistema suporta **multi-tenancy** nativo, permitindo que múltiplas empresas/organizações usem a mesma aplicação com dados isolados.

### Como Funciona

- Cada **tenant** representa uma empresa/organização
- Usuários podem pertencer a múltiplos tenants
- Perfis e permissões são definidos **por tenant**
- Ao fazer login, o sistema identifica o tenant do usuário

### Estrutura de Dados

```
tenants (empresas)
  └── tenant_users (usuários do tenant)
        └── users (dados globais do usuário)
              └── user_profiles (perfis por tenant)
                    └── profiles (Super Admin, Admin, etc)
```

### Exemplo de Uso

1. Usuário `admin@example.com` pertence ao tenant "Default"
2. No tenant "Default", ele tem o perfil "Super Admin"
3. Se o mesmo usuário for adicionado ao tenant "Acme Corp", pode ter perfil diferente

## Status do Projeto

### ✅ Implementado

- [x] Setup do monorepo com pnpm workspaces
- [x] API Fastify com TypeScript
- [x] Migrations e Seeds (Knex.js + PostgreSQL)
- [x] Docker Compose para PostgreSQL
- [x] Autenticação JWT + Refresh Tokens
- [x] Sistema RBAC completo
- [x] Multi-tenancy
- [x] Documentação da API (Scalar)
- [x] CORS configurável
- [x] Tratamento de erros
- [x] Biome (linter + formatter)

### 🚧 Pendente

- [ ] Testes automatizados (Jest/Vitest)
- [ ] Frontend Vue
- [ ] Packages compartilhados (contracts, i18n)
- [ ] Recuperação de senha
- [ ] Sistema de convites
- [ ] Logs de auditoria
- [ ] CI/CD
- [ ] Documentação de deployment

## Próximos Passos

1. **Implementar testes**: Adicionar Jest ou Vitest
2. **Frontend Vue**: Criar interface de administração
3. **Shared packages**: Mover schemas Zod para `packages/contracts`
4. **Features adicionais**:
   - Recuperação de senha
   - Sistema de convites
   - Auditoria de ações
5. **DevOps**: Configurar CI/CD e deployment

## Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
4. Push para a branch: `git push origin feature/nova-feature`
5. Abra um Pull Request

## Licença

ISC
