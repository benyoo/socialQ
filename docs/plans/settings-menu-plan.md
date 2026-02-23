# Settings Menu

## Goal

Add a settings/menu screen accessible from every tab via a header icon. The menu provides access to:
1. **Log Out** — signs out and redirects to auth
2. **Account Settings** — email display, change password (placeholder)
3. **Notifications** — push notification preferences (placeholder toggles)  
4. **Reminders** — links to the existing `/reminders` screen

## Affected Files

### [MODIFY] [_layout.tsx](file:///home/benyoo/Dev/SocialQ/app/(tabs)/_layout.tsx)
- Add `headerRight` gear icon to `screenOptions` → navigates to `/settings`

### [NEW] [settings.tsx](file:///home/benyoo/Dev/SocialQ/app/settings.tsx)
- Full settings screen with grouped menu rows:
  - **Account**: email display, change password (placeholder)
  - **Notifications**: push notification toggle, reminder notification toggle (placeholder)
  - **Reminders**: navigates to existing `/reminders`
  - **Log Out**: calls `signOut()`, redirects to `/auth`

### [MODIFY] [_layout.tsx](file:///home/benyoo/Dev/SocialQ/app/_layout.tsx)
- Register `settings` Stack.Screen route

## Implementation Steps

1. Create `app/settings.tsx` with sectioned menu rows
2. Add gear icon header button to tab `_layout.tsx`
3. Register route in root `_layout.tsx`

## Testing Strategy

- `npx tsc --noEmit` passes
- Manual: gear icon visible on all tabs → settings screen opens → log out works → reminders link navigates correctly
