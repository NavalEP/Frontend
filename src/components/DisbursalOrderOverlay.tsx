import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { getDisburseDataByLoanId, DisbursementData } from '../services/loanApi';
import generateDisbursalOrderReceipt from './generateDisbursalOrderReceipt';

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
  gstOnCharges: string;
  paymentToMerchant: string;
  pfAmount: string;
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
  const [scale, setScale] = useState(0.8);
  const contentRef = useRef<HTMLDivElement>(null);

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
      financierName = 'Findoc: Finvest Private Limited';
    } else if (data.nbfcName && data.nbfcName.toLowerCase().includes('fibe')) {
      financierName = 'Fibe: Earlysalary Services Private Limited';
    }

    // Format payment plan as "10/2" format
    const paymentPlan = `${data.totalEmi}/${data.advanceEmi}`;

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
      gstOnCharges: formatCurrency(data.gstOnSubvention),
      paymentToMerchant: formatCurrency(data.disburseAmount),
      pfAmount: formatCurrency(data.processingFee),
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
        
        const result = await getDisburseDataByLoanId(loanId);
        
        if (result.success && result.data) {
          const mappedData = mapDisbursementDataToOrderData(result.data);
          setDisbursalOrderData(mappedData);
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

  // Handle responsive scaling for different screen sizes
  React.useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Calculate optimal scale based on screen size for better mobile experience
      if (width < 480) {
        // Small phones - scale based on height with minimal padding
        const availableHeight = height - 180; // Reduced space for header and button
        const scaleY = availableHeight / 700; // Reduced receipt height estimate
        setScale(Math.min(Math.max(scaleY, 0.6), 1.0)); // Min 60% scale, max 100%
      } else if (width < 768) {
        // Larger phones and small tablets
        const availableHeight = height - 160;
        const scaleY = availableHeight / 700;
        setScale(Math.min(Math.max(scaleY, 0.7), 1.0)); // Min 70% scale, max 100%
      } else if (width < 1024) {
        // Tablets and small laptops
        const availableHeight = height - 140;
        const scaleY = availableHeight / 700;
        setScale(Math.min(Math.max(scaleY, 0.8), 1.0)); // Min 80% scale, max 100%
      } else {
        // Desktop and large screens - full scale
        setScale(1.0);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);


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
        <div className="relative bg-white w-full max-w-[800px] rounded-t-3xl sm:rounded-lg shadow-xl transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 rounded-t-3xl sm:rounded-t-lg">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="font-semibold text-base">Disbursal Order</h3>
            </div>
          </div>
          
          {/* Loading Content */}
          <div className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Loading dots animation */}
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Loading Disbursal Order</h3>
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
        <div className="relative bg-white w-full max-w-[800px] rounded-t-3xl sm:rounded-lg shadow-xl transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 rounded-t-3xl sm:rounded-t-lg">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="font-semibold text-base">Disbursal Order</h3>
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
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-[800px] sm:max-h-[95vh] rounded-none sm:rounded-lg shadow-xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 rounded-none sm:rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-primary-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="font-semibold text-base">
                Disbursal Order - {disbursalOrderData.id}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-1">
          <div className="w-full h-full flex justify-center">
            <div 
              ref={contentRef}
              className="bg-white w-full max-w-full"
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
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
