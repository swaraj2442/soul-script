export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: {
    document_id: string;
    chunk_id: string;
    content: string;
    similarity: number;
  }[];
} 