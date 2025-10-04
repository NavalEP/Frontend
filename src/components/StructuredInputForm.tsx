import React, { useState, useEffect } from 'react';
import { User, Phone, Wallet, Send, IndianRupee, Check, Edit3 } from 'lucide-react';

interface StructuredInputFormProps {
  onSubmit: (formattedMessage: string) => void;
  isLoading: boolean;
  loginRoute?: string | null;
}

interface FormData {
  patientName: string;
  phoneNumber: string;
  treatmentCost: string;
  monthlyIncome: string;
}

interface AadhaarVerification {
  isVerified: boolean;
  showVerification: boolean;
  isSingleWord: boolean;
}

const StructuredInputForm: React.FC<StructuredInputFormProps> = ({ onSubmit, isLoading, loginRoute }) => {
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    phoneNumber: loginRoute !== '/doctor-login' ? localStorage.getItem('phoneNumber') || '' : '',
    treatmentCost: '',
    monthlyIncome: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [aadhaarVerification, setAadhaarVerification] = useState<AadhaarVerification>({
    isVerified: false,
    showVerification: false,
    isSingleWord: false
  });

  // Auto-fill phone number for patient logins
  useEffect(() => {
    if (loginRoute !== '/doctor-login') {
      // This is a patient login, auto-fill phone number from localStorage
      const verifiedPhoneNumber = localStorage.getItem('phoneNumber');
      if (verifiedPhoneNumber) {
        setFormData(prev => ({
          ...prev,
          phoneNumber: verifiedPhoneNumber
        }));
      }
    } else {
      // This is a doctor login, clear phone number to allow manual entry
      setFormData(prev => ({
        ...prev,
        phoneNumber: ''
      }));
    }
  }, [loginRoute]);

  const fields = [
    {
      key: 'patientName' as keyof FormData,
      label: "Patient's Full Name (As on Aadhaar Card)",
      placeholder: "Enter first name and last name",
      icon: User,
      type: 'text',
      validation: (value: string) => {
        if (!value.trim()) return "Patient's name is required";
        const nameParts = value.trim().split(/\s+/);
        if (nameParts.length < 1) return "Please enter both first name and last name";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Name should only contain letters and spaces";
        return null;
      }
    },
    {
      key: 'phoneNumber' as keyof FormData,
      label: "Patient's Phone Number (linked to PAN)",
      placeholder: "Enter 10-digit phone number",
      icon: Phone,
      type: 'tel',
      validation: (value: string) => {
        const cleanNumber = value.replace(/\D/g, '');
        if (!cleanNumber) return "Phone number is required";
        if (cleanNumber.length !== 10) return "Phone number must be 10 digits";
        if (!/^[6-9]\d{9}$/.test(cleanNumber)) return "Please enter a valid Indian phone number";
        return null;
      }
    },
    {
      key: 'treatmentCost' as keyof FormData,
      label: "Cost of Treatment",
      placeholder: "Enter treatment cost in ₹",
      icon: IndianRupee,
      type: 'number',
      validation: (value: string) => {
        const numValue = parseFloat(value);
        if (!value) return "Treatment cost is required";
        if (isNaN(numValue) || numValue <= 0) return "Please enter a valid amount";
        if (numValue < 1000) return "Treatment cost should be at least ₹1,000";
        return null;
      }
    },
    {
      key: 'monthlyIncome' as keyof FormData,
      label: "Patient's Monthly Income",
      placeholder: "Enter monthly income in ₹",
      icon: Wallet,
      type: 'number',
      validation: (value: string) => {
        const numValue = parseFloat(value);
        if (!value) return "Monthly income is required";
        if (isNaN(numValue) || numValue <= 0) return "Please enter a valid income amount";
        if (numValue < 5000) return "Monthly income should be at least ₹5,000";
        return null;
      }
    }
  ];

  const handleInputChange = (key: keyof FormData, value: string) => {
    // Format phone number input
    if (key === 'phoneNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    
    // Format currency inputs
    if (key === 'treatmentCost' || key === 'monthlyIncome') {
      value = value.replace(/[^\d.]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [key]: value
    }));

    // Reset Aadhaar verification when patient name changes
    if (key === 'patientName') {
      setAadhaarVerification(prev => ({
        ...prev,
        showVerification: false,
        isVerified: false,
        isSingleWord: false
      }));
    }

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: undefined
      }));
    }
  };

  const handleAadhaarVerification = (verified: boolean) => {
    setAadhaarVerification(prev => ({
      ...prev,
      isVerified: verified
    }));
    
    // If user confirms with "Yes", clear errors and submit the form
    if (verified) {
      // Clear the error to make border normal
      setErrors(prev => ({
        ...prev,
        patientName: undefined
      }));
      
      // Validate other fields and submit
      if (validateForm()) {
        // Format the message in the expected format
        const formattedMessage = `Name: ${formData.patientName.trim()}\n\n Phone Number: ${formData.phoneNumber}\n\n Treatment Cost: ${formData.treatmentCost}\n\n Monthly Income: ${formData.monthlyIncome}`;
        onSubmit(formattedMessage);
        
        // Reset form - preserve phone number for patient logins
        const verifiedPhoneNumber = loginRoute !== '/doctor-login' ? localStorage.getItem('phoneNumber') || '' : '';
        setFormData({
          patientName: '',
          phoneNumber: verifiedPhoneNumber,
          treatmentCost: '',
          monthlyIncome: ''
        });
        setErrors({});
        setAadhaarVerification({
          isVerified: false,
          showVerification: false,
          isSingleWord: false
        });
      }
    }
  };

  const handleEditName = () => {
    setAadhaarVerification(prev => ({
      ...prev,
      showVerification: false,
      isVerified: false,
      isSingleWord: false
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    // Check for single word name first
    const nameParts = formData.patientName.trim().split(/\s+/);
    const isSingleWord = nameParts.length === 1 && formData.patientName.trim().length > 0;

    fields.forEach(field => {
      if (field.key === 'patientName') {
        if (isSingleWord && !aadhaarVerification.isVerified) {
          // For single word names that are not verified, skip validation
          // The verification will be handled in handleSubmit
          return;
        } else {
          // For multi-word names or verified single word names, use normal validation
          const error = field.validation(formData[field.key]);
          if (error) {
            newErrors[field.key] = error;
            isValid = false;
          }
        }
      } else {
        const error = field.validation(formData[field.key]);
        if (error) {
          newErrors[field.key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for single word name first
    const nameParts = formData.patientName.trim().split(/\s+/);
    const isSingleWord = nameParts.length === 1 && formData.patientName.trim().length > 0;
    
    // If single word and not verified, show verification UI instead of submitting
    if (isSingleWord && !aadhaarVerification.isVerified) {
      setAadhaarVerification(prev => ({
        ...prev,
        showVerification: true,
        isSingleWord: true
      }));
      return;
    }
    
    // Validate other fields
    if (!validateForm()) return;

    // Format the message in the expected format
    const formattedMessage = `Name: ${formData.patientName.trim()}\n\n Phone Number: ${formData.phoneNumber}\n\n Treatment Cost: ${formData.treatmentCost}\n\n Monthly Income: ${formData.monthlyIncome}`;
    onSubmit(formattedMessage);
    
    // Reset form - preserve phone number for patient logins
    const verifiedPhoneNumber = loginRoute !== '/doctor-login' ? localStorage.getItem('phoneNumber') || '' : '';
    setFormData({
      patientName: '',
      phoneNumber: verifiedPhoneNumber,
      treatmentCost: '',
      monthlyIncome: ''
    });
    setErrors({});
    setAadhaarVerification({
      isVerified: false,
      showVerification: false,
      isSingleWord: false
    });
  };

  const isFormComplete = () => {
    const allFieldsFilled = fields.every(field => formData[field.key].trim() !== '');
    
    // Always enable submit button when all fields are filled
    // Aadhaar verification will be handled during form submission
    return allFieldsFilled;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Patient Information</h3>
        <p className="text-xs text-gray-600">Please provide patient details for loan enquiry.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {/* Custom Patient Name Field with Aadhaar Verification */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              {fields[0].label}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={fields[0].placeholder}
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className={`w-full px-2 py-1.5 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors.patientName || (aadhaarVerification.showVerification && aadhaarVerification.isSingleWord && !aadhaarVerification.isVerified) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            
            {/* Aadhaar Verification UI */}
            {aadhaarVerification.showVerification && (
              <div className={`mt-2 p-2 border rounded-md transition-all duration-200 ${
                errors.patientName && errors.patientName.includes('verify')
                  ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
                  : aadhaarVerification.isVerified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${
                    errors.patientName && errors.patientName.includes('verify')
                      ? 'text-red-800'
                      : aadhaarVerification.isVerified
                        ? 'text-green-800'
                        : 'text-blue-800'
                  }`}>
                    Is this name, as on your Aadhaar card?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAadhaarVerification(true)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md border transition-colors ${
                        aadhaarVerification.isVerified
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : errors.patientName && errors.patientName.includes('verify')
                            ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-bold">Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEditName}
                      className={`flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-md border transition-colors ${
                        errors.patientName && errors.patientName.includes('verify')
                          ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {errors.patientName && (
              <p className="text-xs text-red-600">{errors.patientName}</p>
            )}
          </div>

          {/* Other Fields */}
          {fields.slice(1).map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className={`w-full px-2 py-1.5 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors[field.key] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${field.key === 'phoneNumber' && loginRoute !== '/doctor-login' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={isLoading || (field.key === 'phoneNumber' && loginRoute !== '/doctor-login')}
                  />
                </div>
                {errors[field.key] && (
                  <p className="text-xs text-red-600">{errors[field.key]}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading || !isFormComplete()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md font-medium text-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-2" />
                Submit Information
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>All fields required for loan processing.</p>
        </div>
      </form>
    </div>
  );
};

export default StructuredInputForm; 