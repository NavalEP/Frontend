import React, { useRef, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';

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
  disbursalOrderData: DisbursalOrderData;
  onClose: () => void;
}

const DisbursalOrderOverlay: React.FC<Props> = ({ disbursalOrderData, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(0.8);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle responsive scaling for different screen sizes
  React.useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      
      // Calculate optimal scale based on screen size
      if (width < 480) {
        // iPhone and small phones - make it fit width with some padding
        // Use 90% of screen width, but cap at reasonable minimum/maximum
        const calculatedScale = width * 0.9 / 794; // 794px is 21cm in pixels at 96dpi
        setScale(Math.max(0.3, Math.min(calculatedScale, 0.5))); // Min 0.3, Max 0.5 for small screens
      } else if (width < 768) {
        // Larger phones and small tablets
        const calculatedScale = width * 0.85 / 794;
        setScale(Math.max(0.4, Math.min(calculatedScale, 0.65))); // Min 0.4, Max 0.65
      } else if (width < 1024) {
        // Tablets and small laptops
        const calculatedScale = width * 0.8 / 794;
        setScale(Math.max(0.5, Math.min(calculatedScale, 0.75))); // Min 0.5, Max 0.75
      } else {
        // Desktop and large screens
        setScale(0.8);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Generate the HTML content for the disbursal order
  const generateDisbursalOrderHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Disbursal Order</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'DM Sans', sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
            display: flex;
            justify-content: center;
          }
          .container {
            width: 21cm;
            height: 29cm;
            border: 1px solid #ccc;
            box-sizing: border-box;
            background: #fffbf9;
          }
          .header {
            background: #4A3FA5;
            color: #fff;
            padding: 1cm;
            display: flex;
            flex-direction: column;
          }
          .logo {
            width: 100px;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 0.3cm;
          }
          .title {
            font-size: 32px;
            font-weight: bold;
          }
          .order-id {
            font-size: 16px;
            font-weight: 500;
          }
          .to-section {
            background: #FFA873;
            padding: 0.5cm 1cm;
            font-weight: 500;
            font-size: 16px;
          }
          .patient-section {
            padding: 1cm;
          }
          .patient-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1cm;
          }
          .patient-info {
            display: flex;
            flex-direction: column;
            align-items: end;
          }
          .label {
            font-size: 16px;
            color: #555;
          }
          .value {
            font-size: 24px;
            font-weight: 500;
          }
          .section-header {
            background: linear-gradient(to right, #fffbf9, #f1edff, #fffbf9);
            padding: 0.5cm 1cm;
            font-weight: 600;
            font-size: 24px;
            text-align: center;
          }
          .section-content {
            padding: 0.8cm 1cm;
            font-size: 16px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.4cm;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .bold {
            font-weight: bold;
          }
          .footer {
            background: #ffe9db;
            text-align: center;
            padding: 0.32cm;
            font-weight: 600;
            font-size: 16px;
            border-bottom: #ffb47d 15px solid;
          }
          .footer-amount {
            font-size: 24px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <img src="images/Carepay full white logo.png" class="logo" alt="CarePay Logo">
            <div class="header-content">
              <div class="title">Disbursal Order</div>
              <div class="order-id">ID: ${disbursalOrderData.id}</div>
            </div>
          </div>

          <!-- To Section -->
          <div class="to-section">
            To – ${disbursalOrderData.merchantName}
          </div>

          <!-- Patient Section -->
          <div class="patient-section">
            <div class="patient-header">
              <div>
                <div class="label">Patient name</div>
                <div class="value">${disbursalOrderData.patientName}</div>
              </div>
              <div class="patient-info">
                <div class="label">Disbursed on</div>
                <div class="value">${disbursalOrderData.disbursedOn}</div>
              </div>
            </div>

            <div>
              <div class="label">Treatment name</div>
              <div class="value">${disbursalOrderData.treatmentName}</div>
            </div>
          </div>

          <!-- Customer Details -->
          <div class="section-header">Customer details</div>
          <div class="section-content">
            <div class="detail-row">
              <div>Customer name</div>
              <div>${disbursalOrderData.customerName}</div>
            </div>
            <div class="detail-row">
              <div>Customer number</div>
              <div>${disbursalOrderData.customerNumber}</div>
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="section-header">Transaction details</div>
          <div class="section-content">
            <div class="detail-row">
              <div class="bold">Transaction amount</div>
              <div class="bold">Rs. ${disbursalOrderData.transactionAmount}</div>
            </div>
            <div class="detail-row">
              <div>Payment plan</div>
              <div>${disbursalOrderData.paymentPlan}</div>
            </div>
            <div class="detail-row">
              <div class="bold">Advance amount to be collected</div>
              <div class="bold">Rs. ${disbursalOrderData.advanceAmount}</div>
            </div>
            <div class="detail-row">
              <div>Platform charges to merchant</div>
              <div>Rs. ${disbursalOrderData.platformCharges}</div>
            </div>
            <div class="detail-row">
              <div>GST on platform charges</div>
              <div>Rs. ${disbursalOrderData.gstOnCharges}</div>
            </div>
            <div class="detail-row">
              <div>Payment to merchant</div>
              <div>Rs. ${disbursalOrderData.paymentToMerchant}</div>
            </div>
            <div class="detail-row">
              <div>PF amount</div>
              <div>Rs. ${disbursalOrderData.pfAmount}</div>
            </div>
            <div class="detail-row">
              <div>Financier name</div>
              <div>${disbursalOrderData.financierName}</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            Payment to the merchant after platform charges settlement<br>
            <span class="footer-amount">Rs. ${disbursalOrderData.paymentToMerchant}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download as PDF function
  const downloadAsPDF = async () => {
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
      // Fallback: open in new window for manual print
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(generateDisbursalOrderHTML());
        newWindow.document.close();
        newWindow.print();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-primary-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <h3 className="font-semibold text-sm sm:text-base truncate">
              Disbursal Order - {disbursalOrderData.id}
            </h3>
          </div>
          <button
            onClick={downloadAsPDF}
            disabled={isDownloading}
            className="flex items-center space-x-1 sm:space-x-2 bg-white text-primary-600 px-2 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary-600"></div>
                <span className="hidden sm:inline">Generating PDF...</span>
                <span className="sm:hidden">PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(95vh-80px)] bg-gray-50">
          <div className="flex justify-center p-2 sm:p-4">
            <div 
              ref={contentRef}
              className="bg-white shadow-lg"
              style={{ 
                width: '21cm', 
                minHeight: '29cm',
                transform: `scale(${scale})`,
                transformOrigin: 'top center'
              }}
              dangerouslySetInnerHTML={{ __html: generateDisbursalOrderHTML() }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisbursalOrderOverlay;
