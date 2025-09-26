import React, { useState, useEffect } from 'react';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import { smartShare } from '../utils/shareUtils';
import { getPostApprovalStatus, PostApprovalStatusData, checkAadhaarVerification } from '../services/postApprovalApi';
import SelfieVerificationButton from './SelfieVerificationButton';
import AgreementSigningPopup from './AgreementSigningPopup';

interface PaymentStep {
  title: string;
  description: string;
  url: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

interface PaymentStepsMessageProps {
  steps: PaymentStep[];
  onLinkClick?: (url: string) => void;
  loanId?: string;
  onAadhaarVerificationClick?: () => void;
}

const PaymentStepsMessage: React.FC<PaymentStepsMessageProps> = ({ steps, onLinkClick, loanId, onAadhaarVerificationClick }) => {
  const [postApprovalStatus, setPostApprovalStatus] = useState<PostApprovalStatusData | null>(null);
  const [showAadhaarMessage, setShowAadhaarMessage] = useState<number | null>(null);
  const [showAgreementPopup, setShowAgreementPopup] = useState(false);

  // Fetch post-approval status when component mounts or loanId changes
  useEffect(() => {
    const fetchPostApprovalStatus = async () => {
      if (!loanId) return;
      
      try {
        const result = await getPostApprovalStatus(loanId);
        if (result.success && result.data) {
          setPostApprovalStatus(result.data);
        }
      } catch (error) {
        console.error('Error fetching post-approval status:', error);
      }
    };

    fetchPostApprovalStatus();
  }, [loanId]);

  // Function to check if a step is completed based on the step title
  const isStepCompleted = (stepTitle: string): boolean => {
    if (!postApprovalStatus) return false;
    
    const title = stepTitle.toLowerCase();
    if (title.includes('adhaar') || title.includes('aadhaar')) {
      return postApprovalStatus.aadhaar_verified;
    }
    if (title.includes('face') || title.includes('selfie')) {
      return postApprovalStatus.selfie;
    }
    if (title.includes('emi') || title.includes('auto-pay') || title.includes('auto pay')) {
      return postApprovalStatus.auto_pay;
    }
    if (title.includes('agreement') || title.includes('e-sign')) {
      return postApprovalStatus.agreement_setup;
    }
    
    return false;
  };

  // Function to get completion status text based on step title
  const getCompletionStatusText = (stepTitle: string): string => {
    const title = stepTitle.toLowerCase();
    if (title.includes('adhaar') || title.includes('aadhaar')) {
      return 'Aadhaar verification completed';
    }
    if (title.includes('face') || title.includes('selfie')) {
      return 'Face verification completed';
    }
    if (title.includes('emi') || title.includes('auto-pay') || title.includes('auto pay')) {
      return 'EMI auto-pay setup completed';
    }
    if (title.includes('agreement') || title.includes('e-sign')) {
      return 'E-sign agreement completed';
    }
    return 'Completed';
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    
    // Show a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg z-50';
    toast.textContent = 'Copied to clipboard!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  // Function to check Aadhaar verification before sharing
  const checkAadhaarBeforeShare = async (url: string, stepIndex: number) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please login again.');
      return;
    }

    try {
      const result = await checkAadhaarVerification(userId);
      if (result.success && result.data === false) {
        setShowAadhaarMessage(stepIndex);
        // Hide message after 5 seconds
        setTimeout(() => setShowAadhaarMessage(null), 5000);
        return;
      }
      
      // If Aadhaar is verified or check fails, proceed with sharing
      await handleNativeShare(url);
    } catch (error) {
      console.error('Error checking Aadhaar verification:', error);
      // If there's an error checking Aadhaar, still allow sharing
      await handleNativeShare(url);
    }
  };

  // Function to check Aadhaar verification before primary action (for share buttons)
  const checkAadhaarBeforePrimaryAction = async (url: string, stepIndex: number) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please login again.');
      return;
    }

    try {
      const result = await checkAadhaarVerification(userId);
      if (result.success && result.data === false) {
        setShowAadhaarMessage(stepIndex);
        // Hide message after 5 seconds
        setTimeout(() => setShowAadhaarMessage(null), 5000);
        return;
      }
      
      // If Aadhaar is verified or check fails, proceed with the action
      handleLinkClick(url);
    } catch (error) {
      console.error('Error checking Aadhaar verification:', error);
      // If there's an error checking Aadhaar, still allow the action
      handleLinkClick(url);
    }
  };

  // Function to check Aadhaar verification before copying
  const checkAadhaarBeforeCopy = async (url: string, stepIndex: number) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please login again.');
      return;
    }

    try {
      const result = await checkAadhaarVerification(userId);
      if (result.success && result.data === false) {
        setShowAadhaarMessage(stepIndex);
        // Hide message after 5 seconds
        setTimeout(() => setShowAadhaarMessage(null), 5000);
        return;
      }
      
      // If Aadhaar is verified or check fails, proceed with copying
      copyToClipboard(url);
    } catch (error) {
      console.error('Error checking Aadhaar verification:', error);
      // If there's an error checking Aadhaar, still allow copying
      copyToClipboard(url);
    }
  };

  const handleNativeShare = async (url: string) => {
    try {
      await smartShare({
        title: 'Payment Step - Careena',
        text: `Complete your payment step: ${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to WhatsApp if native sharing fails
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Complete your payment step: ${url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleLinkClick = (url: string) => {
    if (onLinkClick) {
      onLinkClick(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Get the step count
  const stepCount = steps.length;
  
  // Generate the step list dynamically
  const stepList = steps.map(step => {
    if (step.title.includes('Adhaar')) return '• Adhaar verification.';
    if (step.title.includes('Face')) return '• Face verification.';
    if (step.title.includes('EMI')) return '• EMI auto payment approval.';
    if (step.title.includes('E-sign')) return '• Agreement e-signing.';
    return `• ${step.title}`;
  });
  
  // Get the first step description
  const firstStepDescription = steps.length > 0 ? steps[0].description : 'Now, let\'s complete the first step.';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Payment is now just {stepCount} steps away    
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          {stepList.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
        <p className="text-sm text-gray-700 mt-3 font-medium">
          {firstStepDescription}
        </p>
      </div>

      {/* Payment Steps Cards */}
      {steps.map((step, index) => {
        const isCompleted = isStepCompleted(step.title);
        const completionText = getCompletionStatusText(step.title);
        
        return (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                {step.title}
              </h4>
              {isCompleted && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Completed</span>
                </div>
              )}
            </div>
            
            {/* Primary Action Button */}
            {step.primaryButtonText === "Share link for selfie with Patient" && !isCompleted ? (
              <SelfieVerificationButton
                userId={localStorage.getItem('userId') || ''}
                onSuccess={() => {
                  // Refresh the post-approval status after successful verification
                  const fetchPostApprovalStatus = async () => {
                    if (!loanId) return;
                    try {
                      const result = await getPostApprovalStatus(loanId);
                      if (result.success && result.data) {
                        setPostApprovalStatus(result.data);
                      }
                    } catch (error) {
                      console.error('Error fetching post-approval status:', error);
                    }
                  };
                  fetchPostApprovalStatus();
                }}
                className={`w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3`}
                style={{
                  background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
                  boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
                }}
              />
            ) : (
              <button
                onClick={() => {
                  if (isCompleted) return;
                  // Check if this is the Aadhaar verification button
                  if (step.primaryButtonText.includes('Complete Adhaar verification') || 
                      step.primaryButtonText.includes('Complete Aadhaar verification')) {
                    onAadhaarVerificationClick?.();
                    return;
                  }
                  // Check if this is the E-sign agreement button
                  if (step.primaryButtonText.includes('E-sign agreement')) {
                    setShowAgreementPopup(true);
                    return;
                  }
                  // Check if this is a share button that needs Aadhaar verification (only for Face verification)
                  if (step.primaryButtonText.includes('Share link') && (step.title.includes('Face') || step.title.includes('Face verification'))) {
                    checkAadhaarBeforePrimaryAction(step.url, index);
                  } else {
                    handleLinkClick(step.url);
                  }
                }}
                className={`w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3 ${
                  isCompleted ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                style={isCompleted ? {
                  background: 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)',
                  boxShadow: 'rgba(16, 185, 129, 0.3) 0px 4px 6px'
                } : {
                  background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
                  boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
                }}
                disabled={isCompleted}
              >
                {isCompleted ? `✓ ${completionText}` : step.primaryButtonText}
              </button>
            )}
          
          {/* Secondary Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Only check Aadhaar verification for Face verification section
                if (step.title.includes('Face') || step.title.includes('Face verification')) {
                  checkAadhaarBeforeShare(step.url, index);
                } else {
                  handleNativeShare(step.url);
                }
              }}
              className="flex-1 px-3 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2 text-xs"
              style={{
                backgroundColor: '#f3f2ff',
                color: '#514c9f'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8e5ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f2ff';
              }}
            >
              <Share2 className="h-3 w-3" />
              <span>{step.secondaryButtonText}</span>
            </button>
            <button
              onClick={() => {
                // Only check Aadhaar verification for Face verification section
                if (step.title.includes('Face') || step.title.includes('Face verification')) {
                  checkAadhaarBeforeCopy(step.url, index);
                } else {
                  copyToClipboard(step.url);
                }
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 flex items-center justify-center text-xs"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          
          {/* Aadhaar Verification Message */}
          {showAadhaarMessage === index && (
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
        </div>
        );
      })}

      {/* Agreement Signing Popup */}
      {loanId && (
        <AgreementSigningPopup
          isOpen={showAgreementPopup}
          onClose={() => setShowAgreementPopup(false)}
          loanId={loanId}
          onSuccess={() => {
            // Refresh the post-approval status after successful agreement signing
            const fetchPostApprovalStatus = async () => {
              if (!loanId) return;
              try {
                const result = await getPostApprovalStatus(loanId);
                if (result.success && result.data) {
                  setPostApprovalStatus(result.data);
                }
              } catch (error) {
                console.error('Error fetching post-approval status:', error);
              }
            };
            fetchPostApprovalStatus();
          }}
        />
      )}
    </div>
  );
};

export default PaymentStepsMessage;
