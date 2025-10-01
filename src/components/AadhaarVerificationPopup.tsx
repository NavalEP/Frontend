import React, { useState, useEffect, useCallback } from 'react';
import { getUserDetailsByUserId, getUserBasicDetail, sendAadhaarOtp, submitAadhaarOtp } from '../services/postApprovalApi';

interface AadhaarVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  fallbackUrl?: string; // DigiLocker or alternative verification URL
}

const AadhaarVerificationPopup: React.FC<AadhaarVerificationPopupProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess,
  fallbackUrl
}) => {
  const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [userMobileNumber, setUserMobileNumber] = useState<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

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

  // Helper function to check if error indicates system unavailability
  const isSystemUnavailableError = (result: any) => {
    const errorChecks = [
      result?.message === "failure",
      result?.message === "something went wrong",
      result?.status === 500,
      result?.data?.includes('verification_failed'),
      result?.data?.includes('Authorised source is temporarily unavailable'),
      result?.data?.includes('internal_error')
    ];
    
    // Special check for the specific error pattern from the API response
    if (result?.status === 500 && 
        result?.message === "something went wrong" && 
        result?.data && 
        typeof result.data === 'string') {
      return result.data.includes('verification_failed') && 
             result.data.includes('internal_error') &&
             result.data.includes('Authorised source is temporarily unavailable');
    }
    
    return errorChecks.some(check => check);
  };

  // Helper function to check if this is an invalid OTP error from submitAadhaarOtp
  const isInvalidOtpError = (result: any) => {
    if (result?.status === 500 && 
        result?.message === "something went wrong" && 
        result?.data && 
        typeof result.data === 'string') {
      
      // First check if this is a system unavailability error (should show fallback)
      if (result.data.includes('verification_failed') && 
          result.data.includes('internal_error') &&
          result.data.includes('Authorised source is temporarily unavailable')) {
        return false; // This is not an invalid OTP, it's a system issue
      }
      
      // Check for various patterns that indicate invalid OTP
      const dataString = result.data.toLowerCase();
      return dataString.includes('otp entered is invalid') ||
             dataString.includes('invalid otp') ||
             dataString.includes('otp is invalid') ||
             dataString.includes('wrong otp') ||
             dataString.includes('incorrect otp');
    }
    return false;
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
    setShowFallback(false); // Reset fallback state when trying again

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
        // Check if this is a system unavailability error
        if (isSystemUnavailableError(otpResult) && fallbackUrl) {
          setShowFallback(true);
        } else {
          setError(otpResult.message || 'Failed to send OTP');
        }
      }
    } catch (error: any) {
      // Check if this is a system unavailability error
      if (isSystemUnavailableError(error) && fallbackUrl) {
        setShowFallback(true);
      } else {
        setError(error.message || 'An error occurred while processing Aadhaar verification');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Prevent multiple submissions
    if (loading || isAutoSubmitting) {
      return;
    }

    setLoading(true);
    setIsAutoSubmitting(true);
    setError('');
    setShowFallback(false); // Reset fallback state when trying again

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
        setIsAutoSubmitting(false);
      } else {
        // Check if this is specifically an invalid OTP error
        if (isInvalidOtpError(result)) {
          setError('Invalid OTP. Please try again.');
          setOtp(''); // Clear OTP to allow user to enter new one
          // Also show fallback if available for invalid OTP
          if (fallbackUrl) {
            setShowFallback(true);
          }
        } else if (isSystemUnavailableError(result) && fallbackUrl) {
          setShowFallback(true);
        } else {
          // For other errors, show the actual API error message
          let errorMessage = result.message || 'An error occurred while verifying OTP';
          
          // Parse the error response for OTP validation errors
          if (result.data && typeof result.data === 'string') {
            try {
              // Check if this is a system unavailability error first
              if ((result.data as string).includes('verification_failed') && 
                  (result.data as string).includes('internal_error') &&
                  (result.data as string).includes('Authorised source is temporarily unavailable')) {
                // This is a system issue, not an invalid OTP
                if (fallbackUrl) {
                  setShowFallback(true);
                }
                return; // Exit early to show fallback
              }
              
              // Try to extract meaningful error from the response
              const dataString = (result.data as string).toLowerCase();
              if (dataString.includes('otp entered is invalid') ||
                  dataString.includes('invalid otp') ||
                  dataString.includes('otp is invalid') ||
                  dataString.includes('wrong otp') ||
                  dataString.includes('incorrect otp')) {
                errorMessage = 'Invalid OTP. Please try again.';
                setOtp(''); // Clear OTP to allow user to enter new one
                // Show fallback for invalid OTP errors
                if (fallbackUrl) {
                  setShowFallback(true);
                }
              }
            } catch (parseError) {
              // If parsing fails, use the original message
              console.error('Error parsing API response:', parseError);
            }
          }
          
          // If the message is "something went wrong" and we're in OTP verification context,
          // it's most likely an invalid OTP
          if (result.message === "something went wrong" && !errorMessage.includes('Invalid OTP')) {
            errorMessage = 'Invalid OTP. Please try again.';
            setOtp(''); // Clear OTP to allow user to enter new one
            // Show fallback for invalid OTP errors
            if (fallbackUrl) {
              setShowFallback(true);
            }
          }
          
          setError(errorMessage);
        }
      }
    } catch (error: any) {
      // Check if this is specifically an invalid OTP error
      if (isInvalidOtpError(error)) {
        setError('Invalid OTP. Please try again.');
        setOtp(''); // Clear OTP to allow user to enter new one
        // Also show fallback if available for invalid OTP
        if (fallbackUrl) {
          setShowFallback(true);
        }
      } else if (isSystemUnavailableError(error) && fallbackUrl) {
        setShowFallback(true);
      } else {
        // Handle network or other errors - show the actual error message
        let errorMessage = 'An error occurred while verifying OTP';
        
        // Check if the error contains OTP validation failure information
        if (error.message) {
          const errorMsgLower = error.message.toLowerCase();
          
          // Check if this is a system unavailability error first
          if (error.message.includes('verification_failed') && 
              error.message.includes('internal_error') &&
              error.message.includes('Authorised source is temporarily unavailable')) {
            // This is a system issue, not an invalid OTP
            if (fallbackUrl) {
              setShowFallback(true);
            }
            return; // Exit early to show fallback
          }
          
          if (errorMsgLower.includes('otp entered is invalid') ||
              errorMsgLower.includes('invalid otp') ||
              errorMsgLower.includes('otp is invalid') ||
              errorMsgLower.includes('wrong otp') ||
              errorMsgLower.includes('incorrect otp')) {
            errorMessage = 'Invalid OTP. Please try again.';
            setOtp(''); // Clear OTP to allow user to enter new one
            // Show fallback for invalid OTP errors
            if (fallbackUrl) {
              setShowFallback(true);
            }
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setIsAutoSubmitting(false);
    }
  }, [otp, userId, onSuccess, onClose, fallbackUrl, isInvalidOtpError, isSystemUnavailableError]);

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    console.log('OTP useEffect triggered:', { otpLength: otp.length, loading, isAutoSubmitting, step, error });
    if (otp.length === 6 && !loading && !isAutoSubmitting && step === 'otp' && !error) {
      console.log('Auto-verifying OTP...');
      const timer = setTimeout(() => {
        handleOtpSubmit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otp, loading, isAutoSubmitting, step, error, handleOtpSubmit]);

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
        // Check if this is a system unavailability error
        if (isSystemUnavailableError(result) && fallbackUrl) {
          setShowFallback(true);
        } else {
          setError(result.message || 'Failed to resend OTP');
        }
      }
    } catch (error: any) {
      // Check if this is a system unavailability error
      if (isSystemUnavailableError(error) && fallbackUrl) {
        setShowFallback(true);
      } else {
        setError(error.message || 'An error occurred while resending OTP');
      }
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

  const handleFallbackRedirect = () => {
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank');
      onClose();
    }
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
                value={aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                onChange={handleAadhaarChange}
                placeholder="1234 5678 9012"
                className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 text-center tracking-widest font-mono"
                style={{
                  backgroundColor: 'rgba(81, 76, 159, 0.05)',
                  borderColor: 'rgb(81, 76, 159)',
                  letterSpacing: '0.2em'
                }}
                maxLength={14}
                disabled={loading}
              />
            </div>
            
            {error && !showFallback && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            {/* Fallback Option */}
            {showFallback && fallbackUrl && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      System Temporarily Unavailable
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  The verification system is temporarily unavailable. Please use the alternative method below to complete your Aadhaar verification.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleFallbackRedirect}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Complete Verification via Alternative Method
                  </button>
                  <button
                    onClick={() => {
                      setShowFallback(false);
                      setError('');
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {!showFallback && (
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
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="flex space-x-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    value={otp[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 1) {
                        const newOtp = otp.split('');
                        newOtp[index] = value;
                        const updatedOtp = newOtp.join('');
                        setOtp(updatedOtp);
                        
                        // Clear error when user starts typing new OTP
                        if (error) {
                          setError('');
                        }
                        
                        // Auto-focus next input
                        if (value && index < 5) {
                          const nextInput = (e.target as HTMLInputElement).parentElement?.children[index + 1] as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to focus previous input
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        const prevInput = (e.target as HTMLInputElement).parentElement?.children[index - 1] as HTMLInputElement;
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: 'rgba(81, 76, 159, 0.05)',
                      borderColor: 'rgb(81, 76, 159)'
                    }}
                    maxLength={1}
                    disabled={loading || isAutoSubmitting}
                  />
                ))}
              </div>
            </div>
            
            {/* Auto-verification indicator */}
            {isAutoSubmitting && (
              <div className="text-center">
                <div className="text-sm text-blue-600 font-medium">
                  Auto-verifying OTP...
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Resend OTP in {Math.floor(otpTimer / 60)} : {String(otpTimer % 60).padStart(2, '0')}
              </span>
              <button
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || loading || isAutoSubmitting}
                className="text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Resend OTP
              </button>
            </div>
            
            {/* Error message display for OTP step */}
            {error && !showFallback && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
        
            {/* Fallback Option for OTP step */}
            {showFallback && fallbackUrl && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Alternative Verification Method
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  You can complete your Aadhaar verification using the alternative method below.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleFallbackRedirect}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Complete Verification via Alternative Method
                  </button>
                  <button
                    onClick={() => {
                      setShowFallback(false);
                      setError('');
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {!showFallback && (
              <button
                onClick={handleOtpSubmit}
                disabled={loading || otp.length !== 6 || isAutoSubmitting}
                className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                  boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                }}
              >
                {loading || isAutoSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            )}
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
