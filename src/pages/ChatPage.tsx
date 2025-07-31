import React, { useState, useEffect, useRef } from 'react';
import { createSession, sendMessage, getSessionDetails, uploadDocument, uploadPanCard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/ChatMessage';
import StructuredInputForm from '../components/StructuredInputForm';

import PanCardUpload from '../components/PanCardUpload';
import AadhaarUpload from '../components/AadhaarUpload';
import Modal from '../components/Modal';
import { SendHorizonal, Plus, Notebook as Robot, History, ArrowLeft, Search, LogOut, Upload } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  imagePreview?: string; // Base64 image preview for uploaded files
  fileName?: string; // Original file name for uploaded files
}

interface SessionDetails {
  phoneNumber?: string;
  status?: string;
  history?: Array<{
    type: string;
    content: string;
  }>;
  created_at?: string;
  updated_at?: string;
  userId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  lastMessage: string;
}

const ChatPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [showStructuredForm, setShowStructuredForm] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { incrementSessionCount, doctorId, doctorName, logout, sessionCount } = useAuth();
  const [showOfferButton, setShowOfferButton] = useState(false);

  // Utility function to create image preview
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };
  const [showIframePopup, setShowIframePopup] = useState(false);
  const [patientInfoSubmitted, setPatientInfoSubmitted] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [disabledOptions, setDisabledOptions] = useState<Record<string, boolean>>({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'aadhaar' | 'pan' | null>(null);

  const [showLinkIframe, setShowLinkIframe] = useState(false);
  const [linkIframeUrl, setLinkIframeUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to format welcome message from API response
  const formatWelcomeMessage = (content: string): string => {
    // If content already has formatting, return it as is
    if (content.includes('1. Patient') || content.includes('**Example input format**')) {
      return content;
    }
    
    // Return the API content as is
    return content;
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize chat session - restore existing or start new
  useEffect(() => {
    const initializeSession = async () => {
      if (!doctorId) return;
      
      // Check if there's an existing session for this doctor
      const existingSessionData = localStorage.getItem(`session_id_doctor_${doctorId}`);
      const currentSessionId = localStorage.getItem('current_session_id');
      
      if (existingSessionData && currentSessionId) {
        try {
          // Try to restore existing session
          const sessionData = JSON.parse(existingSessionData);
          const sessionId = sessionData.id;
          
          // Check if session is still valid (not expired)
          if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
            console.log('Restoring existing session:', sessionId);
            setSessionId(sessionId);
            
            // Load session details and chat history
            const response = await getSessionDetails(sessionId);
            if (response.data) {
              setSessionDetails({
                phoneNumber: response.data.phoneNumber,
                status: response.data.status,
                history: response.data.history,
                created_at: response.data.created_at,
                updated_at: response.data.updated_at,
                userId: response.data.userId
              });
              
              // Convert history to messages
              if (response.data.history && response.data.history.length > 0) {
                const historyMessages: Message[] = response.data.history.map((item, index) => {
                  if (index === 0 && item.type === 'AIMessage') {
                    return {
                      id: `history-${index}`,
                      text: formatWelcomeMessage(item.content),
                      sender: 'agent',
                      timestamp: new Date(response.data.created_at),
                    };
                  }
                  
                  return {
                    id: `history-${index}`,
                    text: item.content,
                    sender: item.type === 'HumanMessage' ? 'user' : 'agent',
                    timestamp: new Date(response.data.created_at),
                  };
                });
                
                setMessages(historyMessages);
                setShowStructuredForm(false); // Don't show structured form for existing sessions
                setPatientInfoSubmitted(true); // Mark as submitted since we have history
              }
            }
          } else {
            // Session expired, start new session
            console.log('Session expired, starting new session');
            await startNewSession();
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          // If restoration fails, start new session
          await startNewSession();
        }
      } else {
        // No existing session, start new session
        console.log('No existing session, starting new session');
        await startNewSession();
      }
    };
    
    initializeSession();
  }, [doctorId]);

  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);
  
  // Load chat history from localStorage using doctorId instead of phoneNumber
  useEffect(() => {
    if (doctorId) {
      const savedHistory = localStorage.getItem(`chat_history_doctor_${doctorId}`);
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    }
  }, [doctorId]);

  // Save chat history to localStorage using doctorId
  const saveChatHistory = (newSession: ChatSession) => {
    if (!doctorId) return;
    
    const updatedHistory = [newSession, ...chatHistory.filter(session => session.id !== newSession.id)].slice(0, 30);
    setChatHistory(updatedHistory);
    localStorage.setItem(`chat_history_doctor_${doctorId}`, JSON.stringify(updatedHistory));
  };

  // Load a specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSessionId(sessionId);
      setShowHistory(false);
      
      // Clear current messages while loading
      setMessages([{
        id: `loading-session-${Date.now()}`,
        text: "Loading chat history...",
        sender: 'agent',
        timestamp: new Date(),
      }]);

      const response = await getSessionDetails(sessionId);
      
      if (response.data) {
        setSessionDetails({
          phoneNumber: response.data.phoneNumber,
          status: response.data.status,
          history: response.data.history,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
          userId: response.data.userId
        });
        
        // Convert history to messages
        if (response.data.history && response.data.history.length > 0) {
          const historyMessages: Message[] = response.data.history.map((item, index) => {
            // Format the first agent message to match welcome message format
            if (index === 0 && item.type === 'AIMessage') {
              return {
                id: `history-${index}`,
                text: formatWelcomeMessage(item.content),
                sender: 'agent',
                timestamp: new Date(response.data.created_at),
              };
            }
            
            return {
              id: `history-${index}`,
              text: item.content,
              sender: item.type === 'HumanMessage' ? 'user' : 'agent',
              timestamp: new Date(response.data.created_at),
            };
          });
          
          setMessages(historyMessages);
          
          // Find the first user message to set as title if not already set
          const firstUserMessage = historyMessages.find(msg => msg.sender === 'user');
          if (firstUserMessage) {
            const existingSession = chatHistory.find(s => s.id === sessionId);
            if (!existingSession || existingSession.title === 'New Chat') {
              const newSession: ChatSession = {
                id: sessionId,
                title: generateChatTitle(firstUserMessage.text),
                timestamp: new Date(response.data.created_at),
                lastMessage: firstUserMessage.text
              };
              saveChatHistory(newSession);
            }
          }
          
          // Always set showStructuredForm to false when loading a previous chat
          setShowStructuredForm(false);
        } else {
          // If no history found, don't show any message - let API provide the first message
          setMessages([]);
          setShowStructuredForm(true);
        }
      } else {
        throw new Error('Session not found');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chat session. Please try again.';
      
      // Check if it's a token expiration error
      if (errorMessage.toLowerCase().includes('session has expired') || 
          errorMessage.toLowerCase().includes('token has expired')) {
        // Don't handle here since AuthContext will handle logout
        return;
      }
      
      setError(errorMessage);
      // Reset to new session on error
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the chat history item click handler to show loading state
  const handleHistoryItemClick = (session: ChatSession) => {
    // Add visual feedback for the clicked item
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => item.classList.remove('bg-gray-100'));
    const clickedItem = document.querySelector(`[data-session-id="${session.id}"]`);
    if (clickedItem) {
      clickedItem.classList.add('bg-gray-100');
    }
    
    loadChatSession(session.id);
  };

  // Generate chat title from first user message
  const generateChatTitle = (message: string): string => {
    const maxLength = 30;
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const fetchSessionDetails = async () => {
    if (!sessionId) return;
    
    try {
      // Show loading indicator when fetching existing session
      if (messages.length === 0) {
        setIsLoading(true);
        setMessages([{
          id: `loading-session-${Date.now()}`,
          text: "Loading chat history...",
          sender: 'agent',
          timestamp: new Date(),
        }]);
      }
      
      const response = await getSessionDetails(sessionId);
      if (response.data) {
        // Store userId in localStorage when we get it
        if (response.data.userId) {
          localStorage.setItem('userId', response.data.userId);
        }

        setSessionDetails({
          phoneNumber: response.data.phoneNumber,
          status: response.data.status,
          history: response.data.history,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
          userId: response.data.userId
        });
        
        // If we have history, convert it to our message format
        if (response.data.history && response.data.history.length > 0) {
          const historyMessages: Message[] = response.data.history.map((item, index) => {
            // Format the first agent message to match welcome message format
            if (index === 0 && item.type === 'AIMessage') {
              return {
                id: `history-${index}`,
                text: formatWelcomeMessage(item.content),
                sender: 'agent',
                timestamp: new Date(response.data.created_at),
              };
            }
            
            return {
              id: `history-${index}`,
              text: item.content,
              sender: item.type === 'HumanMessage' ? 'user' : 'agent',
              timestamp: new Date(response.data.created_at),
            };
          });
          
          // Replace any loading messages and show the actual conversation history
          setMessages(historyMessages);
          
          // Check if patient information has already been submitted
          const hasPatientInfo = historyMessages.some(msg => 
            msg.sender === 'user' && 
            msg.text.includes('name:') && 
            msg.text.includes('phone number:') && 
            msg.text.includes('treatment cost:') && 
            msg.text.includes('monthly income:')
          );
          
          if (hasPatientInfo) {
            setShowStructuredForm(false);
            setPatientInfoSubmitted(true);
          }
        } else if (messages.length === 1 && messages[0].id.startsWith('loading-session')) {
          // If there's no history but we were showing a loading message, clear messages
          setMessages([]);
        }
      } else {
        // Session not found or empty, start a new session
        if (messages.length === 1 && messages[0].id.startsWith('loading-session')) {
          startNewSession();
        }
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session details';
      
      // Check if it's a token expiration error
      if (errorMessage.toLowerCase().includes('session has expired') || 
          errorMessage.toLowerCase().includes('token has expired')) {
        // Don't handle here since AuthContext will handle logout
        return;
      }
      
      // If error occurred while loading session, start a new one
      if (messages.length === 1 && messages[0].id.startsWith('loading-session')) {
        startNewSession();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if we should show structured form based on conversation state
  const shouldShowStructuredForm = () => {
    return showStructuredForm && (
      messages.length === 1 && messages[0].sender === 'agent' || 
      !messages.some(msg => 
        msg.sender === 'user' && 
        msg.text.includes('name:') && 
        msg.text.includes('phone number:') && 
        msg.text.includes('treatment cost:') && 
        msg.text.includes('monthly income:')
      )
    );
  };

  const handleStructuredFormSubmit = (formattedMessage: string) => {
    setShowStructuredForm(false);
    setPatientInfoSubmitted(true);
    // Simulate form submission as a regular message
    handleMessageSubmit(formattedMessage);
  };

  const handleMessageSubmit = async (messageText: string) => {
    if (!messageText.trim() || !sessionId) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setSelectedOption(undefined); // Clear selected option when sending a new message
    
    // Save chat session if it's the first message
    const isFirstMessage = messages.length === 0 || (messages.length === 1 && messages[0].sender === 'agent');
    const newSession: ChatSession = {
      id: sessionId,
      title: isFirstMessage ? generateChatTitle(messageText) : chatHistory.find(s => s.id === sessionId)?.title || 'New Chat',
      timestamp: new Date(),
      lastMessage: messageText
    };
    
    // Update chat history and keep only last 30 chats
    const updatedHistory = [newSession, ...chatHistory.filter(session => session.id !== sessionId)].slice(0, 30);
    setChatHistory(updatedHistory);
    if (doctorId) {
      localStorage.setItem(`chat_history_doctor_${doctorId}`, JSON.stringify(updatedHistory));
    }
    
    try {
      const response = await sendMessage(sessionId, messageText);
      console.log('API Response:', response.data);
      
      if (response.data.status === 'success') {
        // Add agent response to chat
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          text: response.data.response || 'Sorry, I could not process your request.',
          sender: 'agent',
          timestamp: new Date(),
        };
        
        console.log('Adding agent message:', agentMessage);
        setMessages(prevMessages => [...prevMessages, agentMessage]);
        
        // Fetch updated session details after message exchange
        fetchSessionDetails();
      } else if (response.data.message === 'Session not found' || response.data.status === 'error') {
        // Session expired or invalid, start a new one
        setError('Your session has expired. Starting a new session...');
        setTimeout(() => {
          startNewSession();
        }, 2000);
      } else {
        console.error('API response not successful:', response.data);
        throw new Error('Failed to get response from agent');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      
      // Check if it's a token expiration error
      if (errorMessage.toLowerCase().includes('session has expired') || 
          errorMessage.toLowerCase().includes('token has expired')) {
        // Don't set error message since AuthContext will handle logout
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleMessageSubmit(inputMessage);
  };

  // Handle button option clicks
  const handleButtonClick = async (optionText: string, optionValue: string, messageId: string) => {
    console.log('Button clicked, option text:', optionText, 'option value:', optionValue, 'for message:', messageId);
    setSelectedOption(optionValue);
    
    // Set the input message to the selected option text (not the number)
    setInputMessage(optionText);
    
    // Disable ALL options for this specific message when any option is selected
    setDisabledOptions(prev => {
      const newDisabledOptions = {
        ...prev,
        [messageId]: true
      };
      console.log('Updated disabled options:', newDisabledOptions);
      return newDisabledOptions;
    });
    
    // Send the option text (like "Yes" or "No") to the API as the user's message
    await handleMessageSubmit(optionText);
  };

  // Handle treatment selection
  const handleTreatmentSelect = async (treatmentName: string, messageId: string) => {
    console.log('Treatment selected:', treatmentName, 'for message:', messageId);
    
    // Set the input message to the selected treatment name
    setInputMessage(treatmentName);
    
    // Send the treatment name to the API as the user's message
    await handleMessageSubmit(treatmentName);
  };

  const startNewSession = async () => {
    setIsLoading(true);
    setError(null);
    setSessionDetails(null);
    setShowStructuredForm(true); // Reset to show structured form for new session
    setPatientInfoSubmitted(false);
    setSelectedOption(undefined); // Clear selected option for new session
    setDisabledOptions({}); // Clear disabled options for new session
    
    // Clear existing session from localStorage when starting new session
    localStorage.removeItem('current_session_id');
    
    if (doctorId) {
      localStorage.removeItem(`session_id_doctor_${doctorId}`);
    }
    
    try {
      const response = await createSession();
      if (response.data.status === 'success') {
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        
        // Save the session ID to localStorage with doctor's ID as part of the key
        if (doctorId) {
          const sessionData = {
            id: newSessionId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          };
          localStorage.setItem(`session_id_doctor_${doctorId}`, JSON.stringify(sessionData));
        }
        
        // Also set current_session_id for compatibility
        localStorage.setItem('current_session_id', newSessionId);
        incrementSessionCount();
        
        // Don't add any welcome message - let the API provide the first message through fetchSessionDetails
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start new chat session. Please try again.';
      
      // Check if it's a token expiration error
      if (errorMessage.toLowerCase().includes('session has expired') || 
          errorMessage.toLowerCase().includes('token has expired')) {
        // Don't handle here since AuthContext will handle logout
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear session data (for logout or manual new session)
  const clearSessionData = () => {
    localStorage.removeItem('current_session_id');
    if (doctorId) {
      localStorage.removeItem(`session_id_doctor_${doctorId}`);
    }
    setSessionId(null);
    setSessionDetails(null);
    setMessages([]);
    setShowStructuredForm(true);
    setPatientInfoSubmitted(false);
    setSelectedOption(undefined);
    setDisabledOptions({});
  };

  // Filter chat history based on search query
  const filteredChatHistory = chatHistory.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );



  // Function to handle opening the iframe popup
  const handleOpenIframe = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User ID not found. Please try again.');
      return;
    }
    setShowIframePopup(true);
  };

  // Function to handle closing the iframe popup
  const handleCloseIframe = () => {
    console.log('handleCloseIframe triggered');
    setShowIframePopup(false);
  };

  // Handle escape key to close iframe
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showIframePopup) {
        handleCloseIframe();
      }
    };

    if (showIframePopup) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showIframePopup]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  const handleNewSessionClick = () => {
    // Check if there are unsaved messages in current session
    if (messages.length > 0 && messages.some(msg => msg.sender === 'user')) {
      setIsNewSessionModalOpen(true);
    } else {
      startNewSession();
    }
  };

  const handleConfirmNewSession = () => {
    setIsNewSessionModalOpen(false);
    clearSessionData(); // Clear existing session data
    startNewSession(); // Start fresh new session
  };

  useEffect(() => {
    // Show offer button if patient info has been submitted and the last message is from the agent
    if (patientInfoSubmitted && messages.length > 0 && messages[messages.length - 1].sender === 'agent') {
      setShowOfferButton(true);
    } else {
      setShowOfferButton(false);
    }
  }, [messages, patientInfoSubmitted]);

  // // Check if agent is asking for Aadhaar upload
  // const shouldShowFileUpload = () => {
  //   // Always return false to keep text input bar visible
  //   // Users will use the upload button instead of switching to file upload interface
  //   return false;
  // };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!sessionId) {
      setUploadError('No active session. Please try again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null); // Clear previous success message
    const uploadMessageId = `upload-${Date.now()}`;

    try {
      // Create image preview for image files
      let imagePreview: string | undefined;
      if (file.type.startsWith('image/')) {
        imagePreview = await createImagePreview(file);
      }

      // Add user message showing file upload
      const uploadMessage: Message = {
        id: uploadMessageId,
        text: file.name === 'aadhaar_combined.jpg' 
          ? `📎 Uploading Aadhaar card (both sides)...`
          : `📎 Uploading ${file.name}...`,
        sender: 'user',
        timestamp: new Date(),
        imagePreview,
        fileName: file.name,
      };
      
      setMessages(prevMessages => [...prevMessages, uploadMessage]);

      // Upload file to backend
      const response = await uploadDocument(file, sessionId);
      
      if (response.data.status === 'success') {
        // Update upload message to show success
        const successText = file.name === 'aadhaar_combined.jpg' 
          ? `✅ Aadhaar card (both sides) uploaded successfully!`
          : `✅ ${file.name} uploaded successfully!`;
        
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === uploadMessageId 
              ? { ...msg, text: successText }
              : msg
          )
        );
        setUploadSuccess(successText);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadSuccess(null);
        }, 3000);

        // Hide upload interface

        // Show OCR results in chat if available
        if (response.data.data?.ocr_result) {
          const ocrData = response.data.data.ocr_result;
          const ocrMessage: Message = {
            id: `ocr-${Date.now()}`,
            text: `📋 **Aadhaar Card Details Extracted Successfully!**\n\n**👤 Name:** ${ocrData.name}\n**🆔 Aadhaar Number:** ${ocrData.aadhaar_number}\n**📅 Date of Birth:** ${ocrData.dob}\n**👥 Gender:** ${ocrData.gender}\n**🏠 Address:** ${ocrData.address}\n**📍 Pincode:** ${ocrData.pincode}\n**👨‍👦 Father's Name:** ${ocrData.father_name}${ocrData.husband_name ? `\n**👨‍👩‍👦 Husband's Name:** ${ocrData.husband_name}` : ''}\n\n✅ All details have been automatically extracted and saved from both sides of the Aadhaar card.`,
            sender: 'agent',
            timestamp: new Date(),
          };
          
          setMessages(prevMessages => [...prevMessages, ocrMessage]);
        }

        // Extract success message from API response and send to agent
        const successMessage = response.data.message || 'Document processed successfully.';
        
        // If we have OCR data, send it along with the success message
        let messageToAgent = successMessage;
        if (response.data.data?.ocr_result) {
          const ocrData = response.data.data.ocr_result;
          const uploadType = file.name === 'aadhaar_combined.jpg' ? 'both sides of the Aadhaar card' : 'the document';
          messageToAgent = `${successMessage}\n\nExtracted Details from ${uploadType}:\n\n\n\nName: ${ocrData.name}\n\nAadhaar: ${ocrData.aadhaar_number}\n\nDOB: ${ocrData.dob}\n\nGender: ${ocrData.gender}\n\nFather's Name: ${ocrData.father_name}\n\nPincode: ${ocrData.pincode}\n\nAddress: ${ocrData.address}`;
        }
        
        // Send the success message to the agent
        setTimeout(async () => {
          await handleMessageSubmit(messageToAgent);
        }, 1500); // Increased delay to ensure OCR results are shown first

      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      
      // Update upload message to show error
      const errorText = file.name === 'aadhaar_combined.jpg' 
        ? `❌ Aadhaar card upload failed: ${errorMessage}`
        : `❌ Upload failed: ${errorMessage}`;
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === uploadMessageId 
            ? { ...msg, text: errorText }
            : msg
        )
      );
      
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle PAN card upload (new function)
  const handlePanCardUpload = async (file: File) => {
    if (!sessionId) {
      setUploadError('No active session. Please try again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null); // Clear previous success message
    const uploadMessageId = `upload-${Date.now()}`;

    try {
      // Create image preview for image files
      let imagePreview: string | undefined;
      if (file.type.startsWith('image/')) {
        imagePreview = await createImagePreview(file);
      }

      // Add user message showing file upload
      const uploadMessage: Message = {
        id: uploadMessageId,
        text: `📎 Uploading PAN card: ${file.name}...`,
        sender: 'user',
        timestamp: new Date(),
        imagePreview,
        fileName: file.name,
      };
      
      setMessages(prevMessages => [...prevMessages, uploadMessage]);

      // Upload PAN card to backend using the new API
      const response = await uploadPanCard(file, sessionId);
      
      if (response.data.status === 'success') {
        // Update upload message to show success
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === uploadMessageId 
              ? { ...msg, text: `✅ PAN card uploaded successfully!` }
              : msg
          )
        );
        setUploadSuccess(`✅ PAN card uploaded successfully!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadSuccess(null);
        }, 3000);

        // Hide upload interface

        // Show OCR results in chat if available
        if (response.data.data?.ocr_result) {
          const ocrData = response.data.data.ocr_result;
          const ocrMessage: Message = {
            id: `ocr-${Date.now()}`,
            text: `📋 **PAN Card Details Extracted Successfully!**\n\n**🆔 PAN Number:** ${ocrData.pan_card_number}\n**👤 Name:** ${ocrData.person_name}\n**📅 Date of Birth:** ${ocrData.date_of_birth}\n**👥 Gender:** ${ocrData.gender}\n**👨‍👦 Father's Name:** ${ocrData.father_name}\n\n✅ All details have been automatically extracted and saved.`,
            sender: 'agent',
            timestamp: new Date(),
          };
          
          setMessages(prevMessages => [...prevMessages, ocrMessage]);
        }

        // Extract success message from API response and send to agent
        const successMessage = response.data.message || 'PAN card processed successfully.';
        
        // If we have OCR data, send it along with the success message
        let messageToAgent = successMessage;
        if (response.data.data?.ocr_result) {
          const ocrData = response.data.data.ocr_result;
          messageToAgent = `${successMessage}\n\nExtracted PAN Card Details:\n\n\n\nPAN Number: ${ocrData.pan_card_number}\n\nName: ${ocrData.person_name}\n\nDate of Birth: ${ocrData.date_of_birth}\n\nGender: ${ocrData.gender}\n\nFather's Name: ${ocrData.father_name}`.split('\n').join('\n');
        }
        
        // Send the success message to the agent
        setTimeout(async () => {
          await handleMessageSubmit(messageToAgent);
        }, 1500); // Increased delay to ensure OCR results are shown first

      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('PAN card upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      
      // Update upload message to show error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === uploadMessageId 
            ? { ...msg, text: `❌ Upload failed: ${errorMessage}` }
            : msg
        )
      );
      
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };



  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (selectedDocumentType === 'aadhaar') {
        handleFileUpload(file);
      } else if (selectedDocumentType === 'pan') {
        handlePanCardUpload(file);
      }
    }
    event.target.value = ''; // Clear the input value after selection
    setSelectedDocumentType(null); // Reset document type selection
  };

  // Handle link clicks to open in iframe modal
  const handleLinkClick = (url: string) => {
    setLinkIframeUrl(url);
    setShowLinkIframe(true);
  };

  // Handle closing the link iframe modal
  const handleCloseLinkIframe = () => {
    setShowLinkIframe(false);
    setLinkIframeUrl('');
  };

    return (
    <div className="whatsapp-chat-container bg-[#E5DDD5]">
      {/* Company Logo and Doctor Info Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ height: '3rem' }}>
        <div className="flex items-center flex-shrink-0">
          <img 
            src="/images/Careena-Logo-cropped.png" 
            alt="Careena" 
            className="h-8 max-h-8 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
          {doctorName && (
            <span className="text-sm text-gray-700 font-medium truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">
              Dr. {doctorName.replace('_', ' ')}
            </span>
          )}
          <div className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
            {sessionCount}/10
          </div>
          <button 
            onClick={handleLogoutClick}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* WhatsApp-style Header - Mobile Responsive */}
      <div className="whatsapp-header bg-primary-600 text-white flex items-center justify-between px-4 py-2 sm:py-3 chat-header min-h-[3.5rem] sm:min-h-[4.5rem]">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <img
                src="/images/careeena-avatar.jpg"
                alt="Careena"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full online-status"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-base sm:text-lg truncate">Medical Loan Assistant</h2>
              <p className="text-xs text-white opacity-80 hidden sm:block">Online • Ready to help</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 sm:p-2 hover:bg-primary-700 rounded-full transition-colors chat-button"
            title="Chat History"
          >
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={handleNewSessionClick}
            className="flex items-center space-x-1 p-1.5 sm:p-2 hover:bg-primary-700 rounded-full transition-colors chat-button"
            title="New Inquiry"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:hidden">New Inquiry</span>
          </button>
        </div>
      </div>

      {/* Doctor Info Bar below Medical Loan Assistant */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {doctorName && (
            <span className="text-xs text-gray-700 font-medium truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">
              Dr. {doctorName.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
            {sessionCount}/10
          </div>
          <button 
            onClick={handleLogoutClick}
            className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat History Sidebar - WhatsApp style */}
        {showHistory && (
          <div className="absolute inset-0 z-20 bg-white">
            <div className="flex flex-col h-full">
              {/* History Header */}
              <div className="bg-primary-600 text-white px-4 py-3 flex items-center space-x-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="font-semibold">Chat History</h3>
              </div>
              
              {/* Search Bar */}
              <div className="p-4 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* History List */}
              <div className="flex-1 overflow-y-auto">
                {filteredChatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <History className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center">
                      {searchQuery ? 'No matching conversations found' : 'No chat history available'}
                    </p>
                  </div>
                ) : (
                  filteredChatHistory.map((session) => (
                    <div
                      key={session.id}
                      data-session-id={session.id}
                      onClick={() => handleHistoryItemClick(session)}
                      className="history-item p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 active:bg-gray-100"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                            <Robot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{session.title}</h4>
                          <p className="text-sm text-gray-500 truncate mt-1">{session.lastMessage}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat content area - Fixed layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Session status bar - Fixed */}
          {sessionDetails && sessionDetails.phoneNumber && (
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-600 flex-shrink-0">
              {sessionDetails.status && (
                <span>Status: {sessionDetails.status}</span>
              )}
            </div>
          )}
          
          {/* Offer button - Fixed */}
          {showOfferButton && (
            <div className="px-4 py-3 flex justify-center flex-shrink-0 bg-gray-50">
              <button
                onClick={handleOpenIframe}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-full flex items-center shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <img 
                  src="https://carepay.money/static/media/Cards%202.f655246b233e2a166c74.gif" 
                  alt="Credit Card" 
                  className="h-6 w-6 mr-2" 
                />
                <span className="text-sm">No cost EMI on credit cards</span>
                <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded-full">⚡ Quick</span>
              </button>
            </div>
          )}
          
          {/* Error message - Fixed */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex-shrink-0">
              {error}
            </div>
          )}
          
          {/* Chat messages - Scrollable area only */}
          <div className="whatsapp-messages-area p-3 bg-[#E5DDD5] chat-scrollbar">
            <div className="space-y-1">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onButtonClick={handleButtonClick}
                  selectedOption={selectedOption}
                  disabledOptions={disabledOptions[message.id] || false}
                  onLinkClick={handleLinkClick}
                  onTreatmentSelect={handleTreatmentSelect}
                />
              ))}
              {isLoading && messages.some(m => m.sender === 'user') && (
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <img
                      src="/images/careeena-avatar.jpg"
                      alt="Careena"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  </div>
                  <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm max-w-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500 text-xs">Careena is typing</span>
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message input area - Fixed */}
          <div className="whatsapp-input-area p-3 bg-white border-t border-gray-200 chat-input-container">
            {shouldShowStructuredForm() ? (
              <StructuredInputForm 
                onSubmit={handleStructuredFormSubmit}
                isLoading={isLoading}
              />
            ) : (
              /* Regular Message Input */
              <>
                <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !sessionId}
                    title="Upload file"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isLoading || !sessionId}
                  />
                  
                  <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 chat-input text-sm focus:outline-none focus:ring-0 focus:border-none"
                      disabled={isLoading || !sessionId}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed chat-button"
                    disabled={isLoading || !inputMessage.trim() || !sessionId}
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </form>
                
                {/* File upload status */}
                {isUploading && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>Uploading file...</span>
                  </div>
                )}
                
                {uploadError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {uploadError}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    {uploadSuccess}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowUploadModal(false);
            setSelectedDocumentType(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-[90vw] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedDocumentType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Select the type of document you want to upload:
              </div>
              
              {/* Aadhaar Card Option */}
              <button
                onClick={() => setSelectedDocumentType('aadhaar')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedDocumentType === 'aadhaar'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Aadhaar Card</div>
                    <div className="text-sm text-gray-500">Both front and back sides</div>
                  </div>
                </div>
              </button>
              
              {/* PAN Card Option */}
              <button
                onClick={() => setSelectedDocumentType('pan')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedDocumentType === 'pan'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">PAN Card</div>
                    <div className="text-sm text-gray-500">Front side only</div>
                  </div>
                </div>
              </button>
              
              {/* Upload Component */}
              {selectedDocumentType && (
                <div className="pt-4">
                  {selectedDocumentType === 'aadhaar' ? (
                    <AadhaarUpload
                      onUpload={async (combinedFile) => {
                        // Handle combined Aadhaar upload
                        setShowUploadModal(false);
                        // Call the Aadhaar upload function with combined file
                        await handleFileUpload(combinedFile);
                      }}
                      isUploading={isUploading}
                      acceptedTypes={['image/jpeg', 'image/png', 'image/jpg']}
                      maxSize={10}
                    />
                  ) : (
                    <PanCardUpload
                      onFileSelect={() => {
                        // Handle file selection for PAN card
                        // Don't close modal or upload immediately - let user see preview and click upload button
                      }}
                      onUpload={handlePanCardUpload}
                      isUploading={isUploading}
                      acceptedTypes={['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']}
                      maxSize={10}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Iframe Modal */}
      {showLinkIframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-7xl h-[95vh] max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
              <button
                onClick={handleCloseLinkIframe}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Iframe Content */}
            <div className="flex-1 p-4 iframe-container">
              <iframe
                src={linkIframeUrl}
                title="Application Status"
                className="w-full h-full border-0 rounded-lg iframe-scrollbar"
                style={{ 
                  minHeight: '400px',
                  overflow: 'auto',
                  WebkitOverflowScrolling: 'touch'
                }}
                scrolling="auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Iframe Popup Modal */}
      {showIframePopup && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={handleCloseIframe}
              className="bg-white rounded-full p-2 shadow-lg"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg 
                className="w-6 h-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          <iframe
            src={`https://carepay.money/patient/razorpayoffer/${localStorage.getItem('userId')}`}
            title="Razorpay Offer"
            className="w-full h-full iframe-scrollbar"
            style={{ 
              overflow: 'auto',
              border: 'none',
              WebkitOverflowScrolling: 'touch',
              width: '100vw',
              height: '100vh',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: 'scale(1)',
              transformOrigin: '0 0',
              WebkitTransform: 'scale(1)',
              WebkitTransformOrigin: '0 0',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)'
            }}
            scrolling="auto"
            onClick={(e) => e.stopPropagation()}
          ></iframe>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
      >
        Are you sure you want to logout?
      </Modal>

      {/* New Session Confirmation Modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onConfirm={handleConfirmNewSession}
        title="Start New Chat"
      >
        You have an active conversation. Starting a new chat will save the current conversation to history. Are you sure you want to continue?
      </Modal>
    </div>
  );
};

export default ChatPage;