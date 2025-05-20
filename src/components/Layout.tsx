import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary-600" />
            <h1 className="ml-2 text-xl font-semibold text-gray-900">CarePay loan assistant</h1>
          </div>
          
          {isAuthenticated && !isLoginPage && (
            <div className="flex items-center">
              {doctorName && (
                <span className="text-sm text-gray-700 mr-4">
                  Dr. {doctorName.replace('_', ' ')}
                </span>
              )}
              <div className="text-sm text-gray-700 mr-4">
                Sessions: {sessionCount}/10
              </div>
              <button 
                onClick={handleLogoutClick}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CarePay Healthcare Services. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm logout"
      >
        Are you sure you want to logout?
      </Modal>
    </div>
  );
};

export default Layout;