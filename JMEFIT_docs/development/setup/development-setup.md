# JMEFit Social-Growth Engine Development Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the complete JMEFit social-growth engine development environment. Follow this guide to implement all 17 components systematically across the 4 development phases.

## Prerequisites

### System Requirements
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: v18+ (LTS recommended)
- **Docker**: v20+ with Docker Compose
- **Git**: v2.30+
- **Text Editor**: VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Docker
  - PostgreSQL
  - Redis

### Account Setup Required
- **GitHub Account**: For code repository and CI/CD
- **Supabase Account**: Database and backend services
- **Doppler Account**: Environment variable management
- **OpenAI Account**: AI content generation
- **Netlify Account**: Deployment and hosting

## Phase 1: Quick Wins (Week 1-2)

### Component 1: OpenAI Image Generation Enhancement

#### Setup Steps
1. **Verify OpenAI Configuration**
   ```bash
   # Check current OpenAI setup
   cd your-project-directory
   grep -r "OPENAI_API_KEY" src/
   npm list openai
   ```

2. **Upgrade OpenAI SDK (if needed)**
   ```bash
   npm install openai@^4.0.0
   npm install @types/openai --save-dev
   ```

3. **Create Image Generation Service**
   ```bash
   # Create the new service file
   touch src/lib/image-generation.ts
   ```

4. **Add Environment Variables**
   ```bash
   # Add to your .env file
   echo "VITE_OPENAI_IMAGE_MODEL=gpt-image-1" >> .env.local
   echo "VITE_OPENAI_MAX_IMAGES_PER_DAY=100" >> .env.local
   ```

5. **Test Implementation**
   ```bash
   npm run dev
   # Test image generation in browser console or create a test page
   ```

#### Expected Outcome
- AI image generation working with `gpt-image-1` model
- Basic fitness-focused image templates
- Integration with existing chatbot

### Component 2: Environment Vault Centralization

#### Setup Steps
1. **Create Doppler Account**
   - Visit [doppler.com](https://doppler.com)
   - Create account and new project called "jmefit"
   - Create environments: `development`, `staging`, `production`

2. **Install Doppler CLI**
   ```bash
   # macOS
   brew install dopplerhq/cli/doppler
   
   # Linux/Windows
   curl -Ls https://cli.doppler.com/install.sh | sh
   ```

3. **Migrate Environment Variables**
   ```bash
   # Login to Doppler
   doppler login
   
   # Set up project
   doppler setup --project jmefit --config development
   
   # Import existing env vars
   doppler secrets set VITE_SUPABASE_URL="your-current-url"
   doppler secrets set VITE_OPENAI_API_KEY="your-current-key"
   # ... continue for all variables
   ```

4. **Update Development Workflow**
   ```bash
   # Add to package.json scripts
   "dev": "doppler run -- vite",
   "build": "doppler run -- vite build"
   ```

#### Expected Outcome
- All secrets centralized in Doppler
- Environment-specific configurations
- Secure local development setup

### Component 3: CI/CD GitHub Actions Setup

#### Setup Steps
1. **Create GitHub Actions Directory**
   ```bash
   mkdir -p .github/workflows
   ```

2. **Add CI/CD Configuration Files**
   ```bash
   # Create main CI workflow
   touch .github/workflows/ci.yml
   touch .github/workflows/deploy.yml
   ```

3. **Configure GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add required secrets:
     - `DOPPLER_TOKEN`
     - `NETLIFY_AUTH_TOKEN`
     - `NETLIFY_SITE_ID`

4. **Set Up Branch Protection**
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require status checks to pass
   - Require pull request reviews

5. **Test Pipeline**
   ```bash
   git add .github/
   git commit -m "Add CI/CD pipeline"
   git push origin feature/ci-cd-setup
   # Create PR to test pipeline
   ```

#### Expected Outcome
- Automated testing on every PR
- Secure deployment to Netlify
- Quality gates preventing broken deployments

## Phase 2: Foundation Building (Week 3-4)

### Component 4: Docker Containerization

#### Setup Steps
1. **Create Docker Configuration**
   ```bash
   touch Dockerfile.frontend
   touch Dockerfile.api
   touch Dockerfile.dev
   touch docker-compose.yml
   touch docker-compose.prod.yml
   ```

2. **Build Development Environment**
   ```bash
   # Build all containers
   docker-compose build
   
   # Start development stack
   docker-compose up -d
   
   # Verify services are running
   docker-compose ps
   ```

3. **Test Container Setup**
   ```bash
   # Access frontend
   curl http://localhost:5173
   
   # Access API
   curl http://localhost:3000/health
   
   # Check logs
   docker-compose logs -f frontend
   ```

#### Expected Outcome
- Consistent development environment
- All services containerized
- Easy onboarding for new developers

### Component 5: Social Database Schema

#### Setup Steps
1. **Create Migration Files**
   ```bash
   mkdir -p supabase/migrations/social-schema
   touch supabase/migrations/social-schema/001_social_platforms.sql
   touch supabase/migrations/social-schema/002_social_posts.sql
   touch supabase/migrations/social-schema/003_engagement_events.sql
   ```

2. **Run Database Migrations**
   ```bash
   # Using Supabase CLI
   npx supabase db push
   
   # Or using direct SQL execution
   npx supabase db reset
   ```

3. **Verify Schema Creation**
   ```bash
   # Connect to database
   npx supabase db shell
   
   # Check tables
   \dt social_*
   
   # Verify indexes
   \di social_*
   ```

4. **Set Up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all social tables
   ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
   ```

#### Expected Outcome
- Complete social media database schema
- Proper indexing for performance
- Security policies implemented

## Phase 3: Core Social Features (Week 5-8)

### Component 11: Instagram API Integration

#### Setup Steps
1. **Create Instagram Developer Account**
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Create new app for Instagram Basic Display API
   - Get App ID and App Secret

2. **Set Up Webhook Endpoints**
   ```bash
   # Create webhook handler
   touch netlify/functions/instagram-webhook.js
   ```

3. **Configure API Integration**
   ```bash
   # Add Instagram credentials to Doppler
   doppler secrets set INSTAGRAM_APP_ID="your-app-id"
   doppler secrets set INSTAGRAM_APP_SECRET="your-app-secret"
   ```

4. **Test API Connection**
   ```bash
   # Create test script
   touch scripts/test-instagram-api.js
   node scripts/test-instagram-api.js
   ```

#### Expected Outcome
- Instagram API integration working
- Webhook endpoints receiving data
- Basic posting capabilities

## Development Workflow

### Daily Development Process

1. **Start Development Environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Or use Doppler + local dev
   doppler run -- npm run dev
   ```

2. **Work on Features**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Make changes
   # ... coding ...
   
   # Run tests
   npm run test
   npm run type-check
   npm run lint
   ```

3. **Commit and Deploy**
   ```bash
   # Commit changes
   git add .
   git commit -m "feat: add your feature"
   
   # Push and create PR
   git push origin feature/your-feature-name
   # Create PR in GitHub
   ```

### Testing Strategy

#### Unit Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Integration Tests
```bash
# Test API endpoints
npm run test:api

# Test database operations
npm run test:db

# Test social media integrations
npm run test:social
```

#### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in CI mode
npm run test:e2e:ci
```

## Monitoring & Debugging

### Log Management
```bash
# View application logs
docker-compose logs -f frontend
docker-compose logs -f api

# View database logs
npx supabase logs

# View function logs
netlify functions:log
```

### Performance Monitoring
```bash
# Check bundle size
npm run analyze

# Run Lighthouse audit
npm run lighthouse

# Monitor API performance
curl -w "%{time_total}\n" http://localhost:3000/api/health
```

### Database Monitoring
```sql
-- Check database performance
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Monitor query performance
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Environment Management

### Development Environment
```bash
# Environment variables for development
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3000
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Staging Environment
```bash
# Environment variables for staging
VITE_APP_ENV=staging
VITE_API_URL=https://staging-api.jmefit.com
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=info
```

### Production Environment
```bash
# Environment variables for production
VITE_APP_ENV=production
VITE_API_URL=https://api.jmefit.com
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=warn
```

## Troubleshooting Guide

### Common Issues

#### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -f
docker-compose up -d --build

# Check disk space
docker system df
```

#### Database Connection Issues
```bash
# Test Supabase connection
npx supabase status
npx supabase db ping

# Reset local database
npx supabase db reset
```

#### Environment Variable Issues
```bash
# Check Doppler sync
doppler secrets get
doppler run -- env | grep VITE_

# Refresh secrets
doppler secrets sync
```

### Performance Issues
```bash
# Check memory usage
docker stats

# Analyze bundle size
npm run build
npm run analyze

# Profile database queries
EXPLAIN ANALYZE SELECT * FROM social_posts WHERE user_id = 'uuid';
```

## Security Checklist

### Development Security
- [ ] All secrets stored in Doppler (not in code)
- [ ] RLS policies enabled on all tables
- [ ] API endpoints have proper authentication
- [ ] Input validation on all user inputs
- [ ] CORS configured properly

### Production Security
- [ ] HTTPS enabled on all endpoints
- [ ] Security headers configured
- [ ] Database backups automated
- [ ] API rate limiting implemented
- [ ] Vulnerability scanning in CI/CD

## Next Steps

After completing Phase 1-2 setup:

1. **Implement Phase 3 Components** (Weeks 5-8)
   - Enhanced Analytics
   - TypeScript Monorepo
   - Token Rotation
   - Instagram Integration

2. **Add Phase 4 Components** (Weeks 9-12)
   - TikTok Integration
   - Video Generation
   - DM Automation
   - ML Optimization

3. **Production Optimization**
   - Performance tuning
   - Security hardening
   - Monitoring setup
   - Team training

## Support & Resources

### Documentation
- [Component Documentation](../README.md) - Overview of all components
- [API Reference](../../API_docs/) - API documentation
- [Database Schema](../05-social-database-schema/) - Database design

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Docker Documentation](https://docs.docker.com)

---

**Last Updated**: January 2025
**Status**: Ready for Implementation
**Estimated Setup Time**: 2-4 weeks (depending on team size and experience) 