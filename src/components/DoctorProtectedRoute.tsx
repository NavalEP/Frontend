import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DoctorProtectedRouteProps {
  children: React.ReactNode;
}

const DoctorProtectedRoute: React.FC<DoctorProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, doctorId, isInitialized } = useAuth();

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if user is authenticated and has doctorId (doctor login)
  if (!isAuthenticated || !doctorId) {
    // Redirect to doctor login if not authenticated or not a doctor
    return <Navigate to="/doctor-login" replace />;
  }

  // User is authenticated and has doctorId, allow access
  return <>{children}</>;
};

export default DoctorProtectedRoute;
