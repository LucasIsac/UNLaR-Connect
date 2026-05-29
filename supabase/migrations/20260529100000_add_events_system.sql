-- Migration: Events system for seminars, workshops, and university training
-- Created: 2026-05-29

-- 1. Add Administrativo role
INSERT INTO public.roles (id, name, description) VALUES
(4, 'Administrativo', 'Personal de la universidad que crea y gestiona eventos académicos')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('seminario', 'capacitacion', 'diplomatura', 'taller', 'conferencia', 'otro')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,
  meeting_link VARCHAR(512),
  image_url VARCHAR(512),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_participants INTEGER CHECK (max_participants > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  CHECK (registration_deadline <= start_date)
);

-- 3. Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 4. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for events
-- Anyone can read active events
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  USING (status != 'cancelled');

-- Only admins and administrativos can insert events
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (1, 4)
    )
  );

-- Only the creator or admins can update events
CREATE POLICY "Creators and admins can update events"
  ON events FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (1, 4)
    )
  );

-- Only the creator or admins can delete events
CREATE POLICY "Creators and admins can delete events"
  ON events FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (1, 4)
    )
  );

-- 6. RLS Policies for event_registrations
-- Users can read their own registrations
CREATE POLICY "Users can read own registrations"
  ON event_registrations FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (1, 4)
    )
  );

-- Authenticated users can register for events
CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can cancel their own registration
CREATE POLICY "Users can cancel own registration"
  ON event_registrations FOR DELETE
  USING (user_id = auth.uid());

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
