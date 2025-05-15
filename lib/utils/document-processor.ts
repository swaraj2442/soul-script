import { createServerSupabaseClient } from '../supabase/client';
import { getEmbedding } from '../openai/client';
import { extractTextFromFile } from './text-extractor';
import { chunkText } from './text-chunker';
import { v4 as uuidv4 } from 'uuid';

export async function processDocument(
  documentId: string,
  filePath: string,
  mimeType: string,
  userId: string
) {
  const supabase = createServerSupabaseClient();
  
  try {
    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(filePath);
    
    if (downloadError || !fileData) {
      throw new Error(`Error downloading file: ${downloadError?.message || 'File not found'}`);
    }
    
    // Extract text from the file
    const text = await extractTextFromFile(fileData, mimeType);
    if (!text) {
      throw new Error('Failed to extract text from document');
    }
    
    // Split the text into chunks
    const chunks = chunkText(text, 1000, 200); // 1000 chars with 200 char overlap
    
    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding using OpenAI
      const embedding = await getEmbedding(chunk);
      
      // Store the chunk and its embedding in the database
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert({
          id: uuidv4(),
          document_id: documentId,
          content: chunk,
          embedding,
          chunk_index: i,
        });
      
      if (insertError) {
        throw new Error(`Error inserting chunk: ${insertError.message}`);
      }
    }
    
    return { success: true, chunkCount: chunks.length };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}