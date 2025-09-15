import React, { useRef, useState } from 'react';
import { ArrowLeft, User, Phone, Share2, QrCode, Eye, FileText, Check, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { uploadPrescription, getQrCode, getMatchingEmiPlans, BureauEmiPlan, getBureauDecisionData, BureauDecisionData, LoanDetailsByUserId, getLoanStatusWithUserStatus, LoanStatusWithUserStatusItem } from '../services/loanApi';
import { getMerchantScore, MerchantScoreResponse, isDODownloadAllowed } from '../services/oculonApi';
import { useAuth } from '../context/AuthContext';
import DisbursalOrderOverlay from './DisbursalOrderOverlay';

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
  applicationId?: string;
  clinicName?: string;
  doctorName?: string;
  employmentType?: string;
}

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetailsOverlay: React.FC<Props> = ({ transaction, onClose }) => {
  const { doctorId, doctorCode } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<string[]>([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loanStatusData, setLoanStatusData] = useState<LoanStatusWithUserStatusItem[]>([]);
  const [dynamicEmiPlans, setDynamicEmiPlans] = useState<BureauEmiPlan[]>([]);
  const [emiPlansLoading, setEmiPlansLoading] = useState(false);
  const [hasMatchingProduct, setHasMatchingProduct] = useState(false);
  const [bureauDecisionData, setBureauDecisionData] = useState<BureauDecisionData | null>(null);
  const [assignedProductFailed, setAssignedProductFailed] = useState(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetailsByUserId | null>(null);
  const [hasAllowedStatusInAPI, setHasAllowedStatusInAPI] = useState(false);
  const [merchantScore, setMerchantScore] = useState<MerchantScoreResponse | null>(null);
  const [showDisbursalOrder, setShowDisbursalOrder] = useState(false);

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
      // Use the new getLoanStatusWithUserStatus API for timeline view
      const loanStatusResponse = await getLoanStatusWithUserStatus(transaction.loanId);
      setLoanStatusData(loanStatusResponse);
      setShowTimeline(true);
    } catch (error) {
      console.error('Error getting loan status with user status:', error);
      // Show error message to user
      setUploadError('Failed to load timeline data. Please try again.');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Format timestamp for loan status with user status (number timestamp)
  const formatLoanStatusTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


  // Check if disbursal order download should be enabled
  const shouldEnableDisbursalDownload = () => {
    // First check if we have merchant score data and risk category is A
    if (merchantScore && isDODownloadAllowed(merchantScore.risk_category)) {
      return true;
    }

    // Fallback to original logic if no merchant score or risk category is not A
    // List of allowed doctor IDs
    const allowedDoctorIds = [
      'GzLlAP6dLcbGNngTmDN2lgyywkriAdn7',
      'T1jw40mTogGdr8hfZbd47LsUIdE7i419',
      'BHGfbTyKJs4w6P7jZZg9FJMEdke3LndK',
      'RogOtaHPoAR9lHcbgMqkauX6Y5TiujhG',
      'yOEpP8BYG2ERlY9Y2Z9ok5vSGDGGQliO',
      'KguSkoqnriQB3Qw69zuOA9aAw1as2vkZ',
      'xNDc7AmTNyRhR2CTHMf7uRkyyV9O0Gsj',
      'eFGsiLAE8ih8zGWyPgPbq9r4imqMW80v',
      'IWJVviiHikxYrxg6EiHfx4RJz5ddj8MJ',
      'ctjrhSc974E4BjOJDk2IZyMcAsncvbxu',
      '44G3WX8m3VgRGiJz8PxqhrCZlGbteasP',
      '2PiODfTzd01pEhMg6hAf4xpG01dliOKS',
      'zVw2IxuyEIXy2GihbtzJ10GiyryIfyrt',
      'DtEvgOtKGzxNaXp049v92Lq1pxcoru9d',
      'rFagSyBvIbv0Y0w2QzVFI1nWayKEgEaB',
      'JgbmNkHAdbjlJVVDZQX14OxrzMl3FyQz',
      'abb3czSXTpygexSig2I4hUVqs9OpVS88',
      'Vu54LJPSe7TBcoKe3GURcwCYQ57iAypn',
      'HwlltwB58q2PRwsdPLJWwj4miC1rM3AL',
      'QjBTIznkW9ZoRCer9ATMCwt8xMZyIJsr',
      'IijQzbFgHCN5p4yvoa6wrxKre0usqPd4',
      'naLQosGmz99MCklQjHw1IunScIelLjmK',
      'z8lKEy4dycso9HphnpQ1ngNeF2ZkEbJe',
      'MbYnVmD6usiZ54cSFCdJgGPHSusjF1Sq',
      'GYTKifGGgwPg56K3UXIz6Uwe15rYDGB4',
      'OzDnT9hbklCdLDRPHXT6zg0ga1i9PoOF',
      'uFgVGUVulyI9hkAy6RGeY2rAP3Cg5YDP',
      'X2S4ARvNekXFgwVElCwWGJ0uoK9nhjGz',
      'K9kBKEllkgwmVoMJ1eGLfEPb35RYhbGb',
      'u0cR7gGsUFGkpi0X0hTWunOqPiDrKfk7',
      'C17jhphOT1V9tuFAYFdB1Svq23EBtii9',
      'IS7ow7k1QGdZlWbSuLbjRBV5JGwtUMEY',
      'OQtH9pAe9YwhQyP7FB6Ku3peLXknQAnR',
      '7NIh2BLssgH6Mp0YEuFNUmJqFNaeu1dz',
      'PEMmqteyzxsiyzD0jKXHakgP7sI7H3ME',
      'qHy88SNWf0JC7Sm03OmC2BBhtPf3rRTP',
      'YhzQAzXisKaaU5ZpMu6kU4fNL7L6EG6O',
      'SO4lJhhBWuX3weWzjuGg6CG0AAqE8Cyb',
      'HN9uA5ZqPCUj6qUdNgWK98DQCRf1O60C',
      'mmkapQTtF6Icguvyx34vCwAd731ameJp',
      'zRhl4gAjEDxumkfz44Tm2nuPLuqTQJM9',
      'sSMtsHKr6WKeI0LqkaFgXxWbUAzZKLdC',
      'xfV7vHPz606GgchXoFNzA7hzKUCWemrb',
      'MDIJ6sZ7AAPtwChy5e2umzcfYxEEFOL5',
      '78JXoFaZwIs3Fzsh1hKRUmwPEGXvmvTe',
      'Y77RyCxHosnkREZ9YvF8fsbVkxmKxSMa',
      'owOAmv8uQz4I1uWLsHEBdow9kmZXGLMh',
      'Xe9enZHZLqcduHZalKOXerM3nS7UWNTg',
      'mJoYj5WWtZsSqWnS2VVY84ULsTlBWhnP',
      '22Wst6Qd056uWn7iDt1xoBzyW30BK9EG',
      'XKpmF8h8CK6vUfseFpbSGfoDQ4ozcbeI',
      '3Kcmex2Vh0tgHNBMFtN8odxvuYn7kCcv',
      'iBd9pLMDnsPosrDrkxMTGeoboRVK9SJ2',
      'CyQSNtGYp38rk6LpL8kwCbGXgATnEvWA',
      'JMdMjOPLV2IXeLL035C7F9FgrXLG7xU5',
      'eHGZ0Zgmr2KwDDGjVP65lsGPq6E1vZ8o',
      '7IxI8b7sF5AfKYLL1tG1ajY7N1qslxWd',
      'k54zguT03QHvQFKYVswvSnAResa7BEyV',
      'Q6GeBmk0mfHMXNfxUkLwQKKaV7PD5MWP',
      'OKSIiLssujbkWO4LBrM60gT0I7v08juD',
      'G9a1Ce3uKaYrLDPfRfLJ9PaX150icN94',
      'a9rmuI1tIoBC24T3RUOyKFdc2NrglwQF',
      'oolJoO9ohsNUHJf0AKHbA7fDRpAZ9Ccu',
      'F2HzLtUg26bkTulJysdd8dJceRqUsrGZ',
      's2I9e8ycKZtpKI2bFVjP7SIXMT7SAOcw',
      'viTv2o8bu8T09cCltM0YzjYm0yupJQQB',
      'sb2Mi4SJhopnfGMMsaJCIKYvq8CSYat2',
      'ioZchCCTOTA9FJM2yA89Dv97BoCqitdp',
      'c1xjQZPbedxhRKqYEZ2i7r9I9pKbWZ1c',
      'uLqbdQcoHTGMqq3MAk0xytpzzRqAN3Iu',
      'SG1OZhpw02UdHoSQx9UF7i8LvXg56MCj',
      'URVWoAa5mbIAy0HbCzaxWkkzFoBWlk92',
      'Hw4TNnru0tVitazSHxoj2Yi4pz9xAVKW',
      'ToOUqYZX2ZmtRqU2vb4CR8c1iaQCICco',
      'TcAwnY7mSqVsyWUEYA0jINZX3R05gWXK',
      'lzugT7Ew1XWzLM38QD0aWcwEGmoGj1ZY',
      'N3nIPlnIvnEbYaUDxl54BV1BVCqrFMyd',
      'Lo1EsgkoGr2WpYk6adQgmqyXTpAOhDAQ',
      'QiBspDIeUAOksfE4XWT3EKbEW2StZ82v',
      'gYyZUhPfALQqDil0Po4tVvSKTjl0r1zD',
      'zrnmo0rsvxBUuIQybLCAs7Y6nWOPfCC0',
      'CJ1h8IatmxXo4SzR64LD3dR8xUK6qivi',
      'JuftfzmBt3fRjAk5yL6IgyQ2WgtN0eTV',
      'gLvn7f52STDx4WQWbNyANLg7F0x1DxwR',
      'eaL7ClikBDxPXBDxWKxO1IVpO6u4itbA',
      'm5TI8RxddPwDQ522jeb2WXJy4pG5g2Pd',
      'fi2AjPxvvOkUiwxJCF6xjtwTE6wt3FbC',
      'QQlbz0kpGr8lrxpsEb3cZBjQwHR3ptfU',
      'b372oHtZvk8v4pv2rRhuykAyFJGTFit5',
      'nMOQaFzUUci1Nvj6q7JNcI2JS4222pKW',
      'LbJ7bb4rJuw5RVkbMnG5RDiJzE9Ske3k',
      'skCGR8cGNhOlJqB2XcACBNl23GVgZoXv',
      '2pIRhhm50nRRgzz6BfhebUBJJMBx91OR',
      'qZYvVGw9CLTmZcbpCRcs4bNu2oDV7gJP',
      'kAxvEa6szcFMK10CvJ9gj5IE4LTh80b4',
      'uytAYhOV13M4lxBgWQXNffryXK6RbxDR',
      'u5O0zmagJvd7NjRlGERxSMFdacsBkqxV',
      'KuGz2SKIZX0awexaBzACNHo80pDp3ywa',
      'HWTAK5a7ez2hWhSm4D0opFNqjUTSS9PY',
      'f7C9qLZZ5bM4ioj0tsDfbWoh8qwavS3B',
      'zjn9htYfFwsIIGj1dpkLnEnsvcv9Ql3U',
      'ZRiR2MGLbtYnvMtnE851RejdzsrLvsbc',
      'fBBkIWbsBMbyJyMKv7S8db3prcLOuhMt',
      'YIi18H5tLVbX53gZtJL8d4ISu07G63MP',
      'mQdM8pJJDfMuLwOR3sW7lAm4E7XB8tKb',
      'dlfdvpTDOirw43eRAf4rHllP0kHZmk48',
      '7VKW1An7nzbsGZygJeTrbhoFprC9e0k0',
      'Pqmouf4KRgZtH6FpVHdbLPFY0iu8Hla7',
      'cU1Puedqyvgwxv9hjkRCd5cKRn7Svs7P',
      'XW2qXg3X3HJGnheiNw7QVfsnqbjHBGL6',
      '2fLSfwi9Y9oBC2jpodfK2skR237POKmN',
      'VrfZnwvW7XQiJJolRLyONFe4i97kOOop',
      'yabIxe55AcSen8Xbu9gfiUsnMHbihTDA',
      '0lejQmQDtccuDS3aeo1haLSGwDrglidc',
      'tQpRj4VcxiznCpAO1mrKR8MjZ9kLivfq',
      'icVW8FDZfB2dfJY6oC2YV77ugN7ku0od',
      '8L4C9VMq9fqgoFT7lAcMIkGZqRtAzjRZ',
      'aZuCDdcPfFi64dqOm7KUcn3WbExET5Ex',
      'AYLNiexpYkT26fj0Q5nz6x0YRsYNajXe',
      'SmWUwPcy3wq3RoCgEkyfiLHAsormuKSq',
      'IlIuP9GgQADDsfu0V1IQrToJ9OeTsbna',
      'O1x8GP5YYcDcSLhnhNu1P0CLNGgwF8y6',
      'aSbSuQMqU6UyEUQb2NrDvRkt6qaDitWC',
      'BOr1O0B4cRBDGAbOQlPQFrdusUMMbFmq',
      'oY6YSTZnBc9BfN01DiMYiA7UFFMOTUP3',
      'if0znJvKJbW7l5FPyqBV1Ov9lvAfgJHQ',
      'JKqtoqEqKVvKf8YMp9sMb8E3W7BYYJed',
      'hD8RHKQJswJUmKc1eoaAn2wgVcBaBHb2',
      'neVshvKyy8pMc2gV9XjwUJfV9JnkJRQa',
      'jkcI1VG00i5CLHR1nNEbJGQqqlHOpobH',
      'sKueHju7CM2e6SRQKLI0AcZxCfroShnQ',
      'E0fzoMvwycBQ5TSq0BBSnxdSF77criqu',
      '39N6JvQC4mO3wv5Jp7bJL4kp1omSHi9S',
      'XxBfSWRokv35rldwrxpn6JZpgQ4U1Noz',
      'b2K3nv2Do49pDw8nxqTjsSDw9dno6Luu',
      'pUFIuoNcbmGqxz52WoSK98F9yjfP3AYy',
      'Xb7IDI3qJ2DxcBLSLodFbCK48h2iursa',
      'JTnTdNrYP4YpHIlS4bOchxugH2oV6OWf',
      'tGTZxQhMGIUtDILu62c9WOp0o4Aq5edq',
      'bENn7Jve4h3JWVi44zqQN5VOErK6mqwp',
      'Tl3V9aWOrcYM1trlN8ajjUUII7GSDtBH',
      'B9Ajf1RFJs05VBYl242uzkcwdkGROsPx',
      'wOTrxQGJQiOr7odjytcTswyebsMQIcH4',
      'vmC8OV3WRZnR4FL7Xgnp3MOw6Z8f5jwG',
      'M4F62a2Ej3Txs99HpbJr0KdqlNGiAtmV',
      'YJoe8AJuCxY5uQY4KkoaiW80SBarx1gb',
      'gs6WXQZhYOH6mPl7QRZbOqQd9NaUiCH1',
      'QfGXC9ojki3Y01j6cZxk8MPL9qAHqtft',
      'JeOgSgzPFIiQSnK8N3AKwn2jXpnGIuCW',
      'ERZgX4IKylXWNnrY03thWQwun8l3JRMS',
      'fC7kxRjGVOM3XDpbHj3Z7MubK6sQvQr9',
      'DI9s1ubc7P1f2Otfnws3VIeYa404mNKk',
      '4ebeWhLf7qW8lO9juLjL7nFGT05zevix',
      'RrG5SsBZ6iNOi0ATK4ZZ19Uf3wYH4Fdf',
      'KiUEiJ7JipGEKF4WF6jEOLcUpZTMnJKt',
      'cpEBW0C9UXTXZrra95jETn1rF8A5tTSe',
      'dWfzbfCQsqy1JS5Ci1sRnHtWPpaVkqih',
      'k4QiThg6i1iiqdOpz8Ux8wZzNT5afdEU',
      'IsNbqYcIofm0QbpR6vbSJoaImQdKqvWg',
      'OavVNgvunRXoTQ4Kb93Q4FSmiLoGY1eF',
      'SDlxhtZxNZEsDOcUm4wjHIKGOH1837Dm',
      '86Ry4AI6GrmCGGFYgMljYlJYcIUOgvwq',
      'L2mrkVMsjsevEGXv81wHZz3FHCEJwTUX',
      'E6znuZgmct4T7wPehAfV3DfOK5S1L8fv',
      'S9B0CwCitoILvG9F6KWdf9JCgJXYjlkH',
      'NzhqkR3nkN7vzJTRXqDNnzgkpQ2JbIui',
      'dRxbDDkjQK3vQ1DvJ7Bx47WorYYDU25e',
      'TrdqjsVB2yHRxzXafDeO5piMTZ3imS08',
      'fFZ0kb452Y3tummWfw6y23IAYlqIZSrX',
      'kiEwDapBKzGgCymbolizcP3YdCbDfdxZ',
      '2TzqaTL9AlWKmjLzFq0bJCwdocqfitnU',
      'yLs45P5SvB4JzDgsXO12ViV8HnI3WCUl',
      'aZi2cxKRg9RrzxjnRrj0SVTB7xN1Pl5s',
      '8KCpT29DWyuJnu9RPC5lqiEz3HtYNzXU',
      'SU2lZhhgPZrBp57wwHmLbGQ5jgMkJfl6',
      'EMPH2gXziUTZbSikk2fHZGJBg3rRmolr',
      '2g7ZLTYFeegPsGkah8THvCuMattUtome',
      'ZbVDYqCEtOXhrRrE8bSX5RYcScbPpxhs',
      '8JNrm6tBB1tfu4PcEIQMRGvwLLlxHN11',
      '7rtgTUpS3yDbQ7cjlvnzf95RNDwx4T28',
      'obRZhNRwfIe7E9E60O3LqmGq6tQVsxv2',
      'dujLFWm6jGIRp8E0DQPiiY6lpETWI3oV',
      'M96oJohzIcjFnnwAgoG7BUwObZSt62V0',
      'KW6bRUPIlpkSvBQh5QsZfi1sCL34bxjz',
      'ZSOJF4orP4CZs2qxslVK1JEX71mZgiIi',
      'tnGiMAYCYOuWTIkMjddplKiRSXqLAdoC',
      'yRr0N1Y5GVFE7p0HjJoVxxrOVRHC8geb',
      'oEVkyqgNR8DIJjItzYhW9YmPbWPyvqop',
      'LW2DCKpuKKbyUgLrs8GVqJvUQIprc4gb',
      'UbWM5T9et60zAeaMFMAsuU910sRoYmKL',
      'PDIRsscxO4zKYUaDCOVQcBf3aXBqvfA1',
      'KcQ86DmBc8TowEZq2alZD4Dh3yunskbK',
      'OsnRubAJ4ix0QCElI0lqKHn2kot4xcsy',
      '537GdSF9hHIk8g5eKRCFaMoqJSyC110x',
      'G05VO7XW63vlBSnCMPINn2rCXxUejecF',
      'rpfn2FjmXA4BtDvYC3Ok6A73RWlZ8Jr8',
      'pYAinUtfZidpSFYk76WgOmm9UYY1p2EX',
      'VJevV7vQo9ljet430CeqQn4aKn7TXOD7',
      'S21ZaZzJiOgCQH2Tb5B6fzXlevrk1PMu',
      '5l8unGZ5LxG0ESLkCyzKnLKduiw4dMHv',
      '2ubz6Lta5jBhlLA6O7qhmPvdjymURLcF',
      'VPtJOzD8g0heDDmW55vd7ilEVumkfGux',
      'PVlV5VKTVQ6wPZLO4UTmkWfGNoxVr8DW',
      '8h1iFRPwcK1QHvV2m2bEZQgONKSq7lhn',
      'jvx48MPz4Z12r8dTk1HbUATpFq7PPBxE',
      'TA3MtQaZTNWh5wlvc6LBBLHGCasKtFiU',
      'DpeQguxXfazPZLGOpPlErEeFhr28TDzJ',
      '4H46PlReRLSzIeQUb7V53f8HPm47PWhB',
      '6YNQHjDDWYy04JwzsbBzRtxZpYFbaE0A',
      '7Xe9sWlJJnSfk1y7Pksi6COvMNMAl3Xd',
      '7586HZkUelG7Zifo4o9lL9g4fwgY2lXL',
      'djXHgiKwkUMeoj10yLKBaxrHL4ph4NCz',
      'mjZNKUQuXWjvVq5yhDWRqJrmqOxTCXwP',
      'gEociptWIuKsd2GZMni7omzH29X3KeCp',
      'IpMexuTjDqOHObn9DfVaOGga599sVCG8',
      'U4YqRTJsbkPNVCyhWojvCnasQG8i7QY6',
      'jpUsWogiAEdfuQkQcXrlEXA6SDceOxcu',
      'x6WnthZrk3oKxyBcsBaWr78gxmSSFSLp',
      '4fyAO6Ci6vxs5pt7MczXXNowdT3hJCr2',
      'aujBVUuS21Y9Gx12It5myNPrv8bzw4P2',
      'TM7PG6Ma1xNY3jjnaOy9pQ9pD4lEf6M6',
      'XCZeiffNtxvQgKr9OfYY7vvCygyOqT0X',
      'hSxDklGDOVSHsatH0bZ4d6PRGmhhptAA',
      'tiB8Hl7BL6hgLreXZaM4PfhC1s5EetEp',
      'et1Z4u3uXADEOPDL4X8j5yT4GZuzmimU',
      'YeGfu389BYvkz8tEK5rl189hYHqQtjWp',
      'QbX7v2VMsZrefabLbrkwCFXOcUvGEsR9',
      'KA6Rao5I4WCcEt43tpc8aKXpf4VcM25A',
      'Uo8YCpy7ekJDD9BCjRaoOcVY5qnh9IA1',
      'qAQtGbibOJ4oS2izHNlcmTpSyckxhVeg',
      'oBHLgSiv8gsRzVOim2BNMy6rn9ySVwWo',
      'Q5eeYKlZ0K4jqfYPAzxMQ4sD9F1dcQIv'
    ];

    // List of allowed statuses
    const allowedStatuses = [
      'EMI auto-pay setup complete',
      'Disbursal initiated', 
      'Loan disbursed',
      'UTR received'
    ];

    // Check if current doctor ID is in allowed list
    const isAllowedDoctor = doctorId && allowedDoctorIds.includes(doctorId);
    
    // Use the API result from state (set by useEffect)
    // Fallback to loan status data if API hasn't been called yet
    const hasAllowedStatusInTimeline = loanStatusData.some(statusItem => 
      allowedStatuses.some(status => 
        statusItem.userStatus.toLowerCase().includes(status.toLowerCase())
      )
    );

    // Check if current status is in allowed list
    const isAllowedStatus = allowedStatuses.some(status => 
      transaction.status.toLowerCase().includes(status.toLowerCase())
    );

    // Also check for disbursed status (original logic)
    const isDisbursedStatus = transaction.disbursedAt || transaction.status.toLowerCase().includes('disbursed');

    // Check if treatment invoice has been uploaded (for other clinics)
    const hasUploadedTreatmentInvoice = uploadedPrescriptions.length > 0;

    // For allowed doctors: enable if they have allowed status, disbursed status, or allowed status in API response
    if (isAllowedDoctor) {
      return isAllowedStatus || isDisbursedStatus || hasAllowedStatusInAPI || hasAllowedStatusInTimeline;
    }

    if ( isDisbursedStatus || hasAllowedStatusInTimeline || hasAllowedStatusInAPI) {
      return true;
    }

    // For other clinics: enable if they have uploaded treatment invoice
    if (hasUploadedTreatmentInvoice) {
      return true;
    }

    return false;
  };

  const canDownloadDisbursalOrder = shouldEnableDisbursalDownload();


  // Handle disbursal order button click
  const handleDisbursalOrderClick = () => {
    setShowDisbursalOrder(true);
  };

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
        setLoanDetails(result.loanDetails || null);
      } catch (error) {
        console.error('Error loading EMI plans:', error);
      } finally {
        setEmiPlansLoading(false);
      }
    };

    loadEmiPlans();
  }, [transaction.userId, transaction.loanId]);

  // Load merchant score data on component mount
  React.useEffect(() => {
    const loadMerchantScore = async () => {
      if (!doctorCode) return;
      
      try {
        const scoreData = await getMerchantScore(doctorCode);
        setMerchantScore(scoreData);
        console.log('Merchant score loaded:', scoreData);
      } catch (error) {
        console.error('Error loading merchant score:', error);
        // Don't set error state, just log it as merchant score is optional
      }
    };

    loadMerchantScore();
  }, [doctorCode]);

  // Check getLoanStatusWithUserStatus API for allowed statuses on component mount
  React.useEffect(() => {
    const checkLoanStatusWithUserStatus = async () => {
      if (!transaction.loanId) return;
      
      try {
        const loanStatusResponse = await getLoanStatusWithUserStatus(transaction.loanId);
        const hasAllowedStatus = loanStatusResponse.some(statusItem => {
          const allowedStatuses = [
            'EMI auto-pay setup complete',
            'Disbursal initiated', 
            'Loan disbursed',
            'UTR received'
          ];
          return allowedStatuses.some(status => 
            statusItem.userStatus.toLowerCase().includes(status.toLowerCase())
          );
        });
        setHasAllowedStatusInAPI(hasAllowedStatus);
        console.log('getLoanStatusWithUserStatus API response checked for allowed statuses:', hasAllowedStatus);
      } catch (error) {
        console.error('Error calling getLoanStatusWithUserStatus API:', error);
        setHasAllowedStatusInAPI(false);
      }
    };

    checkLoanStatusWithUserStatus();
  }, [transaction.loanId]);

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

            
            {/* Application ID */}
            {transaction.applicationId && (
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className="text-gray-900">Application ID: {transaction.applicationId}</div>
              </div>
            )}

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
                <h4 className="text-base font-semibold text-gray-900">User Status Timeline</h4>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {loanStatusData.length > 0 ? (
                <div className="space-y-4">
                  {loanStatusData.slice().reverse().map((item, index) => (
                    <div key={item.statusCode || index} className="flex items-start space-x-3">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                        {index < loanStatusData.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                        )}
                      </div>
                      
                      {/* Status content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="text-sm font-medium text-gray-900">{item.userStatus}</h5>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatLoanStatusTimestamp(item.addedOn)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No loan status data found</p>
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
                            {loanDetails && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Loan amount</span>
                                <span className="text-gray-900">₹ {loanDetails.loanAmount.toLocaleString()}</span>
                              </div>
                            )}
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
                    {loanDetails && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loan amount</span>
                        <span className="text-gray-900">₹ {loanDetails.loanAmount.toLocaleString()}</span>
                      </div>
                    )}
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
                <p className="text-sm font-medium text-gray-900">
                  {transaction.lender === 'Fibe' ? 'Fibe: Earlysalary Services Private Limited' : transaction.lender}
                </p>
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

              <div className={`flex items-center justify-between ${!canDownloadDisbursalOrder ? 'opacity-50' : ''}`}>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <FileText className={`h-5 w-5 ${canDownloadDisbursalOrder ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={canDownloadDisbursalOrder ? 'text-gray-900 font-medium' : 'text-gray-400'}>Disbursal Order</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={canDownloadDisbursalOrder ? handleDisbursalOrderClick : undefined}
                    disabled={!canDownloadDisbursalOrder}
                    className={`p-2 rounded-lg transition-colors ${
                      canDownloadDisbursalOrder 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-gray-100 cursor-not-allowed'
                    }`}
                    title={
                      canDownloadDisbursalOrder 
                        ? 'View Disbursal Order' 
                        : merchantScore 
                          ? `DO View restricted - Risk Category: ${merchantScore.risk_category} (Only Category A allowed)`
                          : 'Available for authorized doctors with specific statuses'
                    }
                  >
                    <Eye className={`h-5 w-5 ${canDownloadDisbursalOrder ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                </div>
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

      {/* Disbursal Order Overlay */}
      {showDisbursalOrder && (
        <DisbursalOrderOverlay
          loanId={transaction.loanId}
          onClose={() => setShowDisbursalOrder(false)}
        />
      )}
    </div>
  );
};

export default TransactionDetailsOverlay;