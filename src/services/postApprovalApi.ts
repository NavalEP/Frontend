import axios from 'axios';

// Base URL configuration for CarePay backend
const CAREPAY_API_BASE_URL = 'https://backend.carepay.money';

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
