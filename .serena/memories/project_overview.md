# Grimoire D&D 5e - Project Overview

## Purpose
Application web de recherche de sorts D&D 5e avec 490 sorts en français. Permet de filtrer par classe et niveau, rechercher des sorts, et afficher leurs détails dans une interface dark fantasy.

## Tech Stack
- **Frontend**: React Router v7 (SSR) avec React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Database**: MariaDB
- **ORM**: Drizzle ORM
- **Build**: Vite
- **Language**: TypeScript (strict mode)
- **Icons**: Lucide React
- **Deployment**: Docker (avec docker-compose)

## Project Structure
```
dnd-spells/
├── app/
│   ├── components/        # UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── spell/        # spell-card, spell-list, spell-detail
│   │   ├── filters/      # Search filters
│   │   └── layout/       # Header, footer
│   ├── db/
│   │   ├── schema.ts     # Drizzle schema (spells, classes, spell_classes)
│   │   ├── index.ts      # Database connection
│   │   └── queries/      # Database queries
│   ├── lib/              # Utilities and constants
│   ├── routes/           # React Router routes
│   └── app.css           # Dark fantasy theme
├── scripts/
│   └── seed.ts           # CSV import script
└── docker-compose.yml    # Docker configuration
```

## Database Schema
- **spells**: 490 spells with details (nom, niveau, ecole, description, composantes, niv1-niv9 for scaling, etc.)
- **classes**: 8 D&D classes (Barde, Clerc, Druide, Ensorceleur, Magicien, Occultiste, Paladin, Rôdeur)
- **spell_classes**: Many-to-many relationship between spells and classes

## Key Features
- Multi-select filters for Classes and Levels
- Text search on spell name and description
- URL state management for filters
- Modal detail view for spells
- Dark fantasy theme with colored badges per magic school
- Responsive design
