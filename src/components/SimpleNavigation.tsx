import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Facebook, ShoppingCart, User } from 'lucide-react';
import CartDropdown from './CartDropdown';
import { useCartStore } from '../store/cart';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function SimpleNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { items } = useCartStore();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/JME_fit_purple.png" 
                alt="JMEFit Logo" 
                className="h-10 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/JME_fit_purple.png";
                }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-base font-medium ${isActive('/') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              Home
            </Link>
            <Link to="/about" className={`text-base font-medium ${isActive('/about') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              About
            </Link>
            <Link to="/programs" className={`text-base font-medium ${isActive('/programs') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              Programs
            </Link>
            <Link to="/community" className={`text-base font-medium ${isActive('/community') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              Community
            </Link>
            <Link to="/blog" className={`text-base font-medium ${isActive('/blog') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              Blog
            </Link>
            <Link to="/contact" className={`text-base font-medium ${isActive('/contact') ? 'text-jme-purple' : 'text-gray-700 hover:text-jme-purple'} transition-colors duration-200`}>
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Social Media Icons */}
            <div className="hidden md:flex items-center space-x-2">
              <a href="https://instagram.com/jme_fit" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-jme-purple transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com/jmefit" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-jme-purple transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
            </div>

            {/* Cart Icon */}
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)} 
              className="relative text-gray-700 hover:text-jme-purple transition-colors duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-jme-purple text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            {/* User Profile or Sign In */}
            {user ? (
              <div className="hidden md:block">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-jme-purple/10 to-purple-100 hover:from-jme-purple/20 hover:to-purple-200 text-gray-900 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-jme-purple/10 to-purple-100 hover:from-jme-purple/20 hover:to-purple-200 text-gray-900 transition-all duration-300"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-jme-purple hover:bg-jme-purple hover:text-white transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white z-[9999] overflow-y-auto">
          <div className="px-4 pt-6 pb-20 space-y-6">
            <Link 
              to="/" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/programs" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Programs
            </Link>
            <Link 
              to="/community" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link 
              to="/blog" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              to="/contact" 
              className="block py-3 text-lg font-medium text-center border-b border-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {/* Mobile social links */}
            <div className="flex justify-center space-x-6 pt-4">
              <a href="https://instagram.com/jme_fit" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-jme-purple transition-colors duration-200">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://facebook.com/jmefit" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-jme-purple transition-colors duration-200">
                <Facebook className="h-6 w-6" />
              </a>
            </div>
            
            {/* Mobile user actions */}
            <div className="pt-4">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 text-center bg-jme-purple text-white rounded-lg"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block w-full py-3 text-center bg-jme-purple text-white rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart dropdown */}
      {isCartOpen && <CartDropdown onClose={() => setIsCartOpen(false)} />}
    </header>
  );
}

export default SimpleNavigation;
