-- =====================================================
-- Razorpay Integration Schema Update
-- =====================================================
-- This migration adds the order_id column to subscriptions table
-- to support Razorpay order tracking and prevent replay attacks.
--
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
-- =====================================================

-- Add order_id column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Add index for faster lookups by order_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id 
ON subscriptions(order_id);

-- Optional: Add unique constraint to prevent duplicate order_ids
-- (Uncomment if you want to enforce one subscription per order)
-- ALTER TABLE subscriptions 
-- ADD CONSTRAINT unique_order_id UNIQUE (order_id);

-- =====================================================
-- Razorpay Payment Logs Table (RECOMMENDED)
-- =====================================================
-- This table stores all payment verification attempts
-- to prevent replay attacks and maintain audit trail
-- =====================================================

CREATE TABLE IF NOT EXISTS razorpay_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan_name TEXT,
  status TEXT DEFAULT 'verified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate payment processing
  UNIQUE(order_id, payment_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_razorpay_logs_user_id 
ON razorpay_payment_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_logs_order_id 
ON razorpay_payment_logs(order_id);

-- Enable Row Level Security
ALTER TABLE razorpay_payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own payment logs
CREATE POLICY "Users can view own payment logs"
ON razorpay_payment_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only authenticated users can insert (backend should handle this)
CREATE POLICY "Authenticated users can insert payment logs"
ON razorpay_payment_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);
