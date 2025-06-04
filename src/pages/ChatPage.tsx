import React, { useState, useEffect, useRef } from 'react';
import { createSession, sendMessage, getSessionDetails } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/ChatMessage';
import StructuredInputForm from '../components/StructuredInputForm';
import { SendHorizonal, Plus, Notebook as Robot, History } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface SessionDetails {
  phoneNumber: string;
  status?: string;
  history?: Array<{
    type: string;
    content: string;
  }>;
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
  const { incrementSessionCount, phoneNumber } = useAuth();
  
  // Helper function to get consistent welcome message text
  const getWelcomeMessageText = (): string => {
    return `Hello! I'm here to assist you with your patient's medical loan. Let's get started by providing the patient information using the form below.`;
  };

  // Helper function to format welcome message from API response
  const formatWelcomeMessage = (content: string): string => {
    // If content already has formatting, return it as is
    if (content.includes('1. Patient') || content.includes('**Example input format**')) {
      return content;
    }
    
    // Otherwise, return the standard welcome message
    return getWelcomeMessageText();
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize chat with welcome message or retrieve existing session
  useEffect(() => {
    if (!phoneNumber) return;

    const userSessionKey = `session_id_${phoneNumber}`;
    const savedSessionData = localStorage.getItem(userSessionKey);
    
    if (savedSessionData && !isSessionExpired(savedSessionData)) {
      const data = JSON.parse(savedSessionData);
      setSessionId(data.id);
      setMessages([]);
      localStorage.setItem('current_session_id', data.id);
    } else {
      startNewSession();
    }
  }, [phoneNumber]);

  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);
  
  // Load chat history from localStorage
  useEffect(() => {
    if (phoneNumber) {
      const savedHistory = localStorage.getItem(`chat_history_${phoneNumber}`);
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    }
  }, [phoneNumber]);

  // Save chat history to localStorage
  const saveChatHistory = (newSession: ChatSession) => {
    if (!phoneNumber) return;
    
    const updatedHistory = [newSession, ...chatHistory.filter(session => session.id !== newSession.id)].slice(0, 30);
    setChatHistory(updatedHistory);
    localStorage.setItem(`chat_history_${phoneNumber}`, JSON.stringify(updatedHistory));
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
          history: response.data.history
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
          // If no history found, show welcome message
          setMessages([{
            id: 'welcome',
            text: getWelcomeMessageText(),
            sender: 'agent',
            timestamp: new Date(),
          }]);
          setShowStructuredForm(true);
        }
      } else {
        throw new Error('Session not found');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load chat session. Please try again.');
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
        setSessionDetails({
          phoneNumber: response.data.phoneNumber,
          status: response.data.status,
          history: response.data.history
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
          }
        } else if (messages.length === 1 && messages[0].id.startsWith('loading-session')) {
          // If there's no history but we were showing a loading message, show welcome message
          setMessages([
            {
              id: 'welcome',
              text: getWelcomeMessageText(),
              sender: 'agent',
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        // Session not found or empty, start a new session
        if (messages.length === 1 && messages[0].id.startsWith('loading-session')) {
          startNewSession();
        }
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
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
    if (phoneNumber) {
      localStorage.setItem(`chat_history_${phoneNumber}`, JSON.stringify(updatedHistory));
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
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleMessageSubmit(inputMessage);
  };

  const startNewSession = async () => {
    setIsLoading(true);
    setError(null);
    setSessionDetails(null);
    setShowStructuredForm(true); // Reset to show structured form for new session
    
    // Clear existing session from localStorage when starting new session
    localStorage.removeItem('current_session_id');
    
    if (phoneNumber) {
      localStorage.removeItem(`session_id_${phoneNumber}`);
    }
    
    try {
      const response = await createSession();
      if (response.data.status === 'success') {
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        
        // Save the session ID to localStorage with user's phone number as part of the key
        if (phoneNumber) {
          const sessionData = {
            id: newSessionId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          };
          localStorage.setItem(`session_id_${phoneNumber}`, JSON.stringify(sessionData));
        }
        
        // Also set current_session_id for compatibility
        localStorage.setItem('current_session_id', newSessionId);
        incrementSessionCount();
        
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            text: getWelcomeMessageText(),
            sender: 'agent',
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to start new chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSessionExpired = (sessionData: string): boolean => {
    try {
      const data = JSON.parse(sessionData);
      return new Date(data.expiresAt) < new Date();
    } catch {
      return true;
    }
  };

  // Filter chat history based on search query
  const filteredChatHistory = chatHistory.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header - Fixed */}
      <div className="p-4 bg-primary-600 text-white flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <Robot className="h-5 w-5 mr-2" />
          <h2 className="font-semibold text-sm sm:text-base">Medical loan assistant</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn text-sm bg-white text-primary-700 hover:bg-gray-100 py-1 flex items-center"
          >
            <History className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Enquiry History</span>
          </button>
          <button
            onClick={startNewSession}
            className="btn text-sm bg-white text-primary-700 hover:bg-gray-100 py-1 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Main content area with history sidebar - Fixed height */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat History Sidebar Overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-10 bg-black bg-opacity-50" onClick={() => setShowHistory(false)}>
            {/* History Sidebar Content */}
            <div
              className="w-[85vw] sm:w-80 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="font-semibold mb-2">Enquiry History</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chat history..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              {/* History items - Scrollable */}
              <div className="overflow-y-auto flex-1">
                {filteredChatHistory.length === 0 ? (
                  <p className="p-4 text-gray-500">
                    {searchQuery ? 'No matching chats found' : 'No chat history available'}
                  </p>
                ) : (
                  filteredChatHistory.map((session) => (
                    <div
                      key={session.id}
                      data-session-id={session.id}
                      onClick={() => handleHistoryItemClick(session)}
                      className="history-item p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200 active:bg-gray-100"
                    >
                      <h4 className="font-medium text-sm sm:text-base">{session.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{session.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(session.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat content area - Fixed height */}
        <div className="flex-1 flex flex-col h-full">
          {/* Session details - Fixed */}
          {sessionDetails && sessionDetails.phoneNumber && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs sm:text-sm flex-shrink-0">
              <p className="text-gray-700">Phone: {sessionDetails.phoneNumber}</p>
              {sessionDetails.status && (
                <p className="text-gray-700 mt-1">Status: {sessionDetails.status}</p>
              )}
            </div>
          )}
          
          {/* Error message - Fixed */}
          {error && (
            <div className="m-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm flex-shrink-0">
              {error}
            </div>
          )}
          
          {/* Chat messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500 animate-pulse p-3">
                  <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
                  <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
                  <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message input area - Fixed */}
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            {shouldShowStructuredForm() ? (
              <StructuredInputForm 
                onSubmit={handleStructuredFormSubmit}
                isLoading={isLoading}
              />
            ) : (
              <>
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="input flex-1 text-sm sm:text-base"
                    disabled={isLoading || !sessionId}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary p-2 sm:p-3"
                    disabled={isLoading || !inputMessage.trim() || !sessionId}
                  >
                    <SendHorizonal className="h-5 w-5" />
                  </button>
                </form>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {phoneNumber && `Connected as: ${phoneNumber}`}
                  {sessionId && ` • Session ID: ${sessionId.substring(0, 8)}...`}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;