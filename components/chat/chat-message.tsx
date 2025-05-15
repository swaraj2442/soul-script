import { Message } from '@/lib/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
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
        </div>
      </div>
    </div>
  );
} 