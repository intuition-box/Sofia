# Mastra Storage Configuration

## Current Configuration

The Mastra instance uses LibSQL for local development:

```typescript
// src/mastra/index.ts
storage: new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./data/mastra.db',
})
```

## Storage Options

### 1. Local SQLite File (Default - Development)
```bash
DATABASE_URL=file:./data/mastra.db
```
- Simple, no external dependencies
- Good for local development

### 2. PostgreSQL (Recommended for Production/Phala Cloud)
```bash
pnpm add @mastra/pg
```

```typescript
import { PostgresStore } from '@mastra/pg';

storage: new PostgresStore({
  connectionString: process.env.DATABASE_URL,
})
```

Environment:
```bash
DATABASE_URL=postgresql://user:password@host:5432/mastra_db
```

**Avantages:**
- Scalable pour production
- Backup/restore facile
- Multi-instances supporté
- Connexion pool intégré

### 3. Turso (Cloud SQLite)
```bash
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```
- Managed cloud database
- Free tier: https://turso.tech

## Migration vers PostgreSQL

1. Installer le package:
```bash
cd sofia-mastra
pnpm add @mastra/pg
```

2. Modifier `src/mastra/index.ts`:
```typescript
import { PostgresStore } from '@mastra/pg';

export const mastra = new Mastra({
  // ...
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL,
  }),
});
```

3. Configurer `.env`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mastra_db
```

## Déploiement Phala Cloud

### Option A: PostgreSQL externe (Neon, Supabase, Railway)
```bash
# Neon (free tier)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mastra_db

# Supabase
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres

# Railway
DATABASE_URL=postgresql://postgres:pass@xxx.railway.app:5432/railway
```

### Option B: PostgreSQL dans le même cluster
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mastra_db
      POSTGRES_USER: mastra
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  sofia-mastra:
    environment:
      DATABASE_URL: postgresql://mastra:${POSTGRES_PASSWORD}@postgres:5432/mastra_db
```

## What Mastra Stores

- Workflow run history
- Agent conversation logs (if memory enabled)
- Telemetry data (if enabled)
- Scorer results

## Related Files

- [src/mastra/index.ts](src/mastra/index.ts) - Mastra configuration
- [.env](.env) - Environment variables

## Références

- https://mastra.ai/reference/storage/postgresql
- https://mastra.ai/reference/storage/libsql
