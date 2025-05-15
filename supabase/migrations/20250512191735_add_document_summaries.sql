/*
  # Add document_summaries table

  1. New Tables
    - `document_summaries`
      - `id` (uuid, primary key)
      - `document_id` (uuid, reference to documents)
      - `model` (text, AI model used)
      - `summary` (text, AI-generated summary)
      - `created_at` (timestamp)
*/

-- Create document_summaries table
CREATE TABLE IF NOT EXISTS document_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own document summaries"
  ON document_summaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_summaries.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own document summaries"
  ON document_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_summaries.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own document summaries"
  ON document_summaries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_summaries.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS document_summaries_document_id_idx ON document_summaries(document_id);
CREATE INDEX IF NOT EXISTS document_summaries_model_idx ON document_summaries(model); 