import React, { useState } from 'react';
import FaceVerificationPopup from './FaceVerificationPopup';

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
  children = "Share link for selfie with Patient"
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleButtonClick = () => {
    setIsPopupOpen(true);
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
