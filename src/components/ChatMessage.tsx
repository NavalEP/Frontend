import React, { useState, useEffect, useRef } from 'react';
import { Copy, ExternalLink, Share2, Search, ArrowDown, Upload, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getShortlink, searchTreatments } from '../services/api';
import { smartShare, isNativeSharingSupported } from '../utils/shareUtils';
import ShareButton from './ShareButton';
import PaymentStepsMessage from './PaymentStepsMessage';

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
  onUploadClick?: (documentType: 'aadhaar' | 'pan') => void;
  onPaymentPlanPopupOpen?: (url?: string) => void;
  onAddressDetailsPopupOpen?: (url: string) => void;
  loanId?: string;
  isPaymentPlanCompleted?: boolean;
  isAddressDetailsCompleted?: boolean;
  onAadhaarVerificationClick?: () => void;
}

// Component for styled treatment amount display
const TreatmentAmountDisplay: React.FC<{ text: string }> = ({ text }) => {
  // Extract amount from text using regex
  const amountRegex = /₹\s*([\d,]+(?:\.\d{2})?)/g;
  const matches = Array.from(text.matchAll(amountRegex));
  
  if (matches.length === 0) {
    return <ReactMarkdown>{text}</ReactMarkdown>;
  }
  
  // Split text into parts and render with styled amounts
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  matches.forEach((match, index) => {
    const fullMatch = match[0];
    const amount = match[1];
    const startIndex = match.index!;
    
    // Add text before the amount
    if (startIndex > lastIndex) {
      parts.push(
        <ReactMarkdown key={`text-${index}`}>
          {text.substring(lastIndex, startIndex)}
        </ReactMarkdown>
      );
    }
    
    // Add styled amount
    parts.push(
      <div 
        key={`amount-${index}`}
        className="w-full bg-green-100 border-2 border-green-400 rounded-lg px-3 py-2 my-1 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderColor: '#4ade80',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-center">
          <span 
            className="text-green-700 font-bold text-lg"
            style={{ color: '#15803d' }}
          >
            ₹{amount}
          </span>
        </div>
      </div>
    );
    
    lastIndex = startIndex + fullMatch.length;
  });
  
  // Add remaining text after last amount
  if (lastIndex < text.length) {
    parts.push(
      <ReactMarkdown key="text-after">
        {text.substring(lastIndex)}
      </ReactMarkdown>
    );
  }
  
  return <span>{parts}</span>;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onButtonClick, selectedOption, disabledOptions, onLinkClick, onTreatmentSelect, selectedTreatment, onUploadClick, onPaymentPlanPopupOpen, onAddressDetailsPopupOpen, loanId, isPaymentPlanCompleted, isAddressDetailsCompleted, onAadhaarVerificationClick }) => {
  const isUser = message.sender === 'user';
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [showTreatmentSearch, setShowTreatmentSearch] = useState(false);
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState('');
  const [treatmentSearchResults, setTreatmentSearchResults] = useState<any[]>([]);
  const [isSearchingTreatments, setIsSearchingTreatments] = useState(false);
  const treatmentSearchRef = useRef<HTMLDivElement>(null);
  const [aadhaarVerificationUrl, setAadhaarVerificationUrl] = useState<string>('');
  
  
  // Check if this is an OCR result message
  const isOcrResult = message.text.includes('📋 **Aadhaar Card Details Extracted Successfully!**') || 
                     message.text.includes('📋 **PAN Card Details Extracted Successfully!**');
  
  // Check if this is a treatment name question
  const isTreatmentNameQuestion = message.text.toLowerCase().includes('what is the name of treatment') || 
                                 message.text.toLowerCase().includes('treatment name') ||
                                 message.text.toLowerCase().includes('name of treatment');
  
  // Debug: Log when treatment question is detected
  if (isTreatmentNameQuestion && !isUser) {
    console.log('Treatment name question detected:', message.text);
  }
  
  // Check if message contains any rupee amount (₹)
  const containsAmount = /₹\s*[\d,]+(?:\.\d{2})?/.test(message.text);
  
  // Debug: Log when amount is detected
  if (containsAmount) {
    console.log('Amount detected in message:', message.text);
  }
  
  
  // Check if this is an Aadhaar upload request - be very specific
  const isAadhaarUploadRequest = !isUser && (
    // Must contain "upload" and "aadhaar"
    message.text.toLowerCase().includes('upload') && 
    message.text.toLowerCase().includes('aadhaar') &&
    // Must mention both front and back
    (message.text.toLowerCase().includes('front and back') || 
     message.text.toLowerCase().includes('both') ||
     (message.text.toLowerCase().includes('front') && message.text.toLowerCase().includes('back'))) &&
    // Must be asking for upload, not just mentioning it
    (message.text.toLowerCase().includes('please upload') || 
     message.text.toLowerCase().includes('kindly upload') ||
     message.text.toLowerCase().includes('you can upload') ||
     message.text.toLowerCase().includes('click') ||
     message.text.toLowerCase().includes('proceed with the loan') ||
     message.text.toLowerCase().includes('please proceed to upload') ||
     message.text.toLowerCase().includes('please proceed to upload both the front and back of the patient\'s aadhaar card to continue with the loan application process'))
  );
  
  // Check if this is a PAN upload request - be very specific
  const isPanUploadRequest = !isUser && (
    // Must contain "pan" and either "upload" or "provide"
    message.text.toLowerCase().includes('pan') &&
    (message.text.toLowerCase().includes('upload') || message.text.toLowerCase().includes('provide')) &&
    // Must be specifically asking for PAN card upload
    (message.text.toLowerCase().includes('please provide your pan') ||
     message.text.toLowerCase().includes('upload patient pan') ||
     message.text.toLowerCase().includes('clicking the file upload') ||
     message.text.toLowerCase().includes('enter patient pan') ||
     message.text.toLowerCase().includes('pan card details'))
  );
  
  // Check if this is a bank statement upload request
  const isBankStatementUploadRequest = !isUser && (
    message.text.toLowerCase().includes('bank statement') &&
    (message.text.toLowerCase().includes('upload') || 
     message.text.toLowerCase().includes('last 3 months') ||
     message.text.toLowerCase().includes('assess their application') ||
     message.text.toLowerCase().includes('fair chance of approval'))
  );
  
  // Check if this is a post-approval link (Fibe portal or similar)
  const isPostApprovalLink = !isUser && (
    message.text.toLowerCase().includes('treatment is now just 3 steps away') ||
    (message.text.toLowerCase().includes('complete kyc') && 
     message.text.toLowerCase().includes('set up auto-debit') && 
     message.text.toLowerCase().includes('give consent to disburse'))
  );
  // Check if this is the No-cost Credit & Debit Card EMI message
  const isNoCostEmiMessage = !isUser && (
    message.text.toLowerCase().includes('no-cost credit & debit card emi') ||
    message.text.toLowerCase().includes('no-cost credit and debit card emi') ||
    message.text.toLowerCase().includes('no cost credit & debit card emi') ||
    message.text.toLowerCase().includes('no cost credit and debit card emi')
  );
  
  // Check if this is an address details message (contains address details confirmation)
  const isAddressDetailsMessage = !isUser && (
    message.text.toLowerCase().includes('kindly confirm patient\'s address details by clicking below buttom') ||
    message.text.toLowerCase().includes('kindly confirm patient\'s address details by clicking below button') ||
    (message.text.toLowerCase().includes('address details') && message.text.toLowerCase().includes('clicking below')) ||
    message.text.toLowerCase().includes('address details')
  );
  
  // Debug logging for address details message detection
  if (!isUser && message.text.toLowerCase().includes('address details')) {
    console.log('Address details message detected:', {
      messageText: message.text,
      isAddressDetailsMessage,
      hasUrl: /https:\/\/[^\s]+/.test(message.text)
    });
  }
  
  // Check if this is a payment steps message
  const isPaymentStepsMessage = !isUser && (
    message.text.toLowerCase().includes('payment is now just 3 steps away') ||
    message.text.toLowerCase().includes('payment is now just 4 steps away') ||
    (message.text.toLowerCase().includes('face verification') && 
     message.text.toLowerCase().includes('emi auto payment approval') && 
     message.text.toLowerCase().includes('agreement e-signing')) ||
    (message.text.toLowerCase().includes('adhaar verification') && 
     message.text.toLowerCase().includes('face verification') && 
     message.text.toLowerCase().includes('emi auto payment approval') && 
     message.text.toLowerCase().includes('agreement e-signing'))
  );
  
  // Function to parse payment steps from message text
  const parsePaymentSteps = (text: string) => {
    const urlRegex = /(https:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    // Check if this is 4 steps or 3 steps format
    const is4Steps = text.toLowerCase().includes('payment is now just 4 steps away') ||
                     text.toLowerCase().includes('adhaar verification');
    
    // Extract and store Aadhaar verification URL for fallback
    const aadhaarUrl = urls.find(url => url.includes('adhaar') || url.includes('aadhaar'));
    if (aadhaarUrl) {
      setAadhaarVerificationUrl(aadhaarUrl);
    }
    
    // Define step patterns and their corresponding URLs
    const stepPatterns = is4Steps ? [
      {
        title: "Adhaar verification.",
        description: "Now, let's complete Adhaar verification.",
        url: urls.find(url => url.includes('adhaar') || url.includes('aadhaar')) || urls[0] || '',
        primaryButtonText: "Complete Adhaar verification",
        secondaryButtonText: "Share link with patient"
      },
      {
        title: "Face verification.",
        description: "Now, let's complete face verification.",
        url: urls.find(url => url.includes('faceverified') || url.includes('face')) || urls[1] || '',
        primaryButtonText: "Complete Face verification",
        secondaryButtonText: "Share link with patient"
      },
      {
        title: "Approve the EMI auto-pay setup.",
        description: "Set up automatic EMI payments.",
        url: urls.find(url => url.includes('emiautopayintro') || url.includes('emi')) || urls[2] || '',
        primaryButtonText: "Complete auto pay setup",
        secondaryButtonText: "Share link with patient"
      },
      {
        title: "E-sign agreement using this link.",
        description: "Complete the agreement e-signing process.",
        url: urls.find(url => url.includes('agreementesigning') || url.includes('agreement')) || urls[3] || '',
        primaryButtonText: "Complete E-sign agreement",
        secondaryButtonText: "Share link with patient"
      }
    ] : [
      {
        title: "Face verification.",
        description: "Now, let's complete face verification.",
        url: urls.find(url => url.includes('faceverified')) || urls[0] || '',
        primaryButtonText: "Complete Face verification",
        secondaryButtonText: "Share link with patient"
      },
      {
        title: "E-sign agreement using this link.",
        description: "Complete the agreement e-signing process.",
        url: urls.find(url => url.includes('agreementesigning')) || urls[1] || '',
        primaryButtonText: "Complete E-sign agreement",
        secondaryButtonText: "Share link with patient"
      },
      {
        title: "Approve the EMI auto-pay setup.",
        description: "Set up automatic EMI payments.",
        url: urls.find(url => url.includes('emiautopayintro')) || urls[2] || '',
        primaryButtonText: "Complete auto pay setup",
        secondaryButtonText: "Share link with patient"
      }
    ];
    
    // Filter out steps that don't have URLs
    return stepPatterns.filter(step => step.url);
  };
  
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

    console.log('Searching treatments for query:', query);
    setIsSearchingTreatments(true);
    try {
      const response = await searchTreatments(query, 10);
      console.log('Treatment search response:', response.data);
      if (response.data.status === 'success') {
        setTreatmentSearchResults(response.data.data.treatments);
        console.log('Treatment search results:', response.data.data.treatments);
      } else {
        console.log('Treatment search failed:', response.data);
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

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (treatmentSearchRef.current && !treatmentSearchRef.current.contains(event.target as Node)) {
        setShowTreatmentSearch(false);
      }
    };

    if (showTreatmentSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTreatmentSearch]);

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



  const renderPaymentPlanButton = () => {
    if (isPaymentPlanCompleted) {
      return (
        <div className="mt-3">
          <button
            disabled
            className="w-full px-4 py-3 text-white font-bold rounded-lg flex items-center justify-center space-x-2"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle className="h-5 w-5" />
            <span>Completed the payment plan selection</span>
          </button>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onPaymentPlanPopupOpen) {
              onPaymentPlanPopupOpen();
            }
          }}
          className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
            boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
          }}
        >
          <span className="text-center">Continue with payment plan selection</span>
        </button>
      </div>
    );
  };

  // Function to format text with line breaks and proper handling of numbered lists
  const formatText = (text: string) => {
    // First handle escaped newlines
    let formattedText = text.replace(/\\n/g, '\n');
    
    // Format employment types for both agent and user messages
    // This ensures consistency in display while keeping original values for backend
    // Replace SALARIED with Salaried
    formattedText = formattedText.replace(/\bSALARIED\b/g, 'Salaried');
    
    // Replace SELF_EMPLOYED with Self Employed
    formattedText = formattedText.replace(/\bSELF_EMPLOYED\b/g, 'Self Employed');
    
    // If this is a bank statement message or post-approval link, remove the URL from display
    if (isBankStatementUploadRequest || isPostApprovalLink) {
      formattedText = formattedText.replace(/https:\/\/[^\s]+/g, '');
      // Clean up any extra whitespace or line breaks left behind
      formattedText = formattedText.replace(/\n\s*\n/g, '\n').trim();
    }
    
    // Special formatting for post-approval link messages with bullet points
    if (isPostApprovalLink) {
      // Ensure bullet points are on separate lines with proper line breaks
      formattedText = formattedText.replace(/•\s*/g, '\n\n• ');
      // Ensure proper spacing after the main text and before bullet points
      formattedText = formattedText.replace(/(\w)\n\n•/g, '$1\n\n•');
      // Clean up any triple line breaks
      formattedText = formattedText.replace(/\n\n\n+/g, '\n\n');
    }
    
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
  
  // Check if this is a payment plan selection message
  const isPaymentPlanMessage = !isUser && (
    message.text.toLowerCase().includes('continue with payment plan selection') ||
    message.text.toLowerCase().includes('payment plan selection') ||
    message.text.toLowerCase().includes('select your payment plan') ||
    message.text.toLowerCase().includes('choose your payment plan')
  );
  
  
  // Function to extract address details URL from message
  const extractAddressDetailsUrl = (text: string): string | null => {
    const urlRegex = /(https:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      // Look for postapprovalAddressdetails URL specifically
      const addressDetailsUrl = urls.find(url => url.includes('postapprovalAddressdetails'));
      return addressDetailsUrl || urls[0]; // Return address details URL if found, otherwise first URL
    }
    return null;
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
          {/* Only show regular text content if it's NOT a payment steps message */}
          {!isPaymentStepsMessage && (
            <div 
              className={`prose ${isUser ? 'prose-xs text-gray-800' : 'prose-sm text-gray-800'} max-w-none break-words leading-tight`}
              style={{ lineHeight: isUser ? 1.2 : 1.3 }}
            >
              {containsAmount ? (
                <TreatmentAmountDisplay text={formatText(message.text)} />
              ) : (
                <ReactMarkdown
                  components={{
                                     h3: ({node, ...props}) => <h3 className={`font-bold mt-1 mb-1 ${isUser ? 'text-sm' : 'text-base'}`} {...props} />,
                     h4: ({node, ...props}) => <h4 className={`font-bold mt-1 mb-1 ${isUser ? 'text-xs' : 'text-sm'}`} {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    a: ({node, href, ...props}) => {
                      if (href && /^https?:\/\//.test(href)) {
                        // Don't render URLs as clickable links for bank statement messages or post-approval links
                        if (isBankStatementUploadRequest || isPostApprovalLink) {
                          return null;
                        }
                        
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
                          </div>
                        );
                      }
                      
                      // Special handling for post-approval link messages
                      if (isPostApprovalLink && content.includes('•')) {
                        // Split content by bullet points and render each as separate elements
                        const parts = content.split(/(•\s*[^\n]*)/g).filter(part => part.trim());
                        return (
                          <div className="my-0 leading-tight" style={{ marginBottom: isUser ? '0.0625rem' : '0.125rem' }}>
                            {parts.map((part, index) => {
                              if (part.startsWith('•')) {
                                return (
                                  <div key={index} className="my-1">
                                    {part}
                                  </div>
                                );
                              }
                              return <span key={index}>{part}</span>;
                            })}
                          </div>
                        );
                      }
                      
                      return <p className="my-0 leading-tight" style={{ marginBottom: isUser ? '0.0625rem' : '0.125rem' }} {...props} />;
                    },
                                      li: ({node, ...props}) => {
                                        // Special styling for post-approval link messages
                                        if (isPostApprovalLink) {
                                          return <li className="leading-tight pl-0 my-1" {...props} />;
                                        }
                                        return <li className={`leading-tight pl-0 ${isUser ? 'my-0' : 'my-0.5'}`} {...props} />;
                                      },
                      ol: ({node, ...props}) => <ol className={`${isUser ? 'pl-2 my-0.5 space-y-0' : 'pl-3 my-1 space-y-0.5'} list-decimal`} {...props} />,
                      ul: ({node, ...props}) => {
                        // Special styling for post-approval link messages
                        if (isPostApprovalLink) {
                          return <ul className="pl-0 my-1 space-y-1 list-none" {...props} />;
                        }
                        return <ul className={`${isUser ? 'pl-2 my-0.5 space-y-0' : 'pl-3 my-1 space-y-0.5'} list-disc`} {...props} />;
                      },
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
              )}
            </div>
          )}
          
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
                // Keep the original option value for backend
                const originalOption = option;
                const optionValue = questionData.optionNumbers && questionData.optionNumbers[index] 
                  ? questionData.optionNumbers[index] 
                  : option;
                const isSelected = selectedOption === optionValue;
                const isDisabled = disabledOptions || false;
                
                // Format the option text for display only
                let displayOption = option;
                if (!isUser) {
                  displayOption = displayOption.replace(/\bSALARIED\b/g, 'Salaried');
                  displayOption = displayOption.replace(/\bSELF_EMPLOYED\b/g, 'Self Employed');
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && handleButtonClick(originalOption, index)}
                    disabled={isDisabled}
                    className={`w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 border rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 hover:shadow-sm chat-button text-xs md:text-sm ${
                      isSelected 
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                        : isDisabled
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                    }`}
                  >
                    {displayOption}
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
                  <div className="relative" ref={treatmentSearchRef}>
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
                    {showTreatmentSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
                            {/* Always show "Other" option when there's a search query */}
                            {treatmentSearchQuery.trim() && (
                              <button
                                onClick={() => handleTreatmentSelect(treatmentSearchQuery, true)}
                                className="w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-xs md:text-sm border-t border-gray-200 bg-gray-50"
                              >
                                <div className="font-medium text-gray-900">Other: "{treatmentSearchQuery}"</div>
                                <div className="text-xs text-gray-500">Custom treatment name</div>
                              </button>
                            )}
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
                        ) : (
                          <div className="p-3 text-center text-gray-500">
                            <div className="text-sm">Start typing to search for treatments</div>
                            <div className="text-xs mt-1">Or type the treatment name manually in the chat input below</div>
                          </div>
                        )}
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
          
          {/* Upload Document Button for Aadhaar */}
          {isAadhaarUploadRequest && onUploadClick && (
            <div className="mt-3">
              <button
                onClick={() => onUploadClick('aadhaar')}
                className="w-full px-4 py-2.5 hover:opacity-90 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2"
                style={{ backgroundColor: '#514c9f' }}
              >
                <Upload className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Upload Aadhaar Card (Front & Back)</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-1">Click here to upload both front and back sides</p>
            </div>
          )}
          
          {/* Upload Document Button for PAN */}
          {isPanUploadRequest && onUploadClick && (
            <div className="mt-3">
              <button
                onClick={() => onUploadClick('pan')}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 flex items-center justify-center space-x-2"
              >
                <Upload className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Upload PAN Card</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-1">Click here to upload your PAN card</p>
            </div>
          )}
          
          {/* Bank Statement Upload Button */}
          {isBankStatementUploadRequest && (
            <div className="mt-3">
              {(() => {
                // Extract URL from message text
                const urlRegex = /(https:\/\/[^\s]+)/g;
                const urls = message.text.match(urlRegex);
                const bankStatementUrl = urls && urls.length > 0 ? urls[0] : '';
                
                return (
                  <div className="space-y-3">
                    {/* Main Bank Statement Upload Button */}
                    <button
                      onClick={() => {
                        if (bankStatementUrl) {
                          window.open(bankStatementUrl, '_blank');
                        }
                      }}
                      className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
                        boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Share Bank Statement</span>
                      </div>
                    </button>
                    
                    {/* Share and Copy Buttons */}
                    {bankStatementUrl && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleNativeShare(bankStatementUrl)}
                          className="flex-1 px-3 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2 text-xs"
                          style={{
                            backgroundColor: '#f3f2ff',
                            color: '#514c9f'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e8e5ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f2ff';
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Share Bank Statement link</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(bankStatementUrl)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 flex items-center justify-center text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Post-Approval Link Button */}
          {isPostApprovalLink && (
            <div className="mt-3">
              {(() => {
                // Extract URL from message text
                const urlRegex = /(https:\/\/[^\s]+)/g;
                const urls = message.text.match(urlRegex);
                const postApprovalUrl = urls && urls.length > 0 ? urls[0] : '';
                
                return (
                  <div className="space-y-3">
                    {/* Main Post-Approval Button */}
                    <button
                      onClick={() => {
                        if (postApprovalUrl) {
                          window.open(postApprovalUrl, '_blank');
                        }
                      }}
                      className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
                        boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Continue Post-Approval</span>
                      </div>
                    </button>
                    
                    {/* Share and Copy Buttons */}
                    {postApprovalUrl && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleNativeShare(postApprovalUrl)}
                          className="flex-1 px-3 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2 text-xs"
                          style={{
                            backgroundColor: '#f3f2ff',
                            color: '#514c9f'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e8e5ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f2ff';
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Share Post-Approval link</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(postApprovalUrl)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 flex items-center justify-center text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* No-cost Credit & Debit Card EMI Button */}
          {isNoCostEmiMessage && (
            <div className="mt-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                      window.open(`https://carepay.money/patient/razorpayoffer/${userId}`, '_blank');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <img 
                    src="https://carepay.money/static/media/Cards%202.f655246b233e2a166c74.gif" 
                    alt="Credit Card" 
                    className="h-5 w-5 md:h-6 md:w-6" 
                  />
                  <span className="text-sm md:text-base">No-cost Credit & Debit Card EMI</span>
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded-full">⚡ Quick</span>
                </button>
                <ShareButton
                  type="text"
                  title="No-cost EMI Offer"
                  text="Check out this amazing no-cost EMI offer for medical treatments!"
                  url={`https://carepay.money/patient/razorpayoffer/${localStorage.getItem('userId')}`}
                  className="px-3 py-2.5 hover:opacity-90 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">Click here to apply for no-cost EMI or share the offer</p>
            </div>
          )}
          
          {/* Payment Plan Button */}
          {isPaymentPlanMessage && onPaymentPlanPopupOpen && (
            renderPaymentPlanButton()
          )}
          
          {/* Address Details Button */}
          {isAddressDetailsMessage && (
            <div className="mt-3">
              {(() => {
                const addressDetailsUrl = extractAddressDetailsUrl(message.text);
                console.log('Address Details Button - URL extracted:', addressDetailsUrl);
                
                // Use a fallback URL if no URL is found in the message
                const finalUrl = addressDetailsUrl || 'https://carepay.money/address-details';
                console.log('Address Details Button - Using URL:', finalUrl);
                
                return (
                  <div className="space-y-3">
                    {/* Main Address Details Button */}
                    {isAddressDetailsCompleted ? (
                      <button
                        disabled
                        className="w-full px-4 py-3 text-white font-bold rounded-lg flex items-center justify-center space-x-2"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Completed the address details</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onAddressDetailsPopupOpen) {
                            onAddressDetailsPopupOpen(finalUrl);
                          }
                        }}
                        className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
                          boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
                        }}
                      >
                        Fill the Address Details
                      </button>
                    )}
                    
                    {/* Share and Copy Buttons - Only show if we have a real URL and address is not completed */}
                    {addressDetailsUrl && !isAddressDetailsCompleted && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Please complete your address details verification using this link: ${addressDetailsUrl}`)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className="flex-1 px-3 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2 text-xs"
                          style={{ 
                            backgroundColor: '#f3f2ff',
                            color: '#514c9f'
                          }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e6e3ff'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f2ff'}
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Share Address Details link</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(addressDetailsUrl);
                            const toast = document.createElement('div');
                            toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg z-50';
                            toast.textContent = 'Address Details link copied to clipboard!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 flex items-center justify-center space-x-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy link</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Payment Steps Message */}
          {isPaymentStepsMessage && (
            <div className="mt-3">
              <PaymentStepsMessage 
                steps={parsePaymentSteps(message.text)}
                onLinkClick={onLinkClick}
                loanId={loanId}
                onAadhaarVerificationClick={onAadhaarVerificationClick}
                fallbackUrl={aadhaarVerificationUrl}
              />
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