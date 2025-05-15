/*
  # Create match_documents function for similarity search

  1. New Functions
    - `match_documents`
      - Parameters:
        - `query_embedding` (vector, embedding for query)
        - `match_threshold` (float, similarity threshold)
        - `match_count` (integer, max results)
        - `user_id` (uuid, user identifier)
      - Returns: Array of matching document chunks with similarity scores
*/

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
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
  WHERE d.user_id = user_id
  AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;