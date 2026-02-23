# Interaction Title Auto-Summary

## Goal

Change interaction titles from raw text truncation to contextual summaries mentioning person(s) and interaction type, e.g., _"Call with Sarah"_ or _"Coffee with Mike and Jane"_.

## Affected Files

### [MODIFY] [logParser.ts](file:///home/benyoo/Dev/SocialQ/src/services/logParser.ts)

Replace `extractTitle()` with `generateTitle()` that builds a summary from parsed data:

```
generateTitle(text, matchedPeople, unmatchedNames, inferredType) →
  • "Call with Sarah"
  • "Coffee with Mike and Jane"
  • "Video call with Sarah and 2 others"
  • "Texted Mike" (fallback to first sentence if no people found)
```

**Logic:**
1. Collect all names: `matchedPeople` names + `unmatchedNames`
2. Map `inferredType` to a friendly verb/label (e.g., `call` → "Call", `in-person` → "Met", `text` → "Texted", `video` → "Video call", `email` → "Emailed", `social-media` → "Social media")
3. Build: `"{Label} with {Name1} and {Name2}"` or `"{Label} with {Name1} and N others"`
4. Fallback: if no people found, use first sentence (current behavior)
5. Cap at 60 chars

No other files need changes — `parsed.title` is already used everywhere downstream.

## Testing Strategy

- `npx tsc --noEmit` — no type errors
- Manual: log a new interaction and verify the title shows the summary format
