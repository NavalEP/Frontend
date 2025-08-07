// Native sharing utility functions

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Check if native sharing is supported by the browser
 */
export const isNativeSharingSupported = (): boolean => {
  return 'navigator' in window && 'share' in navigator;
};

/**
 * Check if file sharing is supported
 */
export const isFileSharingSupported = (): boolean => {
  return isNativeSharingSupported() && 'canShare' in navigator;
};

/**
 * Share text content using native sharing API
 */
export const shareText = async (data: { title?: string; text: string; url?: string }): Promise<void> => {
  if (!isNativeSharingSupported()) {
    throw new Error('Native sharing is not supported on this browser/device');
  }

  try {
    await navigator.share({
      title: data.title || 'Shared from Careena',
      text: data.text,
      url: data.url,
    });
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error('Failed to share content');
    }
    // AbortError means user cancelled sharing, which is not an error
  }
};

/**
 * Share files using native sharing API
 */
export const shareFiles = async (data: { title?: string; text?: string; files: File[] }): Promise<void> => {
  if (!isFileSharingSupported()) {
    throw new Error('File sharing is not supported on this browser/device');
  }

  // Check if the browser can share the files
  if (!navigator.canShare({ files: data.files })) {
    throw new Error('This type of file cannot be shared');
  }

  try {
    await navigator.share({
      title: data.title || 'Shared from Careena',
      text: data.text,
      files: data.files,
    });
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error('Failed to share files');
    }
    // AbortError means user cancelled sharing, which is not an error
  }
};

/**
 * Share an image from URL by fetching it and creating a File object
 */
export const shareImageFromUrl = async (data: {
  imageUrl: string;
  fileName?: string;
  title?: string;
  text?: string;
}): Promise<void> => {
  try {
    // Fetch the image
    const response = await fetch(data.imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    const fileName = data.fileName || `shared-image-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: blob.type });

    await shareFiles({
      title: data.title || 'Shared Image',
      text: data.text || 'Here is a shared image from Careena',
      files: [file],
    });
  } catch (error) {
    console.error('Error sharing image:', error);
    throw error;
  }
};

/**
 * Fallback sharing methods when native sharing is not available
 */
export const fallbackShare = {
  /**
   * Copy text to clipboard
   */
  copyToClipboard: async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  },

  /**
   * Open WhatsApp share
   */
  shareToWhatsApp: (text: string): void => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Open email share
   */
  shareViaEmail: (subject: string, body: string): void => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  },
};

/**
 * Smart share function that tries native sharing first, then falls back to alternatives
 */
export const smartShare = async (data: ShareData): Promise<void> => {
  try {
    if (data.files && data.files.length > 0) {
      await shareFiles({
        title: data.title,
        text: data.text,
        files: data.files,
      });
    } else if (data.text || data.url) {
      await shareText({
        title: data.title,
        text: data.text || data.url || '',
        url: data.url,
      });
    }
  } catch (error) {
    console.warn('Native sharing failed, using fallback:', error);
    
    // Fallback to copying text to clipboard
    const shareText = data.text || data.url || '';
    if (shareText) {
      await fallbackShare.copyToClipboard(shareText);
      
      // Show a toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg z-50';
      toast.textContent = 'Link copied to clipboard!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 2000);
    }
  }
}; 