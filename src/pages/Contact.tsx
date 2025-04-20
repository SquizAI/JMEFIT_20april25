
import { Instagram, Facebook, Mail, MapPin, Phone, Linkedin } from 'lucide-react';
import SEO from '../components/SEO';

function Contact() {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <SEO 
        title="Contact Jaime" 
        description="Get in touch with Jaime and the JMEFit team for questions about training programs, nutrition plans, or general inquiries."
      />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-jme-cyan/20 via-jme-purple/20 to-jme-cyan/20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-jme-cyan to-jme-purple bg-clip-text text-transparent">Get in Touch</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions about my programs or want to connect? I'm here to help you achieve your fitness goals!
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Contact Info & Social Media */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10">
            <h2 className="text-3xl font-bold mb-8 text-jme-cyan">Connect With Me</h2>
            
            {/* Contact Information */}
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="bg-jme-purple/20 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-jme-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email</h3>
                  <a href="mailto:info@jmefit.com" className="text-gray-300 hover:text-jme-cyan transition-colors">
                    info@jmefit.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-jme-purple/20 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-jme-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Location</h3>
                  <p className="text-gray-300">Columbus, GA</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-jme-purple/20 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-jme-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Business Hours</h3>
                  <p className="text-gray-300">8am - 7pm EST</p>
                </div>
              </div>
            </div>
            
            {/* Social Media Links */}
            <h3 className="text-2xl font-bold mb-6">Follow Me</h3>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://www.instagram.com/jmefit_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl duration-300"
              >
                <Instagram className="w-8 h-8 text-white" />
              </a>
              
              <a 
                href="https://www.facebook.com/Jaime.Tharpe/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl duration-300"
              >
                <Facebook className="w-8 h-8 text-white" />
              </a>
              
              <a 
                href="https://twitter.com/JMEFIT_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-gray-800 to-black p-4 rounded-xl hover:from-gray-700 hover:to-gray-900 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                </svg>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/jaime-tharpe-b5485114a/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 rounded-xl hover:from-blue-600 hover:to-blue-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl duration-300"
              >
                <Linkedin className="w-8 h-8 text-white" />
              </a>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-jme-cyan/30 to-jme-purple/30 rounded-2xl transform rotate-3 scale-105"></div>
            <div className="relative overflow-hidden rounded-2xl border-4 border-white/20 shadow-2xl">
              <img 
                src="/JMEFIT_photo.png" 
                alt="Jaime - Fitness Coach" 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-3xl font-bold mb-2">Jaime</h3>
                <p className="text-xl text-gray-300">Fitness & Nutrition Coach</p>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
}

export default Contact;
