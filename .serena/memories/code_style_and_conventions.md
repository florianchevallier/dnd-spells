# Code Style and Conventions

## TypeScript
- **Strict mode enabled**: All strict TypeScript checks are enforced
- **Type annotations**: Inferred types are preferred, explicit types when needed for clarity
- **Module system**: ES modules (ESM)
- **Naming conventions**:
  - Components: PascalCase (e.g., `SpellCard.tsx`)
  - Files: kebab-case for utilities, PascalCase for components
  - Variables/functions: camelCase
  - Types/Interfaces: PascalCase
  - Database columns: snake_case in schema, camelCase in TypeScript

## React
- **Version**: React 19
- **Component style**: Functional components with hooks
- **File structure**: One component per file
- **Props**: Destructured in function parameters
- **Styling**: Tailwind CSS utility classes with tailwind-merge for conditional classes

## Drizzle ORM
- **Schema definition**: Using mysql-core with typed tables
- **Relations**: Defined separately from tables
- **Type exports**: Infer types from schema with `$inferSelect` and `$inferInsert`

## UI Components
- **Base components**: shadcn/ui (Radix UI primitives)
- **Variants**: Using class-variance-authority (cva)
- **Icons**: lucide-react

## File Organization
- Components in `app/components/[category]/`
- Database logic in `app/db/`
- Routes in `app/routes/`
- Utilities in `app/lib/`
- Types co-located with usage or in schema

## Import Paths
- Path alias `~/*` maps to `./app/*`
- Example: `import { db } from "~/db"`
