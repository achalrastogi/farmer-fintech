---
inclusion: auto
---

# Tech Stack

## Backend

- FastAPI (Python 3.11+) with async/await
- PostgreSQL 15 + pgvector extension for embeddings
- Redis for caching (stories, FAQ)
- SQLAlchemy 2.0 (async) ORM
- Pydantic v2 for schemas and validation
- AWS Bedrock (Claude 3 Sonnet) for AI story generation
- AWS S3 for audio assets and offline sync
- AWS DynamoDB for game sessions and offline queue

## Frontend

- React 18.3 with Vite 5
- React Router v6 for navigation
- Tailwind CSS 3.4 for styling
- PWA with vite-plugin-pwa (offline support)
- Bhashini API for TTS/STT (voice support)

## Infrastructure

- Docker Compose for local development
- AWS ECS Fargate for backend containers
- AWS Amplify for frontend hosting + CI/CD
- CloudFront + WAF for CDN and DDoS protection
- API Gateway for rate limiting
- Lambda functions for async processing (offline sync, audio preprocessing, SMS)

## Common Commands

### Local Development

```bash
# Backend (starts API + PostgreSQL + Redis)
cd backend
docker-compose up --build
# API docs: http://localhost:8000/docs

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
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend build
cd frontend
npm run build
npm run preview
```

### Database

```bash
# Access PostgreSQL
docker exec -it fintech_db psql -U fintech -d farmerfintech

# Run migrations
docker exec -it fintech_api alembic upgrade head

# Seed data is auto-loaded from backend/scripts/init.sql on first run
```

## Key Libraries

- fastapi, uvicorn - API framework
- sqlalchemy[asyncio], asyncpg - Database ORM
- redis[asyncio] - Caching
- boto3 - AWS SDK
- python-jose, bcrypt - Auth
- sentence-transformers - Embeddings
- httpx - HTTP client
- pytest, pytest-asyncio - Testing

## Mock Mode

Set `BEDROCK_MOCK_MODE=true` in backend/.env to run without AWS Bedrock access. Mock responses will be returned for AI story generation.
