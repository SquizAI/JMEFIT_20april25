# JMEFIT Project Index

This document provides a comprehensive index of important files and directories in the JMEFIT project.

## Core Files

- `index.html` - The main HTML entry point
- `.env` - Environment variables (gitignored)
- `.env.example` - Example environment variables for reference
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `package.json` - Project dependencies

## Source Code Organization

### Component Structure

- `src/components/` - Reusable UI components
  - `Navigation.tsx` - Main navigation bar (desktop & mobile)
  - `SEO.tsx` - SEO component for meta tags
  - `CartDropdown.tsx` - Cart dropdown component
  - `Footer.tsx` - Footer component
  - [other components]

### Pages

- `src/pages/` - Main page components
  - `Home.tsx` - Homepage
  - `Programs.tsx` - Programs page
  - `Shop.tsx` - Shop page
  - `Blog.tsx` - Blog page
  - `Privacy.tsx` - Privacy policy page
  - `Auth.tsx` - Authentication page
  - [other pages]

### State Management

- `src/store/` - State management
  - `cart.ts` - Cart state management
  - [other state files]

### Context Providers

- `src/contexts/` - Context providers
  - `AuthContext.tsx` - Authentication context

### Assets

- `public/` - Static assets
  - `JME_fit_black_purple.png` - Main logo
  - `favicon.ico` - Favicon (main)
  - `images/` - Image assets directory
  - Various favicon and icon files for different platforms

### Configuration

- `public/_headers` - Netlify headers configuration
- `fix-images.sh` - Script to fix image paths
- `update-favicons.sh` - Script to update all favicons

## Development Workflow

1. Local development: `npm run dev`
2. Build for production: `npm run build`
3. Preview production build: `npm run preview`

## Important URLs

- Production site: https://jmefit.com
- Netlify dashboard: [URL to your Netlify dashboard]

## Notes

- The favicon is properly set and should be consistent across platforms. Updated via `update-favicons.sh`.
- Mobile navigation is implemented directly in the `Navigation.tsx` component.
- SEO settings for sharing can be customized in the `SEO.tsx` component.
