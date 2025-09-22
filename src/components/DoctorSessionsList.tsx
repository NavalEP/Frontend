import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Phone, User } from 'lucide-react';
import { getDoctorSessions, formatIndianTime } from '../services/api';

interface PatientInfo {
  name: string;
  phone_number: string;
  treatment_cost: number;
  monthly_income: number;
}

interface DoctorSession {
  session_id: string;
  application_id: string;
  phone_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient_info: PatientInfo;
}

interface DoctorSessionsListProps {
  doctorId: string;
  onSessionSelect: (sessionId: string) => void;
  selectedSessionId?: string;
}

const DoctorSessionsList: React.FC<DoctorSessionsListProps> = ({
  doctorId,
  onSessionSelect,
  selectedSessionId
}) => {
  const [sessions, setSessions] = useState<DoctorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: false,
    totalSessions: 0
  });

  // Load sessions
  const loadSessions = async (offset: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDoctorSessions(
        doctorId,
        pagination.limit,
        offset,
        statusFilter || undefined
      );
      
      const newSessions = response.sessions || [];
      
      if (append) {
        setSessions(prev => [...prev, ...newSessions]);
      } else {
        setSessions(newSessions);
      }
      
      setPagination(prev => ({
        ...prev,
        offset: response.pagination.offset,
        hasMore: response.pagination.has_more,
        totalSessions: response.total_sessions
      }));
      
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Load sessions on mount and when filters change
  useEffect(() => {
    loadSessions(0, false);
  }, [doctorId, statusFilter]);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => {
    const searchLower = searchQuery.toLowerCase();
    const patientName = session.patient_info.name.toLowerCase();
    const phoneNumber = session.patient_info.phone_number;
    const status = session.status.toLowerCase();
    
    return patientName.includes(searchLower) || 
           phoneNumber.includes(searchQuery) || 
           status.includes(searchLower);
  });

  // Load more sessions
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      loadSessions(pagination.offset + pagination.limit, true);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'collecting_additional_details':
        return 'bg-blue-100 text-blue-800';
      case 'additional_details_completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Loan Application Start';
      case 'collecting_additional_details':
        return 'Collection Step';
      case 'additional_details_completed':
        return 'Loan Application Complete';
      default:
        return status.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">Error loading sessions</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button 
          onClick={() => loadSessions(0, false)}
          className="mt-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#514c9f' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Patient Sessions</h2>
          <div className="text-sm text-gray-600">
            {pagination.totalSessions} total sessions
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, phone, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Loan Application Start</option>
              <option value="collecting_additional_details">Collection Step</option>
              <option value="additional_details_completed">Loan Application Complete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-gray-600">Loading sessions...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-600">
            {searchQuery || statusFilter ? 'No sessions match your filters' : 'No sessions found'}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredSessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => onSessionSelect(session.session_id)}
                className={`
                  p-4 bg-white rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
                  ${selectedSessionId === session.session_id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {/* Patient Info Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.patient_info.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-1" />
                        {session.patient_info.phone_number}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                    {formatStatus(session.status)}
                  </span>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 text-green-600 flex items-center justify-center">
                      <span className="text-sm font-bold">₹</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Treatment Cost</div>
                      <div className="font-medium text-green-700">
                        {formatCurrency(session.patient_info.treatment_cost)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 text-blue-600 flex items-center justify-center">
                      <span className="text-sm font-bold">₹</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Monthly Income</div>
                      <div className="font-medium text-blue-700">
                        {formatCurrency(session.patient_info.monthly_income)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatIndianTime(session.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Updated: {formatIndianTime(session.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More Sessions'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorSessionsList;
