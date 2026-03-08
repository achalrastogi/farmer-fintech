---
inclusion: auto
---

# Tech Stack

## Backend

- FastAPI (Python 3.11+) with async/await
- PostgreSQL 15 + pgvector extension for embeddings
- Redis for caching (AI responses, scheme data, FAQ)
- SQLAlchemy 2.0 (async) ORM
- Pydantic v2 for schemas and validation
- AWS Bedrock with Amazon Nova Lite 2.0 model (prototype) for AI Q&A and scheme recommendations
- AWS S3 for audio assets and offline sync (Phase 2)
- AWS DynamoDB for game sessions and offline queue (Phase 3)

## Frontend

- React 18.3 with Vite 5
- React Router v6 for navigation
- Tailwind CSS 3.4 for styling
- PWA with vite-plugin-pwa (Phase 2: offline support)
- Bhashini API for TTS/STT (Phase 2: voice support)

## Infrastructure

- Docker Compose for local development
- AWS ECS Fargate for backend containers (auto-scaling)
- AWS Amplify for frontend hosting + CI/CD
- CloudFront + WAF for CDN and DDoS protection
- API Gateway for rate limiting
- ElastiCache Redis for caching layer
- Lambda functions for async processing (Phase 2: offline sync, audio preprocessing, SMS)

## Common Commands

### Local Development

```bash
# Backend (starts API + PostgreSQL + Redis)
cd backend
docker-compose up --build
# API docs: http://localhost:8000/docs
# Health check: http://localhost:8000/health

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

### Environment Setup

```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# For local dev without AWS, set in backend/.env:
BEDROCK_MOCK_MODE=true
# Mock mode returns sample AI responses without AWS Bedrock access
```

### Testing

```bash
# Backend tests
cd backend
pytest
pytest -v  # verbose output
pytest tests/test_auth.py  # specific test file

# Frontend build
cd frontend
npm run build
npm run preview  # preview production build
```

### Database

```bash
# Access PostgreSQL
docker exec -it fintech_db psql -U fintech -d farmerfintech

# View tables
\dt

# Query lessons
SELECT id, title_en, category FROM lessons LIMIT 5;

# Query schemes
SELECT id, name_en, category FROM schemes LIMIT 5;

# Run migrations (if using Alembic)
docker exec -it fintech_api alembic upgrade head

# Seed data is auto-loaded from backend/scripts/init.sql on first run
# To re-seed: drop database and restart docker-compose
```

### API Testing

```bash
# Health check
curl http://localhost:8000/health

# Login (get JWT token)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "password": "demo1234"}'

# Get lessons (with auth)
curl http://localhost:8000/api/v1/lessons \
  -H "Authorization: Bearer <your_token>"

# Get schemes
curl http://localhost:8000/api/v1/schemes \
  -H "Authorization: Bearer <your_token>"
```

## Key Libraries

### Backend
- fastapi, uvicorn - API framework and ASGI server
- sqlalchemy[asyncio], asyncpg - Database ORM and PostgreSQL driver
- redis[asyncio] - Caching client
- boto3 - AWS SDK (Bedrock, S3, DynamoDB)
- python-jose[cryptography] - JWT token handling
- bcrypt - Password hashing
- sentence-transformers - Text embeddings (Phase 3)
- httpx - Async HTTP client
- pytest, pytest-asyncio - Testing framework

### Frontend
- react, react-dom - UI framework
- react-router-dom - Client-side routing
- axios - HTTP client
- tailwindcss - Utility-first CSS
- vite - Build tool and dev server
- vite-plugin-pwa - PWA support (Phase 2)

## Mock Mode

Set `BEDROCK_MOCK_MODE=true` in backend/.env to run without AWS Bedrock access. Mock responses will be returned for:
- AI scheme Q&A
- Financial concept explanations
- Scheme recommendations

This allows local development without AWS credentials or costs.

**Current AI Model**: Amazon Nova Lite 2.0 via AWS Bedrock (prototype phase). This model provides cost-effective inference for scheme Q&A and financial education content generation.

## Performance Optimization

### Backend
- Redis caching for frequently accessed data (schemes, lessons, AI responses)
- Connection pooling for PostgreSQL (SQLAlchemy async engine)
- Async/await for all I/O operations
- ECS Fargate auto-scaling based on CPU/memory

### Frontend
- Code splitting with React.lazy() (Phase 2)
- Image optimization and lazy loading
- Service Worker caching (Phase 2)
- Minimal bundle size (<500KB gzipped)
- Tailwind CSS purging for production

## Security

- TLS 1.3 for all connections
- AES-256 encryption at rest (AWS KMS)
- JWT tokens with 24-hour expiry
- Bcrypt password hashing (cost factor 12)
- CORS configured for production domains only
- API rate limiting via AWS API Gateway
- SQL injection protection via SQLAlchemy ORM
- XSS protection via React's built-in escaping
- DPDPA 2023 compliance (all data in ap-south-1)
