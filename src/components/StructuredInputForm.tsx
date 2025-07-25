import React, { useState } from 'react';
import { User, Phone, Wallet, Send, IndianRupee } from 'lucide-react';

interface StructuredInputFormProps {
  onSubmit: (formattedMessage: string) => void;
  isLoading: boolean;
}

interface FormData {
  patientName: string;
  phoneNumber: string;
  treatmentCost: string;
  monthlyIncome: string;
}

const StructuredInputForm: React.FC<StructuredInputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    phoneNumber: '',
    treatmentCost: '',
    monthlyIncome: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const fields = [
    {
      key: 'patientName' as keyof FormData,
      label: "Patient's Full Name",
      placeholder: "Enter patient's full name",
      icon: User,
      type: 'text',
      validation: (value: string) => {
        if (!value.trim()) return "Patient's name is required";
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

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = field.validation(formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Format the message in the expected format
    const formattedMessage = `name: ${formData.patientName.trim()} phone number: ${formData.phoneNumber} treatment cost: ${formData.treatmentCost} monthly income: ${formData.monthlyIncome}`;
    onSubmit(formattedMessage);
    
    // Reset form
    setFormData({
      patientName: '',
      phoneNumber: '',
      treatmentCost: '',
      monthlyIncome: ''
    });
    setErrors({});
  };

  const isFormComplete = () => {
    return fields.every(field => formData[field.key].trim() !== '');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Patient Information</h3>
        <p className="text-xs text-gray-600">Please provide patient details for loan enquiry.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {fields.map((field) => {
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
                    className={`w-full px-2 py-1.5 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errors[field.key] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    disabled={isLoading}
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