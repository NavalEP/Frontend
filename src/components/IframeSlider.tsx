import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAssignedProduct, getLoanDetailsByUserId, getMatchingEmiPlansFromAPI } from '../services/loanApi';

interface IframeSliderProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  userId?: string; // Add userId prop to check assignproduct API
  onSendMessage?: (message: string) => void; // Add callback to send message to agent
}

const IframeSlider: React.FC<IframeSliderProps> = ({ isOpen, onClose, url, title = "Payment Plan Selection", userId, onSendMessage }) => {
  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // State for monitoring status
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [paymentSummarySent, setPaymentSummarySent] = useState(false);
  
  // Function to send payment plan message to agent
  const sendPaymentPlanMessage = async (assignedProduct: any) => {
    if (!userId || !onSendMessage) return;
    
    // Check if payment summary has already been sent for this session
    if (paymentSummarySent) {
      console.log('Payment summary already sent for this session, skipping...');
      return;
    }

    try {
      console.log('Starting payment plan message generation for productId:', assignedProduct.productId);
      
      // Step 1: Get loan details to get loanId
      const loanDetails = await getLoanDetailsByUserId(userId);
      if (!loanDetails) {
        console.error('Could not get loan details for userId:', userId);
        return;
      }

      console.log('Loan details retrieved, loanId:', loanDetails.loanId);

      // Step 2: Call matchingEmiPlans API with userId and loanId
      const emiPlansResult = await getMatchingEmiPlansFromAPI(userId, loanDetails.loanId);
      
      if (emiPlansResult.plans && emiPlansResult.plans.length > 0) {
        console.log('EMI plans found:', emiPlansResult.plans.length, 'plans');
        
        // Find the plan that matches the assigned product
        const matchingPlan = emiPlansResult.plans.find(plan => 
          plan.productDetailsDO.productId === assignedProduct.productId
        );

        if (matchingPlan) {
          console.log('Matching plan found for productId:', assignedProduct.productId);
          
          // Create payment plan message similar to the image
          const subventionAmount = (matchingPlan.productDetailsDO.subventionRate * matchingPlan.emi / 100);
          const paymentPlanMessage = `Payment Plan Summary:

Effective tenure: ${matchingPlan.productDetailsDO.totalEmi} months
EMI amount: ₹ ${matchingPlan.emi.toLocaleString()}
Processing fees: ₹ ${matchingPlan.productDetailsDO.processingFesIncludingGSTINR.toLocaleString()} (${matchingPlan.productDetailsDO.processingFesIncludingGSTRate}%)
Advance payment: ₹ ${matchingPlan.downPayment.toLocaleString()}
Subvention: ${matchingPlan.productDetailsDO.subventionRate}% (₹ ${subventionAmount.toLocaleString()})

You must collect ₹ ${matchingPlan.downPayment.toLocaleString()} as advance EMI payment from the patient.`;

          // Send the message to the agent
          onSendMessage(paymentPlanMessage);
          console.log('Payment plan message sent to agent:', paymentPlanMessage);
          
          // Mark payment summary as sent to prevent duplicates
          setPaymentSummarySent(true);
        } else {
          console.log('No matching plan found for productId:', assignedProduct.productId);
          console.log('Available productIds:', emiPlansResult.plans.map(p => p.productDetailsDO.productId));
        }
      } else {
        console.log('No EMI plans found in bureau response');
      }
    } catch (error) {
      console.error('Error sending payment plan message:', error);
    }
  };
  
  // Polling mechanism to check assignproduct API status
  useEffect(() => {
    if (!isOpen || !userId) return;

    // Reset payment summary sent flag when iframe opens
    setPaymentSummarySent(false);

    let pollInterval: NodeJS.Timeout;
    let maxPollingTimeout: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLL_COUNT = 150; // Maximum 5 minutes of polling (150 * 2 seconds)
    const POLL_INTERVAL = 2000; // 2 seconds

    // Set monitoring state to true when polling starts
    setIsMonitoring(true);

    const checkAssignProductStatus = async () => {
      // Stop polling if payment summary has already been sent
      if (paymentSummarySent) {
        console.log('Payment summary already sent, stopping polling');
        clearInterval(pollInterval);
        setIsMonitoring(false);
        return;
      }
      
      try {
        pollCount++;
        console.log(`Checking assignproduct API status (attempt ${pollCount}/${MAX_POLL_COUNT})`);
        
        const assignedProduct = await getAssignedProduct(userId);
        
        // If we get a successful response (200 status) and we have product data
        if (assignedProduct && assignedProduct.productId) {
          console.log('Assignproduct API returned 200 status with productId:', assignedProduct.productId);
          
          // Send payment plan message to agent
          await sendPaymentPlanMessage(assignedProduct);
          
          // Close the iframe slider immediately
          onClose();
          return;
        }
      } catch (error) {
        console.log('Assignproduct API check failed or returned non-200 status:', error);
      }

      // Stop polling if we've reached the maximum count
      if (pollCount >= MAX_POLL_COUNT) {
        console.log('Maximum polling attempts reached, stopping assignproduct API monitoring');
        clearInterval(pollInterval);
        setIsMonitoring(false);
      }
    };

    // Start polling every 2 seconds
    pollInterval = setInterval(checkAssignProductStatus, POLL_INTERVAL);

    // Set maximum polling timeout (5 minutes)
    maxPollingTimeout = setTimeout(() => {
      console.log('Maximum polling time reached, stopping assignproduct API monitoring');
      clearInterval(pollInterval);
      setIsMonitoring(false);
    }, MAX_POLL_COUNT * POLL_INTERVAL);

    // Cleanup interval when component unmounts or iframe closes
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (maxPollingTimeout) {
        clearTimeout(maxPollingTimeout);
      }
      setIsMonitoring(false);
      setPaymentSummarySent(false);
    };
      }, [isOpen, userId, onClose, paymentSummarySent]);

  // Handle iframe load error or interaction issues
  const handleIframeError = () => {
    if (isMobile) {
      // On mobile, if iframe fails to load or has interaction issues, open in new tab
      window.open(url, '_blank');
      onClose();
    }
  };
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    // Iframe loaded successfully
    console.log('Iframe loaded successfully');
    
    // Inject CSS to improve button clickability for this specific content
    try {
      const iframeElement = document.querySelector('iframe');
      if (iframeElement && iframeElement.contentDocument) {
        const style = iframeElement.contentDocument.createElement('style');
        style.textContent = `
          /* Mobile touch improvements for CarePay content */
          body {
            touch-action: auto !important;
            pointer-events: auto !important;
            -webkit-user-select: auto !important;
            user-select: auto !important;
            padding-bottom: 20px !important;
            margin-bottom: 20px !important;
          }
          
          /* Ensure all buttons are clickable */
          button, .submit, input[type="button"], input[type="submit"] {
            pointer-events: auto !important;
            touch-action: auto !important;
            -webkit-touch-callout: default !important;
            -webkit-user-select: auto !important;
            user-select: auto !important;
            cursor: pointer !important;
            min-height: 44px !important;
            min-width: 44px !important;
          }
          
          /* Handle modal overlays */
          .bottomPopOverModal {
            pointer-events: auto !important;
            touch-action: auto !important;
            z-index: 999 !important;
          }
          
          .popUpCard-custom {
            pointer-events: auto !important;
            touch-action: auto !important;
            z-index: 1000 !important;
          }
          
          /* Ensure all interactive elements work */
          * {
            pointer-events: auto !important;
            touch-action: auto !important;
          }
          
          /* Ensure bottom buttons have proper spacing */
          button:last-child, .submit:last-child, input[type="button"]:last-child, input[type="submit"]:last-child {
            margin-bottom: 20px !important;
          }
          
          /* Add bottom padding to forms and containers */
          form, .container, .modal-content, .popup-content {
            padding-bottom: 20px !important;
          }
        `;
        iframeElement.contentDocument.head.appendChild(style);
      }
    } catch (error) {
      console.log('Could not inject CSS into iframe (cross-origin restriction)');
    }
  };
  
  // Add timeout to detect if iframe is not responding on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      const timeout = setTimeout(() => {
        // After 5 seconds, if user hasn't interacted with iframe, show a message
        console.log('Iframe timeout reached - user may need alternative option');
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isMobile]);
  
  // Add iframe interaction detection
  useEffect(() => {
    if (isOpen) {
      const handleIframeClick = (event: Event) => {
        // Log iframe interactions to help debug
        console.log('Iframe interaction detected');
      };
      
      const iframeElement = document.querySelector('iframe');
      if (iframeElement) {
        iframeElement.addEventListener('click', handleIframeClick);
        iframeElement.addEventListener('touchstart', handleIframeClick);
        
        return () => {
          iframeElement.removeEventListener('click', handleIframeClick);
          iframeElement.removeEventListener('touchstart', handleIframeClick);
        };
      }
    }
  }, [isOpen]);
  
  // Handle escape key to close slider
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when slider is open
      document.body.style.overflow = 'hidden';
      // Add mobile-specific touch handling
      if (isMobile) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scroll when slider is closed
      document.body.style.overflow = 'unset';
      if (isMobile) {
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [isOpen, onClose, isMobile]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ 
          padding: '2.5%'
        }}
      >
                           {/* Modal Container */}
          <div 
            className="bg-white rounded-3xl shadow-2xl iframe-slider-container w-full h-full max-w-none relative"
            style={{ 
              width: '95%',
              height: '95%',
              touchAction: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Monitoring Status Indicator */}
            {isMonitoring && userId && (
              <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-blue-500 bg-opacity-90 text-white text-xs rounded-full flex items-center space-x-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Monitoring...</span>
              </div>
            )}
            
            {/* Iframe Container */}
           <div className="flex-1 h-full relative overflow-hidden iframe-mobile-container">
            <div className="h-full pb-4">
              <iframe
              src={url}
              title={title}
              className="w-full h-full border-0"
              allow="camera; microphone; geolocation; payment; clipboard-write; web-share; fullscreen; publickey-credentials-get; publickey-credentials-create; otp-credentials; autoplay"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox={isMobile ? "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation allow-presentation allow-same-origin allow-popups-to-escape-sandbox" : "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"}
              style={{ 
                border: 'none',
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                height: 'calc(100% - 16px)',
                transform: 'none',
                transformOrigin: '0 0',
                WebkitTransform: 'none',
                WebkitTransformOrigin: '0 0',
                touchAction: 'auto',
                WebkitTouchCallout: 'default',
                WebkitUserSelect: 'auto',
                userSelect: 'auto',
                scrollbarWidth: 'auto',
                scrollbarColor: 'auto',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 1,
                minHeight: 'calc(100% - 16px)',
                display: 'block',
                overflow: 'auto',
                paddingBottom: '16px',
                ...(isMobile && {
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  WebkitTransform: 'translateZ(0)',
                  transform: 'translateZ(0)',
                  touchAction: 'auto',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                  // Additional mobile optimizations for modal content
                  WebkitTapHighlightColor: 'transparent',
                  // Ensure bottom spacing for mobile
                  marginBottom: '16px'
                })
              }}
              scrolling="auto"
              frameBorder="0"
              allowFullScreen={true}
              loading="eager"
            />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IframeSlider;
