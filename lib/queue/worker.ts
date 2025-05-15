import { Worker } from 'bullmq';
import { QUEUE_NAME, workerOptions } from './config';
import { processDocument } from '../utils/document-processor';
import { createServerSupabaseClient } from '../supabase/client';

// Create a worker to process the document queue
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    const { documentId, filePath, mimeType, userId } = job.data;
    const supabase = createServerSupabaseClient();
    
    try {
      // Update document status to processing
      await supabase
        .from('documents')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', documentId);
      
      // Process the document
      await processDocument(documentId, filePath, mimeType, userId);
      
      // Update document status to completed
      await supabase
        .from('documents')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', documentId);
      
      console.log(`Job ${job.id} completed successfully`);
      return { success: true, documentId };
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      
      // Update document status to failed with error message
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', documentId);
      
      throw error;
    }
  },
  workerOptions
);

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed successfully`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} has failed with error:`, error);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

console.log('Document processing worker started');

// Keep the process running
process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

// This file is meant to be run as a standalone worker process
if (require.main === module) {
  console.log('Worker is running...');
}