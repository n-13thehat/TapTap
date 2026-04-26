# 🚀 Quick Build Commands

## 📱 Build IPA for iPad - Quick Start

### **1. Install EAS CLI**
```bash
npm install -g eas-cli
```

### **2. Login**
```bash
eas login
```

### **3. Go to project**
```bash
cd mobile
```

### **4. Initialize**
```bash
eas init
```

### **5. Register iPad**
```bash
eas device:create
```
- Get UDID from: https://get.udid.io
- Or Settings → General → About → UDID

### **6. Build**
```bash
eas build --platform ios --profile development
```
⏱️ Takes 15-20 minutes

### **7. Install**
- Open build URL on iPad
- Tap "Install"
- Trust certificate in Settings

---

## 🔧 Useful Commands

### **Check build status**
```bash
eas build:list
```

### **View build details**
```bash
eas build:view [build-id]
```

### **Cancel build**
```bash
eas build:cancel
```

### **Clear cache and rebuild**
```bash
eas build --platform ios --profile development --clear-cache
```

### **View credentials**
```bash
eas credentials
```

### **List registered devices**
```bash
eas device:list
```

### **Remove device**
```bash
eas device:delete
```

---

## 📊 Build Profiles

### **Development** (for testing)
```bash
eas build --platform ios --profile development
```
- Includes dev tools
- Hot reload
- Debug menu
- Larger file size

### **Preview** (for internal testing)
```bash
eas build --platform ios --profile preview
```
- Production-like
- No dev tools
- Smaller size

### **Production** (for App Store)
```bash
eas build --platform ios --profile production
```
- Optimized
- App Store ready
- Requires paid Apple Developer account

---

## 🎯 One-Line Build

If everything is set up:
```bash
cd mobile && eas build --platform ios --profile development
```

---

## 📱 Get iPad UDID

### **Easiest way:**
On iPad, go to: **https://get.udid.io**

### **Or on iPad:**
Settings → General → About → UDID (tap to copy)

### **Or with Mac:**
Connect iPad → Finder → Click device info → Copy UDID

---

## ⚠️ Troubleshooting

### **Build failed?**
```bash
eas build --platform ios --profile development --clear-cache
```

### **Certificate issues?**
```bash
eas credentials
# Select iOS → Remove all credentials
# Then rebuild
```

### **Can't install?**
Settings → General → VPN & Device Management → Trust certificate

---

## 🔄 Update App

1. Make changes to code
2. Run build command again:
```bash
eas build --platform ios --profile development
```
3. Install new IPA on iPad

---

## 📞 Check Build Status Online

https://expo.dev

Login → Projects → taptap-matrix → Builds

---

## 💡 Pro Tips

**Faster builds:**
- Use `--profile preview` for faster builds without dev tools

**Auto-submit:**
- Add `--auto-submit` to automatically submit to TestFlight

**Local builds:**
- Use `--local` to build on your Mac (requires Xcode)

**Non-interactive:**
- Add `--non-interactive` for CI/CD

---

## 🎉 That's It!

**Main command you need:**
```bash
eas build --platform ios --profile development
```

**Then install on iPad and enjoy!** 🚀

