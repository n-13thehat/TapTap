# 🚀 TapTap Mobile App - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Connecting to Backend](#connecting-to-backend)
5. [Testing](#testing)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software

#### macOS (for iOS development)
- **Xcode 14+** - Download from Mac App Store
- **CocoaPods** - `sudo gem install cocoapods`
- **Watchman** - `brew install watchman`

#### Windows/Linux (for Android development)
- **Android Studio** - Download from [android.com](https://developer.android.com/studio)
- **JDK 17** - `choco install openjdk17` (Windows) or `sudo apt install openjdk-17-jdk` (Linux)

#### All Platforms
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm or pnpm** - Comes with Node.js
- **Expo CLI** - `npm install -g expo-cli`
- **EAS CLI** (for builds) - `npm install -g eas-cli`

### Verify Installation

```bash
node --version  # Should be 18+
npm --version
expo --version
```

---

## 2. Installation

### Step 1: Navigate to Mobile Directory

```bash
cd mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- React Native 0.74
- Expo SDK 51
- Navigation libraries
- UI components
- And all other dependencies

### Step 3: Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

---

## 3. Running the App

### Option A: Expo Go (Easiest)

1. **Install Expo Go on your phone:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Scan the QR code:**
   - iOS: Use Camera app
   - Android: Use Expo Go app

### Option B: iOS Simulator (macOS only)

```bash
npm run ios
```

This will:
- Start Metro bundler
- Build the app
- Launch iOS Simulator
- Install and run the app

### Option C: Android Emulator

1. **Start Android Emulator** from Android Studio

2. **Run the app:**
   ```bash
   npm run android
   ```

### Option D: Web Browser

```bash
npm run web
```

Opens at `http://localhost:19006`

---

## 4. Connecting to Backend

### Local Development

If your backend is running on `localhost:3000`:

#### iOS Simulator
```typescript
// services/api.ts
const API_BASE_URL = 'http://localhost:3000';
```

#### Android Emulator
```typescript
// services/api.ts
const API_BASE_URL = 'http://10.0.2.2:3000';  // Android emulator localhost
```

#### Physical Device (same WiFi)
```typescript
// services/api.ts
const API_BASE_URL = 'http://192.168.1.100:3000';  // Your computer's IP
```

**Find your IP:**
- macOS: `ifconfig | grep "inet "`
- Windows: `ipconfig`
- Linux: `ip addr show`

### Production Backend

```typescript
// services/api.ts
const API_BASE_URL = 'https://api.taptap.com';
```

Or use environment variables:

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.taptap.com
```

```typescript
// services/api.ts
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
```

---

## 5. Testing

### Test on Physical Device

1. **Enable Developer Mode:**
   - iOS: Settings → Privacy & Security → Developer Mode
   - Android: Settings → About Phone → Tap "Build Number" 7 times

2. **Connect via USB**

3. **Run:**
   ```bash
   npm run ios    # iOS
   npm run android  # Android
   ```

### Test Agent Chat

1. Open the app
2. Navigate to "Agents" tab
3. Select any agent (e.g., Muse)
4. Type a message: "Hello!"
5. Agent should respond with personality-based message

### Test Notifications (requires setup)

```bash
# Send test notification
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Test from Muse",
    "body": "Tell me what inspires you."
  }'
```

---

## 6. Building for Production

### Setup EAS (Expo Application Services)

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

This creates `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Build for iOS

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

**Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect access
- Provisioning profiles

### Build for Android

```bash
# Development build
eas build --profile development --platform android

# Production build (AAB for Play Store)
eas build --profile production --platform android

# APK for direct distribution
eas build --profile production --platform android --output apk
```

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Keystore (EAS creates automatically)

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## 7. Troubleshooting

### Common Issues

#### "Metro bundler not starting"

```bash
# Clear cache
npx expo start -c

# Reset everything
rm -rf node_modules
npm install
npx expo start -c
```

#### "Cannot connect to backend"

1. Check backend is running: `curl http://localhost:3000/api/agents`
2. Check API_BASE_URL in `services/api.ts`
3. For physical device, use computer's IP address
4. Disable firewall temporarily

#### "iOS build fails"

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

#### "Android build fails"

```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### "Expo Go shows error"

- Make sure you're on the same WiFi network
- Check firewall settings
- Try restarting Expo Go app
- Clear Expo Go cache in app settings

#### "Push notifications not working"

1. Check permissions are granted
2. Verify Expo push token is valid
3. Test with Expo's push notification tool
4. Check notification handler is configured

### Getting Help

- **Expo Discord**: https://chat.expo.dev/
- **Stack Overflow**: Tag with `expo` and `react-native`
- **GitHub Issues**: Create issue in repo

---

## 🎯 Next Steps

After setup:

1. ✅ **Test all 18 agents** - Chat with each one
2. ✅ **Customize theme** - Update colors in components
3. ✅ **Add features** - Music player, notifications, etc.
4. ✅ **Test on devices** - iOS and Android
5. ✅ **Build and deploy** - Submit to app stores

---

## 📱 App Store Submission Checklist

### iOS App Store

- [ ] Apple Developer Account
- [ ] App Store Connect app created
- [ ] App icons (all sizes)
- [ ] Screenshots (all device sizes)
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] Age rating
- [ ] Build uploaded via EAS
- [ ] TestFlight testing complete

### Google Play Store

- [ ] Google Play Developer Account
- [ ] App listing created
- [ ] App icons and feature graphic
- [ ] Screenshots (phone and tablet)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Content rating
- [ ] AAB uploaded via EAS
- [ ] Internal testing complete

---

## 🔐 Security Checklist

- [ ] API keys in environment variables
- [ ] HTTPS for all API calls
- [ ] Token storage in SecureStore
- [ ] Input validation
- [ ] Rate limiting on backend
- [ ] Biometric authentication enabled
- [ ] Certificate pinning (optional)

---

## 📊 Performance Checklist

- [ ] Images optimized
- [ ] FlashList for long lists
- [ ] API responses cached
- [ ] Lazy loading implemented
- [ ] Bundle size < 50MB
- [ ] App launches in < 3 seconds
- [ ] Smooth 60fps animations

---

**Ready to launch! 🚀**

For questions or issues, check the main README or create an issue on GitHub.

