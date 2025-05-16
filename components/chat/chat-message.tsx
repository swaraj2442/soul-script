import { Message } from '@/lib/types';
import { User, Bot, FileText, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
          message.role === 'user' ? 'bg-primary text-primary-foreground ml-2' : 'bg-muted mr-2'
        }`}>
          {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className={`space-y-2 p-3 rounded-lg ${
          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {hasSources && message.sources && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Sources from document:</span>
              </div>
              <div className="mt-1 space-y-1">
                {message.sources.map((source, index) => (
                  <TooltipProvider key={source.chunk_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground hover:text-foreground cursor-help">
                          {index + 1}. {source.content.substring(0, 100)}...
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[300px]">
                        <p className="text-sm">{source.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Similarity: {(source.similarity * 100).toFixed(1)}%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 