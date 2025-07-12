import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLogoutCallback } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  doctorId: string | null;
  doctorName: string | null;
  sessionCount: number;
  isInitialized: boolean;
  login: (tokenData: { token: string; phone_number?: string; doctor_id?: string; doctor_name?: string }) => void;
  logout: () => void;
  incrementSessionCount: () => void;
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

  useEffect(() => {
    // Check local storage for existing auth state
    const storedToken = localStorage.getItem('token');
    const storedPhone = localStorage.getItem('phoneNumber');
    const { doctorId, doctorName } = retrieveDoctorData();
    const storedSessionCount = localStorage.getItem('sessionCount');

    // Always set doctorId and doctorName if they exist in storage, regardless of token status
    if (doctorId) setDoctorId(doctorId);
    if (doctorName) setDoctorName(doctorName);

    if (storedToken && storedToken.trim() !== '') {
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

  const login = (tokenData: { token: string; phone_number?: string; doctor_id?: string; doctor_name?: string }) => {
    const { token, phone_number, doctor_id, doctor_name } = tokenData;
    
    // Save to localStorage
    localStorage.setItem('token', token);
    if (phone_number) {
      localStorage.setItem('phoneNumber', phone_number);
    }
    
    // Handle doctorId and doctorName - never allow them to be null
    let finalDoctorId = doctorId;
    let finalDoctorName = doctorName;
    
    if (doctor_id) {
      finalDoctorId = doctor_id;
    } else {
      // Get existing doctor data if not provided in login response
      const existing = retrieveDoctorData();
      if (existing.doctorId) {
        finalDoctorId = existing.doctorId;
      }
    }
    
    if (doctor_name) {
      finalDoctorName = doctor_name;
    } else {
      // Get existing doctor data if not provided in login response
      const existing = retrieveDoctorData();
      if (existing.doctorName) {
        finalDoctorName = existing.doctorName;
      }
    }
    
    // Store doctor data with backup mechanisms
    storeDoctorData(finalDoctorId, finalDoctorName);
    
    // Update state
    if (finalDoctorId) setDoctorId(finalDoctorId);
    if (finalDoctorName) setDoctorName(finalDoctorName);
    
    // Reset session count
    localStorage.setItem('sessionCount', '0');
    setSessionCount(0);
    
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
    }
    
    // Clear current session ID
    localStorage.removeItem('current_session_id');
    
    // Clear auth data but preserve doctorId and doctorName
    localStorage.removeItem('token');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('sessionCount');
    
    // Get doctor data before clearing state to ensure it persists
    const { doctorId: persistedDoctorId, doctorName: persistedDoctorName } = retrieveDoctorData();
    
    // Update state but preserve doctorId and doctorName
    setToken(null);
    setPhoneNumber(null);
    setIsAuthenticated(false);
    setSessionCount(0);
    
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
    login,
    logout,
    incrementSessionCount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};