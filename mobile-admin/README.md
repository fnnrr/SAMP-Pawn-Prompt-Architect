# SAMP Architect Mobile Admin App (Android)

React Native mobile admin dashboard for managing purchases and premium codes.

## Features

- **Admin Authentication** - Secure login with admin key
- **Dashboard** - Real-time stats (total purchases, pending, approved, rejected)
- **Purchase Management** - View, approve, and reject purchases
- **Premium Key Generation** - Generate new premium codes on demand
- **Secure Storage** - Admin keys stored securely using Expo SecureStore
- **Android Native** - Optimized for Android devices

## Quick Start

### Prerequisites

- Node.js 16+
- npm
- Android Studio (for building APK) or Android device with Expo Go
- Android SDK installed

### Installation

```bash
cd mobile-admin
npm install --legacy-peer-deps
```

### Running on Android Device

**Option 1: Using Expo Go (Easiest)**
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) on your Android device
2. Run:
   ```bash
   npm start
   ```
3. Scan the QR code with your phone's camera or Expo Go app

**Option 2: Using Android Emulator**
1. Open Android Studio
2. Create/start an Android emulator
3. Run:
   ```bash
   npm start
   ```
4. Press `a` in the terminal to open in emulator

### Building APK for Production

```bash
# Requires EAS CLI setup
npm install -g eas-cli
eas build --platform android
```

## Configuration

1. Update the API base URL in `services/api.ts`:
```typescript
const API_BASE = 'https://your-netlify-domain/.netlify/functions/api';
```

2. Default admin key (set in database): `juckiumartumana11`

## Project Structure

```
mobile-admin/
├── screens/
│   ├── LoginScreen.tsx       # Admin authentication
│   ├── DashboardScreen.tsx   # Dashboard & statistics
│   └── PurchasesScreen.tsx   # Purchase management
├── context/
│   └── AuthContext.tsx       # Authentication context
├── services/
│   └── api.ts                # API integration
├── App.tsx                   # Navigation setup
└── index.tsx                 # Entry point
```

## Admin Features

### Dashboard
- View total purchase count
- Monitor pending purchases
- Track approved/rejected counts
- Display total revenue
- Generate premium keys

### Purchases Tab
- Filter by status (all, pending, approved, rejected)
- Expand purchase details
- Approve purchases (auto-generates premium code)
- Reject purchases (with reason)
- Pull to refresh

### Security
- Admin key stored in device secure storage
- Automatic authentication check
- Logout functionality
- Secure API communication

## Troubleshooting

**Android Emulator Won't Start:**
- Ensure virtualization is enabled in BIOS
- Close other applications using significant RAM
- Check Android SDK is properly installed

**App Won't Connect to API:**
- Verify API URL in `services/api.ts`
- Check device/emulator has internet access
- Ensure Netlify backend is running and accessible

**Expo Go Issues:**
- Clear app cache: Settings > Apps > Expo Go > Clear Cache
- Reinstall Expo Go app
- Update to latest Expo version

**Build Issues:**
- Clear node_modules: `rm -r node_modules && npm install --legacy-peer-deps`
- Clear Expo cache: `expo start --clear`
- Check Node.js version: `node --version` (should be 16+)

