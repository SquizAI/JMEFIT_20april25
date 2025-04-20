
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import NutritionPrograms from './pages/NutritionPrograms';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Programs from './pages/Programs';
import Community from './pages/Community';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ShredWaitlist from './pages/ShredWaitlist';
import MonthlyApp from './pages/MonthlyApp';
import StandalonePrograms from './pages/StandalonePrograms';
import Shop from './pages/Shop';
// ProductSelector import removed
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/Login';
import Checkout from './pages/Checkout';
import RedeemGift from './pages/RedeemGift';
import CheckoutSuccess from './pages/CheckoutSuccess';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useMetrics } from './lib/hooks/useMetrics';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';

function App() {
  useMetrics();
  const location = useLocation();

  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | JMEFit Training">
        <html lang="en" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <div className="min-h-screen bg-white text-gray-900">
            <Navigation />
            {/* Added padding-top to ensure content isn't hidden behind the fixed header */}
            <div className="pt-20">
            <AnimatePresence mode="wait">
              <Routes location={location}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
                <Route path="/nutrition-programs" element={<PageTransition><NutritionPrograms /></PageTransition>} />
                {/* ProductSelector route removed */}
                <Route path="/programs" element={<PageTransition><Programs /></PageTransition>} />
                <Route path="/monthly-app" element={<PageTransition><MonthlyApp /></PageTransition>} />
                <Route path="/standalone-programs" element={<PageTransition><StandalonePrograms /></PageTransition>} />
                <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
                <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
                <Route path="/shred-waitlist" element={<PageTransition><ShredWaitlist /></PageTransition>} />
                <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
                <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
                <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <PageTransition><Dashboard /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminDashboard /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
              <Route path="/checkout/success" element={<PageTransition><CheckoutSuccess /></PageTransition>} />
              <Route path="/redeem" element={<PageTransition><RedeemGift /></PageTransition>} />
              <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
              <Route path="/auth/callback" element={<PageTransition><AuthCallback /></PageTransition>} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
            </AnimatePresence>
            </div>
            <Footer />
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
