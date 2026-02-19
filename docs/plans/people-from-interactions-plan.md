# Auto-Create People From Interaction Logs

## Goal

When a user logs an interaction mentioning names that don't match existing contacts (e.g. "Had coffee with Sarah"), **automatically create those people** in the database and link them to the interaction. Currently, unmatched names appear as tappable chips requiring manual confirmation — this changes it to auto-create on submit.

## Affected Files

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `app/interaction/new.tsx` | Auto-create unmatched people on submit (before calling `addInteraction`) |
| MODIFY | `app/(tabs)/people.tsx` | Re-fetch people on focus so newly created contacts appear immediately |

## Implementation Steps

### 1. Auto-create unmatched people on submit (`app/interaction/new.tsx`)
In `handleSubmit`, before calling `addInteraction`:
- Loop through `parsed.unmatchedNames`
- Call `quickAddPerson(name)` for each
- Collect the returned IDs and include them in `person_ids`
- **Keep the manual "tap to add" flow** as well — it's useful for correcting names mid-input

### 2. Re-fetch people on tab focus (`app/(tabs)/people.tsx`)
- Use `useFocusEffect` from Expo Router to call `fetchPeople()` when the People tab gains focus
- This ensures contacts created during interaction logging appear immediately without a manual pull-to-refresh

## Testing Strategy

### Manual
1. Log an interaction: "Lunch with Marcus at the park"
2. Submit → interaction saved
3. Switch to People tab → "Marcus" appears as an acquaintance
4. Tap Marcus → person detail shows the linked interaction

## Risks & Open Questions

1. **Duplicate names** — If someone types "Sarah" and a "Sarah Smith" already exists, the parser **matches** it (fuzzy). Only truly unmatched names get auto-created. This is the current behavior and seems reasonable.
2. **Typos** — Auto-creating a person from a typo creates a junk contact. Mitigation: keep the real-time preview so users can see what will be created before submitting.
