import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, doctorId } = useAuth();

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