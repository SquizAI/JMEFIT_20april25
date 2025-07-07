# Social Media Database Schema

## Overview

Design and implement a comprehensive database schema to store social media content, engagement metrics, trends, and analytics data. This schema will support the social-growth engine's content optimization, scheduling, and performance tracking capabilities.

## Current State

### ✅ What We Have
- Supabase PostgreSQL database
- Basic user and product tables
- User authentication system
- Order tracking tables

### ❌ What's Missing
- Social media content tables
- Engagement tracking schema
- Trend analysis tables
- Content performance metrics
- Social platform integration data

## Business Impact

### 🎯 Primary Benefits
- **Data-Driven Content**: Optimize content based on historical performance
- **Trend Analysis**: Identify and capitalize on viral fitness trends
- **ROI Tracking**: Measure social media impact on business metrics
- **Automated Insights**: Enable ML-powered content recommendations

### 📊 Expected Metrics
- **Content Performance**: Track 50+ engagement metrics per post
- **Trend Detection**: Identify trending topics within 24 hours
- **Conversion Tracking**: Measure social → subscription conversion rates
- **Engagement Growth**: Monitor engagement rate improvements over time

## Technical Implementation

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Engagement    │    │   Analytics     │
│   Management    │    │   Tracking      │    │   & Insights    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │            Social Media Database Schema             │
         └─────────────────────────────────────────────────────┘
```

### Core Schema Components

#### 1. Social Platforms Table
```sql
-- Table: social_platforms
CREATE TABLE social_platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'instagram', 'tiktok', 'youtube'
  display_name VARCHAR(100) NOT NULL,
  api_version VARCHAR(20),
  rate_limits JSONB, -- API rate limiting info
  supported_content_types TEXT[], -- ['image', 'video', 'story', 'reel']
  max_caption_length INTEGER,
  max_hashtags INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial platforms
INSERT INTO social_platforms (name, display_name, supported_content_types, max_caption_length, max_hashtags) VALUES
('instagram', 'Instagram', ARRAY['image', 'video', 'story', 'reel'], 2200, 30),
('tiktok', 'TikTok', ARRAY['video'], 2200, 0),
('youtube', 'YouTube Shorts', ARRAY['video'], 5000, 15);
```

#### 2. Content Posts Table
```sql
-- Table: social_posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES social_platforms(id),
  
  -- Content Information
  title VARCHAR(255),
  caption TEXT,
  hashtags TEXT[], -- Array of hashtags without #
  mentions TEXT[], -- Array of mentioned accounts
  
  -- Media Information
  media_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'carousel'
  media_urls TEXT[], -- URLs to media files
  thumbnail_url TEXT,
  
  -- Platform-specific data
  platform_post_id VARCHAR(100), -- External platform ID
  platform_url TEXT,
  platform_metadata JSONB, -- Platform-specific extra data
  
  -- Scheduling & Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Content Strategy
  content_category VARCHAR(50), -- 'workout', 'nutrition', 'motivation', 'transformation'
  target_audience VARCHAR(50), -- 'beginners', 'advanced', 'general'
  content_goals TEXT[], -- ['engagement', 'traffic', 'conversions']
  
  -- AI Generation metadata
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  ai_model VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_social_posts_user_platform ON social_posts(user_id, platform_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at DESC);
CREATE INDEX idx_social_posts_category ON social_posts(content_category);
```

#### 3. Engagement Events Table
```sql
-- Table: engagement_events
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  
  -- Event Information
  event_type VARCHAR(20) NOT NULL, -- 'like', 'comment', 'share', 'save', 'view'
  event_timestamp TIMESTAMPTZ NOT NULL,
  
  -- User Information (when available)
  platform_user_id VARCHAR(100), -- External user ID
  platform_username VARCHAR(100),
  user_follower_count INTEGER,
  
  -- Event Details
  event_value INTEGER DEFAULT 1, -- For views, play_time in seconds
  event_metadata JSONB, -- Additional platform-specific data
  
  -- Geographic & Demographic data
  country_code VARCHAR(2),
  age_range VARCHAR(10), -- '18-24', '25-34', etc.
  gender VARCHAR(10),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning by month for performance
CREATE TABLE engagement_events_y2025m01 PARTITION OF engagement_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Indexes
CREATE INDEX idx_engagement_events_post_type ON engagement_events(post_id, event_type);
CREATE INDEX idx_engagement_events_timestamp ON engagement_events(event_timestamp DESC);
```

#### 4. Content Performance Analytics
```sql
-- Table: post_analytics (aggregated metrics)
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  
  -- Time-based metrics
  analysis_date DATE NOT NULL,
  hours_since_published INTEGER,
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Advanced Metrics
  engagement_rate DECIMAL(5,4), -- (likes + comments + shares) / followers
  reach INTEGER, -- Unique users who saw the post
  impressions INTEGER, -- Total times post was displayed
  click_through_rate DECIMAL(5,4),
  
  -- Business Metrics
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  conversion_events INTEGER DEFAULT 0, -- Sign-ups, purchases from this post
  
  -- Performance Scores (0-100)
  virality_score INTEGER,
  quality_score INTEGER,
  relevance_score INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, analysis_date)
);

-- Indexes
CREATE INDEX idx_post_analytics_date ON post_analytics(analysis_date DESC);
CREATE INDEX idx_post_analytics_engagement_rate ON post_analytics(engagement_rate DESC);
```

#### 5. Trending Topics & Hashtags
```sql
-- Table: trending_topics
CREATE TABLE trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Topic Information
  topic_name VARCHAR(100) NOT NULL,
  topic_type VARCHAR(20), -- 'hashtag', 'keyword', 'mention'
  platform_id INTEGER REFERENCES social_platforms(id),
  
  -- Trend Metrics
  mention_count INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2), -- Percentage growth in last 24h
  
  -- Trend Analysis
  trend_start_date DATE,
  trend_peak_date DATE,
  trend_status VARCHAR(20) DEFAULT 'emerging', -- 'emerging', 'trending', 'declining', 'expired'
  
  -- Relevance to fitness
  fitness_relevance_score INTEGER, -- 0-100 how relevant to fitness/JMEFit
  content_opportunities TEXT[], -- Suggested content ideas
  
  -- Time tracking
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(topic_name, platform_id, DATE(first_detected_at))
);

-- Indexes
CREATE INDEX idx_trending_topics_platform_status ON trending_topics(platform_id, trend_status);
CREATE INDEX idx_trending_topics_growth_rate ON trending_topics(growth_rate DESC);
```

### Implementation Steps

#### Week 1: Core Schema
1. **Create Base Tables**
   - Social platforms configuration
   - Content posts structure
   - Basic engagement tracking

2. **Data Migration**
   - Migrate existing content data if any
   - Set up initial platform configurations
   - Create admin user permissions

#### Week 2: Analytics & Optimization
1. **Analytics Tables**
   - Post performance aggregations
   - Trending topics detection
   - User behavior tracking

2. **Optimization**
   - Database indexing strategy
   - Query performance tuning
   - Partitioning for scale

### Advanced Features

#### Content Optimization Schema
```sql
-- Table: content_templates
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Information
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'workout_demo', 'nutrition_tip', 'transformation'
  platform_id INTEGER REFERENCES social_platforms(id),
  
  -- Template Structure
  caption_template TEXT, -- With placeholders like {exercise_name}
  hashtag_sets TEXT[], -- Pre-defined hashtag combinations
  image_style_prompts TEXT[],
  
  -- Performance Data
  avg_engagement_rate DECIMAL(5,4),
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4), -- Percentage of posts that exceed avg engagement
  
  -- AI Optimization
  ai_optimized BOOLEAN DEFAULT FALSE,
  optimization_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### User Journey Tracking
```sql
-- Table: social_conversions
CREATE TABLE social_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source Information
  post_id UUID REFERENCES social_posts(id),
  platform_user_id VARCHAR(100),
  
  -- Conversion Journey
  first_interaction_type VARCHAR(20), -- 'like', 'comment', 'profile_visit'
  first_interaction_at TIMESTAMPTZ,
  conversion_type VARCHAR(50), -- 'email_signup', 'subscription', 'purchase'
  conversion_value DECIMAL(10,2), -- Revenue attributed to this conversion
  conversion_at TIMESTAMPTZ,
  
  -- Attribution
  time_to_conversion INTERVAL, -- Time between first interaction and conversion
  touchpoints INTEGER, -- Number of interactions before conversion
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration Points

### 1. Real-time Engagement Tracking
```typescript
// Webhook handler for Instagram engagement
interface EngagementWebhook {
  post_id: string;
  event_type: 'like' | 'comment' | 'share';
  user_id: string;
  timestamp: string;
}

export const handleEngagementWebhook = async (data: EngagementWebhook) => {
  await supabase
    .from('engagement_events')
    .insert({
      post_id: data.post_id,
      event_type: data.event_type,
      platform_user_id: data.user_id,
      event_timestamp: data.timestamp,
    });
  
  // Update real-time analytics
  await updatePostAnalytics(data.post_id);
};
```

### 2. Trend Detection Algorithm
```typescript
// Trend analysis function
export const detectTrendingTopics = async () => {
  const query = `
    SELECT 
      topic_name,
      COUNT(*) as mention_count,
      (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY analysis_date)) / LAG(COUNT(*)) * 100 as growth_rate
    FROM hashtag_mentions 
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY topic_name, DATE(created_at)
    HAVING COUNT(*) > 50
    ORDER BY growth_rate DESC
    LIMIT 20
  `;
  
  const trends = await supabase.rpc('detect_trends', { query });
  
  // Update trending_topics table
  for (const trend of trends) {
    await upsertTrendingTopic(trend);
  }
};
```

### 3. Performance Analytics Dashboard Queries
```sql
-- Top performing content by category
CREATE OR REPLACE FUNCTION get_top_content_by_category(
  category_filter VARCHAR(50) DEFAULT NULL,
  time_period INTEGER DEFAULT 30
)
RETURNS TABLE (
  post_id UUID,
  caption TEXT,
  engagement_rate DECIMAL,
  total_engagement INTEGER,
  conversion_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.caption,
    pa.engagement_rate,
    (pa.likes_count + pa.comments_count + pa.shares_count) as total_engagement,
    COUNT(sc.id)::INTEGER as conversion_count
  FROM social_posts sp
  JOIN post_analytics pa ON sp.id = pa.post_id
  LEFT JOIN social_conversions sc ON sp.id = sc.post_id
  WHERE 
    (category_filter IS NULL OR sp.content_category = category_filter)
    AND sp.published_at >= NOW() - INTERVAL '1 day' * time_period
  GROUP BY sp.id, sp.caption, pa.engagement_rate, total_engagement
  ORDER BY pa.engagement_rate DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
```

## Data Retention & Archiving

### Retention Policies
```sql
-- Archive old engagement events (keep 2 years of detailed data)
CREATE OR REPLACE FUNCTION archive_old_engagement_events()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move events older than 2 years to archive table
  WITH moved_events AS (
    DELETE FROM engagement_events 
    WHERE created_at < NOW() - INTERVAL '2 years'
    RETURNING *
  )
  INSERT INTO engagement_events_archive SELECT * FROM moved_events;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly archiving
SELECT cron.schedule('archive-engagement', '0 0 1 * *', 'SELECT archive_old_engagement_events();');
```

## Performance Optimization

### Database Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_posts_user_platform_date ON social_posts(user_id, platform_id, published_at DESC);
CREATE INDEX idx_engagement_post_date ON engagement_events(post_id, event_timestamp DESC);
CREATE INDEX idx_analytics_performance ON post_analytics(engagement_rate DESC, analysis_date DESC);

-- Partial indexes for specific use cases
CREATE INDEX idx_published_posts ON social_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_trending_active ON trending_topics(growth_rate DESC) WHERE trend_status = 'trending';
```

### Query Optimization
```sql
-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW daily_platform_metrics AS
SELECT 
  platform_id,
  DATE(published_at) as publish_date,
  COUNT(*) as posts_count,
  AVG(pa.engagement_rate) as avg_engagement_rate,
  SUM(pa.likes_count + pa.comments_count + pa.shares_count) as total_engagement
FROM social_posts sp
JOIN post_analytics pa ON sp.id = pa.post_id
WHERE sp.status = 'published'
GROUP BY platform_id, DATE(published_at);

-- Refresh daily
SELECT cron.schedule('refresh-daily-metrics', '0 2 * * *', 'REFRESH MATERIALIZED VIEW daily_platform_metrics;');
```

## Success Metrics

### Technical KPIs
- **Query Performance**: < 100ms for dashboard queries
- **Data Integrity**: 99.9% accuracy in engagement tracking
- **Storage Efficiency**: < 1GB growth per 10K posts
- **Uptime**: 99.95% database availability

### Business KPIs
- **Insights Generation**: Daily trending topic identification
- **Content Performance**: Track 20+ metrics per post
- **Conversion Attribution**: Track social → business conversions
- **Growth Analytics**: Monitor engagement rate improvements

## Migration Strategy

### Phase 1: Core Schema (Week 1)
1. Create social_platforms and social_posts tables
2. Set up basic engagement tracking
3. Migrate any existing social content data

### Phase 2: Analytics & Trends (Week 2)
1. Implement post_analytics aggregations
2. Create trending_topics detection system
3. Set up automated data processing

### Phase 3: Optimization (Week 3)
1. Add performance indexes and partitioning
2. Implement archiving and retention policies
3. Create materialized views for dashboards

---

**Priority**: 🟡 Medium (Phase 2)
**Effort**: ⭐⭐⭐⭐ High (5-6 days)
**Impact**: ⭐⭐⭐⭐⭐ Very High 