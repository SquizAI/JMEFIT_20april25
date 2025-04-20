# JMEFIT Database-Driven Product Implementation Checklist

## Phase 1: Database Population

### Existing Database Schema Analysis
- [ ] Verify existing tables structure (`products`, `prices`, `subscription_plans`, `subscription_prices`)
- [ ] Confirm metadata field in products table can store UI display info (colors, icons)
- [ ] Confirm features field in subscription_plans table can store feature lists

### One-Time Products Creation
- [ ] Create in `products` table:
  - [ ] Macros Calculation
    - [ ] Name, description, active status
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Set price: $99
  - [ ] SHRED Challenge
    - [ ] Name, description, active status
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Set price: $249

### Subscription Products Creation
- [ ] Create in `subscription_plans` table:
  - [ ] Nutrition Only
    - [ ] Name, description, active status
    - [ ] Add features JSON array with all feature bullets
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Create monthly price: $149
    - [ ] Create yearly price: $1430 (20% discount)
  - [ ] Nutrition & Training
    - [ ] Name, description, active status
    - [ ] Add features JSON array with all feature bullets
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Create monthly price: $199
    - [ ] Create yearly price: $1910 (20% discount)
  - [ ] Self-Led Training
    - [ ] Name, description, active status
    - [ ] Add features JSON array with all feature bullets
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Create monthly price: $19.99
    - [ ] Create yearly price: $191.90 (20% discount)
  - [ ] Trainer Feedback
    - [ ] Name, description, active status
    - [ ] Add features JSON array with all feature bullets
    - [ ] Add UI metadata (colors, icons, display order)
    - [ ] Create monthly price: $34.99
    - [ ] Create yearly price: $335.90 (20% discount)

### Stripe Integration
- [ ] Use existing `syncProductFromStripe` function to verify all products are in Stripe
- [ ] Verify Stripe product IDs are saved in database
- [ ] Verify Stripe price IDs are saved in database
- [ ] Check product activation status in both systems

## Phase 2: Frontend Integration

### Programs Component Update
- [ ] Update `Programs.tsx` to use existing `getProducts()` and `getSubscriptionPlans()` functions
  - [ ] Add loading state and spinner
  - [ ] Add error handling and error message display
  - [ ] Replace hardcoded products with database products using proper typing
  - [ ] Map features from the database features array to UI
  - [ ] Use metadata for colors, icons, and display order

### MonthlyApp Component Update
- [ ] Update `MonthlyApp.tsx` to use existing API functions
  - [ ] Filter for subscription-type products only
  - [ ] Extract correct pricing based on interval selection
  - [ ] Map pricing data from database
  - [ ] Handle loading/error states

### Cart Integration
- [ ] Update cart integration to use database IDs
  - [ ] Modify `handleAddToCart` to use proper Stripe price IDs
  - [ ] Update price calculation to use database prices
  - [ ] Ensure correct billing interval is passed to Stripe

## Phase 3: Admin Interface

### Products & Plans Management
- [ ] Create admin products page using existing API functions
  - [ ] Show both one-time products and subscription plans
  - [ ] Implement filtering, sorting, and pagination
  - [ ] Display active/inactive status
  - [ ] Add quick actions (edit, delete, sync)

### Product Editor
- [ ] Create product form that handles both types
  - [ ] Basic details (name, description, image)
  - [ ] Dynamic features list editor (add/remove/reorder)
  - [ ] UI metadata editor for display customization
  - [ ] Price management interface
  - [ ] Direct Stripe sync button

### Price Management
- [ ] Create price management interface
  - [ ] Display all prices for a product
  - [ ] Create form for adding new prices
  - [ ] Interface for activating/deactivating prices
  - [ ] Sync status with Stripe

## Phase 4: Testing & Deployment

### Testing
- [ ] Test data fetching performance
- [ ] Test all UI components with database-driven data
- [ ] Test checkout flow with actual Stripe IDs
- [ ] Verify subscription billing intervals
- [ ] Test admin interface CRUD operations

### Deployment
- [ ] Create database backup
- [ ] Set up monitoring for Stripe sync failures
- [ ] Deploy changes to production
- [ ] Verify production functionality
- [ ] Monitor for any issues post-launch
