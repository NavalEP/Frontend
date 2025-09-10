import axios from 'axios';

// Base URL configuration - Direct API calls to backend
const API_BASE_URL = 'https://uatloanbot.carepay.money/api/v1/agent';

// Create axios instance with authentication
const loanApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 120000, // 120 second timeout (2 minutes)
});

// Add token to requests
loanApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
loanApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      const errorMessage = error.response.data?.message || error.response.data?.error || '';
      const isTokenExpired = 
        errorMessage.toLowerCase().includes('token has expired') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('invalid token');
      
      if (isTokenExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('phoneNumber');
        window.location.href = '/login';
        throw new Error('Your session has expired. Please login again.');
      }
    }
    return Promise.reject(error);
  }
);



export interface LoanTransaction {
  userId: string;
  loanId: string;
  loanAmount: number;
  treatmentAmount: number;
  loanReason: string;
  clinicName: string;
  doctorName: string;
  firstName: string;
  mobileNumber: string;
  patientName: string;
  patientPhoneNo: string;
  loanApplyDate: string;
  status: {
    loan: {
      loanStatus: string;
      loanSubStatus: string;
      loanStatusCode: string;
      message: string;
    };
    user: any;
  } | null;
  employmentType: string;
  utrNo: string;
  disburseDate: string;
  onboardingUrl: string;
  loanPushedDate: string | null;
  lenderName: string;
  assignerName: string;
  applicationId: string;
}

interface LoanTransactionsResponse {
  status: number;
  data: LoanTransaction[];
  attachment: null;
  message: string;
}

interface UploadResponse {
  status: number | string; // API might return either type
  data: string; // URL of the uploaded file
  attachment: null;
  message: string;
}

export interface ActivityLogItem {
  id: number;
  userId: string;
  activity: string;
  type: string;
  loanId: string | null;
  addedOn: number;
  addedBy: string | null;
  updatedOn: number | null;
  comments: string | null;
}

interface ActivityLogResponse {
  status: number;
  data: ActivityLogItem[];
  attachment: null;
  message: string;
}

export interface LoanCountAndAmountData {
  total_loan_amount: number;
  pending_count: number;
  expired_count: number;
  total_applied: number;
  expired_amount: number;
  disbursed_count: number;
  approved_amount: number;
  rejected_amount: number;
  disbursed_amount: number;
  rejected_count: number;
  approved_count: number;
  pending_amount: number;
}

export interface DoctorDashboardData {
  leadsPerClinic: number;
  avgApprovalRateCarePay: number;
  leadsPerClinicCarepay: number;
  avgApprovalRate: number;
}

interface DoctorDashboardResponse {
  status: number;
  data: DoctorDashboardData;
  attachment: null;
  message: string;
}

interface LoanCountAndAmountResponse {
  status: number;
  data: LoanCountAndAmountData;
  attachment: null;
  message: string;
}

export interface UserLoanStatusItem {
  userStatus: string;
  addedOn: string;
  loanId: string;
}

interface UserLoanStatusResponse {
  status: number;
  data: UserLoanStatusItem[];
  attachment: null;
  message: string;
}

export interface LoanStatusWithUserStatusItem {
  statusCode: number;
  userStatus: string;
  addedOn: number;
}

interface LoanStatusWithUserStatusResponse {
  status: number;
  data: LoanStatusWithUserStatusItem[];
  attachment: null;
  message: string;
}

export interface ChildClinic {
  clinicName: string;
  doctorName: string;
  doctorId: string;
  doctorCode: string;
}

interface ChildClinicsResponse {
  status: number;
  data: ChildClinic[];
  attachment: null;
  message: string;
}

// User Address interfaces
export interface UserAddress {
  id: number;
  userId: string;
  addressType: 'permanent' | 'current';
  address: string;
  state: string;
  city: string;
  pincode: number;
  residenceType: string | null;
  residenceValue: string | null;
  changeDate: string | null;
  locality: string | null;
  landmark: string | null;
}

interface UserAddressResponse {
  status: number;
  data: UserAddress;
  attachment: null;
  message: string;
}

// FinDoc District interfaces
export interface FinDocDistrict {
  id: number;
  name: string;
  state: string;
  code?: string;
}

interface FinDocDistrictsResponse {
  status: number;
  data: string[]; // Changed from FinDocDistrict[] to string[]
  attachment: null;
  message: string;
}

// Save Address Details interfaces
export interface SaveAddressDetailsRequest {
  userId: string;
  address: string;
  addressType: 'permanent' | 'current';
  city: string;
  pincode: string;
  state: string;
}

interface SaveAddressDetailsResponse {
  status: number;
  data: any;
  attachment: null;
  message: string;
}

// Unified timeline interface for both getUserLoanStatus and activitiesLog
export interface TimelineItem {
  status: string;
  addedOn: string;
  loanId?: string;
  activity?: string;
  type?: string;
  id?: number;
  userId?: string;
  addedBy?: string | null;
  updatedOn?: number | null;
  comments?: string | null;
}

export const getQrCode = async (doctorId: string) => {
  try {
    const response = await loanApi.get('/getQrCode/', {
      params: { doctorId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        qrCodeUrl: response.data.data
      };
    }

    throw new Error(response.data.message || 'Failed to get QR code');
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    throw new Error(error.response?.data?.message || 'Failed to get QR code');
  }
};

export const getActivitiesLog = async (userId: string): Promise<ActivityLogItem[]> => {
  try {
    const response = await loanApi.get<ActivityLogResponse>('/activitiesLog/', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get activities log');
  } catch (error: any) {
    console.error('Error getting activities log:', error);
    throw new Error(error.response?.data?.message || 'Failed to get activities log');
  }
};

export interface AssignedProduct {
  id: number;
  productId: string;
  productName: string;
  totalEmi: number;
  advanceEmi: number;
  processingFesIncludingGSTRate: number;
  processingFesIncludingGSTINR: number;
  subventionRate: number;
  nbfcTakePercent: number;
  interest: number;
  status: boolean;
  processingFeesType: string;
  referenceId: string | null;
  moneyViewSchemeId: string | null;
}

interface AssignedProductResponse {
  status: number;
  data: AssignedProduct;
  attachment: null;
  message: string;
}

export interface BureauEmiPlan {
  eligible: boolean;
  productDetailsDO: {
    id: number;
    productId: string;
    productName: string;
    totalEmi: number;
    advanceEmi: number;
    processingFesIncludingGSTRate: number;
    processingFesIncludingGSTINR: number;
    subventionRate: number;
    nbfcTakePercent: number;
    interest: number;
    status: boolean;
    processingFeesType: string;
    referenceId: string | null;
    moneyViewSchemeId: string | null;
  };
  creditLimitCalculated: number;
  emi: number;
  netLoanAmount: number;
  downPayment: number;
  grossTreatmentAmount: number;
  additionalDP: number;
}

interface BureauDecisionResponse {
  status: number;
  data: {
    success: boolean;
    data: {
      finalDecision: string;
      maxEligibleEmi: number;
      loanAmount: number;
      treatmentAmount: number;
      emiPlanList: BureauEmiPlan[];
      obligations: number;
      foirPercentage: number;
      rejectionReasons: string[];
      incomeVerificationReasons: string[];
      borrowerInfo: {
        name: string;
        age: number;
        employmentType: string;
      };
    };
  };
  attachment: null;
  message: string;
}

export const getAssignedProduct = async (userId: string): Promise<AssignedProduct | null> => {
  try {
    const response = await loanApi.get<AssignedProductResponse>('/userDetails/getAssignedProductByUserId/', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error getting assigned product:', error);
    // Django API returns 404 when no assigned product found
    if (error.response?.status === 404) {
      return null;
    }
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    }
    return null;
  }
};

export interface BureauDecisionData {
  finalDecision: string;
  maxEligibleEmi: number;
  loanAmount: number;
  treatmentAmount: number;
  emiPlanList: BureauEmiPlan[];
  obligations: number;
  foirPercentage: number;
  rejectionReasons: string[];
  incomeVerificationReasons: string[];
  borrowerInfo: {
    name: string;
    age: number;
    employmentType: string;
  };
}

export const getBureauDecision = async (loanId: string): Promise<BureauEmiPlan[]> => {
  try {
    const response = await loanApi.get<BureauDecisionResponse>('/bureauDecisionNew/', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data?.success && response.data.data.data?.emiPlanList) {
      return response.data.data.data.emiPlanList;
    }

    return [];
  } catch (error: any) {
    console.error('Error getting bureau decision:', error);
    return [];
  }
};

export const getBureauDecisionData = async (loanId: string): Promise<BureauDecisionData | null> => {
  try {
    const response = await loanApi.get<BureauDecisionResponse>('/bureauDecisionNew/', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data?.success && response.data.data.data) {
      return response.data.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error getting bureau decision data:', error);
    return null;
  }
};

// New endpoint that directly calls Django API
export const getMatchingEmiPlansFromAPI = async (userId: string, loanId: string): Promise<{ plans: BureauEmiPlan[], hasMatchingProduct: boolean, isApproved: boolean, assignedProductFailed: boolean, loanDetails?: LoanDetailsByUserId }> => {
  try {
    const response = await loanApi.get('/matchingEmiPlans/', {
      params: { userId, loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data) {
      // If we have matching products, also fetch loan details
      let loanDetails: LoanDetailsByUserId | undefined;
      if (response.data.data.hasMatchingProduct) {
        try {
          const loanDetailsResult = await getLoanDetailsByUserId(userId);
          loanDetails = loanDetailsResult || undefined;
        } catch (error) {
          console.error('Error fetching loan details:', error);
          // Don't fail the entire request if loan details fetch fails
        }
      }
      
      return {
        ...response.data.data,
        loanDetails
      };
    }

    throw new Error(response.data.message || 'Failed to get matching EMI plans');
  } catch (error: any) {
    console.error('Error getting matching EMI plans from API:', error);
    return { 
      plans: [], 
      hasMatchingProduct: false, 
      isApproved: false, 
      assignedProductFailed: true 
    };
  }
};

// Legacy method - kept for backward compatibility
export const getMatchingEmiPlans = async (userId: string, loanId: string): Promise<{ plans: BureauEmiPlan[], hasMatchingProduct: boolean, isApproved: boolean, assignedProductFailed: boolean, loanDetails?: LoanDetailsByUserId }> => {
  try {
    // First try the new Django API endpoint
    return await getMatchingEmiPlansFromAPI(userId, loanId);
  } catch (error: any) {
    console.error('New API failed, falling back to legacy method:', error);
    
    // Fallback to legacy method
    try {
      // Step 1: Always call assigned product API first
      const assignedProduct = await getAssignedProduct(userId);
      const assignedProductFailed = !assignedProduct;
      
      // Step 2: Then call bureau decision API
      const decisionData = await getBureauDecisionData(loanId);
      if (!decisionData) {
        return { plans: [], hasMatchingProduct: false, isApproved: false, assignedProductFailed };
      }

      const emiPlans = decisionData.emiPlanList;
      const isApproved = decisionData.finalDecision.toLowerCase() === 'approved';

      // Step 3: Handle different scenarios based on API results
      if (isApproved && emiPlans.length > 0) {
        if (assignedProduct) {
          // Assigned product API worked - filter EMI plans that match the productId
          const matchingPlans = emiPlans.filter(plan => 
            plan.productDetailsDO.productId === assignedProduct.productId
          );
          
          if (matchingPlans.length > 0) {
            // Show detailed view with matching plans
            // Fetch loan details when we have matching products
            let loanDetails: LoanDetailsByUserId | undefined;
            try {
              const loanDetailsResult = await getLoanDetailsByUserId(userId);
              loanDetails = loanDetailsResult || undefined;
            } catch (error) {
              console.error('Error fetching loan details:', error);
            }
            
            return { 
              plans: matchingPlans, 
              hasMatchingProduct: true,
              isApproved: true,
              assignedProductFailed: false,
              loanDetails
            };
          } else {
            // No matching plans found, don't show EMI section
            return { plans: [], hasMatchingProduct: false, isApproved: true, assignedProductFailed: false };
          }
        } else {
          // Assigned product API failed (500) but decision is approved - show simplified view with all plans
          // Fetch loan details when we have matching products
          let loanDetails: LoanDetailsByUserId | undefined;
          try {
            const loanDetailsResult = await getLoanDetailsByUserId(userId);
            loanDetails = loanDetailsResult || undefined;
          } catch (error) {
            console.error('Error fetching loan details:', error);
          }
          
          return { 
            plans: emiPlans, 
            hasMatchingProduct: true,
            isApproved: true,
            assignedProductFailed: true,
            loanDetails
          };
        }
      }
      
      // If not approved, don't show EMI plans
      return { plans: [], hasMatchingProduct: false, isApproved: false, assignedProductFailed };
    } catch (error: any) {
      console.error('Error getting matching EMI plans:', error);
      return { plans: [], hasMatchingProduct: false, isApproved: false, assignedProductFailed: true };
    }
  }
};

export const getDisburseDetailForReport = async (userId: string) => {
  try {
    // First, try to make a direct request to check if the API supports AJAX requests
    try {
      const response = await loanApi.get('/getDisburseDetailForReport/', {
        params: { userId },
        headers: {
          'Accept': 'application/pdf, application/json, */*'
        },
        responseType: 'blob',
        timeout: 30000
      });

      // Check if response is actually a PDF
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/pdf')) {
        // Create blob URL for download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Create temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `disbursal-report-${userId}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true };
      }
    } catch (ajaxError: any) {
      console.log('AJAX request failed, falling back to direct browser request:', ajaxError.response?.status);
      
      // If AJAX fails with 406, fall back to direct browser request
      if (ajaxError.response?.status === 406) {
        const baseUrl = 'https://loanbot.carepay.money/api/v1/agent';
        const url = `${baseUrl}/getDisburseDetailForReport/?userId=${userId}`;
        
        // Open the URL directly in a new tab
        // This will preserve all authentication cookies and session data
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          throw new Error('Popup blocked. Please allow popups for this site and try again.');
        }

        return { success: true };
      }
      
      // If it's not a 406 error, re-throw the error
      throw ajaxError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error downloading disbursal report:', error);
    
    if (error.message.includes('Popup blocked')) {
      throw new Error('Popup blocked. Please allow popups for this site and try again.');
    } else if (error.response?.status === 404) {
      throw new Error('Disbursal report not found for this user.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to download this report.');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to download disbursal report. Please try again.');
    }
  }
};

export const uploadPrescription = async (file: File, userId: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('type', 'img');
    formData.append('fileName', 'treatmentProof');

    const response = await loanApi.post<UploadResponse>('/uploadDocuments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    });

    // Check both numeric and string status since API might return either
    if (response.data.status === 200 || response.data.status === '200' || response.data.message === 'success') {
      return {
        success: true,
        fileUrl: response.data.data, // This will be the download URL
        message: 'Document uploaded successfully'
      };
    }

    throw new Error(response.data.message || 'Failed to upload document');
  } catch (error: any) {
    console.error('Error uploading document:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    } else if (error.response?.status === 413) {
      throw new Error('File is too large. Please upload a smaller file.');
    } else if (error.response?.status === 415) {
      throw new Error('Invalid file type. Please upload an image or PDF file.');
    } else {
      throw new Error('Failed to upload document. Please try again.');
    }
  }
};

export const getLoanTransactions = async (doctorId: string, params?: {
  clinicName?: string;
  startDate?: string;
  endDate?: string;
  loanStatus?: string;
}): Promise<LoanTransaction[]> => {
  try {
    const queryParams = {
      doctorId,
      clinicName: params?.clinicName || '',
      startDate: params?.startDate || '',
      endDate: params?.endDate || '',
      loanStatus: params?.loanStatus || ''
    };

    console.log('Fetching loan transactions from:', `${API_BASE_URL}/getAllLoanDetailForDoctorNew/`);

    const response = await loanApi.get<LoanTransactionsResponse>(
      '/getAllLoanDetailForDoctorNew/',
      {
        params: queryParams,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Loan transactions response:', response.data);

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch loan transactions');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/getAllLoanDetailForDoctorNew/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching loan transactions.');
  }
};

export const getAllChildClinics = async (doctorId: string): Promise<ChildClinic[]> => {
  try {
    console.log('Fetching child clinics from:', '/getAllChildClinic/');

    const response = await loanApi.get<ChildClinicsResponse>(
      '/getAllChildClinic/',
      {
        params: { doctorId },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Child clinics response:', response.data);

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch child clinics');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/getAllChildClinic/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching child clinics.');
  }
};

export const getUserLoanStatus = async (loanId: string): Promise<UserLoanStatusItem[]> => {
  try {
    console.log('Fetching user loan status from:', '/status/getUserLoanStatus/');

    const response = await loanApi.get<UserLoanStatusResponse>(
      '/status/getUserLoanStatus/',
      {
        params: { loanId },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('User loan status response:', response.data);

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch user loan status');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/status/getUserLoanStatus/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching user loan status.');
  }
};

export const getLoanStatusWithUserStatus = async (loanId: string): Promise<LoanStatusWithUserStatusItem[]> => {
  try {
    console.log('Fetching loan status with user status from:', '/status/getLoanStatusWithUserStatus/');

    const response = await loanApi.get<LoanStatusWithUserStatusResponse>(
      '/status/getLoanStatusWithUserStatus/',
      {
        params: { loanId },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Loan status with user status response:', response.data);

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch loan status with user status');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/status/getLoanStatusWithUserStatus/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching loan status with user status.');
  }
};

// Helper function to convert ActivityLogItem to TimelineItem
const convertActivityLogToTimeline = (activityItem: ActivityLogItem): TimelineItem => {
  // Convert timestamp to readable date format
  const formatTimestamp = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return {
    status: activityItem.activity,
    addedOn: formatTimestamp(activityItem.addedOn),
    loanId: activityItem.loanId || undefined,
    activity: activityItem.activity,
    // Removed type: activityItem.type - don't show type in frontend
    id: activityItem.id,
    userId: activityItem.userId,
    addedBy: activityItem.addedBy,
    updatedOn: activityItem.updatedOn,
    comments: activityItem.comments
  };
};

// Helper function to convert UserLoanStatusItem to TimelineItem
const convertUserLoanStatusToTimeline = (statusItem: UserLoanStatusItem): TimelineItem => {
  return {
    status: statusItem.userStatus,
    addedOn: statusItem.addedOn,
    loanId: statusItem.loanId,
    activity: statusItem.userStatus
    // Removed type: 'loan_status' as requested
  };
};

// Helper function to convert LoanStatusWithUserStatusItem to TimelineItem
const convertLoanStatusWithUserStatusToTimeline = (statusItem: LoanStatusWithUserStatusItem): TimelineItem => {
  // Convert timestamp to readable date format
  const formatTimestamp = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return {
    status: statusItem.userStatus,
    addedOn: formatTimestamp(statusItem.addedOn),
    activity: statusItem.userStatus
    // Note: loanId is not available in this response format
  };
};

// Unified function to get timeline with fallback mechanism
export const getUserLoanTimeline = async (loanId: string, userId?: string): Promise<TimelineItem[]> => {
  try {
    console.log('Attempting to fetch user loan status timeline...');
    
    // First try getUserLoanStatus API
    const userLoanStatus = await getUserLoanStatus(loanId);
    
    if (userLoanStatus && userLoanStatus.length > 0) {
      console.log('Successfully retrieved user loan status, converting to timeline format');
      return userLoanStatus.map(convertUserLoanStatusToTimeline);
    }
    
    // If no data from getUserLoanStatus, throw error to trigger fallback
    throw new Error('No user loan status data available');
    
  } catch (error: any) {
    console.warn('getUserLoanStatus failed, trying getLoanStatusWithUserStatus:', error.message);
    
    try {
      // Second fallback to getLoanStatusWithUserStatus API
      console.log('Attempting to fetch loan status with user status as fallback...');
      const loanStatusWithUserStatus = await getLoanStatusWithUserStatus(loanId);
      
      if (loanStatusWithUserStatus && loanStatusWithUserStatus.length > 0) {
        console.log(`Successfully retrieved ${loanStatusWithUserStatus.length} status items from getLoanStatusWithUserStatus`);
        return loanStatusWithUserStatus.map(convertLoanStatusWithUserStatusToTimeline);
      }
      
      // If no data from getLoanStatusWithUserStatus, throw error to trigger final fallback
      throw new Error('No loan status with user status data available');
      
    } catch (secondFallbackError: any) {
      console.warn('getLoanStatusWithUserStatus failed, falling back to activitiesLog:', secondFallbackError.message);
      
      if (!userId) {
        throw new Error('userId is required when falling back to activitiesLog');
      }
      
      try {
        // Final fallback to activitiesLog API
        console.log('Attempting to fetch activities log as final fallback...');
        const activitiesLog = await getActivitiesLog(userId);
        
        if (activitiesLog && activitiesLog.length > 0) {
          // Filter activities related to the specific loan if loanId is provided
          const filteredActivities = activitiesLog.filter(activity => 
            !loanId || activity.loanId === loanId || !activity.loanId
          );
          
          console.log(`Successfully retrieved ${filteredActivities.length} activities from activitiesLog`);
          return filteredActivities.map(convertActivityLogToTimeline);
        }
        
        return [];
      } catch (finalFallbackError: any) {
        console.error('All timeline APIs failed:', finalFallbackError.message);
        throw new Error('Failed to retrieve timeline data from all available APIs');
      }
    }
  }
};

export const getLoanCountAndAmountForDoctor = async (doctorId: string, clinicName?: string, startDate?: string, endDate?: string): Promise<LoanCountAndAmountData> => {
  try {
    const params: { doctorId: string; clinicName?: string; startDate?: string; endDate?: string } = { doctorId };
    if (clinicName) {
      params.clinicName = clinicName;
    }
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    console.log('Fetching loan count and amount from:', '/getLoanCountAndAmountForDoctor/');

    const response = await loanApi.get<LoanCountAndAmountResponse>(
      '/getLoanCountAndAmountForDoctor/',
      {
        params,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Loan count and amount response:', response.data);

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch loan count and amount statistics');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/getLoanCountAndAmountForDoctor/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching loan count and amount statistics.');
  }
};

export const getDoctorDashboardData = async (doctorId: string, startDate?: string, endDate?: string): Promise<DoctorDashboardData> => {
  try {
    const params: { doctorId: string; startDate?: string; endDate?: string } = { doctorId };
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    console.log('Fetching doctor dashboard data from:', '/getDoctorDashboardData/');

    const response = await loanApi.get<DoctorDashboardResponse>(
      '/getDoctorDashboardData/',
      {
        params,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Doctor dashboard data response:', response.data);

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch doctor dashboard data');
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (!error.response) {
        console.error('Network Error Details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          url: '/getDoctorDashboardData/'
        });
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Log response error details
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`Backend API Error: ${errorMessage}`);
    }
    throw new Error('An unexpected error occurred while fetching doctor dashboard data.');
  }
};

  // Helper function to check if loan status should be considered as approved
  const isLoanApproved = (status: string | undefined): boolean => {
    if (!status) {
      console.log('isLoanApproved: status is undefined or null');
      return false;
    }
    
    const approvedStatuses = [
      'Approved',
      'Loan Approved',
      'EMI plans elgibility check',
      'EMI plan selected',
      'Lender flow initiated',
      'KYC required',
      'KYC in progress',
      'Bank Account KYC required',

  
      'KYC complete',
      'Agreement signing initiated',
      'Agreement generated',
  
      'Agreement signed',
      'EMI auto pay setup in progress',
      
     
    
    
      'EMI auto-pay setup complete',
      'Verification initiated for disbursal',
      'Verification completed for disbursal',
      'Disbursal initiated',
   
      'Loan disbursed',
      'UTR received'
    ];
    
    // Normalize the status for comparison (trim whitespace and convert to lowercase)
    const normalizedStatus = status.trim().toLowerCase();
    const normalizedApprovedStatuses = approvedStatuses.map(s => s.trim().toLowerCase());
    
    const isApproved = normalizedApprovedStatuses.includes(normalizedStatus);
    console.log(`isLoanApproved: status="${status}", normalized="${normalizedStatus}", isApproved=${isApproved}`);
    return isApproved;
  };

  // Helper function to format loan transaction for display
export const formatLoanTransaction = (loan: LoanTransaction) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Try different possible locations for the status
  let loanStatus = loan.status?.loan?.loanStatus;
  if (!loanStatus && loan.status) {
    // If status is a string directly
    if (typeof loan.status === 'string') {
      loanStatus = loan.status;
    }
    // If status is an object with different structure
    else if (typeof loan.status === 'object') {
      loanStatus = (loan.status as any).loanStatus || (loan.status as any).status;
    }
  }
  loanStatus = loanStatus || 'Unknown';
  
  const isApproved = isLoanApproved(loanStatus);
  
  console.log(`formatLoanTransaction: loanId=${loan.loanId}, status="${loanStatus}", approved=${isApproved}`);
  console.log('Full loan object:', JSON.stringify(loan, null, 2));
  console.log('loan.status:', loan.status);
  console.log('loan.status?.loan:', loan.status?.loan);
  console.log('loan.status?.loan?.loanStatus:', loan.status?.loan?.loanStatus);

  return {
    id: loan.loanId,
    loanId: loan.loanId, // Add loanId for bureau decision API
    userId: loan.userId, // Make sure userId is passed through
    amount: loan.loanAmount.toLocaleString(),
    name: loan.firstName || loan.patientName || 'Unknown',
    treatment: loan.loanReason || '',
    appliedAt: formatDate(loan.loanApplyDate),
    status: loanStatus,
    approved: isApproved,
    utr: loan.utrNo || undefined,
    disbursedAt: loan.disburseDate ? formatDate(loan.disburseDate) : undefined,
    lender: loan.lenderName || '',
    maxLimit: loan.treatmentAmount > loan.loanAmount ? loan.treatmentAmount.toLocaleString() : undefined,
    onboardingUrl: loan.onboardingUrl || undefined,
    shareableLink: loan.onboardingUrl || undefined,
    patientPhoneNo: loan.mobileNumber ? parseInt(loan.mobileNumber) : undefined,
    applicationId: loan.applicationId || undefined,
    clinicName: loan.clinicName || undefined,
    doctorName: loan.doctorName || undefined,
    employmentType: loan.employmentType || undefined
  };
};

// New interface for loan details by user ID
export interface LoanDetailsByUserId {
  id: number;
  loanId: string;
  loanAmount: number;
  loanReason: string;
  loanApplyDate: string;
  doctorId: string;
  relationWithPatient: string;
  patientName: string;
  patientPhoneNumber: string;
  patientEmailId: string;
  status: string;
  treatmentAmount: number;
}

interface LoanDetailsByUserIdResponse {
  status: number;
  data: LoanDetailsByUserId;
  attachment: null;
  message: string;
}

export const getLoanDetailsByUserId = async (userId: string): Promise<LoanDetailsByUserId | null> => {
  try {
    const response = await loanApi.get<LoanDetailsByUserIdResponse>('/userDetails/getLoanDetailsByUserId/', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error getting loan details by user ID:', error);
    
    // Handle 404 case specifically
    if (error.response?.status === 404) {
      return null;
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    }
    
    return null;
  }
};

export const getUserAddress = async (userId: string, type?: 'permanent' | 'current'): Promise<UserAddress | null> => {
  try {
    const params: { userId: string; type?: string } = { userId };
    if (type) {
      params.type = type;
    }

    const response = await loanApi.get<UserAddressResponse>('/userDetails/getUserAddress/', {
      params,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Error getting user address:', error);
    
    // Handle 404 case specifically
    if (error.response?.status === 404) {
      return null;
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Invalid request parameters';
      throw new Error(errorMessage);
    }
    
    return null;
  }
};

export const getAllFinDocDistricts = async (): Promise<string[]> => {
  try {
    const response = await loanApi.get<FinDocDistrictsResponse>('/finDoc/allFindocDistricts/', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data.status === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error getting FinDoc districts:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login again.');
    }
    
    // Handle server errors
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    return [];
  }
};

export const saveAddressDetails = async (addressData: SaveAddressDetailsRequest): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  try {
    const response = await loanApi.post<SaveAddressDetailsResponse>(
      '/userDetails/addressDetail/',
      addressData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Address details saved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to save address details'
    };

  } catch (error: any) {
    console.error('Error saving address details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request data';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (error.response.status === 500) {
        const errorMessage = error.response.data?.message || 'Internal server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Handle other status codes
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    }
    
    // Handle non-axios errors
    throw new Error(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
  }
};

// Interface for save loan details request
export interface SaveLoanDetailsRequest {
  userId: string;
  doctorId: string;
  treatmentAmount: number;
  loanAmount: number;
  loanEMI?: number;
  productId?: number;
  internalProductId?: string;
  advanceEmiAmount?: number;
}

// Interface for the actual API request (with integer amounts)
interface SaveLoanDetailsAPIRequest {
  userId: string;
  doctorId: string;
  treatmentAmount: number;
  loanAmount: number;
  loanEMI?: number;
  productId?: number;
  internalProductId?: string;
  advanceEmiAmount?: number;
}

// Interface for save loan details response
interface SaveLoanDetailsResponse {
  status: number;
  data: any;
  attachment: null;
  message: string;
}

// Interface for disbursement data response
export interface DisbursementData {
  userId: string;
  firstName: string;
  mobileNumber: string;
  loanId: string;
  applicationId: string;
  treatmentAmount: number;
  loanAmount: number;
  loanReason: string;
  loanApplyDate: number;
  disburseDate: number;
  patientName: string | null;
  patientPhoneNumber: string | null;
  doctorId: string;
  doctorName: string;
  doctorCode: string;
  clinicName: string;
  productId: string;
  productName: string;
  totalEmi: number;
  advanceEmi: number;
  subventionRate: number;
  advanceEmiAmount: number;
  totalTenure: number;
  effectiveTenure: number;
  netLoanAmount: number;
  subventionExcludingGSt: number;
  subventionIncludingGSt: number;
  gstOnSubvention: number;
  processingFee: number;
  disburseAmount: number;
  nbfcName: string;
  internalProductId: string;
  loanCalculationDetails: {
    apr: number;
    totalTenure: number;
    effectiveTenure: number;
    processingFee: number;
    principal: number;
    reschedule: Array<{
      principal: number;
      emiDate: string;
      month: number;
      emiAmount: number;
      balance: number;
      interest: number;
    }>;
    emiAmount: number;
    subventionExcludingGSt: number;
    interest: number;
    netLoanAmount: number;
    treatmentAmount: number;
    disburseAmount: number;
    subventionIncludingGST: number;
  };
  reportGenerationDate: number;
}

interface DisbursementDataResponse {
  status: number;
  data: DisbursementData | null;
  attachment: any;
  message: string;
}

/**
 * Save loan details for a user
 * @param loanDetails - The loan details to save
 * @returns Promise with the save result
 */
export const saveLoanDetails = async (loanDetails: SaveLoanDetailsRequest): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  try {
    // Convert amounts to integers for the API
    const apiRequest: SaveLoanDetailsAPIRequest = {
      ...loanDetails,
      treatmentAmount: Math.round(loanDetails.treatmentAmount),
      loanAmount: Math.round(loanDetails.loanAmount),
      loanEMI: loanDetails.loanEMI ? Math.round(loanDetails.loanEMI) : undefined,
      productId: loanDetails.productId ? Math.round(loanDetails.productId) : undefined,
      advanceEmiAmount: loanDetails.advanceEmiAmount ? Math.round(loanDetails.advanceEmiAmount) : undefined
    };

    const response = await loanApi.post<SaveLoanDetailsResponse>(
      '/userDetails/saveLoanDetails/',
      apiRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Loan details saved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to save loan details'
    };

  } catch (error: any) {
    console.error('Error saving loan details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request data';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (error.response.status === 500) {
        const errorMessage = error.response.data?.message || 'Internal server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Handle other status codes
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    }
    
    // Handle non-axios errors
    throw new Error(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
  }
};

/**
 * Get disbursement data by loan ID
 * @param loanId - The loan ID to fetch disbursement data for
 * @returns Promise with the disbursement data
 */
export const getDisburseDataByLoanId = async (loanId: string): Promise<{
  success: boolean;
  data?: DisbursementData;
  message: string;
}> => {
  try {
    const response = await loanApi.get<DisbursementDataResponse>('/getDisburseDataByLoanId/', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Disbursement data retrieved successfully'
      };
    }

    // Handle 404 case specifically
    if (response.data.status === 404) {
      return {
        success: false,
        message: response.data.message || 'Disbursement data not found'
      };
    }

    // Handle other error cases
    return {
      success: false,
      message: response.data.message || 'Failed to fetch disbursement data'
    };

  } catch (error: any) {
    console.error('Error getting disbursement data by loan ID:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid loan ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Disbursement data not found for this loan ID.');
      }
      
      if (error.response.status === 500) {
        const errorMessage = error.response.data?.message || 'Internal server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Handle other status codes
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    }
    
    // Handle non-axios errors
    throw new Error(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
  }
};

// Interface for update product detail response
interface UpdateProductDetailResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for update treatment and loan amount response
interface UpdateTreatmentAndLoanAmountResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

/**
 * Update product detail for a loan
 * @param loanId - The loan ID
 * @param productId - The product ID
 * @param changeBy - Who made the change (default: 'user')
 * @returns Promise with the update result
 */
export const updateProductDetail = async (
  loanId: string, 
  productId: string, 
  changeBy: string = 'user'
): Promise<{
  success: boolean;
  data?: string;
  message: string;
}> => {
  try {
    const response = await loanApi.get<UpdateProductDetailResponse>('/updateProductDetail/', {
      params: { loanId, productId, changeBy },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Product detail updated successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to update product detail'
    };

  } catch (error: any) {
    console.error('Error updating product detail:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request parameters';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (error.response.status === 500) {
        const errorMessage = error.response.data?.message || 'Internal server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Handle other status codes
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    }
    
    // Handle non-axios errors
    throw new Error(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
  }
};

/**
 * Update treatment and loan amount for a loan
 * @param loanId - The loan ID
 * @param treatmentAmount - The treatment amount
 * @param loanAmount - The loan amount
 * @param changeBy - Who made the change (default: 'user')
 * @returns Promise with the update result
 */
export const updateTreatmentAndLoanAmount = async (
  loanId: string,
  treatmentAmount: number,
  loanAmount: number,
  changeBy: string = 'user'
): Promise<{
  success: boolean;
  data?: string;
  message: string;
}> => {
  try {
    const response = await loanApi.get<UpdateTreatmentAndLoanAmountResponse>('/updateTreatmentAndLoanAmount/', {
      params: { 
        loanId, 
        treatmentAmount: treatmentAmount.toString(), 
        loanAmount: loanAmount.toString(), 
        changeBy 
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Treatment and loan amount updated successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to update treatment and loan amount'
    };

  } catch (error: any) {
    console.error('Error updating treatment and loan amount:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request parameters';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (error.response.status === 500) {
        const errorMessage = error.response.data?.message || 'Internal server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Handle other status codes
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    }
    
    // Handle non-axios errors
    throw new Error(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
  }
};

export default loanApi;