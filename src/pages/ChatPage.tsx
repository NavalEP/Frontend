import React, { useState, useEffect, useRef } from 'react';
import { createSession, sendMessage, getSessionDetails, uploadDocument, uploadPanCard, getUserDetailsBySessionId } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/ChatMessage';
import StructuredInputForm from '../components/StructuredInputForm';
import TypingAnimation from '../components/TypingAnimation';

import PanCardUpload from '../components/PanCardUpload';
import AadhaarUpload from '../components/AadhaarUpload';
import Modal from '../components/Modal';
import EditProfileForm from '../components/EditProfileForm';
import { SendHorizonal, Plus, Notebook as Robot, History, ArrowLeft, Search, LogOut, Upload, User, MapPin, Briefcase, Calendar, Mail, GraduationCap, Heart, Edit3, Phone, Menu } from 'lucide-react';

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
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
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
  const [selectedTreatments, setSelectedTreatments] = useState<Record<string, string>>({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'aadhaar' | 'pan' | null>(null);

  const [showLinkIframe, setShowLinkIframe] = useState(false);
  const [linkIframeUrl, setLinkIframeUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile Summary State
  const [showProfileSummary, setShowProfileSummary] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  
  // Hamburger Menu State
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  
  // Helper function to format welcome message from API response
  const formatWelcomeMessage = (content: string): string => {
    // If content already has formatting, return it as is
    if (content.includes('1. Patient') || content.includes('**Example input format**')) {
      return content;
    }
    
    // Return the API content as is
    return content;
  };
  
  // Helper function to check if user has sent their first message (patient information)
  const hasUserSentFirstMessage = (messages: Message[]): boolean => {
    return messages.some(msg => 
      msg.sender === 'user' && 
      msg.text.includes('Name:') && 
      msg.text.includes('Phone Number:') && 
      msg.text.includes('Treatment Cost:') && 
      msg.text.includes('Monthly Income:')
    );
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to restore existing session
  const restoreExistingSession = async () => {
    // Check if there's an existing session for this doctor
    const existingSessionData = localStorage.getItem(`session_id_doctor_${doctorId}`);
    const currentSessionId = localStorage.getItem('current_session_id');
    
    console.log('Existing session data:', existingSessionData);
    console.log('Current session ID:', currentSessionId);
    
    // Prioritize existing session data, fallback to current session ID
    let sessionIdToRestore = null;
    let sessionData = null;
    
    if (existingSessionData) {
      try {
        sessionData = JSON.parse(existingSessionData);
        sessionIdToRestore = sessionData.id;
        console.log('Using existing session data, session ID:', sessionIdToRestore);
      } catch (error) {
        console.error('Error parsing existing session data:', error);
      }
    } else if (currentSessionId) {
      // Fallback to current session ID if no doctor-specific session data
      sessionIdToRestore = currentSessionId;
      console.log('Using current session ID as fallback:', sessionIdToRestore);
    }
    
    // Also check chat history for the most recent session if no session data found
    if (!sessionIdToRestore && doctorId) {
      const savedHistory = localStorage.getItem(`chat_history_doctor_${doctorId}`);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          if (parsedHistory.length > 0) {
            const mostRecentSession = parsedHistory[0];
            sessionIdToRestore = mostRecentSession.id;
            console.log('Using most recent session from history:', sessionIdToRestore);
          }
        } catch (error) {
          console.error('Error parsing chat history:', error);
        }
      }
    }
    
    if (sessionIdToRestore) {
      try {
        // Check if session is still valid (not expired)
        const isSessionValid = !sessionData?.expiresAt || new Date(sessionData.expiresAt) > new Date();
        console.log('Session valid:', isSessionValid);
        
        if (isSessionValid) {
          console.log('Restoring existing session:', sessionIdToRestore);
          setSessionId(sessionIdToRestore);
          
          // Update localStorage to ensure consistency
          if (doctorId) {
            const sessionDataToSave = {
              id: sessionIdToRestore,
              expiresAt: sessionData?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            };
            localStorage.setItem(`session_id_doctor_${doctorId}`, JSON.stringify(sessionDataToSave));
          }
          localStorage.setItem('current_session_id', sessionIdToRestore);
          
          // Load session details and chat history
          const response = await getSessionDetails(sessionIdToRestore);
          if (response.data) {
            console.log('Session details loaded:', response.data);
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
              console.log('Loading chat history, messages count:', response.data.history.length);
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
              
              // Check if user has sent their first message (patient information)
              const hasFirstMessage = hasUserSentFirstMessage(historyMessages);
              console.log('User has sent first message:', hasFirstMessage);
              
              if (hasFirstMessage) {
                // User has already sent their first message, show chat history
                console.log('Showing chat history - user has sent first message');
                setShowStructuredForm(false);
                setPatientInfoSubmitted(true);
              } else {
                // User hasn't sent their first message yet, show structured form
                console.log('Showing structured form - user has not sent first message');
                setShowStructuredForm(true);
                setPatientInfoSubmitted(false);
              }
            } else {
              // No history but session exists - show structured form for new conversation
              console.log('No history found, showing structured form for new conversation');
              setMessages([]);
              setShowStructuredForm(true);
              setPatientInfoSubmitted(false);
            }
          } else {
            // Session not found on server, start new session
            console.log('Session not found on server, starting new session');
            await startNewSession();
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

  // Initialize chat session - start new session on first login, restore on subsequent visits
  useEffect(() => {
    const initializeSession = async () => {
      if (!doctorId) return;
      
      console.log('Initializing session for doctor:', doctorId);
      
      // Check if this is a fresh login
      const isFreshLogin = localStorage.getItem('is_fresh_login') === 'true';
      
      if (isFreshLogin) {
        // Always start a new session when user first enters chat page after login
        console.log('Starting new session for fresh login');
        localStorage.removeItem('is_fresh_login'); // Clear the flag
        await startNewSession();
      } else {
        // For subsequent visits, try to restore existing session
        console.log('Attempting to restore existing session');
        await restoreExistingSession();
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
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
        console.log('Loaded chat history:', parsedHistory);
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
      setSelectedTreatments({}); // Clear selected treatments when loading a session
      setDisabledOptions({}); // Clear disabled options when loading a session
      
      // Update localStorage to reflect the loaded session
      if (doctorId) {
        const sessionData = {
          id: sessionId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        };
        localStorage.setItem(`session_id_doctor_${doctorId}`, JSON.stringify(sessionData));
      }
      localStorage.setItem('current_session_id', sessionId);
      
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
          
          // Check if user has sent their first message (patient information)
          if (hasUserSentFirstMessage(historyMessages)) {
            // User has already sent their first message, show chat history
            setShowStructuredForm(false);
            setPatientInfoSubmitted(true);
          } else {
            // User hasn't sent their first message yet, show structured form
            setShowStructuredForm(true);
            setPatientInfoSubmitted(false);
          }
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
          
          // Check if user has sent their first message (patient information)
          if (hasUserSentFirstMessage(historyMessages)) {
            // User has already sent their first message, show chat history
            setShowStructuredForm(false);
            setPatientInfoSubmitted(true);
          } else {
            // User hasn't sent their first message yet, show structured form
            setShowStructuredForm(true);
            setPatientInfoSubmitted(false);
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
    // If showStructuredForm is false, don't show it
    if (!showStructuredForm) return false;
    
    // If patient info is already submitted, don't show structured form
    if (patientInfoSubmitted) return false;
    
    // If no messages, show structured form
    if (messages.length === 0) return true;
    
    // If only one message and it's from agent (welcome message), show structured form
    if (messages.length === 1 && messages[0].sender === 'agent') return true;
    
    // If user hasn't sent first message, show structured form
    return !hasUserSentFirstMessage(messages);
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
    setLoadingStartTime(Date.now());
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
      setLoadingStartTime(null);
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
    
    // Start loading animation
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    
    // Send the option text (like "Yes" or "No") to the API as the user's message
    await handleMessageSubmit(optionText);
  };

  // Handle treatment selection
  const handleTreatmentSelect = async (treatmentName: string, messageId: string) => {
    console.log('Treatment selected:', treatmentName, 'for message:', messageId);
    
    // Store the selected treatment for this message
    setSelectedTreatments(prev => ({
      ...prev,
      [messageId]: treatmentName
    }));
    
    // Set the input message to the selected treatment name
    setInputMessage(treatmentName);
    
    // Start loading animation
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    
    // Send the treatment name to the API as the user's message
    await handleMessageSubmit(treatmentName);
  };

  const startNewSession = async () => {
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    setError(null);
    setSessionDetails(null);
    setShowStructuredForm(true); // Reset to show structured form for new session
    setPatientInfoSubmitted(false);
    setSelectedOption(undefined); // Clear selected option for new session
    setDisabledOptions({}); // Clear disabled options for new session
    setSelectedTreatments({}); // Clear selected treatments for new session
    
    // Clear all existing session data to ensure fresh start
    localStorage.removeItem('current_session_id');
    
    if (doctorId) {
      localStorage.removeItem(`session_id_doctor_${doctorId}`);
      // Clear all disabled options and selected treatments for this doctor
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`disabled_options_doctor_${doctorId}_`) || 
            key.startsWith(`selected_treatments_doctor_${doctorId}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear any phone number based session data
    if (sessionDetails?.phoneNumber) {
      localStorage.removeItem(`session_id_${sessionDetails.phoneNumber}`);
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
      setLoadingStartTime(null);
    }
  };

  // Function to clear session data (for logout or manual new session)
  const clearSessionData = () => {
    localStorage.removeItem('current_session_id');
    if (doctorId) {
      localStorage.removeItem(`session_id_doctor_${doctorId}`);
      // Clear disabled options and selected treatments for the current session
      if (sessionId) {
        localStorage.removeItem(`disabled_options_doctor_${doctorId}_session_${sessionId}`);
        localStorage.removeItem(`selected_treatments_doctor_${doctorId}_session_${sessionId}`);
      }
    }
    setSessionId(null);
    setSessionDetails(null);
    setMessages([]);
    setShowStructuredForm(true);
    setPatientInfoSubmitted(false);
    setSelectedOption(undefined);
    setDisabledOptions({});
    setSelectedTreatments({});
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

  // Handle click outside to close avatar menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAvatarMenu && !target.closest('.avatar-menu-container')) {
        setShowAvatarMenu(false);
      }
    };

    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarMenu]);

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
    setIsLoading(true);
    setLoadingStartTime(Date.now());
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
      setIsLoading(false);
      setLoadingStartTime(null);
    }
  };

  // Handle PAN card upload (new function)
  const handlePanCardUpload = async (file: File) => {
    if (!sessionId) {
      setUploadError('No active session. Please try again.');
      return;
    }

    setIsUploading(true);
    setIsLoading(true);
    setLoadingStartTime(Date.now());
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
      setIsLoading(false);
      setLoadingStartTime(null);
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

  // Handle profile summary button click
  const handleProfileSummaryClick = async () => {
    if (!sessionId) {
      setProfileError('No active session found.');
      return;
    }

    setShowProfileSummary(true);
    setIsLoadingProfile(true);
    setProfileError(null);
    setUserDetails(null);

    try {
      const response = await getUserDetailsBySessionId(sessionId);
      if (response.data.status === 'success') {
        setUserDetails(response.data);
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user details. Please try again.';
      setProfileError(errorMessage);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle closing profile summary
  const handleCloseProfileSummary = () => {
    setShowProfileSummary(false);
    setUserDetails(null);
    setProfileError(null);
  };

  // Handle opening edit profile form
  const handleOpenEditProfile = () => {
    setShowEditProfile(true);
  };

  // Handle closing edit profile form
  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
  };

  // Handle successful save in edit profile
  const handleEditProfileSaveSuccess = () => {
    // Refresh user details after successful save
    if (sessionId) {
      handleProfileSummaryClick();
    }
  };

  // Helper function to check if edit profile should be disabled
  const isEditProfileDisabled = (): boolean => {
    return sessionDetails?.status === 'additional_details_completed';
  };

  // Load disabled options and selected treatments from localStorage on component mount
  useEffect(() => {
    if (doctorId && sessionId) {
      const savedDisabledOptions = localStorage.getItem(`disabled_options_doctor_${doctorId}_session_${sessionId}`);
      const savedSelectedTreatments = localStorage.getItem(`selected_treatments_doctor_${doctorId}_session_${sessionId}`);
      
      if (savedDisabledOptions) {
        try {
          setDisabledOptions(JSON.parse(savedDisabledOptions));
        } catch (error) {
          console.error('Error parsing saved disabled options:', error);
        }
      }
      
      if (savedSelectedTreatments) {
        try {
          setSelectedTreatments(JSON.parse(savedSelectedTreatments));
        } catch (error) {
          console.error('Error parsing saved selected treatments:', error);
        }
      }
    }
  }, [doctorId, sessionId]);

  // Save disabled options and selected treatments to localStorage whenever they change
  useEffect(() => {
    if (doctorId && sessionId) {
      localStorage.setItem(`disabled_options_doctor_${doctorId}_session_${sessionId}`, JSON.stringify(disabledOptions));
    }
  }, [disabledOptions, doctorId, sessionId]);

  useEffect(() => {
    if (doctorId && sessionId) {
      localStorage.setItem(`selected_treatments_doctor_${doctorId}_session_${sessionId}`, JSON.stringify(selectedTreatments));
    }
  }, [selectedTreatments, doctorId, sessionId]);

    return (
    <div className="whatsapp-chat-container bg-[#E5DDD5]">

      {/* WhatsApp-style Header - Mobile Responsive */}
      <div className="whatsapp-header bg-white text-gray-800 flex items-center justify-between px-4 py-2 sm:py-3 chat-header min-h-[3.5rem] sm:min-h-[4.5rem]">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0 avatar-menu-container">
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="focus:outline-none"
              >
                <span className="relative inline-block">
                  <img
                    src="/images/careeena-avatar.jpg"
                    alt="Careena"
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow"
                  />
                  {/* Online status dot, overlaid on the image */}
                  <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full online-status"></span>
                </span>
                
              </button>
              
              {/* Avatar Menu Dropdown */}
              {showAvatarMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    {/* Your Doctor */}
                    {doctorName && (
                      <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Your doctor: {doctorName.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Session Count */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Session Count</span>
                      <div className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                        {sessionCount}/10
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowHistory(true);
                          setShowAvatarMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <History className="h-4 w-4" />
                        <span>Chat History</span>
                      </button>
                      

                      
                      <button
                        onClick={() => {
                          handleLogoutClick();
                          setShowAvatarMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/Careena-Logo-cropped.png" 
                  alt="Careena" 
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
              
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={handleNewSessionClick}
            className="flex items-center space-x-1 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors chat-button"
            title="New Inquiry"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs">New Inquiry</span>
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

        {/* Hamburger Menu Overlay */}
        {showHamburgerMenu && (
          <div className="absolute inset-0 z-20 bg-white">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="bg-primary-600 text-white px-4 py-3 flex items-center space-x-3">
                <button
                  onClick={() => setShowHamburgerMenu(false)}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="font-semibold">Menu</h3>
              </div>
              
              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Chat History */}
                  <button
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      setShowHistory(true);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <History className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Chat History</div>
                      <div className="text-sm text-gray-500">View previous conversations</div>
                    </div>
                  </button>
                  
                  {/* New Chat */}
                  <button
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      handleNewSessionClick();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">New Chat</div>
                      <div className="text-sm text-gray-500">Start a new conversation</div>
                    </div>
                  </button>
                  
                  {/* Session Info */}
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Session Count</span>
                        <span className="text-sm font-medium text-gray-900">{sessionCount}/10</span>
                      </div>
                      {doctorName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Doctor</span>
                          <span className="text-sm font-medium text-gray-900">{doctorName.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Logout */}
                  <button
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      handleLogoutClick();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Logout</div>
                      <div className="text-sm text-red-500">Sign out of your account</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat content area - Fixed layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Session status bar - Fixed */}
          {sessionDetails && sessionDetails.phoneNumber && (
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-600 flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowHamburgerMenu(true)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  title="Menu"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  {sessionDetails.status && (
                    <span>Status: {
                      sessionDetails.status === 'active' ? 'Loan Application Start' :
                      sessionDetails.status === 'collecting_additional_details' ? 'Collection Step' :
                      sessionDetails.status === 'additional_details_completed' ? 'Loan Application Complete' :
                      sessionDetails.status
                    }</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleProfileSummaryClick}
                className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-200 flex-shrink-0"
                title="Profile Summary"
              >
                <User className="h-4 w-4" />
                <span className="ml-1"> Your Profile Summary</span>
              </button>
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
                  selectedTreatment={selectedTreatments[message.id]}
                />
              ))}
              {isLoading && messages.some(m => m.sender === 'user') && (
                <TypingAnimation 
                  isLoading={isLoading} 
                  startTime={loadingStartTime} 
                />
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
            allow="camera; microphone; geolocation; payment; clipboard-write; web-share; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"
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

      {/* Profile Summary Overlay */}
      {showProfileSummary && (
        <div className="absolute inset-0 z-20 bg-white" style={{ top: '3.5rem' }}>
          <div className="flex flex-col h-full">
            {/* Profile Header */}
            <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCloseProfileSummary}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="font-semibold">Profile Summary</h3>
              </div>
              {userDetails && (
                <button
                  onClick={handleOpenEditProfile}
                  disabled={isEditProfileDisabled()}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
                    isEditProfileDisabled()
                      ? 'bg-gray-400 bg-opacity-20 cursor-not-allowed opacity-50'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                  }`}
                  title={isEditProfileDisabled() ? 'Edit Profile is disabled when loan application is complete' : 'Edit Profile'}
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm">Edit Profile</span>
                </button>
              )}
            </div>
            
            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {isLoadingProfile ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p>Loading profile details...</p>
                </div>
              ) : profileError ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                    <p className="text-center">{profileError}</p>
                  </div>
                </div>
              ) : userDetails ? (
                <div className="space-y-4">
                  {/* User Details Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Personal Information</h4>
                        <p className="text-sm text-gray-500">User details and basic information</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.firstName || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-900">
                            {userDetails.user_details?.dateOfBirth ? new Date(userDetails.user_details.dateOfBirth).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.emailId || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Marital Status</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.maritalStatus || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 text-gray-400 flex items-center justify-center">
                          <span className="text-xs font-bold">♂♀</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Gender</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.gender || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 text-gray-400 flex items-center justify-center">
                          <span className="text-xs font-bold">PAN</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">PAN Number</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.panNo || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 text-gray-400 flex items-center justify-center">
                          <span className="text-xs font-bold">AAD</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Aadhaar Number</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.aadhaarNo || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Mobile Number</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.mobileNumber || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Education Level</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.user_details?.educationLevel || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Details Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Address Information</h4>
                        <p className="text-sm text-gray-500">Residential address details</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Full Address</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.address_details?.address || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">City</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.address_details?.city || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">State</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.address_details?.state || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pincode</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.address_details?.pincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Employment Information</h4>
                        <p className="text-sm text-gray-500">Work and salary details</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Employment Type</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.employment_details?.employmentType || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 text-gray-400 flex items-center justify-center">
                          <span className="text-xs font-bold">₹</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Net Take Home Salary</p>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{userDetails.employment_details?.netTakeHomeSalary?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 md:col-span-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">
                            {userDetails.employment_details?.employmentType === 'SELF_EMPLOYED' ? 'Business Name' : 'Current Company'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {userDetails.employment_details?.employmentType === 'SELF_EMPLOYED' 
                              ? (userDetails.employment_details?.nameOfBusiness || 'N/A')
                              : (userDetails.employment_details?.currentCompanyName || 'N/A')
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Workplace Pincode</p>
                          <p className="text-sm font-medium text-gray-900">{userDetails.employment_details?.workplacePincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Form Modal */}
      {showEditProfile && userDetails && (
        <EditProfileForm
          userDetails={userDetails}
          sessionId={sessionId!}
          onClose={handleCloseEditProfile}
          onSaveSuccess={handleEditProfileSaveSuccess}
        />
      )}
    </div>
  );
};

export default ChatPage;