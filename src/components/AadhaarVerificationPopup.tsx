import React, { useState, useEffect } from 'react';
import { getUserDetailsByUserId, getUserBasicDetail, sendAadhaarOtp, submitAadhaarOtp } from '../services/postApprovalApi';

interface AadhaarVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const AadhaarVerificationPopup: React.FC<AadhaarVerificationPopupProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess
}) => {
  const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [userMobileNumber, setUserMobileNumber] = useState<number | null>(null);

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Get user mobile number when component opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserMobileNumber();
    }
  }, [isOpen, userId]);

  const fetchUserMobileNumber = async () => {
    try {
      const result = await getUserDetailsByUserId(userId);
      if (result.success && result.data?.mobileNumber) {
        setUserMobileNumber(result.data.mobileNumber);
      }
    } catch (error) {
      console.error('Error fetching user mobile number:', error);
    }
  };

  const handleAadhaarSubmit = async () => {
    // Remove any non-digit characters for validation
    const cleanAadhaarNumber = aadhaarNumber.replace(/\D/g, '');
    
    if (!cleanAadhaarNumber || cleanAadhaarNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!userMobileNumber) {
      setError('Unable to get user mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save Aadhaar number using getUserBasicDetail
      const saveResult = await getUserBasicDetail({
        aadhaarNo: cleanAadhaarNumber,
        mobileNumber: userMobileNumber,
        userId: userId
      });

      if (!saveResult.success) {
        setError(saveResult.message || 'Failed to save Aadhaar number');
        return;
      }

      // Send OTP
      const otpResult = await sendAadhaarOtp(userId);
      
      if (otpResult.success) {
        setStep('otp');
        setOtpTimer(50); // 50 seconds timer
        setError('');
      } else {
        setError(otpResult.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while processing Aadhaar verification');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await submitAadhaarOtp(userId, otp);
      
      if (result.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setStep('aadhaar');
        setAadhaarNumber('');
        setOtp('');
        setError('');
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;

    setLoading(true);
    setError('');

    try {
      const result = await sendAadhaarOtp(userId);
      
      if (result.success) {
        setOtpTimer(50);
        setError('');
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while resending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const digits = e.target.value.replace(/\D/g, '');
    // Limit to 12 digits
    const limited = digits.slice(0, 12);
    setAadhaarNumber(limited);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Aadhaar Verification</h2>
        
        {step === 'aadhaar' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Aadhaar Number
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={handleAadhaarChange}
                placeholder="123456789012"
                className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                style={{
                  backgroundColor: 'rgba(81, 76, 159, 0.05)',
                  borderColor: 'rgb(81, 76, 159)'
                }}
                maxLength={12}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <button
              onClick={handleAadhaarSubmit}
              disabled={loading || aadhaarNumber.replace(/\D/g, '').length < 12}
              className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
              }}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                style={{
                  backgroundColor: 'rgba(81, 76, 159, 0.05)',
                  borderColor: 'rgb(81, 76, 159)'
                }}
                maxLength={6}
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Resend OTP in {Math.floor(otpTimer / 60)} : {String(otpTimer % 60).padStart(2, '0')}
              </span>
              <button
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || loading}
                className="text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Resend OTP
              </button>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <button
              onClick={handleOtpSubmit}
              disabled={loading || otp.length !== 6}
              className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AadhaarVerificationPopup;
