# Notifications API – Client Reference

In-app notifications for events like team-up requests, messages (future), and reactions (future). All endpoints require **JWT Bearer** auth.

---

## Endpoints

### 1. Get notifications (paginated)

**`GET /notifications`**

Returns the current user's notifications, newest first.

**Query params:**

| Param        | Type    | Default | Description              |
|--------------|---------|---------|--------------------------|
| `unread_only`| boolean | false   | Filter to unread only    |
| `page`       | number  | 1       | Page number              |
| `limit`      | number  | 20      | Items per page (max 50)  |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "teammate_request",
      "actor": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "picture": "https://..."
      },
      "subject_type": "teammate_request",
      "subject_id": "request-uuid",
      "payload": {},
      "read_at": null,
      "created_at": "2025-02-16T12:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

- `read_at`: `null` = unread, ISO8601 timestamp = read
- `actor`: User who triggered the notification (null for system events)
- `subject_type` + `subject_id`: Link to the related entity (e.g. teammate_request → request ID)

---

### 2. Get unread count

**`GET /notifications/unread-count`**

Returns the number of unread notifications (for badge).

**Response (200):**
```json
{
  "count": 3
}
```

---

### 3. Mark one as read

**`PATCH /notifications/:id/read`**

Marks a single notification as read. Call when the user opens/taps the notification.

**Response (200):**
```json
{
  "read_at": "2025-02-16T12:05:00.000Z"
}
```

**Errors:** `404` – Notification not found

---

### 4. Mark all as read

**`PATCH /notifications/read-all`**

Marks all notifications for the current user as read.

**Response (200):**
```json
{
  "success": true
}
```

---

## Notification types

| type                | Description                    | subject_type      | subject_id      |
|---------------------|--------------------------------|-------------------|-----------------|
| `teammate_request`  | Someone sent a team-up request | teammate_request  | request ID      |
| `message`           | New message                    | message           | message ID      |
| `post_like`         | Someone liked your post        | post              | post ID         |
| `reaction_on_checkin`| Reaction on check-in (future) | checkin           | checkin ID      |
| `reaction_on_comment`| Reaction on comment (future)  | comment           | comment ID      |
| `comment_on_checkin` | Comment on check-in (future)  | checkin           | checkin ID      |

---

## Suggested client flow

1. **Badge:** Poll or fetch `GET /notifications/unread-count` on app focus / tab switch.
2. **List:** `GET /notifications` with optional `?unread_only=true`.
3. **On tap:** `PATCH /notifications/:id/read`, then navigate using `subject_type` + `subject_id` (e.g. teammate_request → teammate requests screen).
4. **Mark all read:** When user opens notifications screen or taps "Mark all read" → `PATCH /notifications/read-all`.
