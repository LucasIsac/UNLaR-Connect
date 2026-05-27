# Skill: RAG & PDF Vector Processing

This skill details how to implement vector embedding generation, document parsing, and RAG search query operations.

## 1. Document Parsing & Chunking
- **File Upload**:
  - Accept PDF files using a standard dropzone component.
  - Parse PDFs inside server actions to extract plain text content.
- **Chunking Strategy**:
  - Split text into sliding window chunks of 500-1000 characters with a 100-200 character overlap to ensure contexts aren't broken.
  - Tag each chunk with the source `document_id`, `page_number`, and `materia_id`.

## 2. Embedding Generation via FreeLLMAPI
- **API Requests**:
  - Connect to the local `FreeLLMAPI` embedding endpoint.
  - Convert text chunks into high-dimensional float vectors (e.g. 1536-dimensional or matching the model).
- **Supabase pgvector**:
  - Save the generated float arrays inside the `document_embeddings` table.
  - Perform semantic similarity searches using the cosine distance operator (`<=>`) in raw SQL functions called via Supabase RPC:
    ```sql
    CREATE OR REPLACE FUNCTION buscar_apuntes(
      query_embedding vector,
      match_threshold float,
      match_count int
    ) RETURNS TABLE (...)
    ```

## 3. RAG Conversational Flow
- Inject matching chunks as context inside the prompt to the local LLM completion model.
- Instruct the model to strictly base its answer on the provided context, answering in Argentine Spanish:
  - *Context*: "Apuntes de Álgebra..."
  - *Response Style*: "Mirá, de acuerdo al apunte oficial de Álgebra, la matriz transpuesta se calcula de esta forma..."

---

> [!IMPORTANT]
> If the matching threshold is not reached, return a polite fallback response in Argentine Spanish:
> "Che, no encontré nada específico sobre eso en este apunte. ¿Querés que busquemos en internet o en otro documento?"
