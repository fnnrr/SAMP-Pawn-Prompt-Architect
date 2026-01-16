# ⚡ Quick Start - 5 Minute Setup

## TL;DR - Get Running Fast

### Step 1: Install (30 seconds)
```bash
npm install
```

### Step 2: Database (2 minutes)
1. Open Neon console: https://console.neon.tech
2. Copy entire content from [MIGRATION.sql](MIGRATION.sql)
3. Paste into Neon SQL editor
4. Click "Execute"
5. Done! ✅

### Step 3: Environment (1 minute)
Netlify Dashboard → Site Settings → Build & Deploy → Environment:

```
DATABASE_URL = postgresql://...
API_KEY = sk-...
ADMIN_KEY = random_secure_password_here
```

### Step 4: Test (1 minute)
```bash
npm run dev
```

Then:
- Main app: http://localhost:5173/ ✅
- Admin: http://localhost:5173/admin/ ✅

### Step 5: Deploy (1 minute)
```bash
npm run build
git push  # Auto-deploys via Netlify
```

---

## ✅ Features Ready to Use

### For Users
- ✅ Generate code with "Deploy Spec"
- ✅ Send via "Chat Support" button
- ✅ Redeem premium key in chat modal
- ✅ Designs & Archive buttons work

### For Admin
- ✅ Access /admin/ with ADMIN_KEY
- ✅ View pending purchases
- ✅ Approve → generates key
- ✅ Reject → logs reason
- ✅ Generate payment QR codes

---

## 🎯 Test the System

### Test User Premium Flow
1. Generate premium code in database:
   ```sql
   INSERT INTO premium_keys (key, status) 
   VALUES ('PRM-TEST1234567890ABCDEF', 'active');
   ```
2. Login to app
3. Chat Support → Redeem Code → Success! ✅

### Test Admin Purchase
1. Create test purchase:
   ```sql
   INSERT INTO purchases (purchase_id, buyer_email, amount, gcash_ref, status)
   VALUES ('TEST-001', 'test@test.com', 500, 'REF123', 'pending');
   ```
2. Go to /admin/
3. Login with ADMIN_KEY
4. Select purchase → Approve → Key generated! ✅

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [COMPLETION_REPORT.md](COMPLETION_REPORT.md) | What was built |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed setup |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | How to operate |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre-deploy checklist |
| [MIGRATION.sql](MIGRATION.sql) | Database setup |

---

## 🆘 Common Issues

**"Database Error: DATABASE_URL not set"**
→ Add DATABASE_URL to Netlify environment

**"Unauthorized" on admin login**
→ Check ADMIN_KEY matches in Netlify

**"Invalid code" when redeeming**
→ Code must exist with status='active' in DB

**Chat button not showing**
→ Must be logged in as user

**"qrcode not found"**
→ Run `npm install` again

---

## 🎮 Try These Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

---

## 📊 File Changes Summary

- **Modified:** App.tsx, netlify/functions/api.ts, types.ts, package.json, vite.config.ts
- **Created:** AdminApp.tsx, admin.tsx, admin.html, 6 documentation files, 2 SQL files
- **No breaking changes** - All existing functionality intact

---

## 🚀 You're Ready!

Everything is set up and ready to go:
- ✅ Code implemented
- ✅ Database schema provided
- ✅ API endpoints working
- ✅ Admin dashboard complete
- ✅ Documentation complete

**Just follow the 5 steps above and you're done!**

---

**Questions?** Check the detailed docs or the ADMIN_GUIDE.md for operations.

Happy coding! 🎉
