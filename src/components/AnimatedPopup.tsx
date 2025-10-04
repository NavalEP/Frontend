import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface AnimatedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const AnimatedPopup: React.FC<AnimatedPopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
      
      // Start animation sequence
      setIsVisible(true);
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      
      // Cleanup function
      return () => {
        // Restore original overflow value
        document.body.style.overflow = originalOverflow;
      };
    } else {
      // Start exit animation
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
      }, 2000); // Match animation duration
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Backdrop with fade animation */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
          opacity: isAnimating ? 0.5 : 0,
          transition: 'opacity 2000ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Popup container with slide-up animation */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 50,
          pointerEvents: 'none'
        }}
      >
        <div 
          className={className}
          style={{ 
            width: '100%',
            backgroundColor: 'white',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 2000ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'auto',
            position: 'relative',
            display: 'block',
            maxHeight: '90vh'
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div 
              className={`flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 z-10 bg-white rounded-t-3xl ${headerClassName}`}
              style={headerClassName.includes('text-white') ? { background: 'linear-gradient(to right, #514c9f, #514c9f)' } : {}}
            >
              {title && (
                <h2 className={`text-xl font-bold ${headerClassName.includes('text-white') ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${headerClassName.includes('text-white') ? 'text-white hover:opacity-70' : ''}`}
                  aria-label="Close popup"
                >
                  <X className={`h-6 w-6 ${headerClassName.includes('text-white') ? 'text-white' : 'text-gray-600'}`} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`overflow-y-auto ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedPopup;
