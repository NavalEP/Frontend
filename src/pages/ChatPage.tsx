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
  fullName: string | null;
  phoneNumber: string;
  bureau_decision_details: string | null;
  status?: string;
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize chat with welcome message
  useEffect(() => {
    if (!sessionId) {
      startNewSession();
    }
  }, []);

  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);
  
  const fetchSessionDetails = async () => {
    if (!sessionId) return;
    
    try {
      const response = await getSessionDetails(sessionId);
      setSessionDetails(response.data.data);
    } catch (err) {
      console.error('Error fetching session details:', err);
      // Don't show error to user as this is not critical
    }
  };
  
  const startNewSession = async () => {
    setIsLoading(true);
    setError(null);
    setSessionDetails(null);
    
    try {
      const response = await createSession();
      if (response.data.status === 'success') {
        const newSessionId = response.data.session_id;
        setSessionId(newSessionId);
        incrementSessionCount();
        
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            text: `Hello! I'm here to assist you with your patient's medical loan. Let's get started. First, kindly provide me with the following details?
            1. Patient's full name
            2. Patient's phone number (linked to their PAN)
            3. The cost of the treatment
            4. Monthly income of your patient. **Example input format: name: John Doe phone number: 1234567890 treatment cost: 10000 monthly income: 50000**`,
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
      {sessionDetails && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
          {sessionDetails.fullName && (
            <p className="text-gray-700">Name: {sessionDetails.fullName}</p>
          )}
          {sessionDetails.bureau_decision_details && (
            <p className="text-gray-700 mt-1">
              Decision: {sessionDetails.bureau_decision_details}
            </p>
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