# JMEFIT Stripe Integration Architecture

**Visual Reference Guide**

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           JMEFIT STRIPE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│   FRONTEND (React)     │
│  - Cart Management     │
│  - Price Display       │
│  - Checkout Button     │
└───────────┬────────────┘
            │
            │ Uses Client-Side Functions
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT-SIDE: src/lib/stripe-products.ts                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ validatePriceIdWithStripe(priceId)                       │    │
│  │ - Calls Netlify function                                 │    │
│  │ - Returns: { valid, price, error }                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ fetchStripePrices()                                      │    │
│  │ - Calls Netlify function                                 │    │
│  │ - Returns: { prices, savings, cached, timestamp }        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ STRIPE_PRODUCTS (Hard-coded catalog)                     │    │
│  │ - Product names, descriptions, features                  │    │
│  │ - Price IDs (validated against Stripe)                   │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
            │
            │ Calls Netlify Functions
            │
            ▼
┌────────────────────────────────────────────────────────────────────┐
│  NETLIFY FUNCTIONS (Server-Side)                                  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ validate-stripe-price.js                                 │    │
│  │ - POST /.netlify/functions/validate-stripe-price         │    │
│  │ - Input: { priceId }                                     │    │
│  │ - Validates with Stripe API                              │    │
│  │ - Output: { valid, price, error }                        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ get-stripe-prices.js                                     │    │
│  │ - GET /.netlify/functions/get-stripe-prices              │    │
│  │ - Fetches all 10 JMEFIT prices from Stripe               │    │
│  │ - 1-hour caching                                         │    │
│  │ - Output: { prices, savings, cached, timestamp }         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ create-checkout.js                                       │    │
│  │ - POST /.netlify/functions/create-checkout               │    │
│  │ - Validates all price IDs                                │    │
│  │ - Creates Stripe checkout session (one-time)             │    │
│  │ - Enhanced error handling                                │    │
│  │ - Output: { sessionId, url }                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ create-subscription-checkout.js                          │    │
│  │ - POST /.netlify/functions/create-subscription-checkout  │    │
│  │ - Validates all price IDs                                │    │
│  │ - Verifies recurring type                                │    │
│  │ - Creates Stripe checkout session (subscription)         │    │
│  │ - Enhanced error handling                                │    │
│  │ - Output: { sessionId, url }                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ stripe-webhook.js                                        │    │
│  │ - POST /.netlify/functions/stripe-webhook                │    │
│  │ - Verifies webhook signature                             │    │
│  │ - Handles 6 event types                                  │    │
│  │ - Creates orders, subscriptions, payments                │    │
│  │ - Sends confirmation emails                              │    │
│  │ - Output: { received: true }                             │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
            │
            │ Calls Stripe API & Supabase
            │
            ▼
┌─────────────────────┐         ┌─────────────────────┐
│   STRIPE API        │         │   SUPABASE DB       │
│   - Prices          │         │   - profiles        │
│   - Checkout        │         │   - orders          │
│   - Subscriptions   │         │   - order_items     │
│   - Webhooks        │         │   - subscriptions   │
└─────────────────────┘         │   - payments        │
                                └─────────────────────┘
```

---

## PRICE VALIDATION FLOW

```
USER CLICKS "ADD TO CART"
         │
         ▼
┌──────────────────────────────────────────┐
│ Client: Get price ID from product        │
│ priceId = "price_1RPb3HG00IiCtQkDK6blELBN"│
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Client: Format validation                │
│ - Must start with "price_"               │
│ - Minimum length check                   │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌────────┐
   │ Valid  │      │Invalid │ → Show error
   └───┬────┘      └────────┘   "Invalid format"
       │
       ▼
┌──────────────────────────────────────────┐
│ Client: Call validatePriceIdWithStripe() │
│ fetch('/.netlify/functions/              │
│   validate-stripe-price',                │
│   { priceId: "price_..." })              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: validate-stripe-price.js        │
│ 1. Receive request                       │
│ 2. Validate input                        │
│ 3. Call Stripe API                       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Stripe API: stripe.prices.retrieve()     │
│ - Check if price exists                  │
│ - Get price details                      │
│ - Get product details                    │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌─────────┐    ┌──────────┐
   │ Exists  │    │Not Found │
   └────┬────┘    └─────┬────┘
        │               │
        │               └──► Return:
        │                   { valid: false,
        │                     error: "Does not exist" }
        │
        ▼
┌──────────────────────────────────────────┐
│ Netlify: Check if price is active        │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │ Active │      │ Inactive │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► Return:
       │                     { valid: false,
       │                       error: "Not active" }
       │
       ▼
┌──────────────────────────────────────────┐
│ Netlify: Check if product is active      │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │ Active │      │ Inactive │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► Return:
       │                     { valid: false,
       │                       error: "Product inactive" }
       │
       ▼
┌──────────────────────────────────────────┐
│ Netlify: Return success                  │
│ {                                        │
│   valid: true,                           │
│   price: {                               │
│     id: "price_...",                     │
│     amount: 17900,                       │
│     currency: "usd",                     │
│     type: "recurring",                   │
│     active: true                         │
│   },                                     │
│   error: null                            │
│ }                                        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Client: Process response                 │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │ Valid  │      │ Invalid  │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► toast.error(error)
       │                     Don't add to cart
       │
       ▼
┌──────────────────────────────────────────┐
│ Client: Add item to cart                 │
│ toast.success("Added to cart")           │
└──────────────────────────────────────────┘
```

---

## CHECKOUT FLOW

```
USER CLICKS "CHECKOUT"
         │
         ▼
┌──────────────────────────────────────────┐
│ Client: Prepare checkout data            │
│ {                                        │
│   items: [                               │
│     {                                    │
│       name: "Nutrition Only",            │
│       stripe_price_id: "price_...",      │
│       quantity: 1,                       │
│       billingInterval: "month"           │
│     }                                    │
│   ],                                     │
│   successUrl: "https://jmefit.com/success"│
│   cancelUrl: "https://jmefit.com/cancel" │
│   customerEmail: "user@example.com"      │
│ }                                        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Client: Determine checkout type          │
│ - One-time? create-checkout              │
│ - Subscription? create-subscription       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: create-checkout.js OR           │
│          create-subscription-checkout.js │
│ 1. Receive request                       │
│ 2. Validate items array not empty        │
│ 3. Filter items by type                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: Validate ALL price IDs          │
│ FOR EACH item in items:                  │
│   - Check format (starts with "price_")  │
│   - Call stripe.prices.retrieve(id)      │
│   - Verify active status                 │
│   - For subscriptions: verify recurring  │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │AllValid│      │AnyInvalid│
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► Return 400:
       │                     {
       │                       error: "Invalid price for X",
       │                       errorType: "PriceNotFound",
       │                       timestamp: "..."
       │                     }
       │
       ▼
┌──────────────────────────────────────────┐
│ Netlify: Map to Stripe line items        │
│ lineItems = items.map(item => ({         │
│   price: item.stripe_price_id,           │
│   quantity: item.quantity || 1           │
│ }))                                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: Create checkout session         │
│ session = await stripe.checkout          │
│   .sessions.create({                     │
│     mode: 'payment' | 'subscription',    │
│     line_items: lineItems,               │
│     success_url: successUrl,             │
│     cancel_url: cancelUrl,               │
│     customer_email: customerEmail,       │
│     payment_method_types:                │
│       ['card', 'link', 'cashapp']        │
│   })                                     │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │Success │      │ Error    │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 ▼
       │         ┌──────────────────────┐
       │         │ Handle Stripe Error  │
       │         │ - StripeCardError    │
       │         │ - StripeAPIError     │
       │         │ - StripeConnection   │
       │         │ etc.                 │
       │         └─────┬────────────────┘
       │               │
       │               └──► Return error:
       │                   {
       │                     error: "User-friendly msg",
       │                     errorType: "StripeCardError",
       │                     timestamp: "..."
       │                   }
       │
       ▼
┌──────────────────────────────────────────┐
│ Netlify: Return session URL              │
│ {                                        │
│   sessionId: "cs_test_...",              │
│   url: "https://checkout.stripe.com/..." │
│ }                                        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Client: Redirect to Stripe Checkout      │
│ window.location.href = session.url       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ USER: Completes payment on Stripe        │
│ - Enters card details                    │
│ - Confirms payment                       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Stripe: Processes payment                │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │Success │      │ Failed   │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► Redirect to cancel_url
       │
       ▼
┌──────────────────────────────────────────┐
│ Stripe: Sends webhook                    │
│ POST /.netlify/functions/stripe-webhook  │
│ Event: checkout.session.completed        │
│ Signature: stripe-signature header       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: stripe-webhook.js               │
│ 1. Verify signature                      │
│ 2. Parse event                           │
│ 3. Handle event type                     │
└──────────────┬───────────────────────────┘
               │
               ▼
       (See Webhook Flow below)
```

---

## WEBHOOK FLOW

```
STRIPE SENDS WEBHOOK
         │
         ▼
┌──────────────────────────────────────────┐
│ Netlify: stripe-webhook.js               │
│ 1. Receive POST request                  │
│ 2. Get stripe-signature header           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Netlify: Verify webhook signature        │
│ stripeEvent = stripe.webhooks            │
│   .constructEvent(                       │
│     event.body,                          │
│     signature,                           │
│     STRIPE_WEBHOOK_SECRET                │
│   )                                      │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │ Valid  │      │ Invalid  │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 └──► Return 400:
       │                     "Webhook Error: Invalid signature"
       │
       ▼
┌──────────────────────────────────────────┐
│ Netlify: Switch on event type            │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐   ┌─────────────────────┐
│checkout.    │   │customer.subscription│
│session.     │   │.created             │
│completed    │   └─────────────────────┘
└──────┬──────┘            │
       │                   ▼
       │           ┌──────────────────────┐
       │           │handleSubscription    │
       │           │Created()             │
       │           │- Get customer        │
       │           │- Find user in DB     │
       │           │- Create subscription │
       │           │  record              │
       │           └──────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ handleCheckoutCompleted()                │
│ 1. Get customer from Stripe              │
│ 2. Get line items from session           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Find or create user in profiles table    │
│ SELECT * FROM profiles                   │
│ WHERE email = customer.email             │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌────────┐      ┌──────────┐
   │ Found  │      │Not Found │
   └───┬────┘      └─────┬────┘
       │                 │
       │                 ▼
       │         ┌──────────────────────┐
       │         │ Create new profile   │
       │         │ INSERT INTO profiles │
       │         └─────┬────────────────┘
       │               │
       └───────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Create order record                      │
│ INSERT INTO orders (                     │
│   user_id,                               │
│   stripe_checkout_id,                    │
│   stripe_payment_intent_id,              │
│   total_amount,                          │
│   currency,                              │
│   status                                 │
│ ) VALUES (...)                           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ FOR EACH line item:                      │
│   - Find product in DB                   │
│   - Find price in DB                     │
│   - Create order_item record             │
│     INSERT INTO order_items (            │
│       order_id,                          │
│       product_id,                        │
│       price_id,                          │
│       quantity,                          │
│       amount                             │
│     ) VALUES (...)                       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Send confirmation email                  │
│ 1. Determine product type                │
│ 2. Load appropriate template             │
│ 3. Replace variables                     │
│ 4. Send via nodemailer                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Return success                           │
│ { received: true }                       │
└──────────────────────────────────────────┘
```

---

## ERROR HANDLING MATRIX

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

ERROR CAUGHT
     │
     ▼
┌─────────────────┐
│ Check error.type│
└────────┬────────┘
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
┌─────────────────┐                      ┌──────────────────┐
│ StripeCardError │                      │StripeInvalidReq  │
└────────┬────────┘                      └────────┬─────────┘
         │                                        │
         ▼                                        ▼
┌────────────────────────────────┐    ┌────────────────────────┐
│ Message:                       │    │ Message:               │
│ "Your card was declined.       │    │ "Payment configuration │
│  Please try a different        │    │  error. Contact support│
│  payment method."              │    │  with code:            │
│                                │    │  INVALID_PRICE"        │
│ Status: 400                    │    │                        │
│ Type: StripeCardError          │    │ Status: 400            │
└────────────────────────────────┘    │ Type: Invalid          │
                                      └────────────────────────┘
    │                                        │
    └────────────────┬───────────────────────┘
                     │
    ┌────────────────┴────────────────────────────┐
    │                                             │
    ▼                                             ▼
┌─────────────────┐                      ┌──────────────────┐
│ StripeAPIError  │                      │StripeConnection  │
└────────┬────────┘                      └────────┬─────────┘
         │                                        │
         ▼                                        ▼
┌────────────────────────────────┐    ┌────────────────────────┐
│ Message:                       │    │ Message:               │
│ "Payment service temporarily   │    │ "Network error.        │
│  unavailable. Please try       │    │  Please check your     │
│  again in a few minutes."      │    │  connection and try    │
│                                │    │  again."               │
│ Status: 503                    │    │                        │
│ Type: StripeAPIError           │    │ Status: 503            │
└────────────────────────────────┘    │ Type: Connection       │
                                      └────────────────────────┘
```

---

## PRICE STRUCTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    JMEFIT PRODUCT CATALOG                       │
└─────────────────────────────────────────────────────────────────┘

SUBSCRIPTION PRODUCTS
│
├─ Nutrition Only
│  ├─ Monthly:  $179.00/mo  (price_1RPb3HG00IiCtQkDK6blELBN)
│  └─ Yearly:   $1,718.40/yr (price_1RPb3NG00IiCtQkDRzrvSEOk)
│                Save $429.60 (20%)
│
├─ Nutrition & Training
│  ├─ Monthly:  $249.00/mo  (price_1RPq65G00IiCtQkDvWPGX09T)
│  └─ Yearly:   $2,390.40/yr (price_1RPq60G00IiCtQkDhEj1vQBr)
│                Save $598.60 (20%)
│
├─ Self-Led Training
│  ├─ Monthly:  $24.99/mo  (price_1RPb3rG00IiCtQkDWSMYE6VP)
│  └─ Yearly:   $239.90/yr (price_1RPb3wG00IiCtQkDGn5dPucz)
│                Save $59.98 (20%)
│
└─ Trainer Feedback
   ├─ Monthly:  $49.99/mo  (price_1RPpiBG00IiCtQkDBBgajsyo)
   └─ Yearly:   $431.90/yr (price_1RPb4CG00IiCtQkDWk5SOKce)
                 Save $167.98 (28%)

ONE-TIME PRODUCTS
│
├─ SHRED Challenge
│  └─ One-time: $297.00    (price_1RPq5RG00IiCtQkD94kNa9AQ)
│
└─ One-Time Macros
   └─ One-time: $99.00     (price_1RPq5aG00IiCtQkD30r2Csua)
```

---

## DATABASE SCHEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE TABLES                             │
└─────────────────────────────────────────────────────────────────┘

profiles
├─ id (UUID, PK)
├─ email (TEXT, UNIQUE)
├─ full_name (TEXT)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

orders
├─ id (UUID, PK)
├─ user_id (UUID, FK → profiles.id)
├─ stripe_checkout_id (TEXT)
├─ stripe_payment_intent_id (TEXT)
├─ total_amount (INTEGER, in cents)
├─ currency (TEXT)
├─ status (TEXT)
├─ billing_address (JSONB)
├─ shipping_address (JSONB)
├─ metadata (JSONB)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

order_items
├─ id (UUID, PK)
├─ order_id (UUID, FK → orders.id)
├─ product_id (UUID, FK → products.id)
├─ price_id (UUID, FK → prices.id)
├─ quantity (INTEGER)
├─ amount (INTEGER, in cents)
├─ metadata (JSONB)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

subscriptions
├─ id (TEXT, PK)
├─ user_id (UUID, FK → profiles.id)
├─ stripe_subscription_id (TEXT, UNIQUE)
├─ stripe_customer_id (TEXT)
├─ status (TEXT)
├─ current_period_start (TIMESTAMPTZ)
├─ current_period_end (TIMESTAMPTZ)
├─ plan_id (TEXT)
├─ cancelled_at (TIMESTAMPTZ)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

payments
├─ id (TEXT, PK)
├─ user_id (UUID, FK → profiles.id)
├─ stripe_invoice_id (TEXT)
├─ stripe_subscription_id (TEXT)
├─ amount (DECIMAL)
├─ currency (TEXT)
├─ status (TEXT)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

products
├─ id (UUID, PK)
├─ stripe_product_id (TEXT, UNIQUE)
├─ name (TEXT)
├─ description (TEXT)
├─ metadata (JSONB)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

prices
├─ id (UUID, PK)
├─ stripe_price_id (TEXT, UNIQUE)
├─ product_id (UUID, FK → products.id)
├─ price (INTEGER, in cents)
├─ currency (TEXT)
├─ interval (TEXT)
├─ active (BOOLEAN)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)
```

---

## SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: CLIENT-SIDE VALIDATION
├─ Format validation (price_ prefix)
├─ Length validation
├─ Type checking
└─ Cannot add invalid format to cart

LAYER 2: API VALIDATION
├─ validatePriceIdWithStripe()
├─ Calls Netlify function
├─ Verifies price exists in Stripe
└─ Checks active status

LAYER 3: SERVER-SIDE VALIDATION (Netlify Functions)
├─ Re-validate all price IDs
├─ Verify with Stripe API
├─ Check active status
├─ Check product status
└─ Validate recurring type (for subscriptions)

LAYER 4: STRIPE CHECKOUT
├─ Stripe validates payment method
├─ Stripe processes payment
├─ Stripe handles PCI compliance
└─ Stripe enforces price amounts

LAYER 5: WEBHOOK VERIFICATION
├─ Verify signature with webhook secret
├─ Reject unsigned/invalid requests
├─ Process only verified events
└─ Idempotency checks (future)

LAYER 6: DATABASE SECURITY
├─ Row Level Security (RLS) policies
├─ Service role key for admin operations
├─ Anon key for read-only access
└─ User isolation via user_id
```

---

## ENVIRONMENT VARIABLE SECURITY

```
┌─────────────────────────────────────────────────────────────────┐
│                   ENVIRONMENT VARIABLE FLOW                     │
└─────────────────────────────────────────────────────────────────┘

VITE_ PREFIX
│
├─ Bundled into client JavaScript
├─ Visible in browser DevTools
├─ Visible in page source
├─ Anyone can see these
│
└─ ONLY USE FOR:
   ├─ VITE_SUPABASE_URL (public)
   ├─ VITE_SUPABASE_ANON_KEY (read-only)
   ├─ VITE_STRIPE_PUBLISHABLE_KEY (public)
   └─ VITE_GOOGLE_CLIENT_ID (public)

NO VITE_ PREFIX
│
├─ Server-side only
├─ NOT bundled into client
├─ NOT visible in browser
├─ Only accessible in Netlify functions
│
└─ USE FOR:
   ├─ STRIPE_SECRET_KEY (secret!)
   ├─ STRIPE_WEBHOOK_SECRET (secret!)
   ├─ SUPABASE_SERVICE_KEY (admin access!)
   ├─ SMTP_PASSWORD (secret!)
   └─ All other secrets

SECURITY RULE
│
└─ If it starts with "sk_", "whsec_", or is a password
   → NEVER use VITE_ prefix!
```

---

**End of Architecture Diagram**

For detailed implementation, see:
- STRIPE_INTEGRATION_COMPLETE.md
- STRIPE_INTEGRATION_TODO.md
- STRIPE_IMPLEMENTATION_SUMMARY.md
