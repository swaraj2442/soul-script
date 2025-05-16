import { processDocument } from '../document-processor';
import { createServerSupabaseClient } from '../../supabase/client';
import { getEmbedding } from '../../openai/client';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';

// Mock dependencies
jest.mock('../../supabase/client');
jest.mock('../../openai/client');
jest.mock('@langchain/community/document_loaders/fs/pdf');
jest.mock('langchain/document_loaders/fs/text');
jest.mock('@langchain/community/document_loaders/fs/docx');
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

describe('Document Processor', () => {
  const mockDocumentId = 'test-doc-id';
  const mockFilePath = 'test/path/file.pdf';
  const mockUserId = 'test-user-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    (createServerSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      storage: {
        from: jest.fn().mockReturnThis(),
        download: jest.fn()
      },
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis()
    });

    // Mock getEmbedding
    (getEmbedding as jest.Mock).mockResolvedValue(new Array(1536).fill(0));
  });

  describe('processDocument', () => {
    it('should successfully process a PDF document', async () => {
      // Mock PDF loader
      const mockPdfLoader = {
        load: jest.fn().mockResolvedValue([
          { pageContent: 'Test PDF content' }
        ])
      };
      (PDFLoader as jest.Mock).mockImplementation(() => mockPdfLoader);

      // Mock Supabase responses
      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob(['test'], { type: 'application/pdf' }),
        error: null
      });
      mockSupabase.from().update.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const result = await processDocument(
        mockDocumentId,
        mockFilePath,
        'application/pdf',
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(0);
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed'
        })
      );
    });

    it('should handle empty file data', async () => {
      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob([], { type: 'application/pdf' }),
        error: null
      });

      await expect(processDocument(
        mockDocumentId,
        mockFilePath,
        'application/pdf',
        mockUserId
      )).rejects.toThrow('Downloaded file is empty');

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      );
    });

    it('should handle unsupported file types', async () => {
      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob(['test'], { type: 'unsupported/type' }),
        error: null
      });

      await expect(processDocument(
        mockDocumentId,
        mockFilePath,
        'unsupported/type',
        mockUserId
      )).rejects.toThrow('Unsupported file type');

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      );
    });

    it('should handle text file processing', async () => {
      // Mock Text loader
      const mockTextLoader = {
        load: jest.fn().mockResolvedValue([
          { pageContent: 'Test text content' }
        ])
      };
      (TextLoader as jest.Mock).mockImplementation(() => mockTextLoader);

      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob(['test'], { type: 'text/plain' }),
        error: null
      });
      mockSupabase.from().update.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const result = await processDocument(
        mockDocumentId,
        mockFilePath,
        'text/plain',
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(0);
    });

    it('should handle DOCX file processing', async () => {
      // Mock DOCX loader
      const mockDocxLoader = {
        load: jest.fn().mockResolvedValue([
          { pageContent: 'Test DOCX content' }
        ])
      };
      (DocxLoader as jest.Mock).mockImplementation(() => mockDocxLoader);

      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        error: null
      });
      mockSupabase.from().update.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const result = await processDocument(
        mockDocumentId,
        mockFilePath,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(0);
    });

    it('should handle embedding generation failure', async () => {
      // Mock PDF loader
      const mockPdfLoader = {
        load: jest.fn().mockResolvedValue([
          { pageContent: 'Test PDF content' }
        ])
      };
      (PDFLoader as jest.Mock).mockImplementation(() => mockPdfLoader);

      // Mock getEmbedding to fail
      (getEmbedding as jest.Mock).mockRejectedValue(new Error('Embedding generation failed'));

      const mockSupabase = createServerSupabaseClient();
      mockSupabase.storage.download.mockResolvedValue({
        data: new Blob(['test'], { type: 'application/pdf' }),
        error: null
      });
      mockSupabase.from().update.mockResolvedValue({ error: null });

      await expect(processDocument(
        mockDocumentId,
        mockFilePath,
        'application/pdf',
        mockUserId
      )).rejects.toThrow('Failed to process any chunks from the document');

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      );
    });
  });
}); 