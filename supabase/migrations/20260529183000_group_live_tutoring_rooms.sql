-- Migration: Group live tutoring rooms
-- Converts Consultas Express from direct 1:1 rooms into open tutor-hosted rooms
-- with participant-based access and a default 4-person capacity.

-- ============================================================
-- call_rooms: add open-room metadata while keeping legacy columns
-- ============================================================
ALTER TABLE public.call_rooms
  ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE public.call_rooms
  ADD COLUMN IF NOT EXISTS room_kind TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 4;

ALTER TABLE public.call_rooms
  DROP CONSTRAINT IF EXISTS call_rooms_status_check;

ALTER TABLE public.call_rooms
  ADD CONSTRAINT call_rooms_status_check
  CHECK (status IN ('requested', 'open', 'accepted', 'active', 'ended', 'rejected', 'missed'));

ALTER TABLE public.call_rooms
  DROP CONSTRAINT IF EXISTS call_rooms_room_kind_check;

ALTER TABLE public.call_rooms
  ADD CONSTRAINT call_rooms_room_kind_check
  CHECK (room_kind IN ('direct', 'open'));

ALTER TABLE public.call_rooms
  DROP CONSTRAINT IF EXISTS call_rooms_max_participants_check;

ALTER TABLE public.call_rooms
  ADD CONSTRAINT call_rooms_max_participants_check
  CHECK (max_participants BETWEEN 2 AND 4);

-- ============================================================
-- call_room_participants: authoritative room membership
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_room_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES public.call_rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('tutor', 'student')),
  is_host    BOOLEAN NOT NULL DEFAULT false,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE public.call_room_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_call_participant(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_room_participants crp
    WHERE crp.room_id = p_room_id
      AND crp.user_id = p_user_id
      AND crp.left_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_call_host(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_room_participants crp
    WHERE crp.room_id = p_room_id
      AND crp.user_id = p_user_id
      AND crp.is_host = true
      AND crp.left_at IS NULL
  );
$$;

-- ============================================================
-- RLS policies
-- ============================================================
DROP POLICY IF EXISTS "call_rooms_select_participant" ON public.call_rooms;
DROP POLICY IF EXISTS "call_rooms_insert_student" ON public.call_rooms;
DROP POLICY IF EXISTS "call_rooms_update_participant" ON public.call_rooms;

CREATE POLICY "call_rooms_select_open_or_participant"
  ON public.call_rooms FOR SELECT
  USING (
    status IN ('open', 'active')
    OR auth.uid() = student_id
    OR auth.uid() = tutor_id
    OR public.is_active_call_participant(id, auth.uid())
  );

CREATE POLICY "call_rooms_insert_own_room"
  ON public.call_rooms FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
  );

CREATE POLICY "call_rooms_update_active_participant"
  ON public.call_rooms FOR UPDATE
  USING (
    auth.uid() = student_id
    OR auth.uid() = tutor_id
    OR public.is_active_call_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "call_room_participants_select_same_room" ON public.call_room_participants;
DROP POLICY IF EXISTS "call_room_participants_insert_self" ON public.call_room_participants;
DROP POLICY IF EXISTS "call_room_participants_update_self_or_host" ON public.call_room_participants;

CREATE POLICY "call_room_participants_select_same_room"
  ON public.call_room_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.call_rooms cr
      WHERE cr.id = room_id
        AND cr.status IN ('open', 'active')
    )
    OR user_id = auth.uid()
    OR public.is_active_call_participant(room_id, auth.uid())
  );

CREATE POLICY "call_room_participants_insert_self"
  ON public.call_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "call_room_participants_update_self_or_host"
  ON public.call_room_participants FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.is_active_call_host(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "call_messages_select_participant" ON public.call_messages;
DROP POLICY IF EXISTS "call_messages_insert_participant" ON public.call_messages;

CREATE POLICY "call_messages_select_participant"
  ON public.call_messages FOR SELECT
  USING (public.is_active_call_participant(room_id, auth.uid()));

CREATE POLICY "call_messages_insert_participant"
  ON public.call_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_active_call_participant(room_id, auth.uid())
  );

-- ============================================================
-- Atomic room helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.open_live_call_room(p_subject_id INTEGER DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_room_id UUID;
  v_user_role_id INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT role_id INTO v_user_role_id
  FROM public.users
  WHERE id = current_user_id;

  IF v_user_role_id NOT IN (1, 3) THEN
    RAISE EXCEPTION 'not_tutor';
  END IF;

  SELECT id INTO current_room_id
  FROM public.call_rooms
  WHERE tutor_id = current_user_id
    AND room_kind = 'open'
    AND status IN ('open', 'active')
  ORDER BY created_at DESC
  LIMIT 1;

  IF current_room_id IS NULL THEN
    INSERT INTO public.call_rooms (
      tutor_id,
      student_id,
      subject_id,
      status,
      room_kind,
      max_participants,
      started_at
    )
    VALUES (
      current_user_id,
      NULL,
      p_subject_id,
      'open',
      'open',
      4,
      now()
    )
    RETURNING id INTO current_room_id;
  END IF;

  INSERT INTO public.call_room_participants (room_id, user_id, role, is_host, left_at)
  VALUES (current_room_id, current_user_id, 'tutor', true, NULL)
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET
    role = 'tutor',
    is_host = true,
    joined_at = now(),
    left_at = NULL;

  RETURN current_room_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_live_call_room(p_room_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  target_room public.call_rooms%ROWTYPE;
  current_count INTEGER;
  participant_role TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO target_room
  FROM public.call_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND OR target_room.room_kind <> 'open' THEN
    RAISE EXCEPTION 'room_not_found';
  END IF;

  IF target_room.status NOT IN ('open', 'active') THEN
    RAISE EXCEPTION 'room_closed';
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.call_room_participants
  WHERE room_id = p_room_id
    AND left_at IS NULL
    AND user_id <> current_user_id;

  IF current_count >= target_room.max_participants THEN
    RAISE EXCEPTION 'room_full';
  END IF;

  participant_role := CASE WHEN current_user_id = target_room.tutor_id THEN 'tutor' ELSE 'student' END;

  INSERT INTO public.call_room_participants (room_id, user_id, role, is_host, left_at)
  VALUES (
    p_room_id,
    current_user_id,
    participant_role,
    current_user_id = target_room.tutor_id,
    NULL
  )
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    is_host = EXCLUDED.is_host,
    joined_at = now(),
    left_at = NULL;

  UPDATE public.call_rooms
  SET status = CASE WHEN status = 'open' AND current_user_id <> tutor_id THEN 'active' ELSE status END,
      started_at = COALESCE(started_at, now())
  WHERE id = p_room_id;

  RETURN p_room_id;
END;
$$;

-- ============================================================
-- Realtime and indexes
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.call_room_participants;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_call_rooms_open_tutor
  ON public.call_rooms(tutor_id, status, room_kind)
  WHERE room_kind = 'open' AND status IN ('open', 'active');

CREATE INDEX IF NOT EXISTS idx_call_rooms_open_subject
  ON public.call_rooms(subject_id, status, room_kind)
  WHERE room_kind = 'open' AND status IN ('open', 'active');

CREATE INDEX IF NOT EXISTS idx_call_room_participants_room_active
  ON public.call_room_participants(room_id)
  WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_call_room_participants_user_active
  ON public.call_room_participants(user_id)
  WHERE left_at IS NULL;
