# Interaction Detail View

## Goal

Create a detail screen at `app/interaction/[id].tsx` so users can view the full details of a past interaction. The Timeline cards already navigate to `/interaction/${id}` — this screen receives that route and displays all the interaction data.

## Affected Files

| Action | File | Purpose |
|--------|------|---------|
| NEW | `app/interaction/[id].tsx` | Interaction detail screen |
| MODIFY | `app/_layout.tsx` | Register the `interaction/[id]` route in the Stack |
| MODIFY | `src/stores/interactionsStore.ts` | Add `getInteractionById()` helper |

## Implementation Steps

### 1. Add `getInteractionById()` to interactions store
- Lookup from the already-fetched `interactions` array by ID
- If not found, fetch from Supabase directly (fallback for deep links)

### 2. Create `app/interaction/[id].tsx`
Layout:
1. **Header** — interaction type icon + badge, title, relative time
2. **Full notes** — all text from the log entry, no truncation
3. **People section** — avatar chips, tappable to navigate to person detail
4. **Metadata card** — date/time, location, quality stars, duration
5. **Actions** — Edit and Delete buttons at the bottom
- **Acceptance:** Screen loads, all fields displayed, people are tappable

### 3. Register route in `app/_layout.tsx`
- Add `Stack.Screen` for `interaction/[id]` with title "Interaction" and `presentation: 'card'`

## Testing Strategy

### Manual
- Tap an interaction card on Timeline → detail screen opens with correct data
- Verify all fields: title, notes, people, type badge, date, location, quality
- Tap a person avatar → navigates to person detail screen
- Deep link to `/interaction/<uuid>` → screen loads

## Risks & Open Questions

1. **Edit/delete** — Should delete be immediate or confirm with a dialog? Recommend confirmation dialog.
2. **Edit flow** — Should edit reuse the log input screen with pre-filled data, or inline editing? Recommend a separate pass for editing — keep this plan focused on read-only view.
