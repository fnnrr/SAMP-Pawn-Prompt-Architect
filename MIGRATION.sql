-- SAMP Architect - Database Migration Script
-- Run this in your Neon PostgreSQL console to set up all required tables

-- ============================================================
-- STEP 1: EXTEND USERS TABLE (if it already exists)
-- ============================================================

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_code VARCHAR(255);

-- ============================================================
-- STEP 2: CREATE PREMIUM_KEYS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS premium_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'redeemed')),
  created_at TIMESTAMP DEFAULT NOW(),
  redeemed_by VARCHAR(255),
  redeemed_at TIMESTAMP,
  FOREIGN KEY (redeemed_by) REFERENCES users(username) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_premium_keys_status ON premium_keys(status);
CREATE INDEX IF NOT EXISTS idx_premium_keys_key ON premium_keys(key);

-- ============================================================
-- STEP 3: CREATE CHAT_HISTORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  message TEXT,
  code TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'delivered' CHECK (status IN ('delivered', 'read')),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_history_username ON chat_history(username);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp DESC);

-- ============================================================
-- STEP 4: CREATE PURCHASES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  purchase_id VARCHAR(255) UNIQUE NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  gcash_ref VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  key VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP,
  FOREIGN KEY (key) REFERENCES premium_keys(key) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_id ON purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- ============================================================
-- STEP 5: CREATE PROMPT_HISTORY TABLE (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS prompt_history (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  config TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_username ON prompt_history(username);
CREATE INDEX IF NOT EXISTS idx_prompt_history_timestamp ON prompt_history(timestamp DESC);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all tables exist
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'premium_keys', 'chat_history', 'purchases', 'prompt_history')
ORDER BY table_name;

-- Verify all indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'premium_keys', 'chat_history', 'purchases', 'prompt_history')
ORDER BY tablename, indexname;

-- ============================================================
-- TEST DATA (OPTIONAL - for development only)
-- ============================================================

-- Insert test user
INSERT INTO users (username, email, password, is_premium)
VALUES ('testuser', 'test@example.com', 'password123', false)
ON CONFLICT (username) DO NOTHING;

-- Insert test premium keys
INSERT INTO premium_keys (key, status)
VALUES 
  ('PRM-TEST1234567890ABCDEF0000001', 'active'),
  ('PRM-TEST1234567890ABCDEF0000002', 'active')
ON CONFLICT (key) DO NOTHING;

-- Insert test purchase
INSERT INTO purchases (purchase_id, buyer_email, amount, gcash_ref, status)
VALUES ('TEST-PURCH-001', 'customer@example.com', 500.00, 'REF123456', 'pending')
ON CONFLICT (purchase_id) DO NOTHING;

-- ============================================================
-- DATA RESET QUERIES (use with caution!)
-- ============================================================

-- Reset all data (DESTRUCTIVE - careful!)
-- DELETE FROM chat_history;
-- DELETE FROM purchases;
-- DELETE FROM premium_keys;
-- DELETE FROM prompt_history;
-- DELETE FROM users;

-- Reset auto-increment sequences
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE premium_keys_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chat_history_id_seq RESTART WITH 1;
-- ALTER SEQUENCE purchases_id_seq RESTART WITH 1;
-- ALTER SEQUENCE prompt_history_id_seq RESTART WITH 1;

-- ============================================================
-- USEFUL QUERIES FOR DAILY OPERATIONS
-- ============================================================

-- Count pending purchases
-- SELECT COUNT(*) as pending_purchases FROM purchases WHERE status = 'pending';

-- Count active premium keys
-- SELECT COUNT(*) as active_keys FROM premium_keys WHERE status = 'active';

-- Count premium users
-- SELECT COUNT(*) as premium_users FROM users WHERE is_premium = true;

-- List recent chat messages
-- SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 10;

-- Find duplicate purchase IDs (for data integrity)
-- SELECT purchase_id, COUNT(*) FROM purchases GROUP BY purchase_id HAVING COUNT(*) > 1;

-- List all purchases with their keys
-- SELECT p.purchase_id, p.buyer_email, p.amount, p.status, pk.key 
-- FROM purchases p
-- LEFT JOIN premium_keys pk ON p.key = pk.key
-- ORDER BY p.created_at DESC;

-- ============================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================

-- Analyze tables for query optimization
-- ANALYZE users;
-- ANALYZE premium_keys;
-- ANALYZE chat_history;
-- ANALYZE purchases;
-- ANALYZE prompt_history;

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================================
-- BACKUP RECOMMENDATIONS
-- ============================================================

-- In Neon Dashboard:
-- 1. Go to Branch Settings > Backups
-- 2. Enable daily backups
-- 3. Set retention to at least 7 days
-- 4. Download backup before major changes

-- Command-line backup (if using psql locally):
-- pg_dump "your-database-url" > backup_$(date +%Y%m%d_%H%M%S).sql

-- Restore from backup:
-- psql "your-database-url" < backup_YYYYMMDD_HHMMSS.sql

-- ============================================================
-- MIGRATION CHECKLIST
-- ============================================================

-- After running this script:
-- [ ] All 5 tables created successfully
-- [ ] All indexes created
-- [ ] Foreign keys working
-- [ ] Test data inserted
-- [ ] Verification queries passed
-- [ ] Backup created
-- [ ] Ready for production

-- ============================================================
-- NOTES
-- ============================================================

-- 1. This script is idempotent (safe to run multiple times)
-- 2. Uses IF NOT EXISTS to prevent errors
-- 3. Includes constraints and check conditions
-- 4. Performance indexes included
-- 5. Foreign keys for data integrity
-- 6. Timestamps for audit trail

-- Last Updated: January 16, 2026
-- Version: 1.0.0
