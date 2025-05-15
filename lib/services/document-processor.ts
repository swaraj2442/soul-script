import { createServerSupabaseClient } from '../supabase/client';
import { getEmbedding, generateChatCompletion, AI_MODELS } from '../openai/client';
import { v4 as uuidv4 } from 'uuid';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { keys } from '../keys';

// Increased chunk size to reduce number of API calls
const CHUNK_SIZE = 2000;  // Increased from 1000
const CHUNK_OVERLAP = 400;  // Increased from 200

// Initialize Gemini
const genAI = new GoogleGenerativeAI(keys.gemini.apiKey);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Function to feed document to AI models
async function feedDocumentToAI(text: string, documentId: string) {
  const supabase = createServerSupabaseClient();
  
  try {
    // First try Gemini
    if (keys.gemini.apiKey) {
      try {
        const result = await geminiModel.generateContent([
          "You are a document processing assistant. Your task is to understand and summarize the following document. This will be used to provide context for future conversations. Here's the document:\n\n" + text
        ]);
        const summary = result.response.text();
        
        // Store the summary
        await supabase
          .from('document_summaries')
          .insert({
            id: uuidv4(),
            document_id: documentId,
            model: 'gemini-pro',
            summary: summary,
            created_at: new Date().toISOString()
          });
      } catch (geminiError) {
        console.warn('Gemini processing failed:', geminiError);
      }
    }

    // Then try other models
    const models = Object.entries(AI_MODELS)
      .filter(([key]) => key !== 'gemini-pro' && key !== 'gemini-pro-vision')
      .map(([key]) => key);

    for (const model of models) {
      try {
        const summary = await generateChatCompletion(
          [{
            role: 'user',
            content: "You are a document processing assistant. Your task is to understand and summarize the following document. This will be used to provide context for future conversations. Here's the document:\n\n" + text
          }],
          '',
          model as any
        );

        // Store the summary
        await supabase
          .from('document_summaries')
          .insert({
            id: uuidv4(),
            document_id: documentId,
            model: model,
            summary: summary,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.warn(`Processing with ${model} failed:`, error);
      }
    }
  } catch (error) {
    console.error('Error feeding document to AI:', error);
  }
}

export async function processDocument(
  documentId: string,
  filePath: string,
  mimeType: string,
  userId: string
) {
  const supabase = createServerSupabaseClient();
  
  try {
    console.log('Starting document processing for:', { documentId, filePath, mimeType });
    
    // Update document status to processing
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      throw new Error(`Error updating document status: ${updateError.message}`);
    }

    // Download the file from Supabase Storage
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(filePath);
    
    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Error downloading file: ${downloadError?.message || 'File not found'}`);
    }

    console.log('File downloaded successfully, size:', fileData.size);

    // Verify file data is not empty
    if (fileData.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    // Convert file to text based on mime type
    let text = '';
    const blob = new Blob([fileData], { type: mimeType });
    
    try {
      console.log('Converting file to text...');
      if (mimeType === 'application/pdf') {
        const loader = new PDFLoader(blob);
        const docs = await loader.load();
        text = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n');
        console.log('PDF converted to text, length:', text.length);
      } else if (mimeType === 'text/plain') {
        const loader = new TextLoader(blob);
        const docs = await loader.load();
        text = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n');
        console.log('Text file processed, length:', text.length);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const loader = new DocxLoader(blob);
        const docs = await loader.load();
        text = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n');
        console.log('DOCX converted to text, length:', text.length);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (processingError) {
      console.error('Error converting file to text:', processingError);
      // Update document status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: `Error processing file: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
      throw processingError;
    }

    if (!text || text.trim().length === 0) {
      console.error('No text extracted from document');
      // Update document status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: 'Failed to extract text from document or document is empty',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
      throw new Error('Failed to extract text from document or document is empty');
    }

    // Feed document to AI models
    console.log('Feeding document to AI models...');
    await feedDocumentToAI(text, documentId);

    // Split text into chunks
    console.log('Splitting text into chunks...');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    
    const chunks = await splitter.splitText(text);
    console.log('Text split into', chunks.length, 'chunks');
    
    if (chunks.length === 0) {
      console.error('No chunks created from text');
      // Update document status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: 'No text chunks could be created from the document',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
      throw new Error('No text chunks could be created from the document');
    }

    // Generate embeddings and store chunks
    let successCount = 0;
    console.log('Generating embeddings for chunks...');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        // Generate embedding using Gemini
        const embedding = await getEmbedding(chunk);
        console.log(`Generated embedding for chunk ${i + 1}, length:`, embedding.length);
        
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
          console.error(`Error inserting chunk ${i + 1}:`, insertError);
          throw new Error(`Error inserting chunk: ${insertError.message}`);
        }
        successCount++;
        console.log(`Successfully processed chunk ${i + 1}`);
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        // If we hit Gemini quota limit, update document status and throw
        if (chunkError instanceof Error && chunkError.message.includes('quota')) {
          await supabase
            .from('documents')
            .update({ 
              status: 'failed',
              error_message: 'Gemini API quota exceeded. Please try again later or upgrade your plan.',
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          throw chunkError;
        }
        // For other errors, continue with next chunk
        console.error(`Error processing chunk ${i}:`, chunkError);
      }
    }

    console.log('Finished processing chunks. Success count:', successCount);

    // Only mark as completed if we successfully processed at least one chunk
    if (successCount > 0) {
      console.log('Updating document status to completed');
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document status to completed:', updateError);
        throw new Error(`Error updating document status: ${updateError.message}`);
      }
    } else {
      console.error('No chunks were successfully processed');
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: 'Failed to process any chunks from the document',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document status to failed:', updateError);
      }
      throw new Error('Failed to process any chunks from the document');
    }
    
    return { success: true, chunkCount: successCount };
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document status to failed if not already updated
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status to failed:', updateError);
    }
    
    throw error;
  }
} 