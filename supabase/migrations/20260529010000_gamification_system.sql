-- Migration: Implement Gamification, Likes and Saved Documents
-- User points gamification rules:
-- Upload a document: +10 points
-- Receive a vote on a document: +2 points for upvote, -2 points for downvote

-- 1. Create table for tracking document saves/favorites
CREATE TABLE IF NOT EXISTS public.saved_documents (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, document_id)
);

ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved documents"
ON public.saved_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save documents for themselves"
ON public.saved_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own documents"
ON public.saved_documents FOR DELETE
USING (auth.uid() = user_id);


-- 2. Create table for tracking document votes (likes)
CREATE TABLE IF NOT EXISTS public.document_votes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  direction smallint NOT NULL CHECK (direction IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);

ALTER TABLE public.document_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read document votes"
ON public.document_votes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own votes"
ON public.document_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.document_votes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.document_votes FOR DELETE
USING (auth.uid() = user_id);


-- 3. Trigger: Reward points for uploading a document
CREATE OR REPLACE FUNCTION public.reward_upload_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Add 10 points to the uploader
  UPDATE public.users 
  SET points = COALESCE(points, 0) + 10 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_upload ON public.documents;
CREATE TRIGGER on_document_upload
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE PROCEDURE public.reward_upload_points();


-- 4. Trigger: Handle document votes (update upvotes count & reward points)
CREATE OR REPLACE FUNCTION public.handle_document_vote()
RETURNS TRIGGER AS $$
DECLARE
  doc_owner uuid;
BEGIN
  -- Get the owner of the document
  SELECT user_id INTO doc_owner FROM public.documents WHERE id = NEW.document_id;
  
  -- Increase the document's upvotes count
  UPDATE public.documents 
  SET upvotes = COALESCE(upvotes, 0) + NEW.direction 
  WHERE id = NEW.document_id;
  
  -- Reward the document owner with points (2 points per upvote)
  IF NEW.direction = 1 THEN
    UPDATE public.users SET points = COALESCE(points, 0) + 2 WHERE id = doc_owner;
  ELSE
    UPDATE public.users SET points = COALESCE(points, 0) - 2 WHERE id = doc_owner;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_vote ON public.document_votes;
CREATE TRIGGER on_document_vote
  AFTER INSERT ON public.document_votes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_document_vote();


-- 5. Trigger: Handle removing a vote
CREATE OR REPLACE FUNCTION public.handle_document_unvote()
RETURNS TRIGGER AS $$
DECLARE
  doc_owner uuid;
BEGIN
  -- Get the owner of the document
  SELECT user_id INTO doc_owner FROM public.documents WHERE id = OLD.document_id;
  
  -- Decrease the document's upvotes count
  UPDATE public.documents 
  SET upvotes = COALESCE(upvotes, 0) - OLD.direction 
  WHERE id = OLD.document_id;
  
  -- Remove the points from the document owner
  IF OLD.direction = 1 THEN
    UPDATE public.users SET points = COALESCE(points, 0) - 2 WHERE id = doc_owner;
  ELSE
    UPDATE public.users SET points = COALESCE(points, 0) + 2 WHERE id = doc_owner;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_unvote ON public.document_votes;
CREATE TRIGGER on_document_unvote
  AFTER DELETE ON public.document_votes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_document_unvote();
