import React, { useState, useEffect } from 'react';
import { sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LockKeyhole, Smartphone, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const { login } = useAuth();
  
  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Validation
    if (!validatePhoneNumber(cleanPhoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!consentAccepted) {
      setError('Please accept the terms and conditions to proceed');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await sendOtp(cleanPhoneNumber);
      
      // Check if the response has a message indicating success
      if (response.data.message === 'OTP sent successfully') {
        setOtpSent(true);
        setCountdown(30); // 30 second countdown for resend
        setError(null);
      } else {
        throw new Error('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      // Reset OTP sent state in case of error
      setOtpSent(false);
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const cleanOtp = otp.trim();
    
    // Validation
    if (!validatePhoneNumber(cleanPhoneNumber)) {
      setError('Invalid phone number format');
      return;
    }
    
    if (cleanOtp.length !== 4 || !/^\d+$/.test(cleanOtp)) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Get doctor info from sessionStorage
      const doctorId = sessionStorage.getItem('doctorId');
      const doctorName = sessionStorage.getItem('doctorName');
      
      const response = await verifyOtp(cleanPhoneNumber, cleanOtp, doctorId || undefined, doctorName || undefined);
      
      if (response.data.message === 'OTP verified successfully' && response.data.token) {
        login(response.data, '/login');
        setError(null);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setOtp(value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto min-h-full py-4 sm:py-8 px-4">
      <div className="p-6 sm:p-8 bg-white rounded-xl shadow-md w-full animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center">
            <img
              src="/images/careeena-avatar.jpg"
              alt="Careena Avatar"
              className="h-32 w-32 sm:h-44 sm:w-44 rounded-full border-2 border-white shadow-lg mx-auto object-cover"
            />
          </div>
          <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-gray-900">Welcome to Careena</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {otpSent ? 'Enter the OTP sent to your phone' : 'Sign in for your loan enquiry'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your 10-digit number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="input pl-10"
                  disabled={isLoading}
                  maxLength={10}
                />
              </div>
            </div>
            
            {/* Consent Section */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="consent" className="text-sm text-gray-700">
                    <p className="mb-2">I consent to the following:</p>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>1. I confirm this number is linked to my Aadhaar, PAN, and income account. I authorize CareCoin Technologies Pvt Ltd and its partners to fetch my credit information from CIBIL, Experian, Equifax, etc.</p>
                      <p>2. I also consent to the collection, storage, and use of my Aadhaar, employment, and other details needed to process my application, as per applicable laws.</p>
                      <p>3. I accept the{' '}
                        <a 
                          href="https://carepay.money/patient/termspatient" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 underline"
                        >
                          Terms & Conditions
                        </a>
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading || phoneNumber.length !== 10 || !consentAccepted}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                One-Time Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockKeyhole className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  className="input pl-10"
                  disabled={isLoading}
                  maxLength={4}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                OTP sent to {phoneNumber}
              </p>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading || otp.length !== 4}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || isLoading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:hover:text-gray-400"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Are you a doctor or medical staff?{' '}
            <Link 
              to="/doctor-login" 
              className="text-primary-600 hover:text-primary-500 underline flex items-center justify-center gap-1 mt-2"
            >
              <Stethoscope className="h-3 w-3" />
              Staff Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;