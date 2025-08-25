import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLogoutCallback, doctorStaffLogin } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  doctorId: string | null;
  doctorName: string | null;
  sessionCount: number;
  isInitialized: boolean;
  loginRoute: string | null;
  login: (tokenData: { token: string; phone_number?: string; doctor_id?: string; doctor_name?: string }, route?: string) => void;
  logout: () => void;
  incrementSessionCount: () => void;
  performAutoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState<boolean>(false);
  const [loginRoute, setLoginRoute] = useState<string | null>(null);
  const navigate = useNavigate();

  // Utility functions to handle persistent doctor data storage
  const storeDoctorData = (id: string | null, name: string | null) => {
    if (id) {
      localStorage.setItem('doctorId', id);
      localStorage.setItem('doctorId_backup', id); // Backup storage
      sessionStorage.setItem('doctorId', id); // Additional backup
    }
    if (name) {
      localStorage.setItem('doctorName', name);
      localStorage.setItem('doctorName_backup', name); // Backup storage
      sessionStorage.setItem('doctorName', name); // Additional backup
    }
  };

  const retrieveDoctorData = (): { doctorId: string | null; doctorName: string | null } => {
    const doctorId = 
      localStorage.getItem('doctorId') || 
      localStorage.getItem('doctorId_backup') || 
      sessionStorage.getItem('doctorId') || 
      null;
    
    const doctorName = 
      localStorage.getItem('doctorName') || 
      localStorage.getItem('doctorName_backup') || 
      sessionStorage.getItem('doctorName') || 
      null;
    
    return { doctorId, doctorName };
  };

  // Auto-login function that always calls the doctor staff API
  const performAutoLogin = async (): Promise<void> => {
    const autoLoginMerchantCode = localStorage.getItem('autoLogin_merchantCode');
    const autoLoginPassword = localStorage.getItem('autoLogin_password');
    
    if (!autoLoginMerchantCode || !autoLoginPassword || isAutoLoggingIn) {
      console.log('Auto-login skipped: missing credentials or already in progress');
      return;
    }

    setIsAutoLoggingIn(true);
    
    try {
      console.log('Performing auto-login with doctor staff API...');
      console.log('Merchant Code:', autoLoginMerchantCode);
      
      // Always call the doctor staff API to get fresh token and doctor info
      const response = await doctorStaffLogin(autoLoginMerchantCode.trim(), autoLoginPassword);
      
      if (response.data.token) {
        console.log('Auto-login successful, updating doctor information...');
        console.log('New Doctor ID:', response.data.doctor_id);
        console.log('New Doctor Name:', response.data.doctor_name);
        
        // Update doctor information from API response
        const newDoctorId = response.data.doctor_id;
        const newDoctorName = response.data.doctor_name;
        
        // Store the new doctor data
        storeDoctorData(newDoctorId, newDoctorName);
        
        // Update state with new information
        setDoctorId(newDoctorId);
        setDoctorName(newDoctorName);
        setToken(response.data.token);
        setIsAuthenticated(true);
        
        // Store the new token
        localStorage.setItem('token', response.data.token);
        
        // Reset session count for new login
        setSessionCount(0);
        localStorage.setItem('sessionCount', '0');
        
        // Set flag to indicate fresh login
        localStorage.setItem('is_fresh_login', 'true');
        
        // Set login route for doctor staff auto-login
        setLoginRoute('/doctor-login');
        localStorage.setItem('loginRoute', '/doctor-login');
        
        console.log('Auto-login completed successfully');
      } else {
        console.error('Auto-login failed: No token received from API');
        // Clear auto-login credentials if login fails
        localStorage.removeItem('autoLogin_merchantCode');
        localStorage.removeItem('autoLogin_password');
        throw new Error('No authentication token received from server');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      // Clear auto-login credentials if login fails
      localStorage.removeItem('autoLogin_merchantCode');
      localStorage.removeItem('autoLogin_password');
      
      // Re-throw the error so it can be handled by the calling component
      throw error;
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  useEffect(() => {
    // Check local storage for existing auth state
    const storedToken = localStorage.getItem('token');
    const storedPhone = localStorage.getItem('phoneNumber');
    const { doctorId, doctorName } = retrieveDoctorData();
    const storedSessionCount = localStorage.getItem('sessionCount');
    const storedLoginRoute = localStorage.getItem('loginRoute');

    // Always set doctorId and doctorName if they exist in storage, regardless of token status
    if (doctorId) setDoctorId(doctorId);
    if (doctorName) setDoctorName(doctorName);
    if (storedLoginRoute) setLoginRoute(storedLoginRoute);

    // Check if auto-login credentials exist
    const autoLoginMerchantCode = localStorage.getItem('autoLogin_merchantCode');
    const autoLoginPassword = localStorage.getItem('autoLogin_password');

    if (autoLoginMerchantCode && autoLoginPassword) {
      // Perform auto-login immediately
      performAutoLogin();
    } else if (storedToken && storedToken.trim() !== '') {
      setToken(storedToken);
      if (storedPhone) setPhoneNumber(storedPhone);
      setIsAuthenticated(true);
      
      if (storedSessionCount) setSessionCount(parseInt(storedSessionCount, 10));
    } else if (storedToken === '') {
      // If token is empty string, remove it
      localStorage.removeItem('token');
    }
    
    // Mark as initialized after checking localStorage
    setIsInitialized(true);
  }, []);

  // Periodic auto-login check for doctor staff
  useEffect(() => {
    const checkAutoLogin = async () => {
      const autoLoginMerchantCode = localStorage.getItem('autoLogin_merchantCode');
      const autoLoginPassword = localStorage.getItem('autoLogin_password');
      
      // If auto-login credentials exist and we're not currently auto-logging in
      if (autoLoginMerchantCode && autoLoginPassword && !isAutoLoggingIn) {
        console.log('Auto-login credentials found, performing periodic re-login...');
        try {
          await performAutoLogin();
        } catch (error) {
          console.error('Periodic auto-login failed:', error);
          // Don't clear credentials on periodic failure, only on initial failure
        }
      }
    };

    // Check every 5 minutes for auto-login
    const interval = setInterval(checkAutoLogin, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAutoLoggingIn]);

  // Periodic check to ensure token validity and sync with localStorage
  useEffect(() => {
    const checkTokenValidity = () => {
      const storedToken = localStorage.getItem('token');
      
      // Only log out if user is authenticated AND token is missing AND we're not in the middle of a request
      if (isAuthenticated && !storedToken) {
        // Add a small delay to prevent race conditions during page refresh
        setTimeout(() => {
          const tokenAfterDelay = localStorage.getItem('token');
          if (!tokenAfterDelay) {
            console.log('Token still missing after delay, logging out user');
            logout();
          }
        }, 1000);
      }
    };

    // Check immediately and then every 60 seconds (increased from 30 to reduce frequency)
    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Periodic check to ensure doctor data is never lost
  useEffect(() => {
    const checkDoctorDataIntegrity = () => {
      const { doctorId: storedDoctorId, doctorName: storedDoctorName } = retrieveDoctorData();
      
      // If we have stored doctor data but state is null, restore it
      if (storedDoctorId && !doctorId) {
        console.log('Restoring doctorId from storage:', storedDoctorId);
        setDoctorId(storedDoctorId);
      }
      
      if (storedDoctorName && !doctorName) {
        console.log('Restoring doctorName from storage:', storedDoctorName);
        setDoctorName(storedDoctorName);
      }
      
      // Ensure backup storage is always in sync
      if (storedDoctorId || storedDoctorName) {
        storeDoctorData(storedDoctorId, storedDoctorName);
      }
    };

    // Check immediately and then every 10 seconds
    checkDoctorDataIntegrity();
    const interval = setInterval(checkDoctorDataIntegrity, 10000);

    return () => clearInterval(interval);
  }, [doctorId, doctorName]);

  // Auto logout after 10 sessions
  useEffect(() => {
    if (sessionCount >= 10) {
      logout();
    }
    
    // Update localStorage
    if (sessionCount > 0) {
      localStorage.setItem('sessionCount', sessionCount.toString());
    }
  }, [sessionCount]);

  const login = (tokenData: { token: string; phone_number?: string; doctor_id?: string; doctor_name?: string }, route?: string) => {
    const { token, phone_number, doctor_id, doctor_name } = tokenData;
    
    // Clear any existing session data to ensure new session on login
    localStorage.removeItem('current_session_id');
    
    // Clear doctor data if this is a patient login (no doctor_id provided)
    if (!doctor_id) {
      // This is a patient login, clear all doctor data
      localStorage.removeItem('doctorId');
      localStorage.removeItem('doctorId_backup');
      localStorage.removeItem('doctorName');
      localStorage.removeItem('doctorName_backup');
      sessionStorage.removeItem('doctorId');
      sessionStorage.removeItem('doctorName');
      
      // Clear doctor-specific session data
      const existingDoctorId = localStorage.getItem('doctorId') || localStorage.getItem('doctorId_backup');
      if (existingDoctorId) {
        localStorage.removeItem(`session_id_doctor_${existingDoctorId}`);
        // Clear all disabled options and selected treatments for this doctor
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`disabled_options_doctor_${existingDoctorId}_`) || 
              key.startsWith(`selected_treatments_doctor_${existingDoctorId}_`)) {
            localStorage.removeItem(key);
          }
        });
      }
    } else {
      // This is a doctor login, clear session data for this specific doctor
      localStorage.removeItem(`session_id_doctor_${doctor_id}`);
      // Clear all disabled options and selected treatments for this doctor
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`disabled_options_doctor_${doctor_id}_`) || 
            key.startsWith(`selected_treatments_doctor_${doctor_id}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
    
    if (phone_number) {
      localStorage.removeItem(`session_id_${phone_number}`);
    }
    
    // Set flag to indicate fresh login
    localStorage.setItem('is_fresh_login', 'true');
    
    // Save to localStorage
    localStorage.setItem('token', token);
    if (phone_number) {
      localStorage.setItem('phoneNumber', phone_number);
    }
    
    // Handle doctorId and doctorName
    let finalDoctorId = null;
    let finalDoctorName = null;
    
    if (doctor_id) {
      // This is a doctor login
      finalDoctorId = doctor_id;
      finalDoctorName = doctor_name || null;
      
      // Store doctor data with backup mechanisms
      storeDoctorData(finalDoctorId, finalDoctorName);
    } else {
      // This is a patient login - ensure doctor data is cleared
      finalDoctorId = null;
      finalDoctorName = null;
    }
    
    // Update state
    setDoctorId(finalDoctorId);
    setDoctorName(finalDoctorName);
    
    // Reset session count
    localStorage.setItem('sessionCount', '0');
    setSessionCount(0);
    
    // Store login route
    if (route) {
      setLoginRoute(route);
      localStorage.setItem('loginRoute', route);
    }
    
    // Update auth state
    setToken(token);
    if (phone_number) setPhoneNumber(phone_number);
    setIsAuthenticated(true);
    
    // Navigate to chat
    navigate('/chat');
  };

  const logout = () => {
    // Clear user-specific session ID if phone number exists
    if (phoneNumber) {
      localStorage.removeItem(`session_id_${phoneNumber}`);
    }
    
    // Clear doctor-specific session ID if doctorId exists
    if (doctorId) {
      localStorage.removeItem(`session_id_doctor_${doctorId}`);
      
      // Clear all disabled options and selected treatments for this doctor
      const currentSessionId = localStorage.getItem('current_session_id');
      if (currentSessionId) {
        localStorage.removeItem(`disabled_options_doctor_${doctorId}_session_${currentSessionId}`);
        localStorage.removeItem(`selected_treatments_doctor_${doctorId}_session_${currentSessionId}`);
      }
      
      // Clear all localStorage entries that start with disabled_options_doctor_ or selected_treatments_doctor_
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`disabled_options_doctor_${doctorId}_`) || 
            key.startsWith(`selected_treatments_doctor_${doctorId}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear current session ID
    localStorage.removeItem('current_session_id');
    
    // Clear auth data but preserve doctorId and doctorName
    localStorage.removeItem('token');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('sessionCount');
    localStorage.removeItem('loginRoute');
    
    // Get doctor data before clearing state to ensure it persists
    const { doctorId: persistedDoctorId, doctorName: persistedDoctorName } = retrieveDoctorData();
    
    // Update state but preserve doctorId and doctorName
    setToken(null);
    setPhoneNumber(null);
    setIsAuthenticated(false);
    setSessionCount(0);
    setLoginRoute(null);
    
    // Restore doctor data - never allow them to be null
    if (persistedDoctorId) setDoctorId(persistedDoctorId);
    if (persistedDoctorName) setDoctorName(persistedDoctorName);
    
    // Ensure doctor data is stored again after logout
    storeDoctorData(persistedDoctorId, persistedDoctorName);
    
    // Navigate to appropriate login page based on user type
    if (persistedDoctorId) {
      // If doctor data exists, navigate to doctor login
      navigate('/doctor-login');
    } else {
      // Otherwise navigate to patient login
      navigate('/login');
    }
  };

  const incrementSessionCount = () => {
    setSessionCount(prevCount => prevCount + 1);
  };

  // Register logout callback with API service for token expiration handling
  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  const value = {
    isAuthenticated,
    token,
    phoneNumber,
    doctorId,
    doctorName,
    sessionCount,
    isInitialized,
    loginRoute,
    login,
    logout,
    incrementSessionCount,
    performAutoLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};