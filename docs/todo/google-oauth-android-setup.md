# Google OAuth — Android Setup

Step-by-step guide for setting up Google Sign-In for the Android app.

---

## What You Already Have (Development)

- **Web client ID** — already in `.env` as `GOOGLE_CLIENT_ID`
- **Android client ID** (debug) — created with debug SHA-1 fingerprint `3F:76:5A:3D:35:8B:E2:B4:75:EB:EA:87:7F:BD:16:F3:06:4F:52:4A`
- **Package name**: `com.challengesme.app`

## How Android Auth Works

1. React Native app uses `@react-native-google-signin/google-signin`
2. User taps "Sign in with Google" → native Google dialog opens
3. The Android client ID authorizes Google Play Services to show the dialog
4. Google returns an `idToken` with the **Web client ID** as the audience
5. App sends this `idToken` to `POST /auth/google` on the backend
6. Backend verifies the token against `GOOGLE_CLIENT_ID` (Web client ID)

Important: the Android client ID is never sent to the backend. The backend only needs the Web client ID.

---

## React Native Configuration

Install the library:

```bash
npm install @react-native-google-signin/google-signin
```

Configure in your app:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',  // the Web client ID, NOT the Android client ID
});
```

Sign in and send token to backend:

```typescript
const signIn = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.idToken;

  const response = await fetch('https://your-api.com/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const { accessToken, user } = await response.json();
  // Store accessToken for subsequent API calls
};
```

---

## Before Publishing to Play Store

### 1. Create Release Signing Key

If you don't use Play App Signing:

```bash
keytool -genkey -v -keystore challenges-release.keystore -alias challenges-key -keyalg RSA -keysize 2048 -validity 10000
```

Get the release SHA-1:

```bash
keytool -list -v -keystore challenges-release.keystore -alias challenges-key
```

### 2. If Using Play App Signing (Recommended)

Google manages your release key. To get the SHA-1:

1. Go to Google Play Console
2. Select your app
3. Go to **Setup > App signing**
4. Copy the **SHA-1 certificate fingerprint** under "App signing key certificate"

### 3. Create Production Android Client ID

1. Go to Google Cloud Console > Credentials
2. Create a **new** Android OAuth client ID (don't replace the debug one)
3. Enter the same package name: `com.challengesme.app`
4. Enter the **release** SHA-1 fingerprint
5. Save

You don't need to change anything on the backend — the Android client ID is never verified server-side. The token audience is still the Web client ID.

### 4. Keep Both Android Client IDs

- **Debug client ID** — for local development builds
- **Release client ID** — for Play Store builds

Both use the same Web client ID, so the backend doesn't care which one is used.
