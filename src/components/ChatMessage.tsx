import React from 'react';
import { User, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div 
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div 
        className={`
          max-w-[80%] p-3 rounded-lg shadow-sm
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 rounded-bl-none'
          }
        `}
      >
        <div className="flex items-start">
          {!isUser && (
            <div className="flex-shrink-0 mr-2">
              <Bot className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div className="flex-1">
            <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {message.text}
            </p>
            <p className={`text-xs mt-1 ${isUser ? 'text-primary-200' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {isUser && (
            <div className="flex-shrink-0 ml-2">
              <User className="h-5 w-5 text-primary-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;