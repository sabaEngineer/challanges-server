# Google OAuth — iOS Setup

Step-by-step guide for setting up Google Sign-In for the iOS app.

---

## What You Already Have (Development)

- **iOS client ID** — already in `.env` as `GOOGLE_CLIENT_ID_IOS`
- **Bundle ID**: `com.challengesme.app`

## How iOS Auth Works

1. React Native app uses `@react-native-google-signin/google-signin`
2. User taps "Sign in with Google" → native Google dialog opens
3. Google returns an `idToken` with the **iOS client ID** as the audience
4. App sends this `idToken` to `POST /auth/google` on the backend
5. Backend verifies the token against `GOOGLE_CLIENT_ID_IOS`

Unlike Android, iOS uses its own client ID as the audience (not the Web client ID).

---

## React Native Configuration

Install the library (same as Android — one library handles both):

```bash
npm install @react-native-google-signin/google-signin
```

Configure in your app:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',      // Web client ID (for Android)
  iosClientId: 'YOUR_IOS_CLIENT_ID',      // iOS client ID
});
```

### iOS-Specific Setup

#### 1. Add URL Scheme to Xcode

The iOS client ID has a **reversed client ID** (e.g. `com.googleusercontent.apps.123456789-abcdef`). You need to add it as a URL scheme:

1. Open your React Native project in Xcode
2. Select your app target > **Info** tab
3. Expand **URL Types**
4. Click **+** and add the reversed client ID as the URL scheme

You can find the reversed client ID in the JSON file you download when creating the iOS client ID in Google Console.

#### 2. Add to Info.plist

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### 3. Update AppDelegate

For React Native 0.71+, add to `AppDelegate.mm`:

```objc
#import <RNGoogleSignin/RNGoogleSignin.h>

// Inside the @implementation block:
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RNGoogleSignin application:application openURL:url options:options];
}
```

---

## Before Publishing to App Store

### 1. Apple Developer Account

- [ ] Enroll in the Apple Developer Program ($99/year) at https://developer.apple.com
- [ ] Note your **Team ID** (found under Membership) — you'll need this for the iOS client ID in Google Console

### 2. Update Google Console iOS Client ID

1. Go to Google Cloud Console > Credentials
2. Edit your iOS OAuth client ID
3. Add your **Team ID**
4. Add your **App Store ID** (available after you create the app listing in App Store Connect)

### 3. Bundle ID Must Match

The bundle ID in Google Console (`com.challengesme.app`) must exactly match:
- Your Xcode project's bundle identifier
- Your App Store Connect app listing

### 4. Backend — No Changes Needed

The iOS client ID stays the same for development and production. Unlike Android (which needs separate debug/release client IDs), iOS uses one client ID for everything.

### 5. App Store Review Notes

Apple may ask how you use Google Sign-In during review. Be prepared to:
- Provide a test Google account they can use
- Explain that you also offer Apple Sign-In if required (Apple requires it if you offer any third-party sign-in)

### Important: Apple Sign-In Requirement

If your app offers Google Sign-In, **Apple requires you to also offer Sign in with Apple**. This is an App Store Review guideline (4.8). Plan to add Apple Sign-In before submitting to the App Store.
