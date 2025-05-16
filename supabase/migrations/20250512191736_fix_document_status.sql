/*
  # Fix document status constraint

  1. Fixes
    - Remove 'queued' from valid status values
    - Ensure consistent status values across all migrations
    - Handle existing invalid status values
*/

-- First, update any documents with invalid status to 'processing'
UPDATE documents 
SET status = 'processing' 
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed');

-- Now drop and recreate the constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed')); 