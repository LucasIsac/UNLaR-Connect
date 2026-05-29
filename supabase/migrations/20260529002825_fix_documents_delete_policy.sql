-- Add DELETE policy for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir eliminación de documentos propios" ON public.documents;
CREATE POLICY "Permitir eliminación de documentos propios"
ON public.documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
