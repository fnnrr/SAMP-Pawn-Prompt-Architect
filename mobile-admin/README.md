# SAMP Architect Mobile Admin App

React Native mobile admin dashboard for managing purchases and premium codes.

## Features

- **Admin Authentication** - Secure login with admin key
- **Dashboard** - Real-time stats (total purchases, pending, approved, rejected)
- **Purchase Management** - View, approve, and reject purchases
- **Premium Key Generation** - Generate new premium codes on demand
- **Secure Storage** - Admin keys stored securely using Expo SecureStore

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
npm install
```

### Configuration

1. Update the API base URL in `services/api.ts`:
```typescript
const API_BASE = 'https://your-netlify-domain/.netlify/functions/api';
```

2. Default admin key (set in database): `juckiumartumana11`

### Running Locally

**Web:**
```bash
npm run web
```

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Building for Production

**Android:**
```bash
npm run build:android
```

**iOS:**
```bash
npm run build:ios
```

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

## API Integration

The app communicates with the main Netlify backend API:

- `get_pending_purchases` - Fetch pending/all purchases
- `validate_purchase` - Approve or reject a purchase
- `generate_premium_key` - Generate new premium codes

## Troubleshooting

**API Connection Issues:**
- Ensure your Netlify domain is correctly set in `services/api.ts`
- Check that DATABASE_URL is set in Netlify environment variables
- Verify ADMIN_KEY environment variable matches database

**Auth Issues:**
- Clear app cache: `expo web --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**iOS Build:**
- Ensure Xcode is installed: `xcode-select --install`
- Update pods: `cd ios && pod install && cd ..`

**Android Build:**
- Ensure Android SDK is installed
- Set ANDROID_HOME environment variable
