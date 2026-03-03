# Skip "Build Your Team" for Returning Users – Client Guide

When a user signs out and logs back in, skip the "build your team" animation and text and go directly to the "join the pack" option.

---

## How it works

The backend exposes a `skip_build_team` flag on the user. When `true`, the client should skip the "build your team" flow and show the "join the pack" option directly.

---

## API

### 1. Login / Get current user

**`POST /auth/google`** and **`GET /auth/me`** both return:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "picture": "...",
    "skip_build_team": false
  }
}
```

- `skip_build_team: true` → skip animation, go to "join the pack"
- `skip_build_team: false` → show "build your team" flow

### 2. Mark as seen / skip

**`PATCH /users/me`**

```json
{
  "skip_build_team": true
}
```

Call this when:
- User completes the "build your team" flow
- User taps "Skip" or "Join the pack"
- User dismisses the onboarding screen

---

## Suggested client flow

1. **On login** (`POST /auth/google` or `GET /auth/me`):
   - Read `user.skip_build_team`
   - If `true` → show "join the pack" directly
   - If `false` → show "build your team" animation and text

2. **When user finishes or skips**:
   - Call `PATCH /users/me` with `{ "skip_build_team": true }`
   - Then navigate to "join the pack"

3. **On next login**:
   - `skip_build_team` is `true` → skip animation and go to "join the pack"
