# Admin Quick Reference Guide

## 🔓 Admin Login
**URL:** `/admin/`
**Required:** Your ADMIN_KEY (from Netlify environment variables)

### Creating ADMIN_KEY
If you haven't set it yet:
1. Go to Netlify Dashboard
2. Navigate to: Site Settings > Build & Deploy > Environment
3. Add new variable:
   - Key: `ADMIN_KEY`
   - Value: `your-secure-random-password` (use 20+ random characters)
4. Example: `AK7x9mP2qK5L8vN1bC3D4E`

---

## 📋 Purchase Management Workflow

### Step 1: View Pending Purchases
1. Login to `/admin/`
2. Dashboard shows pending purchases by default
3. Filters available: `all`, `pending`, `approved`, `rejected`

### Step 2: Select a Purchase
- Click on any purchase in the left panel
- Details appear on the right:
  - Purchase ID
  - Buyer Email
  - Amount (₱)
  - GCash Reference
  - Current Status

### Step 3: Validate Payment
For each pending purchase:

**Option A: Approve Purchase** ✅
1. Review purchase details
2. (Optional) Upload GCash payment QR code screenshot
3. Click "Generate Payment QR" if needed for reference
4. Click green button: **"✓ Approve & Generate Key"**
5. System will:
   - Auto-generate unique premium key
   - Mark purchase as approved
   - Log timestamp
   - Prepare key for customer

**Option B: Reject Purchase** ❌
1. Enter rejection reason in text box
   - Example reasons:
     - "Duplicate transaction"
     - "Unverified account"
     - "Invalid payment reference"
     - "Insufficient proof of payment"
     - "Account flagged for review"
2. Click red button: **"✗ Reject Purchase"**
3. System will:
   - Mark purchase as rejected
   - Save reason in database
   - Log timestamp
   - Notify customer via chat

### Step 4: Send Key to Customer
After approval:
1. Copy the generated key from the success message
2. Contact customer via email/chat with format:
   ```
   ✓ Your purchase has been approved!
   
   Premium Key: PRM-XXXXXXXXXXXXXXXX
   
   To activate:
   1. Go to https://yoursite.netlify.app/
   2. Login to your account
   3. Click "Chat Support"
   4. Paste the key in "Redeem Premium Code" section
   5. Click "Redeem"
   ```

---

## 🎟️ Premium Key Format

Generated keys follow this pattern:
```
PRM-[32 random hex characters]
```

Example:
```
PRM-A7F3B9E2C1D4K8L5M0N6P2Q3R5S7T9U2
```

**Key Properties:**
- Automatically generated on purchase approval
- Unique (no duplicates)
- One-time use only (changes to "redeemed" after use)
- Stored in `premium_keys` database table

---

## 🛑 Common Issues & Solutions

### Issue: "Unauthorized" on login
**Solution:** Verify ADMIN_KEY is correctly set in Netlify environment variables
- Netlify > Site Settings > Build & Deploy > Environment
- Check exact value matches what you entered

### Issue: Can't see pending purchases
**Solution:** 
1. Ensure DATABASE_URL is set
2. Check if Neon database is running
3. Verify `purchases` table exists:
   ```sql
   SELECT * FROM purchases WHERE status = 'pending';
   ```

### Issue: Approval doesn't generate key
**Solution:**
1. Check database connection
2. Verify `premium_keys` table exists
3. Check Netlify Function logs for errors

### Issue: QR code won't generate
**Solution:**
1. Ensure valid purchase ID and amount
2. Check browser console for errors
3. Verify QRCode library loaded

---

## 📊 Database Queries (for reference)

### View All Purchases
```sql
SELECT * FROM purchases ORDER BY created_at DESC;
```

### View Pending Purchases Only
```sql
SELECT * FROM purchases WHERE status = 'pending' ORDER BY created_at DESC;
```

### View Active Premium Keys
```sql
SELECT * FROM premium_keys WHERE status = 'active';
```

### View Redeemed Keys
```sql
SELECT * FROM premium_keys WHERE status = 'redeemed' ORDER BY redeemed_at DESC;
```

### View Premium Users
```sql
SELECT username, email, premium_code, created_at FROM users WHERE is_premium = true;
```

### Manual Key Generation (if needed)
```sql
INSERT INTO premium_keys (key, status, created_at)
VALUES (
  'PRM-' || upper(substring(md5(random()::text), 1, 32)),
  'active',
  NOW()
);
```

### Mark Purchase as Approved Manually
```sql
UPDATE purchases 
SET status = 'approved', validated_at = NOW()
WHERE purchase_id = 'PURCH001';
```

---

## 📱 QR Code Generation

### When to Generate QR:
- For payment verification
- To share with customer
- To display on your payment portal

### How to Generate:
1. Select purchase from list
2. Click "Generate Payment QR" button
3. QR code appears showing:
   - Purchase ID
   - Amount
   - Timestamp

### What QR Contains:
```json
{
  "purchaseId": "PURCH001",
  "amount": 500,
  "timestamp": "2026-01-16T10:30:00Z",
  "gcash": true
}
```

---

## 📞 Customer Support Responses

### Approved Purchase Response
```
Subject: ✓ Premium Purchase Approved - PRM-XXXXX

Hi [Customer Name],

Your premium purchase has been approved!

Premium Key: PRM-XXXXXXXXXXXXXXXX

To activate your premium account:
1. Visit our app and login
2. Click "Chat Support" button
3. Paste your key in "Redeem Premium Code" field
4. Click "Redeem"

Your account will instantly upgrade to premium.

Questions? Reply to this email.

Thank you!
```

### Rejected Purchase Response
```
Subject: ⚠️ Purchase Requires Verification - PURCH001

Hi [Customer Name],

Your purchase could not be processed.

Reason: [rejection_reason]

To resolve:
1. Check your payment details
2. Ensure you have a receipt/reference number
3. Contact our support team

Please reply with more information or try again.

Thank you for your patience!
```

---

## ⚙️ Admin Dashboard Features

| Feature | How to Use |
|---------|-----------|
| **Filter Purchases** | Click "all", "pending", "approved", or "rejected" buttons |
| **Refresh Queue** | Click "Refresh" button to reload latest purchases |
| **View Details** | Click any purchase row to see full details |
| **Generate QR** | Click "Generate Payment QR" for verification |
| **Upload Screenshot** | Use file input to upload GCash receipt |
| **Approve** | Green button - auto-generates and logs key |
| **Reject** | Red button - logs reason and notifies customer |
| **Logout** | Red button top-right to exit admin panel |

---

## 🔐 Security Best Practices

1. **Protect ADMIN_KEY**
   - Don't share with unauthorized staff
   - Change periodically (monthly recommended)
   - Use strong, random characters

2. **Session Safety**
   - Always logout when done
   - Don't leave admin panel unattended
   - Clear browser cache after session

3. **Purchase Verification**
   - Always verify GCash reference
   - Check for duplicate transactions
   - Request screenshot if uncertain

4. **Audit Trail**
   - All actions logged with timestamp
   - All keys tracked to purchaser
   - Rejection reasons recorded

---

## 📈 Dashboard Metrics (at a glance)

The dashboard shows:
- **Number of pending purchases** (awaiting action)
- **Total purchases by status** (filter buttons)
- **Timestamps** (when created, when validated)
- **Key generation** (success/failure logs)

---

## 🆘 Emergency Contacts

**If Admin Dashboard Down:**
1. Check Netlify status: https://www.netlify.com/status
2. Restart service: Delete Netlify cache and redeploy
3. Fallback: Use database directly to mark purchases as approved

**If Database Down:**
1. Check Neon status: https://neon.tech/
2. Check DATABASE_URL configuration
3. Restart database in Neon console

**If Premium Keys Not Generating:**
1. Check `premium_keys` table exists
2. Verify table has correct columns
3. Run SQL schema again if needed

---

**Last Updated:** January 16, 2026
**Version:** 1.0.0
**Contact:** [Your Support Email]
