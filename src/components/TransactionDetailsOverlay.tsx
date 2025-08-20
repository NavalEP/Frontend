import React, { useRef, useState } from 'react';
import { ArrowLeft, User, Phone, Share2, QrCode, Eye, FileText, Download, Check, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { uploadPrescription, getQrCode, getDisburseDetailForReport, getMatchingEmiPlans, BureauEmiPlan, getBureauDecisionData, BureauDecisionData, getUserLoanTimeline, TimelineItem } from '../services/loanApi';
import { useAuth } from '../context/AuthContext';

export interface EMIPlan {
  code: string;
  tenure: string;
  emiAmount: string;
  advanceEmis: number;
  processingFees?: string;
  advancePayment?: string;
  subvention?: string;
}

export interface Transaction {
  id: string;
  loanId: string; // Added loanId for bureau decision API
  userId: string; // Added userId
  amount: string;
  name: string;
  guardianName?: string;
  treatment: string;
  appliedAt: string;
  status: string;
  approved?: boolean;
  maxLimit?: string;
  utr?: string;
  disbursedAt?: string;
  rejectionReasons?: string[];
  selectedEmiPlan?: EMIPlan;
  availableEmiPlans?: EMIPlan[];
  lender?: string;
  onboardingUrl?: string;
  shareableLink?: string;
  patientPhoneNo?: number;
}

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetailsOverlay: React.FC<Props> = ({ transaction, onClose }) => {
  const { doctorId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<string[]>([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [dynamicEmiPlans, setDynamicEmiPlans] = useState<BureauEmiPlan[]>([]);
  const [emiPlansLoading, setEmiPlansLoading] = useState(false);
  const [hasMatchingProduct, setHasMatchingProduct] = useState(false);
  const [bureauDecisionData, setBureauDecisionData] = useState<BureauDecisionData | null>(null);
  const [assignedProductFailed, setAssignedProductFailed] = useState(false);

  // Handle share button click
  const handleShare = async () => {
    if (!transaction.shareableLink) {
      console.error('No shareable link available');
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Loan Application for ${transaction.name}`,
          text: `View loan application details for ${transaction.treatment}`,
          url: transaction.shareableLink
        });
      } else {
        // Fallback to clipboard copy if Web Share API is not available
        await navigator.clipboard.writeText(transaction.shareableLink);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard copy if sharing fails
      try {
        await navigator.clipboard.writeText(transaction.shareableLink);
        alert('Link copied to clipboard!');
      } catch (clipError) {
        console.error('Error copying to clipboard:', clipError);
        alert('Could not share or copy link. Please try again.');
      }
    }
  };

  // Handle treatment invoice upload
  const handlePrescriptionUpload = async (file: File) => {
    if (!transaction.userId) {
      setUploadError('User ID not found for this transaction');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadPrescription(file, transaction.userId);
      if (result.success && result.fileUrl) {
        setUploadedPrescriptions(prev => [...prev, result.fileUrl]);
        setUploadSuccess('Prescription uploaded successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error uploading treatment invoice:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload treatment invoice');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePrescriptionUpload(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Check if URL is an image
  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('type=img');
  };

  // Open file in new tab
  const openFileInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  // Download QR code to user's device
  const downloadQrCode = async (url: string) => {
    try {
      // Show loading state
      setQrLoading(true);
      
      // Fetch the QR code image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a safe filename
      const patientName = transaction.name ? transaction.name.replace(/[^a-zA-Z0-9]/g, '_') : 'patient';
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `qr-code-${patientName}-${timestamp}.png`;
      
      // Method 1: Try using the download attribute (works in most modern browsers)
      try {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        // Show success message
        setUploadSuccess('QR Code downloaded successfully!');
        setTimeout(() => setUploadSuccess(null), 3000);
        return;
      } catch (downloadError) {
        console.log('Download attribute method failed, trying alternative method');
      }
      
      // Method 2: For browsers that don't support download attribute well
      try {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = filename;
        link.style.display = 'none';
        
        // Trigger download with a small delay
        setTimeout(() => {
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        // Show success message
        setUploadSuccess('QR Code download started!');
        setTimeout(() => setUploadSuccess(null), 3000);
        return;
      } catch (downloadError2) {
        console.log('Alternative download method failed');
      }
      
      // Method 3: Fallback - open in new tab for manual download
      window.open(url, '_blank');
      setUploadSuccess('QR Code opened in new tab. Right-click and save to download.');
      setTimeout(() => setUploadSuccess(null), 5000);
      
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setUploadError('Failed to download QR code. Opening in new tab instead.');
      setTimeout(() => setUploadError(null), 3000);
      
      // Final fallback - open in new tab
      window.open(url, '_blank');
    } finally {
      setQrLoading(false);
    }
  };

  // Handle QR code button click
  const handleQrCodeClick = async () => {
    if (!doctorId) {
      console.error('Doctor ID not found');
      return;
    }

    if (showQrCode && qrCodeUrl) {
      setShowQrCode(false);
      return;
    }

    setQrLoading(true);
    try {
      const result = await getQrCode(doctorId);
      if (result.success && result.qrCodeUrl) {
        setQrCodeUrl(result.qrCodeUrl);
        setShowQrCode(true);
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
    } finally {
      setQrLoading(false);
    }
  };

  // Handle timeline button click
  const handleTimelineClick = async () => {
    if (!transaction.loanId) {
      console.error('Loan ID not found');
      return;
    }

    if (showTimeline) {
      setShowTimeline(false);
      return;
    }

    setTimelineLoading(true);
    try {
      // Use new getUserLoanTimeline with fallback mechanism
      const timeline = await getUserLoanTimeline(transaction.loanId, transaction.userId);
      setTimelineData(timeline);
      setShowTimeline(true);
    } catch (error) {
      console.error('Error getting timeline:', error);
      // Show error message to user
      setUploadError('Failed to load timeline data. Please try again.');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Format timestamp - now handles both string dates and timestamps
  const formatTimestamp = (dateInput: string | number) => {
    if (typeof dateInput === 'string') {
      // Already formatted string from getUserLoanStatus
      return dateInput;
    }
    
    // Legacy timestamp format from activitiesLog
    const date = new Date(dateInput);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get activity type color
  const getActivityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'loan_status':
        return 'bg-indigo-100 text-indigo-800';
      case 'onboarding':
        return 'bg-blue-100 text-blue-800';
      case 'cashfree':
      case 'findoc':
        return 'bg-green-100 text-green-800';
      case 'sure_pass':
        return 'bg-purple-100 text-purple-800';
      case 'bureau decision':
        return 'bg-orange-100 text-orange-800';
      case 'loan_activity':
        return 'bg-teal-100 text-teal-800';
      case 'payment':
        return 'bg-emerald-100 text-emerald-800';
      case 'verification':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle disbursal report download
  const handleDownloadReport = async () => {
    if (!transaction.userId) {
      console.error('User ID not found');
      return;
    }

    setIsDownloadingReport(true);
    try {
      await getDisburseDetailForReport(transaction.userId);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download disbursal report. Please try again.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // Check if transaction is disbursed
  const isDisbursed = transaction.disbursedAt || transaction.status.toLowerCase().includes('disbursed');

  // Load dynamic EMI plans and bureau decision data on component mount
  React.useEffect(() => {
    const loadEmiPlans = async () => {
      if (!transaction.userId || !transaction.loanId) return;
      
      setEmiPlansLoading(true);
      try {
        // Get both EMI plans and bureau decision data
        const [result, decisionData] = await Promise.all([
          getMatchingEmiPlans(transaction.userId, transaction.loanId),
          getBureauDecisionData(transaction.loanId)
        ]);
        
        setDynamicEmiPlans(result.plans);
        setHasMatchingProduct(result.hasMatchingProduct);
        setAssignedProductFailed(result.assignedProductFailed);
        setBureauDecisionData(decisionData);
      } catch (error) {
        console.error('Error loading EMI plans:', error);
      } finally {
        setEmiPlansLoading(false);
      }
    };

    loadEmiPlans();
  }, [transaction.userId, transaction.loanId]);

  return (
    <div className="absolute inset-0 z-30 bg-white overflow-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 flex items-center space-x-3">
          <button onClick={onClose} className="p-1 hover:bg-primary-700 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="font-semibold text-base">Application Details</h3>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 max-w-lg mx-auto">
          {/* Basic Info */}
          <div className="w-full text-left space-y-2 border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:bg-gray-50 transition-colors">
            {/* Patient Name */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#EEF2FF] rounded-full">
                <User className="h-5 w-5 text-[#4F46E5]" />
              </div>
              <div className="text-gray-900 font-medium">{transaction.name}</div>
            </div>

            {/* Guardian name if available */}
            {transaction.guardianName && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#EEF2FF] rounded-full">
                  <User className="h-5 w-5 text-[#4F46E5]" />
                </div>
                <div className="text-gray-900">{transaction.guardianName}</div>
              </div>
            )}

            {/* Amount */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#EEF2FF] rounded-full">
                <span className="h-5 w-5 inline-flex items-center justify-center text-[#4F46E5]">₹</span>
              </div>
              <div className="text-gray-900">{transaction.amount}</div>
            </div>

            {/* Treatment */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#EEF2FF] rounded-full">
                <svg 
                  className="h-5 w-5 text-[#4F46E5]" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M9.5 12.5L11 14l4-4"/>
                  <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1"/>
                  <path d="M3 12c-.552 0-1-.448-1-1s.448-1 1-1"/>
                  <path d="M12 21c0 .552-.448 1-1 1s-1-.448-1-1"/>
                  <path d="M12 3c0-.552-.448-1 1-1s1 .448 1 1"/>
                  <path d="M19.071 19.071c.39.39 1.024.39 1.414 0s.39-1.024 0-1.414"/>
                  <path d="M4.929 4.929c-.39-.39-1.024-.39-1.414 0s-.39 1.024 0 1.414"/>
                  <path d="M4.929 19.071c-.39.39-.39 1.024 0 1.414s1.024.39 1.414 0"/>
                  <path d="M19.071 4.929c.39-.39.39-1.024 0-1.414s-1.024-.39-1.414 0"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6"/>
                  <path d="M1 12h6m6 0h6"/>
                </svg>
              </div>
              <div className="text-gray-900">{transaction.treatment}</div>
            </div>

            {/* Applied Date */}
            <div className="text-sm text-gray-600">Applied at {transaction.appliedAt}</div>

            {/* UTR Number */}
            {transaction.utr && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#EEF2FF] rounded-full">
                  <svg 
                    className="h-5 w-5 text-[#4F46E5]" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <path d="M6 7h12"/>
                    <path d="M6 11h8"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">UTR Number:</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-900 font-medium">{transaction.utr}</div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(transaction.utr || '');
                          // Could add a toast notification here
                          console.log('UTR copied to clipboard');
                        } catch (error) {
                          console.error('Failed to copy UTR:', error);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy UTR Number"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="text-sm text-gray-600 mb-1">Status:</div>
              <div className="space-y-2">
                <div className="bg-[#EFF6FF] text-[#2563EB] py-2 px-3 rounded-md inline-block text-sm">
                  {transaction.status}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Share Controls */}
          <div className="flex items-center space-x-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => transaction.patientPhoneNo && window.open(`tel:+91${transaction.patientPhoneNo}`, '_self')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={!transaction.patientPhoneNo}
              >
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
            </div>
                         <button 
               onClick={() => transaction.patientPhoneNo && window.open(`https://wa.me/91${transaction.patientPhoneNo}`, '_blank')}
               className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
               disabled={!transaction.patientPhoneNo}
             >
               <svg 
                 className="h-5 w-5 text-green-600" 
                 viewBox="0 0 24 24" 
                 fill="currentColor"
               >
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
               </svg>
             </button>
              <button 
                onClick={handleShare}
                className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-lg text-center font-medium hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Share2 className="h-5 w-5" /><span>Share application link</span>
              </button>
                         <button 
               onClick={handleQrCodeClick}
               className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
               disabled={qrLoading}
             >
               {qrLoading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
               ) : (
                 <QrCode className="h-5 w-5 text-gray-600" />
               )}
             </button>
          </div>

          {/* QR Code Display */}
          {showQrCode && qrCodeUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-900">Doctor QR Code</h4>
                <button
                  onClick={() => setShowQrCode(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="Doctor QR Code"
                  className="w-48 h-48 object-contain border border-gray-200 rounded-lg bg-white"
                  onError={(e) => {
                    console.error('Failed to load QR code image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="mt-3 text-center">
                <button
                  onClick={() => downloadQrCode(qrCodeUrl)}
                  disabled={qrLoading}
                  className={`text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center space-x-2 ${
                    qrLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {qrLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download QR Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status-specific sections */}
          {/* Show max treatment limit from bureau decision if approved and grossTreatmentAmount exists */}
          {bureauDecisionData && 
           bureauDecisionData.finalDecision.toLowerCase() === 'approved' && 
           dynamicEmiPlans.length > 0 && 
           dynamicEmiPlans[0]?.grossTreatmentAmount && (
            <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between border border-gray-200 shadow-sm">
              <span className="text-gray-800">Max treatment limit:</span>
              <span className="font-medium text-green-800">₹ {Math.round(dynamicEmiPlans[0].grossTreatmentAmount).toLocaleString()}</span>
            </div>
          )}
          
          {/* Fallback to static max limit if no bureau decision data */}
          {(!bureauDecisionData || bureauDecisionData.finalDecision.toLowerCase() !== 'approved') && transaction.maxLimit && (
            <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between border border-gray-200 shadow-sm">
              <span className="text-gray-800">Max treatment limit:</span>
              <span className="font-medium text-green-800">₹ {transaction.maxLimit}</span>
            </div>
          )}

          {/* Status Banners */}
          {transaction.disbursedAt && (
            <div className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-200 shadow-sm">
              <Check className="h-4 w-4" />
              <span>Disbursed at {transaction.disbursedAt}</span>
            </div>
          )}

          {/* Show Approved banner from bureau decision */}
          {bureauDecisionData && bureauDecisionData.finalDecision.toLowerCase() === 'approved' && !transaction.disbursedAt && (
            <div className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-200 shadow-sm">
              <Check className="h-4 w-4" />
              <span>Approved</span>
            </div>
          )}

          {/* Fallback approved banner */}
          {(!bureauDecisionData || bureauDecisionData.finalDecision.toLowerCase() !== 'approved') && transaction.approved && !transaction.disbursedAt && (
            <div className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-200 shadow-sm">
              <Check className="h-4 w-4" />
              <span>Approved</span>
            </div>
          )}

          {/* Show rejection from bureau decision API */}
          {bureauDecisionData && bureauDecisionData.finalDecision.toLowerCase() === 'rejected' && bureauDecisionData.rejectionReasons && bureauDecisionData.rejectionReasons.length > 0 && (
            <>
              <div className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-200 shadow-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Rejected</span>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-medium mb-2">Reasons of rejection:</h4>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {bureauDecisionData.rejectionReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Fallback to static rejection reasons */}
          {(!bureauDecisionData || bureauDecisionData.finalDecision.toLowerCase() !== 'rejected' || !bureauDecisionData.rejectionReasons?.length) && transaction.rejectionReasons && (
            <>
              <div className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-200 shadow-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Rejected</span>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-medium mb-2">Reasons of rejection:</h4>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {transaction.rejectionReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <button 
            onClick={handleTimelineClick}
            className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              timelineLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            disabled={timelineLoading}
          >
            <Eye className="h-5 w-5" />
            <span>{timelineLoading ? 'Loading timeline...' : showTimeline ? 'Hide timeline' : 'View timeline'}</span>
          </button>

          {showTimeline && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900">Activity Timeline</h4>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {timelineData.length > 0 ? (
                <div className="space-y-4">
                  {timelineData.map((item, index) => (
                    <div key={item.id || index} className="flex items-start space-x-3">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                        {index < timelineData.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                        )}
                      </div>
                      
                      {/* Activity content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="text-sm font-medium text-gray-900">{item.status}</h5>
                          {item.type && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getActivityTypeColor(item.type)}`}>
                              {item.type}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">
                          {formatTimestamp(item.addedOn)}
                        </p>
                        
                        {item.addedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added by: {item.addedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No timeline activities found</p>
                </div>
              )}
            </div>
          )}

          {/* Dynamic EMI Plans from API */}
          {dynamicEmiPlans.length > 0 && hasMatchingProduct && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              {assignedProductFailed ? (
                /* Simplified view when assigned product API fails but decision is approved */
                <>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Available EMI plans</h4>
                  {emiPlansLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dynamicEmiPlans.map((plan, index) => (
                        <div key={plan.productDetailsDO.id}>
                          {/* Plan Header */}
                          <div className="text-indigo-600 font-semibold text-lg mb-2">
                            {plan.productDetailsDO.productName}
                          </div>
                          
                          {/* Simplified Plan Summary */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-900">Pay over {plan.productDetailsDO.totalEmi - plan.productDetailsDO.advanceEmi} months</span>
                            <span className="text-gray-900 font-medium">{plan.productDetailsDO.advanceEmi} Advance EMIs</span>
                          </div>

                          {/* EMI Amount Only */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-900">EMI amount</span>
                            <span className="text-gray-900 font-medium">Rs. {plan.emi.toLocaleString()}</span>
                          </div>

                          {/* Separator line */}
                          {index < dynamicEmiPlans.length - 1 && (
                            <hr className="border-gray-200 my-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Detailed view when assigned product API works */
                <>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Selected EMI plan details</h4>
                  {emiPlansLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dynamicEmiPlans.map((plan, index) => (
                        <div key={plan.productDetailsDO.id}>
                          {/* Plan Header */}
                          <div className="text-indigo-600 font-semibold text-lg mb-4">
                            {plan.productDetailsDO.productName}
                          </div>
                          
                          {/* Detailed Plan Information */}
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Effective tenure</span>
                              <span className="text-gray-900">{plan.productDetailsDO.totalEmi - plan.productDetailsDO.advanceEmi} months</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">EMI amount</span>
                              <span className="text-gray-900">₹ {plan.emi.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing fees</span>
                              <span className="text-gray-900">₹ {Math.round(plan.grossTreatmentAmount * plan.productDetailsDO.processingFesIncludingGSTRate / 100).toLocaleString()} ({plan.productDetailsDO.processingFesIncludingGSTRate}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Advance payment</span>
                              <span className="text-gray-900">₹ {plan.downPayment.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subvention</span>
                              <span className="text-gray-900">{plan.productDetailsDO.subventionRate}% (₹{Math.round(plan.grossTreatmentAmount * plan.productDetailsDO.subventionRate / 100).toLocaleString()})</span>
                            </div>
                          </div>

                          {/* Advance Payment Notice */}
                          {plan.downPayment > 0 && (
                            <div className="mt-4 bg-indigo-50 p-4 rounded-lg text-indigo-700">
                              You must collect ₹ {plan.downPayment.toLocaleString()} as advance EMI payment from the patient.
                            </div>
                          )}

                          {/* Separator for multiple plans */}
                          {index < dynamicEmiPlans.length - 1 && (
                            <hr className="border-gray-200 my-6" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Fallback to static EMI Plans if no dynamic plans */}
          {dynamicEmiPlans.length === 0 && !emiPlansLoading && transaction.selectedEmiPlan && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Selected EMI plan details</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-indigo-600 font-semibold">{transaction.selectedEmiPlan.code}</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective tenure</span>
                      <span className="text-gray-900">{transaction.selectedEmiPlan.tenure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EMI amount</span>
                      <span className="text-gray-900">₹ {transaction.selectedEmiPlan.emiAmount}</span>
                    </div>
                    {transaction.selectedEmiPlan.processingFees && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing fees</span>
                        <span className="text-gray-900">{transaction.selectedEmiPlan.processingFees}</span>
                      </div>
                    )}
                    {transaction.selectedEmiPlan.advancePayment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Advance payment</span>
                        <span className="text-gray-900">₹ {transaction.selectedEmiPlan.advancePayment}</span>
                      </div>
                    )}
                    {transaction.selectedEmiPlan.subvention && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subvention</span>
                        <span className="text-gray-900">{transaction.selectedEmiPlan.subvention}</span>
                      </div>
                    )}
                  </div>
                </div>
                {transaction.selectedEmiPlan.advancePayment && (
                  <div className="bg-indigo-50 p-4 rounded-lg text-indigo-700">
                    You must collect ₹ {transaction.selectedEmiPlan.advancePayment} as advance EMI payment from the patient.
                  </div>
                )}
              </div>
            </div>
          )}

          {dynamicEmiPlans.length === 0 && !emiPlansLoading && transaction.availableEmiPlans && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Available EMI plans</h4>
              <div className="space-y-4">
                {transaction.availableEmiPlans.map((plan, index) => (
                  <div key={index} className="border-t border-gray-200 pt-4">
                    <div className="text-indigo-600 font-semibold">{plan.code}</div>
                    <div className="mt-1 text-sm text-gray-500">Pay over {plan.tenure}</div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-gray-900 font-medium">{plan.advanceEmis} Advance EMIs</span>
                      <span className="text-gray-900">Rs. {plan.emiAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lender Info */}
          {transaction.lender && (
            <div className="mt-6 flex items-start space-x-2 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
              <User className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Lender:</p>
                <p className="text-sm font-medium text-gray-900">{transaction.lender}</p>
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="mt-6 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Documents</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Treatment Invoice</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="px-3 py-1 bg-white border border-gray-200 text-primary-600 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : '+ Add'}
                </button>
              </div>
              {uploadError && (
                <div className="text-sm text-red-600 mt-1">{uploadError}</div>
              )}
              {uploadSuccess && (
                <div className="text-sm text-green-600 mt-1">{uploadSuccess}</div>
              )}
              
              {/* Display uploaded treatment invoices */}
              {uploadedPrescriptions.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Uploaded Treatment Invoices:</h5>
                  {uploadedPrescriptions.map((url, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Treatment Invoice{index + 1}</span>
                        <button
                          onClick={() => openFileInNewTab(url)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open</span>
                        </button>
                      </div>
                      {isImageUrl(url) ? (
                        <div className="mt-2">
                          <img
                            src={url}
                            alt={`Prescription ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              // If image fails to load, show a placeholder
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-32 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center">
                            <div className="text-center text-gray-500">
                              <FileText className="h-8 w-8 mx-auto mb-2" />
                              <span className="text-sm">Preview not available</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Document Preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={`flex items-center justify-between ${!isDisbursed ? 'opacity-50' : ''}`}>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <FileText className={`h-5 w-5 ${isDisbursed ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={isDisbursed ? 'text-gray-900 font-medium' : 'text-gray-400'}>Disbursal Order</span>
                </div>
                <button 
                  onClick={isDisbursed ? handleDownloadReport : undefined}
                  disabled={!isDisbursed || isDownloadingReport}
                  className={`p-2 rounded-lg transition-colors ${
                    isDisbursed 
                      ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                      : 'bg-gray-100 cursor-not-allowed'
                  }`}
                  title={isDisbursed ? 'Download Disbursal Report' : 'Available after disbursal'}
                >
                  {isDownloadingReport ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Download className={`h-5 w-5 ${isDisbursed ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
            <p className="text-sm text-gray-700 mb-2">
              Need help? reach out to us.<br/>
              Contact your dedicated CarePay executive.
            </p>
            <button 
              onClick={() => window.open('tel:+919958222139', '_self')}
              className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors w-full text-left"
            >
              <div className="p-2 bg-gray-100 rounded-full">
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <span className="text-gray-900 font-medium block">Mr. Abhishek Kashyap</span>
                <span className="text-gray-600 text-sm">+91 99582 22139</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsOverlay;