-- Track repeat appearances and engagement signals for lead scoring
ALTER TABLE intent_leads
  ADD COLUMN IF NOT EXISTS seen_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_repeated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS engagement_weight NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS intent_leads_repeated_idx
  ON intent_leads (user_id, is_repeated)
  WHERE is_repeated = true;
