# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev                     # Start dev server (localhost:5173)
npm run build                   # Build for production
npm start                       # Run production build
npm run typecheck              # Type check TypeScript
```

### Database
```bash
# Development environment (MariaDB + phpMyAdmin)
docker-compose -f docker-compose.dev.yml up -d

# Seed database from CSV
npm run seed ../grimoire_dnd_structured_final.csv

# Drizzle ORM commands
npm run db:generate            # Generate migrations
npm run db:migrate             # Apply migrations
npm run db:push                # Push schema changes
npm run db:studio              # Open Drizzle Studio GUI
```

### Production
```bash
docker-compose up -d           # Start app + MariaDB in production
docker-compose exec app npm run seed /path/to/csv
```

## Architecture

### Tech Stack
- **Frontend**: React Router v7 with SSR enabled
- **Database**: MariaDB with connection pooling
- **ORM**: Drizzle ORM
- **Search**: Fuse.js for client-side fuzzy search
- **UI**: Tailwind CSS 4.x + shadcn/ui components

### Database Schema
The database uses a many-to-many relationship between spells and classes:

- **spells**: 490 D&D 5e spells with detailed properties (casting time, range, duration, components, scaling by level, etc.)
- **classes**: 8 D&D classes (Barde, Clerc, Druide, Ensorceleur, Magicien, Occultiste, Paladin, Rôdeur)
- **spell_classes**: Junction table linking spells to their classes

Indexes:
- Single indexes on `niveau` and `ecole`
- Composite index on `(niveau, ecole)`
- FULLTEXT index on `(nom, description)` for search

### Data Flow
1. **Server-side filtering**: Class and level filters are applied via URL params (`?class=magicien&level=1`) and processed in loader functions using Drizzle queries
2. **Client-side search**: Text search is handled by Fuse.js on the client for fuzzy matching without re-fetching
3. **URL state**: Filter state persists in URL, enabling shareable links

### Key Patterns
- **Loaders**: React Router loaders fetch filtered spells server-side based on URL params (see `app/routes/spells._index.tsx`)
- **Query layer**: Database queries are abstracted in `app/db/queries/spells.ts` with proper typing
- **Connection management**: Database pool is created once in `app/db/index.ts` and reused across requests
- **CSV seeding**: The `scripts/seed.ts` script handles full database recreation, class normalization, and bulk import

### Component Structure
- `app/components/spell/`: Spell card, list, and detail modal
- `app/components/filters/`: Filter controls (class, level, search)
- `app/components/ui/`: shadcn/ui base components
- `app/components/layout/`: Header and footer

### Environment Variables
Required in `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=devpassword
DB_NAME=dnd_spells
```

### CSV Import Format
The seed script expects a CSV with French D&D 5e spell data. Key requirements:
- Class names are normalized (handles accented characters like "Rôdeur" → "rodeur")
- Boolean fields: "Oui" = true
- Numeric fields: parsed to integers
- Classes field: comma-separated list of class names
- Scaling info: stored in `niv_1` through `niv_9` columns
