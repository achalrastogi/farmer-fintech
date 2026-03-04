# 🌾 Rural Farmer Fintech Education Platform

> **AI for Bharat Hackathon** | Team: CodeStorm Innovators | Lead: Achal Kumar Rastogi
> Built with **AWS Bedrock + Kiro** | Deployed on AWS ap-south-1 (Mumbai)

## The Problem

800+ million rural Indians — especially wheat, cotton, and rice farmers — fall into debt traps and miss government schemes not due to lack of access, but **lack of financial knowledge**. A farmer who doesn't understand "5% per month = 60% per year" will always choose the moneylender over KCC.

## The Solution

An **education-first** fintech platform providing:

- **126 Structured Financial Lessons** across 8 modules (Farm Financial Empowerment Workbook)
- **8 Interactive Calculators** for practical decision-making (crop profit, loan ROI, EMI safety, break-even, etc.)
- **Government Scheme Database** with AI-powered Q&A (PM-Kisan, PMFBY, KCC, and more)
- **Personalized Dashboard** with farm snapshot and risk assessment
- **Multi-language Support** (Hindi, Punjabi, Marathi, English)

```
📚 Learn → 🧮 Calculate → 🏛️ Discover Schemes → 💡 Make Informed Decisions
```

## Key Features

### 📚 Learn Hub — 126 Financial Lessons
- 8 lesson categories covering all aspects of farm finance
- Practical examples with real farming scenarios
- Key takeaways, calculations, and common mistakes
- Links to related calculators for hands-on practice

### 🧮 Tools Hub — 8 Interactive Calculators
- **Crop Profit Calculator** — Estimate profit per acre
- **Loan ROI Calculator** — Compare loan options (moneylender vs KCC vs bank)
- **EMI Safety Calculator** — Check loan affordability
- **Break-Even Calculator** — Find minimum selling price
- **Storage Decision** — Sell now vs store and sell later
- **Emergency Fund** — Calculate 3-month safety net
- **Crop Comparison** — Compare profitability of different crops
- **Cost Leakage** — Identify hidden farming costs

### 🏛️ Schemes Hub — Government Scheme Discovery
- 6 categories: Income Support, Insurance, Subsidy, Credit, Allied Activities, Pension
- Detailed scheme information with eligibility criteria
- Required documents and application steps
- Common rejection reasons and fraud warnings
- AI-powered Q&A for scheme-specific questions
- Global AI search across all schemes

### 🏠 Home Hub — Personalized Dashboard
- Farm snapshot with profit estimation
- Loan risk assessment (low/moderate/high)
- Emergency fund status check
- Daily financial tips
- Quick access to all sections

## Quick Start (Local Development)

```bash
git clone https://github.com/YOUR_USERNAME/farmer-fintech
cd farmer-fintech

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start backend (API + PostgreSQL + Redis)
cd backend
docker-compose up --build
# → API docs: http://localhost:8000/docs

# Start frontend (separate terminal)
cd frontend
npm install
npm run dev
# → App: http://localhost:5173
```

> **No AWS needed to start.** Set `BEDROCK_MOCK_MODE=true` in `backend/.env` to run with mock AI responses.

### Demo Credentials
- Phone: `+919999999999`
- Password: `demo1234`

## Live Demo

| Link | Description |
|------|-------------|
| 🌐 **[Live App](https://farmerfintech.amplifyapp.com)** | React PWA — works on any phone |
| 📡 **[API Docs](https://api.farmerfintech.in/docs)** | Interactive FastAPI documentation |
| 🎥 **[Demo Video](https://youtube.com/...)** | 3-minute walkthrough |

## AWS Architecture

```
React PWA (AWS Amplify)
         ↓
CloudFront + WAF
         ↓
API Gateway (HTTP API) ← rate limiting, usage plans
         ↓
ECS Fargate — FastAPI ←→ AWS Bedrock Claude 3 Sonnet
         ↓                ↓
    RDS PostgreSQL    ElastiCache Redis
    DynamoDB          S3 (audio + sync)
         ↓
Lambda Functions (×3)
  ├── offline-sync-processor  (S3 trigger)
  ├── audio-preprocessor      (S3 trigger)
  └── daily-engagement-digest (EventBridge 9AM IST → SNS SMS)
```

**All data stays in ap-south-1 (Mumbai)** — DPDPA 2023 compliant.

## Repository Structure

```
farmer-fintech/
├── .kiro/                    ← Kiro IDE specs and steering
│   ├── specs/                ← Feature specifications
│   │   └── farmer-fintech-platform/
│   │       ├── requirements.md  ← 7 requirements with acceptance criteria
│   │       ├── design.md        ← Architecture and component design
│   │       └── tasks.md         ← Implementation task tracking
│   └── steering/             ← Project conventions and guidelines
│       ├── product.md        ← Product overview
│       ├── tech.md           ← Tech stack and commands
│       └── structure.md      ← Project organization
├── backend/                  ← FastAPI → ECS Fargate
│   ├── app/
│   │   ├── api/routes/       ← API endpoints
│   │   │   ├── auth.py       ← Authentication (register, login)
│   │   │   ├── home.py       ← Dashboard and farm snapshot
│   │   │   ├── lessons.py    ← 126 financial lessons
│   │   │   ├── schemes.py    ← Government schemes + AI Q&A
│   │   │   ├── practice.py   ← Quiz and game (future)
│   │   │   └── sync.py       ← Offline sync (future)
│   │   ├── db/               ← Database clients
│   │   │   ├── database.py   ← PostgreSQL + pgvector
│   │   │   ├── cache.py      ← Redis cache
│   │   │   └── dynamo.py     ← DynamoDB (future)
│   │   ├── models/           ← SQLAlchemy ORM models
│   │   │   └── models.py     ← User, Lesson, Scheme, etc.
│   │   ├── schemas/          ← Pydantic request/response schemas
│   │   │   └── schemas.py
│   │   ├── services/         ← Business logic
│   │   │   ├── auth_service.py        ← JWT and password hashing
│   │   │   ├── bedrock_service.py     ← AWS Bedrock AI integration
│   │   │   ├── translation_service.py ← Multi-language support
│   │   │   └── game_service.py        ← Game logic (future)
│   │   └── core/
│   │       └── config.py     ← Settings (Pydantic BaseSettings)
│   ├── scripts/
│   │   └── init.sql          ← DB schema + seed data (126 lessons, 6 schemes)
│   ├── docker-compose.yml    ← Local dev stack
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 ← React PWA → AWS Amplify
│   └── src/
│       ├── screens/          ← Page components
│       │   ├── Dashboard.jsx    ← Main landing with hub navigation
│       │   ├── Home.jsx         ← Farm snapshot display
│       │   ├── Learn.jsx        ← Lesson categories and list
│       │   ├── LessonDetail.jsx ← Full lesson content
│       │   ├── Tools.jsx        ← Calculator hub
│       │   ├── Schemes.jsx      ← Scheme categories and list
│       │   ├── SchemeDetail.jsx ← Full scheme info + AI Q&A
│       │   ├── Profile.jsx      ← User profile editor
│       │   ├── Login.jsx
│       │   ├── Onboarding.jsx
│       │   └── calculators/     ← 8 financial calculators
│       │       ├── CropProfit.jsx
│       │       ├── LoanROI.jsx
│       │       ├── EMISafety.jsx
│       │       ├── BreakEven.jsx
│       │       ├── StorageDecision.jsx
│       │       ├── EmergencyFund.jsx
│       │       ├── CropComparison.jsx
│       │       └── CostLeakage.jsx
│       ├── components/       ← Reusable UI components
│       │   ├── TopBar.jsx
│       │   ├── FloatingAI.jsx
│       │   └── OfflineBanner.jsx
│       ├── hooks/
│       │   └── useTranslation.jsx  ← i18n hook
│       ├── i18n/             ← Translation files
│       │   ├── index.js
│       │   ├── en.js
│       │   ├── hi.js
│       │   ├── mr.js
│       │   └── pa.js
│       ├── lib/
│       │   ├── api.js        ← API client with auth
│       │   ├── bhashini.js   ← Voice TTS/STT (future)
│       │   └── locale.js     ← Language detection
│       ├── App.jsx           ← Router and auth guard
│       └── main.jsx          ← React entry point
└── README.md
```

## Tech Stack

### Backend
- **FastAPI** (Python 3.11+) with async/await
- **PostgreSQL 15** + pgvector for embeddings
- **Redis** for caching (schemes, FAQ answers)
- **SQLAlchemy 2.0** (async) ORM
- **Pydantic v2** for schemas and validation
- **AWS Bedrock** (Claude 3 Sonnet) for AI Q&A
- **AWS S3** for content storage (future)
- **AWS DynamoDB** for game sessions (future)

### Frontend
- **React 18.3** with Vite 5
- **React Router v6** for navigation
- **Tailwind CSS 3.4** for styling
- **PWA** with vite-plugin-pwa (offline support planned)
- **Multi-language** support (Hindi, Punjabi, Marathi, English)

### Infrastructure
- **Docker Compose** for local development
- **AWS ECS Fargate** for backend containers
- **AWS Amplify** for frontend hosting + CI/CD
- **CloudFront + WAF** for CDN and DDoS protection
- **API Gateway** for rate limiting (future)

### Key Libraries
- fastapi, uvicorn — API framework
- sqlalchemy[asyncio], asyncpg — Database ORM
- redis[asyncio] — Caching
- boto3 — AWS SDK
- python-jose, bcrypt — Authentication
- sentence-transformers — Embeddings (future)
- pytest, pytest-asyncio — Testing

## Development Workflow

### Backend Development
```bash
cd backend

# Run with Docker Compose (recommended)
docker-compose up --build

# Or run directly (requires PostgreSQL and Redis running)
pip install -r requirements.txt
uvicorn app.main:app --reload

# Access API docs
open http://localhost:8000/docs

# Run tests
pytest
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it fintech_db psql -U fintech -d farmerfintech

# View tables
\dt

# Seed data is auto-loaded from backend/scripts/init.sql on first run
```

## AWS Services Used

| Service | Purpose | Status |
|---|---|---|
| **Amazon Bedrock** (Claude 3 Sonnet) | AI Q&A for schemes | ✅ Implemented |
| **ECS Fargate** | FastAPI backend containers | 📋 Planned |
| **RDS PostgreSQL + pgvector** | Users, lessons, schemes | ✅ Implemented |
| **ElastiCache Redis** | Scheme cache, FAQ cache | ✅ Implemented |
| **AWS Amplify** | React PWA hosting + CI/CD | 📋 Planned |
| **CloudFront + WAF** | CDN + DDoS protection | 📋 Planned |
| **S3** | Content storage | 📋 Planned |
| **DynamoDB** | Game sessions | 📋 Planned |
| **Secrets Manager** | Production credentials | 📋 Planned |
| **KMS + X-Ray + CloudWatch** | Encryption, tracing, monitoring | 📋 Planned |

## Why AI Is Essential

Static financial content cannot serve 800M farmers with different contexts and questions. AWS Bedrock Claude 3 Sonnet powers:

- **Contextual Scheme Q&A** — Answers farmer questions about specific schemes using scheme data + user profile
- **Global Scheme Search** — Intelligent search across all schemes with keyword matching and AI-powered recommendations
- **Personalized Responses** — Adapts answers based on farmer's state, crop type, and land size
- **Safety Guardrails** — Blocks harmful advice, ensures educational (not financial advice) responses
- **Multi-language Support** — Responds in farmer's preferred language (Hindi, Punjabi, Marathi, English)

## Implementation Status

### ✅ Completed (71%)
- 126 structured financial lessons across 8 categories
- 8 interactive financial calculators
- Government scheme database with 6 categories
- AI-powered scheme Q&A (specific + global search)
- Personalized farm dashboard with risk assessment
- Multi-language support (Hindi, Punjabi, Marathi, English)
- User authentication and profile management
- Translation service with fallback chain
- Docker Compose local development setup

### 📋 Planned (29%)
- AWS deployment (ECS Fargate, RDS, ElastiCache, Amplify)
- PWA offline support with Service Worker
- Voice interface (Bhashini TTS/STT)
- Quiz system with progress tracking
- Loan comparison game
- Story generation system
- Lambda functions for async processing
- WhatsApp bot integration

## Impact Targets

- **10,000** pilot farmers (Punjab wheat — Phase 1)
- **80%** can explain interest rate difference after completing lessons
- **40%** apply for formal credit (vs moneylenders)
- **₹15,000** average savings per user per year
- **AI cost** < ₹0.50 per user per month

## Project Documentation

All project documentation is in `.kiro/`:

- **Steering** (`.kiro/steering/`) — Project conventions and guidelines
  - `product.md` — Product overview and impact targets
  - `tech.md` — Tech stack, commands, and libraries
  - `structure.md` — Project organization and conventions

- **Specs** (`.kiro/specs/farmer-fintech-platform/`) — Feature specifications
  - `requirements.md` — 7 requirements with acceptance criteria
  - `design.md` — Architecture, database schema, component design
  - `tasks.md` — Implementation task tracking (64/90 complete)

## Contributing

This project follows spec-driven development using Kiro:

1. Review requirements in `.kiro/specs/farmer-fintech-platform/requirements.md`
2. Check design in `.kiro/specs/farmer-fintech-platform/design.md`
3. Pick a task from `.kiro/specs/farmer-fintech-platform/tasks.md`
4. Implement following the conventions in `.kiro/steering/`
5. Test locally with Docker Compose
6. Submit PR with reference to task number

## Team

**CodeStorm Innovators** | Lead: Achal Kumar Rastogi
AI for Bharat Hackathon — Prototype Phase (Feb 25 – Mar 4, 2026)

---

Built with ❤️ for India's farmers using **Kiro** spec-driven development
