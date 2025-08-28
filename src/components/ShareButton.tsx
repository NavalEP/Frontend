import React from 'react';
import { Share2 } from 'lucide-react';
import { shareImageFromUrl, shareText, isNativeSharingSupported, fallbackShare } from '../utils/shareUtils';

interface ShareButtonProps {
  type: 'text' | 'image';
  title?: string;
  text?: string;
  url?: string;
  imageUrl?: string;
  fileName?: string;
  className?: string;
  children?: React.ReactNode;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  title,
  text,
  url,
  imageUrl,
  fileName,
  className = '',
  children
}) => {
  const handleShare = async () => {
    try {
      if (type === 'image' && imageUrl) {
        await shareImageFromUrl({
          imageUrl,
          fileName,
          title,
          text,
        });
      } else if (type === 'text') {
        await shareText({
          title,
          text: text || url || '',
          url,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Fallback to copying text to clipboard
      const shareContent = text || url || imageUrl || '';
      if (shareContent) {
        await fallbackShare.copyToClipboard(shareContent);
        
        // Show a toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg z-50';
        toast.textContent = type === 'image' ? 'Image URL copied to clipboard!' : 'Content copied to clipboard!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.remove();
        }, 2000);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}`}
      title={isNativeSharingSupported() ? "Share" : "Copy to clipboard"}
    >
      <Share2 className="h-4 w-4" />
      {children}
    </button>
  );
};

export default ShareButton; 