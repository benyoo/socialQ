# Sentiment + Timeline Sort Test Plan

**Created:** 2026-02-26
**Feature:** Sentiment extraction (auto + override) and Timeline sort by created_at
**Status:** ⬜ Not Started

---

## Quick Status

computeSentiment() utility:     ⬜ NOT TESTED
New interaction auto-sentiment: ⬜ NOT TESTED
Sentiment override + "auto" badge: ⬜ NOT TESTED
Edit interaction sentiment:     ⬜ NOT TESTED
Detail view sentiment display:  ⬜ NOT TESTED
Timeline sort toggle:           ⬜ NOT TESTED

---

## Prerequisites

- [ ] Supabase migration 002 applied (`ALTER TABLE interactions RENAME COLUMN quality TO sentiment`)
- [ ] App running (`npm start -- --clear`)
- [ ] At least 3 interactions logged with different `occurred_at` and `created_at` timestamps

---

## Test 1: computeSentiment() — Unit Logic

### 1.1 Empty / whitespace input

**Action:** Call `computeSentiment('')` and `computeSentiment('   ')`
**Expected:** Returns `3` (Neutral) for both

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Empty string | 3 | | ⬜ |
| Whitespace only | 3 | | ⬜ |

### 1.2 Strongly positive text

**Action:** Input: `"Had amazing coffee with Sarah, we laughed a lot"`
**Expected:** normalized > 1.0 → returns `5` (Very Positive)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 5 | | ⬜ |
| Stars filled | 5 of 5 | | ⬜ |
| Label | "Very Positive" | | ⬜ |

### 1.3 Mildly positive text

**Action:** Input: `"Good catch-up with a friend, nice to see them again"`
**Expected:** normalized in (0.3, 1.0] → returns `4` (Positive)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 4 | | ⬜ |
| Label | "Positive" | | ⬜ |

### 1.4 Neutral text (no keyword matches)

**Action:** Input: `"Met with Alex for lunch at the office"`
**Expected:** no matched words → score = 0 → returns `3` (Neutral)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 3 | | ⬜ |
| Label | "Neutral" | | ⬜ |

### 1.5 Mildly negative text

**Action:** Input: `"Bit of an awkward conversation, felt stressed"`
**Expected:** normalized in (-1.0, -0.3] → returns `2` (Negative)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 2 | | ⬜ |
| Label | "Negative" | | ⬜ |

### 1.6 Strongly negative text

**Action:** Input: `"Terrible fight, angry and frustrated, hate how it went"`
**Expected:** normalized <= -1.0 → returns `1` (Very Negative)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 1 | | ⬜ |
| Label | "Very Negative" | | ⬜ |

### 1.7 Mixed text (positives cancel negatives)

**Action:** Input: `"Happy to reconnect but also sad they are struggling"`
**Expected:** mixed signals → normalized near 0 → returns `3`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Rating | 3 | | ⬜ |

---

## Test 2: New Interaction Screen — Auto-Sentiment

### 2.1 Stars default to Neutral on empty field

**Action:** Open `/interaction/new`, make no text entry
**Expected:** 3 of 5 stars filled; label "Neutral"; "auto" badge visible

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars filled | 3 | | ⬜ |
| Label text | "Neutral" | | ⬜ |
| "auto" badge | visible | | ⬜ |

### 2.2 Typing positive text auto-updates stars

**Action:** Type `"Amazing time with Sarah, we laughed and it was wonderful"`
**Expected:** Stars jump to 5; label "Very Positive"; "auto" badge still visible (no override yet)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars auto-update | Yes (4 or 5) | | ⬜ |
| Label updated | "Positive" or "Very Positive" | | ⬜ |
| "auto" badge still visible | Yes | | ⬜ |

### 2.3 Typing negative text auto-updates stars

**Action:** Clear text, then type `"Terrible fight, so angry and frustrated"`
**Expected:** Stars drop to 1; label "Very Negative"; "auto" badge visible

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars auto-update | Yes (1 or 2) | | ⬜ |
| "auto" badge visible | Yes | | ⬜ |

### 2.4 Tapping a star sets override and hides "auto" badge

**Action:** With positive text active, tap the 2nd star
**Expected:** Stars show 2 filled; label "Negative"; "auto" badge disappears

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars locked to tapped level | 2 | | ⬜ |
| "auto" badge hidden | Yes | | ⬜ |
| Label | "Negative" | | ⬜ |

### 2.5 Override persists while typing more text

**Action:** After tapping star (override active), continue typing more positive words
**Expected:** Stars do NOT change — override holds

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars unchanged from override | Yes | | ⬜ |
| "auto" badge still hidden | Yes | | ⬜ |

### 2.6 Clearing text resets override and returns "auto" badge

**Action:** After setting override, clear the text field completely
**Expected:** Stars reset to 3 (neutral/empty); "auto" badge reappears; override gone

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars reset | 3 | | ⬜ |
| "auto" badge reappears | Yes | | ⬜ |
| Override cleared | Yes (typing again auto-updates) | | ⬜ |

### 2.7 Submitted sentiment value is correct

**Action:** Type positive text (no override), submit form
**Expected:** Saved interaction has sentiment = computed value (4 or 5)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Sentiment in DB | 4 or 5 | | ⬜ |
| Stars in detail view match | Yes | | ⬜ |

---

## Test 3: Edit Interaction Screen — Sentiment

### 3.1 Existing sentiment loads correctly

**Action:** Open `/interaction/edit?id=<id>` for an interaction with sentiment=4
**Expected:** 4 stars filled; label "Positive"

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars prefilled | 4 | | ⬜ |
| Label text | "Positive" | | ⬜ |
| No "auto" badge | Correct — edit screen doesn't show "auto" | ⬜ |

### 3.2 Tapping a star updates sentiment directly

**Action:** In edit screen, tap the 1st star
**Expected:** Stars change to 1; label "Very Negative"

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars update | 1 | | ⬜ |
| Label updates | "Very Negative" | | ⬜ |

### 3.3 Saving persists updated sentiment

**Action:** Change stars to 2, save
**Expected:** Detail view shows 2 stars and "Negative"

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Stars in detail view | 2 | | ⬜ |
| Label in detail view | "Negative" | | ⬜ |

---

## Test 4: Interaction Detail View — Sentiment Display

### 4.1 All 5 label strings display correctly

**Action:** View interactions with sentiment 1–5
**Expected:** Labels match exactly

| Sentiment | Expected Label | Actual | Status |
|-----------|---------------|--------|--------|
| 1 | "Very Negative" | | ⬜ |
| 2 | "Negative" | | ⬜ |
| 3 | "Neutral" | | ⬜ |
| 4 | "Positive" | | ⬜ |
| 5 | "Very Positive" | | ⬜ |

### 4.2 Stars match sentiment value

**Action:** View interaction with sentiment=3
**Expected:** 3 stars filled (warning color), 2 empty

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Filled stars | 3 | | ⬜ |
| Empty stars | 2 | | ⬜ |

---

## Test 5: Timeline Sort Toggle

### 5.1 Default sort is "When happened"

**Action:** Open Timeline tab without touching sort
**Expected:** "When happened" chip is active (primary color); list ordered by `occurred_at` desc

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Active chip | "When happened" | | ⬜ |
| List order | Most recent occurred_at first | | ⬜ |

### 5.2 Switching to "Date logged" re-sorts client-side

**Action:** Tap "Date logged" sort chip
**Expected:** Chip becomes active; list reorders by `created_at` desc; no loading spinner

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Active chip switches | "Date logged" | | ⬜ |
| List reorders instantly | Yes (no network request) | | ⬜ |
| Newest logged entry is first | Yes | | ⬜ |

### 5.3 Sort persists through filter changes

**Action:** With "Date logged" active, apply a type filter
**Expected:** Filtered results still sorted by `created_at` desc

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Sort maintained after filter | Yes | | ⬜ |

### 5.4 Switching back to "When happened" restores original order

**Action:** Tap "When happened" chip
**Expected:** List reverts to `occurred_at` desc order

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Order reverts | occurred_at desc | | ⬜ |

---

## Pass/Fail Criteria

| Criteria | Pass | Fail |
|----------|------|------|
| All sentiment label strings correct (1–5) | All 5 match | Any mismatch |
| Auto-sentiment updates on every keystroke | Yes | No update |
| "auto" badge hides on override, reappears on clear | Yes | Badge stuck/missing |
| Override holds while typing | Yes | Override reset by typing |
| Edit screen pre-fills correct sentiment | Yes | Shows wrong value |
| Timeline default sort is occurred_at | Yes | Wrong default |
| Sort toggle is instant (no network request) | Yes | Spinner/delay |
| Supabase migration applied (no column errors) | No errors | DB column error |

---

## Sign-Off

| Test | Tester | Date | Status |
|------|--------|------|--------|
| Test 1: computeSentiment() unit logic | | | ⬜ |
| Test 2: New interaction auto-sentiment | | | ⬜ |
| Test 3: Edit screen sentiment | | | ⬜ |
| Test 4: Detail view display | | | ⬜ |
| Test 5: Timeline sort toggle | | | ⬜ |
