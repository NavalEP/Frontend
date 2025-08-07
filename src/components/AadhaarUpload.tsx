import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Camera } from 'lucide-react';

interface AadhaarUploadProps {
  onUpload: (combinedFile: File) => Promise<void>;
  isUploading: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

interface UploadedSide {
  file: File;
  preview: string;
  side: 'front' | 'back';
}

const AadhaarUpload: React.FC<AadhaarUploadProps> = ({
  onUpload,
  isUploading,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
  maxSize = 10, // 10MB default
  className = ''
}) => {
  const [uploadedSides, setUploadedSides] = useState<UploadedSide[]>([]);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload ${acceptedTypes.map(type => 
        type.includes('image') ? 'image' : 'PDF'
      ).join(' or ')} files.`;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size too large. Maximum size is ${maxSize}MB.`;
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File, side: 'front' | 'back') => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const preview = await createFilePreview(file);
      const newUploadedSide: UploadedSide = { file, preview, side };
      
      setUploadedSides(prev => {
        // Remove existing side if it exists
        const filtered = prev.filter(item => item.side !== side);
        return [...filtered, newUploadedSide];
      });
    } catch (err) {
      setError('Failed to process file. Please try again.');
    }
  }, [acceptedTypes, maxSize]);

  const handleDrag = useCallback((e: React.DragEvent, side: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(side);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], side);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0], side);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0], side);
    }
  };

  const removeFile = (side: 'front' | 'back') => {
    setUploadedSides(prev => prev.filter(item => item.side !== side));
    setError(null);
    
    // Clear the input value
    if (side === 'front') {
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (frontCameraRef.current) frontCameraRef.current.value = '';
    } else if (side === 'back') {
      if (backInputRef.current) backInputRef.current.value = '';
      if (backCameraRef.current) backCameraRef.current.value = '';
    }
  };

  const combineImages = async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      const frontImage = new window.Image();
      const backImage = new window.Image();
      
      let loadedImages = 0;
      const totalImages = 2;

      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          // Calculate canvas dimensions for side-by-side layout
          const maxHeight = Math.max(frontImage.height, backImage.height);
          const totalWidth = frontImage.width + backImage.width + 20; // 20px gap
          
          canvas.width = totalWidth;
          canvas.height = maxHeight;
          
          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw front image on the left
          ctx.drawImage(frontImage, 0, 0);
          
          // Draw back image on the right with gap
          ctx.drawImage(backImage, frontImage.width + 20, 0);
          
          // Convert to blob and create file
          canvas.toBlob((blob) => {
            if (blob) {
              const combinedFile = new File([blob], 'aadhaar_combined.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(combinedFile);
            } else {
              reject(new Error('Failed to create combined image'));
            }
          }, 'image/jpeg', 0.9);
        }
      };

      frontImage.onload = checkAllLoaded;
      backImage.onload = checkAllLoaded;
      
      frontImage.onerror = () => reject(new Error('Failed to load front image'));
      backImage.onerror = () => reject(new Error('Failed to load back image'));
      
      const frontSide = uploadedSides.find(side => side.side === 'front');
      const backSide = uploadedSides.find(side => side.side === 'back');
      
      if (frontSide) frontImage.src = frontSide.preview;
      if (backSide) backImage.src = backSide.preview;
    });
  };

  const handleUpload = async () => {
    if (uploadedSides.length !== 2) {
      setError('Please upload both front and back sides of the Aadhaar card.');
      return;
    }

    if (isUploading) return;

    try {
      setError(null);
      const combinedFile = await combineImages();
      await onUpload(combinedFile);
      
      // Clear uploaded files after successful upload
      setUploadedSides([]);
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';
      if (frontCameraRef.current) frontCameraRef.current.value = '';
      if (backCameraRef.current) backCameraRef.current.value = '';
    } catch (err) {
      setError('Failed to combine and upload images. Please try again.');
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <Image className="h-4 w-4 text-primary-600" />;
    }
    return <FileText className="h-4 w-4 text-primary-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadArea = (side: 'front' | 'back', title: string, description: string) => {
    const uploadedSide = uploadedSides.find(s => s.side === side);
    const inputRef = side === 'front' ? frontInputRef : backInputRef;
    const cameraRef = side === 'front' ? frontCameraRef : backCameraRef;
    const isDragActive = dragActive === side;

    return (
      <div className="w-full">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleInputChange(e, side)}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleCameraCapture(e, side)}
          className="hidden"
        />

        {!uploadedSide ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-1 text-center transition-colors ${
              isDragActive
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragEnter={(e) => handleDrag(e, side)}
            onDragLeave={(e) => handleDrag(e, side)}
            onDragOver={(e) => handleDrag(e, side)}
            onDrop={(e) => handleDrop(e, side)}
          >
            <Upload className="mx-auto h-4 w-4 text-gray-400 mb-0.5" />
            <h3 className="text-[10px] font-medium text-gray-900 mb-0.5">{title}</h3>
            <p className="text-[9px] text-gray-600 mb-0.5">
              <span className="font-medium text-primary-600">Tap or drag</span>
            </p>
            <p className="text-[9px] text-gray-500 mb-0.5">
              {description}
            </p>
            <div className="flex gap-1 justify-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-1.5 py-0.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-[10px] flex items-center gap-0.5"
              >
                <Upload className="h-3 w-3" />
                Choose
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="px-1.5 py-0.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-[10px] flex items-center gap-0.5"
              >
                <Camera className="h-3 w-3" />
                Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-1 bg-gray-50">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center space-x-0.5">
                {getFileIcon(uploadedSide.file)}
                <div>
                  <p className="text-[9px] font-medium text-gray-900 truncate">
                    {uploadedSide.file.name}
                  </p>
                  <p className="text-[9px] text-gray-500">
                    {formatFileSize(uploadedSide.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-0.5">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <button
                  type="button"
                  onClick={() => removeFile(side)}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            </div>
            {/* Preview */}
            <div className="mt-0.5">
              <img
                src={uploadedSide.preview}
                alt={`${side} side preview`}
                className="w-full h-12 object-cover rounded border border-gray-200"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const canUpload = uploadedSides.length === 2 && !isUploading;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1 max-w-xs mx-auto">
        <h2 className="text-xs font-semibold text-gray-900 mb-0.5 text-center">Upload Aadhaar Card</h2>
        <p className="text-[9px] text-gray-600 text-center">
          Upload both sides of your Aadhaar card to proceed.
        </p>
      </div>

      <div className="flex flex-col gap-1 mb-1 max-w-xs mx-auto">
        {renderUploadArea(
          'front',
          'Front Side',
          'Photo & details'
        )}
        {renderUploadArea(
          'back',
          'Back Side',
          'Address side'
        )}
      </div>

      {/* Upload Progress */}
      <div className="mb-1 max-w-xs mx-auto">
        <div className="flex items-center justify-between text-[9px] text-gray-600 mb-0.5">
          <span>{uploadedSides.length}/2 sides</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-0.5">
          <div 
            className="bg-primary-600 h-0.5 rounded-full transition-all duration-300"
            style={{ width: `${(uploadedSides.length / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end max-w-xs mx-auto">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          className="px-1.5 py-0.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[10px] flex items-center space-x-1"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-1 max-w-xs mx-auto">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AadhaarUpload; 