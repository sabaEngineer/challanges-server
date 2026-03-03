# Authentication

## Overview

Users authenticate via Google Sign-In from the React Native app (Android/iOS). The backend verifies the Google token, finds or creates the user, and returns a JWT for all subsequent API calls.

---

## Auth Flow

```
React Native App                    NestJS Backend                   Google Servers
      |                                   |                                |
      |-- 1. Google Sign-In (native) ---->|                                |
      |                                   |                                |
      |<-- Google idToken ----------------|                                |
      |                                   |                                |
      |-- 2. POST /auth/google ---------->|                                |
      |      { idToken }                  |                                |
      |                                   |-- 3. verifyIdToken() --------->|
      |                                   |<-- user payload (email, name) -|
      |                                   |                                |
      |                                   |-- 4. Find or create user in DB |
      |                                   |-- 5. Sign JWT                  |
      |                                   |                                |
      |<-- 6. { accessToken, user } ------|                                |
      |                                   |                                |
      |-- 7. Any API call --------------->|                                |
      |      Authorization: Bearer <jwt>  |                                |
      |                                   |-- 8. Verify JWT, load user     |
      |<-- Response ----------------------|                                |
```

### Step-by-step

1. User taps "Sign in with Google" in the React Native app. The native Google Sign-In dialog opens.
2. After the user picks an account, the app receives a Google `idToken` and sends it to `POST /auth/google`.
3. Backend uses `google-auth-library` to verify the token with Google's servers. It checks:
   - Token signature is valid (not tampered with)
   - Token is not expired
   - Token audience matches our `GOOGLE_CLIENT_ID` (Web) or `GOOცჰGLE_CLIENT_ID_IOS`
4. Backend extracts user info (`googleId`, `email`, `firstName`, `lastName`, `picture`) and either finds an existing user or creates a new one.
5. Backend generates a JWT containing `{ sub: userId, email: userEmail }`, signed with `JWT_SECRET`, expiring after `JWT_EXPIRATION` (default 7 days).
6. Backend returns the JWT and user profile to the app.
7. For all subsequent API calls, the app sends the JWT in the `Authorization: Bearer <token>` header.
8. The `JwtStrategy` verifies the token, loads the user from the database, and attaches it to the request.

---

## API Endpoints

### POST /auth/google

Authenticate with a Google ID token. No authorization required.

**Request:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error (401):** Invalid or expired Google token.

### GET /auth/me

Get the current authenticated user's profile. Requires JWT.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Error (401):** Missing, invalid, or expired JWT.

---

## File Structure

```
src/auth/
├── auth.module.ts                  -- Module wiring (Passport, JWT, UsersModule)
├── auth.controller.ts              -- POST /auth/google, GET /auth/me
├── auth.service.ts                 -- Google token verification, JWT generation, user lookup
├── strategies/
│   └── jwt.strategy.ts             -- Passport JWT strategy (extracts Bearer token, loads user)
├── guards/
│   └── jwt-auth.guard.ts           -- @UseGuards(JwtAuthGuard) for protected routes
├── decorators/
│   └── current-user.decorator.ts   -- @CurrentUser() param decorator to get logged-in user
└── dto/
    ├── google-auth.dto.ts          -- Request DTO with validation for POST /auth/google
    └── auth-response.dto.ts        -- Response shape with Swagger decorators
```

---

## Protecting Routes

To protect any endpoint, add the guard and use the decorator:

```typescript
@Get('some-protected-route')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async someMethod(@CurrentUser() user: User) {
  // user is the full User entity from the database
  return { userId: user.id };
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Web OAuth client ID (verifies Android tokens) |
| `GOOGLE_CLIENT_ID_IOS` | iOS OAuth client ID (verifies iOS tokens) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRATION` | Token lifetime (e.g. `7d`, `24h`, `3600s`) |

---

## User Find-or-Create Logic

When a Google token is verified, the backend:

1. Looks for a user with matching `googleId` -- if found, updates profile info and returns
2. Looks for a user with matching `email` -- if found, links the Google account and returns
3. If neither exists, creates a new user

This handles:
- **Returning users** -- matched by Google ID, profile updated each login
- **Email-first accounts** -- if a user was created by another method (future: Apple Sign-In), their Google account gets linked automatically
- **New users** -- created on first sign-in
