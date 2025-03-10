
export const generateEmbeddingQuery = `
-- Create the vector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure the chat_messages table has the embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_messages'
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN embedding vector(1536);
  END IF;
END
$$;

-- Create or replace the similarity search function
CREATE OR REPLACE FUNCTION match_chat_messages(
  query_embedding vector,
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id bigint,
  content text,
  is_ai boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chat_messages.id,
    chat_messages.content,
    chat_messages.is_ai,
    1 - (chat_messages.embedding <=> query_embedding) AS similarity
  FROM chat_messages
  WHERE 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
    AND chat_messages.user_id = user_id
  ORDER BY chat_messages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;
