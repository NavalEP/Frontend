import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface KycIframeProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  userId?: string;
}

const KycIframe: React.FC<KycIframeProps> = ({ 
  isOpen, 
  onClose, 
  url, 
  title = "KYC Verification", 
  userId 
}) => {
  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  


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
    console.log('KYC iframe loaded successfully');
    
    // Inject CSS to improve button clickability for KYC content
    try {
      const iframeElement = document.querySelector('iframe');
      if (iframeElement && iframeElement.contentDocument) {
        const style = iframeElement.contentDocument.createElement('style');
        style.textContent = `
          /* Mobile touch improvements for KYC content */
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
          className="bg-white rounded-3xl shadow-2xl kyc-iframe-container w-full h-full max-w-none relative"
          style={{ 
            width: '95%',
            height: '95%',
            touchAction: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Header with KYC title and close button */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold text-sm">{title}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>


          
          {/* Iframe Container */}
          <div className="flex-1 h-full relative overflow-hidden kyc-iframe-mobile-container pt-16">
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
                    WebkitTapHighlightColor: 'transparent',
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

export default KycIframe;
