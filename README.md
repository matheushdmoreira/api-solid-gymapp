<p align="center">
  <img src="https://docs.google.com/uc?id=1IK4wQrIOY6QMrgKEhZXGWYOqmxiWpnui" width="200" />
</p>

# GymAPP (API estilo GymPass) — Documentação da Aplicação

## Visão geral

Esta aplicação é uma **API HTTP** (Node.js + TypeScript) que simula funcionalidades centrais de um app estilo **GymPass**:

- **Cadastro e autenticação de usuários**
- **Consulta do perfil do usuário logado**
- **Cadastro e busca de academias (gyms)**
- **Check-in em academia com validações de proximidade e frequência**
- **Validação de check-in por administradores**
- **Histórico e métricas de check-ins**

A API segue uma separação por camadas (inspirada em SOLID):

- **HTTP Controllers**: recebem request/response e fazem validação (Zod)
- **Use Cases**: concentram regras de negócio
- **Repositories**: abstraem persistência (Prisma/PostgreSQL ou InMemory em testes)

## Stack e bibliotecas

- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Framework HTTP**: Fastify
- **Validação/Schema**: Zod + `fastify-type-provider-zod`
- **Auth**: JWT (`@fastify/jwt`) + cookie (`@fastify/cookie`)
- **Banco**: PostgreSQL via Prisma
- **Documentação**: Swagger/OpenAPI (somente em `NODE_ENV=dev`) + Scalar API Reference em `/docs`
- **Testes**: Vitest
  - Unitários (use-cases) em ambiente Node
  - E2E (controllers HTTP) em ambiente Prisma isolado por schema

## Modelo de dados (Prisma)

Entidades principais:

- **User**
  - `id`, `name`, `email` (único), `password_hash`, `role` (`ADMIN` | `MEMBER`), `created_at`
- **Gym**
  - `id`, `title`, `description?`, `phone?`, `latitude`, `longitude`
- **CheckIn**
  - `id`, `created_at`, `validated_at?`, `user_id`, `gym_id`

Relacionamentos:

- Um **User** tem muitos **CheckIns**
- Um **Gym** tem muitos **CheckIns**
- Um **CheckIn** pertence a um **User** e a um **Gym**

## Requisitos e regras (implementadas)

### Requisitos funcionais (RFs)

- [x] Deve ser possível se cadastrar;
- [x] Deve ser possível se autenticar;
- [x] Deve ser possível obter o perfil de um usuário logado;
- [x] Deve ser possível obter o número de check-ins realizados pelo usuário logado;
- [x] Deve ser possível o usuário obter o seu histórico de check-ins;
- [x] Deve ser possível o usuário buscar academias próximas (até 10km);
- [x] Deve ser possível o usuário buscar academias pelo nome;
- [x] Deve ser possível o usuário realizar check-in em uma academia;
- [x] Deve ser possível validar o check-in de um usuário;
- [x] Deve ser possível cadastrar uma academia (admin);

### Regras de negócio (RNs)

- [x] O usuário não deve poder se cadastrar com um e-mail duplicado;
- [x] O usuário não pode fazer 2 check-ins no mesmo dia;
- [x] O usuário não pode fazer check-in se não estiver perto (100m) da academia;
- [x] O check-in só pode ser validado até 20 minutos após ser criado;
- [x] O check-in só pode ser validado por administradores;
- [x] A academia só pode ser cadastrada por administradores;

### Requisitos não-funcionais (RNFs)

- [x] A senha do usuário precisa estar criptografada;
- [x] Os dados da aplicação precisam estar persistidos em um banco PostgreSQL;
- [x] Todas listas de dados precisam estar paginadas com 20 itens por página;
- [x] O usuário deve ser identificado por um JWT (JSON Web Token);
- [x] CI e CD implementado;

## Autenticação e autorização

### Tokens

- **Access token (JWT)**:
  - Enviado via `Authorization: Bearer <token>`
  - Expira em **10 minutos** (configurado no `@fastify/jwt` do app)
  - Contém `role` no payload e `sub` como `user.id`

- **Refresh token (JWT)**:
  - Armazenado em cookie `refreshToken`
  - Expira em **7 dias**
  - Cookie com `httpOnly`, `sameSite`, `secure`, `path=/`

### Papéis (roles)

Há dois papéis no sistema:

- `MEMBER`: usuário padrão
- `ADMIN`: necessário para **cadastrar academias** e **validar check-ins**

O plugin `auth` adiciona helpers no `request`:

- `request.getCurrentUserId()` → valida o JWT e retorna `sub`
- `request.verifyUserRole('ADMIN' | 'MEMBER')` → valida role do usuário autenticado

## Rotas HTTP (endpoints)

Observação: a API usa schemas Zod para validar `body`, `params` e `querystring` e para gerar OpenAPI quando `NODE_ENV=dev`.

### Users

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/users` | Não | Cadastra usuário (name, email, password) |
| POST | `/sessions` | Não | Autentica usuário (email, password) e retorna access token + seta cookie refresh |
| PATCH | `/token/refresh` | Cookie | Gera novo access token e renova refresh token (usa somente cookie) |
| GET | `/me` | Bearer | Retorna perfil do usuário logado |

Exemplo de login:

```bash
curl -i -X POST http://localhost:3333/sessions \
  -H 'content-type: application/json' \
  -d '{"email":"johndoe@email.com","password":"123456"}'
```

### Gyms

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/gyms/search?q=...&page=1` | Bearer | Busca por nome (paginado, 20 por página) |
| GET | `/gyms/nearby?latitude=...&longitude=...` | Bearer | Lista academias próximas (até 10km) |
| POST | `/gyms` | Bearer + ADMIN | Cadastra uma academia |

Body do cadastro (`POST /gyms`):

```json
{
  "title": "Academia X",
  "description": "Opcional",
  "phone": "Opcional",
  "latitude": -23.56,
  "longitude": -46.63
}
```

### Check-ins

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/gyms/:gymId/check-ins` | Bearer | Realiza check-in em uma academia (com latitude/longitude do usuário) |
| PATCH | `/check-ins/:checkInId/validate` | Bearer + ADMIN | Valida check-in (até 20 min após criado) |
| GET | `/check-ins/history?page=1` | Bearer | Lista histórico de check-ins do usuário (paginado) |
| GET | `/check-ins/metrics` | Bearer | Retorna total de check-ins do usuário |

Body do check-in:

```json
{
  "latitude": -23.56,
  "longitude": -46.63
}
```

## Geolocalização: cálculo de distância e “nearby”

- **Check-in**: a distância entre usuário e academia é calculada em km e comparada com **0,1 km**.
- **Academias próximas**: o repositório Prisma utiliza consulta SQL com fórmula de Haversine para filtrar academias em um raio de **10 km**.

## Tratamento de erros e validações

- **Validação de entrada**:
  - Erros de schema (Zod) resultam em **400** com `message: "Validation error."` e `issues`.
  - Latitude/longitude são validados para limites geográficos:
    - latitude: \(|value| \le 90\)
    - longitude: \(|value| \le 180\)
- **Autenticação**:
  - Falhas de JWT retornam **401 Unauthorized**
  - Caso não exista token no cookie em rotas que exigem `onlyCookie`, a API trata o erro `FST_JWT_NO_AUTHORIZATION_IN_COOKIE` como **401**

Erros de negócio relevantes nos use-cases:

- `UserAlreadyExistsError` (e-mail duplicado)
- `InvalidCredentialsError` (login)
- `ResourceNotFoundError` (ex.: gym/check-in inexistente)
- `MaxDistanceError` (check-in fora de 100m)
- `MaxNumberOfCheckInsError` (2 check-ins no mesmo dia)
- `LateCheckInValidationError` (validação após 20 min)

## Persistência e ambiente local (PostgreSQL + Prisma)

### Banco via Docker

Há um `docker-compose.yml` com PostgreSQL (Bitnami):

- Usuário: `docker`
- Senha: `docker`
- Database: `apisolid`
- Porta: `5432`

### Variáveis de ambiente

Além de `DATABASE_URL` (necessária para o Prisma), a API valida:

- `JWT_SECRET` (**obrigatória**)
- `PORT` (default `3333`)
- `NODE_ENV` (`dev` | `test` | `production`, default `dev`)

## Testes

Os testes são organizados em dois “projetos” do Vitest:

- **Unit (use-cases)**: `src/use-cases/**/*.spec.ts`
- **E2E (HTTP controllers)**: `src/http/**/*.spec.ts`

Nos testes e2e, existe um ambiente customizado (`prisma`):

- Gera um schema aleatório por execução
- Ajusta `DATABASE_URL` para usar esse schema
- Executa `prisma migrate deploy`
- Faz teardown removendo o schema no fim

Scripts úteis (ver `package.json`):

- `npm run test` (unit)
- `npm run test:e2e`
- `npm run test:coverage`
- `npm run test:ui`

## Como executar

Comece clonando o repositório:

```sh
git clone https://github.com/matheushdmoreira/api-solid-gymapp
```

### Desenvolvimento

1) Defina `.env` com pelo menos:

- `JWT_SECRET=...`
- `DATABASE_URL=postgresql://docker:docker@localhost:5432/apisolid?schema=public`

2) Suba o Postgres:

```bash
docker compose up -d
```

3) Rode migrações:

```bash
npx prisma migrate deploy
```

4) Inicie a API:

```bash
npm run dev
```

Em `NODE_ENV=dev`, a documentação fica disponível em **`/docs`**.

### Build/produção

- `npm run build`
- `npm run start`

## Organização de pastas (guia rápido)

- `src/app.ts`: instancia Fastify, registra plugins (CORS/JWT/Cookie/Swagger) e rotas
- `src/server.ts`: sobe o servidor
- `src/http/controllers/**`: rotas e controllers por domínio
- `src/http/middlewares/**`: autenticação/autorização
- `src/use-cases/**`: regras de negócio
- `src/repositories/**`: contratos e implementações (Prisma/InMemory)
- `src/lib/prisma.ts`: client do Prisma
- `prisma/**`: schema, migrations e ambiente de teste do Vitest

## Links rápidos ↗

- [Fastify](https://fastify.dev/docs/latest/Guides/Getting-Started)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Fastify Type Provider Zod](https://github.com/turkerdev/fastify-type-provider-zod)
- [Zod](https://zod.dev)
- [@fastify/jwt](https://github.com/fastify/fastify-jwt)
- [@fastify/cookie](https://github.com/fastify/fastify-cookie)
- [@fastify/swagger](https://github.com/fastify/fastify-swagger)
- [@scalar/fastify-api-reference](https://scalar.com/products/api-references/integrations/fastify)
- [Prisma](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql)
- [Vitest](https://vitest.dev/guide)

## License

MIT License © [Matheus Moreira](https://github.com/matheushdmoreira)
