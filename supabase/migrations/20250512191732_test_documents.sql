/*
  # Test document counts

  1. Test Cases
    - Verify documents table has data
    - Test get_document_counts function
*/

-- First, check if we have any documents
SELECT COUNT(*) as total_documents FROM documents;

-- Check documents by status
SELECT status, COUNT(*) as count
FROM documents
GROUP BY status;

-- Test get_document_counts with a specific user
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