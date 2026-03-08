# AWS Architecture Documentation - Farmer Fintech Platform

> **Region**: ap-south-1 (Mumbai) | **Compliance**: DPDPA 2023

## Architecture Diagrams

This document provides comprehensive AWS architecture documentation with visual diagrams.

### 1. Deployment Architecture
**File**: `generated-diagrams/aws-deployment-architecture.png`

Shows the complete AWS infrastructure including:
- Edge layer (CloudFront, WAF)
- Frontend hosting (Amplify)
- API Gateway
- VPC with public/private subnets
- ECS Fargate cluster
- Database layer (RDS, ElastiCache, DynamoDB)
- Storage (S3 buckets)
- AI/ML (AWS Bedrock)
- Serverless functions (Lambda)
- Security (Secrets Manager, KMS)
- Monitoring (CloudWatch, X-Ray)

### 2. Solution Architecture
**File**: `generated-diagrams/aws-solution-architecture.png`

Shows the application flow including:
- User journey from mobile device
- React PWA features (Dashboard, Learn, Tools, Schemes)
- API routes and business logic
- Data storage (PostgreSQL, Redis, DynamoDB)
- AI integration with Bedrock
- Async processing with Lambda
- Multi-language support

### 3. AI Q&A Data Flow
**File**: `generated-diagrams/aws-data-flow-ai-qa.png`

Detailed flow showing:
- User asks question about government schemes
- Cache check in Redis (FAQ cache)
- Cache hit: Return cached answer (< 10ms)
- Cache miss: Invoke AWS Bedrock with context
- Context includes: scheme data + user profile + language
- Store response in cache (1 hour TTL)
- Return AI-generated answer

### 4. Offline Sync Flow
**File**: `generated-diagrams/aws-offline-sync-flow.png`

Shows offline-first architecture:
- User completes lessons/calculators while offline
- Data stored in IndexedDB (local storage)
- Service Worker detects reconnection
- Uploads payload to S3 sync bucket
- Lambda processes S3 event
- Updates PostgreSQL and DynamoDB
- Sends sync confirmation via SNS

### 5. Network Architecture
**File**: `generated-diagrams/aws-network-architecture.png`

VPC design with:
- Public subnets (10.0.1.0/24, 10.0.2.0/24) in 2 AZs
- Private subnets (10.0.3.0/24, 10.0.4.0/24) in 2 AZs
- Internet Gateway for public access
- NAT Gateway for private subnet internet access
- Security groups (ALB, ECS, RDS)
- VPC endpoints (S3, Bedrock, Secrets Manager)
- Route tables for public and private subnets


## Architecture Components

### Edge & CDN Layer
- **CloudFront**: Global CDN for static assets, edge caching
- **WAF**: DDoS protection, rate limiting, SQL injection prevention
- **Amplify**: React PWA hosting with CI/CD from GitHub

### API Layer
- **API Gateway (HTTP API)**: Rate limiting, usage plans, request validation
- **Application Load Balancer**: Health checks, target groups, multi-AZ

### Compute Layer
- **ECS Fargate**: Serverless containers, auto-scaling (1-10 tasks)
- **ECR**: Docker image registry for FastAPI backend
- **Lambda Functions**:
  - offline-sync-processor: Processes S3 uploads
  - audio-preprocessor: Compresses audio for 2G networks
  - daily-engagement-digest: Sends SMS tips at 9AM IST

### Database Layer
- **RDS PostgreSQL 15**: Primary database with pgvector extension
  - Instance: db.t3.micro
  - Storage: 20GB
  - Automated backups: 7-day retention
- **ElastiCache Redis**: Caching layer
  - Instance: cache.t3.micro
  - TTL: 1 hour for schemes, lessons, FAQ
- **DynamoDB**: Game sessions and offline queue
  - On-demand pricing
  - Point-in-time recovery enabled

### Storage Layer
- **S3 Content Bucket**: Audio files, images, compressed assets
  - Lifecycle policies for old content
  - CloudFront distribution
- **S3 Sync Bucket**: Offline sync payloads
  - S3 event triggers Lambda
  - Versioning enabled

### AI/ML Layer
- **AWS Bedrock (Claude 3 Sonnet)**: AI-powered Q&A
  - Use cases: Scheme Q&A, financial education, personalization
  - Cost optimization: FAQ caching (1 hour TTL)
  - Multi-language support (Hindi, Punjabi, Marathi, English)

### Security Layer
- **Secrets Manager**: Database credentials, JWT secret, API keys
- **KMS**: AES-256 encryption for data at rest
- **IAM Roles**: Least privilege access for ECS tasks and Lambda
- **Security Groups**: Network-level access control

### Monitoring Layer
- **CloudWatch**: Logs, metrics, alarms
  - API latency (p50, p95, p99)
  - Cache hit ratio
  - Error rates by endpoint
- **X-Ray**: Distributed tracing, bottleneck detection


## Data Flow Patterns

### 1. Authentication Flow
```
User → PWA → POST /api/v1/auth/login
→ FastAPI validates credentials (Bcrypt)
→ Generate JWT token (24h expiry)
→ Return token to PWA
→ Store in localStorage
```

### 2. Dashboard Flow
```
User → PWA → GET /api/v1/home (with JWT)
→ FastAPI fetches user profile + progress
→ Calculate farm snapshot (profit, risk, emergency fund)
→ Return personalized dashboard data
→ PWA displays metrics + daily tip
```

### 3. Lesson Flow (with caching)
```
User → PWA → GET /api/v1/lessons?category=crop_planning
→ FastAPI checks Redis cache (lesson:{id})
→ Cache hit: Return cached data (< 10ms)
→ Cache miss: Query PostgreSQL → Cache result → Return
→ PWA displays lesson list with translations
```

### 4. AI Q&A Flow (with caching)
```
User asks: "PM-Kisan के लिए कौन eligible है?"
→ PWA → POST /api/v1/schemes/ask
→ FastAPI checks FAQ cache (faq:{hash})
→ Cache miss: Invoke AWS Bedrock
→ Bedrock receives:
  - Question
  - Scheme context (eligibility, documents)
  - User profile (crop, state, land)
  - Language preference (Hindi)
→ Bedrock returns AI-generated answer
→ Cache response (1 hour TTL)
→ Return to PWA → Display answer
```

### 5. Offline Sync Flow
```
User goes offline → Completes lesson
→ Service Worker stores in IndexedDB
→ User reconnects → Service Worker detects online
→ POST /api/v1/sync/upload with payload
→ FastAPI uploads to S3 sync bucket
→ S3 event triggers Lambda (offline-sync-processor)
→ Lambda updates PostgreSQL + DynamoDB
→ SNS sends sync confirmation
```

### 6. Daily Engagement Flow
```
EventBridge triggers Lambda at 9AM IST (0 3 * * * UTC)
→ Lambda queries users with active_engagement=true
→ Generate personalized tip based on:
  - User's crop type
  - Current season
  - Incomplete lessons
→ Publish to SNS topic
→ SNS sends SMS to farmer's phone
```


## Network Architecture

### VPC Design
- **CIDR Block**: 10.0.0.0/16
- **Region**: ap-south-1 (Mumbai)
- **Availability Zones**: ap-south-1a, ap-south-1b

### Subnets

#### Public Subnets
- **Public Subnet A**: 10.0.1.0/24 (ap-south-1a)
  - Application Load Balancer
  - NAT Gateway
- **Public Subnet B**: 10.0.2.0/24 (ap-south-1b)
  - Application Load Balancer (standby)

#### Private Subnets
- **Private Subnet A**: 10.0.3.0/24 (ap-south-1a)
  - ECS Fargate tasks
  - RDS PostgreSQL primary
- **Private Subnet B**: 10.0.4.0/24 (ap-south-1b)
  - ECS Fargate tasks
  - ElastiCache Redis

### Security Groups

#### ALB Security Group
- **Ingress**: Port 80 (HTTP) from 0.0.0.0/0
- **Egress**: All traffic to 0.0.0.0/0

#### ECS Security Group
- **Ingress**: Port 8000 from ALB Security Group only
- **Egress**: All traffic to 0.0.0.0/0

#### RDS Security Group
- **Ingress**: Port 5432 (PostgreSQL) from ECS Security Group only
- **Egress**: None

### Route Tables

#### Public Route Table
- **Route 1**: 10.0.0.0/16 → local
- **Route 2**: 0.0.0.0/0 → Internet Gateway
- **Associated Subnets**: Public Subnet A, Public Subnet B

#### Private Route Table
- **Route 1**: 10.0.0.0/16 → local
- **Route 2**: 0.0.0.0/0 → NAT Gateway
- **Associated Subnets**: Private Subnet A, Private Subnet B

### VPC Endpoints
- **S3 Gateway Endpoint**: For S3 access without internet
- **Bedrock Interface Endpoint**: For Bedrock access without internet
- **Secrets Manager Interface Endpoint**: For secrets access without internet


## High Availability & Disaster Recovery

### Multi-AZ Deployment
- **ECS Tasks**: Deployed across ap-south-1a and ap-south-1b
- **Application Load Balancer**: Spans both availability zones
- **RDS PostgreSQL**: Multi-AZ deployment (future enhancement)
- **ElastiCache Redis**: Cluster mode with replicas (future enhancement)

### Auto-Scaling
- **ECS Service**: Auto-scaling based on CPU/memory (1-10 tasks)
  - Scale up: CPU > 70% for 2 minutes
  - Scale down: CPU < 30% for 5 minutes
- **DynamoDB**: On-demand capacity mode (auto-scaling)

### Backup Strategy
- **RDS PostgreSQL**: Automated daily backups (7-day retention)
- **S3 Buckets**: Versioning enabled, lifecycle policies
- **DynamoDB**: Point-in-time recovery (35-day retention)

### Health Checks
- **ALB Health Check**: GET /health every 30 seconds
  - Healthy threshold: 2 consecutive successes
  - Unhealthy threshold: 3 consecutive failures
- **ECS Task Health**: Container health check every 30 seconds

### Disaster Recovery Plan
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 5 minutes
- **Backup Restoration**: Automated via AWS Backup
- **Cross-Region Replication**: Not enabled (DPDPA compliance)


## Performance Optimization

### Caching Strategy
- **Redis Cache**: Schemes (1h), Lessons (1h), FAQ (1h)
- **CloudFront**: Static assets cached at edge locations
- **Service Worker**: PWA caches API responses and static assets
- **Cache Hit Ratio Target**: > 80%

### Database Optimization
- **PostgreSQL Indexes**: user_id, lesson_id, scheme_id, category
- **Connection Pooling**: SQLAlchemy async engine (pool size: 20)
- **Query Optimization**: Async/await for all I/O operations
- **Read Replicas**: Future enhancement for read-heavy workloads

### API Optimization
- **Async/Await**: All database and external API calls non-blocking
- **Pagination**: Lessons and schemes paginated (20 items per page)
- **Compression**: Gzip compression for API responses
- **Response Time Target**: < 2 seconds at 95th percentile

### Cost Optimization
- **Bedrock Caching**: Reduces AI costs by 80%
- **S3 Lifecycle Policies**: Move old sync payloads to Glacier after 30 days
- **Lambda Concurrency Limits**: Prevent runaway costs
- **ECS Fargate Spot**: Future enhancement for non-critical tasks
- **DynamoDB On-Demand**: Pay only for actual usage


## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: 24-hour expiry, HS256 algorithm
- **Password Hashing**: Bcrypt with cost factor 12
- **Token Refresh**: Future enhancement for seamless UX
- **Session Management**: Stateless (JWT-based)

### Data Protection
- **TLS 1.3**: All connections encrypted in transit
- **AES-256**: Data encrypted at rest via KMS
- **Secrets Manager**: Credentials rotated every 90 days
- **IAM Roles**: Least privilege access for all services

### API Security
- **Rate Limiting**: API Gateway (100 requests/hour per user)
- **CORS**: Configured for production domains only
- **SQL Injection**: Protected via SQLAlchemy ORM
- **XSS Protection**: React built-in escaping
- **CSRF Protection**: JWT tokens in Authorization header

### Network Security
- **Security Groups**: Stateful firewall rules
- **NACLs**: Network-level access control (future)
- **VPC Endpoints**: Private access to AWS services
- **WAF Rules**: Block common attack patterns

### Compliance
- **DPDPA 2023**: All data in ap-south-1 (Mumbai)
- **Data Residency**: No cross-region replication
- **Audit Logging**: CloudTrail enabled for all API calls
- **Encryption**: KMS keys managed by AWS


## Monitoring & Observability

### CloudWatch Metrics
- **API Latency**: p50, p95, p99 response times
- **Error Rates**: 4xx and 5xx errors by endpoint
- **Cache Hit Ratio**: Redis cache effectiveness
- **Bedrock Invocations**: AI usage and costs
- **ECS Task Count**: Auto-scaling behavior
- **Database Connections**: Connection pool utilization

### CloudWatch Alarms
- **High Error Rate**: > 5% 5xx errors for 5 minutes
- **High Latency**: p95 > 2 seconds for 5 minutes
- **Low Cache Hit Ratio**: < 70% for 10 minutes
- **ECS Task Failures**: > 2 task failures in 5 minutes
- **Database CPU**: > 80% for 10 minutes

### X-Ray Tracing
- **Request Tracing**: End-to-end request flow
- **Service Map**: Visual representation of dependencies
- **Bottleneck Detection**: Identify slow components
- **Error Analysis**: Root cause analysis for failures

### Logging Strategy
- **CloudWatch Logs**: Centralized logging for all services
- **Log Groups**:
  - /ecs/farmer-backend (ECS tasks)
  - /aws/lambda/offline-sync-processor
  - /aws/lambda/audio-preprocessor
  - /aws/lambda/daily-engagement-digest
- **Log Retention**: 7 days (dev), 30 days (prod)
- **Structured Logging**: JSON format with request IDs

### Dashboards
- **Operational Dashboard**: Real-time metrics and alarms
- **Business Dashboard**: User engagement, lesson completion
- **Cost Dashboard**: AWS service costs and trends


## Deployment Strategy

### CI/CD Pipeline
- **Frontend (Amplify)**:
  - GitHub integration
  - Automatic builds on push to main
  - Preview deployments for PRs
  - Rollback capability
- **Backend (ECS)**:
  - GitHub Actions workflow
  - Build Docker image → Push to ECR
  - Update ECS task definition
  - Rolling deployment (zero downtime)

### Environment Strategy
- **Development**: Local Docker Compose
- **Staging**: AWS ECS (single task)
- **Production**: AWS ECS (auto-scaling 1-10 tasks)

### Deployment Process
1. Developer pushes code to GitHub
2. GitHub Actions triggers build
3. Run tests (pytest for backend, npm test for frontend)
4. Build Docker image (backend) or static assets (frontend)
5. Push to ECR (backend) or Amplify (frontend)
6. Update ECS task definition with new image
7. ECS performs rolling deployment
8. Health checks validate new tasks
9. Old tasks drained and terminated

### Rollback Strategy
- **Frontend**: Amplify console → Redeploy previous version
- **Backend**: ECS console → Update service with previous task definition
- **Database**: Restore from automated backup


## Cost Estimation

### Monthly AWS Costs (10,000 users)

#### Compute
- **ECS Fargate**: 2 tasks × 0.5 vCPU × 1GB RAM × 730 hours = $35/month
- **Lambda (3 functions)**: 1M invocations × $0.20/1M = $0.20/month
- **Total Compute**: ~$35/month

#### Database
- **RDS PostgreSQL**: db.t3.micro × 730 hours = $15/month
- **ElastiCache Redis**: cache.t3.micro × 730 hours = $12/month
- **DynamoDB**: On-demand (1M reads, 100K writes) = $1.50/month
- **Total Database**: ~$28.50/month

#### Storage
- **S3 Content**: 10GB storage + 100GB transfer = $2/month
- **S3 Sync**: 5GB storage + 50GB transfer = $1/month
- **ECR**: 5GB storage = $0.50/month
- **Total Storage**: ~$3.50/month

#### AI/ML
- **Bedrock (Claude 3 Sonnet)**: 100K tokens/day × 30 days = $15/month
- **Bedrock Caching**: Reduces cost by 80% = $3/month actual
- **Total AI**: ~$3/month

#### Networking
- **Application Load Balancer**: 730 hours + 1GB processed = $20/month
- **NAT Gateway**: 730 hours + 10GB processed = $35/month
- **CloudFront**: 100GB transfer = $8/month
- **Total Networking**: ~$63/month

#### Other Services
- **API Gateway**: 1M requests = $3.50/month
- **Secrets Manager**: 5 secrets = $2/month
- **CloudWatch**: Logs + metrics = $5/month
- **SNS**: 10K SMS = $6/month
- **Total Other**: ~$16.50/month

### Total Monthly Cost: ~$150/month (10,000 users)
### Cost per User: $0.015/month (~₹1.25/month)

### Cost Optimization Opportunities
- Use ECS Fargate Spot for non-critical tasks (30% savings)
- Implement S3 Intelligent-Tiering (20% savings)
- Use Reserved Instances for RDS (40% savings)
- Optimize Bedrock usage with better caching (current: 80% reduction)


## Scalability Roadmap

### Current Capacity (Phase 1)
- **Users**: 10,000 concurrent users
- **API Requests**: 100 requests/second
- **Database**: 1,000 connections
- **Cache**: 1GB Redis

### Phase 2 (50,000 users)
- **ECS Tasks**: Auto-scale to 5 tasks
- **RDS**: Upgrade to db.t3.small + read replica
- **Redis**: Upgrade to cache.t3.small with cluster mode
- **DynamoDB**: On-demand (handles any scale)
- **Estimated Cost**: ~$400/month

### Phase 3 (100,000 users)
- **ECS Tasks**: Auto-scale to 10 tasks
- **RDS**: Upgrade to db.t3.medium + 2 read replicas
- **Redis**: cache.t3.medium with 3-node cluster
- **CloudFront**: Increase cache hit ratio to 90%
- **Estimated Cost**: ~$800/month

### Phase 4 (500,000+ users)
- **ECS Tasks**: Migrate to EKS for better orchestration
- **RDS**: Aurora PostgreSQL with auto-scaling
- **Redis**: ElastiCache cluster with 5+ nodes
- **Multi-Region**: Deploy to ap-south-1 + ap-southeast-1
- **Estimated Cost**: ~$3,000/month

### Bottleneck Analysis
- **Current Bottleneck**: NAT Gateway bandwidth (5 Gbps)
- **Solution**: Multiple NAT Gateways or VPC endpoints
- **Future Bottleneck**: RDS write capacity
- **Solution**: Aurora PostgreSQL with write scaling


## Future Enhancements

### Phase 2 (Planned)
- **PWA Offline Support**: Service Worker with background sync
- **Voice Interface**: Bhashini API for TTS/STT
- **WhatsApp Bot**: AWS Lambda + Twilio integration
- **Push Notifications**: Firebase Cloud Messaging
- **Advanced Analytics**: QuickSight dashboards

### Phase 3 (Future)
- **Quiz System**: Interactive knowledge assessment
- **Loan Comparison Game**: Gamified financial education
- **Story Generation**: AI-generated personalized stories
- **Recommendation Engine**: ML-based product recommendations
- **Video Content**: S3 + CloudFront for video lessons

### Infrastructure Improvements
- **Multi-Region Deployment**: Disaster recovery in ap-southeast-1
- **Aurora Serverless**: Auto-scaling database
- **AppSync**: GraphQL API for real-time updates
- **Cognito**: Managed authentication service
- **Step Functions**: Orchestrate complex workflows

### AI/ML Enhancements
- **SageMaker**: Custom ML models for recommendations
- **Comprehend**: Sentiment analysis for user feedback
- **Translate**: Automatic translation to 10+ languages
- **Personalize**: Real-time personalization engine


## Appendix

### Terraform Resources
All infrastructure is defined in `terraform/main.tf`:
- VPC with public/private subnets
- Security groups
- Application Load Balancer
- ECS Fargate cluster and service
- RDS PostgreSQL instance
- ECR repository
- IAM roles and policies
- Secrets Manager integration

### API Endpoints
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/home` - Dashboard data
- `GET /api/v1/lessons` - List lessons
- `GET /api/v1/lessons/{id}` - Get lesson details
- `GET /api/v1/schemes` - List schemes
- `GET /api/v1/schemes/{id}` - Get scheme details
- `POST /api/v1/schemes/ask` - AI Q&A
- `POST /api/v1/sync/upload` - Offline sync
- `GET /health` - Health check

### Database Schema
- **users**: phone, password_hash, crop_type, state, land_size, income
- **lessons**: title, content, category, examples, key_points
- **schemes**: name, category, eligibility, documents, steps
- **user_progress**: user_id, lesson_id, completed, quiz_score
- **calculator_history**: user_id, calc_type, inputs, results

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `AWS_REGION`: ap-south-1
- `BEDROCK_MODEL_ID`: anthropic.claude-3-sonnet-20240229-v1:0
- `SECRET_KEY`: JWT signing key
- `ENVIRONMENT`: development | staging | production

### Contact & Support
- **Team**: CodeStorm Innovators
- **Lead**: Achal Kumar Rastogi
- **Hackathon**: AI for Bharat
- **Repository**: https://github.com/achalrastogi/farmer-fintech

---

**Last Updated**: March 8, 2026
**Version**: 1.0
**Region**: ap-south-1 (Mumbai)
