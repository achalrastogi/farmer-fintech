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
│   │   ├── Dashboard.jsx    # Main landing (after login)
│   │   ├── Home.jsx         # Home section
│   │   ├── Login.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Learn.jsx        # Financial lessons
│   │   ├── LessonDetail.jsx
│   │   ├── Schemes.jsx      # Government schemes
│   │   ├── SchemeDetail.jsx
│   │   ├── Tools.jsx        # Calculator hub
│   │   ├── Profile.jsx
│   │   ├── Loans.jsx
│   │   ├── CashFlow.jsx
│   │   ├── Risk.jsx
│   │   ├── Market.jsx
│   │   ├── WealthGrowth.jsx
│   │   └── calculators/     # Financial calculators
│   │       ├── CropProfit.jsx
│   │       ├── LoanROI.jsx
│   │       ├── EMISafety.jsx
│   │       ├── StorageDecision.jsx
│   │       ├── EmergencyFund.jsx
│   │       ├── BreakEven.jsx
│   │       ├── CropComparison.jsx
│   │       └── CostLeakage.jsx
│   ├── components/          # Reusable UI components
│   │   ├── TopBar.jsx
│   │   ├── TopNav.jsx
│   │   ├── BottomNav.jsx
│   │   ├── FloatingAI.jsx   # AI assistant button
│   │   └── OfflineBanner.jsx
│   ├── hooks/
│   │   └── useTranslation.jsx  # i18n hook
│   ├── i18n/                # Translation files
│   │   ├── index.js
│   │   ├── en.js
│   │   ├── hi.js
│   │   ├── mr.js
│   │   ├── pa.js
│   │   └── (other languages)
│   ├── lib/
│   │   ├── api.js           # API client, auth helpers
│   │   ├── bhashini.js      # Voice TTS/STT integration
│   │   └── locale.js        # Language detection
│   ├── App.jsx              # Router, auth guard, app shell
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind imports
├── public/
│   ├── icons/               # PWA icons
│   └── manifest.json        # PWA manifest
├── vite.config.js           # Vite + PWA config
├── tailwind.config.js
└── package.json
```

## Key Conventions

### Backend

- All routes use `/api/v1` prefix
- Async/await for all DB and external calls
- Pydantic schemas for request/response validation
- SQLAlchemy models in `models.py`, schemas in `schemas.py`
- Services layer for business logic (auth, AI, game)
- Environment config via Pydantic Settings (`.env` file)
- Demo user auto-seeded in development mode

### Frontend

- All screens are in `src/screens/`
- Reusable components in `src/components/`
- AuthGuard wrapper for protected routes
- API calls via `lib/api.js` (centralized auth token handling)
- i18n via `useTranslation` hook
- Offline-first: PWA with service worker caching
- Mobile-first design (max-w-md container)
- Tailwind utility classes for styling

### Database

- PostgreSQL with pgvector extension for embeddings
- Schema and seed data in `backend/scripts/init.sql`
- Auto-loaded on first docker-compose up
- Enums: croptype, language, learningstage, schemecategory
- UUID primary keys (uuid_generate_v4())

### API Patterns

- JWT auth with Bearer token
- CORS enabled for all origins (dev mode)
- Health check at `/health`
- Interactive docs at `/docs` (FastAPI Swagger)
- Rate limiting via API Gateway (production)

### Naming

- Python: snake_case for functions, variables
- JavaScript: camelCase for functions, variables, PascalCase for components
- Database: snake_case for tables and columns
- Routes: kebab-case for URL paths
