-- Enable the pgvector extension
create extension if not exists vector;

-- Create documents table
create table if not exists documents (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  file_path text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  file_size bigint not null,
  mime_type text not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create document chunks table
create table if not exists document_chunks (
  id uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(768),
  chunk_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on document_chunks for faster similarity search
create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create function to match documents
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id uuid,
  document_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.user_id = match_documents.user_id
    and d.status = 'completed'
    and d.id = match_documents.document_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Create function to get document counts by status
create or replace function get_document_counts(user_id uuid)
returns table (
  status text,
  count text
)
language plpgsql
as $$
begin
  return query
  select
    d.status::text,
    count(*)::text
  from documents d
  where d.user_id = get_document_counts.user_id
  group by d.status;
end;
$$;

-- Create RLS policies
alter table documents enable row level security;
alter table document_chunks enable row level security;

create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

create policy "Users can view their own document chunks"
  on document_chunks for select
  using (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
      and d.user_id = auth.uid()
    )
  );

create policy "Users can insert their own document chunks"
  on document_chunks for insert
  with check (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
      and d.user_id = auth.uid()
    )
  );

create policy "Users can delete their own document chunks"
  on document_chunks for delete
  using (
    exists (
      select 1 from documents d
      where d.id = document_chunks.document_id
      and d.user_id = auth.uid()
    )
  ); 