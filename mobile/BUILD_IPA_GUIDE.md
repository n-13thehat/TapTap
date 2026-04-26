# 📱 Build IPA for iPad - Complete Guide

## 🎯 What We're Building

A development IPA that you can install directly on your iPad without the App Store.

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:
- [ ] Node.js installed
- [ ] npm or pnpm installed
- [ ] Expo account (free - create at https://expo.dev/signup)
- [ ] Apple ID (free)
- [ ] Your iPad's UDID (we'll get this)

---

## 🚀 Step-by-Step Instructions

### **Step 1: Install EAS CLI**

Open your terminal and run:

```bash
npm install -g eas-cli
```

Wait for installation to complete.

---

### **Step 2: Login to Expo**

```bash
eas login
```

Enter your Expo credentials. If you don't have an account:
1. Go to https://expo.dev/signup
2. Create a free account
3. Come back and run `eas login`

---

### **Step 3: Navigate to Project**

```bash
cd mobile
```

---

### **Step 4: Initialize EAS Project**

```bash
eas init
```

This will:
- Create a project in your Expo account
- Link it to your local project
- Update `app.json` with project ID

---

### **Step 5: Get Your iPad's UDID**

You need your iPad's UDID to register it. Here's how:

#### **Method 1: Using Finder (Mac)**
1. Connect iPad to Mac with cable
2. Open Finder
3. Select your iPad in sidebar
4. Click on device info (where it shows model/capacity)
5. It will cycle through Serial Number → UDID
6. Right-click UDID → Copy

#### **Method 2: Using iTunes (Windows)**
1. Connect iPad to PC with cable
2. Open iTunes
3. Click iPad icon
4. Click "Serial Number" label
5. It will change to UDID
6. Right-click → Copy

#### **Method 3: On iPad (iOS 16+)**
1. Open Settings → General → About
2. Scroll down to find UDID
3. Tap and hold to copy

#### **Method 4: Using Website (Easiest!)**
1. On your iPad, go to: https://get.udid.io
2. Tap "Download Profile"
3. Install the profile
4. Your UDID will be displayed
5. Copy it

**Save your UDID somewhere - you'll need it in the next step!**

---

### **Step 6: Register Your iPad**

```bash
eas device:create
```

When prompted:
1. Enter a name for your device (e.g., "My iPad")
2. Paste your UDID
3. Press Enter

---

### **Step 7: Build the IPA**

Now for the main event! Run:

```bash
eas build --platform ios --profile development
```

**What happens:**
1. EAS will ask you to log in with your Apple ID
2. It will create necessary certificates automatically
3. It will build your app in the cloud
4. This takes **15-20 minutes**

**During the build:**
- You'll see progress in the terminal
- You can also watch at: https://expo.dev/accounts/[your-account]/projects/taptap-matrix/builds

**When it asks for Apple ID:**
- Use your personal Apple ID (free account works!)
- Enter your password
- If you have 2FA, enter the code

---

### **Step 8: Download the IPA**

When the build completes:

1. You'll get a download link in the terminal
2. Or go to: https://expo.dev/accounts/[your-account]/projects/taptap-matrix/builds
3. Click the latest build
4. Click "Download" button

**Save the IPA file to your computer.**

---

### **Step 9: Install on iPad**

#### **Method 1: Direct Install (Easiest)**

1. **On your iPad**, open Safari
2. Go to the build URL from EAS (check your email or Expo dashboard)
3. Tap "Install"
4. Go to Settings → General → VPN & Device Management
5. Trust the developer certificate
6. App is installed!

#### **Method 2: Using Apple Configurator (Mac)**

1. Download Apple Configurator 2 from Mac App Store
2. Connect iPad to Mac
3. Open Apple Configurator 2
4. Select your iPad
5. Click "Add" → "Apps"
6. Select the IPA file
7. App installs!

#### **Method 3: Using Xcode (Mac)**

1. Connect iPad to Mac
2. Open Xcode
3. Go to Window → Devices and Simulators
4. Select your iPad
5. Click the "+" under "Installed Apps"
6. Select the IPA file
7. App installs!

---

## 🎉 Success!

Your TapTap app should now be installed on your iPad!

**To launch:**
1. Find the TapTap Matrix app icon
2. Tap to open
3. Enjoy! 🎵

---

## 🔄 Updating the App

When you make changes and want to update:

```bash
cd mobile
eas build --platform ios --profile development
```

Then install the new IPA the same way.

---

## ⚠️ Troubleshooting

### **"Unable to install app"**
- Make sure you trusted the developer certificate
- Go to Settings → General → VPN & Device Management
- Tap your Apple ID → Trust

### **"App crashes on launch"**
- Make sure your iPad is registered (Step 6)
- Rebuild with: `eas build --platform ios --profile development --clear-cache`

### **"Build failed"**
- Check your Apple ID credentials
- Make sure you have a stable internet connection
- Try again: `eas build --platform ios --profile development`

### **"Certificate issues"**
- Run: `eas credentials`
- Select "iOS" → "Remove all credentials"
- Rebuild - EAS will create new ones

---

## 📊 Build Status

You can always check your builds at:
https://expo.dev/accounts/[your-account]/projects/taptap-matrix/builds

---

## 💡 Tips

**Faster Testing:**
- Use Expo Go for quick iterations
- Use development build for testing full features
- Use production build for App Store submission

**Development Build Features:**
- Hot reload
- Debug menu (shake device)
- Fast refresh
- All native features work

**Certificate Validity:**
- Development certificates last 1 year
- You'll need to rebuild after they expire
- EAS handles renewal automatically

---

## 🚀 Next Steps

Once you have the app installed:

1. **Test all features** on your iPad
2. **Report any bugs** you find
3. **Make improvements** as needed
4. **Rebuild and reinstall** to test changes

---

## 📞 Need Help?

If you get stuck:
1. Check the Expo docs: https://docs.expo.dev/build/introduction/
2. Check build logs in Expo dashboard
3. Ask me for help!

---

## 🎯 Quick Reference

**Build development IPA:**
```bash
eas build --platform ios --profile development
```

**Check build status:**
```bash
eas build:list
```

**View credentials:**
```bash
eas credentials
```

**Register new device:**
```bash
eas device:create
```

---

**Good luck! You're about to have TapTap running on your iPad! 🎉**

