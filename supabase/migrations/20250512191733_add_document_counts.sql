/*
  # Add get_document_counts function

  1. New Functions
    - `get_document_counts`
      - Parameters:
        - `user_id` (uuid, user identifier)
      - Returns: Array of document counts by status
*/

-- Drop the function if it exists to ensure clean creation
DROP FUNCTION IF EXISTS public.get_document_counts;

-- Create the function
CREATE OR REPLACE FUNCTION public.get_document_counts(user_id UUID)
RETURNS TABLE (
  status TEXT,
  count TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_document_counts TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.get_document_counts IS 'Returns document counts grouped by status for a specific user';

-- Test the function
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a user ID that has documents
  SELECT user_id INTO test_user_id
  FROM documents
  LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No documents found in the database';
    RETURN;
  END IF;

  RAISE NOTICE 'Testing get_document_counts for user: %', test_user_id;
  
  FOR test_result IN 
    SELECT * FROM get_document_counts(test_user_id)
  LOOP
    RAISE NOTICE 'Status: %, Count: %', test_result.status, test_result.count;
  END LOOP;
END $$; 