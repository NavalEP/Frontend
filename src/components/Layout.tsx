import React, { useState } from 'react';
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/images/Careena-Logo-cropped.png" 
              alt="Careena" 
              className="h-12 max-h-16 w-auto object-contain ml-2"
            />
          </div>
          
          {isAuthenticated && !isLoginPage && (
            <div className="flex items-center space-x-2">
              {doctorName && (
                <span className="text-sm text-gray-700">
                  Dr. {doctorName.replace('_', ' ')}
                </span>
              )}
              <div className="text-sm text-gray-700">
                {sessionCount}/10
              </div>
              <button 
                onClick={handleLogoutClick}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full mx-auto px-0 sm:px-4 sm:px-6 lg:px-8 h-[calc(100vh-5rem)]">
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