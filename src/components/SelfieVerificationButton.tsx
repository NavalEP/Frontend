import React, { useState } from 'react';
import FaceVerificationPopup from './FaceVerificationPopup';
import { checkAadhaarVerification } from '../services/postApprovalApi';

interface SelfieVerificationButtonProps {
  userId: string;
  onSuccess?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const SelfieVerificationButton: React.FC<SelfieVerificationButtonProps> = ({
  userId,
  onSuccess,
  className = "w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3",
  style = {
    background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
    boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
  },
  children = "Complete Face verification"
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showAadhaarMessage, setShowAadhaarMessage] = useState(false);

  const handleButtonClick = async () => {
    try {
      const result = await checkAadhaarVerification(userId);
      if (result.success && result.data === false) {
        setShowAadhaarMessage(true);
        // Hide message after 5 seconds
        setTimeout(() => setShowAadhaarMessage(false), 5000);
        return;
      }
      
      // If Aadhaar is verified or check fails, open the popup
      setIsPopupOpen(true);
    } catch (error) {
      console.error('Error checking Aadhaar verification:', error);
      // If there's an error checking Aadhaar, still allow opening the popup
      setIsPopupOpen(true);
    }
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
  };

  const handleVerificationSuccess = () => {
    onSuccess?.();
    setIsPopupOpen(false);
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={className}
        style={style}
      >
        {children}
      </button>
      
      {/* Aadhaar Verification Message */}
      {showAadhaarMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Please complete Aadhaar verification first, using the link above.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <FaceVerificationPopup
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
        userId={userId}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
};

export default SelfieVerificationButton;
