# SAMP Architect - Setup & Deployment Guide

## What's New

### ✓ Fixed Navigation
- "Designs" and "Archive" buttons are now fully functional
- Added "Chat Support" button for authenticated users

### ✓ Chat Support System
- Users can send generated code via chat
- Code is stored in cloud with timestamp
- Real-time message delivery confirmation

### ✓ Premium Key System
- Users can redeem premium codes to unlock unlimited generations
- Premium keys stored in database with `active` / `redeemed` status
- Auto-generation of new premium keys when redeemed
- Premium status persists in user profile

### ✓ Staff/Admin Purchase Validation App
- Separate admin dashboard accessible at `/admin/`
- Admin can approve/reject GCash purchases
- QR code generation for payment verification
- Auto-generate premium keys on purchase approval
- Send rejection reasons with purchase rejection

### ✓ QR Code Integration
- GCash payment QR codes can be generated and displayed
- QR code library integrated: `qrcode`

---

## Database Setup

### 1. Run SQL Schema
Execute the `DATABASE_SCHEMA.sql` file in your Neon PostgreSQL database:

```sql
-- Copy all queries from DATABASE_SCHEMA.sql
-- This will create:
-- - users (extended)
-- - premium_keys
-- - chat_history
-- - purchases
-- - prompt_history (extended)
```

### 2. Environment Variables (Netlify)

Add these to your Netlify environment variables:

```env
DATABASE_URL=postgresql://user:password@host/database
API_KEY=your_google_gemini_api_key
ADMIN_KEY=your_secret_admin_password
DISCORD_WEBHOOK_URL=your_discord_webhook_url (optional)
```

---

## User Flow

### 1. Normal User
```
Login/Signup
→ Generate Code (Deploy Spec button)
→ Refine with AI (optional)
→ Send via Chat Support (Chat Support button)
→ Redeem Premium Code (Chat Support modal → Redeem Premium Code section)
```

### 2. Premium User Features
- Unlimited code generation
- Priority chat support
- Access to advanced features

### 3. Purchase & Redemption Flow
```
Customer buys premium
→ Create purchase record with GCash reference
→ Admin validates at /admin/ dashboard
→ Admin approves → Premium key auto-generated
→ System sends key via chat to customer
→ Customer redeems key at Chat Support
→ User becomes premium instantly
```

---

## Admin Dashboard (`/admin`)

### Login
- Access admin panel with `ADMIN_KEY`
- Secure admin authentication

### Purchase Management
- View pending, approved, rejected purchases
- Filter by status
- Upload/Generate GCash payment QR codes
- Approve purchases → auto-generate premium key
- Reject purchases → provide rejection reason

### Actions
1. **Approve Purchase**
   - Validates payment
   - Generates premium key
   - Key ready to send to customer

2. **Reject Purchase**
   - Requires rejection reason
   - Reason is logged for records
   - Customer can see rejection reason in chat

3. **QR Code Generation**
   - Generate payment QR with purchase details
   - Display for customer verification
   - Upload GCash payment screenshot for validation

---

## API Endpoints

### Main App (User)

**Authenticate**
```json
POST /.netlify/functions/api
{
  "action": "auth",
  "mode": "signup|login",
  "username": "user",
  "email": "user@email.com",
  "password": "pass"
}
```

**Save Prompt**
```json
POST /.netlify/functions/api
{
  "action": "save_prompt",
  "username": "user",
  "prompt": "...",
  "config": { ... }
}
```

**Send Chat Message**
```json
POST /.netlify/functions/api
{
  "action": "chat_send",
  "username": "user",
  "message": "...",
  "code": "...",
  "timestamp": "2026-01-16T..."
}
```

**Redeem Premium**
```json
POST /.netlify/functions/api
{
  "action": "redeem_premium",
  "username": "user",
  "code": "PRM-XXXXX..."
}
```

### Admin Panel

**Validate Purchase**
```json
POST /.netlify/functions/api
{
  "action": "validate_purchase",
  "admin_key": "YOUR_ADMIN_KEY",
  "purchase_id": "PURCH123",
  "status": "approved|rejected",
  "reason": "Optional rejection reason"
}
```

**Get Pending Purchases**
```json
POST /.netlify/functions/api
{
  "action": "get_pending_purchases",
  "admin_key": "YOUR_ADMIN_KEY"
}
```

**Generate Premium Key (Manual)**
```json
POST /.netlify/functions/api
{
  "action": "generate_premium_key",
  "admin_key": "YOUR_ADMIN_KEY"
}
```

---

## Building & Deployment

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

This generates:
- `dist/index.html` - Main user app
- `dist/admin.html` - Admin dashboard

### Deploy to Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Netlify Functions
- Backend API automatically deployed from `netlify/functions/api.ts`
- Accessible at `/.netlify/functions/api`

---

## Testing Checklist

- [ ] User login/signup works
- [ ] Generate code with "Deploy Spec" button
- [ ] Refine code with AI
- [ ] Send code via "Chat Support"
- [ ] Redeem premium key in Chat Support modal
- [ ] Admin login with correct key
- [ ] Approve purchase → generates key
- [ ] Reject purchase → saves reason
- [ ] Generate QR code for payment
- [ ] Code history persists
- [ ] Navigation buttons (Designs, Archive) work

---

## Troubleshooting

**"Database Error: DATABASE_URL not set"**
- Add `DATABASE_URL` to Netlify environment variables
- Ensure Neon PostgreSQL is active

**"Invalid or already used code"**
- Check if premium key exists in database
- Verify status is `active` (not `redeemed`)

**"Unauthorized" on admin endpoints**
- Verify `ADMIN_KEY` in environment variables
- Check admin key in login form matches `ADMIN_KEY`

**Chat not sending**
- Ensure user is logged in
- Verify generated prompt is not empty
- Check browser console for errors

---

## Security Notes

1. **Never expose ADMIN_KEY publicly**
   - Use Netlify environment variables only
   - Regenerate periodically

2. **Premium keys should be unique and cryptographically secure**
   - System uses `crypto.randomBytes(16)` for generation

3. **Password security**
   - Consider implementing bcrypt hashing in production
   - Currently using plain text (for demo)

4. **SQL Injection Prevention**
   - Using parameterized queries with Neon
   - All user inputs safely escaped

---

## Future Enhancements

- [ ] Email notifications for purchase approvals
- [ ] SMS notifications via Twilio
- [ ] Discord integration for status updates
- [ ] Payment gateway integration (Stripe, PayMongo)
- [ ] Advanced analytics dashboard
- [ ] Refund mechanism
- [ ] User-to-user code sharing
- [ ] Rate limiting for free users
- [ ] Advanced audit logs
