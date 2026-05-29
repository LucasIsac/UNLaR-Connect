-- Create "apuntes" storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('apuntes', 'apuntes', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for objects if not already enabled (usually is by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public viewing
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'apuntes');

-- Policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'apuntes' AND auth.role() = 'authenticated');

-- Policy to allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE
USING (bucket_id = 'apuntes' AND auth.uid() = owner);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE
USING (bucket_id = 'apuntes' AND auth.uid() = owner);
