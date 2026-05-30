DROP FUNCTION IF EXISTS public.buscar_apuntes(vector, float, int, uuid);

CREATE OR REPLACE FUNCTION public.buscar_apuntes(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_document_id uuid DEFAULT NULL,
  filter_subject text DEFAULT NULL,
  filter_topic text DEFAULT NULL,
  filter_type text DEFAULT NULL
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
  JOIN public.documents d ON de.document_id = d.id
  LEFT JOIN public.subjects s ON d.subject_id = s.id
  LEFT JOIN public.topics t ON d.topic_id = t.id
  WHERE (1 - (de.embedding <=> query_embedding)) > match_threshold
    AND (filter_document_id IS NULL OR de.document_id = filter_document_id)
    AND (filter_subject IS NULL OR s.name = filter_subject)
    AND (filter_topic IS NULL OR t.name = filter_topic)
    AND (filter_type IS NULL OR 
         (filter_type = 'pdf' AND d.document_type = 'pdf') OR
         (filter_type = 'text' AND d.document_type IN ('txt', 'md'))
        )
  ORDER BY de.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_apuntes TO service_role;;
