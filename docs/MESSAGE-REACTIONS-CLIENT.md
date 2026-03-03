# Message Reactions API – Client Reference

Add or remove reactions on chat messages. Each message can have **at most one reaction**. All endpoints require **JWT Bearer** auth.

---

## Endpoints

### 1. Set or update reaction on a message

**`PUT /conversations/:conversationId/messages/:messageId/reaction`**

Add a reaction or replace the existing one. One reaction per message max.

**Path params:**
| Param           | Type | Description                    |
|-----------------|------|--------------------------------|
| `conversationId`| uuid | Conversation ID                |
| `messageId`     | uuid | Message ID                     |

**Request body:**
```json
{
  "reaction_type": "thumbs_up"
}
```

**Reaction types:** `thumbs_up`, `heart`, `laugh`, `wow`, `sad`, `angry`

**Response (200):**
```json
{
  "reaction": {
    "reaction_type": "thumbs_up",
    "user_id": "uuid"
  }
}
```

**Errors:** 403 (not a participant), 404 (conversation or message not found)

---

### 2. Remove reaction from a message

**`DELETE /conversations/:conversationId/messages/:messageId/reaction`**

Remove the reaction from the message.

**Path params:**
| Param           | Type | Description                    |
|-----------------|------|--------------------------------|
| `conversationId`| uuid | Conversation ID                |
| `messageId`     | uuid | Message ID                     |

**Response (200):**
```json
{
  "reaction": null
}
```

**Errors:** 403 (not a participant), 404 (conversation or message not found)

---

## Message object (includes reaction)

When fetching messages via `GET /conversations/:id/messages` or when sending via `POST /conversations/:id/messages`, each message includes:

```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "type": "text",
  "status": "sent",
  "text": "Hello!",
  "reaction": {
    "reaction_type": "heart",
    "user_id": "uuid"
  },
  "created_at": "2026-02-16T12:00:00.000Z"
}
```

- `reaction`: `null` if no reaction, otherwise `{ reaction_type, user_id }`

---

## Client Implementation Prompt

Copy and paste this prompt when implementing the client:

```
Implement message reactions in the chat UI. Use these API endpoints:

---

### 1. Set or update reaction on a message

PUT /conversations/:conversationId/messages/:messageId/reaction

Add a reaction or replace the existing one. One reaction per message max.

Path params:
- conversationId (uuid): Conversation ID
- messageId (uuid): Message ID

Request body:
{
  "reaction_type": "thumbs_up"
}

Reaction types: thumbs_up, heart, laugh, wow, sad, angry

Response (200):
{
  "reaction": {
    "reaction_type": "thumbs_up",
    "user_id": "uuid"
  }
}

Errors: 403 (not a participant), 404 (conversation or message not found)

---

### 2. Remove reaction from a message

DELETE /conversations/:conversationId/messages/:messageId/reaction

Path params:
- conversationId (uuid): Conversation ID
- messageId (uuid): Message ID

Response (200):
{
  "reaction": null
}

Errors: 403 (not a participant), 404 (conversation or message not found)

---

### Message object (includes reaction)

GET /conversations/:id/messages and POST /conversations/:id/messages return messages with:

{
  "id": "uuid",
  "sender_id": "uuid",
  "type": "text",
  "status": "sent",
  "text": "Hello!",
  "reaction": { "reaction_type": "heart", "user_id": "uuid" } | null,
  "created_at": "2026-02-16T12:00:00.000Z"
}

---

Auth: All requests require JWT Bearer token.

UI flow:
- Long-press or tap reaction icon on a message → show picker (thumbs_up, heart, laugh, wow, sad, angry)
- Select reaction → PUT with that reaction_type (replaces existing)
- Tap current reaction again or "remove" → DELETE
- Use optimistic updates, then sync with server response
```
