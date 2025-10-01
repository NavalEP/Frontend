import React, { useState, useRef, useEffect } from 'react';
import { savePhotograph, checkAdvanceLiveliness, checkFaceMatch } from '../services/postApprovalApi';

interface FaceVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const FaceVerificationPopup: React.FC<FaceVerificationPopupProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess
}) => {
  const [step, setStep] = useState<'instructions' | 'camera' | 'preview' | 'verification'>('instructions');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('instructions');
      setCapturedImage(null);
      setError('');
      setVerificationResult(null);
      setCameraPermission(null);
      setIsCapturing(false);
    } else {
      // Clean up camera stream when closing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen]);

  // Add keyboard shortcut for capture (Space key)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (step === 'camera' && event.code === 'Space' && !loading) {
        event.preventDefault();
        console.log('Space key pressed for capture');
        capturePhoto();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, step, loading]);

  const handleProceedToCamera = async () => {
    setStep('camera');
    await requestCameraPermission();
  };

  const requestCameraPermission = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Requesting camera permission...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      // Try to get front camera first, fallback to any camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', // Front camera
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        console.log('Front camera accessed successfully');
      } catch (frontCameraError) {
        console.log('Front camera not available, trying any camera:', frontCameraError);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        console.log('Fallback camera accessed successfully');
      }
      
      console.log('Camera permission granted, stream:', stream);
      setCameraPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setLoading(false);
        };
        
        // Fallback timeout in case onloadedmetadata doesn't fire
        setTimeout(() => {
          console.log('Fallback timeout reached, setting loading to false');
          setLoading(false);
        }, 2000);
      } else {
        console.error('Video ref is null');
        setError('Video element not available');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setCameraPermission(false);
      
      let errorMessage = 'Camera permission is required to take a selfie. Please allow camera access and try again.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access was denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device. Please connect a camera and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera is not supported on this device or browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other camera apps and try again.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    console.log('=== CAPTURE PHOTO STARTED ===');
    console.log('Video ref exists:', !!videoRef.current);
    console.log('Canvas ref exists:', !!canvasRef.current);
    
    if (!videoRef.current) {
      console.error('Video ref is null');
      setError('Video not available');
      return;
    }
    
    if (!canvasRef.current) {
      console.error('Canvas ref is null');
      setError('Canvas not available');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('Video ready state:', video.readyState);
    console.log('Video paused:', video.paused);
    console.log('Video ended:', video.ended);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video has no dimensions');
      setError('Video not ready. Please wait a moment and try again.');
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Cannot get canvas context');
      setError('Canvas context not available');
      return;
    }
    
    console.log('All checks passed, starting capture...');
    
    // Set capturing state for visual feedback
    setIsCapturing(true);
    setLoading(true);
    
    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log('Image drawn to canvas successfully');
      
      // Convert canvas to base64 image
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image converted to base64, length:', imageDataUrl.length);
      console.log('Base64 preview:', imageDataUrl.substring(0, 50) + '...');
      
      if (imageDataUrl.length < 100) {
        throw new Error('Generated image is too small');
      }
      
      setCapturedImage(imageDataUrl);
      console.log('Captured image set in state');
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
        console.log('Camera stream stopped');
      }
      
      // Move to preview step after a brief delay for visual feedback
      setTimeout(() => {
        console.log('Moving to preview step');
        setStep('preview');
        setLoading(false);
        setIsCapturing(false);
      }, 500);
      
    } catch (captureError: any) {
      console.error('Error during photo capture:', captureError);
      setError(`Failed to capture photo: ${captureError.message || 'Unknown error'}`);
      setLoading(false);
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError('');
    setStep('camera');
    requestCameraPermission();
  };

  const submitPhoto = async () => {
    if (!capturedImage || !userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create FormData for API
      const formData = new FormData();
      // Remove the data:image/jpeg;base64, prefix from the base64 string
      const base64String = capturedImage.replace(/^data:image\/[a-z]+;base64,/, '');
      formData.append('imageString', base64String);
      formData.append('type', 'img');
      formData.append('userId', userId);
      
      // Save photograph
      const saveResult = await savePhotograph(formData);
      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Failed to save photograph');
      }
      
      // Check advance liveliness
      const livelinessResult = await checkAdvanceLiveliness(userId);
      if (!livelinessResult.success) {
        throw new Error(livelinessResult.message || 'Failed to check liveliness');
      }
      
      // Check face match
      const faceMatchResult = await checkFaceMatch(userId);
      if (!faceMatchResult.success) {
        throw new Error(faceMatchResult.message || 'Failed to check face match');
      }
      
      // Check verification conditions
      const livelinessScore = livelinessResult.data?.liveliness?.score || 0;
      const isLivelinessValid = livelinessResult.data?.liveliness?.liveliness === true && livelinessScore > 0.90;
      const isFaceMatchValid = faceMatchResult.data?.result?.verified === true;
      
      setVerificationResult({
        liveliness: livelinessResult.data,
        faceMatch: faceMatchResult.data,
        isLivelinessValid,
        isFaceMatchValid
      });
      
      if (isLivelinessValid && isFaceMatchValid) {
        // Verification successful
        setStep('verification');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        // Verification failed - show retake options
        setStep('preview');
        setError('Verification failed. Please ensure you are in a well-lit area, looking directly at the camera, and your face is clearly visible.');
      }
      
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selfie time!</h2>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="font-semibold text-gray-800 mb-3">Please note:</p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span>Be in a well-lit room.</span>
            <span>☀️</span>
          </li>
          <li className="flex items-center gap-2">
            <span>Have a plain background.</span>
            <span>⬜️</span>
          </li>
          <li className="flex items-center gap-2">
            <span>NO spectacles/glasses.</span>
            <span>🚫</span>
            <span>👓</span>
          </li>
          <li className="flex items-center gap-2">
            <span>NO other person or object in the frame.</span>
            <span>🚫</span>
            <span>👁️</span>
          </li>
          <li className="flex items-center gap-2">
            <span>Look straight with your eyes open.</span>
            <span>👁️</span>
            <span>👁️</span>
          </li>
          <li className="flex items-center gap-2">
            <span>DON'T cover your face with anything.</span>
            <span>🚫</span>
            <span>😷</span>
          </li>
        </ul>
      </div>
      
      <button
        onClick={handleProceedToCamera}
        className="w-full px-4 py-3 text-white font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-lg transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
          boxShadow: 'rgba(81, 76, 159, 0.3) 0px 4px 6px'
        }}
      >
        Okay, proceed to click picture
      </button>
      
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <button
            onClick={handleProceedToCamera}
            disabled={loading}
            className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2 hover:bg-purple-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title="Click to start camera"
          >
            {loading ? (
              <svg className="w-8 h-8 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <div className="w-20 h-1 bg-purple-200 rounded"></div>
          <p className="text-xs text-gray-500 mt-2">Or click the camera icon above</p>
        </div>
      </div>
    </div>
  );

  const renderCamera = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selfie time!</h2>
        <p className="text-gray-600">Position your face in the frame and click to capture</p>
      </div>
      
      
      
      {cameraPermission === false ? (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={requestCameraPermission}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-80 bg-gray-200 rounded-lg object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Flash effect overlay */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white opacity-80 animate-pulse pointer-events-none"></div>
          )}
          
          <div className="mt-4 text-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Capture button clicked!');
                capturePhoto();
              }}
              disabled={loading}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)'
                }}
              >
                {loading ? (
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </button>
            <p className="text-sm text-gray-600 mt-2">
              {loading ? 'Loading camera...' : 'Click to capture or press Space'}
            </p>
            
            {/* Alternative larger capture button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Large capture button clicked!');
                capturePhoto();
              }}
              disabled={loading}
              className="mt-4 w-full px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(81, 76, 159, 0.6)' : 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(61, 58, 122) 0%, rgb(41, 38, 82) 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(81, 76, 159) 0%, rgb(61, 58, 122) 100%)';
                }
              }}
            >
              {loading ? 'Capturing...' : '📸 Capture Photo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selfie time!</h2>
        <p className="text-gray-600">Review your photo</p>
      </div>
      
      <div className="relative">
        <img
          src={capturedImage || ''}
          alt="Captured selfie"
          className="w-full h-64 bg-gray-200 rounded-lg object-cover"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={retakePhoto}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retake
        </button>
        <button
          onClick={submitPhoto}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Submit
        </button>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful!</h2>
      <p className="text-gray-600">Your selfie has been verified successfully.</p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {step === 'instructions' && renderInstructions()}
          {step === 'camera' && renderCamera()}
          {step === 'preview' && renderPreview()}
          {step === 'verification' && renderVerification()}
        </div>
        
        {step !== 'verification' && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerificationPopup;
