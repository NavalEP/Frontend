import React from 'react';
import { Share2, Copy } from 'lucide-react';
import { smartShare } from '../utils/shareUtils';

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
}

const PaymentStepsMessage: React.FC<PaymentStepsMessageProps> = ({ steps, onLinkClick }) => {
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
      {steps.map((step, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {step.title}
          </h4>
          
          {/* Primary Action Button */}
          <button
            onClick={() => handleLinkClick(step.url)}
            className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105 mb-3"
            style={{
              background: 'linear-gradient(135deg, #514c9f 0%, #3d3a7a 100%)',
              boxShadow: '0 4px 6px rgba(81, 76, 159, 0.3)'
            }}
          >
            {step.primaryButtonText}
          </button>
          
          {/* Secondary Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleNativeShare(step.url)}
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
              onClick={() => copyToClipboard(step.url)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 flex items-center justify-center text-xs"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentStepsMessage;
