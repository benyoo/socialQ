# SocialQ

A cross-platform personal social interactions tracker that helps you maintain meaningful relationships by logging interactions, tracking frequency, and surfacing insights.

## Tech Stack

- **Framework:** Expo SDK 54 (React Native) + Expo Router v6
- **Language:** TypeScript 5.9
- **State Management:** Zustand + TanStack Query
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Styling:** React Native StyleSheet with custom design tokens

## Platforms

- 📱 iOS & Android (via Expo Go or dev builds)
- 🌐 Web (responsive PWA)
- 🖥️ Mac & Windows (via PWA)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run the database migration
# Copy supabase/migrations/001_initial_schema.sql into your Supabase SQL Editor and execute

# Start the dev server
npm start
```

Then press `w` for web, `i` for iOS simulator, or `a` for Android emulator.

## Project Structure

```
app/                    # Screens (Expo Router file-based routing)
├── (tabs)/             # Tab navigator (Timeline, People, Insights)
├── person/             # Person detail & add screens
├── interaction/        # Interaction logging screens
└── auth.tsx            # Login / signup

src/                    # Shared application code
├── components/ui/      # Reusable design system components
├── stores/             # Zustand state management
├── theme/              # Design tokens (colors, spacing, typography)
├── types/              # TypeScript type definitions
├── config/             # Supabase client & app configuration
└── constants/          # Static metadata maps

supabase/migrations/    # Database schema & RLS policies
```

## Features

- **People Management** — Track contacts with relationship types, closeness levels, and notes
- **Interaction Logging** — Log calls, texts, in-person meetings, video chats, and more
- **Timeline** — See your recent interactions at a glance
- **Insights** — Analytics on interaction frequency, types, and relationship health
- **Privacy First** — Row-Level Security ensures you only see your own data

## Contributing

1. Create a feature branch from `main`: `git checkout -b feature/your-feature`
2. Follow conventional commits: `type(scope): description`
3. Run `npx tsc --noEmit` before pushing
4. Open a PR for review

## License

Private — All rights reserved.
