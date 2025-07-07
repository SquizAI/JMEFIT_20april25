# Environment Vault Centralization

## Overview

Centralize and secure all API keys, secrets, and environment variables using a proper secrets management solution. This will improve security, enable automated token rotation, and provide better access control for the growing number of integrations.

## Current State

### ✅ What We Have
- Basic environment variables via Netlify
- Supabase secrets for database access
- OpenAI API key configuration
- Manual secret management through platform dashboards

### ❌ What's Missing
- Centralized secrets management
- Automated secret rotation
- Environment-specific configurations
- Audit logging for secret access
- Team-based access controls

## Business Impact

### 🎯 Primary Benefits
- **Security**: Centralized secret management with encryption at rest
- **Compliance**: Audit trails for secret access and modifications
- **Scalability**: Easy addition of new API integrations
- **Team Collaboration**: Role-based access to different environments

### 📊 Expected Metrics
- **Security Incidents**: Reduce risk of exposed credentials by 90%
- **Integration Speed**: Reduce new API setup time from hours to minutes
- **Operational Overhead**: Reduce manual secret management by 80%
- **Compliance**: 100% audit trail coverage for secret access

## Technical Implementation

### Architecture Overview
```
Development → Staging → Production
     ↓          ↓          ↓
Environment Vault (Doppler/HashiCorp Vault)
     ↓          ↓          ↓
Applications ← Secrets ← Automated Rotation
```

### Recommended Solution: Doppler

**Why Doppler:**
- Easy integration with existing Netlify/Vercel deployments
- Built-in environment management (dev/staging/prod)
- Team collaboration features
- Automatic secret syncing
- Competitive pricing for startups

### Core Components

#### 1. Secret Categories
```typescript
// Secret organization structure
interface SecretVault {
  // AI & Content Generation
  openai: {
    apiKey: string;
    organizationId: string;
  };
  
  // Database & Backend
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // Social Media APIs
  instagram: {
    appId: string;
    appSecret: string;
    accessToken: string;
    verifyToken: string;
  };
  
  tiktok: {
    clientKey: string;
    clientSecret: string;
    accessToken: string;
  };
  
  // Analytics & Monitoring
  analytics: {
    googleAnalyticsId: string;
    sentryDsn: string;
    grafanaApiKey: string;
  };
  
  // Infrastructure
  redis: {
    url: string;
    password: string;
  };
  
  // Third-party Integrations
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
}
```

#### 2. Environment Configuration
```typescript
// Environment-specific configurations
interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  frontendUrl: string;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  rateLimits: {
    openai: number;
    instagram: number;
    tiktok: number;
  };
}
```

### Implementation Steps

#### Week 1: Setup & Migration
1. **Doppler Account Setup**
   - Create Doppler account
   - Configure environments (dev/staging/prod)
   - Set up team access controls

2. **Secret Migration**
   - Audit all existing environment variables
   - Migrate secrets from Netlify to Doppler
   - Update deployment configurations

#### Week 2: Integration & Automation
1. **Application Integration**
   - Install Doppler CLI and SDKs
   - Update application startup to fetch secrets
   - Configure auto-sync for deployments

2. **Team Access Setup**
   - Configure role-based access controls
   - Set up secret approval workflows
   - Enable audit logging

### Code Examples

#### Doppler Integration
```typescript
// src/lib/secrets.ts
import { doppler } from '@doppler/sdk';

// Initialize Doppler client
const dopplerClient = doppler({
  token: process.env.DOPPLER_TOKEN,
});

// Type-safe secret retrieval
export const getSecrets = async (): Promise<SecretVault> => {
  const secrets = await dopplerClient.secrets.get();
  
  return {
    openai: {
      apiKey: secrets.OPENAI_API_KEY,
      organizationId: secrets.OPENAI_ORG_ID,
    },
    supabase: {
      url: secrets.VITE_SUPABASE_URL,
      anonKey: secrets.VITE_SUPABASE_ANON_KEY,
      serviceRoleKey: secrets.SUPABASE_SERVICE_ROLE_KEY,
    },
    // ... other secrets
  };
};
```

#### Environment-Specific Configuration
```typescript
// src/lib/config.ts
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV as EnvironmentConfig['environment'];
  
  const configs: Record<string, EnvironmentConfig> = {
    development: {
      environment: 'development',
      apiBaseUrl: 'http://localhost:3000',
      frontendUrl: 'http://localhost:5173',
      debugMode: true,
      logLevel: 'debug',
      rateLimits: {
        openai: 100,
        instagram: 50,
        tiktok: 30,
      },
    },
    staging: {
      environment: 'staging',
      apiBaseUrl: 'https://staging-api.jmefit.com',
      frontendUrl: 'https://staging.jmefit.com',
      debugMode: true,
      logLevel: 'info',
      rateLimits: {
        openai: 500,
        instagram: 200,
        tiktok: 100,
      },
    },
    production: {
      environment: 'production',
      apiBaseUrl: 'https://api.jmefit.com',
      frontendUrl: 'https://jmefit.com',
      debugMode: false,
      logLevel: 'warn',
      rateLimits: {
        openai: 1000,
        instagram: 500,
        tiktok: 300,
      },
    },
  };
  
  return configs[env] || configs.development;
};
```

#### Secret Rotation Handler
```typescript
// src/lib/secret-rotation.ts
interface SecretRotationConfig {
  secretName: string;
  rotationInterval: number; // days
  rotationFunction: () => Promise<string>;
}

export const setupSecretRotation = (configs: SecretRotationConfig[]) => {
  configs.forEach(config => {
    // Schedule rotation using cron job or webhook
    scheduleRotation(config);
  });
};

const rotateInstagramToken = async (): Promise<string> => {
  // Implement Instagram token refresh logic
  const newToken = await refreshInstagramToken();
  
  // Update in Doppler
  await dopplerClient.secrets.update({
    name: 'INSTAGRAM_ACCESS_TOKEN',
    value: newToken,
  });
  
  return newToken;
};
```

## Integration Points

### 1. Netlify Functions
- Update functions to use Doppler secrets
- Configure environment-specific deployments
- Enable automatic secret syncing

### 2. CI/CD Pipeline
- Integrate Doppler with GitHub Actions
- Environment-specific secret injection
- Secure deployment workflows

### 3. Development Environment
- Local development with Doppler CLI
- Team onboarding automation
- Consistent environment setup

## Security Benefits

### Access Control
- **Role-Based Access**: Developers, QA, DevOps, Admin roles
- **Environment Isolation**: Production secrets restricted to authorized personnel
- **Temporary Access**: Time-limited access for contractors/consultants

### Audit & Compliance
- **Access Logging**: Every secret access logged with user/time/action
- **Change History**: Full audit trail of secret modifications
- **Compliance Reports**: SOC 2, GDPR compliance documentation

### Encryption & Security
- **Encryption at Rest**: AES-256 encryption for stored secrets
- **Encryption in Transit**: TLS 1.3 for secret transmission
- **Zero-Knowledge**: Service provider cannot decrypt secrets

## Cost Analysis

### Doppler Pricing (Estimated)
- **Starter Plan**: $0/month (5 team members, 3 projects)
- **Professional**: $12/month per member (unlimited projects)
- **Enterprise**: Custom pricing for advanced features

### Alternative Solutions
- **HashiCorp Vault**: Self-hosted, higher complexity, $0 for OSS
- **AWS Secrets Manager**: $0.40 per secret per month + API calls
- **Azure Key Vault**: $0.03 per 10,000 operations

### ROI Calculation
- **Current Risk**: Potential security incident = $50,000+ in damages
- **Time Savings**: 10 hours/month saved on manual secret management
- **Reduced Risk**: 90% reduction in credential exposure incidents

## Migration Plan

### Phase 1: Setup (Day 1-2)
1. Create Doppler account and configure environments
2. Audit all existing environment variables
3. Create secret categories and naming conventions

### Phase 2: Migration (Day 3-4)
1. Migrate non-production secrets first
2. Update development environment configurations
3. Test secret retrieval and application startup

### Phase 3: Production (Day 5-7)
1. Schedule production migration during maintenance window
2. Update production deployment configurations
3. Verify all services are functioning correctly
4. Implement monitoring and alerts

## Success Metrics

### Technical KPIs
- **Secret Access Speed**: < 100ms per secret retrieval
- **Deployment Success Rate**: > 99.9% with new secret system
- **Secret Sync Accuracy**: 100% consistency across environments

### Security KPIs
- **Exposed Credentials**: 0 incidents in first 6 months
- **Access Compliance**: 100% of secret access logged and auditable
- **Team Onboarding**: < 30 minutes to grant new developer access

### Operational KPIs
- **Manual Secret Management**: Reduce from 10 hours/month to < 1 hour/month
- **Integration Setup Time**: Reduce from 2-4 hours to 15-30 minutes
- **Environment Consistency**: 100% parity between environments

## Risks & Mitigation

### Technical Risks
- **Service Outage**: Implement fallback mechanisms and caching
- **API Rate Limits**: Monitor usage and implement exponential backoff
- **Secret Corruption**: Regular backups and integrity checks

### Business Risks
- **Vendor Lock-in**: Choose solution with export capabilities
- **Cost Overruns**: Monitor usage and set spending alerts
- **Team Resistance**: Provide training and clear documentation

## Dependencies

### External
- Doppler or alternative secrets management service
- Updated CI/CD pipeline configurations
- Team training on new secret access patterns

### Internal
- Updated deployment scripts and configurations
- Modified application startup procedures
- Updated development environment setup documentation

---

**Priority**: 🟢 High (Phase 1)
**Effort**: ⭐⭐ Low (1 day)
**Impact**: ⭐⭐⭐⭐ High 