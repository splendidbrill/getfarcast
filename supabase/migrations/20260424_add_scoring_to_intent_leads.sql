-- Add intent scoring columns to intent_leads
-- Run this in the Supabase SQL editor or via the Supabase CLI

ALTER TABLE intent_leads
  ADD COLUMN IF NOT EXISTS intent_level TEXT DEFAULT 'low'
    CHECK (intent_level IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS page_context TEXT;

-- Existing rows get intent_level='low', lead_score=0, page_context=null
-- New rows will have scores computed server-side on ingest

  CREATE INDEX IF NOT EXISTS intent_leads_score_idx
    ON intent_leads (user_id, lead_score DESC);

  CREATE INDEX IF NOT EXISTS intent_leads_intent_level_idx
    ON intent_leads (user_id, intent_level);
