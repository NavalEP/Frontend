import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  
  // Function to make links clickable and copyable
  const renderLink = (url: string) => {
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => {
          e.preventDefault();
          window.open(url, '_blank');
        }}
      >
        {url}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(url);
          }}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Copy
        </button>
      </a>
    );
  };

  // Function to format text with line breaks
  const formatText = (text: string) => {
    // Replace \n with actual line breaks for markdown
    return text.replace(/\\n/g, '\n');
  };

  return (
    <div 
      className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
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
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
          )}
          <div className="flex-1">
            <div 
              className={`prose prose-sm ${isUser ? 'text-white' : 'text-gray-800'} max-w-none whitespace-pre-line leading-snug`}
            >
              <ReactMarkdown
                components={{
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-1.5 mt-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  a: ({node, href, ...props}) => href ? renderLink(href) : <a {...props} />,
                  p: ({node, ...props}) => <p className="mb-1.5 whitespace-pre-line leading-snug" {...props} />,
                  li: ({node, ...props}) => <li className="mb-0.5 leading-snug" {...props} />
                }}
              >
                {formatText(message.text)}
              </ReactMarkdown>
            </div>
            <p className={`text-xs mt-1.5 ${isUser ? 'text-primary-200' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {isUser && (
            <div className="flex-shrink-0 ml-2">
              <User className="h-6 w-6 text-primary-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;