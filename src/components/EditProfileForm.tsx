import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  // Calendar, 
  // Mail, 
  // GraduationCap, 
  // Heart,
  Save,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { 
  saveUserBasicDetails, 
  saveUserAddressDetails, 
  saveUserEmploymentDetails 
} from '../services/api';

interface UserDetails {
  user_details: {
    firstName: string;
    dateOfBirth: string;
    emailId: string;
    maritalStatus: string;
    panNo: string;
    educationLevel: string;
    gender: string;
    aadhaarNo: string;
    mobileNumber: string;
  };
  address_details: {
    address: string;
    state: string;
    city: string;
    pincode: number;
  };
  employment_details: {
    netTakeHomeSalary: number;
    employmentType: string;
    currentCompanyName: string;
    workplacePincode: string;
    nameOfBusiness: string;
  };
}

interface EditProfileFormProps {
  userDetails: UserDetails;
  sessionId: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  userDetails,
  sessionId,
  onClose,
  // onSaveSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'employment'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Form states
  const [basicDetails, setBasicDetails] = useState(userDetails.user_details);
  const [addressDetails, setAddressDetails] = useState({
    ...userDetails.address_details,
    pincode: userDetails.address_details.pincode.toString()
  });
  const [employmentDetails, setEmploymentDetails] = useState(userDetails.employment_details);

  const handleBasicDetailsChange = (field: string, value: string) => {
    setBasicDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressDetailsChange = (field: string, value: string) => {
    setAddressDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleEmploymentDetailsChange = (field: string, value: string | number) => {
    setEmploymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBasicDetails = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const response = await saveUserBasicDetails(sessionId, basicDetails);
      if (response.data.status === 'success') {
        setSaveStatus({ type: 'success', message: 'Basic details saved successfully!' });
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' });
        }, 3000);
      } else {
        setSaveStatus({ type: 'error', message: response.data.message || 'Failed to save basic details' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save basic details';
      setSaveStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddressDetails = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const response = await saveUserAddressDetails(sessionId, addressDetails);
      if (response.data.status === 'success') {
        setSaveStatus({ type: 'success', message: 'Address details saved successfully!' });
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' });
        }, 3000);
      } else {
        setSaveStatus({ type: 'error', message: response.data.message || 'Failed to save address details' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address details';
      setSaveStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmploymentDetails = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const response = await saveUserEmploymentDetails(sessionId, employmentDetails);
      if (response.data.status === 'success') {
        setSaveStatus({ type: 'success', message: 'Employment details saved successfully!' });
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' });
        }, 3000);
      } else {
        setSaveStatus({ type: 'error', message: response.data.message || 'Failed to save employment details' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save employment details';
      setSaveStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasicDetailsForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={basicDetails.firstName}
            onChange={(e) => handleBasicDetailsChange('firstName', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={basicDetails.dateOfBirth}
            onChange={(e) => handleBasicDetailsChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={basicDetails.gender}
            onChange={(e) => handleBasicDetailsChange('gender', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID *
          </label>
          <input
            type="email"
            value={basicDetails.emailId}
            onChange={(e) => handleBasicDetailsChange('emailId', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marital Status *
          </label>
          <select
            value={basicDetails.maritalStatus}
            onChange={(e) => handleBasicDetailsChange('maritalStatus', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select marital status</option>
            <option value="Yes">Married</option>
            <option value="No">Unmarried/Single</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Number *
          </label>
          <input
            type="text"
            value={basicDetails.panNo}
            onChange={(e) => handleBasicDetailsChange('panNo', e.target.value.toUpperCase())}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter PAN number"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhaar Number *
          </label>
          <input
            type="text"
            value={basicDetails.aadhaarNo || ''}
            onChange={(e) => handleBasicDetailsChange('aadhaarNo', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Aadhaar number"
            maxLength={12}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number
          </label>
          <input
            type="text"
            value={basicDetails.mobileNumber || ''}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            placeholder="Mobile number (read-only)"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Mobile number cannot be edited</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level *
          </label>
          <select
            value={basicDetails.educationLevel}
            onChange={(e) => handleBasicDetailsChange('educationLevel', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select education level</option>
            <option value="LESS THAN 10TH">LESS THAN 10TH</option>
            <option value="PASSED 10TH">PASSED 10TH</option>
            <option value="PASSED 12TH">PASSED 12TH</option>
            <option value="DIPLOMA">DIPLOMA</option>
            <option value="GRADUATION">GRADUATION</option>
            <option value="POST GRADUATION">POST GRADUATION</option>
            <option value="P.H.D.">P.H.D.</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveBasicDetails}
          disabled={isLoading}
          className="hover:opacity-90 text-white px-8 py-3 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
          style={{ backgroundColor: '#514c9f' }}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="font-medium">Save Basic Details</span>
        </button>
      </div>
    </div>
  );

  const renderAddressDetailsForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Address *
        </label>
        <textarea
          value={addressDetails.address}
          onChange={(e) => handleAddressDetailsChange('address', e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Enter complete address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={addressDetails.state}
            onChange={(e) => handleAddressDetailsChange('state', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={addressDetails.city}
            onChange={(e) => handleAddressDetailsChange('city', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            value={addressDetails.pincode}
            onChange={(e) => handleAddressDetailsChange('pincode', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter pincode"
            maxLength={6}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveAddressDetails}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="font-medium">Save Address Details</span>
        </button>
      </div>
    </div>
  );

  const renderEmploymentDetailsForm = () => (
    <div className="space-y-6">
      {/* Employment Type and Salary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Type *
          </label>
          <select
            value={employmentDetails.employmentType}
            onChange={(e) => {
              // Reset org/business fields when changing type
              const type = e.target.value;
              handleEmploymentDetailsChange('employmentType', type);
              if (type === 'SALARIED') {
                handleEmploymentDetailsChange('currentCompanyName', '');
                handleEmploymentDetailsChange('nameOfBusiness', '');
              } else if (type === 'SELF_EMPLOYED') {
                handleEmploymentDetailsChange('nameOfBusiness', '');
                handleEmploymentDetailsChange('currentCompanyName', '');
              }
            }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent bg-white profile-input"
          >
            <option value="">Select employment type</option>
            <option value="SALARIED">SALARIED</option>
            <option value="SELF_EMPLOYED">SELF_EMPLOYED</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Net Take Home Salary (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={employmentDetails.netTakeHomeSalary}
              onChange={(e) => handleEmploymentDetailsChange('netTakeHomeSalary', parseInt(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent profile-input"
              placeholder="Enter monthly salary"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Organization/Business Name Row */}
      {employmentDetails.employmentType === 'SALARIED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={employmentDetails.currentCompanyName}
            onChange={(e) => handleEmploymentDetailsChange('currentCompanyName', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent"
            placeholder="Enter organization name"
          />
        </div>
      )}
      {employmentDetails.employmentType === 'SELF_EMPLOYED' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={employmentDetails.nameOfBusiness || ''}
            onChange={(e) => handleEmploymentDetailsChange('nameOfBusiness', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent"
            placeholder="Enter business name"
          />
        </div>
      )}

      {/* Workplace Pincode Row */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workplace Pincode *
        </label>
        <input
          type="text"
          value={employmentDetails.workplacePincode}
          onChange={(e) => handleEmploymentDetailsChange('workplacePincode', e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent"
          placeholder="Enter workplace pincode"
          maxLength={6}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveEmploymentDetails}
          disabled={isLoading}
          className="hover:opacity-90 text-white px-8 py-3 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
          style={{ backgroundColor: '#514c9f' }}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="font-medium">Save Employment Details</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
          .profile-input:focus {
            --tw-ring-color: #514c9f;
            border-color: #514c9f;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Profile Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Save Status */}
        {saveStatus.type && (
          <div className={`px-6 py-3 ${
            saveStatus.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
          }`}>
            <div className="flex items-center space-x-2">
              {saveStatus.type === 'success' ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                saveStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Basic Details</span>
          </button>
          <button
            onClick={() => setActiveTab('address')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'address'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Address</span>
          </button>
          <button
            onClick={() => setActiveTab('employment')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'employment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Employment</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && renderBasicDetailsForm()}
          {activeTab === 'address' && renderAddressDetailsForm()}
          {activeTab === 'employment' && renderEmploymentDetailsForm()}
        </div>
      </div>
    </div>
    </>
  );
};

export default EditProfileForm; 