import React, { useState } from 'react';
import { doctorStaffLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorStaffLoginPage: React.FC = () => {
  const [doctorCode, setDoctorCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!doctorCode.trim()) {
      setError('Doctor code is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (!consentAccepted) {
      setError('Please accept the terms and conditions to proceed');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await doctorStaffLogin(doctorCode.trim(), password);
      
      if (response.data.token) {
        login({
          token: response.data.token,
          doctor_id: response.data.doctor_id,
          doctor_name: response.data.doctor_name
        });
        setError(null);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
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
            <div className="text-sm sm:text-base font-medium text-gray-700 mt-1">Doctor Staff Login</div>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Sign in to access patient loan enquiries
            </p>
          </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="doctorCode" className="block text-sm font-medium text-gray-700 mb-1">
              Doctor Code
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="doctorCode"
                type="text"
                placeholder="Enter your doctor code"
                value={doctorCode}
                onChange={(e) => setDoctorCode(e.target.value)}
                className="input pl-10"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                disabled={isLoading}
                autoComplete="current-password"
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
                    <p>1. I confirm that I am authorized medical staff and have permission to access patient loan enquiry data through this platform.</p>
                    <p>2. I consent to the collection, storage, and use of patient information for loan processing purposes, as per applicable laws and medical ethics.</p>
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
            disabled={isLoading || !doctorCode.trim() || !password.trim() || !consentAccepted}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This login is for authorized medical staff only
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Are you a patient?{' '}
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-500 underline flex items-center justify-center gap-1 mt-1"
            >
              <MessageSquare className="h-3 w-3" />
              Patient Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorStaffLoginPage; 