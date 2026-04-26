#!/bin/bash

# TapTap Mobile App - Quick Setup Script

echo "🚀 TapTap Mobile App Setup"
echo "=========================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm -v) found"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for Expo CLI
echo "📦 Checking Expo CLI..."
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI not found. Installing globally..."
    npm install -g expo-cli
fi
echo "✅ Expo CLI ready"
echo ""

# iOS setup (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - Setting up iOS..."
    
    if command -v pod &> /dev/null; then
        echo "📦 Installing iOS dependencies..."
        cd ios
        pod install
        cd ..
        echo "✅ iOS dependencies installed"
    else
        echo "⚠️  CocoaPods not found. Install with: sudo gem install cocoapods"
    fi
    echo ""
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# TapTap Mobile App Environment Variables

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000

# App Configuration
EXPO_PUBLIC_APP_NAME=TapTap Matrix
EXPO_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "✅ .env file created"
    echo ""
fi

# Success message
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the development server:"
echo "     npm start"
echo ""
echo "  2. Run on iOS simulator (macOS only):"
echo "     npm run ios"
echo ""
echo "  3. Run on Android emulator:"
echo "     npm run android"
echo ""
echo "  4. Or scan the QR code with Expo Go app on your phone"
echo ""
echo "📚 For more information, see SETUP_GUIDE.md"
echo ""

