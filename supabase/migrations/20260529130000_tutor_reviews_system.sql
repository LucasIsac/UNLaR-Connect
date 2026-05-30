-- Migration: Tutor Reviews System
-- Created: 2026-05-29

-- 1. Create tutor_reviews table
CREATE TABLE IF NOT EXISTS tutor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent a student from reviewing the same tutor more than once
  UNIQUE (tutor_id, student_id),
  
  -- Prevent a tutor from reviewing themselves
  CONSTRAINT no_self_rating CHECK (tutor_id != student_id)
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor_id ON tutor_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_student_id ON tutor_reviews(student_id);

-- 3. Enable RLS
ALTER TABLE tutor_reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone authenticated can read reviews
CREATE POLICY "Anyone can read reviews"
  ON tutor_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert their own reviews
CREATE POLICY "Students can insert their own reviews"
  ON tutor_reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND student_id = auth.uid()
    AND tutor_id != auth.uid()
  );

-- 5. Create function to recalculate and update tutor rating in the users table
CREATE OR REPLACE FUNCTION calculate_tutor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  rev_count INTEGER;
BEGIN
  -- Determine which tutor_id to recalculate based on the operation
  -- (Trigger triggers on INSERT, UPDATE, DELETE)
  
  IF TG_OP = 'DELETE' THEN
    -- Calculate for the deleted record's tutor
    SELECT COALESCE(AVG(rating), 0), COUNT(id)
    INTO avg_rating, rev_count
    FROM tutor_reviews
    WHERE tutor_id = OLD.tutor_id;

    UPDATE users 
    SET tutor_rating = avg_rating, total_reviews = rev_count
    WHERE id = OLD.tutor_id;
    
    RETURN OLD;
  ELSE
    -- Calculate for the new/updated record's tutor
    SELECT COALESCE(AVG(rating), 0), COUNT(id)
    INTO avg_rating, rev_count
    FROM tutor_reviews
    WHERE tutor_id = NEW.tutor_id;

    UPDATE users 
    SET tutor_rating = avg_rating, total_reviews = rev_count
    WHERE id = NEW.tutor_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger to tutor_reviews table
DROP TRIGGER IF EXISTS trigger_update_tutor_rating ON tutor_reviews;
CREATE TRIGGER trigger_update_tutor_rating
AFTER INSERT OR UPDATE OR DELETE ON tutor_reviews
FOR EACH ROW
EXECUTE FUNCTION calculate_tutor_rating();
