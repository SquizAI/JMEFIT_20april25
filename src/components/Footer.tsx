
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import Images from '../assets/images';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img 
              src={Images.jmeFitPurple} 
              alt="JMEFit Training"
              className="h-28 w-auto mb-4"
            />
            <p className="text-sm text-gray-400">
              Transform your body and mind through expert-guided fitness and nutrition programs.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/programs" className="hover:text-white transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link to="/monthly-app" className="hover:text-white transition-colors">
                  Monthly App
                </Link>
              </li>
              <li>
                <Link to="/nutrition-programs" className="hover:text-white transition-colors">
                  Nutrition Programs
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-white transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/programs#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://www.instagram.com/jmefit_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E1306C] hover:text-[#C13584] transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://facebook.com/jmefit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#1877F2] hover:text-[#166FE5] transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="mailto:contact@jmefit.com"
                className="hover:text-white transition-colors"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Sign up for our newsletter to receive updates and exclusive offers.
            </p>
            <form className="mt-4">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-l-md bg-gray-800 border border-gray-700 focus:outline-none focus:border-jme-purple"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-jme-purple text-white rounded-r-md hover:bg-purple-700 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} JMEFit Training. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;