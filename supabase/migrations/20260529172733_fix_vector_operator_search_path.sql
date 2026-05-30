-- Migration: Fix Search Path for Vector Operator in buscar_apuntes
-- Target: Include extensions schema in buscar_apuntes search_path

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
SET search_path = public, extensions
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

GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO service_role;
;
