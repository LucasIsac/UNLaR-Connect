-- Migration: Consultas Express
-- Creates call_rooms and call_messages tables for live 1-on-1 tutoring video calls.
-- Supabase Realtime is used for presence + WebRTC signaling only.
-- Actual audio/video streams are peer-to-peer via WebRTC.

-- ============================================================
-- call_rooms: tracks the lifecycle of each 1-on-1 call
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  student_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tutor_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'requested'
              CHECK (status IN ('requested', 'accepted', 'active', 'ended', 'rejected', 'missed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ
);

-- ============================================================
-- call_messages: in-call text chat per room
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES public.call_rooms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE public.call_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_messages ENABLE ROW LEVEL SECURITY;

-- Participants can see their own rooms
CREATE POLICY "call_rooms_select_participant"
  ON public.call_rooms FOR SELECT
  USING (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
  );

-- Students can create new call requests
CREATE POLICY "call_rooms_insert_student"
  ON public.call_rooms FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Participants can update the rooms they are part of
CREATE POLICY "call_rooms_update_participant"
  ON public.call_rooms FOR UPDATE
  USING (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
  );

-- Participants can view in-call messages
CREATE POLICY "call_messages_select_participant"
  ON public.call_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.call_rooms cr
      WHERE cr.id = room_id
        AND (cr.student_id = auth.uid() OR cr.tutor_id = auth.uid())
    )
  );

-- Participants can send messages in their own rooms
CREATE POLICY "call_messages_insert_participant"
  ON public.call_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.call_rooms cr
      WHERE cr.id = room_id
        AND (cr.student_id = auth.uid() OR cr.tutor_id = auth.uid())
    )
  );

-- ============================================================
-- Enable Supabase Realtime on both tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_messages;

-- ============================================================
-- Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_call_rooms_student_id ON public.call_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_call_rooms_tutor_id   ON public.call_rooms(tutor_id);
CREATE INDEX IF NOT EXISTS idx_call_rooms_status      ON public.call_rooms(status);
CREATE INDEX IF NOT EXISTS idx_call_messages_room_id  ON public.call_messages(room_id);
