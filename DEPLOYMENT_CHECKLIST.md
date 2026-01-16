# Deployment Checklist

## Pre-Deployment
- [ ] Run `npm install` to get `qrcode` package
- [ ] Test locally with `npm run dev`
- [ ] Verify all 6 database tables created in Neon
- [ ] Test user login/signup flow
- [ ] Test code generation and chat send
- [ ] Test premium code redemption
- [ ] Test admin dashboard login
- [ ] Test purchase approval/rejection

## Environment Variables (Netlify)
Set in Netlify Dashboard under Settings > Environment:

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[db]
API_KEY=[Your Google Gemini API Key]
ADMIN_KEY=[Your Secret Admin Password - Keep Safe!]
```

## Build & Deploy
```bash
npm run build
```

Expected output:
- `dist/index.html` (main user app)
- `dist/admin.html` (admin dashboard)
- `dist/assets/` (JS/CSS bundles)

Then:
1. Push to GitHub (if connected to Netlify)
2. Netlify auto-deploys
3. Functions automatically deployed to `/.netlify/functions/api`

## Post-Deployment Verification

### User App (https://yoursite.netlify.app/)
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works  
- [ ] "Designs" button opens Templates modal
- [ ] "Archive" button shows history
- [ ] "Deploy Spec" generates code
- [ ] "Chat Support" button visible when logged in
- [ ] Can send code via chat
- [ ] Can redeem premium key in chat modal
- [ ] Code appears in chat history

### Admin Dashboard (https://yoursite.netlify.app/admin/)
- [ ] Admin login works with ADMIN_KEY
- [ ] Can see purchase queue
- [ ] Can filter by status
- [ ] Can generate QR code
- [ ] Can approve purchase (generates key)
- [ ] Can reject purchase (with reason)
- [ ] Timestamps are accurate

### Database Verification
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return:
-- premium_keys
-- chat_history
-- purchases
-- users
-- prompt_history

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

## Troubleshooting During Deployment

**1. Build fails with "qrcode not found"**
- Solution: Run `npm install` again
- Ensure `package.json` has `"qrcode": "^1.5.3"`

**2. "DATABASE_URL not set" error**
- Solution: Add DATABASE_URL to Netlify Environment Variables
- Verify Neon PostgreSQL is running
- Test connection with: `psql "your-database-url"`

**3. Admin key authentication fails**
- Solution: Verify ADMIN_KEY in Netlify matches what you entered
- Check for extra spaces/quotes in the key value

**4. Premium code redemption returns "Invalid code"**
- Solution: Ensure table `premium_keys` exists
- Run SQL schema manually if tables missing
- Check that code exists with status = 'active'

**5. Chat send fails**
- Solution: User must be logged in
- Generated prompt must not be empty
- Check browser console for specific error

## Rollback Plan

If deployment fails:
1. Netlify automatically keeps previous build
2. Click "Revert" in Netlify Deploy History
3. Previous version will be served immediately

## Performance Optimization

Optional post-deployment:
- [ ] Enable Netlify Edge Cache for assets
- [ ] Set Cache-Control headers for static files
- [ ] Monitor database query performance in Neon Dashboard
- [ ] Add CDN for image/QR code delivery

## Security Audit

Before going production:
- [ ] ADMIN_KEY is strong (20+ characters, random)
- [ ] DATABASE_URL not exposed in code/GitHub
- [ ] API_KEY not exposed in code/GitHub
- [ ] HTTPS enabled (default on Netlify)
- [ ] Database backups configured in Neon
- [ ] Unused admin accounts disabled

## Monitoring

Set up monitoring:
- [ ] Netlify Function logs: `netlify logs:functions`
- [ ] Database logs in Neon Dashboard
- [ ] Error tracking: Sentry.io (optional)
- [ ] Uptime monitoring: Updown.io (optional)

## Support Links

- **Netlify Docs:** https://docs.netlify.com/
- **Neon Database:** https://neon.tech/docs/
- **QRCode Library:** https://github.com/davidshimjs/qrcodejs
- **Google Gemini API:** https://ai.google.dev/

---

**Status:** Ready for Production
**Last Updated:** January 16, 2026
**Version:** 1.0.0
