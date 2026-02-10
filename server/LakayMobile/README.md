# Lakay Social Mobile App

A React Native mobile application for the Lakay Social platform with enhanced security features.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **iOS Setup (macOS only):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup:**
   - Ensure Android SDK is installed
   - Create `android/local.properties` with:
     ```
     sdk.dir=/path/to/Android/sdk
     ```

### Security Configuration

The app uses several security libraries:

- **react-native-keychain**: Secure token storage
- **react-native-ssl-pinning**: Certificate pinning
- **react-native-biometrics**: Biometric authentication

#### iOS Configuration

Add to `ios/LakayMobile/Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for secure authentication</string>
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSPinnedDomains</key>
  <dict>
    <key>your-api-domain.com</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSPinnedCAIdentities</key>
      <array>
        <dict>
          <key>SPKI-SHA256-BASE64</key>
          <string>your-certificate-hash</string>
        </dict>
      </array>
    </dict>
  </dict>
</dict>
```

#### Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

Create network security config in `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config>
    <domain includeSubdomains="true">your-api-domain.com</domain>
    <pin-set>
      <pin digest="SHA-256">your-certificate-hash</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

And reference it in `AndroidManifest.xml`:
```xml
<application
  android:networkSecurityConfig="@xml/network_security_config">
```

### Running the App

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

### Building for Production

#### Android
```bash
cd android
./gradlew assembleRelease
```

#### iOS
```bash
cd ios
xcodebuild -workspace LakayMobile.xcworkspace -scheme LakayMobile -configuration Release -archivePath build/LakayMobile.xcarchive archive
```

## 🔒 Security Features

### Secure Storage
- JWT tokens stored securely using Keychain (iOS) / Keystore (Android)
- Automatic token refresh
- Secure logout with token cleanup

### Network Security
- HTTPS enforcement
- Certificate pinning to prevent MITM attacks
- Request/response interceptors for auth handling

### Authentication
- MFA support (TOTP)
- Biometric authentication ready
- Secure credential management

## 📱 App Structure

```
src/
├── navigation/          # Navigation setup
├── screens/            # Screen components
│   ├── auth/          # Login/Register
│   └── main/          # Main app screens
├── services/          # API and security services
├── components/        # Reusable components
└── utils/            # Utility functions
```

## 🔧 Development

### Code Obfuscation
For production builds, add obfuscation:

```bash
npm install --save-dev react-native-obfuscator
```

Configure in `package.json`:
```json
"scripts": {
  "postinstall": "react-native-obfuscator"
}
```

### Environment Variables
Create `.env` files for different environments:
- `.env.development`
- `.env.staging`
- `.env.production`

## 🚀 Deployment

### App Store Connect (iOS)
1. Archive the app in Xcode
2. Upload to App Store Connect
3. Configure certificates and provisioning profiles

### Google Play Console (Android)
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Configure app signing and security settings

## 📋 Checklist

- [ ] iOS certificates configured
- [ ] Android signing keys set up
- [ ] Certificate pinning implemented
- [ ] Biometric permissions added
- [ ] Code obfuscation configured
- [ ] Environment variables set
- [ ] Production API endpoints configured
- [ ] App icons and splash screens added
- [ ] Push notifications configured
- [ ] Crash reporting set up

## 🆘 Troubleshooting

### Common Issues

1. **Keychain access issues**: Ensure proper entitlements in iOS
2. **Certificate pinning failures**: Verify certificate hashes
3. **Biometric not working**: Check device capabilities and permissions

### Debug Mode
Enable debug logging:
```javascript
console.log('Debug mode enabled');
```

## 📞 Support

For issues related to the mobile app setup or security configuration, check the main Lakay Social repository.

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
