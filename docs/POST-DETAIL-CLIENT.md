# Post Detail Screen – Client Requirements

## Requirement: Post detail page MUST always have a back button

When the user opens a post (from Feed, User Profile, Notifications, etc.), the Post Detail screen must **always** display a back button in the header so the user can return to the previous screen.

---

## Implementation (React Navigation)

### 1. Add header with back button to Post Detail screen

```tsx
<Stack.Screen
  name="PostDetail"
  component={PostDetailScreen}
  options={({ navigation }) => ({
    title: 'Post',
    headerBackVisible: true,
    headerLeft: () => (
      <HeaderBackButton onPress={() => navigation.goBack()} />
    ),
  })}
/>
```

Or use the default back button:

```tsx
<Stack.Screen
  name="PostDetail"
  component={PostDetailScreen}
  options={{
    title: 'Post',
    headerBackVisible: true,
    // React Navigation shows back button automatically when there's a screen to go back to
  }}
/>
```

### 2. Ensure Post Detail is in a stack (not root)

- Post Detail must be pushed onto a stack (Feed stack, Main stack, etc.).
- Use `navigation.navigate('PostDetail', { postId })` or `navigation.push('PostDetail', { postId })`.
- Do NOT use `navigation.replace()` when opening Post Detail — that removes the previous screen from the stack.

### 3. If opened from a tab or modal

- When opening from a tab (e.g. Feed tab), the stack should be: Feed → Post Detail.
- The back button will then return to Feed.
- If Post Detail is opened as a modal, ensure the modal has a close/back button.

### 4. Single Post Detail screen

- Use ONE Post Detail screen for all entry points (Feed, Profile, Notifications).
- Pass `postId` as a param. Fetch post via `GET /posts/:id`.

---

## Checklist

- [ ] Post Detail screen has a visible back button in the header
- [ ] Back button calls `navigation.goBack()`
- [ ] Post Detail is not the root screen of any navigator
- [ ] All entry points use `navigate` or `push`, not `replace`
- [ ] Only one Post Detail screen exists (no duplicates)
