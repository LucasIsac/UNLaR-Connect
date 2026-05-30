-- Migration: Fix open live tutoring room role variable
-- Replaces the RPC with a non-conflicting local variable name.

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
