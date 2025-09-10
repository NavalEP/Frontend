import React, { useState, useEffect } from 'react';
import { X, MapPin, Home, Loader2, Search } from 'lucide-react';
import { getUserAddress, UserAddress, getAllFinDocDistricts, saveAddressDetails, SaveAddressDetailsRequest } from '../services/loanApi';

interface AddressDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  kycUrl: string;
  userId: string; // Add userId prop
  onMessageSend?: (message: string) => void; // Add callback for sending messages
  onSessionRefresh?: () => void; // Add callback for session refresh
}

interface AddressForm {
  permanentAddress: string;
  permanentPincode: string;
  permanentCity: string;
  permanentState: string;
  currentAddress: string;
  currentPincode: string;
  currentCity: string;
  currentState: string;
  sameAsPermanent: boolean;
}

const AddressDetailsPopup: React.FC<AddressDetailsPopupProps> = ({ 
  isOpen, 
  onClose, 
  kycUrl,
  userId,
  onMessageSend,
  onSessionRefresh
}) => {
  const [addressForm, setAddressForm] = useState<AddressForm>({
    permanentAddress: '',
    permanentPincode: '',
    permanentCity: '',
    permanentState: '',
    currentAddress: '',
    currentPincode: '',
    currentCity: '',
    currentState: '',
    sameAsPermanent: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [permanentAddress, setPermanentAddress] = useState<UserAddress | null>(null);
  const [currentAddress, setCurrentAddress] = useState<UserAddress | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showPermanentCitySearch, setShowPermanentCitySearch] = useState(false);
  const [showCurrentCitySearch, setShowCurrentCitySearch] = useState(false);

  const states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttarakhand',
    'Uttar Pradesh',
    'West Bengal'
  ];

  // Fetch addresses and cities when component mounts or userId changes
  useEffect(() => {
    if (isOpen && userId) {
      fetchAddresses();
      fetchCities();
    }
  }, [isOpen, userId]);

  // Handle clicking outside city search dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.city-search-container')) {
        setShowPermanentCitySearch(false);
        setShowCurrentCitySearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      // Fetch both permanent and current addresses
      const [permanent, current] = await Promise.all([
        getUserAddress(userId, 'permanent'),
        getUserAddress(userId, 'current')
      ]);

      setPermanentAddress(permanent);
      setCurrentAddress(current);

      // Populate form with fetched data
      if (permanent) {
        setAddressForm(prev => ({
          ...prev,
          permanentAddress: permanent.address || '',
          permanentPincode: permanent.pincode?.toString() || '',
          permanentCity: permanent.city || '',
          permanentState: permanent.state || ''
        }));
      }

      if (current) {
        setAddressForm(prev => ({
          ...prev,
          currentAddress: current.address || '',
          currentPincode: current.pincode?.toString() || '',
          currentCity: current.city || '',
          currentState: current.state || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const citiesData = await getAllFinDocDistricts();
      setCities(citiesData);
      setFilteredCities(citiesData);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const filterCities = (query: string, selectedState?: string) => {
    if (!query.trim() && !selectedState) {
      setFilteredCities(cities);
      return;
    }

    let filtered = cities;
    
    // Filter by state if provided
    if (selectedState) {
      // For now, we'll show all cities since the API doesn't provide state mapping
      // In the future, if you have city-state mapping, you can filter here
      filtered = cities;
    }
    
    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    setFilteredCities(filtered);
  };

  const selectCity = (city: string, type: 'permanent' | 'current') => {
    if (type === 'permanent') {
      setAddressForm(prev => ({
        ...prev,
        permanentCity: city
      }));
      setShowPermanentCitySearch(false);
    } else {
      setAddressForm(prev => ({
        ...prev,
        currentCity: city
      }));
      setShowCurrentCitySearch(false);
    }
  };

  const handleAddressChange = (field: keyof AddressForm, value: string | boolean) => {
    setAddressForm(prev => ({
      ...prev,
      [field]: value
    }));

    // If same as permanent is checked, copy permanent address to current
    if (field === 'sameAsPermanent' && value === true) {
      setAddressForm(prev => ({
        ...prev,
        currentAddress: prev.permanentAddress,
        currentPincode: prev.permanentPincode,
        currentCity: prev.permanentCity,
        currentState: prev.permanentState,
        sameAsPermanent: true
      }));
    }

    // If state is changed, refresh city search for that address type
    if (field === 'permanentState') {
      filterCities(addressForm.permanentCity, value as string);
    } else if (field === 'currentState') {
      filterCities(addressForm.currentCity, value as string);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Validate permanent address
    if (!addressForm.permanentAddress.trim()) {
      errors.push('Permanent address is required');
    }
    if (!addressForm.permanentCity.trim()) {
      errors.push('Permanent city is required');
    }
    if (!addressForm.permanentPincode.trim()) {
      errors.push('Permanent pincode is required');
    }
    if (!addressForm.permanentState.trim()) {
      errors.push('Permanent state is required');
    }
    
    // Validate current address
    if (!addressForm.currentAddress.trim()) {
      errors.push('Current address is required');
    }
    if (!addressForm.currentCity.trim()) {
      errors.push('Current city is required');
    }
    if (!addressForm.currentPincode.trim()) {
      errors.push('Current pincode is required');
    }
    if (!addressForm.currentState.trim()) {
      errors.push('Current state is required');
    }
    
    return errors;
  };

  const handleAddressSubmit = async () => {
    try {
      // Validate form before submission
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        alert(`Please fill in all required fields:\n${validationErrors.join('\n')}`);
        return;
      }

      setIsLoading(true);
      
      // Prepare address data for both permanent and current addresses
      const permanentAddressData: SaveAddressDetailsRequest = {
        userId: userId,
        address: addressForm.permanentAddress,
        addressType: 'permanent',
        city: addressForm.permanentCity,
        pincode: addressForm.permanentPincode,
        state: addressForm.permanentState
      };

      const currentAddressData: SaveAddressDetailsRequest = {
        userId: userId,
        address: addressForm.currentAddress,
        addressType: 'current',
        city: addressForm.currentCity,
        pincode: addressForm.currentPincode,
        state: addressForm.currentState
      };

      // Save both addresses
      const [permanentResult, currentResult] = await Promise.all([
        saveAddressDetails(permanentAddressData),
        saveAddressDetails(currentAddressData)
      ]);

      // Check if both saves were successful
      if (permanentResult.success && currentResult.success) {
        console.log('Address details saved successfully');
        
        // Send "address details complete" message to agent
        if (onMessageSend) {
          onMessageSend('address details complete');
        }
        
        // Refresh session details
        if (onSessionRefresh) {
          onSessionRefresh();
        }
        
        // Close the popup
        onClose();
      } else {
        // Handle partial failures
        const errors = [];
        if (!permanentResult.success) {
          errors.push(`Permanent address: ${permanentResult.message}`);
        }
        if (!currentResult.success) {
          errors.push(`Current address: ${currentResult.message}`);
        }
        throw new Error(errors.join('; '));
      }
    } catch (error: any) {
      console.error('Error saving address details:', error);
      // You can add an error toast notification here
      alert(`Failed to save address details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .address-input:focus {
            --tw-ring-color: #514c9f;
            border-color: #514c9f;
          }
        `}
      </style>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-out">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="text-white px-6 py-4 rounded-t-3xl" style={{ background: 'linear-gradient(to right, #514c9f, #514c9f)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Address Details</h2>
              <button
                onClick={onClose}
                className="text-white hover:opacity-70 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#514c9f' }} />
                <span className="ml-3 text-gray-600">Loading address details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
                </div>

                {/* Permanent Address Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Home className="h-5 w-5" style={{ color: '#514c9f' }} />
                    <span>Permanent Address</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                      <input
                        type="text"
                        value={addressForm.permanentAddress}
                        onChange={(e) => handleAddressChange('permanentAddress', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                        placeholder="Enter permanent address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={addressForm.permanentPincode}
                        onChange={(e) => handleAddressChange('permanentPincode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                        placeholder="Enter pincode"
                      />
                    </div>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={addressForm.permanentCity}
                          onChange={(e) => {
                            handleAddressChange('permanentCity', e.target.value);
                            filterCities(e.target.value, addressForm.permanentState);
                          }}
                          onFocus={() => setShowPermanentCitySearch(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                          placeholder="Search city..."
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* City Search Dropdown */}
                      {showPermanentCitySearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city, index) => (
                              <button
                                key={index}
                                onClick={() => selectCity(city, 'permanent')}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100"
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        value={addressForm.permanentState}
                        onChange={(e) => handleAddressChange('permanentState', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Same Address Checkbox */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={addressForm.sameAsPermanent}
                    onChange={(e) => handleAddressChange('sameAsPermanent', e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded" style={{ color: '#514c9f' }}
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700">
                    My current address is the same as my permanent address.
                  </label>
                </div>

                {/* Current Address Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <MapPin className="h-5 w-5" style={{ color: '#514c9f' }} />
                    <span>Current Address</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                      <input
                        type="text"
                        value={addressForm.currentAddress}
                        onChange={(e) => handleAddressChange('currentAddress', e.target.value)}
                        placeholder="Enter address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={addressForm.currentPincode}
                        onChange={(e) => handleAddressChange('currentPincode', e.target.value)}
                        placeholder="Enter pincode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                      />
                    </div>
                    
                    <div className="relative city-search-container">
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={addressForm.currentCity}
                          onChange={(e) => {
                            handleAddressChange('currentCity', e.target.value);
                            filterCities(e.target.value, addressForm.currentState);
                          }}
                          onFocus={() => setShowCurrentCitySearch(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                          placeholder="Search city..."
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* City Search Dropdown */}
                      {showCurrentCitySearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city, index) => (
                              <button
                                key={index}
                                onClick={() => selectCity(city, 'current')}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100"
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        value={addressForm.currentState}
                        onChange={(e) => handleAddressChange('currentState', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 address-input"
                      >
                        <option value="">Select state</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="pt-4">
                  <button
                    onClick={handleAddressSubmit}
                    disabled={isLoading}
                    className="w-full px-6 py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2"
                    style={{ 
                      backgroundColor: '#514c9f'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Confirm</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressDetailsPopup;
