# Design — Rural Farmer Fintech Education Platform

## Overview

This document describes the technical architecture and component design for the Rural Farmer Fintech Education Platform. The system follows a hub-based architecture with five main sections (Home, Tools, Learn, Schemes, Profile) deployed as a single FastAPI backend with React PWA frontend.

The core design decision is **structured content over AI generation**: 126 pre-written lessons provide comprehensive financial education, with AWS Bedrock Claude 3 Sonnet used only for scheme Q&A and contextual assistance.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│  React PWA (Vite + Tailwind)  │  Progressive Web App           │
│  - 5 Main Hubs (Home/Tools/   │  - Service Worker (future)     │
│    Learn/Schemes/Profile)     │  - Mobile-first design         │
│  - 8 Financial Calculators    │  - Responsive layout           │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS / TLS 1.3
                         ▼
┌────────────────────────────────────────────────────────────────┐
│               API GATEWAY LAYER (ap-south-1)                   │
│  CloudFront CDN → AWS WAF → Application Load Balancer          │
│  - Rate limit: 100 req/user/hour                               │
│  - SSL termination via ACM                                     │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER — ECS Fargate                   │
│  FastAPI (Python 3.11) — Uvicorn + Gunicorn                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐ │
│  │ /auth    │ /home    │ /lessons │ /schemes │ /practice    │ │
│  │ Register │ Snapshot │ 126      │ Govt DB  │ Quiz + Game  │ │
│  │ Login    │ Profile  │ Lessons  │ AI Q&A   │ History      │ │
│  │ JWT      │ Update   │ 8 Cats   │ 6 Cats   │ Scoring      │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
│ AWS Bedrock     │ │ Bhashini │ │ Govt Scheme APIs  │
│ Claude 3 Sonnet │ │ (future) │ │ (PM-Kisan portal) │
│ + Guardrails    │ │ TTS/STT  │ │                   │
└─────────────────┘ └──────────┘ └──────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
│ RDS PostgreSQL  │ │ S3       │ │ ElastiCache Redis  │
│ + pgvector      │ │ Content  │ │ - Session cache    │
│ - User data     │ │ Storage  │ │ - FAQ answers      │
│ - Lessons       │ │ - Audio  │ │ - Scheme cache     │
│ - Schemes       │ │ (future) │ │ TTL: 1–24 hours   │
└─────────────────┘ └──────────┘ └──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY & MONITORING                          │
│  AWS KMS (encryption)  │  CloudWatch  │  AWS Cognito (future)  │
│  AWS X-Ray (tracing)   │  Prometheus  │  AWS Bedrock Guardrails │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Lesson System (`app/api/routes/lessons.py`)

The Lesson System delivers 126 structured financial lessons across 8 categories:

**Lesson Categories:**
```python
CATEGORIES = [
    "Farm Profit & Cost Mastery",      # 15 lessons
    "Cash Flow & Stability",            # 14 lessons
    "Loan & Credit Intelligence",       # 16 lessons
    "Risk & Insurance",                 # 14 lessons
    "Market & MSP Intelligence",        # 16 lessons
    "Government Schemes",               # 25 lessons
    "Institutional Support",            # 12 lessons
    "Long-Term Wealth Planning",        # 10 lessons
]
```

**Lesson Structure:**
```python
Lesson {
    title: str,              # English title
    title_hindi: str,        # Hindi title
    key_points: list[str],   # 3-5 key takeaways
    example: str,            # Practical farming example
    simple_calculation: str, # Formula explanation
    common_mistakes: list[str], # What to avoid
    try_this: str,           # Exercise for farmer
    related_calculator: str  # Link to calculator tool
}
```

**Translation Strategy:**
- Primary: content_translations table (entity_type='lesson')
- Fallback: Hindi columns (title_hindi, etc.)
- Final fallback: English columns

---

### 2. Calculator Hub (Frontend: `frontend/src/screens/calculators/`)

Eight interactive calculators for practical financial decisions:

| Calculator | Purpose | Key Inputs | Output |
|---|---|---|---|
| Crop Profit | Estimate profit per acre | Revenue, costs, acres | Profit, margin % |
| Loan ROI | Compare loan options | Principal, rate, tenure | Total interest, monthly EMI |
| EMI Safety | Check loan affordability | Income, EMI, expenses | Safety ratio, recommendation |
| Storage Decision | Sell now vs store | Current price, storage cost, expected price | Better option, profit difference |
| Emergency Fund | Calculate fund target | Monthly expenses | 3-month target, current status |
| Break-Even | Minimum selling price | Total cost, expected yield | Break-even price per quintal |
| Crop Comparison | Compare crop profitability | Costs and revenues for 2 crops | Better crop, profit difference |
| Cost Leakage | Identify hidden costs | All expense categories | Total cost, leakage areas |

All calculators are client-side React components with real-time calculation and Hindi/English labels.

---

### 3. Scheme Database (`app/api/routes/schemes.py`)

**Scheme Categories (UI Layer):**
```python
CATEGORIES = [
    "income_support",    # PM-Kisan, MGNREGA, DBT
    "insurance",         # PMFBY, WBCIS, livestock insurance
    "subsidy",           # PMKSY, SMAM, PM-KUSUM (irrigation, machinery, solar)
    "credit",            # KCC, NABARD, SHG linkage
    "allied",            # Dairy (NLM), Fisheries (PMMSY), Processing
    "pension",           # PMKMY, PMJJBY, Ayushman
]
```

**Scheme Data Model:**
```python
Scheme {
    name: str,
    name_hindi: str,
    category: SchemeCategory,
    description: str,
    description_hindi: str,
    benefit_amount: str,
    eligibility: str,
    eligibility_hindi: str,
    documents_required: list[str],
    how_to_apply: str,
    how_to_apply_steps: list[dict],
    official_website: str,
    applicable_states: list[str],
    applicable_crops: list[str],
    common_rejection_reasons: list[str],
    fraud_warning: str,
    faq_list: list[dict],
    scheme_type: str,  # 'central' or 'state'
    min_land_acres: float,
    max_land_acres: float,
}
```

**AI Q&A Integration:**
- Scheme-specific Q&A: `/schemes/{id}/ask` — uses scheme data + user profile as context
- Global scheme search: `/schemes/global-ask` — searches across all schemes, keyword matching, AI-powered answers
- Fallback: FAQ matching when Bedrock unavailable

---

### 4. Home Dashboard (`app/api/routes/home.py`)

**Farm Snapshot Calculation:**
```python
def compute_snapshot(user):
    # Profit estimation
    PROFIT_PER_ACRE = {
        "wheat": 18000,
        "cotton": 25000,
        "rice": 20000,
        "other": 15000
    }
    annual_profit = PROFIT_PER_ACRE[user.crop_type] * user.farm_size_acres
    
    # Loan risk assessment
    loan_ratio = user.loan_amount / user.annual_income
    if loan_ratio < 0.3:
        risk = "low"
    elif loan_ratio < 0.6:
        risk = "moderate"
    else:
        risk = "high"
    
    # Emergency fund check
    target = user.monthly_expenses * 3
    estimated_savings = (user.annual_income / 12) - user.monthly_expenses
    fund_ready = estimated_savings >= target
    
    return {
        estimated_annual_profit,
        profit_per_acre,
        loan_risk_level,
        emergency_fund_status,
        tip_of_day  # Rotates daily
    }
```

---

### 5. Database Schema

```sql
-- Core tables

users (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  name VARCHAR(100),
  state VARCHAR(50),
  district VARCHAR(100),
  crop_type ENUM(wheat, cotton, rice, other),
  preferred_language ENUM(hi, pa, te, ta, mr, bn, en),
  farm_size_acres FLOAT,
  annual_income INTEGER,
  loan_amount INTEGER,
  monthly_expenses INTEGER,
  hashed_password VARCHAR(255),
  is_active BOOLEAN,
  created_at TIMESTAMP
)

lesson_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  name_hindi VARCHAR(100),
  icon VARCHAR(10),
  order_index INTEGER,
  is_active BOOLEAN
)

lessons (
  id UUID PRIMARY KEY,
  category_id UUID → lesson_categories.id,
  title VARCHAR(200),
  title_hindi VARCHAR(200),
  key_points JSON,
  example TEXT,
  simple_calculation TEXT,
  common_mistakes JSON,
  try_this TEXT,
  related_calculator VARCHAR(50),
  order_index INTEGER,
  is_active BOOLEAN
)

schemes (
  id UUID PRIMARY KEY,
  name VARCHAR(200),
  name_hindi VARCHAR(200),
  category ENUM(income_support, subsidy, insurance, credit, pension, infrastructure),
  description TEXT,
  description_hindi TEXT,
  benefit_amount VARCHAR(200),
  eligibility TEXT,
  eligibility_hindi TEXT,
  documents_required JSON,
  how_to_apply TEXT,
  how_to_apply_steps JSON,
  official_website VARCHAR(300),
  applicable_states JSON,
  applicable_crops JSON,
  common_rejection_reasons JSON,
  fraud_warning TEXT,
  faq_list JSON,
  scheme_type VARCHAR(20),
  min_land_acres FLOAT,
  max_land_acres FLOAT,
  last_updated TIMESTAMP,
  is_active BOOLEAN
)

user_saved_schemes (
  id UUID PRIMARY KEY,
  user_id UUID → users.id,
  scheme_id UUID → schemes.id,
  saved_at TIMESTAMP
)

content_translations (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(30),  # 'lesson', 'lesson_category', 'scheme'
  entity_id UUID,
  language VARCHAR(5),
  field VARCHAR(50),
  value TEXT
)
```

---

### 6. Translation Service (`app/services/translation_service.py`)

**Translation Fallback Chain:**
```
1. content_translations table (requested language)
   ↓ (if not found)
2. Hindi columns (title_hindi, description_hindi, etc.)
   ↓ (if not found)
3. English columns (title, description, etc.)
```

**Bulk Translation Optimization:**
- Single query fetches translations for multiple entities
- Returns dict mapping entity_id → {field: translated_value}
- Reduces N+1 query problem

---

### 7. API Security

- **Rate limiting:** 100 requests/user/hour (enforced at ALB level via WAF rules)
- **Input validation:** Pydantic v2 — phone regex `^\+91[6-9]\d{9}$`, string length limits
- **Content safety:** AWS Bedrock Guardrails on all LLM outputs — blocks harmful financial advice, medical/legal advice, hate speech
- **CORS:** Configured to allow all origins in development, specific domain in production
- **Secrets:** `SECRET_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` stored in AWS Secrets Manager in production (env vars in development)
- **Encryption:** AES-256 at rest (RDS + S3 via AWS KMS), TLS 1.3 in transit

---

### 8. PWA Frontend Architecture (`frontend/`)

**Hub-Based Navigation:**
```
App Launch → Dashboard
  ├── Home Hub → Farm Snapshot + Quick Actions
  ├── Tools Hub → 8 Calculators Grid
  ├── Learn Hub → 8 Lesson Categories → Lesson List → Lesson Detail
  ├── Schemes Hub → 6 Categories → Scheme List → Scheme Detail + AI Q&A
  └── Profile Hub → User Info + Settings
```

**Screen Components:**
- Dashboard.jsx — Main landing with hub navigation
- Home.jsx — Farm snapshot display
- Tools.jsx — Calculator grid
- Learn.jsx — Lesson categories + lesson stack view
- LessonDetail.jsx — Full lesson content
- Schemes.jsx — Scheme categories + filtered list + AI search
- SchemeDetail.jsx — Full scheme info + Q&A
- Profile.jsx — User profile editor
- calculators/* — 8 calculator components

**State Management:**
- localStorage for auth token and user profile
- React useState for component-level state
- API calls via centralized `lib/api.js`

---

### 9. Deployment Architecture

**Development:**
```
docker-compose up → API(:8000) + PostgreSQL(:5432) + Redis(:6379)
```

**Production (AWS ap-south-1):**
```
Route 53 → CloudFront → WAF → ALB
                                ↓
                     ECS Fargate (farmer-fintech-api)
                       Task: 0.5 vCPU, 1GB RAM
                       Auto-scaling: 1–10 tasks
                                ↓
                  RDS PostgreSQL (db.t3.micro, Multi-AZ off for MVP)
                  ElastiCache Redis (cache.t3.micro)
                  S3 (content-assets bucket, ap-south-1)
                  KMS (CMK for encryption)
                  X-Ray (distributed tracing)
                  CloudWatch (logs, metrics, alarms)
```

**CI/CD:**
```
GitHub push → GitHub Actions
  → pytest (backend unit tests)
  → docker build + push to ECR
  → ecs update-service --force-new-deployment
```

---

### 10. Cost Model (10,000 Active Users/Month)

| Service | Usage | Estimated Cost |
|---|---|---|
| AWS Bedrock (Claude 3 Sonnet) | ~20,000 tokens/month (scheme Q&A only) | ~₹600 |
| RDS PostgreSQL db.t3.micro | 730 hours | ~₹1,500 |
| ECS Fargate (2 tasks × 0.5 vCPU) | 730 hours | ~₹2,000 |
| ElastiCache cache.t3.micro | 730 hours | ~₹800 |
| S3 + CloudFront | 50GB transfer | ~₹400 |
| **Total** | | **~₹5,300/month** |

Well within the ₹25,000/month budget constraint from requirements.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│  React Native PWA (Vite + Tailwind)  │  Progressive Web App   │
│  - Voice Interface (Bhashini STT/TTS)│  - Service Worker      │
│  - Offline-first (IndexedDB)         │  - <20MB cache         │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS / TLS 1.3
                         ▼
┌────────────────────────────────────────────────────────────────┐
│               API GATEWAY LAYER (ap-south-1)                   │
│  CloudFront CDN → AWS WAF → Application Load Balancer          │
│  - Rate limit: 100 req/user/hour                               │
│  - SSL termination via ACM                                     │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER — ECS Fargate                   │
│  FastAPI (Python 3.11) — Uvicorn + Gunicorn                    │
│  ┌──────────────┬─────────────┬──────────────┬───────────────┐ │
│  │ /auth        │ /education  │ /practice    │/recommendations│ │
│  │ Register     │ Story Gen   │ Quiz         │ Product Match  │ │
│  │ Login/JWT    │ Q&A Ask     │ Loan Game    │ Eligibility    │ │
│  │ Profile      │ Dashboard   │ Game History │ Scheme Filter  │ │
│  └──────────────┴──────┬──────┴──────────────┴───────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
│ AWS Bedrock     │ │ Bhashini │ │ Govt Scheme APIs  │
│ Claude 3 Sonnet │ │ STT/TTS  │ │ (PM-Kisan portal) │
│ + Guardrails    │ │ (Indic)  │ │                   │
└─────────────────┘ └──────────┘ └──────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
│ RDS PostgreSQL  │ │ S3       │ │ ElastiCache Redis  │
│ + pgvector      │ │ Content  │ │ - Session cache    │
│ - User data     │ │ Storage  │ │ - FAQ answers      │
│ - Progress      │ │ - Audio  │ │ - Story cache      │
│ - Stories       │ │ - Images │ │ TTL: 1–24 hours   │
└─────────────────┘ └──────────┘ └──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY & MONITORING                          │
│  AWS KMS (encryption)  │  CloudWatch  │  AWS Cognito           │
│  AWS X-Ray (tracing)   │  Prometheus  │  AWS Bedrock Guardrails │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Story Engine (`app/services/bedrock_service.py`)

The Story Engine implements a **three-tier content strategy** to minimise Bedrock costs:

```
Tier 1: Redis Cache      → Return in <100ms, zero cost
Tier 2: Story Templates  → Return in <200ms, zero AI cost
Tier 3: AWS Bedrock      → Return in 2–5s, ~₹0.03 per story
```

**Template Structure:**
```python
STORY_TEMPLATES = {
    "crop_loan": {
        "wheat": { "title": "{farmer_name} की गेहूं...", "template": "..." },
        "cotton": { ... },
        "rice":   { ... }
    },
    "insurance": { ... },
    "savings":   { ... }
}
```

Variables substituted per user: `farmer_name`, `district`, `state`, `farm_size`, `loan_amount`, `bank_interest`, `moneylender_interest`, `savings`.

**Bedrock Prompt Pattern** (used only when no template matches):
- System: Financial literacy educator persona with guardrails
- User: Structured prompt with farmer context + JSON output format
- Model: `anthropic.claude-3-sonnet-20240229-v1:0`
- Max tokens: 1000
- Output parsed as `{ title, content, key_concepts[] }`

**Mock Mode:** `BEDROCK_MOCK_MODE=true` env var enables development without AWS credentials — returns template stories only, Bedrock calls return placeholder text.

---

### 2. Database Schema

```sql
-- Core tables

users (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(15) UNIQUE,      -- +91XXXXXXXXXX
  name VARCHAR(100),
  state VARCHAR(50),
  district VARCHAR(100),
  crop_type ENUM(wheat, cotton, rice, other),
  preferred_language ENUM(hi, pa, te, ta, mr, bn, en),
  farm_size_acres FLOAT,
  annual_income INTEGER,
  hashed_password VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

story_templates (
  id UUID PRIMARY KEY,
  title VARCHAR(200),
  topic VARCHAR(100),                   -- crop_loan | insurance | savings | govt_schemes
  crop_type ENUM,
  template_text TEXT,
  key_concepts JSON,
  difficulty_level INTEGER,             -- 1, 2, 3
  embedding vector(384),               -- pgvector: sentence-transformers/all-MiniLM-L6-v2
  is_active BOOLEAN
)

generated_stories (
  id UUID PRIMARY KEY,
  user_id UUID → users.id,
  template_id UUID → story_templates.id,
  topic VARCHAR(100),
  language ENUM,
  title VARCHAR(200),
  content TEXT,
  key_concepts JSON,
  was_cached BOOLEAN,
  created_at TIMESTAMP
)

modules (
  id UUID PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  topic VARCHAR(100),
  order_index INTEGER,
  prerequisite_module_id UUID → modules.id,
  pass_threshold FLOAT DEFAULT 0.80,   -- 80% quiz score required
  is_active BOOLEAN
)

user_progress (
  id UUID PRIMARY KEY,
  user_id UUID → users.id,
  module_id UUID → modules.id,
  stage ENUM(story, practice, recommendation),
  story_completed BOOLEAN DEFAULT false,
  quiz_score FLOAT,
  quiz_attempts INTEGER DEFAULT 0,
  is_mastered BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
)

quizzes (
  id UUID PRIMARY KEY,
  module_id UUID → modules.id,
  question TEXT,
  options JSON,                         -- [{"id": "a", "text": "..."}]
  correct_option VARCHAR(5),
  explanation TEXT,
  language ENUM
)

game_sessions (
  id UUID PRIMARY KEY,
  user_id UUID → users.id,
  game_type VARCHAR(50),               -- loan_comparison
  scenario_data JSON,                  -- full scenario snapshot
  decisions JSON,                      -- user choices log
  final_score FLOAT,
  outcome_summary TEXT,
  is_completed BOOLEAN,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
)

financial_products (
  id UUID PRIMARY KEY,
  name VARCHAR(200),
  product_type VARCHAR(50),            -- loan | insurance | govt_scheme | savings
  provider VARCHAR(200),
  description TEXT,
  eligibility_criteria JSON,
  interest_rate FLOAT,
  max_amount INTEGER,
  applicable_crops JSON,
  applicable_states JSON,
  is_government_scheme BOOLEAN,
  embedding vector(384)               -- pgvector: for similarity search
)
```

**pgvector Usage:** `financial_products.embedding` enables semantic matching — "किसान को फसल नुकसान पर मदद चाहिए" → finds PMFBY via cosine similarity.

---

### 3. Loan Comparison Game (`app/services/game_service.py`)

Pre-built scenarios for three crop/region combinations:

| Scenario Key | Crop | Region | Loan Amount |
|---|---|---|---|
| `wheat_punjab` | Wheat | Punjab / Haryana | ₹50,000 |
| `cotton_maharashtra` | Cotton | Maharashtra | ₹75,000 |
| `rice_tamilnadu` | Rice | Tamil Nadu / West Bengal | ₹40,000 |

Each scenario has 3 loan options (moneylender, govt scheme/KCC, cooperative/NBFC).

**Scoring Algorithm:**
```python
CHOICE_SCORES = {
    "kcc": 100,          # Best — government scheme, lowest rate
    "cooperative": 70,   # Good — licensed, reasonable rate
    "tnsc_bank": 70,
    "nbfc": 40,          # Acceptable but expensive
    "moneylender": 10,   # Worst — exploitative rate
}
```

**Outcome Calculation:**
```
total_interest = loan_amount × (annual_rate / 100) × (tenure_months / 12) + processing_fee
total_repayment = loan_amount + total_interest
monthly_burden = total_repayment ÷ tenure_months
potential_saving = worst_option_total - chosen_option_total
```

---

### 4. Authentication Flow (`app/services/auth_service.py`)

```
POST /auth/register
  → Validate phone (+91 format), check uniqueness
  → bcrypt hash password (cost factor 12)
  → Create User record
  → Issue JWT (HS256, 24h expiry, sub=user_id)
  → Return TokenResponse

POST /auth/login
  → Lookup by phone_number
  → verify_password (bcrypt)
  → Issue new JWT
  → Return TokenResponse

All protected routes:
  → HTTPBearer extracts token
  → jwt.decode(token, SECRET_KEY)
  → DB lookup User by sub
  → Inject User into route handler
```

---

### 5. Recommendation Engine (`app/api/routes/recommendations.py`)

**Eligibility Gate:**
```
mastered_modules = COUNT(user_progress WHERE is_mastered = true AND user_id = ?)
IF mastered_modules < 3:
    return ready=false, show progress message
ELSE:
    filter products by crop_type + state
    sort: government schemes first, then by product_type
    return top 4 recommendations with why_recommended context
```

**Product Priority Order:** govt_scheme → insurance → loan → savings

---

### 6. Caching Strategy (`app/db/cache.py`)

| Cache Key Pattern | TTL | Content |
|---|---|---|
| `story:{topic}:{crop}:{lang}` | 24 hours | Template-generated stories (shared across users) |
| `faq:{lang}:{question_hash}` | 6 hours | Bedrock Q&A answers |
| `recommendations:{user_id}` | 1 hour | Personalised product list |

Redis key naming convention: `{namespace}:{identifier}`. JSON-serialised values. All cache misses fall through to DB or Bedrock.

---

### 7. API Security

- **Rate limiting:** 100 requests/user/hour (enforced at ALB level via WAF rules)
- **Input validation:** Pydantic v2 — phone regex `^\+91[6-9]\d{9}$`, string length limits
- **Content safety:** AWS Bedrock Guardrails on all LLM outputs — blocks harmful financial advice, medical/legal advice, hate speech
- **CORS:** Configured to allow only the PWA domain in production (`REACT_APP_DOMAIN`)
- **Secrets:** `SECRET_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` stored in AWS Secrets Manager in production (env vars in development)
- **Encryption:** AES-256 at rest (RDS + S3 via AWS KMS), TLS 1.3 in transit

---

### 8. PWA Frontend Architecture (`farmer-fintech-pwa/`)

**Screen Flow:**
```
App Launch
  ↓
Onboarding (language select, name, crop, state)
  → POST /auth/register
  ↓
Dashboard (/education/dashboard)
  → Shows module list with lock/unlock state
  ↓
Story Screen (/education/story/generate)
  → Bhashini TTS plays narration
  → "Ask Question" button → POST /education/ask
  ↓
Quiz Screen (/practice/quiz/{module_id})
  → 3-5 questions, submit → POST /practice/quiz/submit
  → Score ≥ 80%? → Unlock next module
  ↓
Game Screen (/practice/game/start → /practice/game/decide)
  → Show 3 loan cards
  → Tap to choose → Animated outcome reveal
  ↓
Recommendations (/recommendations/)
  → Unlocked after 3 modules mastered
  → Government schemes highlighted first
```

**Voice Integration:**
```javascript
// Bhashini TTS for story narration
POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
Body: { pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: "hi" }}}],
        inputData: { input: [{ source: storyText }] }}

// Web Speech API for STT (fallback when Bhashini STT unavailable)
const recognition = new webkitSpeechRecognition();
recognition.lang = "hi-IN";
```

**Offline Support (Service Worker):**
```javascript
// Cache first 5 modules on install
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('fintech-v1').then(cache =>
    cache.addAll(['/stories/crop_loan', '/stories/insurance', '/game/loan_comparison', ...])
  ));
});
```

---

### 9. Deployment Architecture

**Development:**
```
docker-compose up → API(:8000) + PostgreSQL(:5432) + Redis(:6379)
```

**Production (AWS ap-south-1):**
```
Route 53 → CloudFront → WAF → ALB
                                ↓
                     ECS Fargate (farmer-fintech-api)
                       Task: 0.5 vCPU, 1GB RAM
                       Auto-scaling: 1–10 tasks
                                ↓
                  RDS PostgreSQL (db.t3.micro, Multi-AZ off for MVP)
                  ElastiCache Redis (cache.t3.micro)
                  S3 (content-assets bucket, ap-south-1)
                  KMS (CMK for encryption)
                  Cognito (user pool, optional — JWT self-managed for MVP)
                  X-Ray (distributed tracing)
                  CloudWatch (logs, metrics, alarms)
```

**CI/CD:**
```
GitHub push → GitHub Actions
  → pytest (backend unit tests)
  → docker build + push to ECR
  → ecs update-service --force-new-deployment
```

---

### 10. Cost Model (10,000 Active Users/Month)

| Service | Usage | Estimated Cost |
|---|---|---|
| AWS Bedrock (Claude 3 Sonnet) | ~40,000 tokens/month (10% non-template) | ~₹1,200 |
| RDS PostgreSQL db.t3.micro | 730 hours | ~₹1,500 |
| ECS Fargate (2 tasks × 0.5 vCPU) | 730 hours | ~₹2,000 |
| ElastiCache cache.t3.micro | 730 hours | ~₹800 |
| S3 + CloudFront | 50GB transfer | ~₹400 |
| Bhashini API | Free (Government of India) | ₹0 |
| **Total** | | **~₹5,900/month** |

Well within the ₹25,000/month budget constraint from requirements.
