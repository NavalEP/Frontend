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

// Interface for Aadhaar verification data
export interface AadhaarVerificationData {
  verified: boolean;
}

// Interface for Aadhaar verification API response
export interface AadhaarVerificationResponse {
  status: number;
  data: boolean;
  attachment: null;
  message: string;
}

// Interface for Aadhaar verification API function return type
export interface AadhaarVerificationResult {
  success: boolean;
  data?: boolean;
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

// Interface for OTP send API response
export interface OtpSendResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for OTP send API function return type
export interface OtpSendResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for OTP verify API response
export interface OtpVerifyResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for OTP verify API function return type
export interface OtpVerifyResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for user basic detail data
export interface UserBasicDetailData {
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  loginType: string | null;
  dateOfBirth: string;
  maritalStatus: string;
  emailId: string;
  nameOfReference: string | null;
  mobileNumber: number;
  gender: string;
  religion: string | null;
  imageUrl: string | null;
  mobileVerified: boolean;
  loginDate: number;
  loginDevice: string | null;
  formStatus: string;
  referenceCode: string | null;
  sourceOfInfoPlateform: string | null;
  nachStatus: boolean;
  alternateNumber: string | null;
  verified: boolean;
  loanFrom: string;
  mailSubscribe: boolean;
  crifDecision: string | null;
  recentLogin: number;
  emailVerified: boolean;
  saveDate: string | null;
  important: string | null;
  panNo: string;
  panCardName: string | null;
  completionStatus: boolean;
  fatherName: string | null;
  referenceRelation: string | null;
  referenceNumber: string | null;
  referenceName: string | null;
  consent: boolean;
  consentTimestamp: number;
  aadhaarNo: string;
  motherName: string | null;
  typeOfEmail: string | null;
  educationLevel: string;
  aadhaarVerified: boolean;
  nameAsPerPan: string;
  nameAsPerAadhaar: string | null;
  testLead: boolean;
  activationStatus: string | null;
  mother_name: string | null;
  type_of_email: string | null;
}

// Interface for user basic detail API response
export interface UserBasicDetailResponse {
  status: number;
  data: UserBasicDetailData;
  attachment: null;
  message: string;
}

// Interface for user basic detail API function return type
export interface UserBasicDetailResult {
  success: boolean;
  data?: UserBasicDetailData;
  message: string;
}

// Interface for user details by user ID data
export interface UserDetailsByUserIdData {
  userId: string;
  firstName: string;
  middleName: string | null;
  fatherName: string | null;
  lastName: string | null;
  loginType: string | null;
  dateOfBirth: string;
  maritalStatus: string | null;
  emailId: string | null;
  nameOfReference: string | null;
  mobileNumber: number;
  gender: string;
  religion: string | null;
  imageUrl: string | null;
  mobileVerified: boolean;
  loginDate: string;
  loginDevice: string | null;
  formStatus: string;
  referenceCode: string | null;
  sourceOfInfoPlateform: string | null;
  nachStatus: boolean;
  alternateNumber: string | null;
  verified: boolean;
  loanFrom: string;
  mailSubscribe: boolean;
  crifDecision: string | null;
  createdDate: string | null;
  emailVerified: boolean;
  saveDate: string | null;
  important: string | null;
  panNo: string;
  panCardName: string | null;
  referenceRelation: string | null;
  referenceNumber: string | null;
  referenceName: string | null;
  aadhaarNo: string | null;
  motherName: string | null;
  typeOfEmail: string | null;
  educationLevel: string | null;
  aadhaarVerified: boolean;
  nameAsPerPan: string;
  nameAsPerAadhaar: string | null;
}

// Interface for user details by user ID API response
export interface UserDetailsByUserIdResponse {
  status: number;
  data: UserDetailsByUserIdData;
  attachment: null;
  message: string;
}

// Interface for user details by user ID API function return type
export interface UserDetailsByUserIdResult {
  success: boolean;
  data?: UserDetailsByUserIdData;
  message: string;
}

// Interface for Aadhaar OTP send API response
export interface AadhaarOtpSendResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for Aadhaar OTP send API function return type
export interface AadhaarOtpSendResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for Aadhaar OTP submit API response
export interface AadhaarOtpSubmitResponse {
  status: number;
  data: object;
  attachment: null;
  message: string;
}

// Interface for Aadhaar OTP submit API function return type
export interface AadhaarOtpSubmitResult {
  success: boolean;
  data?: object;
  message: string;
}

// Interface for save photograph API response
export interface SavePhotographResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for save photograph API function return type
export interface SavePhotographResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for advance liveliness data
export interface AdvanceLivelinessData {
  imageUrl: string;
  imageQualityAttributes: {
    result: {
      quality: string;
      score: number;
    };
  };
  faceValid: boolean;
  faceAttributes: {
    faceCover: {
      isFaceCovered: boolean;
      faceGears: any[];
    };
    faceEmotion: {
      emotion: string;
      confidence: number;
    };
    age: number;
    faceOrientation: string;
    faceToBgRatio: number;
    faceMask: {
      found: boolean;
      confidence: number;
    };
    headTillShoulders: boolean;
  };
  liveliness: {
    liveliness: boolean;
    score: number;
  };
  isBackgroundSolid: boolean;
  status: string;
}

// Interface for advance liveliness API response
export interface AdvanceLivelinessResponse {
  status: number;
  data: AdvanceLivelinessData;
  attachment: null;
  message: string;
}

// Interface for advance liveliness API function return type
export interface AdvanceLivelinessResult {
  success: boolean;
  data?: AdvanceLivelinessData;
  message: string;
}

// Interface for face match data
export interface FaceMatchData {
  result: {
    verified: boolean;
    message: string;
    matchPercentage: string;
    maskDetections: any[];
  };
}

// Interface for face match API response
export interface FaceMatchResponse {
  status: number;
  data: FaceMatchData;
  attachment: null;
  message: string;
}

// Interface for face match API function return type
export interface FaceMatchResult {
  success: boolean;
  data?: FaceMatchData;
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
 * Check Aadhaar verification status for a user
 * @param userId - The user ID to check Aadhaar verification for
 * @returns Promise with the Aadhaar verification result
 */
export const checkAadhaarVerification = async (userId: string): Promise<AadhaarVerificationResult> => {
  try {
    console.log('Checking Aadhaar verification for user ID:', userId);

    const response = await carePayApi.get<AadhaarVerificationResponse>('/checkAadhaarVerification', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Aadhaar verification response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Aadhaar verification status retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve Aadhaar verification status'
    };

  } catch (error: any) {
    console.error('Error checking Aadhaar verification:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Aadhaar verification status not found for this user ID.');
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
 * Send OTP to mobile number
 * @param mobile - The mobile number to send OTP to
 * @returns Promise with the OTP send result
 */
export const sendOtpToMobile = async (mobile: string): Promise<OtpSendResult> => {
  try {
    console.log('Sending OTP to mobile number:', mobile);

    const response = await carePayApi.post<OtpSendResponse>(`/userDetails/sendOtpToMobile?mobile=${mobile}`, {}, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('OTP send response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'OTP sent successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to send OTP'
    };

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid mobile number provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('OTP service not found.');
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
 * Verify OTP for mobile number
 * @param mobile - The mobile number
 * @param otp - The OTP to verify
 * @returns Promise with the OTP verify result
 */
export const verifyOtp = async (mobile: string, otp: string): Promise<OtpVerifyResult> => {
  try {
    console.log('Verifying OTP for mobile number:', mobile);

    const response = await carePayApi.post<OtpVerifyResponse>('/userDetails/verifyOtp', {}, {
      params: { mobile, otp },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('OTP verify response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'OTP verified successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to verify OTP'
    };

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid mobile number or OTP provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('OTP verification service not found.');
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
 * Get user basic details
 * @param payload - The payload containing aadhaarNo, mobileNumber, and userId
 * @returns Promise with the user basic detail result
 */
export const getUserBasicDetail = async (payload: {
  aadhaarNo: string;
  mobileNumber: number;
  userId: string;
}): Promise<UserBasicDetailResult> => {
  try {
    console.log('Fetching user basic details for user ID:', payload.userId);

    const response = await carePayApi.post<UserBasicDetailResponse>('/userDetails/basicDetail', payload, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('User basic detail response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User basic details retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve user basic details'
    };

  } catch (error: any) {
    console.error('Error getting user basic details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid payload provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('User basic details not found.');
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
 * Get user details by user ID
 * @param userId - The user ID to get details for
 * @returns Promise with the user details result
 */
export const getUserDetailsByUserId = async (userId: string): Promise<UserDetailsByUserIdResult> => {
  try {
    console.log('Fetching user details for user ID:', userId);

    const response = await carePayApi.get<UserDetailsByUserIdResponse>('/userDetails/getUserDetailsByUserId', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('User details by user ID response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User details retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve user details'
    };

  } catch (error: any) {
    console.error('Error getting user details by user ID:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('User details not found for this user ID.');
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
 * Send Aadhaar OTP to user
 * @param userId - The user ID to send Aadhaar OTP to
 * @returns Promise with the Aadhaar OTP send result
 */
export const sendAadhaarOtp = async (userId: string): Promise<AadhaarOtpSendResult> => {
  try {
    console.log('Sending Aadhaar OTP for user ID:', userId);

    const response = await carePayApi.get<AadhaarOtpSendResponse>('/aadhaarVerify/sendOtp', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Aadhaar OTP send response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Aadhaar OTP sent successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to send Aadhaar OTP'
    };

  } catch (error: any) {
    console.error('Error sending Aadhaar OTP:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Aadhaar OTP service not found.');
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
 * Submit Aadhaar OTP for verification
 * @param userId - The user ID
 * @param otp - The OTP to verify
 * @returns Promise with the Aadhaar OTP submit result
 */
export const submitAadhaarOtp = async (userId: string, otp: string): Promise<AadhaarOtpSubmitResult> => {
  try {
    console.log('Submitting Aadhaar OTP for user ID:', userId);

    const response = await carePayApi.get<AadhaarOtpSubmitResponse>('/aadhaarVerify/submitOtp', {
      params: { userId, otp },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Aadhaar OTP submit response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Aadhaar OTP verified successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to verify Aadhaar OTP'
    };

  } catch (error: any) {
    console.error('Error submitting Aadhaar OTP:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID or OTP provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Aadhaar OTP verification service not found.');
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
 * Save photograph for user
 * @param formData - The form data containing the photograph
 * @returns Promise with the save photograph result
 */
export const savePhotograph = async (formData: FormData): Promise<SavePhotographResult> => {
  try {
    console.log('Saving photograph');

    const response = await carePayApi.post<SavePhotographResponse>('/savePhotograph', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    });

    console.log('Save photograph response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Photograph saved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to save photograph'
    };

  } catch (error: any) {
    console.error('Error saving photograph:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid photograph data provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Photograph service not found.');
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
 * Check advance liveliness for user
 * @param userId - The user ID to check liveliness for
 * @returns Promise with the advance liveliness result
 */
export const checkAdvanceLiveliness = async (userId: string): Promise<AdvanceLivelinessResult> => {
  try {
    console.log('Checking advance liveliness for user ID:', userId);

    const response = await carePayApi.get<AdvanceLivelinessResponse>('/advanceLiveliness', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Advance liveliness response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Advance liveliness checked successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to check advance liveliness'
    };

  } catch (error: any) {
    console.error('Error checking advance liveliness:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Advance liveliness service not found.');
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
 * Check face match for user
 * @param userId - The user ID to check face match for
 * @returns Promise with the face match result
 */
export const checkFaceMatch = async (userId: string): Promise<FaceMatchResult> => {
  try {
    console.log('Checking face match for user ID:', userId);

    const response = await carePayApi.get<FaceMatchResponse>('/faceMatch', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Face match response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Face match checked successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to check face match'
    };

  } catch (error: any) {
    console.error('Error checking face match:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Face match service not found.');
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
