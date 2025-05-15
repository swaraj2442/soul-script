export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          file_path: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
          file_size: number
          mime_type: string
          error_message?: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          file_path: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          file_size: number
          mime_type: string
          error_message?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          file_path?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          file_size?: number
          mime_type?: string
          error_message?: string
        }
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          embedding: number[]
          chunk_index: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          embedding: number[]
          chunk_index: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          embedding?: number[]
          chunk_index?: number
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      citations: {
        Row: {
          id: string
          message_id: string
          document_id: string
          chunk_id: string
          start_char: number
          end_char: number
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          document_id: string
          chunk_id: string
          start_char: number
          end_char: number
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          document_id?: string
          chunk_id?: string
          start_char?: number
          end_char?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}