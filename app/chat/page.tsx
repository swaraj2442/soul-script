"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Send, 
  Info, 
  User, 
  Bot, 
  Loader2, 
  ChevronLeft, 
  Sparkles,
  Upload,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { DocumentUpload } from '@/components/documents/document-upload';
import { toast } from 'sonner';
import { AI_MODELS, AIModel } from '@/lib/openai/client';
import { SpeechInput } from '@/components/chat/speech-input'
import { GradientAnimation } from '@/components/ui/gradient-animation'

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Source {
  document_id: string;
  chunk_id: string;
  content: string;
  similarity: number;
}

interface Document {
  id: string;
  name: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('document');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | 'auto'>('auto');
  const [documentInfo, setDocumentInfo] = useState<{ name: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        router.push('/auth/login');
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);

      // Fetch user's documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (!docsError && docs) {
        setDocuments(docs);
      }

      // If we have a document ID from URL, set it as selected
      if (documentId) {
        setSelectedDocument(documentId);
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('name')
          .eq('id', documentId)
          .single();

        if (!docError && docData) {
          setDocumentInfo(docData);
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I can help you understand ${docData.name}. What would you like to know about it?`,
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! Please select a document to start chatting about it.',
            timestamp: new Date(),
          },
        ]);
      }
    };
    
    checkAuth();
  }, [router, documentId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      // Add loading message
      const loadingId = `loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: loadingId,
          role: 'assistant',
          content: '...',
          timestamp: new Date(),
        },
      ]);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Format previous messages for context
      const prevMessages = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      // Send request to API
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          question: input,
          conversationId,
          previousMessages: prevMessages,
          model: selectedModel,
          documentId: selectedDocument
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      // Add bot response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer || 'Sorry, I could not generate a response.',
          timestamp: new Date(),
        },
      ]);
      
      // Update conversation ID and sources
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      if (data.sources) {
        setSources(data.sources);
      }
      
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get response. Please try again.');
      
      // Remove loading message and add error message
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading')));
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleDocumentUpload = () => {
    setShowUploader(false);
    toast.success('Document uploaded and queued for processing');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-[1400px] h-[calc(100vh-64px)] flex flex-col mx-auto px-4 relative">
      <GradientAnimation
        colors={["#818CF8", "#A78BFA", "#F9A8D4"]}
        duration={45}
        blur={150}
        opacity={0.12}
        size={120}
      />
      <div className="max-w-[1200px] mx-auto w-full h-full flex flex-col relative">
        <div className="flex items-center py-4 border-b bg-background/50 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Document Chat</h1>
          <div className="ml-auto flex gap-3">
            <Select
              value={selectedDocument || ''}
              onValueChange={(value) => {
                setSelectedDocument(value);
                router.push(`/chat?document=${value}`);
              }}
            >
              <SelectTrigger className="w-[200px] h-11">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <SelectValue placeholder="Select document" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as AIModel | 'auto')}
            >
              <SelectTrigger className="w-[180px] h-11">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <SelectValue placeholder="Select model" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowUploader(!showUploader)}
                    className="h-11 w-11"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload a document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {showUploader && (
          <Card className="p-4 my-4 border-2 hover:border-primary/50 transition-colors hover:shadow-lg bg-background/50 backdrop-blur-sm">
            <DocumentUpload onUploadComplete={handleDocumentUpload} />
          </Card>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[80%] lg:max-w-[70%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-3'
                      : 'bg-primary/10 mr-3'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>
                
                <div
                  className={`space-y-2 p-4 rounded-lg backdrop-blur-sm ${
                    message.role === 'user'
                      ? 'bg-primary/90 text-primary-foreground'
                      : 'bg-muted/80'
                  }`}
                >
                  {message.id.startsWith('loading') ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p>Thinking...</p>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-base">{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Sources section */}
          {sources.length > 0 && (
            <div className="mt-6">
              <div className="rounded-lg bg-muted/50 p-4 border-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-medium">Sources</h3>
                </div>
                <div className="space-y-3">
                  {sources.map((source, index) => (
                    <div key={index} className="text-sm bg-background p-3 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <div className="line-clamp-3 text-muted-foreground">
                            {source.content}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground/70">
                            Relevance: {(source.similarity * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="sticky bottom-0 bg-background/50 backdrop-blur-sm border-t p-4">
          <div className="flex gap-3">
            <Input
              placeholder={selectedDocument ? "Ask a question about the selected document..." : "Please select a document first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || !selectedDocument}
              className="flex-1 h-11 text-base"
            />
            <SpeechInput
              onTranscript={(text) => {
                setInput(text);
                if (text.trim()) {
                  handleSendMessage();
                }
              }}
              disabled={isSending || !selectedDocument}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isSending || !selectedDocument}
              className="h-11 w-11"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        
          <div className="flex justify-between items-center mt-3">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              {selectedDocument 
                ? "Ask questions about the selected document"
                : "Please select a document to start chatting"}
            </div>
            {selectedModel !== 'auto' && (
              <div className="text-sm text-muted-foreground">
                Using {AI_MODELS[selectedModel].name}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}