# Suggested Commands

## Development
```bash
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Build for production
npm run start            # Run production build
npm run typecheck        # Run TypeScript type checking
```

## Database
```bash
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes directly to DB
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run seed             # Import spells from CSV
```

## Docker
```bash
# Development (MariaDB + phpMyAdmin)
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down

# Production (App + MariaDB)
docker-compose up -d
docker-compose down
```

## Database Access
- **phpMyAdmin**: http://localhost:8080 (dev mode only)
  - User: root
  - Password: devpassword
  - Database: dnd_spells

## System Commands (macOS/Darwin)
Standard Unix commands available:
- `git`, `ls`, `cd`, `grep`, `find`, `cat`, `head`, `tail`, etc.
- Package manager: `npm` (Node.js v22+)
