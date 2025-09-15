import axios from 'axios';
import { OCULON_API_BASE_URL } from '../utils/constants';


// Create axios instance for Oculon API
const oculonApi = axios.create({
  baseURL: OCULON_API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for error handling
oculonApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Oculon API Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Error Response:', error.response.data);
      console.error('Error Status:', error.response.status);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    throw error;
  }
);

// Interface for Merchant Score Response
export interface MerchantScoreResponse {
  merchant_id: string;
  merchant_name: string;
  doctor_code: string;
  normalized_score: number;
  raw_score: number;
  evaluated_at: string;
  has_red_flag: boolean;
  has_yellow_flag: boolean;
  risk_category: string;
}

// API function to get merchant score
export const getMerchantScore = async (doctorCode: string): Promise<MerchantScoreResponse> => {
  try {
    console.log('🔍 Oculon API: Fetching merchant score for doctor code:', doctorCode);
    
    const response = await oculonApi.get(`api/merchants/score/?doctor_code=${encodeURIComponent(doctorCode)}`);
    
    console.log('🔍 Oculon API: Merchant score response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('🔍 Oculon API: Error fetching merchant score via proxy:', error);
    
    // Fallback: Try direct API call if proxy fails
    try {
      console.log('🔍 Oculon API: Trying direct API call as fallback...');
      const directResponse = await axios.get(
        `https://oculon.carepay.money/api/merchants/score/?doctor_code=${encodeURIComponent(doctorCode)}`,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('🔍 Oculon API: Direct API call successful:', directResponse.data);
      return directResponse.data;
    } catch (directError) {
      console.error('🔍 Oculon API: Direct API call also failed:', directError);
      throw new Error('Unable to fetch merchant score. Please check your internet connection and try again.');
    }
  }
};

// Helper function to check if DO download is allowed based on risk category
export const isDODownloadAllowed = (riskCategory: string): boolean => {
  return riskCategory === 'A';
};

// Helper function to get risk category description
export const getRiskCategoryDescription = (riskCategory: string): string => {
  switch (riskCategory) {
    case 'A':
      return 'Low Risk - DO Download Allowed';
    case 'B':
      return 'Medium Risk - DO Download Restricted';
    case 'C':
      return 'High Risk - DO Download Restricted';
    case 'D':
      return 'Very High Risk - DO Download Restricted';
    default:
      return 'Unknown Risk Category';
  }
};

export default oculonApi;
