# JME FIT Console Errors Fix To-Do List

## 🚨 Critical Issues to Fix

### 1. Content Security Policy (CSP) Issues
**Problems:**
- Base64 font loading blocked
- WebSocket connections blocked
- Monaco Editor web workers blocked

**Fix Actions:**
- [ ] Update CSP headers to include `data:` in font-src
- [ ] Add `wss://*.supabase.co` to connect-src
- [ ] Add `worker-src 'self' blob:` for Monaco Editor
- [ ] Add `blob:` to script-src for web workers

### 2. Database Query Errors (400 Bad Request)
**Problems:**
- Orders query syntax errors with `user_id=eq.xxx`
- Email campaigns query with invalid foreign key syntax
- Revenue/orders queries with multiple conditions

**Fix Actions:**
- [ ] Fix UserManagement orders query - use proper filter syntax
- [ ] Fix email_campaigns query - remove foreign key syntax
- [ ] Fix revenue dashboard queries - proper date range filtering
- [ ] Add proper error handling for all database queries

### 3. Missing RLS Policies (403 Forbidden)
**Problems:**
- blog_posts table (partially fixed but still erroring)
- revenue_metrics table
- payment_analytics table

**Fix Actions:**
- [ ] Create RLS policy for revenue_metrics table
- [ ] Create RLS policy for payment_analytics table
- [ ] Verify blog_posts RLS is properly applied

### 4. Netlify Functions Errors
**Problems:**
- generate-blog-content returning 500 error
- generate-email-ai returning 404 (wrong path)

**Fix Actions:**
- [ ] Fix generate-email-ai function path (should be /.netlify/functions/)
- [ ] Debug generate-blog-content function error
- [ ] Add proper error handling and logging

### 5. Monaco Editor Issues
**Problems:**
- Web workers blocked by CSP
- Falling back to main thread (UI freezes)

**Fix Actions:**
- [ ] Update CSP to allow blob: URLs for workers
- [ ] Consider using Monaco Editor with different configuration

## 📝 Implementation Steps

### Step 1: Fix CSP Headers
```
# Update public/_headers
/*
  Content-Security-Policy: default-src 'self' https: http: data: blob:; connect-src 'self' https: wss: ws: https://*.supabase.co wss://*.supabase.co; img-src 'self' https: http: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data: http:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self' https:; worker-src 'self' blob:;
```

### Step 2: Fix Database Queries

#### UserManagement.tsx - Fix orders query
```javascript
// Instead of using filter in URL, use proper where clause
const { data: orders } = await supabase
  .from('orders')
  .select('total, created_at')
  .eq('user_id', user.id);
```

#### EmailCampaigns.tsx - Fix foreign key syntax
```javascript
// Fetch campaigns and metrics separately
const { data: campaigns } = await supabase
  .from('email_campaigns')
  .select('*')
  .order('created_at', { ascending: false });

// Then fetch metrics for each campaign
```

#### RevenueDashboard.tsx - Fix date range query
```javascript
// Use single date filter at a time
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString())
  .eq('status', 'completed');
```

### Step 3: Create Missing RLS Policies
```sql
-- Revenue metrics RLS
CREATE POLICY "Admins can view revenue metrics" 
  ON revenue_metrics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Payment analytics RLS
CREATE POLICY "Admins can view payment analytics" 
  ON payment_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );
```

### Step 4: Fix Netlify Functions

#### Fix generate-email-ai path in AIEmailBuilder.tsx
```javascript
// Change from:
const response = await fetch('/netlify/functions/generate-email-ai', {

// To:
const response = await fetch('/.netlify/functions/generate-email-ai', {
```

#### Add error handling to generate-blog-content
```javascript
// Add try-catch and proper error responses
try {
  // existing code
} catch (error) {
  console.error('Error generating blog content:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Failed to generate content' })
  };
}
```

### Step 5: Monaco Editor Configuration
```javascript
// Add to AIEmailBuilder.tsx Monaco configuration
const monacoOptions = {
  // ... existing options
  // Disable features that require web workers if CSP is strict
  'bracketPairColorization.enabled': false,
  'suggest.snippetsPreventQuickSuggestions': false,
  'hover.enabled': false,
  'parameterHints.enabled': false
};
```

## 🎯 Priority Order

1. **High Priority** (Blocking functionality):
   - Fix database query syntax errors
   - Fix Netlify function paths
   - Apply missing RLS policies

2. **Medium Priority** (Degraded experience):
   - Update CSP headers
   - Fix Monaco Editor worker issues

3. **Low Priority** (Minor issues):
   - Optimize queries for performance
   - Add comprehensive error handling

## 🧪 Testing Checklist

After implementing fixes:
- [ ] Test admin dashboard loads without 400 errors
- [ ] Test blog section loads without 403 errors
- [ ] Test AI Email Builder generates emails
- [ ] Test AI Blog Writer generates content
- [ ] Test Revenue Dashboard displays data
- [ ] Verify no CSP violations in console
- [ ] Test Monaco Editor functionality

## 📋 Notes

- All database queries should use proper Supabase filter syntax
- RLS policies should use raw_user_meta_data for admin checks
- Netlify functions need proper error handling
- CSP headers must balance security with functionality 