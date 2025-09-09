import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLoanCountAndAmountForDoctor, getDoctorDashboardData, getAllChildClinics, LoanCountAndAmountData, DoctorDashboardData, ChildClinic } from '../services/loanApi';
import { ArrowLeft, XCircle, SlidersHorizontal, Calendar } from 'lucide-react';

interface BusinessOverviewPageProps {
  onClose?: () => void;
}

const BusinessOverviewPage: React.FC<BusinessOverviewPageProps> = ({ onClose }) => {
  const { doctorId } = useAuth();
  const [loanData, setLoanData] = useState<LoanCountAndAmountData | null>(null);
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childClinics, setChildClinics] = useState<ChildClinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<{ name: string; doctorId: string } | null>(null);
  const [showClinicFilterModal, setShowClinicFilterModal] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ type: 'all' | 'last7days' | 'thismonth' | 'custom'; startDate?: string; endDate?: string }>({ type: 'thismonth' });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId) {
        setError('Doctor ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch child clinics first
        const clinics = await getAllChildClinics(doctorId).catch(() => []);
        setChildClinics(clinics);
        
        // Get date parameters from dateRange
        let startDate = '';
        let endDate = '';
        
        // Helper function to format date as DD-MM-YYYY
        const formatDateDDMMYYYY = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };
        
        if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
          // Convert YYYY-MM-DD to DD-MM-YYYY
          const startDateObj = new Date(dateRange.startDate);
          const endDateObj = new Date(dateRange.endDate);
          startDate = formatDateDDMMYYYY(startDateObj);
          endDate = formatDateDDMMYYYY(endDateObj);
        } else if (dateRange.type === 'last7days') {
          const today = new Date();
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          startDate = formatDateDDMMYYYY(sevenDaysAgo);
          endDate = formatDateDDMMYYYY(today);
        } else if (dateRange.type === 'thismonth') {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = formatDateDDMMYYYY(startOfMonth);
          endDate = formatDateDDMMYYYY(today);
        }
        
        // Use selected clinic doctorId or default doctorId
        const targetDoctorId = selectedClinic ? selectedClinic.doctorId : doctorId;
        
        // Fetch both loan data and dashboard data in parallel
        const [loanDataResult, dashboardDataResult] = await Promise.all([
          getLoanCountAndAmountForDoctor(targetDoctorId, selectedClinic?.name, startDate, endDate),
          getDoctorDashboardData(targetDoctorId, startDate, endDate)
        ]);
        
        setLoanData(loanDataResult);
        setDashboardData(dashboardDataResult);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch business overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId, selectedClinic, dateRange]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Helper function to get month name
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Helper function to get current month name
  const getCurrentMonthName = (): string => {
    return getMonthName(new Date());
  };

  // Helper function to format date range display
  const getDateRangeDisplay = (): string => {
    switch (dateRange.type) {
      case 'last7days':
        return 'Last 7 Days';
      case 'thismonth':
        return getCurrentMonthName();
      case 'custom':
        if (dateRange.startDate && dateRange.endDate) {
          const start = new Date(dateRange.startDate);
          const end = new Date(dateRange.endDate);
          return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        }
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  // Available clinics from child clinics
  const availableClinics = useMemo(() => {
    return childClinics.map(clinic => clinic.clinicName).sort();
  }, [childClinics]);

  const handleClinicSelect = (clinicName: string, doctorId: string) => {
    setSelectedClinic({ name: clinicName, doctorId });
  };

  const handleDateRangeChange = (type: 'all' | 'last7days' | 'thismonth' | 'custom', startDate?: string, endDate?: string) => {
    setDateRange({ type, startDate, endDate });
  };

  const clearFilters = () => {
    setSelectedClinic(null);
    setDateRange({ type: 'thismonth' });
    setShowCustomDatePicker(false);
    setShowCalendarPicker(null);
    setCustomStartDate('');
    setCustomEndDate('');
    setHoveredDate(null);
    setShowClinicFilterModal(false);
    setShowDateFilterModal(false);
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return formatDateForInput(new Date());
  };

  // Helper function to get first day of current month
  const getFirstDayOfMonth = (): string => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDateForInput(firstDay);
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForCalendar = (date: Date): string => {
    return formatDateForInput(date);
  };

  const isDateInRange = (date: string): boolean => {
    if (!customStartDate || !customEndDate) return false;
    return date >= customStartDate && date <= customEndDate;
  };

  const isStartDate = (date: string): boolean => {
    return date === customStartDate;
  };

  const isEndDate = (date: string): boolean => {
    return date === customEndDate;
  };

  const isDateSelectable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today;
  };

  const getCalendarDays = (): (Date | null)[] => {
    const days: (Date | null)[] = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayIndex = getFirstDayOfMonthIndex(currentMonth);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateString = formatDateForCalendar(date);
    
    if (!isDateSelectable(date)) return;

    if (showCalendarPicker === 'start') {
      setCustomStartDate(dateString);
      setShowCalendarPicker(null);
    } else if (showCalendarPicker === 'end') {
      if (dateString >= customStartDate) {
        setCustomEndDate(dateString);
        setShowCalendarPicker(null);
      }
    }
  };

  const handleDateHover = (date: Date) => {
    if (!customStartDate || customEndDate) return;
    const dateString = formatDateForCalendar(date);
    if (dateString >= customStartDate && isDateSelectable(date)) {
      setHoveredDate(dateString);
    }
  };

  const getDateClassName = (date: Date | null): string => {
    if (!date) return 'w-8 h-8';
    
    const dateString = formatDateForCalendar(date);
    const isSelectable = isDateSelectable(date);
    const inRange = isDateInRange(dateString);
    const isStart = isStartDate(dateString);
    const isEnd = isEndDate(dateString);
    const isHovered = hoveredDate === dateString;

    let className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer';

    if (!isSelectable) {
      className += ' text-gray-300 cursor-not-allowed';
    } else if (isStart || isEnd) {
      className += ' bg-green-600 text-white';
    } else if (inRange || isHovered) {
      className += ' bg-green-100 text-green-700';
    } else {
      className += ' text-gray-700 hover:bg-gray-100';
    }

    return className;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-3 flex items-center space-x-3">
        <button onClick={onClose} className="p-1 hover:bg-primary-700 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="ml-3 font-semibold text-lg">Business Overview</h3>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          {/* Clinic Filter Bar - Only show if child clinics exist */}
          {childClinics.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <button
                    onClick={() => setShowClinicFilterModal(true)}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 text-left text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-semibold">🏥</span>
                        </div>
                        <span className="text-sm font-medium">
                          {selectedClinic ? selectedClinic.name : 'All Clinics'}
                        </span>
                      </div>
                      <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date Filter Bar */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <button
                  onClick={() => setShowDateFilterModal(true)}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 text-left text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {getDateRangeDisplay()}
                      </span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {((childClinics.length > 0 && selectedClinic) || dateRange.type !== 'thismonth') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-blue-800 font-medium">Active filters:</span>
                  
                  {childClinics.length > 0 && selectedClinic && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Clinic: {selectedClinic.name}
                    </span>
                  )}
                  
                  {dateRange.type !== 'thismonth' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Date: {getDateRangeDisplay()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {loanData && dashboardData && (
            <>
              {/* Main Stats Card - Green */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {formatNumber(loanData.disbursed_count)}
                    </div>
                    <div className="text-green-100 text-sm">Loans Disbursed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {formatCurrency(loanData.disbursed_amount)}
                    </div>
                    <div className="text-green-100 text-sm">Earnings</div>
                  </div>
                </div>
              </div>

              

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Applied */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Applied</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatNumber(loanData.total_applied)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(loanData.total_loan_amount)}
                  </div>
                </div>

                {/* Incomplete */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Incomplete</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatNumber(loanData.pending_count)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(loanData.pending_amount)}
                  </div>
                </div>

                {/* Approved */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatNumber(loanData.approved_count)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(loanData.approved_amount)}
                  </div>
                </div>
              </div>

              {/* Rates and Leads Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Average Approval Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Average approval rate</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      {dashboardData.avgApprovalRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-white px-3 py-2" style={{ backgroundColor: '#514c9f' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CarePay average</span>
                      <span className="text-sm font-semibold">{dashboardData.avgApprovalRateCarePay.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Leads Per Clinic */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly leads per clinic</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      {dashboardData.leadsPerClinic.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-white px-3 py-2" style={{ backgroundColor: '#514c9f' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CarePay average</span>
                      <span className="text-sm font-semibold">{dashboardData.leadsPerClinicCarepay.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clinic Filter Modal */}
      {showClinicFilterModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Clinic</h3>
                <button
                  onClick={() => setShowClinicFilterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Clinic Filter - Only show if child clinics exist */}
              {childClinics.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <span className="text-blue-600 text-lg">🏥</span>
                    <span>Clinic</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedClinic(null);
                        setShowClinicFilterModal(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        !selectedClinic 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">All Clinics</div>
                          <div className="text-xs opacity-75">View all clinics</div>
                        </div>
                        {!selectedClinic && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </button>
                    {availableClinics.map((clinicName) => {
                      const clinic = childClinics.find(c => c.clinicName === clinicName);
                      return (
                        <button
                          key={clinicName}
                          onClick={() => {
                            if (clinic) {
                              handleClinicSelect(clinic.clinicName, clinic.doctorId);
                            }
                            setShowClinicFilterModal(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            selectedClinic?.name === clinicName 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{clinicName}</div>
                              <div className="text-xs opacity-75">Individual clinic</div>
                            </div>
                            {selectedClinic?.name === clinicName && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowClinicFilterModal(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Modal */}
      {showDateFilterModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
                <button
                  onClick={() => setShowDateFilterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Date Range Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>Date Range</span>
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleDateRangeChange('thismonth');
                      setShowDateFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      dateRange.type === 'thismonth' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getCurrentMonthName()}</div>
                        <div className="text-xs opacity-75">Current month</div>
                      </div>
                      {dateRange.type === 'thismonth' && (
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleDateRangeChange('last7days');
                      setShowDateFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      dateRange.type === 'last7days' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Last 7 Days</div>
                        <div className="text-xs opacity-75">Past week</div>
                      </div>
                      {dateRange.type === 'last7days' && (
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleDateRangeChange('all');
                      setShowDateFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      dateRange.type === 'all' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">All Time</div>
                        <div className="text-xs opacity-75">Complete history</div>
                      </div>
                      {dateRange.type === 'all' && (
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowCustomDatePicker(true);
                      // Initialize with current month if no custom dates are set
                      if (!customStartDate && !customEndDate) {
                        setCustomStartDate(getFirstDayOfMonth());
                        setCustomEndDate(getTodayDate());
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      dateRange.type === 'custom' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Custom Range</div>
                        <div className="text-xs opacity-75">Select specific dates</div>
                      </div>
                      {dateRange.type === 'custom' && (
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowDateFilterModal(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Picker Modal */}
      {showCustomDatePicker && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
                <button
                  onClick={() => setShowCustomDatePicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Date Range Input Fields */}
              <div className="mb-6">
                <div className="flex items-center space-x-3">
                  {/* Start Date Input */}
                  <div className="flex-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="startDate"
                        value={customStartDate ? new Date(customStartDate).toLocaleDateString('en-GB') : ''}
                        placeholder="dd/mm/yyyy"
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                      />
                      <button
                        onClick={() => setShowCalendarPicker('start')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="flex items-end pb-2">
                    <span className="text-gray-500 text-lg font-medium">:</span>
                  </div>

                  {/* End Date Input */}
                  <div className="flex-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="endDate"
                        value={customEndDate ? new Date(customEndDate).toLocaleDateString('en-GB') : ''}
                        placeholder="dd/mm/yyyy"
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                      />
                      <button
                        onClick={() => setShowCalendarPicker('end')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline Calendar Picker */}
              {showCalendarPicker && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Select {showCalendarPicker === 'start' ? 'Start' : 'End'} Date
                    </h4>
                    <button
                      onClick={() => setShowCalendarPicker(null)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <XCircle className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const prevMonth = new Date(currentMonth);
                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                        setCurrentMonth(prevMonth);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h5 className="text-sm font-semibold text-gray-900">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h5>
                    <button
                      onClick={() => {
                        const nextMonth = new Date(currentMonth);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        // Don't allow future months
                        const today = new Date();
                        if (nextMonth.getMonth() <= today.getMonth() && nextMonth.getFullYear() <= today.getFullYear()) {
                          setCurrentMonth(nextMonth);
                        }
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div>
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className="w-7 h-7 flex items-center justify-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays().map((date, index) => (
                        <div key={index} className="w-7 h-7 flex items-center justify-center">
                          {date ? (
                            <button
                              onClick={() => handleDateClick(date)}
                              onMouseEnter={() => handleDateHover(date)}
                              onMouseLeave={() => setHoveredDate(null)}
                              className={getDateClassName(date).replace('w-8 h-8', 'w-7 h-7')}
                            >
                              {date.getDate()}
                            </button>
                          ) : (
                            <div className="w-7 h-7" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Presets */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const sevenDaysAgo = new Date(today);
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      setCustomStartDate(formatDateForInput(sevenDaysAgo));
                      setCustomEndDate(formatDateForInput(today));
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      setCustomStartDate(getFirstDayOfMonth());
                      setCustomEndDate(getTodayDate());
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      setCustomStartDate(formatDateForInput(thirtyDaysAgo));
                      setCustomEndDate(formatDateForInput(today));
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const ninetyDaysAgo = new Date(today);
                      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                      setCustomStartDate(formatDateForInput(ninetyDaysAgo));
                      setCustomEndDate(formatDateForInput(today));
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCustomDatePicker(false);
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setHoveredDate(null);
                    setShowCalendarPicker(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (customStartDate && customEndDate) {
                      handleDateRangeChange('custom', customStartDate, customEndDate);
                      setShowCustomDatePicker(false);
                      setShowDateFilterModal(false);
                      setHoveredDate(null);
                      setShowCalendarPicker(null);
                    }
                  }}
                  disabled={!customStartDate || !customEndDate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOverviewPage;
