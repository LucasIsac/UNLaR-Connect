-- Migration: Cleanup Legacy Tables and Add Vector RPC for RAG
-- Target: Drop public.fragmentos and public.documentos (unused, 0 rows)
-- Target: Deploy public.buscar_apuntes RPC function (vector(768))

-- 1. Drop legacy fragmentos table
DROP TABLE IF EXISTS public.fragmentos CASCADE;

-- 2. Drop legacy documentos table
DROP TABLE IF EXISTS public.documentos CASCADE;

-- 3. Create or replace RAG search RPC function
CREATE OR REPLACE FUNCTION public.buscar_apuntes(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.content,
    (1 - (de.embedding <=> query_embedding))::float AS similarity
  FROM public.document_embeddings de
  WHERE (filter_document_id IS NULL OR de.document_id = filter_document_id)
    AND (1 - (de.embedding <=> query_embedding)) > match_threshold
  ORDER BY de.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 4. Grant access to public.buscar_apuntes to authenticated users
GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO service_role;
;
