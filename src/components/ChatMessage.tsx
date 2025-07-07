import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getShortlink } from '../services/api';

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
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    
    // Optional: Show a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg z-50';
    toast.textContent = 'Copied to clipboard!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };
  
  // Function to make links clickable and copyable
  const renderLink = (url: string, index: number = 0) => {
    const resolvedUrl = resolvedUrls[url];
    const isLoading = loadingUrls.has(url);
    
    // Determine what URL to display and use
    const displayUrl = resolvedUrl || url;
    const targetUrl = resolvedUrl || url;
    
    return (
      <span key={`link-${index}`} className="inline-flex items-center">
        <a 
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all inline-flex items-center"
          onClick={(e) => {
            e.preventDefault();
            window.open(targetUrl, '_blank');
          }}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <span className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-1"></span>
              Resolving...
            </span>
          ) : (
            <>
              {displayUrl}
              <ExternalLink className="h-3 w-3 ml-1 inline-block flex-shrink-0" />
            </>
          )}
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(targetUrl);
          }}
          className="ml-1 px-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 inline-flex items-center flex-shrink-0"
          aria-label="Copy link"
          title="Copy link"
          disabled={isLoading}
        >
          <Copy className="h-3 w-3" />
        </button>
      </span>
    );
  };

  // Function to format text with line breaks and proper handling of numbered lists
  const formatText = (text: string) => {
    // First handle escaped newlines
    let formattedText = text.replace(/\\n/g, '\n');
    
    // Detect and format numbered lists (e.g., "1. Option")
    formattedText = formattedText.replace(/^(\d+)\.\s/gm, '$1. ');
    
    return formattedText;
  };

  // Extract URLs from text for special handling
  const extractUrls = (text: string): { urls: string[], indices: number[][] } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls: string[] = [];
    const indices: number[][] = [];
    
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[0]);
      indices.push([match.index, match.index + match[0].length]);
    }
    
    return { urls, indices };
  };

  // Function to check if a URL is a short URL (matches your API pattern)
  const isShortUrl = (url: string): boolean => {
    // Check if it matches the pattern for short URLs like https://carepay.money/s/E40528y
    const shortUrlPattern = /^https?:\/\/[^\/]+\/s\/[a-zA-Z0-9]+\/?$/;
    return shortUrlPattern.test(url);
  };
  
  // Function to extract short code from URL
  const extractShortCode = (url: string): string | null => {
    // Extract shortcode from URLs like https://carepay.money/s/E40528y
    const match = url.match(/\/s\/([a-zA-Z0-9]+)\/?$/);
    return match ? match[1] : null;
  };
  
  // Function to resolve short URL to long URL
  const resolveShortUrl = async (shortUrl: string) => {
    if (resolvedUrls[shortUrl] || loadingUrls.has(shortUrl)) {
      return;
    }
    
    setLoadingUrls(prev => new Set(prev).add(shortUrl));
    
    try {
      const shortCode = extractShortCode(shortUrl);
      if (shortCode) {
        const response = await getShortlink(shortCode);
        if (response.data.status === 'success' && response.data.long_url) {
          setResolvedUrls(prev => ({
            ...prev,
            [shortUrl]: response.data.long_url
          }));
        } else {
          // If API returns error status, keep original URL
          console.warn('Short URL resolution failed:', response.data.message);
          setResolvedUrls(prev => ({
            ...prev,
            [shortUrl]: shortUrl
          }));
        }
      } else {
        // If we can't extract short code, keep original URL
        setResolvedUrls(prev => ({
          ...prev,
          [shortUrl]: shortUrl
        }));
      }
    } catch (error) {
      console.error('Error resolving short URL:', error);
      // Keep the original URL if resolution fails
      setResolvedUrls(prev => ({
        ...prev,
        [shortUrl]: shortUrl
      }));
    } finally {
      setLoadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(shortUrl);
        return newSet;
      });
    }
  };
  
  // Effect to resolve short URLs when message changes
  useEffect(() => {
    const urls = extractUrls(message.text).urls;
    urls.forEach(url => {
      if (isShortUrl(url)) {
        resolveShortUrl(url);
      }
    });
  }, [message.text]);

  return (
    <div 
      className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div 
        className={`
          max-w-[70%] p-2 rounded-lg shadow-sm
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 rounded-bl-none'
          }
        `}
      >
        <div className="flex items-start">
          {!isUser && (
            <div className="flex-shrink-0 mr-1.5">
              <Bot className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div className="flex-1">
            <div 
              className={`prose prose-sm ${isUser ? 'text-white' : 'text-gray-800'} max-w-none break-words leading-snug`}
              style={{ lineHeight: 1.2 }}
            >
              <ReactMarkdown
                components={{
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-1 mb-0" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-md font-bold mt-1 mb-0" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  a: ({node, href, ...props}) => {
                    if (href && /^https?:\/\//.test(href)) {
                      const isShort = isShortUrl(href);
                      const resolvedUrl = resolvedUrls[href];
                      const isLoading = loadingUrls.has(href);
                      
                      if (isShort && !resolvedUrl && !isLoading) {
                        // Trigger resolution for short URLs that haven't been resolved yet
                        resolveShortUrl(href);
                      }
                      
                      return renderLink(href);
                    }
                    return <a {...props} href={href} />;
                  },
                  p: ({node, ...props}) => {
                    const content = props.children?.toString() || '';
                    const { urls, indices } = extractUrls(content);
                    
                    if (urls.length > 0) {
                      const parts = [];
                      let lastIndex = 0;
                      
                      indices.forEach((range, i) => {
                        // Add text before URL
                        if (range[0] > lastIndex) {
                          parts.push(
                            <React.Fragment key={`text-${i}-before`}>
                              {content.substring(lastIndex, range[0])}
                            </React.Fragment>
                          );
                        }
                        
                        // Add rendered URL
                        parts.push(renderLink(urls[i], i));
                        
                        lastIndex = range[1];
                      });
                      
                      // Add text after last URL
                      if (lastIndex < content.length) {
                        parts.push(
                          <React.Fragment key="text-after">
                            {content.substring(lastIndex)}
                          </React.Fragment>
                        );
                      }
                      
                      return <p className="my-0 leading-tight" style={{ marginBottom: '0.25rem' }}>{parts}</p>;
                    }
                    
                    return <p className="my-0 leading-tight" style={{ marginBottom: '0.25rem' }} {...props} />;
                  },
                  li: ({node, ...props}) => <li className="my-0 leading-tight pl-0" {...props} />,
                  ol: ({node, ...props}) => <ol className="pl-4 my-0 space-y-0 list-decimal" {...props} />,
                  ul: ({node, ...props}) => <ul className="pl-4 my-0 space-y-0 list-disc" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="pl-2 border-l-2 border-gray-300 italic text-gray-700 my-1" {...props} />
                  ),
                  pre: ({node, ...props}) => <pre className="bg-gray-100 p-1 rounded my-1 text-xs overflow-x-auto" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-1 rounded text-xs" {...props} />
                }}
              >
                {formatText(message.text)}
              </ReactMarkdown>
            </div>
            <p className={`text-xs mt-0.5 ${isUser ? 'text-primary-200' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {isUser && (
            <div className="flex-shrink-0 ml-1.5">
              <User className="h-5 w-5 text-primary-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;