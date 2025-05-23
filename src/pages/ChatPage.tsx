import React, { useState, useEffect, useRef } from 'react';
import { createSession, sendMessage, getSessionDetails } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatMessage from '../components/ChatMessage';
import { SendHorizonal, Plus, Notebook as Robot } from 'lucide-react';

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

const ChatPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { incrementSessionCount, phoneNumber } = useAuth();
  
  // Helper function to get consistent welcome message text
  const getWelcomeMessageText = (): string => {
    return `Hello! I'm here to assist you with your patient's medical loan. Let's get started. First, kindly provide me with the following details?
    1. Patient's full name \n\
    2. Patient's phone number (linked to their PAN) \n\
    3. The cost of the treatment \n\
    4. Monthly income of your patient. \n\
    **Example input format: name: John Doe phone number: 1234567890 treatment cost: 10000 monthly income: 50000**`;
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

    // Check if there's a saved session ID for this user in localStorage
    const userSessionKey = `session_id_${phoneNumber}`;
    const savedSessionId = localStorage.getItem(userSessionKey);
    
    if (savedSessionId) {
      // Restore the existing session
      setSessionId(savedSessionId);
      setMessages([]); // Clear messages until we load them from session details
      
      // Also set current_session_id for compatibility with existing code
      localStorage.setItem('current_session_id', savedSessionId);
    } else {
      // Create a new session if no existing session
      startNewSession();
    }
  }, [phoneNumber]);

  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);
  
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
  
  const startNewSession = async () => {
    setIsLoading(true);
    setError(null);
    setSessionDetails(null);
    
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
          localStorage.setItem(`session_id_${phoneNumber}`, newSessionId);
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
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !sessionId) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const currentMessage = inputMessage.trim();
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    
    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      text: "I'm analyzing your request. This might take up to 1-2 minutes. Please wait...",
      sender: 'agent',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, loadingMessage]);
    
    try {
      const response = await sendMessage(sessionId, currentMessage);
      console.log('API Response:', response.data);
      
      // Remove loading message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== loadingMessage.id));
      
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
      // Remove loading message in case of error
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== loadingMessage.id));
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[calc(100vh-12rem)] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
        <div className="flex items-center">
          <Robot className="h-5 w-5 mr-2" />
          <h2 className="font-semibold">Medical loan assistant</h2>
          {sessionDetails?.status && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary-700 rounded-full">
              {sessionDetails.status}
            </span>
          )}
        </div>
        <button
          onClick={startNewSession}
          className="btn text-sm bg-white text-primary-700 hover:bg-gray-100 py-1 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Enquiry
        </button>
      </div>
      
      {/* Session details */}
      {sessionDetails && sessionDetails.phoneNumber && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
          <p className="text-gray-700">Phone: {sessionDetails.phoneNumber}</p>
          {sessionDetails.status && (
            <p className="text-gray-700 mt-1">Status: {sessionDetails.status}</p>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="m-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
      
      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="input flex-1"
            disabled={isLoading || !sessionId}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !inputMessage.trim() || !sessionId}
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500 text-center">
          {phoneNumber && `Connected as: ${phoneNumber}`}
          {sessionId && ` • Session ID: ${sessionId.substring(0, 8)}...`}
        </p>
      </div>
    </div>
  );
};

export default ChatPage;