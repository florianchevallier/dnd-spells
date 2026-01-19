# Task Completion Workflow

When completing a code task in this project:

## 1. Type Checking
```bash
npm run typecheck
```
Always run TypeScript type checking to ensure no type errors were introduced.

## 2. Build (if applicable)
```bash
npm run build
```
For significant changes, verify the production build succeeds.

## 3. Testing Locally
```bash
npm run dev
```
Test the changes in development mode at http://localhost:5173

## 4. Database Changes
If database schema was modified:
```bash
npm run db:push      # Push schema changes to dev DB
# or
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

## 5. Code Review Checklist
- [ ] TypeScript types are correct
- [ ] No console.log statements left in production code
- [ ] Tailwind classes are properly merged (using cn() utility)
- [ ] Component props are properly typed
- [ ] Database queries use Drizzle ORM correctly
- [ ] Responsive design works on mobile and desktop
- [ ] Dark fantasy theme is maintained

## Notes
- No automated tests are configured yet
- No linting/formatting commands (ESLint/Prettier not configured)
- Manual testing is required
