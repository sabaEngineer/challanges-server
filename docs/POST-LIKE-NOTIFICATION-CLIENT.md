# Post Like Notification – Client Implementation Prompt

Copy and paste this prompt when implementing the client:

---

## Task: Handle `post_like` notifications

When someone likes a user's post, the server creates a notification of type `post_like`. The client must display this and navigate correctly when the user taps it.

### Notification shape (from GET /notifications)

```json
{
  "id": "uuid",
  "type": "post_like",
  "actor": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "https://..."
  },
  "subject_type": "post",
  "subject_id": "post-uuid",
  "payload": {},
  "read_at": null,
  "created_at": "2026-02-16T12:00:00.000Z"
}
```

### What to do

1. **Add `post_like` to your notification type handling**  
   Ensure your notification list/badge logic includes `post_like` alongside `teammate_request`, `message`, etc.

2. **Display text for `post_like`**  
   Example: `"{actor.firstName} liked your post"` or `"John liked your post"`.

3. **On tap**  
   - Call `PATCH /notifications/:id/read` to mark as read  
   - Navigate to the post using `subject_id` (the post ID)  
   - Suggested destinations: Feed (scroll to post) or a post detail screen if you have one.

4. **Navigation options**  
   - **Feed:** Open the feed and scroll to/highlight the post with `subject_id`  
   - **Post detail:** If you have a post detail route, navigate to `/post/:subject_id`  
   - **User profile:** Navigate to the post author's profile and show their posts (post may be visible there)

### API reference

- **GET /notifications** – Returns notifications including `post_like` (paginated)
- **GET /notifications/unread-count** – Badge count (includes post_like)
- **PATCH /notifications/:id/read** – Mark as read when user taps
- **subject_type:** `"post"`
- **subject_id:** Post UUID to navigate to

### Example flow

1. User receives notification: "Jane liked your post"
2. User taps notification
3. Client calls `PATCH /notifications/{id}/read`
4. Client navigates to feed or post detail with `subject_id`
5. Post is shown (optionally highlighted)
