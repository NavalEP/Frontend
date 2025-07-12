import axios, { AxiosResponse } from 'axios';

// Types
interface SendOtpResponse {
  message: string;
}

interface VerifyOtpResponse {
  message: string;
  token: string;
  phone_number: string;
  doctor_id?: string;
  doctor_name?: string;
}

interface DoctorStaffLoginResponse {
  message: string;
  token: string;
  doctor_id: string;
  doctor_name: string;
}

interface SessionResponse {
  status: string;
  session_id: string;
}

interface MessageResponse {
  status: string;
  session_id: string;
  response: string;
  message?: string;
}

interface SessionDetailsResponse {
  status: string;
  session_id: string;
  phoneNumber: string;
  bureau_decision_details: string | null;
  created_at: string;
  updated_at: string;
  history: Array<{
    type: string;
    content: string;
  }>;
  userId: string;
}

interface ShortlinkResponse {
  status: string;
  long_url: string;
  message?: string;
}

// Base URL for API
const API_BASE_URL = 'https://loanbot.carepay.money/api/v1/agent';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 second timeout (2 minutes)
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Global logout function for token expiration
let logoutCallback: (() => void) | null = null;

// Function to set logout callback from AuthContext
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          throw new Error(error.response.data?.error || error.response.data?.message || 'Invalid request parameters');
        case 401:
          // Check if the error response indicates token expiration
          const errorData = error.response.data;
          const errorMessage = errorData?.message || errorData?.error || errorData?.detail || '';
          
          // Check for various token expiration indicators
          const isTokenExpired = 
            errorMessage.toLowerCase().includes('token has expired') ||
            errorMessage.toLowerCase().includes('token') && errorMessage.toLowerCase().includes('expired') ||
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('invalid token') ||
            errorMessage.toLowerCase().includes('expired token') ||
            errorData?.detail === 'Token has expired' ||
            errorData?.code === 'token_expired';
          
          if (isTokenExpired) {
            console.log('Token expired detected:', errorMessage);
            
            // Use AuthContext logout if available, otherwise fallback to direct logout
            if (logoutCallback) {
              logoutCallback();
            } else {
              // Fallback: Clear authentication data and redirect
              localStorage.removeItem('token');
              localStorage.removeItem('phoneNumber');
              localStorage.removeItem('sessionCount');
              localStorage.removeItem('current_session_id');
              
              // Clear user-specific session IDs
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('session_id_') || key.startsWith('chat_history_')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Redirect to login
              setTimeout(() => {
                window.location.href = '/login';
              }, 100);
            }
            
            throw new Error('Your session has expired. Please login again.');
          } else {
            // For other 401 errors, just throw the error without clearing token
            throw new Error(errorMessage || 'Authentication failed. Please try again.');
          }
        case 404:
          throw new Error('Service not found. Please check the API endpoint.');
        case 429:
          throw new Error('Too many requests. Please wait before trying again.');
        case 500:
          throw new Error(error.response.data?.message || 'Internal server error');
        default:
          throw new Error(error.response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      if (!navigator.onLine) {
        throw new Error('You are offline. Please check your internet connection.');
      }
      throw new Error('No response from server. Please try again later.');
    } else {
      throw new Error('Error setting up request. Please try again.');
    }
  }
);

// API functions
export const sendOtp = async (phoneNumber: string): Promise<AxiosResponse<SendOtpResponse>> => {
  try {
    // Remove trailing slash to match API spec
    return await api.post('/login/send-otp/', { 
      phone_number: phoneNumber.replace(/\D/g, '') // Remove non-digits
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Send OTP Error:', error);
    throw error;
  }
};

export const verifyOtp = async (
  phoneNumber: string, 
  otp: string, 
  doctorId?: string, 
  doctorName?: string
): Promise<AxiosResponse<VerifyOtpResponse>> => {
  const data: { phone_number: string; otp: string; doctorId?: string; doctorName?: string } = {
    phone_number: phoneNumber.replace(/\D/g, ''), // Remove non-digits
    otp: otp.trim(),
  };

  if (doctorId) data.doctorId = doctorId;
  if (doctorName) data.doctorName = doctorName;

  try {
    const response = await api.post('/login/verify-otp/', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const doctorStaffLogin = async (
  doctorCode: string, 
  password: string
): Promise<AxiosResponse<DoctorStaffLoginResponse>> => {
  try {
    const response = await api.post('/login/doctor-staff/', {
      doctor_code: doctorCode.trim(),
      password: password
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store doctor info if provided
      if (response.data.doctor_id) {
        localStorage.setItem('doctorId', response.data.doctor_id);
      }
      if (response.data.doctor_name) {
        localStorage.setItem('doctorName', response.data.doctor_name);
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const createSession = async (): Promise<AxiosResponse<SessionResponse>> => {
  try {
    const response = await api.post('/session/');
    return response;
  } catch (error) {
    throw error;
  }
};

export const sendMessage = async (
  sessionId: string, 
  message: string
): Promise<AxiosResponse<MessageResponse>> => {
  try {
    return await api.post('/message/', { 
      session_id: sessionId,
      message: message.trim()
    });
  } catch (error) {
    throw error;
  }
};

export const getSessionDetails = async (
  sessionId: string
): Promise<AxiosResponse<SessionDetailsResponse>> => {
  try {
    return await api.get(`/session-details/${sessionId}/`);
  } catch (error) {
    throw error;
  }
};

export const getShortlink = async (
  shortCode: string
): Promise<AxiosResponse<ShortlinkResponse>> => {
  try {
    return await api.get(`/s/${shortCode}/`);
  } catch (error) {
    throw error;
  }
};

export default api;