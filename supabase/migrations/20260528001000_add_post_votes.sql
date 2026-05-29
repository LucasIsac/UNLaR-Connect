-- Migration: Add per-user forum post votes

CREATE TABLE IF NOT EXISTS public.post_votes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  direction smallint NOT NULL CHECK (direction IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read post_votes" ON public.post_votes;
CREATE POLICY "Anyone can read post_votes"
ON public.post_votes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON public.post_votes;
CREATE POLICY "Users can insert their own votes"
ON public.post_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON public.post_votes;
CREATE POLICY "Users can update their own votes"
ON public.post_votes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.post_votes;
CREATE POLICY "Users can delete their own votes"
ON public.post_votes FOR DELETE
USING (auth.uid() = user_id);
