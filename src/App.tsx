import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated } = useAuth();
  
  // Check URL for doctor params on initial load
  useEffect(() => {
    const url = new URL(window.location.href);
    const doctorId = url.searchParams.get('doctorId');
    const doctorName = url.searchParams.get('doctor_name');
    
    if (doctorId && doctorName) {
      // Store doctor info in sessionStorage
      sessionStorage.setItem('doctorId', doctorId);
      sessionStorage.setItem('doctorName', doctorName);
      
      // Clean URL if needed
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/chat" /> : <LoginPage />
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;