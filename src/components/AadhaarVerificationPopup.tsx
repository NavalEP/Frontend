import React, { useState, useEffect, useCallback } from 'react';
import { getUserDetailsByUserId, getUserBasicDetail, sendAadhaarOtp, submitAadhaarOtp, createDigiLockerUrl } from '../services/postApprovalApi';
import AnimatedPopup from './AnimatedPopup';

interface AadhaarVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  loanId?: string; // Loan ID for creating DigiLocker URL
  onSuccess?: () => void;
  fallbackUrl?: string; // DigiLocker or alternative verification URL from chat message
}

const AadhaarVerificationPopup: React.FC<AadhaarVerificationPopupProps> = ({
  isOpen,
  onClose,
  userId,
  loanId,
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
  const [dynamicFallbackUrl, setDynamicFallbackUrl] = useState<string>('');

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

  // Function to get or create fallback URL
  const getFallbackUrl = useCallback(async (): Promise<string> => {
    // First priority: Use fallback URL from chat message if available
    if (fallbackUrl) {
      console.log('Using fallback URL from chat message:', fallbackUrl);
      return fallbackUrl;
    }

    // Second priority: Use already created dynamic fallback URL
    if (dynamicFallbackUrl) {
      console.log('Using existing dynamic fallback URL:', dynamicFallbackUrl);
      return dynamicFallbackUrl;
    }

    // Third priority: Create new DigiLocker URL if loanId is available
    if (loanId) {
      try {
        console.log('Creating new DigiLocker URL for loanId:', loanId);
        const result = await createDigiLockerUrl(loanId);
        
        if (result.success && result.data) {
          console.log('Successfully created DigiLocker URL:', result.data);
          setDynamicFallbackUrl(result.data);
          return result.data;
        } else {
          console.error('Failed to create DigiLocker URL:', result.message);
        }
      } catch (error: any) {
        console.error('Error creating DigiLocker URL:', error.message);
      }
    }

    // Fallback: Return empty string if no URL can be obtained
    console.log('No fallback URL available - neither from chat message nor from API');
    return '';
  }, [fallbackUrl, dynamicFallbackUrl, loanId]);


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
        // Always show fallback method for any failure
        const fallbackUrlToUse = await getFallbackUrl();
        setDynamicFallbackUrl(fallbackUrlToUse);
        setShowFallback(true);
        setError(''); // Clear any existing error when showing fallback
        return;
      }

      // Send OTP
      const otpResult = await sendAadhaarOtp(userId);
      
      if (otpResult.success) {
        setStep('otp');
        setOtpTimer(50); // 50 seconds timer
        setError('');
      } else {
        // Always show fallback method for any failure
        setShowFallback(true);
        setError(''); // Clear any existing error when showing fallback
      }
    } catch (error: any) {
      // Always show fallback method for any failure
      setShowFallback(true);
      setError(''); // Clear any existing error when showing fallback
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
        // Always show fallback method for any failure
        const fallbackUrlToUse = await getFallbackUrl();
        setDynamicFallbackUrl(fallbackUrlToUse);
        setShowFallback(true);
        setError(''); // Clear any existing error when showing fallback
      }
    } catch (error: any) {
      // Always show fallback method for any failure
      const fallbackUrlToUse = await getFallbackUrl();
      setDynamicFallbackUrl(fallbackUrlToUse);
      setShowFallback(true);
      setError(''); // Clear any existing error when showing fallback
    } finally {
      setLoading(false);
      setIsAutoSubmitting(false);
    }
  }, [otp, userId, onSuccess, onClose, fallbackUrl, loanId, getFallbackUrl]);

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    console.log('OTP useEffect triggered:', { otpLength: otp.length, loading, isAutoSubmitting, step, error, showFallback });
    if (otp.length === 6 && !loading && !isAutoSubmitting && step === 'otp' && !error && !showFallback) {
      console.log('Auto-verifying OTP...');
      const timer = setTimeout(() => {
        handleOtpSubmit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otp, loading, isAutoSubmitting, step, error, showFallback, handleOtpSubmit]);

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
        // Always show fallback method for any failure
        setShowFallback(true);
        setError(''); // Clear any existing error when showing fallback
      }
    } catch (error: any) {
      // Always show fallback method for any failure
      setShowFallback(true);
      setError(''); // Clear any existing error when showing fallback
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

  const handleFallbackRedirect = async () => {
    const urlToUse = await getFallbackUrl();
    if (urlToUse) {
      window.open(urlToUse, '_blank');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatedPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Aadhaar Verification"
      contentClassName="p-6 max-h-[calc(100vh-120px)]"
    >
        
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
            
            {/* Fallback Option - New Digilocker Instructions */}
            {showFallback && (
              <div className="mt-4 space-y-6">
                {/* Instructions Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-4">
                    Follow these steps on the Digilocker website to verify your Aadhaar.
                  </p>
                  
                  {/* Step-by-step instructions */}
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Enter the <span className="font-semibold">number linked with your Aadhaar.</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Enter the OTP received.
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Then select <span className="font-semibold">Aadhaar</span> in the issued documents list 
                          <span className="inline-block mx-1">👆</span> and click on '<span className="font-semibold">Allow</span>'.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Consent Section - SVG Image */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <img 
                    src="https://carepay.money/static/media/Group%20113496.e6907ece85f45692f4c557da45def8ae.svg" 
                    alt="Consent and Document Selection Interface"
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  {(fallbackUrl || loanId) ? (
                    <button
                      onClick={handleFallbackRedirect}
                      className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2"
                      style={{
                        background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                        boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                      }}
                    >
                      <span>Continue to verify Aadhaar</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg text-center">
                      Please contact support for alternative verification
                    </div>
                  )}
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
        
            {/* Fallback Option for OTP step - New Digilocker Instructions */}
            {showFallback && (
              <div className="mt-4 space-y-6">
                {/* Instructions Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-4">
                    Follow these steps on the Digilocker website to verify your Aadhaar.
                  </p>
                  
                  {/* Step-by-step instructions */}
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Enter the <span className="font-semibold">number linked with your Aadhaar.</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Enter the OTP received.
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Then select <span className="font-semibold">Aadhaar</span> in the issued documents list 
                          <span className="inline-block mx-1">👆</span> and click on '<span className="font-semibold">Allow</span>'.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Consent Section - SVG Image */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <img 
                    src="https://carepay.money/static/media/Group%20113496.e6907ece85f45692f4c557da45def8ae.svg" 
                    alt="Consent and Document Selection Interface"
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  {(fallbackUrl || loanId) ? (
                    <button
                      onClick={handleFallbackRedirect}
                      className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2"
                      style={{
                        background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                        boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                      }}
                    >
                      <span>Continue to verify Aadhaar</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg text-center">
                      Please contact support for alternative verification
                    </div>
                  )}
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
    </AnimatedPopup>
  );
};

export default AadhaarVerificationPopup;
