import axios from 'axios';
import { CAREPAY_API_BASE_URL } from '../utils/constants';

// Create axios instance for CarePay API
const carePayApi = axios.create({
  baseURL: CAREPAY_API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interface for post-approval status data
export interface PostApprovalStatusData {
  selfie: boolean;
  agreement_setup: boolean;
  auto_pay: boolean;
  aadhaar_verified: boolean;
}

// Interface for the complete API response
export interface PostApprovalStatusResponse {
  status: number;
  data: PostApprovalStatusData;
  attachment: null;
  message: string;
}

// Interface for the API function return type
export interface PostApprovalStatusResult {
  success: boolean;
  data?: PostApprovalStatusData;
  message: string;
}

// Interface for zip code details data
export interface ZipCodeDetailsData {
  branchName: string | null;
  branchCode: string | null;
  destrict: string | null;
  status: string;
  bankAddress: string | null;
  bankCode: string | null;
  ifsc: string | null;
  contact: number;
  city: string | null;
  state: string | null;
}

// Interface for the zip code API response
export interface ZipCodeDetailsResponse {
  branchName: string | null;
  branchCode: string | null;
  destrict: string | null;
  status: string;
  bankAddress: string | null;
  bankCode: string | null;
  ifsc: string | null;
  contact: number;
  city: string | null;
  state: string | null;
}

// Interface for the zip code API function return type
export interface ZipCodeDetailsResult {
  success: boolean;
  data?: ZipCodeDetailsData;
  message: string;
}

// Interface for FinDoc API response
export interface FinDocApiResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for FinDoc API function return type
export interface FinDocApiResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for doctor category data
export interface DoctorCategoryData {
  category: string;
}

// Interface for doctor category API response
export interface DoctorCategoryResponse {
  status: number;
  data: DoctorCategoryData;
  attachment: null;
  message: string;
}

// Interface for doctor category API function return type
export interface DoctorCategoryResult {
  success: boolean;
  data?: DoctorCategoryData;
  message: string;
}

// Interface for BRE decision data
export interface BreDecisionData {
  loanId: string;
  selectedMicroBRE: string;
  selectedLender: string;
  executionCreated: boolean;
  lenderDecision: string;
  limit: number;
}

// Interface for BRE decision API response
export interface BreDecisionResponse {
  status: number;
  data: BreDecisionData;
  attachment: null;
  message: string;
}

// Interface for BRE decision API function return type
export interface BreDecisionResult {
  success: boolean;
  data?: BreDecisionData;
  message: string;
}

// Interface for FIBE response detail data
export interface FibeResponseDetailData {
  id: number;
  userId: string;
  loanId: string;
  customerRefId: string;
  orderId: string;
  treatmentProofLogs: any;
  redirectionUrl: any;
  bitlyUrl: string;
  transactionId: string;
  sanctionMaxLimit: number;
  sanctionMinLimit: number;
  offerData: any;
  leadStatus: string;
  breStatus: string;
  merchantPackageId: any;
}

// Interface for FIBE response detail API response
export interface FibeResponseDetailResponse {
  status: number;
  data: FibeResponseDetailData;
  attachment: null;
  message: string;
}

// Interface for FIBE response detail API function return type
export interface FibeResponseDetailResult {
  success: boolean;
  data?: FibeResponseDetailData;
  message: string;
}

// Interface for EMI calculation product data
export interface EmiCalculationProductData {
  max_limit: number;
  interestRate: number;
  isPaidDownPayment: boolean;
  ncemiFlag: boolean;
  productDetail: any;
  min_limit: number;
  downPaymentValue?: number;
  loan_flag: boolean;
  processing_fees: number;
  downPaymentType?: string;
  loan_amount: number;
  downPaymentAmount: number;
  interest_amount: number;
  stamp_duty: number;
  merchant_package_id: string;
  subventionRate: number;
  isMerchantCollectsDp: boolean;
  cust_id: number;
  downPaymentTenure: number;
  tenure: number;
}

// Interface for EMI calculation data
export interface EmiCalculationData {
  carePayProductId: string;
  product: EmiCalculationProductData;
  eligible: boolean;
  customerRefId: string;
  additionalDownPayment: number;
}

// Interface for EMI calculation API response
export interface EmiCalculationResponse {
  status: number;
  data: EmiCalculationData[];
  attachment: null;
  message: string;
}

// Interface for EMI calculation API function return type
export interface EmiCalculationResult {
  success: boolean;
  data?: EmiCalculationData[];
  message: string;
}

// Interface for lock tenure data
export interface LockTenureData {
  statusMessage: string;
  statusCode: number;
}

// Interface for lock tenure API response
export interface LockTenureResponse {
  status: number;
  data: LockTenureData;
  attachment: null;
  message: string;
}

// Interface for lock tenure API function return type
export interface LockTenureResult {
  success: boolean;
  data?: LockTenureData;
  message: string;
}

/**
 * Get post-approval status for a loan
 * @param loanId - The loan ID to check post-approval status for
 * @returns Promise with the post-approval status result
 */
export const getPostApprovalStatus = async (loanId: string): Promise<PostApprovalStatusResult> => {
  try {
    console.log('Fetching post-approval status for loan ID:', loanId);

    const response = await carePayApi.get<PostApprovalStatusResponse>('/getPostApprovalStatus', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Post-approval status response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Post-approval status retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve post-approval status'
    };

  } catch (error: any) {
    console.error('Error getting post-approval status:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
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
        throw new Error('Post-approval status not found for this loan ID.');
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
 * Get zip code details for a given code
 * @param code - The zip code to get details for
 * @param type - The type of code (default: 'zip')
 * @returns Promise with the zip code details result
 */
export const getZipCodeDetails = async (code: string, type: string = 'zip'): Promise<ZipCodeDetailsResult> => {
  try {
    console.log('Fetching zip code details for code:', code, 'type:', type);

    const response = await carePayApi.get<ZipCodeDetailsResponse>('/userDetails/codeDetail', {
      params: { code, type },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Zip code details response:', response.data);

    // Check if the response is successful
    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data,
        message: 'Zip code details retrieved successfully'
      };
    }

    // Handle non-success status responses
    return {
      success: false,
      message: 'Failed to retrieve zip code details'
    };

  } catch (error: any) {
    console.error('Error getting zip code details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid zip code provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Zip code details not found for this code.');
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
 * Call FinDoc APIs for a loan
 * @param loanId - The loan ID to execute FinDoc APIs for
 * @returns Promise with the FinDoc API result
 */
export const callFinDocApis = async (loanId: string): Promise<FinDocApiResult> => {
  try {
    console.log('Calling FinDoc APIs for loan ID:', loanId);

    const response = await carePayApi.get<FinDocApiResponse>('/finDoc/callFinDocApis', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('FinDoc APIs response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'FinDoc APIs executed successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to execute FinDoc APIs'
    };

  } catch (error: any) {
    console.error('Error calling FinDoc APIs:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
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
        throw new Error('FinDoc APIs not found for this loan ID.');
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
 * Get doctor category by doctor code
 * @param doctorCode - The doctor code to get category for
 * @returns Promise with the doctor category result
 */
export const getDoctorCategory = async (doctorCode: string): Promise<DoctorCategoryResult> => {
  try {
    console.log('Fetching doctor category for doctor code:', doctorCode);

    const response = await carePayApi.get<DoctorCategoryResponse>('/getDoctorCategory', {
      params: { doctorCode },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Doctor category response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Doctor category retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve doctor category'
    };

  } catch (error: any) {
    console.error('Error getting doctor category:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid doctor code provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Doctor category not found for this doctor code.');
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
 * Get BRE decision for a loan
 * @param loanId - The loan ID to get BRE decision for
 * @returns Promise with the BRE decision result
 */
export const getBreDecision = async (loanId: string): Promise<BreDecisionResult> => {
  try {
    console.log('Fetching BRE decision for loan ID:', loanId);

    const response = await carePayApi.get<BreDecisionResponse>('/getBreDecision', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('BRE decision response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'BRE decision retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve BRE decision'
    };

  } catch (error: any) {
    console.error('Error getting BRE decision:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
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
        throw new Error('BRE decision not found for this loan ID.');
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
 * Get FIBE response detail for a loan
 * @param loanId - The loan ID to get FIBE response detail for
 * @returns Promise with the FIBE response detail result
 */
export const getFibeResponseDetail = async (loanId: string): Promise<FibeResponseDetailResult> => {
  try {
    console.log('Fetching FIBE response detail for loan ID:', loanId);

    const response = await carePayApi.get<FibeResponseDetailResponse>('/getFibeResponseDetail', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('FIBE response detail response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'FIBE response detail retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve FIBE response detail'
    };

  } catch (error: any) {
    console.error('Error getting FIBE response detail:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
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
        throw new Error('FIBE response detail not found for this loan ID.');
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
 * Calculate EMI for a loan
 * @param loanId - The loan ID to calculate EMI for
 * @returns Promise with the EMI calculation result
 */
export const calculateEmi = async (loanId: string): Promise<EmiCalculationResult> => {
  try {
    console.log('Calculating EMI for loan ID:', loanId);

    const response = await carePayApi.get<EmiCalculationResponse>('/v1/calculateEmi', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('EMI calculation response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'EMI calculated successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to calculate EMI'
    };

  } catch (error: any) {
    console.error('Error calculating EMI:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
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
        throw new Error('EMI calculation not found for this loan ID.');
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
 * Lock tenure for a loan
 * @param loanId - The loan ID to lock tenure for
 * @param merchantPackageId - The merchant package ID
 * @returns Promise with the lock tenure result
 */
export const lockTenure = async (loanId: string, merchantPackageId: string): Promise<LockTenureResult> => {
  try {
    console.log('Locking tenure for loan ID:', loanId, 'and merchant package ID:', merchantPackageId);

    const response = await carePayApi.get<LockTenureResponse>('/v1/lockTenure', {
      params: { 
        loanId,
        merchantPackageId 
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Lock tenure response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Tenure locked successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to lock tenure'
    };

  } catch (error: any) {
    console.error('Error locking tenure:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid loan ID or merchant package ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Loan or merchant package not found.');
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
 * Check if all post-approval requirements are completed
 * @param statusData - The post-approval status data
 * @returns boolean indicating if all requirements are met
 */
export const isPostApprovalComplete = (statusData: PostApprovalStatusData): boolean => {
  return statusData.selfie && 
         statusData.agreement_setup && 
         statusData.auto_pay && 
         statusData.aadhaar_verified;
};

/**
 * Get the completion percentage for post-approval requirements
 * @param statusData - The post-approval status data
 * @returns number between 0 and 100 representing completion percentage
 */
export const getPostApprovalCompletionPercentage = (statusData: PostApprovalStatusData): number => {
  const requirements = [
    statusData.selfie,
    statusData.agreement_setup,
    statusData.auto_pay,
    statusData.aadhaar_verified
  ];
  
  const completedCount = requirements.filter(Boolean).length;
  return Math.round((completedCount / requirements.length) * 100);
};

/**
 * Get a list of pending post-approval requirements
 * @param statusData - The post-approval status data
 * @returns array of pending requirement names
 */
export const getPendingPostApprovalRequirements = (statusData: PostApprovalStatusData): string[] => {
  const pending: string[] = [];
  
  if (!statusData.selfie) {
    pending.push('Selfie Verification');
  }
  
  if (!statusData.agreement_setup) {
    pending.push('Agreement Setup');
  }
  
  if (!statusData.auto_pay) {
    pending.push('Auto Pay Setup');
  }
  
  if (!statusData.aadhaar_verified) {
    pending.push('Aadhaar Verification');
  }
  
  return pending;
};

/**
 * Get a list of completed post-approval requirements
 * @param statusData - The post-approval status data
 * @returns array of completed requirement names
 */
export const getCompletedPostApprovalRequirements = (statusData: PostApprovalStatusData): string[] => {
  const completed: string[] = [];
  
  if (statusData.selfie) {
    completed.push('Selfie Verification');
  }
  
  if (statusData.agreement_setup) {
    completed.push('Agreement Setup');
  }
  
  if (statusData.auto_pay) {
    completed.push('Auto Pay Setup');
  }
  
  if (statusData.aadhaar_verified) {
    completed.push('Aadhaar Verification');
  }
  
  return completed;
};

export default carePayApi;
