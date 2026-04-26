# 🚀 TestFlight Setup Guide (100% FREE)

## ✅ What You Need

- Free Apple ID (you have this)
- Expo account (you have this)
- 30 minutes of time

---

## 📱 Step 1: Install TestFlight on iPad

1. Open **App Store** on your iPad
2. Search for **"TestFlight"**
3. Install it (it's free from Apple)
4. Keep it installed - we'll use it later

---

## 🌐 Step 2: Set Up App Store Connect

### **A. Go to App Store Connect**

Visit: https://appstoreconnect.apple.com

Sign in with your Apple ID

### **B. Accept Agreements**

- You'll see "Agreements, Tax, and Banking"
- Click on it
- Accept the **Apple Developer Program License Agreement**
- This is **FREE** - you're NOT signing up for the $99 program
- Just accepting terms to use TestFlight

### **C. Create Your App**

1. Click **"My Apps"**
2. Click the **"+"** button (top left)
3. Select **"New App"**

4. Fill in the form:
   - **Platforms:** Check ✅ iOS
   - **Name:** `TapTap Matrix`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Click the dropdown
     - If you see `com.taptap.matrix` - select it
     - If not, click **"Register a new bundle ID"**
       - **Bundle ID:** `com.taptap.matrix`
       - **Description:** TapTap Matrix App
       - Click **"Continue"**
   - **SKU:** `taptap-matrix-001` (can be anything unique)
   - **User Access:** Full Access

5. Click **"Create"**

---

## 🔧 Step 3: Build for TestFlight

### **A. Make sure you're logged in to EAS**

```bash
eas whoami
```

If not logged in:
```bash
eas login
```

### **B. Initialize EAS project**

```bash
cd mobile
eas project:init
```

Follow the prompts to create a new project.

### **C. Build for production**

```bash
eas build --platform ios --profile production
```

**What happens:**
1. EAS will ask for your **Apple ID** - enter it
2. It will ask for your **Apple ID password** - enter it
3. If you have 2FA, enter the code
4. EAS will create all certificates automatically
5. Build takes **20-30 minutes**

**During the build:**
- You can close the terminal
- Check progress at: https://expo.dev
- You'll get an email when it's done

---

## 📤 Step 4: Submit to TestFlight

### **A. After build completes, submit:**

```bash
eas submit --platform ios
```

**Or submit automatically during build:**
```bash
eas build --platform ios --profile production --auto-submit
```

**What happens:**
1. EAS uploads your app to App Store Connect
2. Apple processes it (takes 5-15 minutes)
3. It appears in TestFlight

### **B. Wait for Processing**

- Go to https://appstoreconnect.apple.com
- Click "My Apps" → "TapTap Matrix"
- Click "TestFlight" tab
- Wait for "Processing" to change to "Ready to Test"
- Usually takes 5-15 minutes

---

## 👥 Step 5: Add Yourself as Tester

### **A. In App Store Connect:**

1. Go to **TestFlight** tab
2. Click **"Internal Testing"** (left sidebar)
3. Click **"+"** to create a new group
4. Name it: `Beta Testers`
5. Click **"Create"**

### **B. Add yourself:**

1. In the group, click **"Testers"** section
2. Click **"+"** button
3. Enter your email address
4. Click **"Add"**

### **C. Enable the build:**

1. Click **"Builds"** section in the group
2. Click **"+"** button
3. Select your build
4. Click **"Add"**

---

## 📱 Step 6: Install on iPad

### **A. Check your email:**

You'll receive an email from Apple with subject:
**"You're invited to test TapTap Matrix"**

### **B. On your iPad:**

1. Open the email
2. Tap **"View in TestFlight"**
3. TestFlight app opens
4. Tap **"Accept"**
5. Tap **"Install"**
6. App installs!

### **C. Or manually in TestFlight:**

1. Open **TestFlight** app on iPad
2. You should see **"TapTap Matrix"**
3. Tap **"Install"**
4. Done! 🎉

---

## 🎉 Success!

Your app is now installed on your iPad via TestFlight!

**To launch:**
- Find the TapTap Matrix app icon
- It will have a small orange dot (TestFlight indicator)
- Tap to open
- Enjoy! 🎵

---

## 🔄 Updating the App

When you make changes:

```bash
# 1. Build new version
eas build --platform ios --profile production --auto-submit

# 2. Wait for processing (5-15 min)

# 3. On iPad, open TestFlight
# 4. Tap "Update" next to TapTap Matrix
```

TestFlight will notify you when updates are available!

---

## 💡 TestFlight Benefits

✅ **100% FREE** - No $99 Apple Developer account needed  
✅ **Up to 10,000 testers** - Share with friends  
✅ **90 days per build** - Plenty of testing time  
✅ **Automatic updates** - Push updates easily  
✅ **Crash reports** - See if anything breaks  
✅ **Official Apple tool** - Trusted and reliable  

---

## ⚠️ Limitations

❌ **Not for App Store** - TestFlight is for testing only  
❌ **90-day expiry** - Each build expires after 90 days  
❌ **Requires rebuild** - Need to rebuild every 90 days  

**For App Store release, you'll need the $99/year Apple Developer Program.**

---

## 🆘 Troubleshooting

### **"Invalid Provisioning Profile"**
```bash
eas credentials
# Select iOS → Remove all credentials
# Then rebuild
```

### **"Build failed"**
- Check your Apple ID credentials
- Make sure 2FA code is correct
- Try again with: `eas build --platform ios --profile production --clear-cache`

### **"App not appearing in TestFlight"**
- Wait 15 minutes for processing
- Check App Store Connect → TestFlight tab
- Make sure build is added to your test group

### **"Can't install on iPad"**
- Make sure TestFlight app is installed
- Check your email for invitation
- Make sure you're using the same Apple ID

---

## 📊 Build Status

Check your builds anytime at:
https://expo.dev/accounts/[your-account]/projects/taptap-matrix/builds

---

## 🎯 Quick Command Reference

```bash
# Build and submit to TestFlight
eas build --platform ios --profile production --auto-submit

# Just build (submit manually later)
eas build --platform ios --profile production

# Submit existing build
eas submit --platform ios

# Check build status
eas build:list

# View credentials
eas credentials
```

---

## 🚀 Ready to Start?

Run this command to begin:

```bash
eas build --platform ios --profile production --auto-submit
```

Then follow the prompts!

**Good luck! You'll have the app on your iPad soon! 🎉**

