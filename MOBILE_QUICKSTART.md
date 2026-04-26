# 📱 TapTap Mobile App - Quick Start

## 🚀 Get Started in 3 Minutes

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Development Server

```bash
npm start
```

### 3. Run on Your Phone

**Install Expo Go:**
- iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Scan QR Code:**
- iOS: Use Camera app
- Android: Use Expo Go app

---

## 🎯 What You Get

✅ **18 AI Agents** - Chat with all agents  
✅ **Beautiful UI** - Dark theme with animations  
✅ **Offline Support** - Messages saved locally  
✅ **Cross-Platform** - iOS, Android, Web  

---

## 📱 Alternative: Run on Simulator

### iOS (Mac only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web Browser
```bash
npm run web
```

---

## 🔧 Configuration

### Connect to Backend

Edit `mobile/services/api.ts`:

```typescript
// For iOS Simulator
const API_BASE_URL = 'http://localhost:3000';

// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:3000';

// For Physical Device (use your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:3000';
```

**Find your IP:**
- Mac: `ifconfig | grep "inet "`
- Windows: `ipconfig`

---

## 🎨 Features

### Agent List
- Browse all 18 AI agents
- See agent emoji, name, role
- Tap to start chatting

### Agent Chat
- Real-time messaging
- Personality-based responses
- Message history saved
- Typing indicators
- Smooth animations

---

## 📚 Full Documentation

- **Complete Guide:** `mobile/SETUP_GUIDE.md`
- **README:** `mobile/README.md`
- **Summary:** `MOBILE_APP_SUMMARY.md`

---

## 🐛 Troubleshooting

### Can't connect to backend?

1. Make sure backend is running: `docker-compose up -d`
2. Check API URL in `services/api.ts`
3. For physical device, use your computer's IP address

### Metro bundler not starting?

```bash
npx expo start -c
```

### Need to reset everything?

```bash
rm -rf node_modules
npm install
npx expo start -c
```

---

## 🚀 Next Steps

1. ✅ **Test the app** - Chat with all 18 agents
2. ✅ **Customize** - Update colors and branding
3. ✅ **Add features** - Push notifications, music player
4. ✅ **Deploy** - Submit to app stores

---

## 📞 Need Help?

- Check `mobile/SETUP_GUIDE.md` for detailed instructions
- See `mobile/README.md` for full documentation
- Create an issue on GitHub

---

**Ready to go! 🎉**

Open the app and start chatting with agents!

