import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, X } from 'lucide-react';
import Lottie from 'lottie-react';
import { getDisburseDataByLoanId, DisbursementData } from '../services/loanApi';
import generateDisbursalOrderReceipt from './generateDisbursalOrderReceipt';
import writingAnimation from '../animations/writing-on-paper.json';

// Custom CSS for success animation and slide-up
const loadingStyles = `
  @keyframes successPulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideUp {
    0% { 
      transform: translateY(100%);
    }
    100% { 
      transform: translateY(0);
    }
  }
  
  .success-animation {
    animation: successPulse 0.6s ease-in-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.95s ease-out;
  }
`;

interface DisbursalOrderData {
  id: string;
  patientName: string;
  disbursedOn: string;
  treatmentName: string;
  customerName: string;
  customerNumber: string;
  transactionAmount: string;
  paymentPlan: string;
  advanceAmount: string;
  platformCharges: string;
  platformChargesPercentage: number;
  gstOnCharges: string;
  paymentToMerchant: string;
  pfAmount: string;
  pfAmountPercentage: number;
  financierName: string;
  merchantName: string;
}

interface Props {
  loanId: string;
  onClose: () => void;
}

const DisbursalOrderOverlay: React.FC<Props> = ({ loanId, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disbursalOrderData, setDisbursalOrderData] = useState<DisbursalOrderData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSlideUp, setShowSlideUp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Inject custom styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = loadingStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Helper function to format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-IN');
  };

  // Helper function to map API response to DisbursalOrderData
  const mapDisbursementDataToOrderData = (data: DisbursementData): DisbursalOrderData => {
    // Check if the lender is Findoc and show the full company name
    let financierName = data.nbfcName;
    
    if (data.nbfcName && data.nbfcName.toLowerCase().includes('findoc')) {
      financierName = 'Findoc Finvest Private Limited';
    } else if (data.nbfcName && data.nbfcName.toLowerCase().includes('fibe')) {
      financierName = 'Fibe: Earlysalary Services Private Limited';
    }

    // Format payment plan as "10/2" format
    const paymentPlan = `${data.totalEmi}/${data.advanceEmi}`;

    // Calculate PF percentage based on treatment amount and processing fee
    const pfPercentage = data.treatmentAmount > 0 ? (data.processingFee / data.treatmentAmount) * 100 : 0;

    return {
      id: data.applicationId,
      patientName: data.patientName || data.firstName,
      disbursedOn: formatDate(data.disburseDate),
      treatmentName: data.loanReason,
      customerName: data.firstName,
      customerNumber: data.mobileNumber,
      transactionAmount: formatCurrency(data.treatmentAmount),
      paymentPlan: paymentPlan,
      advanceAmount: formatCurrency(data.advanceEmiAmount),
      platformCharges: formatCurrency(data.subventionExcludingGSt),
      platformChargesPercentage: data.subventionRate,
      gstOnCharges: formatCurrency(data.gstOnSubvention),
      paymentToMerchant: formatCurrency(data.disburseAmount),
      pfAmount: formatCurrency(data.processingFee),
      pfAmountPercentage: pfPercentage,
      financierName: financierName,
      merchantName: data.clinicName
    };
  };

  // Fetch disbursement data on component mount
  useEffect(() => {
    const fetchDisbursementData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);
        
        // Simulate progress updates over 2 seconds to reach 100%
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 100) return 100;
            return prev + (100 / 20); // Increment by 5% every 100ms for 2 seconds total
          });
        }, 100);
        
        const result = await getDisburseDataByLoanId(loanId);
        
        // Complete the progress to 100%
        setLoadingProgress(100);
        clearInterval(progressInterval);
        
        // Wait for 2 seconds total for the loading animation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        
        if (result.success && result.data) {
          const mappedData = mapDisbursementDataToOrderData(result.data);
          // Add a small delay to make the trace opening effect more visible
          await new Promise(resolve => setTimeout(resolve, 500));
          setDisbursalOrderData(mappedData);
          // Trigger slide-up animation
          setShowSlideUp(true);
        } else {
          setError(result.message || 'Failed to fetch disbursement data');
        }
      } catch (err: any) {
        console.error('Error fetching disbursement data:', err);
        setError(err.message || 'An error occurred while fetching disbursement data');
      } finally {
        setIsLoading(false);
      }
    };

    if (loanId) {
      fetchDisbursementData();
    }
  }, [loanId]);



  // Download as PDF function
  const downloadAsPDF = async () => {
    if (!disbursalOrderData) return;
    
    setIsDownloading(true);
    try {
      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = contentRef.current;
      if (!element) return;

      const opt = {
        margin: 0.5,
        filename: `disbursal-order-${disbursalOrderData.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'cm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error generating PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Bottom Sheet / Modal */}
        <div className="relative bg-white w-full max-w-[800px] rounded-t-3xl sm:rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 rounded-t-3xl sm:rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-base">Disbursal Order</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Loading Content */}
          <div className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Lottie Writing Animation */}
              <div className="w-72 h-48 flex items-center justify-center">
                <Lottie
                  animationData={writingAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Generating Disbursal Order</h3>
                <p className="text-sm text-gray-600">
                  {loadingProgress < 30 ? 'Fetching disbursement data...' :
                   loadingProgress < 60 ? 'Processing document details...' :
                   loadingProgress < 90 ? 'Finalizing disbursal order...' :
                   loadingProgress < 100 ? 'Almost ready...' :
                   'Disbursal Order Generated Successfully!'}
                </p>
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-center space-x-2">
                  <span>{Math.round(loadingProgress)}% complete</span>
                  {loadingProgress >= 100 && (
                    <div className="success-animation">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Progress indicator */}
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                    loadingProgress >= 100 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-primary-500 to-primary-600'
                  }`}
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  {loadingProgress >= 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Bottom Sheet / Modal */}
        <div className="relative bg-white w-full max-w-[800px] rounded-t-3xl sm:rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 rounded-t-3xl sm:rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-base">Disbursal Order</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Error Content */}
          <div className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-red-600">Error Loading Disbursal Order</h3>
              <p className="text-gray-600 text-center">{error}</p>
              <div className="flex space-x-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main content when data is loaded
  if (!disbursalOrderData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Bottom Sheet / Modal */}
      <div className={`relative bg-white w-full h-full sm:h-auto sm:max-w-[800px] sm:max-h-[95vh] rounded-none sm:rounded-lg shadow-xl flex flex-col ${showSlideUp ? 'animate-slideUp' : ''}`}>
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 rounded-none sm:rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-base">
                Disbursal Order - {disbursalOrderData.id}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-primary-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-1">
          <div className="w-full h-full flex justify-center">
            <div 
              ref={contentRef}
              className="bg-white w-full max-w-full"
              style={{ 
                width: '100%',
                minHeight: 'fit-content',
                maxHeight: '100%'
              }}
            >
              {generateDisbursalOrderReceipt(disbursalOrderData)}
            </div>
          </div>
        </div>

        {/* Bottom Download Button */}
        <div className="bg-white border-t border-gray-200 p-4 rounded-none sm:rounded-b-lg flex-shrink-0">
          <button
            onClick={downloadAsPDF}
            disabled={isDownloading}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Download D.O.</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisbursalOrderOverlay;
