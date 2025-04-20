# JMEFit Training Platform

![JMEFit Logo](/JME_fit_black_purple.png)

## Overview

JMEFit is a comprehensive fitness training platform that offers personalized workout programs, nutrition guidance, and community support to help users achieve their fitness goals. This full-stack application combines modern web technologies with expert fitness content to deliver a seamless user experience.

## Features

### User Experience

- **Personalized Fitness Programs** - Access to various workout programs tailored to different fitness goals
- **Nutrition Programs** - Detailed nutrition guides and meal plans for optimal results
- **Monthly Subscription App** - Premium content available through subscription service
- **Standalone Programs** - One-time purchase programs for specific goals
- **User Dashboard** - Track progress, manage subscriptions, and access purchased content
- **Blog** - Educational articles and fitness tips from experts
- **Community** - Connect with other fitness enthusiasts
- **Responsive Design** - Optimized for all device sizes with smooth animations

### Technical Features

- **Secure Authentication** - Complete user authentication system using Supabase Auth
- **Payment Processing** - Integrated Stripe payment system for subscriptions and one-time purchases
- **Protected Routes** - Content access control based on user subscriptions
- **Admin Dashboard** - Content management interface for administrators
- **Analytics Integration** - Track user engagement and platform usage
- **PWA Support** - Progressive Web App capabilities for mobile-like experience
- **SEO Optimization** - Search engine friendly with structured data

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion (animations)
- React Router
- Tanstack React Query
- Zustand (state management)

### Backend
- Express.js
- Supabase (database and authentication)
- Stripe API (payment processing)
- Node.js

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Stripe account (for payment processing)
- Supabase account (for database and auth)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/SquizAI/JMEFIT_20april25.git
   cd JMEFIT_20april25
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file based on the `.env.example` template
   - Add your Stripe and Supabase credentials

4. Start the development servers
   - For frontend only:
     ```bash
     npm run dev
     ```
   - For backend only:
     ```bash
     npm run server
     ```
   - For both simultaneously:
     ```bash
     npm run dev:all
     ```

5. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Deployment

The application can be deployed to Netlify for the frontend, with the backend hosted on a service like Heroku or Railway.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is privately licensed and not open for redistribution or use without explicit permission.

## Contact

For questions or support, please reach out through the contact form on the website.

---

© 2025 JMEFit Training. All rights reserved.
