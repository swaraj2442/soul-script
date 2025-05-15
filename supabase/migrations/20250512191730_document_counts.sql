/*
  # Create get_document_counts function

  1. New Functions
    - `get_document_counts`
      - Parameters:
        - `user_id` (uuid, user identifier)
      - Returns: Array of document counts by status
*/

CREATE OR REPLACE FUNCTION get_document_counts(user_id UUID)
RETURNS TABLE (
  status TEXT,
  count TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.status::TEXT,
    COUNT(*)::TEXT
  FROM documents d
  WHERE d.user_id = get_document_counts.user_id
  GROUP BY d.status;
END;
$$; 