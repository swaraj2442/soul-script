/*
  # Test get_document_counts function

  1. Test Cases
    - Verify function exists
    - Test with sample data
*/

-- First, verify the function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'get_document_counts'
  ) THEN
    RAISE EXCEPTION 'get_document_counts function does not exist';
  END IF;
END $$;

-- Test the function with a sample user
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
  test_result RECORD;
BEGIN
  -- Insert test data
  INSERT INTO documents (user_id, name, file_path, status, file_size, mime_type)
  VALUES 
    (test_user_id, 'test1.pdf', 'test/path1.pdf', 'pending', 1024, 'application/pdf'),
    (test_user_id, 'test2.pdf', 'test/path2.pdf', 'processing', 2048, 'application/pdf'),
    (test_user_id, 'test3.pdf', 'test/path3.pdf', 'completed', 3072, 'application/pdf'),
    (test_user_id, 'test4.pdf', 'test/path4.pdf', 'failed', 4096, 'application/pdf');

  -- Test the function
  FOR test_result IN 
    SELECT * FROM get_document_counts(test_user_id)
  LOOP
    RAISE NOTICE 'Status: %, Count: %', test_result.status, test_result.count;
  END LOOP;

  -- Clean up test data
  DELETE FROM documents WHERE user_id = test_user_id;
END $$; 