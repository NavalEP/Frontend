import React, { useState, useEffect } from 'react';
import { getPatientSessions, getSessionDetailsWithHistory, formatIndianTime } from '../services/api';
import { ArrowLeft, Search, MessageCircle, Calendar, Clock, User } from 'lucide-react';

interface PatientSession {
  session_id: string;
  application_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  phone_number: string;
  doctorId?: string;
  doctorName?: string;
}

// interface PatientSessionsResponse {
//   status: string;
//   phone_number: string;
//   total_sessions: number;
//   sessions: PatientSession[];
// }

interface ChatHistoryItem {
  type: string;
  content: string;
  timestamp?: string;
}

interface SessionDetailsWithHistoryResponse {
  status: string;
  session_id: string;
  phoneNumber: string;
  bureau_decision_details: string | null;
  created_at: string;
  updated_at: string;
  history: ChatHistoryItem[];
  userId: string;
}

interface PatientChatHistoryProps {
  phoneNumber: string;
  onClose: () => void;
  onSessionSelect?: (sessionId: string) => void;
  onBackToMenu?: () => void;
}

const PatientChatHistory: React.FC<PatientChatHistoryProps> = ({
  phoneNumber,
  onClose,
  onSessionSelect,
  onBackToMenu
}) => {
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsWithHistoryResponse | null>(null);
  const [loadingSessionDetails, setLoadingSessionDetails] = useState(false);

  // Fetch patient sessions
  useEffect(() => {
    const fetchPatientSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getPatientSessions(phoneNumber);
        setSessions(response.sessions);
      } catch (err) {
        console.error('Error fetching patient sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch patient sessions');
      } finally {
        setLoading(false);
      }
    };

    if (phoneNumber) {
      fetchPatientSessions();
    }
  }, [phoneNumber]);

  // Fetch session details when a session is selected
  const handleSessionSelect = async (sessionId: string) => {
    try {
      setLoadingSessionDetails(true);
      setSelectedSession(sessionId);
      
      const response = await getSessionDetailsWithHistory(sessionId);
      setSessionDetails(response);
      
      // Call the parent callback if provided
      if (onSessionSelect) {
        onSessionSelect(sessionId);
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat history');
    } finally {
      setLoadingSessionDetails(false);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.doctorName && session.doctorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format session status for display
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedSession && sessionDetails) {
    return (
      <div className="absolute inset-0 z-20 bg-white">
        <div className="flex flex-col h-full">
          {/* Chat History Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetails(null);
                }}
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h3 className="font-semibold">Chat History</h3>
                <p className="text-sm opacity-90">Session: {sessionDetails.session_id}</p>
              </div>
            </div>
            <div className="text-sm opacity-90">
              {sessionDetails.phoneNumber}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loadingSessionDetails ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : sessionDetails.history && sessionDetails.history.length > 0 ? (
              <div className="space-y-4">
                {sessionDetails.history.map((item, index) => (
                  <div
                    key={index}
                    className={`flex ${item.type === 'HumanMessage' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        item.type === 'HumanMessage'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{item.content}</div>
                      {item.timestamp && (
                        <div className={`text-xs mt-1 ${
                          item.type === 'HumanMessage' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatIndianTime(item.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>No chat history available for this session</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 bg-white">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToMenu || onClose}
              className="p-1 hover:bg-primary-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h3 className="font-semibold">Patient Chat History</h3>
              <p className="text-sm opacity-90">{phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <p className="text-center">{error}</p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">
                {searchQuery ? 'No matching sessions found' : 'No chat sessions available'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSessionSelect(session.session_id)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">Session {session.session_id}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {formatStatus(session.status)}
                        </span>
                      </div>
                      
                      {session.doctorName && (
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">Doctor: {session.doctorName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {session.created_at 
                              ? new Date(session.created_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {session.created_at 
                              ? new Date(session.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientChatHistory;
