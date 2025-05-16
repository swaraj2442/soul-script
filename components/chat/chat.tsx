import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import { ChatInput } from './chat-input';
import { ChatMessage } from './chat-message';
import { supabase } from '@/lib/supabase/client';
import { getEmbedding } from '@/lib/openai/client';
import { toast } from 'sonner';

interface ChatProps {
  documentId: string;
}

export function Chat({ documentId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get the session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Generate embedding for the question
      const questionEmbedding = await getEmbedding(content);

      // Search for relevant document chunks
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'match_documents',
        {
          target_document_id: documentId,
          match_count: 5,
          match_threshold: 0.7,
          query_embedding: questionEmbedding,
          user_id: session.user.id
        }
      );

      if (searchError) {
        console.error('Search error:', searchError);
        throw new Error('Failed to search documents');
      }

      if (!searchResults || searchResults.length === 0) {
        toast.error('No relevant context found in the document');
        return;
      }

      // Prepare context from search results
      const context = searchResults
        .map((result: any) => result.content)
        .join('\n\n');

      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context,
          documentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
        sources: data.sources,
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error in chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
} 