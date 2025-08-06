import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import Modal from './Modal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, logout, doctorName, sessionCount } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDoctorLoginPage = location.pathname === '/doctor-login';
  const isChatPage = location.pathname === '/chat';
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Add/remove login-page class to body for scrolling
  useEffect(() => {
    if (isLoginPage || isDoctorLoginPage) {
      document.body.classList.add('login-page');
    } else {
      document.body.classList.remove('login-page');
    }

    return () => {
      document.body.classList.remove('login-page');
    };
  }, [isLoginPage, isDoctorLoginPage]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Header - Hide on chat page */}
      <header className="bg-white sticky top-0 z-50 mb-6">
        <div
          className={`${
            isAuthenticated && !isLoginPage
              ? 'h-12'
              : 'h-16'
          } flex items-center justify-between px-4`}
        >
          <div className="flex items-center">
            <img 
              src="/images/Careena-Logo-cropped.png" 
              alt="Careena" 
              className={`${
                isAuthenticated && !isLoginPage
                  ? 'h-8 max-h-8'
                  : 'h-12 max-h-16'
              } w-auto object-contain ml-2`}
            />
          </div>
          
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 w-full mx-auto px-0 ${isChatPage ? 'h-screen' : 'min-h-[calc(100vh-5rem)]'}`}>
        {children}
      </main>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
      >
        Are you sure you want to logout?
      </Modal>
    </div>
  );
};

export default Layout;