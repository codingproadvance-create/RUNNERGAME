#!/bin/bash
set -e

echo "=== BUILDING RUNNER RUSH ANDROID APK ==="

# 1. Build Vite web assets
echo "1. Building web application..."
npm install
npm run build

# 2. Setup Capacitor
echo "2. Setting up Capacitor Android platform..."
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

if [ ! -d "android" ]; then
  npx cap add android
fi

npx cap sync android

# 3. Compile APK using Gradle
echo "3. Compiling Android APK with Gradle..."
cd android
chmod +x ./gradlew
./gradlew assembleDebug

echo "=== BUILD SUCCESSFUL ==="
echo "Your APK file is located at:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
