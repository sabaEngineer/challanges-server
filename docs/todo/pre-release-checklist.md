# Pre-Release Checklist

Everything that needs to be done before publishing the app to production.

---

## 1. Environment & Secrets

- [ ] Generate a strong `JWT_SECRET` for production (use `openssl rand -base64 64`)
- [ ] Set `JWT_EXPIRATION` to a production-appropriate value (e.g. `7d` or shorter)
- [ ] Set all environment variables on Render.com (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_IOS, JWT_SECRET, JWT_EXPIRATION)
- [ ] Ensure `.env` is in `.gitignore` (it already is)

## 2. Database

- [ ] Create production PostgreSQL database on Render.com
- [ ] Run all migrations against production DB (`npm run migration:run`)
- [ ] Verify all tables and indexes are created correctly
- [ ] Set up automatic database backups on Render.com

## 3. Google OAuth — Production Setup

You do NOT need to create new Web or iOS client IDs. The same ones from development work in production. You only need a new Android client ID with the release SHA-1.

### 3a. Consent Screen — Publish It

1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
2. Move app status from **Testing** to **Published**
   - While in "Testing" mode, only emails you manually add can sign in (max 100 users)
   - Publishing removes this limit and allows anyone to sign in
3. Fill in all required fields before publishing:
   - [ ] App logo (upload a square PNG)
   - [ ] App homepage URL
   - [ ] Privacy policy URL (required by both Google and app stores)
   - [ ] Terms of service URL
4. If you request sensitive scopes, Google may require a verification review (can take days/weeks). Our scopes (`email`, `profile`, `openid`) are NOT sensitive, so no review needed.

### 3b. Android — Create Release Client ID

The debug Android client ID only works with your debug signing key. Production builds use a different key, so you need a second Android client ID.

**If using Play App Signing (recommended):**

1. Go to Google Play Console > your app > Setup > App signing
2. Copy the **SHA-1 certificate fingerprint** under "App signing key certificate"

**If using your own release keystore:**

```bash
keytool -list -v -keystore your-release.keystore -alias your-alias
```

Copy the SHA-1 from the output.

**Then create the client ID:**

1. Go to Google Cloud Console > Credentials
2. Click Create Credentials > OAuth client ID
3. Type: **Android**
4. Name: "Challenges.me Android Release"
5. Package name: `com.challengesme.app` (same as debug)
6. SHA-1: paste the **release** SHA-1 from above
7. Create

No backend changes needed — the release Android client ID works the same way as debug. The token audience is still the Web client ID.

### 3c. iOS — Update Existing Client ID

The iOS client ID works for both development and production. Before App Store submission:

1. Go to Google Cloud Console > Credentials
2. Edit your existing iOS OAuth client ID
3. Add your **Team ID** (found at developer.apple.com > Membership)
4. Add your **App Store ID** (found in App Store Connect after creating your app listing)

### 3d. Web Client ID — No Changes

The Web client ID is the same for dev and production. Just make sure it's set as `GOOGLE_CLIENT_ID` in your Render.com environment variables.

### 3e. Summary — What Goes Where in Production

| Variable | Value | Same as dev? |
|----------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Web client ID | Yes, same one |
| `GOOGLE_CLIENT_ID_IOS` | iOS client ID | Yes, same one |

No new env variables needed. Only new thing is the release Android client ID in Google Console (backend never sees it).

## 4. Apple Sign-In (Required for App Store)

Apple's App Store Review Guidelines (4.8) require that if you offer any third-party sign-in (Google), you must also offer **Sign in with Apple**. This needs to be implemented before submitting to the App Store.

- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Enable "Sign in with Apple" capability in Xcode
- [ ] Implement Apple Sign-In on the React Native client (`@invertase/react-native-apple-authentication`)
- [ ] Add `POST /auth/apple` endpoint on the backend (verify Apple identity token, find/create user, return JWT)
- [ ] Add `APPLE_CLIENT_ID` (bundle ID) to `.env`

## 5. NestJS Server

- [ ] Set up CORS properly (allow only your app's domains/origins)
- [ ] Disable Swagger in production or protect it behind authentication
- [ ] Add rate limiting to auth endpoints
- [ ] Set up logging (structured JSON logs for Render.com)
- [ ] Set up health check endpoint for Render.com monitoring

## 6. Render.com Deployment

- [ ] Connect GitHub repo to Render.com
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm run start:prod`
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Enable auto-deploy on push to main branch
