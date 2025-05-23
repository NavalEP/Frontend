import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  doctorId: string | null;
  doctorName: string | null;
  sessionCount: number;
  login: (tokenData: { token: string; phone_number: string; doctor_id?: string; doctor_name?: string }) => void;
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
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage for existing auth state
    const storedToken = localStorage.getItem('token');
    const storedPhone = localStorage.getItem('phoneNumber');
    const storedDoctorId = sessionStorage.getItem('doctorId') || localStorage.getItem('doctorId');
    const storedDoctorName = sessionStorage.getItem('doctorName') || localStorage.getItem('doctorName');
    const storedSessionCount = localStorage.getItem('sessionCount');

    if (storedToken) {
      setToken(storedToken);
      setPhoneNumber(storedPhone);
      setIsAuthenticated(true);
      
      if (storedDoctorId) setDoctorId(storedDoctorId);
      if (storedDoctorName) setDoctorName(storedDoctorName);
      if (storedSessionCount) setSessionCount(parseInt(storedSessionCount, 10));
    }
  }, []);

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

  const login = (tokenData: { token: string; phone_number: string; doctor_id?: string; doctor_name?: string }) => {
    const { token, phone_number, doctor_id, doctor_name } = tokenData;
    
    // Save to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('phoneNumber', phone_number);
    
    if (doctor_id) {
      localStorage.setItem('doctorId', doctor_id);
      setDoctorId(doctor_id);
    } else {
      // Try to get from sessionStorage
      const storedDoctorId = sessionStorage.getItem('doctorId');
      if (storedDoctorId) {
        localStorage.setItem('doctorId', storedDoctorId);
        setDoctorId(storedDoctorId);
      }
    }
    
    if (doctor_name) {
      localStorage.setItem('doctorName', doctor_name);
      setDoctorName(doctor_name);
    } else {
      // Try to get from sessionStorage
      const storedDoctorName = sessionStorage.getItem('doctorName');
      if (storedDoctorName) {
        localStorage.setItem('doctorName', storedDoctorName);
        setDoctorName(storedDoctorName);
      }
    }
    
    // Reset session count
    localStorage.setItem('sessionCount', '0');
    setSessionCount(0);
    
    // Update state
    setToken(token);
    setPhoneNumber(phone_number);
    setIsAuthenticated(true);
    
    // Navigate to chat
    navigate('/chat');
  };

  const logout = () => {
    // Clear user-specific session ID if phone number exists
    if (phoneNumber) {
      localStorage.removeItem(`session_id_${phoneNumber}`);
    }
    
    // Clear current session ID
    localStorage.removeItem('current_session_id');
    
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('doctorName');
    localStorage.removeItem('sessionCount');
    
    // Update state
    setToken(null);
    setPhoneNumber(null);
    setDoctorId(null);
    setDoctorName(null);
    setIsAuthenticated(false);
    setSessionCount(0);
    
    // Navigate to login
    navigate('/login');
  };

  const incrementSessionCount = () => {
    setSessionCount(prevCount => prevCount + 1);
  };

  const value = {
    isAuthenticated,
    token,
    phoneNumber,
    doctorId,
    doctorName,
    sessionCount,
    login,
    logout,
    incrementSessionCount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};