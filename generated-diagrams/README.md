# AWS Architecture Diagrams - Farmer Fintech Platform

This folder contains visual architecture diagrams generated using the AWS Diagrams package.

## Diagrams

### 1. aws-deployment-architecture.png
**Complete AWS Infrastructure**

Shows all AWS services and their connections:
- Edge layer (CloudFront, WAF)
- Frontend hosting (Amplify)
- API Gateway
- VPC with multi-AZ deployment
- ECS Fargate cluster
- Database layer (RDS PostgreSQL, ElastiCache Redis, DynamoDB)
- Storage (S3 buckets)
- AI/ML (AWS Bedrock with Claude 3 Sonnet)
- Serverless functions (Lambda)
- Security (Secrets Manager, KMS)
- Monitoring (CloudWatch, X-Ray)

### 2. aws-solution-architecture.png
**Application Flow & Data Flow**

Shows how the application works:
- User journey from mobile device
- React PWA features (Dashboard, Learn, Tools, Schemes)
- API routes and business logic services
- Data storage and caching strategy
- AI integration with AWS Bedrock
- Async processing with Lambda functions
- Multi-language support

### 3. aws-data-flow-ai-qa.png
**AI Q&A with Caching**

Detailed flow for AI-powered scheme Q&A:
- User asks question about government schemes
- Cache check in Redis (FAQ cache)
- Cache hit: Return cached answer (< 10ms)
- Cache miss: Invoke AWS Bedrock with context
- Context includes: scheme data + user profile + language preference
- Store response in cache (1 hour TTL)
- Return AI-generated answer in user's language

### 4. aws-offline-sync-flow.png
**Offline-First Architecture**

Shows how offline sync works:
- User completes lessons/calculators while offline
- Data stored in IndexedDB (browser local storage)
- Service Worker detects reconnection
- Uploads payload to S3 sync bucket
- Lambda processes S3 event
- Updates PostgreSQL and DynamoDB
- Sends sync confirmation via SNS

### 5. aws-network-architecture.png
**VPC Network Design**

Detailed network architecture:
- VPC: 10.0.0.0/16 in ap-south-1 (Mumbai)
- Public subnets (10.0.1.0/24, 10.0.2.0/24) across 2 AZs
- Private subnets (10.0.3.0/24, 10.0.4.0/24) across 2 AZs
- Internet Gateway for public access
- NAT Gateway for private subnet internet access
- Security groups (ALB, ECS, RDS)
- VPC endpoints (S3, Bedrock, Secrets Manager)
- Route tables for public and private subnets

## How to View

These are PNG images that can be viewed in any image viewer or browser.

## How to Regenerate

If you need to regenerate these diagrams, use the AWS Diagram MCP server:

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import ECS, Lambda
from diagrams.aws.database import RDS, ElastiCache, Dynamodb
# ... (see source code in parent directory)
```

## Documentation

For detailed documentation about the architecture, see:
- `../AWS-ARCHITECTURE-DOCUMENTATION.md` - Complete architecture documentation

## Region

All services are deployed in **ap-south-1 (Mumbai)** for DPDPA 2023 compliance.

---

**Generated**: March 8, 2026
**Tool**: AWS Diagrams MCP Server
**Format**: PNG
