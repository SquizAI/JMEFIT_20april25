import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Stripe from 'stripe';
import checkoutRoutes from './api/create-checkout-session.js';
import paymentIntentRoutes from './api/create-payment-intent.js';

const app = express();
// In production environments like SiteGround, the port is usually predefined
// or the application runs behind a proxy that forwards requests to it
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    // Production domains
    'https://jmefit.com',
    'https://www.jmefit.com',
    
    // Development domains (for testing)
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));
app.use(bodyParser.json());

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Routes
app.use('/api', checkoutRoutes);
app.use('/api', paymentIntentRoutes);

// Webhook endpoint to handle Stripe events
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Fulfill the order
      console.log('Checkout session completed:', session);
      break;
    case 'invoice.paid':
      const invoice = event.data.object;
      // Continue to provision the subscription as payments continue to be made
      console.log('Invoice paid:', invoice);
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      // The payment failed or the customer does not have a valid payment method
      console.log('Invoice payment failed:', failedInvoice);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.url} not found` });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`Health check endpoint: http://localhost:${PORT}/health`);
});

// For better error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // In a production environment, you might want to restart the process
  // or notify administrators, but for now we'll just log it
});
