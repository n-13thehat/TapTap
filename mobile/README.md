# 📱 TapTap Matrix Mobile App

React Native mobile app for TapTap Matrix with AI agent chat, music player, and push notifications.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio and JDK 17
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Scan QR Code
1. Install **Expo Go** app on your phone
2. Run `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

---

## 📁 Project Structure

```
mobile/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   │   ├── home.tsx       # Home screen
│   │   ├── music.tsx      # Music player
│   │   ├── agents.tsx     # Agent list
│   │   ├── chat.tsx       # Chat screen
│   │   └── profile.tsx    # User profile
│   ├── agents/
│   │   └── chat.tsx       # Agent chat screen
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Splash screen
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
│   ├── useAgents.ts      # Load all agents
│   ├── useAgent.ts       # Load single agent
│   ├── useChat.ts        # Chat functionality
│   └── useAuth.ts        # Authentication
├── providers/            # Context providers
│   ├── AuthProvider.tsx  # Auth state
│   ├── AgentProvider.tsx # Agent state
│   └── AudioProvider.tsx # Audio playback
├── services/             # API and services
│   ├── api.ts           # API client
│   ├── notifications.ts # Push notifications
│   └── audio.ts         # Audio player
├── types/               # TypeScript types
│   └── index.ts
├── assets/              # Images, fonts, etc.
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

---

## 🎨 Features

### ✅ Implemented
- [x] Agent list with all 18 AI agents
- [x] Agent chat interface
- [x] Real-time messaging
- [x] Offline message storage
- [x] Beautiful UI with animations
- [x] Dark theme
- [x] Haptic feedback
- [x] Keyboard handling

### 🔄 In Progress
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Music player
- [ ] Offline mode
- [ ] Voice chat

---

## 🔧 Configuration

### API URL

Update the API base URL in `services/api.ts`:

```typescript
const API_BASE_URL = 'https://your-api-url.com';
```

Or set it in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-url.com"
    }
  }
}
```

### Environment Variables

Create `.env` file:

```env
API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## 📱 Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

---

## 🔔 Push Notifications

### Setup

1. **Get Expo Push Token:**
```typescript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync();
```

2. **Send from Backend:**
```typescript
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: token,
    title: 'Message from Muse',
    body: 'Tell me what inspires you.',
    data: { agentId: 'muse' },
  }),
});
```

---

## 🎵 Audio Player

### Background Audio

iOS requires background modes in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio"]
    }
  }
}
```

### Usage

```typescript
import { Audio } from 'expo-av';

const sound = new Audio.Sound();
await sound.loadAsync({ uri: trackUrl });
await sound.playAsync();
```

---

## 🔐 Authentication

### Biometric Auth

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to access TapTap',
  fallbackLabel: 'Use passcode',
});

if (result.success) {
  // User authenticated
}
```

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### E2E Testing

```bash
# Install Detox
npm install -g detox-cli

# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

---

## 📊 Performance

### Optimization Tips

1. **Use FlashList** instead of FlatList for large lists
2. **Lazy load images** with `expo-image`
3. **Cache API responses** with AsyncStorage
4. **Use React.memo** for expensive components
5. **Enable Hermes** for Android (already enabled)

### Bundle Size

```bash
# Analyze bundle
npx expo-doctor

# Check dependencies
npx depcheck
```

---

## 🐛 Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
npx expo start -c

# Reset everything
rm -rf node_modules
npm install
npx expo start -c
```

### iOS Build Errors

```bash
cd ios
pod install
cd ..
```

### Android Build Errors

```bash
cd android
./gradlew clean
cd ..
```

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/)
- [React Navigation](https://reactnavigation.org/)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

---

## 📄 License

Copyright © 2026 TapTap Matrix

---

## 🎯 Roadmap

### Phase 1: Core Features (Current)
- [x] Agent chat
- [x] Basic UI
- [ ] Push notifications
- [ ] Authentication

### Phase 2: Music Features
- [ ] Music player
- [ ] Playlists
- [ ] Offline playback
- [ ] Background audio

### Phase 3: Social Features
- [ ] User profiles
- [ ] Social feed
- [ ] Comments
- [ ] Sharing

### Phase 4: Advanced Features
- [ ] Voice chat with agents
- [ ] AR features
- [ ] Live streaming
- [ ] NFT integration

---

**Built with ❤️ by the TapTap Team**

