# Private Invite Challenges – Client Guide

## Overview

Challenges with `visibility: "private_invite"` are invite-only. Only the creator can invite teammates; invited users can view the challenge, accept (join), or decline. Users cannot join without an invite.

---

## API Endpoints

### 1. List pending invites

**`GET /challenges/invites`**

- **Auth:** Bearer token required
- **Response:** Array of pending invites

```json
[
  {
    "id": "invite-uuid",
    "challenge_id": "challenge-uuid",
    "challenge": {
      "id": "challenge-uuid",
      "title": "30-Day Meditation",
      "description": "...",
      "visibility": "private_invite",
      "type": "flexible",
      "member_count": 5,
      "creator": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "picture": "...",
        "total_checkins": 42,
        "badge": { "level": 2, "name": "Warrior" }
      }
    },
    "inviter": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "picture": "...",
      "total_checkins": 42,
      "badge": { "level": 2, "name": "Warrior" }
    },
    "created_at": "2026-02-16T12:00:00.000Z"
  }
]
```

---

### 2. Invite teammates

**`POST /challenges/:id/invite`**

- **Auth:** Bearer token required
- **Who:**
  - **private_invite:** Creator only
  - **public / teammates_only:** Any member can invite teammates
- **Body:**

```json
{
  "user_ids": ["uuid-1", "uuid-2"]
}
```

- **Constraints:** 1–20 user IDs; must be teammates of the creator
- **Response (201):**

```json
{
  "invited": 2,
  "user_ids": ["uuid-1", "uuid-2"]
}
```

- **Errors:** 403 (not creator for private_invite / not member for public / not teammate), 404 (challenge not found)

---

### 3. Decline invite

**`PATCH /challenges/:id/invite/decline`**

- **Auth:** Bearer token required
- **Path:** `:id` = challenge ID
- **Response (200):**

```json
{
  "success": true
}
```

- **Errors:** 404 (invite not found or already responded)

---

### 4. Join challenge (accept invite)

**`POST /challenges/:id/join`**

- **Auth:** Bearer token required
- For `private_invite`: user must have a pending invite. On join, invite status becomes `accepted`.
- **Response (201):** Challenge member object
- **Errors:** 403 (must be invited), 404 (challenge not found), 409 (already a member)

---

### 5. Get challenge by ID (visibility rules)

**`GET /challenges/:id`**

- For `private_invite`: only creator, members, or users with a pending invite can see the challenge.
- **Errors:** 403 (no access)

---

## Notification

When a user is invited, they receive a notification:

- **Type:** `challenge_invite`
- **Payload:** `{ challenge_title: string }`
- **subject_type:** `"challenge"`
- **subject_id:** challenge UUID
- **actor_id:** inviter (creator) user ID

---

## Client Implementation Prompt

Copy and paste this prompt when implementing the client:

```
Implement private invite challenges in the app. Use these API endpoints:

---

### 1. List pending invites

GET /challenges/invites

Auth: JWT Bearer required.

Response (200): Array of invites, each with:
- id: invite UUID
- challenge_id: challenge UUID
- challenge: full challenge object (title, description, visibility, member_count, creator, etc.)
- inviter: user object (id, firstName, lastName, picture, badge)
- created_at: ISO timestamp

---

### 2. Invite teammates

POST /challenges/:id/invite

Auth: JWT Bearer required.
Path: :id = challenge ID

Request body:
{
  "user_ids": ["uuid-1", "uuid-2"]
}

Constraints: 1–20 user IDs; must be teammates of the inviter.
Who can invite:
- private_invite: creator only
- public / teammates_only: any member can invite

Response (201):
{
  "invited": 2,
  "user_ids": ["uuid-1", "uuid-2"]
}

Errors: 403 (not creator for private_invite / not member for public / not teammate), 404 (challenge not found)

---

### 3. Decline invite

PATCH /challenges/:id/invite/decline

Auth: JWT Bearer required.
Path: :id = challenge ID

Response (200):
{
  "success": true
}

Errors: 404 (invite not found or already responded)

---

### 4. Join challenge (accept invite)

POST /challenges/:id/join

For private_invite challenges: user must have a pending invite. On join, invite is accepted.

Response (201): Challenge member object
Errors: 403 (must be invited), 404 (challenge not found), 409 (already a member)

---

### 5. Get challenge by ID

GET /challenges/:id

For private_invite: only creator, members, or users with a pending invite can see. Others get 403.

---

### Notification

When invited, user gets notification:
- type: "challenge_invite"
- payload: { challenge_title: string }
- subject_type: "challenge", subject_id: challenge UUID
- actor_id: inviter user ID

---

Auth: All requests require JWT Bearer token.

UI flow:
1. Invites screen: GET /challenges/invites → show list of pending invites with challenge details and inviter
2. On invite tap: GET /challenges/:id to load full challenge (user has access via pending invite)
3. Accept: POST /challenges/:id/join → navigate to challenge
4. Decline: PATCH /challenges/:id/invite/decline → remove from invites list
5. Invite flow: On challenge detail, show "Invite teammates" (any member for public/teammates_only; creator only for private_invite) → pick teammates → POST /challenges/:id/invite
6. Handle notification type "challenge_invite" → deep link to invites or challenge detail
7. Badge/count: Show invite count in nav/tab when user has pending invites
```
