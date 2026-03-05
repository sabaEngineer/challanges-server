# Badge Earned – Client Guide

## Overview

When a user earns a new badge tier (Rookie, Warrior, Builder, Iron, Wolf) by completing a check-in:

1. **For the user who earned it:** Show a Komble congratulation modal.
2. **For teammates:** The news appears in the feed and as a notification.

---

## Feed

### Badge earned post in feed

**`GET /posts/feed`**

When a teammate earns a new badge, a post with `share_type: "badge_earned"` appears in the feed:

```json
{
  "id": "post-uuid",
  "share_type": "badge_earned",
  "text": "Warrior",
  "created_at": "2026-02-16T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "...",
    "total_checkins": 30,
    "badge": { "level": 2, "name": "Warrior" }
  },
  "challenge": { "id": "uuid", "title": "30-Day Meditation" },
  "checkin": { "id": "uuid", "status": "success", "current_streak": 5 }
}
```

- **`text`** = badge name (Rookie, Warrior, Builder, Iron, Wolf)
- **`user`** = the teammate who earned the badge

---

## Notification

When a teammate earns a badge, the user receives a notification:

- **Type:** `badge_earned`
- **actor_id:** user who earned the badge
- **subject_type:** `"post"`
- **subject_id:** post ID (the badge_earned feed post)
- **payload:** `{ badge_name: "Warrior" }`

---

## Komble Congratulation Modal (for the user who earned)

### Detecting Badge Earned (Client-Side)

1. **Before check-in:** Store the current user's `badge` (from `GET /auth/me` or cached user state).
2. **After check-in:** When user completes a check-in (create or update with `status: "success"`), fetch user profile again (`GET /auth/me`).
3. **Compare:** If `newBadge.level > previousBadge.level` (or previous was `null` and new exists), the user earned a new badge → show the Komble modal.

**Badge tiers:** Rookie (10), Warrior (30), Builder (75), Iron (150), Wolf (300).

---

## Client UI: Komble Congratulation Modal

### Design

1. **Komble image** – Display the Komble mascot/character image (use your app's Komble asset).
2. **Headline** – "Komble is congratulating you!"
3. **Badge text** – Show the new badge name, e.g. "You've earned the **Warrior** badge!"
4. **Dismiss** – Button to close the modal.

### Example layout

```
┌─────────────────────────────────┐
│                                 │
│        [Komble image]           │
│                                 │
│   Komble is congratulating you! │
│                                 │
│   You've earned the Warrior     │
│   badge!                        │
│                                 │
│         [Awesome! / Dismiss]     │
└─────────────────────────────────┘
```

### Flow

1. User completes a check-in (create or update with `status: "success"`).
2. Fetch `GET /auth/me` to get updated user with `badge`.
3. Compare with previous badge – if level increased, show Komble congratulation modal.
4. User dismisses → close modal and continue.

---

## Client Implementation Prompt

Copy and paste this prompt when implementing the client:

```
Modify the "new badge earned" experience to show a Komble congratulation modal.

---

### Detecting badge earned (client-side)

1. Before check-in: store current user badge (from GET /auth/me or cached state)
2. After check-in (create or update with status "success"): fetch GET /auth/me again
3. Compare: if newBadge.level > previousBadge.level (or previous was null and new exists) → user earned a new badge

Badge tiers: Rookie (10), Warrior (30), Builder (75), Iron (150), Wolf (300).

---

### UI

Replace the generic "new badge earned" modal with a Komble congratulation modal:

1. Komble image – Show the Komble mascot/character image (app asset)
2. Headline – "Komble is congratulating you!"
3. Badge text – "You've earned the {badge.name} badge!"
4. Dismiss button – "Awesome!" or "Dismiss"

Flow:
- After check-in, fetch user and compare badge
- If badge level increased → show Komble modal with new badge name
- Use Komble image + text (not generic icon)

---

## Client Implementation: Feed + Notification

### Feed

Handle `share_type: "badge_earned"` in the feed UI. Display something like:
- "[User] earned the Warrior badge!" with user avatar and badge name
- Optionally link to the challenge or user profile

### Notification

Handle `type: "badge_earned"` in notifications. Display:
- "[Actor name] earned the [badge_name] badge!"
- Tap → navigate to the post (subject_id) or feed
```
