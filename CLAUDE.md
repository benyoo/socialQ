# SocialQ

## Project Overview
SocialQ is a cross-platform personal social interactions tracker built with Expo (React Native) and Supabase. It helps you maintain meaningful relationships by logging interactions, tracking frequency, and surfacing insights.

## Architecture
- `app/` — Expo Router screens (file-based routing)
  - `(tabs)/` — Tab navigator (Timeline, People, Insights)
  - `person/` — Person detail & add screens
  - `interaction/` — Interaction logging screens
- `src/` — Application source code
  - `components/ui/` — Reusable design system components (Card, Button, Badge, Avatar, Input)
  - `stores/` — Zustand state management (authStore, peopleStore, interactionsStore)
  - `theme/` — Design tokens (colors, spacing, typography, shadows)
  - `types/` — TypeScript type definitions
  - `config/` — Supabase client and app configuration
  - `constants/` — Static metadata maps
- `supabase/migrations/` — Database schema migrations
- `tests/` — Test files
- `.claude/` — Claude Code configuration (commands, rules)

## Tech Stack
- **Runtime**: Expo SDK 54 (React Native 0.81)
- **Routing**: Expo Router v6 (file-based)
- **Language**: TypeScript 5.9
- **State**: Zustand (client) + TanStack Query (server)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: React Native StyleSheet with custom design tokens
- **Icons**: @expo/vector-icons (Ionicons)

## Code Style & Conventions
- Use functional components with hooks
- One component per file, named exports preferred
- Zustand stores in `src/stores/`, one store per domain
- Design tokens imported from `src/theme/tokens.ts` — never use raw color/spacing values
- File-based routing in `app/` directory (Expo Router)
- TypeScript strict mode enabled

## Common Commands
```bash
# Start dev server (opens Expo DevTools)
npm start

# Start for specific platform
npm run ios
npm run android
npm run web

# Run TypeScript type check
npx tsc --noEmit

# Run tests
npx jest
```

## Git Workflow
- Create feature branches from `main` using `feature/<description>`
- Write conventional commit messages: `type(scope): description`
- Keep commits small and atomic
- Run `npx tsc --noEmit` before pushing

## Important Notes
- Never commit `.env` — use `.env.example` as template
- Supabase credentials go in `.env` with `EXPO_PUBLIC_` prefix
- Database changes go in `supabase/migrations/` as numbered SQL files
- All tables have Row-Level Security — users can only access their own data
- Check `docs/decisions/` for Architecture Decision Records before making structural changes
