import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, doctorId, isInitialized } = useAuth();

  // Wait for initialization before making authentication decisions
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on user type
    if (doctorId) {
      return <Navigate to="/doctor-login" />;
    } else {
      return <Navigate to="/login" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;