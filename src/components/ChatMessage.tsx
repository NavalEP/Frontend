import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, Share2, Search, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getShortlink, searchTreatments } from '../services/api';
import { smartShare, isNativeSharingSupported } from '../utils/shareUtils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  imagePreview?: string; // Base64 image preview for uploaded files
  fileName?: string; // Original file name for uploaded files
}

interface ChatMessageProps {
  message: Message;
  onButtonClick?: (optionText: string, optionValue: string, messageId: string) => void;
  selectedOption?: string;
  disabledOptions?: boolean;
  onLinkClick?: (url: string) => void;
  onTreatmentSelect?: (treatmentName: string, messageId: string) => void;
  selectedTreatment?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onButtonClick, selectedOption, disabledOptions, onLinkClick, onTreatmentSelect, selectedTreatment }) => {
  const isUser = message.sender === 'user';
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [showTreatmentSearch, setShowTreatmentSearch] = useState(false);
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState('');
  const [treatmentSearchResults, setTreatmentSearchResults] = useState<any[]>([]);
  const [isSearchingTreatments, setIsSearchingTreatments] = useState(false);
  
  // Check if this is an OCR result message
  const isOcrResult = message.text.includes('📋 **Aadhaar Card Details Extracted Successfully!**') || 
                     message.text.includes('📋 **PAN Card Details Extracted Successfully!**');
  
  // Check if this is a treatment name question
  const isTreatmentNameQuestion = message.text.toLowerCase().includes('what is the name of treatment') || 
                                 message.text.toLowerCase().includes('treatment name') ||
                                 message.text.toLowerCase().includes('name of treatment');
  
  // Function to detect if message contains question with options
  const detectQuestionWithOptions = (text: string) => {
    // Check if this is patient information format - don't show buttons for these
    const patientInfoPatterns = [
      /Patient's full name/,
      /Patient's phone number/,
      /cost of the treatment/,
      /Monthly income/
    ];
    
    const isPatientInfo = patientInfoPatterns.some(pattern => pattern.test(text));
    if (isPatientInfo) {
      return null; // Don't show buttons for patient information
    }
    
    // Check for specific patterns like "Please Enter input 1 or 2 only"
    const inputPattern = /(.*?)\n\n?Please Enter input (\d+) or (\d+) only/i;
    const inputMatch = text.match(inputPattern);
    if (inputMatch) {
      const questionText = inputMatch[1].trim();
      const option1 = inputMatch[2];
      const option2 = inputMatch[3];
      
      // Extract options from the question text
      const lines = questionText.split('\n');
      const options = lines
        .filter(line => line.trim().length > 0)
        .map(line => line.trim())
        .filter(line => !line.includes('Please Enter input'));

      if (options.length >= 2) {
        return { 
          question: options[0], 
          options: options.slice(1),
          optionNumbers: [option1, option2]
        };
      }
    }

    // Check for "Please Enter input between 1 to X only" pattern
    const rangePattern = /(.*?)\n\n?Please Enter input between (\d+) to (\d+) only/i;
    const rangeMatch = text.match(rangePattern);
    if (rangeMatch) {
      const questionText = rangeMatch[1].trim();
      const startNum = parseInt(rangeMatch[2]);
      const endNum = parseInt(rangeMatch[3]);
      
      // Extract options from the question text
      const lines = questionText.split('\n');
      const options = lines
        .filter(line => line.trim().length > 0)
        .map(line => line.trim())
        .filter(line => !line.includes('Please Enter input'));

      if (options.length >= 2) {
        // Generate option numbers from start to end
        const optionNumbers = [];
        for (let i = startNum; i <= endNum; i++) {
          optionNumbers.push(i.toString());
        }
        
        return { 
          question: options[0], 
          options: options.slice(1),
          optionNumbers
        };
      }
    }

    // Patterns for questions with numbered options
    const questionPatterns = [
      /(.*?)\n\n?(\d+\.\s*[^\n]+(?:\n\d+\.\s*[^\n]+)*)/s,
      /(.*?)\n\n?(\d+\s*[^\n]+(?:\n\d+\s*[^\n]+)*)/s,
      /(.*?)\n\n?([A-Z][A-Z\s]+(?:\n[A-Z][A-Z\s]+)*)/s
    ];

    for (const pattern of questionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const question = match[1].trim();
        const optionsText = match[2].trim();
        
        // Parse options and extract numbers
        const optionLines = optionsText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        const options: string[] = [];
        const optionNumbers: string[] = [];
        
        optionLines.forEach(line => {
          const numberMatch = line.match(/^(\d+)\.?\s*(.+)$/);
          if (numberMatch) {
            optionNumbers.push(numberMatch[1]);
            options.push(numberMatch[2].trim());
          } else {
            // For non-numbered options, use the line as is
            options.push(line);
          }
        });

        if (options.length >= 2) {
          return { 
            question, 
            options,
            optionNumbers: optionNumbers.length > 0 ? optionNumbers : null
          };
        }
      }
    }

    return null;
  };

  // Function to handle button clicks
  const handleButtonClick = (option: string, index: number) => {
    if (onButtonClick) {
      // Determine what value to send to API (number if available, otherwise option text)
      const optionText = option;
      const optionValue = questionData?.optionNumbers && questionData.optionNumbers[index] 
        ? questionData.optionNumbers[index] 
        : option;
      
      // Send both option text (for input field) and option value (for API)
      onButtonClick(optionText, optionValue, message.id);
    }
  };

  // Function to handle treatment search
  const handleTreatmentSearch = async (query: string) => {
    if (!query.trim()) {
      setTreatmentSearchResults([]);
      return;
    }

    setIsSearchingTreatments(true);
    try {
      const response = await searchTreatments(query, 10);
      if (response.data.status === 'success') {
        setTreatmentSearchResults(response.data.data.treatments);
      } else {
        setTreatmentSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching treatments:', error);
      setTreatmentSearchResults([]);
    } finally {
      setIsSearchingTreatments(false);
    }
  };

  // Function to handle treatment selection
  const handleTreatmentSelect = (treatmentName: string, isOther: boolean = false) => {
    const finalTreatmentName = isOther ? `Other: ${treatmentSearchQuery}` : treatmentName;
    setShowTreatmentSearch(false);
    setTreatmentSearchResults([]);
    setTreatmentSearchQuery('');
    
    if (onTreatmentSelect) {
      onTreatmentSelect(finalTreatmentName, message.id);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (treatmentSearchQuery.trim()) {
        handleTreatmentSearch(treatmentSearchQuery);
      } else {
        setTreatmentSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [treatmentSearchQuery]);

  // Extract question and options from message
  const questionData = detectQuestionWithOptions(message.text);
  

  
  // Show button options if there's question data
  const shouldShowButtons = questionData;
  
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

  const handleNativeShare = async (url: string) => {
    try {
      await smartShare({
        title: 'Shared from Careena',
        text: `Check out this link: ${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to WhatsApp if native sharing fails
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };
  
  // Function to make links clickable and copyable
  const renderLink = (url: string, index: number = 0) => {
    const resolvedUrl = resolvedUrls[url];
    const isLoading = loadingUrls.has(url);
    
    // Determine what URL to display and use
    const displayUrl = resolvedUrl || url;
    const targetUrl = resolvedUrl || url;
    
    return (
      <span key={`link-${index}`} className="inline-block">
        <span className="inline-flex items-center">
          <a 
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all inline-flex items-center"
            onClick={(e) => {
              e.preventDefault();
              if (onLinkClick) {
                onLinkClick(targetUrl);
              } else {
                window.open(targetUrl, '_blank');
              }
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNativeShare(targetUrl);
            }}
            className="ml-1 px-1 rounded-md bg-green-100 hover:bg-green-200 text-green-600 inline-flex items-center flex-shrink-0"
            aria-label="Share"
            title={isNativeSharingSupported() ? "Share" : "Share to WhatsApp"}
            disabled={isLoading}
          >
            <Share2 className="h-3 w-3" />
          </button>
        </span>
      </span>
    );
  };

  const renderLinkButton = (url: string, index: number = 0) => {
    const resolvedUrl = resolvedUrls[url];
    const isLoading = loadingUrls.has(url);
    const targetUrl = resolvedUrl || url;
    
    return (
      <div key={`link-button-${index}`} className="mt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onLinkClick) {
              onLinkClick(targetUrl);
            } else {
              window.open(targetUrl, '_blank');
            }
          }}
          className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <span className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></span>
              Loading...
            </span>
          ) : (
            'Click here to open link'
          )}
        </button>
        <div className="mt-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(targetUrl);
            }}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            disabled={isLoading}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNativeShare(targetUrl);
            }}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            disabled={isLoading}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>
    );
  };

  // Function to format text with line breaks and proper handling of numbered lists
  const formatText = (text: string) => {
    // First handle escaped newlines
    let formattedText = text.replace(/\\n/g, '\n');
    
    // If this message has question options, format it to show only the question part
    if (questionData) {
      // Remove the options part and "Please Enter input" instructions
      formattedText = formattedText
        .replace(/\n\n?Please Enter input.*$/i, '') // Remove input instructions
        .replace(/\n\n?\d+\.\s*.*$/gm, '') // Remove numbered options
        .replace(/\n\n?[A-Z][A-Z\s]+$/gm, '') // Remove all caps options
        .trim();
    }
    
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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
      style={{
        marginBottom: '0.1rem',
        marginTop: '0.2rem',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-1.5 md:mr-2">
          <img
            src="/images/careeena-avatar.jpg"
            alt="Careena"
            className="h-5 w-5 md:h-6 md:w-6 rounded-full object-cover"
          />
        </div>
      )}
      
      <div className={`inline-block max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div 
          className={`
            whatsapp-message 
            ${isUser 
              ? 'bg-[#DCF8C6] text-gray-800 rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
              : isOcrResult
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg border-2 border-blue-200 shadow-md'
              : 'bg-white text-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg'
            } 
            px-2.5 md:px-3 py-1.5 shadow-sm relative text-sm leading-tight
          `}
        >
          <div className="flex flex-col">
          <div 
            className={`prose ${isUser ? 'prose-xs text-gray-800' : 'prose-sm text-gray-800'} max-w-none break-words leading-tight`}
            style={{ lineHeight: isUser ? 1.2 : 1.3 }}
          >
            <ReactMarkdown
              components={{
                                 h3: ({node, ...props}) => <h3 className={`font-bold mt-1 mb-1 ${isUser ? 'text-sm' : 'text-base'}`} {...props} />,
                 h4: ({node, ...props}) => <h4 className={`font-bold mt-1 mb-1 ${isUser ? 'text-xs' : 'text-sm'}`} {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
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
                    
                    return (
                      <div className="my-0 leading-tight" style={{ marginBottom: isUser ? '0.0625rem' : '0.125rem' }}>
                        <span>{parts}</span>
                        {urls.map((url, i) => renderLinkButton(url, i))}
                      </div>
                    );
                  }
                  
                  return <p className="my-0 leading-tight" style={{ marginBottom: isUser ? '0.0625rem' : '0.125rem' }} {...props} />;
                },
                                 li: ({node, ...props}) => <li className={`leading-tight pl-0 ${isUser ? 'my-0' : 'my-0.5'}`} {...props} />,
                 ol: ({node, ...props}) => <ol className={`${isUser ? 'pl-2 my-0.5 space-y-0' : 'pl-3 my-1 space-y-0.5'} list-decimal`} {...props} />,
                 ul: ({node, ...props}) => <ul className={`${isUser ? 'pl-2 my-0.5 space-y-0' : 'pl-3 my-1 space-y-0.5'} list-disc`} {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                                 blockquote: ({node, ...props}) => (
                   <blockquote className={`border-l-2 border-gray-300 italic text-gray-700 ${isUser ? 'pl-1 my-0.5' : 'pl-2 my-1'}`} {...props} />
                 ),
                 pre: ({node, ...props}) => <pre className={`bg-gray-100 rounded overflow-x-auto ${isUser ? 'p-1 my-0.5 text-xs' : 'p-1.5 my-1 text-xs'}`} {...props} />,
                code: ({node, ...props}) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs" {...props} />
              }}
            >
              {formatText(message.text)}
            </ReactMarkdown>
          </div>
          
          {/* Image Preview for uploaded files */}
          {message.imagePreview && (
            <div className="mt-2">
              <div className="relative inline-block">
                <img
                  src={message.imagePreview}
                  alt={message.fileName || 'Uploaded file'}
                  className="max-w-full max-h-48 rounded-lg border border-gray-200 shadow-sm object-contain"
                  style={{ maxWidth: '200px' }}
                />
                {message.fileName && (
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {message.fileName}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* WhatsApp-style button options */}
          {!isUser && shouldShowButtons && (
            <div className="mt-2 space-y-1.5">
              {questionData.options.map((option, index) => {
                const optionValue = questionData.optionNumbers && questionData.optionNumbers[index] 
                  ? questionData.optionNumbers[index] 
                  : option;
                const isSelected = selectedOption === optionValue;
                const isDisabled = disabledOptions || false;
                
                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && handleButtonClick(option, index)}
                    disabled={isDisabled}
                    className={`w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 border rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 hover:shadow-sm chat-button text-xs md:text-sm ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                    }`}
                  >
                    {option}
                    {isDisabled && (
                      <span className="ml-1 md:ml-2 text-xs text-gray-400">
                        {isSelected ? "(Selected)" : "(Answered)"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Treatment Search Component */}
          {!isUser && isTreatmentNameQuestion && (
            <div className="mt-3 space-y-2">
              {!selectedTreatment ? (
                <>
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                        <input
                          type="text"
                          value={treatmentSearchQuery}
                          onChange={(e) => setTreatmentSearchQuery(e.target.value)}
                          placeholder="Search for treatment..."
                          className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                          onFocus={() => setShowTreatmentSearch(true)}
                        />
                      </div>
                      <button
                        onClick={() => setShowTreatmentSearch(!showTreatmentSearch)}
                        className="p-1.5 md:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ArrowDown className={`h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600 transition-transform ${showTreatmentSearch ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showTreatmentSearch && (treatmentSearchQuery.trim() || isSearchingTreatments) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {isSearchingTreatments ? (
                          <div className="p-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            Searching treatments...
                          </div>
                        ) : treatmentSearchResults.length > 0 ? (
                          <div className="py-1">
                            {treatmentSearchResults.map((treatment) => (
                              <button
                                key={treatment.id}
                                onClick={() => handleTreatmentSelect(treatment.name)}
                                className="w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs md:text-sm border-b border-gray-100"
                              >
                                <div className="font-medium text-gray-900">{treatment.name}</div>
                                <div className="text-xs text-gray-500">{treatment.category}</div>
                              </button>
                            ))}
                            {/* Always show "Other" option */}
                            <button
                              onClick={() => handleTreatmentSelect(treatmentSearchQuery, true)}
                              className="w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs md:text-sm border-t border-gray-200 bg-gray-50"
                            >
                              <div className="font-medium text-gray-900">Other: "{treatmentSearchQuery}"</div>
                              <div className="text-xs text-gray-500">Custom treatment name</div>
                            </button>
                          </div>
                        ) : treatmentSearchQuery.trim() ? (
                          <div className="py-1">
                            <button
                              onClick={() => handleTreatmentSelect(treatmentSearchQuery, true)}
                              className="w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs md:text-sm border-b border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Other: "{treatmentSearchQuery}"</div>
                              <div className="text-xs text-gray-500">Custom treatment name</div>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Manual Entry Option */}
                  <div className="text-xs text-gray-500 text-center px-2">
                    Or type the treatment name manually in the chat input below
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 md:p-3">
                  <div>
                    <div className="font-medium text-green-800 text-xs md:text-sm">Selected Treatment:</div>
                    <div className="text-xs md:text-sm text-green-700">{selectedTreatment}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Message timestamp - WhatsApp style */}
          <div className={`flex items-center justify-end ${isUser ? 'mt-0' : 'mt-0.5'} space-x-1`}>
            <span className={`text-xs ${isUser ? 'text-gray-600' : 'text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isUser && (
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-1 md:ml-1.5">
          <div className="h-4 w-4 md:h-5 md:w-5 bg-primary-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;