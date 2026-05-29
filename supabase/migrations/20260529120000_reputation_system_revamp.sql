-- Migration: Reputation system revamp
-- Created: 2026-05-29

-- 1. Create karma_log table (audit trail for point changes)
CREATE TABLE IF NOT EXISTS karma_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add image_url to posts (for forum images)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

-- 3. Add image_url to post_replies (for reply images)
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

-- 4. Enable RLS on karma_log
ALTER TABLE karma_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for karma_log
CREATE POLICY "Users can read own karma log"
  ON karma_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert karma log"
  ON karma_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_karma_log_user_id ON karma_log(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_log_created_at ON karma_log(created_at);
CREATE INDEX IF NOT EXISTS idx_karma_log_reason ON karma_log(reason);

-- 7. Update existing badges to match new reputation system
INSERT INTO badges (id, name, description, icon_name, required_points) VALUES
(4, 'Participante Activo', 'Publicó 5 hilos en el foro', 'forum', 75),
(5, 'Mentor Colaborativo', 'Respondió 10 preguntas en el foro', 'handshake', 150),
(6, 'Experto UNLaR', 'Alcanzó nivel 20 de reputación', 'star', 5000)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, required_points = EXCLUDED.required_points;
