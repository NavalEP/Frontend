import React, { useState } from 'react';
import { X, Calendar, ChevronRight } from 'lucide-react';

export interface FilterOptions {
  status: string[];
  clinics: string[];
  dateRange: {
    type: 'all' | 'last7days' | 'thismonth' | 'custom';
    startDate?: string;
    endDate?: string;
  };
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  onClinicSelect?: (clinicName: string, doctorId: string) => void;
  initialFilters: FilterOptions;
  availableStatuses: string[];
  availableClinics: string[];
  showClinicFilter?: boolean;
  childClinics?: Array<{ clinicName: string; doctorId: string }>;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onClinicSelect,
  initialFilters,
  availableStatuses,
  availableClinics,
  showClinicFilter = true,
  childClinics = []
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [activeSection, setActiveSection] = useState<'main' | 'status' | 'clinics' | 'date'>('main');

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleStatusToggle = (status: string) => {
    // Single selection: if the status is already selected, deselect it; otherwise, select only this status
    const updatedStatuses = filters.status.includes(status)
      ? [] // Deselect if already selected
      : [status]; // Select only this status (single selection)
    
    setFilters(prev => ({ ...prev, status: updatedStatuses }));
  };

  const handleClinicSelect = (clinicName: string) => {
    // Find the doctorId for the selected clinic
    const selectedClinic = childClinics.find(clinic => clinic.clinicName === clinicName);
    
    if (selectedClinic && onClinicSelect) {
      onClinicSelect(clinicName, selectedClinic.doctorId);
      onClose(); // Close the modal after selection
    }
  };



  const handleDateRangeChange = (type: FilterOptions['dateRange']['type']) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, type, startDate: '', endDate: '' }
    }));
  };

  const renderMainFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <button
        onClick={() => setActiveSection('status')}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">Status</span>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Clinics Filter - Only show if there are child clinics */}
      {showClinicFilter && (
        <button
          onClick={() => setActiveSection('clinics')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-900">Clinics</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>
      )}

      {/* Date Range Filter */}
      <button
        onClick={() => setActiveSection('date')}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">Date range</span>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Apply Filters Button */}
      <button
        onClick={handleApplyFilters}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors"
      >
        Apply filters
      </button>
    </div>
  );

  const renderStatusFilter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {availableStatuses.map(status => (
          <button
            key={status}
            onClick={() => handleStatusToggle(status)}
            className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
              filters.status.includes(status)
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors mt-6"
      >
        Apply filters
      </button>
    </div>
  );

  const renderClinicsFilter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div></div>
      </div>



      <div className="space-y-2 max-h-64 overflow-y-auto">
        {availableClinics.map(clinic => (
          <button
            key={clinic}
            onClick={() => handleClinicSelect(clinic)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              filters.clinics.includes(clinic)
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-medium">{clinic}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors mt-6"
      >
        Apply filters
      </button>
    </div>
  );

  const renderDateFilter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div></div>
      </div>

      <div className="space-y-3">
        {/* All */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="dateRange"
            checked={filters.dateRange.type === 'all'}
            onChange={() => handleDateRangeChange('all')}
            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">All</span>
        </label>

        {/* Last 7 days */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="dateRange"
            checked={filters.dateRange.type === 'last7days'}
            onChange={() => handleDateRangeChange('last7days')}
            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Last 7 days</span>
        </label>

        {/* This month */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="dateRange"
            checked={filters.dateRange.type === 'thismonth'}
            onChange={() => handleDateRangeChange('thismonth')}
            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">This month</span>
        </label>

        {/* Date range */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="dateRange"
            checked={filters.dateRange.type === 'custom'}
            onChange={() => handleDateRangeChange('custom')}
            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Date range</span>
        </label>

        {/* Custom Date Inputs */}
        {filters.dateRange.type === 'custom' && (
          <div className="ml-7 space-y-3 mt-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={filters.dateRange.startDate || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))}
                  placeholder="Start date"
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-gray-500">:</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={filters.dateRange.endDate || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))}
                  placeholder="End date"
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors mt-6"
      >
        Apply filters
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'status':
        return renderStatusFilter();
      case 'clinics':
        return renderClinicsFilter();
      case 'date':
        return renderDateFilter();
      default:
        return renderMainFilters();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeSection === 'main' ? 'Filters' : 
             activeSection === 'status' ? 'Status' :
             activeSection === 'clinics' ? 'Clinics' : 'Date'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-50 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-primary-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
