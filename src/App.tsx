import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DoctorStaffLoginPage from './pages/DoctorStaffLoginPage';
import ChatPage from './pages/ChatPage';
import LoanTransactionsPage from './pages/LoanTransactionsPage';
import BusinessOverviewPage from './pages/BusinessOverviewPage';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorProtectedRoute from './components/DoctorProtectedRoute';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated, isInitialized } = useAuth();
  
  // Utility function to store doctor data persistently
  const storeDoctorDataPersistently = (id: string, name: string) => {
    // Store in multiple places to ensure persistence
    localStorage.setItem('doctorId', id);
    localStorage.setItem('doctorId_backup', id);
    localStorage.setItem('doctorName', name);
    localStorage.setItem('doctorName_backup', name);
    sessionStorage.setItem('doctorId', id);
    sessionStorage.setItem('doctorName', name);
  };
  
  // Check URL for doctor params on initial load
  useEffect(() => {
    const url = new URL(window.location.href);
    const doctorId = url.searchParams.get('doctorId');
    const doctorName = url.searchParams.get('doctor_name');
    const merchantCode = url.searchParams.get('merchantCode');
    const password = url.searchParams.get('password');
    
    // Handle both doctorId/doctor_name and merchantCode/password URL parameters
    if (doctorId && doctorName) {
      // Store doctor info persistently - never allow them to be lost
      storeDoctorDataPersistently(doctorId, doctorName);
      
      // Clean URL if needed
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } else if (merchantCode && password) {
      // Handle merchantCode/password parameters - these will be used for auto-login
      localStorage.setItem('autoLogin_merchantCode', merchantCode);
      localStorage.setItem('autoLogin_password', password);
      
      // Clean URL if needed
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  return (
    <Routes>
      <Route path="/doctor-login" element={
        <Layout>
          {!isInitialized ? (
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/chat" />
          ) : (
            <DoctorStaffLoginPage />
          )}
        </Layout>
      } />
      <Route path="/login" element={
        <Layout>
          {!isInitialized ? (
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/chat" />
          ) : (
            <LoginPage />
          )}
        </Layout>
      } />
      
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/loan-transactions" element={
        <DoctorProtectedRoute>
          <LoanTransactionsPage />
        </DoctorProtectedRoute>
      } />
      <Route path="/business-overview" element={
        <DoctorProtectedRoute>
          <BusinessOverviewPage />
        </DoctorProtectedRoute>
      } />
      <Route path="/" element={
        <Layout>
          {!isInitialized ? (
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <Navigate to={isAuthenticated ? "/chat" : "/doctor-login"} />
          )}
        </Layout>
      } />
      <Route path="*" element={<Navigate to="/doctor-login" />} />
    </Routes>
  );
}

export default App;