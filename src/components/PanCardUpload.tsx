import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface PanCardUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

const PanCardUpload: React.FC<PanCardUploadProps> = ({
  onFileSelect,
  onUpload,
  isUploading,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  maxSize = 10, // 10MB default
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const preview = await createFilePreview(file);
      setSelectedFile(file);
      setFilePreview(preview);
      onFileSelect(file);
    } catch (err) {
      setError('Failed to process file. Please try again.');
    }
  }, [acceptedTypes, maxSize, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && !isUploading) {
      try {
        await onUpload(selectedFile);
        setSelectedFile(null);
        setFilePreview(null);
        setError(null);
      } catch (err) {
        setError('Upload failed. Please try again.');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <Image className="h-6 w-6 text-primary-600" />;
    }
    return <FileText className="h-6 w-6 text-primary-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Upload Area */}
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
            dragActive
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-5 w-5 text-gray-400 mb-1" />
          <h3 className="text-xs font-medium text-gray-900 mb-0.5">Upload PAN Card</h3>
          <p className="text-[10px] text-gray-600 mb-0.5">
            <span className="font-medium text-primary-600">Tap or drag</span>
          </p>
          <p className="text-[9px] text-gray-500 mb-0.5">
            PAN card (PDF, JPG, PNG) up to {maxSize}MB
          </p>
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-1.5 py-0.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-[10px] flex items-center gap-0.5"
            >
              <Upload className="h-3 w-3" />
              Choose
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-1.5 py-0.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-[10px] flex items-center gap-0.5"
            >
              <Camera className="h-3 w-3" />
              Camera
            </button>
          </div>
        </div>
      ) : (
        /* Selected File Display */
        <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              {getFileIcon(selectedFile)}
              <div>
                <p className="text-[10px] font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[9px] text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-0.5">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <button
                type="button"
                onClick={removeFile}
                className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                disabled={isUploading}
              >
                <X className="h-2 w-2" />
              </button>
            </div>
          </div>
          
          {/* Preview for images */}
          {filePreview && selectedFile.type.includes('image') && (
            <div className="mt-1">
              <img
                src={filePreview}
                alt="PAN card preview"
                className="w-full h-12 object-cover rounded border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      <div className="mb-1 max-w-xs mx-auto">
        <div className="flex items-center justify-between text-[9px] text-gray-600 mb-0.5">
          <span>{selectedFile ? '1/1 file' : '0/1 file'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-0.5">
          <div 
            className="bg-primary-600 h-0.5 rounded-full transition-all duration-300"
            style={{ width: `${selectedFile ? 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end max-w-xs mx-auto">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
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

export default PanCardUpload; 