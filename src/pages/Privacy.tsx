import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

function Privacy() {
  return (
    <div className="pt-24 pb-16 bg-gray-50">
      <SEO 
        title="Privacy Policy | JmeFit"
        description="Privacy Policy for JmeFit Training programs and services."
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="mb-4">
                Last Updated: March 23, 2025
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, subscribe to our Services, 
                or communicate with us. This information may include your name, email address, postal address, phone number, 
                payment information, and any other information you choose to provide.
              </p>
              <p>
                We also automatically collect certain information about your device and how you interact with our Services, 
                including your IP address, browser type, operating system, referring URLs, access times, and pages viewed.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide, maintain, and improve our Services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Communicate with you about products, services, offers, promotions, and events</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve our Services</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Sharing of Information</h2>
              <p>
                We may share your information as follows:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
                <li>In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process</li>
                <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of JmeFit or others</li>
                <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
                <li>With your consent or at your direction</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Data Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, 
                disclosure, alteration, and destruction.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Your Choices</h2>
              <p>
                You may update, correct, or delete your account information at any time by logging into your account or contacting us. 
                You may also opt out of receiving promotional emails from us by following the instructions in those emails.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. Children's Privacy</h2>
              <p>
                Our Services are not directed to children under 18, and we do not knowingly collect personal information from children under 18. 
                If we learn we have collected personal information from a child under 18, we will delete that information.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Changes to this Privacy Policy</h2>
              <p>
                We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy 
                and, in some cases, we may provide you with additional notice.
              </p>
              
              <h2 id="contact" className="text-2xl font-semibold text-gray-800 mt-8 mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please <Link to="/contact" className="text-jme-purple hover:underline">contact us</Link>.
              </p>
              
              <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Resources</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/terms" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Terms of Service
                  </Link>
                  <Link to="/contact" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jme-purple hover:bg-purple-700">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
