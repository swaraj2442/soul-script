/*
  # Fix match_documents function

  1. Fixes
    - Resolve ambiguous user_id column reference
    - Add explicit table aliases
    - Add status filter for completed documents only
    - Ensure compatibility with Gemini embeddings (768 dimensions)
    - Fix parameter naming conflict with document_id
*/

-- Drop the old functions first
DROP FUNCTION IF EXISTS match_documents(VECTOR(768), FLOAT, INT, UUID, UUID);
DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), FLOAT, INT, UUID);
DROP FUNCTION IF EXISTS match_documents(UUID, INT, FLOAT, VECTOR(768), UUID);

-- Create the function with parameters in the exact order expected by the application
CREATE OR REPLACE FUNCTION match_documents(
  target_document_id UUID,  -- Changed name to avoid conflict with return column
  match_count INT,
  match_threshold FLOAT,
  query_embedding VECTOR(768),
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.user_id = match_documents.user_id
    AND d.status = 'completed'
    AND d.id = match_documents.target_document_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION match_documents IS 'Returns document chunks that match the query embedding, filtered by user, document, and similarity threshold';