-- Create table to track emails that have already used their free trial
-- This table survives user deletion in Supabase

CREATE TABLE IF NOT EXISTS public.used_free_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'canceled', -- 'canceled' or 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups on email
CREATE INDEX IF NOT EXISTS idx_used_free_trials_email ON public.used_free_trials(email);

-- Enable Row Level Security
ALTER TABLE public.used_free_trials ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert/delete (no reads from client)
-- This ensures only server-side code can write to this table
CREATE POLICY "Service role only for writes" ON public.used_free_trials
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Note: Run this SQL in your Supabase SQL Editor at:
-- https://app.supabase.com/project/YOUR_PROJECT/sql
