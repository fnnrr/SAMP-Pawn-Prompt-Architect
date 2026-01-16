-- SAMP Architect Database Schema
-- Run these SQL queries in your Neon PostgreSQL database

-- Users table (extend existing)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  premium_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Premium keys table
CREATE TABLE IF NOT EXISTS premium_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, redeemed
  created_at TIMESTAMP DEFAULT NOW(),
  redeemed_by VARCHAR(255),
  redeemed_at TIMESTAMP,
  FOREIGN KEY (redeemed_by) REFERENCES users(username) ON DELETE SET NULL
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  message TEXT,
  code TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'delivered', -- delivered, read
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Purchases table (for GCash validation)
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  purchase_id VARCHAR(255) UNIQUE NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  gcash_ref VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  key VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP,
  FOREIGN KEY (key) REFERENCES premium_keys(key) ON DELETE SET NULL
);

-- Prompt history table (extend existing)
CREATE TABLE IF NOT EXISTS prompt_history (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  config TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_keys_status ON premium_keys(status);
CREATE INDEX IF NOT EXISTS idx_chat_history_username ON chat_history(username);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_prompt_history_username ON prompt_history(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
