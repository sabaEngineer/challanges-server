# System Advice (Komble Tips) – Client Guide

## Overview

Each challenge can have **system_advice** – tips and tricks from Komble to help users complete the challenge and build the habit long term. Only admins can set or update this text. Users see a button and, when they tap it, the advice text.

---

## API Endpoints

### 1. Get challenge (includes `system_advice`)

**`GET /challenges/:id`**

- **Auth:** Bearer token required
- **Response:** Challenge object including `system_advice` (string or `null`)

```json
{
  "id": "uuid",
  "title": "30-Day Meditation",
  "description": "...",
  "system_advice": "Start with just 5 minutes. Find a quiet spot...",
  "visibility": "public",
  "type": "flexible",
  "member_count": 42,
  "creator": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "...",
    "total_checkins": 42,
    "badge": { "level": 2, "name": "Warrior" },
    "role": "admin"
  },
  ...
}
```

**Note:** `creator.role` is included so the client can detect admin-created challenges (`creator.role === 'admin'`).

If no advice is set, `system_advice` is `null`.

---

### 2. Other challenge endpoints (also include `system_advice`)

| Endpoint | Description |
|----------|-------------|
| `GET /challenges/explore` | Public challenges (paginated) – each item has `system_advice` |
| `GET /challenges/my` | User's challenges – each item has `system_advice` |

---

### 3. Admin: Set system advice on create

**`POST /challenges`**

- **Auth:** Bearer token (admin only for `system_advice`)
- **Body:** Include `system_advice` (optional). Only admins can set it; creators cannot.

```json
{
  "title": "30-Day Meditation",
  "description": "...",
  "visibility": "public",
  "type": "flexible",
  "media_requirement": "none",
  "start_date": "2026-03-01",
  "system_advice": "Start with 5 minutes. Consistency beats duration."
}
```

---

### 4. Admin: Update system advice

**`PATCH /challenges/:id`**

- **Auth:** Bearer token
- **Who can update `system_advice`:** Admins only (creator can update other fields but not `system_advice`)
- **Body:** Include `system_advice` to set or change it

```json
{
  "system_advice": "Updated tips: 1) Morning works best. 2) Same time daily. 3) Use a guided app if needed."
}
```

---

## Client UI Flow

1. **Check:** `challenge.system_advice` is non-null and non-empty.
2. **Button:** Show "Komble wants to share some tricks" (or similar).
3. **On tap:** Open modal/sheet and display `challenge.system_advice`.
4. **If no advice:** Do not show the button.

---

## Example

```ts
// Challenge detail screen
if (challenge.system_advice?.trim()) {
  return (
    <Button onPress={() => setShowTips(true)}>
      Komble wants to share some tricks
    </Button>
  );
}

// Modal content
<Modal visible={showTips}>
  <Text style={styles.title}>Tips from Komble</Text>
  <Text>{challenge.system_advice}</Text>
</Modal>
```
