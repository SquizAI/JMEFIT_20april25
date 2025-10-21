# JMEFIT Comprehensive Fix TODO List

**Created:** October 21, 2025
**Audit Type:** Pessimistic Mobile-First Analysis
**Total Issues:** 100+

---

## 🚨 CRITICAL - MUST FIX IMMEDIATELY (Production Breaking)

### 1. Remove Debug/Test Code from Production

**CRITICAL SECURITY ISSUE** - Test code in production checkout flow

- [ ] **File: `src/pages/Checkout.tsx:118-127`**
  - Remove test item addition code: `setItems([...items, testAppSubscription])`
  - This adds test items to real user carts in production
  - **Risk:** Customers will be charged for test items
  - **Action:** Delete lines 118-127 completely

- [ ] **File: `src/pages/Checkout.tsx:268-293`**
  - Remove all debug cart manipulation code
  - This modifies cart during checkout process
  - **Risk:** Cart corruption, incorrect charges
  - **Action:** Delete all debug blocks

### 2. Fix Hard-Coded Stripe Price IDs (Will Break When Prices Change)

- [ ] **File: `src/lib/stripe-products.ts:50-152`**
  - All price IDs are hard-coded strings
  - If Stripe prices change, entire app breaks
  - **Action:** Create validation system:
    ```typescript
    const validatePriceId = async (priceId: string) => {
      // Fetch from Stripe API to verify ID exists
      // Return error if invalid
      // Cache results for performance
    };
    ```
  - Add fallback handling for invalid IDs
  - Implement admin panel to update price IDs without code deployment

- [ ] **File: `netlify/functions/create-checkout.js:58-62`**
  - Falls back to creating prices on-the-fly if ID missing
  - **Risk:** Creates duplicate prices in Stripe
  - **Action:** Never create prices dynamically, require valid ID or fail gracefully

### 3. Fix Button Touch Targets (Accessibility Violation)

**WCAG 2.1 Violation** - Buttons below 44x44px minimum

- [ ] **File: `src/components/CartDropdown.tsx:86-94`**
  - Close button: `w-5 h-5` = 20x20px (Too small!)
  - **Action:** Change to `min-w-11 min-h-11 p-3` (44x44px)

- [ ] **File: `src/components/CartDropdown.tsx:100-108`**
  - "Continue Shopping" button uses `text-sm`
  - **Action:** Increase padding to `px-6 py-3` minimum

- [ ] **File: `src/components/CartDropdown.tsx:148-158`**
  - Remove item button: `w-5 h-5` = 20x20px
  - **Action:** Wrap in 44x44px clickable area: `p-3 min-w-11 min-h-11`

- [ ] **File: `src/pages/Programs.tsx:347-353`**
  - "More Info" button padding only `py-1.5 px-5`
  - **Action:** Change to `py-3 px-6` (minimum 44x44px)

- [ ] **File: `src/index.css:136`**
  - Button height hard-coded to `height: 50px`
  - **Action:** Use `min-height: 44px` instead, allow natural sizing

### 4. Fix Mobile Hero Section Breaking Layout

- [ ] **File: `src/index.css:25`**
  - Program cards: `min-height: 650px`
  - **Issue:** Creates massive overflow on mobile screens
  - **Action:** Change to responsive values:
    ```css
    min-height: 400px;
    @media (min-width: 768px) {
      min-height: 550px;
    }
    @media (min-width: 1024px) {
      min-height: 650px;
    }
    ```

- [ ] **File: `src/index.css:273`**
  - Mobile hero: `height: 100vh !important`
  - **Issue:** Doesn't account for mobile browser chrome, notches
  - **Action:** Change to `height: 100dvh` (dynamic viewport height)

- [ ] **File: `src/pages/Programs.tsx:302`**
  - Hero section: `h-[400px]` doesn't scale
  - **Action:** Change to `h-[60vh] md:h-[400px]`

---

## ⚠️ HIGH PRIORITY - Major UX Issues

### 5. Add Loading States to All Buttons

**Issue:** Users don't know if buttons are working

- [ ] **File: `src/pages/Programs.tsx:180-184`**
  - "Get Started Today" button - no loading state
  - **Action:** Add `disabled={isLoading}` and loading spinner

- [ ] **File: `src/pages/Programs.tsx:383-393`**
  - "Start Your Nutrition Journey" - no loading state
  - **Action:** Add loading indicator with `isProcessing` state

- [ ] **File: `src/pages/Programs.tsx:570-583`**
  - Modal submit button - no loading state
  - **Action:** Add `Loading...` text replacement during submission

- [ ] **File: `src/pages/Programs.tsx:914-923`**
  - "Start Self-Led Training" - no loading state
  - **Action:** Add loading state with disabled styling

- [ ] **File: `src/pages/MonthlyApp.tsx:426-435`**
  - "Start Your Fitness Journey" - no loading state
  - **Action:** Add `isSubmitting` state with loading UI

- [ ] **File: `src/pages/Checkout.tsx:89-95`**
  - Payment submit button disabled but no visual feedback WHY
  - **Action:** Add tooltip: "Enter payment details to continue"

### 6. Fix Responsive Padding/Margins for Mobile

- [ ] **File: `src/pages/Programs.tsx:1095`**
  - One-time offerings card: `p-8` on mobile
  - **Action:** Change to `p-4 sm:p-6 md:p-8`

- [ ] **File: `src/pages/Programs.tsx:1139`**
  - SHRED section: `p-8` on mobile
  - **Action:** Change to `p-4 sm:p-6 md:p-8`

- [ ] **File: `src/pages/Programs.tsx:465-587`**
  - Modal padding: `p-8` doesn't reduce on mobile
  - **Action:** Change to `p-4 sm:p-6 md:p-8`

- [ ] **File: `src/pages/Home.tsx:38`**
  - Text spacing: `space-y-4 sm:space-y-4` (identical!)
  - **Action:** Change to `space-y-3 sm:space-y-4 md:space-y-6`

- [ ] **File: `src/pages/Checkout.tsx:819`**
  - Remove button: `p-2 sm:p-1.5` (backwards!)
  - **Action:** Change to `p-1.5 sm:p-2` (larger on desktop)

### 7. Implement Proper Error Handling

**Issue:** Generic errors don't help users fix problems

- [ ] **File: `src/pages/Programs.tsx:59`**
  - Error: "Failed to load products"
  - **Action:** Provide actionable message:
    ```typescript
    if (error.code === 'NETWORK_ERROR') {
      return 'Check your internet connection and try again';
    } else if (error.code === 'AUTH_ERROR') {
      return 'Please sign in to view products';
    }
    // etc.
    ```

- [ ] **File: `src/pages/Checkout.tsx:364-370`**
  - Tries multiple error parsing methods, unclear messages
  - **Action:** Standardize error response format from API, provide specific actions

- [ ] **Add Error Logging Service**
  - Implement Sentry or LogRocket
  - Track all errors with user context
  - Set up alerts for critical errors

### 8. Add Input Validation to Forms

- [ ] **File: `src/pages/Checkout.tsx:490-498`**
  - Email input: Only uses `type="email"` (weak validation)
  - **Action:** Add regex validation:
    ```typescript
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    }
    ```

- [ ] **File: `src/pages/Checkout.tsx:561-568`**
  - Full name: No minimum length validation
  - **Action:** Require at least 2 characters, check for first and last name

- [ ] **File: `src/pages/Checkout.tsx:595-604`**
  - Password: No strength requirements display
  - **Action:** Show requirements (8+ chars, uppercase, number, symbol) with checkmarks

- [ ] **File: `src/pages/Programs.tsx:1154-1161`**
  - SHRED date selector: No default selection
  - **Action:** Set default to nearest upcoming cohort date

### 9. Fix Stripe Price Calculation Mismatches

**CRITICAL:** Displayed prices must match Stripe's actual prices

- [ ] **File: `src/pages/Programs.tsx:145-148`**
  - `getAppPrice()` calculates yearly as `basePrice * 12 * 0.8`
  - **Issue:** Doesn't verify against Stripe's actual price
  - **Action:** Fetch price from Stripe API, don't calculate client-side

- [ ] **File: `src/pages/Checkout.tsx:205-214`**
  - `calculateYearlySavings()` uses hard-coded 0.8 factor
  - **Issue:** If Stripe changes discount, display is wrong
  - **Action:** Fetch actual prices from Stripe, calculate difference

- [ ] **File: `src/components/CartDropdown.tsx:26-47`**
  - `getMonthlyPrice()` switch statement with hard-coded prices
  - **Issue:** Must perfectly match Stripe or customers get wrong price
  - **Action:** Replace with Stripe API calls or database lookup

---

## 📱 MEDIUM PRIORITY - Mobile UX Improvements

### 10. Fix Navigation Mobile Issues

- [ ] **File: `src/components/Navigation.tsx:54`**
  - Nav height: `h-20` may be too tall on mobile
  - **Action:** Change to `h-16 md:h-20`

- [ ] **File: `src/components/Navigation.tsx:56-68`**
  - Logo: `h-12` doesn't scale when text is large
  - **Action:** Add responsive sizing: `h-10 sm:h-12`

- [ ] **File: `src/components/Navigation.tsx:72-145`**
  - Navigation links: Only hover states, no focus states
  - **Action:** Add `focus:` classes for keyboard accessibility

### 11. Optimize Images for Mobile

- [ ] **File: `src/pages/Home.tsx:85-120`**
  - Background images use public URLs, no fallback
  - **Action:** Add `onError` handler with fallback image

- [ ] **All image files**
  - No WebP or AVIF formats (modern browsers support)
  - **Action:** Convert all images to WebP with JPEG fallback:
    ```html
    <picture>
      <source srcset="image.webp" type="image/webp">
      <img src="image.jpg" alt="...">
    </picture>
    ```

- [ ] **File: `src/pages/Home.tsx:200-214`**
  - App preview images: Hard-coded aspect ratio, no responsive sizing
  - **Action:** Use `srcset` for different screen sizes

### 12. Fix Layout Overflow Issues

- [ ] **File: `src/pages/Home.tsx:33`**
  - Hero section: `h-screen` with `w-full` may overflow
  - **Action:** Add `overflow-hidden` to parent

- [ ] **File: `src/components/CartDropdown.tsx:114`**
  - Flex layout may overflow on mobile
  - **Action:** Add `overflow-x-auto` and test on small screens

- [ ] **File: `src/pages/Shop.tsx:121`**
  - Timeline with absolute positioning likely broken
  - **Action:** Test on mobile, add responsive positioning

### 13. Improve Checkout Flow UX

- [ ] **File: `src/pages/Checkout.tsx:421`**
  - Grid layout jumps from 1 to 2 columns (no `md:` breakpoint)
  - **Action:** Add `md:grid-cols-2 lg:grid-cols-2`

- [ ] **File: `src/pages/Checkout.tsx:787`**
  - Sticky positioning: `top-20 md:top-24` no safe area for notches
  - **Action:** Add `top-safe` or `env(safe-area-inset-top)`

- [ ] **File: `src/modules/checkout/components/StripeCheckout.tsx:194`**
  - Cart display: `px-4 py-8` may be cramped on very small phones
  - **Action:** Add `px-3 sm:px-4`

### 14. Fix Modal and Dropdown Issues

- [ ] **File: `src/pages/Programs.tsx:465-587`**
  - Modal: `overflow-y-auto` no scroll inertia for iOS
  - **Action:** Add `-webkit-overflow-scrolling: touch;`

- [ ] **File: `src/components/CartDropdown.tsx:77`**
  - Modal uses `createPortal` but doesn't check if root exists
  - **Action:** Add fallback:
    ```typescript
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      console.error('Portal root not found');
      return null;
    }
    ```

- [ ] **File: `src/components/CartDropdown.tsx:78`**
  - Modal width: `max-w-[95vw]` but issues on very small phones (<320px)
  - **Action:** Add `max-w-[calc(100vw-2rem)]` for better spacing

---

## 🎨 LOW PRIORITY - Polish & Accessibility

### 15. Add Alt Text to All Images

**WCAG Violation** - Missing alt text for screen readers

- [ ] **File: `src/pages/Home.tsx:85-86, 96-97, 107-108, 117-118, 200-214`**
  - All images missing alt text
  - **Action:** Add descriptive alt text:
    ```tsx
    <img src="..." alt="Woman performing squats in gym with kettlebell" />
    ```

- [ ] **File: `src/pages/Programs.tsx`**
  - Background images need empty alt if decorative: `alt=""`

### 16. Improve Color Contrast for Accessibility

- [ ] **File: `src/index.css:209-220`**
  - Badge background `#22c55e` may have insufficient contrast
  - **Action:** Test with WCAG contrast checker, use darker green if needed

### 17. Add Missing ARIA Labels

- [ ] **File: `src/components/CartDropdown.tsx:86-94`**
  - Close button has `aria-label` but should also have `role="button"`
  - **Action:** Add `role="button" tabIndex={0}`

- [ ] **All navigation buttons**
  - Missing ARIA role definitions
  - **Action:** Add `aria-current="page"` for active links

### 18. Optimize CSS Animations

- [ ] **File: `src/index.css:16-285`**
  - Many animations but no `prefers-reduced-motion` support
  - **Action:** Add media query:
    ```css
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```

### 19. Fix Supabase Error Handling

- [ ] **File: `src/pages/Checkout.tsx:231-239`**
  - Auth signup doesn't handle existing user error
  - **Action:** Check for `error.code === 'user_already_exists'`

- [ ] **File: `src/pages/Programs.tsx:43-67`**
  - `fetchData()` catches all errors generically
  - **Action:** Handle specific Supabase error codes

- [ ] **File: `src/pages/NutritionPrograms.tsx:61-79`**
  - Errors not logged, failures are untraced
  - **Action:** Add error logging with context

### 20. Add Retry Logic for Failed API Calls

- [ ] **All Supabase queries**
  - No retry on network failures
  - **Action:** Implement exponential backoff:
    ```typescript
    const retry = async (fn, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
      }
    };
    ```

---

## 🔧 TECHNICAL DEBT

### 21. Remove Duplicate Files

- [ ] **File: `src/pages/Shop 2.tsx`**
  - Duplicate file exists
  - **Action:** Delete if not in use, or rename properly

### 22. Fix Hard-Coded Values

Replace magic numbers with constants:

- [ ] **All files with hard-coded prices**
  - Create `src/constants/pricing.ts`:
    ```typescript
    export const PRICING = {
      APP_MONTHLY: 19.99,
      APP_YEARLY: 191.90,
      NUTRITION_MONTHLY: 30.00,
      // etc.
    };
    ```

### 23. Implement Proper State Management

- [ ] **File: `src/pages/Checkout.tsx:282`**
  - Uses `setTimeout` to wait for state updates (race condition!)
  - **Action:** Use proper React state management or `useEffect` dependencies

- [ ] **File: `src/pages/Checkout.tsx:844-847, 862-865`**
  - Uses `setLoading` to force re-renders (anti-pattern)
  - **Action:** Derive state properly from data, don't use dummy state

### 24. Add TypeScript Strict Mode

- [ ] **File: `tsconfig.json`**
  - Enable strict mode:
    ```json
    {
      "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true
      }
    }
    ```
  - Fix all type errors that arise

### 25. Implement Proper Environment Variable Management

- [ ] **All files using `process.env`**
  - No fallbacks for missing env vars
  - **Action:** Create validation on app startup:
    ```typescript
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];

    requiredEnvVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        throw new Error(`Missing required env var: ${varName}`);
      }
    });
    ```

---

## 📊 TESTING REQUIREMENTS

### 26. Add Unit Tests

- [ ] **Cart functionality**
  - Test `addItem`, `removeItem`, `updateItemInterval`
  - Test price calculations
  - Test Stripe ID mapping

- [ ] **Pricing calculations**
  - Test yearly discount calculations
  - Test monthly to yearly conversions
  - Verify against actual Stripe prices

### 27. Add Integration Tests

- [ ] **Checkout flow**
  - Test full checkout flow from cart to Stripe redirect
  - Test error handling (network failures, invalid cards)
  - Test subscription vs one-time purchases

- [ ] **Auth flow**
  - Test signup, login, logout
  - Test email verification
  - Test password reset

### 28. Add E2E Tests

- [ ] **Critical user paths**
  - Browse programs → Add to cart → Checkout → Payment success
  - Sign up → Onboarding → Subscribe → Access dashboard
  - Test on real mobile devices (not just browser dev tools)

### 29. Add Visual Regression Tests

- [ ] **All pages**
  - Screenshot tests for desktop, tablet, mobile
  - Test dark mode if implemented
  - Test RTL layouts if supported

### 30. Add Performance Testing

- [ ] **Lighthouse scores**
  - Target: 90+ on mobile
  - Fix Core Web Vitals (LCP, FID, CLS)
  - Optimize bundle size

---

## 🚀 DEPLOYMENT & MONITORING

### 31. Set Up Error Monitoring

- [ ] **Implement Sentry**
  - Track JavaScript errors
  - Track API errors
  - Set up error alerting
  - Add source maps for debugging

### 32. Set Up Analytics

- [ ] **Implement Google Analytics 4**
  - Track page views
  - Track button clicks (especially CTAs)
  - Track checkout funnel
  - Track cart abandonment

### 33. Set Up Performance Monitoring

- [ ] **Implement Web Vitals tracking**
  - Monitor LCP, FID, CLS
  - Track slow API calls
  - Monitor Stripe checkout performance

### 34. Set Up A/B Testing

- [ ] **Test critical flows**
  - Test different CTA button text
  - Test pricing page layouts
  - Test checkout flow variations

---

## 📝 DOCUMENTATION

### 35. Add Code Comments

- [ ] **All complex functions**
  - Add JSDoc comments
  - Explain WHY not just WHAT
  - Document edge cases

### 36. Create API Documentation

- [ ] **Netlify functions**
  - Document all endpoints
  - Document request/response formats
  - Document error codes

### 37. Create Component Documentation

- [ ] **Reusable components**
  - Create Storybook stories
  - Document props
  - Show usage examples

---

## ✅ COMPLETION CHECKLIST

Track overall progress:

- [ ] **Critical Issues:** 0/4 complete
- [ ] **High Priority:** 0/5 complete
- [ ] **Medium Priority:** 0/5 complete
- [ ] **Low Priority:** 0/6 complete
- [ ] **Technical Debt:** 0/5 complete
- [ ] **Testing:** 0/5 complete
- [ ] **Deployment:** 0/4 complete
- [ ] **Documentation:** 0/3 complete

**Total Issues:** 37 major categories, 100+ individual fixes

---

## 🎯 RECOMMENDED FIX ORDER

### Phase 1 (Week 1): Critical Fixes
1. Remove debug code from Checkout.tsx
2. Fix button touch targets
3. Fix mobile hero section
4. Add loading states to all buttons
5. Implement proper error handling

### Phase 2 (Week 2): High Priority UX
1. Fix responsive padding/margins
2. Add input validation
3. Fix Stripe price calculations
4. Optimize images
5. Fix checkout flow

### Phase 3 (Week 3): Mobile UX
1. Fix navigation mobile issues
2. Fix layout overflow
3. Fix modals and dropdowns
4. Add alt text to images
5. Improve color contrast

### Phase 4 (Week 4): Polish & Testing
1. Add ARIA labels
2. Optimize animations
3. Fix Supabase error handling
4. Add retry logic
5. Implement unit tests

### Phase 5 (Week 5): Deployment & Monitoring
1. Set up Sentry
2. Set up analytics
3. Set up performance monitoring
4. Create documentation
5. Deploy to production

---

## 📞 SUPPORT

If you encounter issues during fixes:
- Check Netlify function logs
- Check Supabase logs
- Check Stripe webhook logs
- Check browser console for client-side errors
- Test on real mobile devices, not just emulators

**Last Updated:** October 21, 2025
