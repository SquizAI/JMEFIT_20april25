import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Facebook, ShoppingCart, User, LogOut } from 'lucide-react';
import CartDropdown from './CartDropdown';
import { useCartStore } from '../store/cart';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { items } = useCartStore();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Simple toggle for mobile menu
  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
    // Toggle body scroll
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);
  
  // Clean up body scroll lock when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center h-16 py-2 transition-transform duration-300 hover:scale-105 animate-fadeIn">
              <img 
                src="/JME_fit_black_purple.png"
                alt="JmeFit Training"
                className="h-12 w-auto object-contain" 
                style={{ aspectRatio: 'auto' }}
                onError={(e) => {
                  // Fallback if the image fails to load
                  const imgElement = e.currentTarget;
                  imgElement.onerror = null; // Prevent infinite loop
                  imgElement.src = 'https://jmefit.netlify.app/JME_fit_black_purple.png';
                }}
              />
            </Link>
          </div>
        
          <div className="hidden md:flex md:items-center space-x-6">
            <Link
              to="/"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Home</span>
            </Link>
            <Link
              to="/programs"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/programs')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Programs</span>
            </Link>
            <Link
              to="/monthly-app"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/monthly-app')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Monthly App</span>
            </Link>
            <Link
              to="/nutrition-programs"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/nutrition-programs')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Nutrition Programs</span>
            </Link>
            <Link
              to="/shop"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/shop')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Shop</span>
            </Link>
            <Link
              to="/community"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/community')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Community</span>
            </Link>
            <Link
              to="/blog"
              className={`relative text-sm font-medium transition-all duration-300 group py-2 px-3 rounded-md ${
                isActive('/blog')
                  ? 'text-[#FF1493] bg-pink-50/50'
                  : 'text-gray-600 hover:text-[#FF1493] hover:bg-pink-50/30'
              }`}
            >
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#FF1493] transition-all duration-300 group-hover:w-full" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-y-[-1px]">Blog</span>
            </Link>
            <div className="flex items-center space-x-6 ml-8">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-jme-purple/10 to-purple-100 hover:from-jme-purple/20 hover:to-purple-200 text-gray-900 transition-all duration-300 transform hover:scale-105"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.user_metadata.full_name || 'Account'}</span>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg py-2 z-50 border border-purple-100 animate-scaleIn">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-jme-purple/10 hover:to-purple-100 transition-colors duration-200 hover:translate-x-1"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          await signOut();
                          setIsProfileOpen(false);
                          toast.success('Signed out successfully');
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center hover:translate-x-1 transition-transform duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-jme-purple transition-all duration-300 link-hover-effect"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/programs"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-jme-purple to-purple-600 hover:from-purple-600 hover:to-jme-purple transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg btn-hover-effect"
                  >
                    Get Started
                  </Link>
                </div>
              )}  
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="text-jme-purple hover:text-purple-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-jme-purple to-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-md">
                      {items.length}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {isCartOpen && (
                  <CartDropdown onClose={() => setIsCartOpen(false)} />
                )}
              </div>
              
              <a 
                href="https://www.instagram.com/jmefit_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E1306C] hover:text-[#C13584] transition-all duration-300 transform hover:scale-110 hover:rotate-3"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com/jmefit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#1877F2] hover:text-[#166FE5] transition-all duration-300 transform hover:scale-110 hover:rotate-3"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <div className="flex items-center gap-2">
              <Link
                to="/checkout"
                className="relative p-2 rounded-md text-jme-purple hover:text-white hover:bg-jme-purple transition-colors duration-200"
                aria-label="Go to checkout"
              >
                <ShoppingCart className="w-6 h-6" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-jme-purple hover:text-white hover:bg-jme-purple transition-all duration-300 transform hover:scale-105 btn-hover-effect"
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
      
    {/* Mobile Menu - Full Screen Overlay */}
    {isOpen && (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto md:hidden animate-fadeIn" style={{ animationDuration: '300ms' }}>
        <div className="p-4 border-b flex justify-between items-center">
          <Link to="/" className="flex items-center" onClick={toggleMobileMenu}>
            <img 
              src="/JME_fit_black_purple.png" 
              alt="JmeFit Training" 
              className="h-10 w-auto" 
            />
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:rotate-90"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
          
          <div className="p-4 space-y-4 animate-slideDown" style={{ animationDuration: '400ms' }}>
            <Link
              to="/"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '50ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 50ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Home</span>
            </Link>
            <Link
              to="/programs"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/programs') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '100ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 100ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Programs</span>
            </Link>
            <Link
              to="/monthly-app"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/monthly-app') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '150ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 150ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Monthly App</span>
            </Link>
            <Link
              to="/nutrition-programs"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/nutrition-programs') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '200ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 200ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Nutrition Programs</span>
            </Link>
            <Link
              to="/shop"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/shop') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '250ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 250ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Shop</span>
            </Link>
            <Link
              to="/community"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/community') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '300ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 300ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Community</span>
            </Link>
            <Link
              to="/blog"
              onClick={toggleMobileMenu}
              className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-300 ${isActive('/blog') ? 'bg-gradient-to-r from-jme-purple to-pink-500 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100 hover:translate-x-2'}`}
              style={{ animationDelay: '350ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 350ms' }}
            >
              <span className="relative inline-block transition-transform duration-300 group-hover:translate-y-[-1px]">Blog</span>
            </Link>
          </div>
          
          <div className="p-4 border-t animate-fadeIn" style={{ animationDelay: '400ms', opacity: 0, animation: 'fadeIn 0.5s ease forwards 400ms' }}>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-gray-50">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-base font-medium text-gray-900">
                    {user.user_metadata.full_name || 'Account'}
                  </span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={toggleMobileMenu}
                  className="block w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 flex items-center hover:translate-x-2"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    toggleMobileMenu();
                    toast.success('Signed out successfully');
                  }}
                  className="block w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 flex items-center hover:translate-x-2"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/auth"
                  onClick={toggleMobileMenu}
                  className="block w-full px-4 py-3 text-center text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 font-medium hover:shadow-md"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={toggleMobileMenu}
                  className="block w-full px-4 py-3 text-center text-white bg-gradient-to-r from-jme-purple to-pink-600 hover:from-pink-600 hover:to-jme-purple rounded-lg transition-all shadow-md font-medium btn-hover-effect"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-center space-x-6 animate-fadeIn" style={{ animationDelay: '450ms' }}>
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
      )}
    </>
  );
}

export default Navigation;
