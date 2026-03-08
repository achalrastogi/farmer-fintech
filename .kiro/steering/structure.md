---
inclusion: auto
---

# Project Structure

## Root Layout

```
farmer-fintech/
├── .kiro/                    # Kiro IDE specs and steering
├── backend/                  # FastAPI backend
├── frontend/                 # React PWA
└── README.md
```

## Backend Structure

```
backend/
├── app/
│   ├── api/routes/          # API endpoints by domain
│   │   ├── auth.py          # Login, registration
│   │   ├── education.py     # Story generation, modules
│   │   ├── practice.py      # Game sessions
│   │   ├── recommendations.py  # Product recommendations
│   │   ├── sync.py          # Offline sync
│   │   ├── schemes.py       # Government schemes
│   │   ├── lessons.py       # Financial lessons
│   │   └── home.py          # Dashboard data
│   ├── core/
│   │   └── config.py        # Settings (Pydantic BaseSettings)
│   ├── db/
│   │   ├── database.py      # PostgreSQL connection, session factory
│   │   ├── dynamo.py        # DynamoDB client
│   │   ├── cache.py         # Redis client
│   │   └── __init__.py
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py       # Pydantic request/response schemas
│   ├── services/
│   │   ├── auth_service.py  # JWT, password hashing
│   │   ├── bedrock_service.py  # AWS Bedrock AI calls
│   │   ├── game_service.py  # Game logic
│   │   ├── s3_service.py    # S3 operations
│   │   └── translation_service.py  # i18n
│   └── main.py              # FastAPI app, CORS, lifespan
├── scripts/
│   ├── init.sql             # DB schema + seed data (auto-loaded)
│   └── seed_demo_user.py    # Demo user creation
├── tests/                   # Pytest tests
├── docker-compose.yml       # Local dev stack
├── Dockerfile
└── requirements.txt
```

## Frontend Structure

```
frontend/
├── src/
│   ├── screens/             # Page components
│   │   ├── Dashboard.jsx    # Main landing (after login) — farm snapshot, profit, risk
│   │   ├── Home.jsx         # Home hub — central navigation
│   │   ├── Login.jsx        # Authentication entry point
│   │   ├── Onboarding.jsx   # First-time user setup
│   │   ├── Learn.jsx        # 126 lessons across 8 categories
│   │   ├── LessonDetail.jsx # Individual lesson view with key points, examples
│   │   ├── Schemes.jsx      # Government scheme database (6 categories)
│   │   ├── SchemeDetail.jsx # Scheme details with eligibility, documents, steps
│   │   ├── AIAssistant.jsx  # AI Q&A for schemes and financial concepts
│   │   ├── Tools.jsx        # Calculator hub (8 calculators)
│   │   ├── Profile.jsx      # User farming context (crop, state, land, income)
│   │   ├── Loans.jsx        # (Phase 2) Loan tracking and applications
│   │   ├── CashFlow.jsx     # (Phase 2) Income/expense tracking
│   │   ├── Risk.jsx         # (Phase 2) Risk assessment tools
│   │   ├── Market.jsx       # (Phase 2) Commodity prices
│   │   ├── WealthGrowth.jsx # (Phase 2) Long-term planning
│   │   ├── Story.jsx        # (Phase 3) AI-generated stories
│   │   ├── Game.jsx         # (Phase 3) Interactive practice games
│   │   ├── Quiz.jsx         # (Phase 3) Knowledge assessment
│   │   ├── Recommendations.jsx  # (Phase 3) Product recommendations
│   │   └── calculators/     # 8 interactive financial calculators
│   │       ├── CalcShell.jsx    # Shared calculator layout wrapper
│   │       ├── CropProfit.jsx   # Revenue - costs = profit
│   │       ├── LoanROI.jsx      # Loan comparison (formal vs informal)
│   │       ├── EMISafety.jsx    # EMI-to-income ratio check
│   │       ├── StorageDecision.jsx  # Sell now vs store decision
│   │       ├── EmergencyFund.jsx    # 3-month expense target
│   │       ├── BreakEven.jsx    # Break-even price calculation
│   │       ├── CropComparison.jsx   # Compare crop profitability
│   │       └── CostLeakage.jsx  # Identify hidden expenses
│   ├── components/          # Reusable UI components
│   │   ├── TopBar.jsx       # Header with back button, title
│   │   ├── TopNav.jsx       # Top navigation bar
│   │   ├── BottomNav.jsx    # Bottom navigation (Home, Tools, Learn, Schemes, Profile)
│   │   ├── FloatingAI.jsx   # AI assistant floating button
│   │   └── OfflineBanner.jsx # (Phase 2) Offline status indicator
│   ├── hooks/
│   │   └── useTranslation.jsx  # i18n hook with fallback chain
│   ├── i18n/                # Translation files (Hindi, Punjabi, Marathi, English)
│   │   ├── index.js         # Language loader with fallback
│   │   ├── en.js            # English translations
│   │   ├── hi.js            # Hindi translations
│   │   ├── mr.js            # Marathi translations
│   │   └── pa.js            # Punjabi translations
│   ├── lib/
│   │   ├── api.js           # API client, auth helpers, JWT token management
│   │   ├── bhashini.js      # (Phase 2) Voice TTS/STT integration
│   │   └── locale.js        # Language detection and persistence
│   ├── App.jsx              # Router, auth guard, app shell
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind imports
├── public/
│   ├── icons/               # PWA icons (192x192, 512x512)
│   └── manifest.json        # PWA manifest
├── vite.config.js           # Vite + PWA config
├── tailwind.config.js       # Tailwind theme customization
└── package.json
```

## Key Conventions

### Backend

- All routes use `/api/v1` prefix
- Async/await for all DB and external calls
- Pydantic schemas for request/response validation
- SQLAlchemy models in `models.py`, schemas in `schemas.py`
- Services layer for business logic (auth, AI, game, translation)
- Environment config via Pydantic Settings (`.env` file)
- Demo user auto-seeded in development mode
- JWT authentication with 24-hour token expiry
- Bcrypt password hashing (cost factor 12)

### Frontend

- All screens are in `src/screens/`
- Reusable components in `src/components/`
- AuthGuard wrapper for protected routes
- API calls via `lib/api.js` (centralized auth token handling)
- i18n via `useTranslation` hook with fallback chain (requested language → Hindi → English)
- Mobile-first design (max-w-md container, optimized for low-end Android 8.0+)
- Tailwind utility classes for styling
- Bottom navigation for main sections (Home, Tools, Learn, Schemes, Profile)
- Top bar with back button and section title

### Database

- PostgreSQL 15 with pgvector extension for embeddings
- Schema and seed data in `backend/scripts/init.sql`
- Auto-loaded on first docker-compose up
- Enums: croptype (wheat, cotton, rice), language (en, hi, mr, pa), learningstage, schemecategory
- UUID primary keys (uuid_generate_v4())
- Tables: users, lessons, lesson_categories, schemes, scheme_categories, user_progress, calculator_history

### API Patterns

- JWT auth with Bearer token (Authorization: Bearer <token>)
- CORS enabled for all origins (dev mode)
- Health check at `/health`
- Interactive docs at `/docs` (FastAPI Swagger)
- Rate limiting via API Gateway (production)
- Response format: JSON with snake_case keys
- Error responses: `{"detail": "error message"}`
- Success responses: `{"data": {...}, "message": "optional"}`

### Performance Requirements

- API response time: <2 seconds at 95th percentile
- Dashboard load time: <10 seconds on 2G (64 kbps)
- Calculator computation: real-time (<500ms)
- AI Q&A response: <5 seconds
- Minimum device support: Android 8.0+, 1GB RAM
- Auto-scaling: ECS Fargate + ElastiCache Redis

### Naming

- Python: snake_case for functions, variables, files
- JavaScript: camelCase for functions, variables; PascalCase for components
- Database: snake_case for tables and columns
- Routes: kebab-case for URL paths
- Environment variables: UPPER_SNAKE_CASE
