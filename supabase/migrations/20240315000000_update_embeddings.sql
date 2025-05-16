-- Drop existing functions and tables with CASCADE
DROP FUNCTION IF EXISTS match_documents;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table with proper status constraints
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create document chunks table with 768-dimensional vector (Gemini)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create citations table
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    start_char INTEGER NOT NULL,
    end_char INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for vector similarity search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create match_documents function with correct parameter order
CREATE OR REPLACE FUNCTION match_documents(
    target_document_id UUID,
    match_count INT,
    match_threshold FLOAT,
    query_embedding vector(768),
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
        1 - (dc.embedding <=> query_embedding) as similarity
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