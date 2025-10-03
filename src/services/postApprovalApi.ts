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
  status?: number;
  data?: any;
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

// Interface for initiate agreement API response
export interface InitiateAgreementResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for initiate agreement API function return type
export interface InitiateAgreementResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for agreement URL data
export interface AgreementUrlData {
  agreementUrl: string;
  kfsUrl: string;
}

// Interface for get agreement URL API response
export interface GetAgreementUrlResponse {
  status: number;
  data: AgreementUrlData;
  attachment: null;
  message: string;
}

// Interface for get agreement URL API function return type
export interface GetAgreementUrlResult {
  success: boolean;
  data?: AgreementUrlData;
  message: string;
}

// Interface for consent API request payload
export interface ConsentRequestPayload {
  loanId: string;
  latitude: string;
  longitude: string;
}

// Interface for account info data
export interface AccountInfoData {
  userId: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  ifSalariedAccount: boolean | null;
  nameAsBankAccount: string;
  ifVerified: boolean;
  accountType: string;
}

// Interface for account info API response
export interface AccountInfoResponse {
  status: number;
  data: AccountInfoData;
  attachment: null;
  message: string;
}

// Interface for account info API function return type
export interface AccountInfoResult {
  success: boolean;
  data?: AccountInfoData;
  message: string;
}

// Interface for add account details request payload
export interface AddAccountDetailsPayload {
  userId: string;
  accountNumber: string;
  accountType: string;
  bankBranch: string;
  bankName: string;
  formStatus: string;
  ifscCode: string;
  nameAsBankAccount: string;
}

// Interface for add account details API response
export interface AddAccountDetailsResponse {
  status: number;
  data: AccountInfoData;
  attachment: null;
  message: string;
}

// Interface for add account details API function return type
export interface AddAccountDetailsResult {
  success: boolean;
  data?: AccountInfoData;
  message: string;
}

// Interface for penny drop API response
export interface PennyDropResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for penny drop API function return type
export interface PennyDropResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for digio mandate bank detail data
export interface DigioMandateBankDetailData {
  id: number;
  bankId: string;
  name: string;
  ifscPrefix: string;
  active: boolean;
  primaryBank: boolean;
  routingCode: string;
  esignMandate: boolean;
  apiMandate: boolean;
  physicalMandate: boolean;
  allowedAuthSubType: string[];
  pennyLess: boolean;
}

// Interface for digio mandate bank detail API response
export interface DigioMandateBankDetailResponse {
  status: number;
  data: DigioMandateBankDetailData;
  attachment: null;
  message: string;
}

// Interface for digio mandate bank detail API function return type
export interface DigioMandateBankDetailResult {
  success: boolean;
  data?: DigioMandateBankDetailData;
  message: string;
}

// Interface for user loan and product detail data
export interface UserLoanAndProductDetailData {
  // This interface will be defined based on the actual response structure
  // Since the response was not provided, using a generic structure
  [key: string]: any;
}

// Interface for user loan and product detail API response
export interface UserLoanAndProductDetailResponse {
  status: number;
  data: UserLoanAndProductDetailData;
  attachment: null;
  message: string;
}

// Interface for user loan and product detail API function return type
export interface UserLoanAndProductDetailResult {
  success: boolean;
  data?: UserLoanAndProductDetailData;
  message: string;
}

// Interface for access token data
export interface AccessTokenData {
  valid_till: string;
  created_at: string;
  id: string;
  entity_id: string;
}

// Interface for mandate details data
export interface MandateDetailsData {
  scheme_ref_number: string;
  auth_type: string;
  first_collection_date: string;
  customer_identifier: string;
  maximum_amount: number;
  customer_account_number: string;
  customer_name: string;
  is_recurring: boolean;
  final_collection_date: string;
  customer_ref_number: string;
  frequency: string;
}

// Interface for mandate data (parsed from JSON string)
export interface MandateData {
  access_token: AccessTokenData;
  mandate_details: MandateDetailsData;
  authentication_url: string;
  id: string;
  state: string;
  status: string;
}

// Interface for create mandate request data
export interface CreateMandateRequestData {
  id: string;
  loanId: string;
  mandateId: string;
  umrn: string | null;
  state: string;
  status: string;
  createdAt: string | null;
  validTill: number;
  data: string; // JSON string that needs to be parsed
  addedOn: number;
  updatedOn: string | null;
  mandateType: string;
  authenticationUrl: string;
  currentStage: string | null;
  message: string | null;
  npciTxnID: string | null;
  phoneNumber: string;
}

// Interface for create mandate request payload
export interface CreateMandateRequestPayload {
  loanId: string;
  mandateType: string;
}

// Interface for create mandate request API response
export interface CreateMandateRequestResponse {
  status: number;
  data: CreateMandateRequestData;
  attachment: null;
  message: string;
}

// Interface for create mandate request API function return type
export interface CreateMandateRequestResult {
  success: boolean;
  data?: CreateMandateRequestData;
  parsedData?: MandateData;
  message: string;
}

// Interface for consent API response
export interface ConsentResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for consent API function return type
export interface ConsentResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for save mandate SDK details request payload
export interface SaveMandateSdkDetailsPayload {
  status: 'success' | 'failure';
  digio_doc_id?: string;
  message?: string;
  npci_txn_id?: string;
  error_code?: string;
  method?: string;
}

// Interface for save mandate SDK details API response
export interface SaveMandateSdkDetailsResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for save mandate SDK details API function return type
export interface SaveMandateSdkDetailsResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for send OTP API request payload
export interface SendOtpRequestPayload {
  loanId: string;
}

// Interface for send OTP API response
export interface SendOtpResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for send OTP API function return type
export interface SendOtpResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for verify OTP API request payload
export interface VerifyOtpRequestPayload {
  loanId: string;
  otpCode: string;
  agreement_text: string;
  agreement_title: string;
  agreement_version: string;
}

// Interface for verify OTP API response
export interface VerifyOtpResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for verify OTP API function return type
export interface VerifyOtpResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for DigiLocker URL creation API response
export interface DigiLockerUrlResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for DigiLocker URL creation API function return type
export interface DigiLockerUrlResult {
  success: boolean;
  data?: string;
  message: string;
}

// Interface for add activity API response
export interface AddActivityResponse {
  status: number;
  data: string;
  attachment: null;
  message: string;
}

// Interface for add activity API function return type
export interface AddActivityResult {
  success: boolean;
  data?: string;
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

    const response = await carePayApi.get<FinDocApiResponse>('/finDoc/callFinDocApisdisable', {
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
      status: response.data.status,
      message: response.data.message || 'Failed to verify Aadhaar OTP',
      data: response.data.data || response.data
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
        return {
          success: false,
          status: error.response.status,
          message: error.response.data?.message || 'Internal server error',
          data: error.response.data?.data || error.response.data
        };
      }
      
      // Handle other status codes
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data?.data || error.response.data
      };
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
 * Initiate agreement for a loan
 * @param loanId - The loan ID to initiate agreement for
 * @param language - The language for the agreement
 * @returns Promise with the initiate agreement result
 */
export const initiateAgreement = async (loanId: string, language: string = 'English'): Promise<InitiateAgreementResult> => {
  try {
    console.log('Initiating agreement for loan ID:', loanId, 'with language:', language);

    const response = await carePayApi.post<InitiateAgreementResponse>('/api/click-wrap/initiateAgreement', {
      loanId,
      language
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Initiate agreement response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Agreement initiated successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to initiate agreement'
    };

  } catch (error: any) {
    console.error('Error initiating agreement:', error);
    
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
        throw new Error('Agreement service not found.');
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
 * Get agreement URL for a loan
 * @param loanId - The loan ID to get agreement URL for
 * @returns Promise with the agreement URL result
 */
export const getAgreementUrl = async (loanId: string): Promise<GetAgreementUrlResult> => {
  try {
    console.log('Getting agreement URL for loan ID:', loanId);

    const response = await carePayApi.get<GetAgreementUrlResponse>('/api/click-wrap/getAgreementUrl', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Get agreement URL response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Agreement URL retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve agreement URL'
    };

  } catch (error: any) {
    console.error('Error getting agreement URL:', error);
    
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
        throw new Error('Agreement URL not found for this loan ID.');
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
 * Record user consent for agreement
 * @param payload - The consent payload containing loanId, latitude, and longitude
 * @returns Promise with the consent result
 */
export const recordConsent = async (payload: ConsentRequestPayload): Promise<ConsentResult> => {
  try {
    console.log('Recording consent for loan ID:', payload.loanId);

    const response = await carePayApi.post<ConsentResponse>('/api/click-wrap/consent', payload, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Record consent response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User consent recorded successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to record consent'
    };

  } catch (error: any) {
    console.error('Error recording consent:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid consent data provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Consent service not found.');
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
 * Send OTP for agreement verification
 * @param payload - The send OTP payload containing loanId
 * @returns Promise with the send OTP result
 */
export const sendAgreementOtp = async (payload: SendOtpRequestPayload): Promise<SendOtpResult> => {
  try {
    console.log('Sending agreement OTP for loan ID:', payload.loanId);

    const response = await carePayApi.post<SendOtpResponse>('/api/click-wrap/send-otp', payload, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Send agreement OTP response:', response.data);

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
    console.error('Error sending agreement OTP:', error);
    
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
 * Verify OTP for agreement
 * @param payload - The verify OTP payload containing loanId, otpCode, and agreement details
 * @returns Promise with the verify OTP result
 */
export const verifyAgreementOtp = async (payload: VerifyOtpRequestPayload): Promise<VerifyOtpResult> => {
  try {
    console.log('Verifying agreement OTP for loan ID:', payload.loanId);

    const response = await carePayApi.post<VerifyOtpResponse>('/api/click-wrap/verify-otp', payload, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Verify agreement OTP response:', response.data);

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
    console.error('Error verifying agreement OTP:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid OTP or agreement data provided';
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
 * Get account info by user ID
 * @param userId - The user ID to get account info for
 * @returns Promise with the account info result
 */
export const getAccountInfoByUserId = async (userId: string): Promise<AccountInfoResult> => {
  try {
    console.log('Fetching account info for user ID:', userId);

    const response = await carePayApi.get<AccountInfoResponse>('/userDetails/getAccountInfoByUserId', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Account info response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Account info retrieved successfully'
      };
    }

    // Handle non-200 status responses (like 500 status)
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve account info'
    };

  } catch (error: any) {
    console.error('Error getting account info:', error);
    
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
        throw new Error('Account info not found for this user ID.');
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
 * Add account details for a user
 * @param payload - The account details payload
 * @returns Promise with the add account details result
 */
export const addAccountDetails = async (payload: AddAccountDetailsPayload): Promise<AddAccountDetailsResult> => {
  try {
    console.log('Adding account details for user ID:', payload.userId);

    const response = await carePayApi.post<AddAccountDetailsResponse>('/userDetails/addAccountDetails', payload, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Add account details response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Account details added successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to add account details'
    };

  } catch (error: any) {
    console.error('Error adding account details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid account details provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Account details service not found.');
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
 * Perform penny drop verification
 * @param loanId - The loan ID for penny drop
 * @param userId - The user ID for penny drop
 * @returns Promise with the penny drop result
 */
export const pennyDrop = async (loanId: string, userId: string): Promise<PennyDropResult> => {
  try {
    console.log('Performing penny drop for loan ID:', loanId, 'and user ID:', userId);

    const response = await carePayApi.get<PennyDropResponse>('/pennyDrop', {
      params: { loanId, userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Penny drop response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Penny drop completed successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to complete penny drop'
    };

  } catch (error: any) {
    console.error('Error performing penny drop:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid loan ID or user ID provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Penny drop service not found.');
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
 * Get Digio mandate bank details for a user
 * @param userId - The user ID to get mandate bank details for
 * @returns Promise with the Digio mandate bank detail result
 */
export const getDigioMandateBankDetail = async (userId: string): Promise<DigioMandateBankDetailResult> => {
  try {
    console.log('Fetching Digio mandate bank details for user ID:', userId);

    const response = await carePayApi.get<DigioMandateBankDetailResponse>('/getDigioMandateBankDetail', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Digio mandate bank detail response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Digio mandate bank details retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve Digio mandate bank details'
    };

  } catch (error: any) {
    console.error('Error getting Digio mandate bank details:', error);
    
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
        throw new Error('Digio mandate bank details not found for this user ID.');
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
 * Get user loan and product details
 * @param userId - The user ID to get loan and product details for
 * @returns Promise with the user loan and product detail result
 */
export const getUserLoanAndProductDetail = async (userId: string): Promise<UserLoanAndProductDetailResult> => {
  try {
    console.log('Fetching user loan and product details for user ID:', userId);

    const response = await carePayApi.get<UserLoanAndProductDetailResponse>('/userDetails/getUserLoanAndProductDetail', {
      params: { userId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('User loan and product detail response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User loan and product details retrieved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to retrieve user loan and product details'
    };

  } catch (error: any) {
    console.error('Error getting user loan and product details:', error);
    
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
        throw new Error('User loan and product details not found for this user ID.');
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
 * Create mandate request
 * @param loanId - The loan ID for the mandate request
 * @param mandateType - The type of mandate (upi, api, etc.)
 * @returns Promise with the create mandate request result
 */
export const createMandateRequest = async (loanId: string, mandateType: string): Promise<CreateMandateRequestResult> => {
  try {
    console.log('Creating mandate request for loan ID:', loanId, 'with mandate type:', mandateType);

    const response = await carePayApi.get<CreateMandateRequestResponse>('/createMandateRequest', {
      params: { 
        loanId,
        mandateType 
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Create mandate request response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      let parsedData: MandateData | undefined;
      
      // Parse the JSON data string if it exists
      if (response.data.data.data) {
        try {
          parsedData = JSON.parse(response.data.data.data);
        } catch (parseError) {
          console.warn('Failed to parse mandate data JSON:', parseError);
        }
      }

      return {
        success: true,
        data: response.data.data,
        parsedData,
        message: response.data.message || 'Mandate request created successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to create mandate request'
    };

  } catch (error: any) {
    console.error('Error creating mandate request:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid loan ID or mandate type provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Mandate request service not found.');
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
 * Save mandate SDK details for Digio integration
 * @param payload - The payload containing mandate SDK details
 * @returns Promise with the save mandate SDK details result
 */
export const saveMandateSdkDetails = async (payload: SaveMandateSdkDetailsPayload): Promise<SaveMandateSdkDetailsResult> => {
  try {
    console.log('Saving mandate SDK details:', payload);

    const response = await carePayApi.get<SaveMandateSdkDetailsResponse>('/saveMandateSdkDetails', {
      params: payload,
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Save mandate SDK details response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Mandate SDK details saved successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to save mandate SDK details'
    };

  } catch (error: any) {
    console.error('Error saving mandate SDK details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid mandate SDK details provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Mandate SDK details service not found.');
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
 * Initialize global Digio URL parameter handler
 * Call this function in your main App component to automatically handle Digio SDK responses
 * @param onSuccess - Optional callback for successful mandate setup
 * @param onError - Optional callback for failed mandate setup
 */
export const initializeDigioHandler = (
  onSuccess?: (result: SaveMandateSdkDetailsResult) => void,
  onError?: (result: SaveMandateSdkDetailsResult) => void
) => {
  const handleDigioResponse = async () => {
    try {
      const result = await handleDigioUrlParameters();
      
      if (result) {
        if (result.success) {
          console.log('Global Digio handler - Success:', result);
          onSuccess?.(result);
        } else {
          console.log('Global Digio handler - Error:', result);
          onError?.(result);
        }
      }
    } catch (error: any) {
      console.error('Global Digio handler error:', error);
      const errorResult: SaveMandateSdkDetailsResult = {
        success: false,
        message: error.message || 'Failed to handle Digio response'
      };
      onError?.(errorResult);
    }
  };

  // Handle URL parameters on page load
  handleDigioResponse();
};

/**
 * Extract Digio SDK parameters from URL and automatically save them
 * This function should be called when the page loads or when returning from Digio SDK
 * @returns Promise with the save result
 */
export const handleDigioUrlParameters = async (): Promise<SaveMandateSdkDetailsResult | null> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract parameters from URL
    const status = urlParams.get('status');
    const digioDocId = urlParams.get('digio_doc_id');
    const message = urlParams.get('message');
    const npciTxnId = urlParams.get('npci_txn_id');
    const errorCode = urlParams.get('error_code');
    const method = urlParams.get('method');
    
    // Check if we have any Digio-related parameters
    if (!status && !digioDocId && !npciTxnId && !errorCode) {
      console.log('No Digio SDK parameters found in URL');
      return null;
    }
    
    console.log('Found Digio SDK parameters in URL:', {
      status,
      digioDocId,
      message,
      npciTxnId,
      errorCode,
      method
    });
    
    // Prepare payload for API call
    const payload: SaveMandateSdkDetailsPayload = {
      status: (status as 'success' | 'failure') || (errorCode ? 'failure' : 'success'),
      ...(digioDocId && { digio_doc_id: digioDocId }),
      ...(message && { message: decodeURIComponent(message) }),
      ...(npciTxnId && { npci_txn_id: npciTxnId }),
      ...(errorCode && { error_code: errorCode }),
      ...(method && { method })
    };
    
    // Save the parameters using our API
    const result = await saveMandateSdkDetails(payload);
    
    if (result.success) {
      console.log('Successfully saved Digio SDK parameters:', result.data);
      
      // Clean up URL parameters after successful save
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      console.error('Failed to save Digio SDK parameters:', result.message);
    }
    
    return result;
    
  } catch (error: any) {
    console.error('Error handling Digio URL parameters:', error);
    return {
      success: false,
      message: error.message || 'Failed to handle Digio URL parameters'
    };
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

/**
 * Create DigiLocker URL for KYC verification
 * @param loanId - The loan ID for which to create DigiLocker URL
 * @returns Promise with the DigiLocker URL result
 */
export const createDigiLockerUrl = async (loanId: string): Promise<DigiLockerUrlResult> => {
  try {
    console.log('Creating DigiLocker URL for loan ID:', loanId);

    const response = await carePayApi.get<DigiLockerUrlResponse>('/signzy/digilocker/createUrl', {
      params: { loanId },
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('DigiLocker URL creation response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'DigiLocker URL created successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to create DigiLocker URL'
    };

  } catch (error: any) {
    console.error('Error creating DigiLocker URL:', error);
    
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
        throw new Error('DigiLocker URL creation service not found.');
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
 * Add activity for a user
 * @param userId - The user ID to add activity for
 * @param activity - The activity type to add
 * @param type - The type of activity (optional)
 * @returns Promise with the add activity result
 */
export const addActivity = async (userId: string, activity: string, type?: string): Promise<AddActivityResult> => {
  try {
    console.log('Adding activity for user ID:', userId, 'activity:', activity, 'type:', type);

    const params: Record<string, string> = {
      userId,
      activity
    };

    if (type) {
      params.type = type;
    }

    const response = await carePayApi.get<AddActivityResponse>('/addActivity', {
      params,
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Add activity response:', response.data);

    // Check if the response is successful
    if (response.data.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Activity added successfully'
      };
    }

    // Handle non-200 status responses
    return {
      success: false,
      message: response.data.message || 'Failed to add activity'
    };

  } catch (error: any) {
    console.error('Error adding activity:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (!error.response) {
        throw new Error('Unable to connect to the CarePay backend server. Please check your internet connection.');
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid parameters provided';
        throw new Error(`Bad Request: ${errorMessage}`);
      }
      
      if (error.response.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      if (error.response.status === 404) {
        throw new Error('Activity service not found.');
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

export default carePayApi;
