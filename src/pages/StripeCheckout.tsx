import { Helmet } from 'react-helmet-async';
import StripeCheckoutComponent from '../modules/checkout/components/StripeCheckout';

export default function StripeCheckoutPage() {
  return (
    <>
      <Helmet>
        <title>Checkout - JMEFit</title>
      </Helmet>
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <StripeCheckoutComponent />
      </main>
    </>
  );
}
