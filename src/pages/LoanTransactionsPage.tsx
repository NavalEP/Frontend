import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, User, Briefcase, ArrowLeft, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TransactionDetailsOverlay, { Transaction } from '../components/TransactionDetailsOverlay';
import FilterModal, { FilterOptions } from '../components/FilterModal';
import { getLoanTransactions, formatLoanTransaction, getAllChildClinics, ChildClinic } from '../services/loanApi';

interface LoanTransactionsPageProps {
  onClose?: () => void;
  onBackToMenu?: () => void;
}

const LoanTransactionsPage: React.FC<LoanTransactionsPageProps> = ({ onClose, onBackToMenu }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    clinics: [],
    dateRange: { type: 'all' }
  });
  const [childClinics, setChildClinics] = useState<ChildClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<{ name: string; doctorId: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const doctorId = localStorage.getItem('doctorId');
      
      if (!doctorId) {
        setError('Doctor ID not found. Please login again.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch child clinics first
        const clinics = await getAllChildClinics(doctorId).catch(() => []);
        setChildClinics(clinics);
        
        // Fetch transactions based on selected clinic or default
        const transactionDoctorId = selectedClinic ? selectedClinic.doctorId : doctorId;
        
        // Get date parameters from filters
        let startDate = '';
        let endDate = '';
        
        // Helper function to format date as DD-MM-YYYY
        const formatDateDDMMYYYY = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };
        
        if (filters.dateRange.type === 'custom' && filters.dateRange.startDate && filters.dateRange.endDate) {
          // Convert YYYY-MM-DD to DD-MM-YYYY
          const startDateObj = new Date(filters.dateRange.startDate);
          const endDateObj = new Date(filters.dateRange.endDate);
          startDate = formatDateDDMMYYYY(startDateObj);
          endDate = formatDateDDMMYYYY(endDateObj);
        } else if (filters.dateRange.type === 'last7days') {
          const today = new Date();
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          startDate = formatDateDDMMYYYY(sevenDaysAgo);
          endDate = formatDateDDMMYYYY(today);
        } else if (filters.dateRange.type === 'thismonth') {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = formatDateDDMMYYYY(startOfMonth);
          endDate = formatDateDDMMYYYY(today);
        }
        
        // Get loan status filter (single selection)
        const loanStatus = filters.status.length > 0 ? filters.status[0] : '';
        
        const loanTransactions = await getLoanTransactions(transactionDoctorId, {
          startDate: startDate,
          endDate: endDate,
          loanStatus: loanStatus
        });
        
        const formattedTransactions = loanTransactions.map(loan => formatLoanTransaction(loan));
        console.log('Formatted transactions:', formattedTransactions.map(t => ({ id: t.id, status: t.status, approved: t.approved })));
        setTransactions(formattedTransactions);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedClinic, filters.dateRange, filters.status]);

  // Predefined status filters - match the API loanStatus values
  const availableStatuses = [
    'APPROVED',
    'REJECT',
    'DISBURSED',
    'INCOME VERIFICATION REQURIED'
  ];

  // Use child clinics from API
  const availableClinics = useMemo(() => {
    return childClinics.map(clinic => clinic.clinicName).sort();
  }, [childClinics]);

  // Apply filters and search
  const filtered = useMemo(() => {
    let result = transactions;

    // Apply search filter
    if (query) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Note: Status filtering is now handled server-side via API
    // Client-side status filtering removed since it's now done by the backend

    // Apply clinic filter (match with child clinics)
    if (filters.clinics.length > 0 && childClinics.length > 0) {
      // Find the doctorIds for selected clinic names
      const selectedDoctorIds = childClinics
        .filter(clinic => filters.clinics.includes(clinic.clinicName))
        .map(clinic => clinic.doctorId);
      
      // Filter transactions by matching userId with selected doctorIds
      result = result.filter(t => selectedDoctorIds.includes(t.userId));
    }

    // Apply date filter
    if (filters.dateRange.type !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(t => {
        const transactionDate = new Date(t.appliedAt);
        
        switch (filters.dateRange.type) {
          case 'last7days':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return transactionDate >= sevenDaysAgo;
          
          case 'thismonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return transactionDate >= startOfMonth;
          
          case 'custom':
            if (filters.dateRange.startDate && filters.dateRange.endDate) {
              const startDate = new Date(filters.dateRange.startDate);
              const endDate = new Date(filters.dateRange.endDate);
              endDate.setHours(23, 59, 59, 999); // Include the entire end date
              return transactionDate >= startDate && transactionDate <= endDate;
            }
            return true;
          
          default:
            return true;
        }
      });
    }

    return result;
  }, [transactions, query, filters]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClinicSelect = (clinicName: string, doctorId: string) => {
    setSelectedClinic({ name: clinicName, doctorId });
    // Reset filters when selecting a clinic
    setFilters({ status: [], clinics: [], dateRange: { type: 'all' } });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-3 flex items-center space-x-3">
        <button onClick={() => onBackToMenu ? onBackToMenu() : (onClose ? onClose() : navigate(-1))} className="p-1 hover:bg-primary-700 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="ml-3 font-semibold text-lg">All Applications</h3>
      </div>

      {/* Sticky Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by patient name"
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white shadow-sm"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <button 
              onClick={() => setShowFilterModal(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto">

          {/* Active Filters Summary */}
          {(filters.status.length > 0 || selectedClinic || filters.dateRange.type !== 'all') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-blue-800 font-medium">Active filters:</span>
                  
                  {filters.status.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Status: {filters.status[0]}
                    </span>
                  )}
                  
                  {selectedClinic && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Clinic: {selectedClinic.name}
                    </span>
                  )}
                  
                  {filters.dateRange.type !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Date: {filters.dateRange.type === 'last7days' ? 'Last 7 days' : 
                            filters.dateRange.type === 'thismonth' ? 'This month' : 'Custom range'}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setFilters({ status: [], clinics: [], dateRange: { type: 'all' } });
                    setSelectedClinic(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Unable to load loan transactions</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  {error.includes('API server') && (
                    <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                      <strong>Technical Note:</strong> The backend API server may not be running or configured correctly. 
                      Please ensure the Django API server is running on port 8000 and serving API responses.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }} 
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Retry
                </button>
                <button 
                  onClick={() => setError(null)} 
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            /* Transaction List */
            <div className="space-y-4">
              {(query ? filtered : transactions).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="w-full text-left space-y-2 border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:bg-gray-50 transition-colors"
                >
                  {/* Patient Name */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-[#EEF2FF] rounded-full">
                      <User className="h-5 w-5 text-[#4F46E5]" />
                    </div>
                    <div className="text-gray-900 font-medium">{t.name}</div>
                  </div>

                  {/* Loan Amount */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-[#EEF2FF] rounded-full">
                      <span className="h-5 w-5 inline-flex items-center justify-center text-[#4F46E5]">₹</span>
                    </div>
                    <div className="text-gray-900">{t.amount}</div>
                  </div>

                  {/* Treatment */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-[#EEF2FF] rounded-full">
                      <Briefcase className="h-5 w-5 text-[#4F46E5]" />
                    </div>
                    <div className="text-gray-900">{t.treatment}</div>
                  </div>

                  {/* Applied Date */}
                  <div className="text-sm text-gray-600 mb-3">Applied at {t.appliedAt}</div>

                  {/* UTR Number */}
                  {t.utr && (
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-[#EEF2FF] rounded-full">
                        <svg 
                          className="h-5 w-5 text-[#4F46E5]" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                          <path d="M6 7h12"/>
                          <path d="M6 11h8"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">UTR Number:</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-gray-900 text-sm font-medium">{t.utr}</div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await navigator.clipboard.writeText(t.utr || '');
                                console.log('UTR copied to clipboard');
                              } catch (error) {
                                console.error('Failed to copy UTR:', error);
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy UTR Number"
                          >
                            <Copy className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status:</div>
                    <div className="space-y-2">
                      <div className="bg-[#EFF6FF] text-[#2563EB] py-2 px-3 rounded-md inline-block text-sm">
                        {t.status}
                      </div>
                      {t.approved && (
                        <div className="w-full bg-[#16A34A] text-white py-2 px-3 rounded-md flex items-center justify-center space-x-2">
                          <Check className="h-4 w-4" />
                          <span>Approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Overlay */}
      {selectedTransaction && (
        <TransactionDetailsOverlay
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onBackToMenu={onBackToMenu ? () => {
            setSelectedTransaction(null);
            onBackToMenu();
          } : undefined}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        onClinicSelect={handleClinicSelect}
        initialFilters={filters}
        availableStatuses={availableStatuses}
        availableClinics={availableClinics}
        showClinicFilter={childClinics.length > 0}
        childClinics={childClinics}
      />
    </div>
  );
};

export default LoanTransactionsPage;