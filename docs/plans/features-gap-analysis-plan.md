# SocialQ Feature Gap Analysis & Implementation Plan

## Goal

Analyze `docs/decisions/features.md` against the current codebase to identify what's built vs. missing, then propose a prioritized implementation plan.

## Gap Analysis Summary

| Feature Area | Built | Missing |
|---|---|---|
| **People Management** | Add, view, delete, search, filter | **Edit person** |
| **Interaction Logging** | NLP input, all types, notes, quality | **Photos**, **scheduling** |
| **Timeline** | Recent interactions, pull-to-refresh | **Search**, **filters** |
| **Insights** | Summary stats, type breakdown, needs-attention | **Trend charts**, **reminders** |
| **Privacy** | RLS, encryption | **Biometric auth** |

## Affected Files (P1 Features)

| Action | File | Purpose |
|---|---|---|
| NEW | `app/person/edit.tsx` | Edit person form (pre-filled) |
| MODIFY | `app/person/[id].tsx` | Add Edit button |
| MODIFY | `app/_layout.tsx` | Register edit route |
| MODIFY | `app/(tabs)/index.tsx` | Add search bar + filter chips to Timeline |

## Implementation Steps

### 1. Edit Person Screen
- Create `app/person/edit.tsx` that receives a `personId` query param
- Reuse form layout from `person/new.tsx`, pre-fill with existing data
- Wire submit to `updatePerson()` from `peopleStore`
- Add "Edit" button in `person/[id].tsx` header
- Register route in `app/_layout.tsx`

### 2. Timeline Search & Filters
- Add search bar (matching People tab style) to `(tabs)/index.tsx`
- Add horizontal filter chips for interaction type
- Add date range presets (This Week / This Month / All Time)
- Client-side filtering on existing `interactions` array

## Testing Strategy

### Manual
- Edit a person → verify data persists
- Search Timeline by text → verify filter works
- Filter Timeline by type → verify only matching interactions show
- Clear all filters → verify full list returns

### Automated
- `npx tsc --noEmit` — no type errors

## Risks & Open Questions

1. **Which features to build?** — The plan identifies 7 gaps across 5 categories. Recommended starting with P1 (Edit Person + Timeline Search/Filters) but user should confirm priority order.
2. **Photo attachments** — Requires setting up a Supabase Storage bucket, which may need Supabase dashboard access.
3. **Push notifications for reminders** — Requires Expo push notification setup and potentially a server-side cron/scheduler.
