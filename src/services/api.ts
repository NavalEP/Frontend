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
          localStorage.removeItem('token'); // Clear invalid token
          throw new Error(error.response.data?.message || 'Unauthorized. Please login again.');
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

export default api;