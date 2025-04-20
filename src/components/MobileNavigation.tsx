import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Instagram, Facebook, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <div 
      className={`fixed inset-0 bg-white z-[9999] overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
        <Link to="/" onClick={onClose} className="flex items-center">
          <img src="/JME_fit_black_purple.png" alt="JMEFIT Logo" className="h-10" />
        </Link>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/programs"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/programs') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Programs
            </Link>
          </li>
          <li>
            <Link
              to="/monthly-app"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/monthly-app') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Monthly App
            </Link>
          </li>
          <li>
            <Link
              to="/nutrition-programs"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/nutrition-programs') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Nutrition Programs
            </Link>
          </li>
          <li>
            <Link
              to="/community"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/community') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Community
            </Link>
          </li>
          <li>
            <Link
              to="/shop"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/shop') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Shop
            </Link>
          </li>
          <li>
            <Link
              to="/blog"
              onClick={onClose}
              className={`block px-4 py-3 rounded-lg text-lg font-medium ${
                isActive('/blog') ? 'bg-jme-purple text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              Blog
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="border-t p-4 mt-4">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-gray-50">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-base font-medium text-gray-900">
                {user.user_metadata.full_name || 'Account'}
              </span>
            </div>
            <Link
              to="/dashboard"
              onClick={onClose}
              className="block w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center"
            >
              <User className="w-4 h-4 inline mr-2" />
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await signOut();
                onClose();
                toast.success('Signed out successfully');
              }}
              className="block w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center"
            >
              <LogOut className="w-4 h-4 inline mr-2" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <Link
              to="/auth"
              onClick={onClose}
              className="block w-full px-4 py-3 text-center text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              onClick={onClose}
              className="block w-full px-4 py-3 text-center text-white bg-gradient-to-r from-jme-purple to-pink-600 hover:from-pink-600 hover:to-jme-purple rounded-lg transition-all shadow-md font-medium"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
      
      <div className="border-t p-4 flex justify-center space-x-6">
        <a 
          href="https://www.instagram.com/jmefit_/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#E1306C] hover:text-[#C13584] transition-all p-2"
        >
          <Instagram className="w-6 h-6" />
        </a>
        <a 
          href="https://facebook.com/jmefit" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#1877F2] hover:text-[#166FE5] transition-all p-2"
        >
          <Facebook className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
}

export default MobileNavigation;
