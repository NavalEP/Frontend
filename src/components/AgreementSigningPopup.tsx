import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { 
  initiateAgreement, 
  getAgreementUrl, 
  recordConsent, 
  sendAgreementOtp, 
  verifyAgreementOtp,
  getUserDetailsByUserId,
  InitiateAgreementResult,
  GetAgreementUrlResult,
  ConsentResult,
  SendOtpResult,
  VerifyOtpResult,
  UserDetailsByUserIdResult
} from '../services/postApprovalApi';

interface AgreementSigningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  onSuccess?: () => void;
}

interface LocationData {
  latitude: string;
  longitude: string;
}

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'Hindi' },
  { code: 'Gujarati', name: 'Gujarati' },
  { code: 'Kannada', name: 'Kannada' },
  { code: 'Malayalam', name: 'Malayalam' },
  { code: 'Marathi', name: 'Marathi' },
  { code: 'Punjabi', name: 'Punjabi' },
  { code: 'Tamil', name: 'Tamil' },
  { code: 'Telugu', name: 'Telugu' }
];

const AgreementSigningPopup: React.FC<AgreementSigningPopupProps> = ({
  isOpen,
  onClose,
  loanId,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'language' | 'documents' | 'consent' | 'otp' | 'success'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreementUrls, setAgreementUrls] = useState<{ agreementUrl: string; kfsUrl: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'kfs' | 'agreement'>('kfs');
  const [consentChecked, setConsentChecked] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [userPhone, setUserPhone] = useState<string>('');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('language');
      setSelectedLanguage('English');
      setShowLanguageDropdown(false);
      setIsLoading(false);
      setError(null);
      setAgreementUrls(null);
      setActiveTab('kfs');
      setConsentChecked(false);
      setLocation(null);
      setOtp('');
      setOtpSent(false);
      setOtpTimer(0);
      setUserPhone('');
      setIsRequestingLocation(false);
    }
  }, [isOpen]);

  // Request location permission when entering documents screen
  useEffect(() => {
    if (currentStep === 'documents' && !location && !isRequestingLocation) {
      requestLocationPermission();
    }
  }, [currentStep, location, isRequestingLocation]);


  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Request location permission
  const requestLocationPermission = async () => {
    setIsRequestingLocation(true);
    setError(null);
    
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
    } catch (error: any) {
      console.error('Location permission error:', error);
      setError(error.message || 'Unable to retrieve your location. Please enable location services.');
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // Get user location
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          reject(new Error('Unable to retrieve your location. Please enable location services.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Get user phone number
  const getUserPhoneNumber = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const result: UserDetailsByUserIdResult = await getUserDetailsByUserId(userId);
      if (result.success && result.data) {
        setUserPhone(result.data.mobileNumber.toString());
        return result.data.mobileNumber.toString();
      } else {
        throw new Error('Failed to get user details');
      }
    } catch (error) {
      console.error('Error getting user phone:', error);
      throw error;
    }
  };

  // Handle Generate Agreement
  const handleGenerateAgreement = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Initiate Agreement
      const initiateResult: InitiateAgreementResult = await initiateAgreement(loanId, selectedLanguage);
      if (!initiateResult.success) {
        throw new Error(initiateResult.message || 'Failed to initiate agreement');
      }

      // Step 2: Get Agreement URLs
      const urlResult: GetAgreementUrlResult = await getAgreementUrl(loanId);
      if (!urlResult.success || !urlResult.data) {
        throw new Error(urlResult.message || 'Failed to get agreement URLs');
      }

      setAgreementUrls(urlResult.data);
      setCurrentStep('documents');
    } catch (error: any) {
      setError(error.message || 'Failed to generate agreement');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle consent checkbox change
  const handleConsentChange = async (checked: boolean) => {
    setConsentChecked(checked);
    
    if (checked && location) {
      try {
        // Record consent using the already obtained location
        const consentResult: ConsentResult = await recordConsent({
          loanId,
          latitude: location.latitude,
          longitude: location.longitude
        });

        if (!consentResult.success) {
          setError(consentResult.message || 'Failed to record consent');
          setConsentChecked(false);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to record consent');
        setConsentChecked(false);
      }
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user phone number first
      await getUserPhoneNumber();

      // Send OTP
      const otpResult: SendOtpResult = await sendAgreementOtp({ loanId });
      if (!otpResult.success) {
        throw new Error(otpResult.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      setOtpTimer(30); // 30 seconds timer
      setCurrentStep('otp');
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verifyResult: VerifyOtpResult = await verifyAgreementOtp({
        loanId,
        otpCode: otp,
        agreement_text: 'I agree to the terms and conditions',
        agreement_title: 'Loan Agreement',
        agreement_version: '1.0'
      });

      if (!verifyResult.success) {
        throw new Error(verifyResult.message || 'Failed to verify OTP');
      }

      setCurrentStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const otpResult: SendOtpResult = await sendAgreementOtp({ loanId });
      if (!otpResult.success) {
        throw new Error(otpResult.message || 'Failed to resend OTP');
      }

      setOtpTimer(30);
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 my-0">
        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-gray-400">
          <h2 className="text-xl font-bold text-gray-900">Agreement Signing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Language Selection */}
          {currentStep === 'language' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-700 mb-6">
                  E-sign the agreement using an OTP to authorise the payment.
                </p>
                
                {/* Agreement Hero Image */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img 
                      src="https://carepay.money/static/media/Agreement%20hero%20image.0b7837fc505053904d6bcdc0c00cef30.svg" 
                      alt="Agreement signing illustration"
                      className="w-32 h-32"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select your preferred language for signing agreement
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-left flex items-center justify-between"
                      >
                        <span className="text-gray-900">{selectedLanguage}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showLanguageDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setSelectedLanguage(lang.name);
                                setShowLanguageDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                                selectedLanguage === lang.name ? 'bg-purple-50 text-purple-700' : 'text-gray-900'
                              }`}
                            >
                              <span>{lang.name}</span>
                              {selectedLanguage === lang.name && (
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAgreement}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                      boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                    }}
                  >
                    {isLoading ? 'Generating...' : 'Generate Agreement'}
                  </button>

                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Completely secure and encrypted.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 'documents' && agreementUrls && (
            <div className="space-y-4">
              {/* Location Permission Status */}
              {!location && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {isRequestingLocation ? 'Requesting location permission...' : 'Location permission required to proceed'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('kfs')}
                  className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'kfs'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Key Fact Statement
                </button>
                <button
                  onClick={() => setActiveTab('agreement')}
                  className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'agreement'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Agreement
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-96 bg-gray-50 flex items-center justify-center">
                  <iframe
                    src={activeTab === 'kfs' ? agreementUrls.kfsUrl : agreementUrls.agreementUrl}
                    className="w-full h-full"
                    title={activeTab === 'kfs' ? 'Key Fact Statement' : 'Agreement'}
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => handleConsentChange(e.target.checked)}
                    disabled={!location}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm ${!location ? 'text-gray-400' : 'text-gray-700'}`}>
                    I have read and understood the contents of this document and I accept this KFS and Sanction letter.
                  </span>
                </label>

                {consentChecked && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-700 mb-3">
                      Agreement will be e-signed using your location and an OTP that will be sent to your number.
                    </p>
                    <button
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                        boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {currentStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enter OTP sent on {userPhone}
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="- - - -"
                    className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={4}
                  />

                  <div className="flex space-x-3">
                    <button
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0 || isLoading}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpTimer > 0 ? `Resend OTP ${otpTimer}s` : 'Resend OTP'}
                    </button>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 4 || isLoading}
                      className="flex-1 px-4 py-2 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                        boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
                      }}
                    >
                      {isLoading ? 'Verifying...' : 'Submit OTP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Agreement Signed Successfully!
                </h3>
                <p className="text-gray-600">
                  Your payment has been authorised and the agreement has been e-signed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementSigningPopup;