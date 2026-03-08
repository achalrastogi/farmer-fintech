# Tasks — Rural Farmer Fintech Education Platform

## Implementation Plan

Tasks map to requirements in `requirements.md`. `[x]` = completed. `[ ]` = pending.

---

## Phase 1: Project Scaffold & Infrastructure ✅

- [x] 1. Initialize monorepo structure — `backend/`, `frontend/`, `.kiro/`
- [x] 2. Configure Pydantic settings for all env variables (`backend/app/core/config.py`)
- [x] 3. Async PostgreSQL + pgvector setup (`backend/app/db/database.py`)
- [x] 4. Redis async cache client (`backend/app/db/cache.py`)
- [x] 5. DynamoDB client for game sessions (`backend/app/db/dynamo.py`)
- [x] 6. S3 service for audio assets (`backend/app/services/s3_service.py`)
- [x] 7. Docker Compose local dev stack — API + PostgreSQL + Redis (`docker-compose.yml`)
- [x] 8. Dockerfile for FastAPI app (`backend/Dockerfile`)

---

## Phase 2: Database Models & Schemas ✅

- [x] 9. SQLAlchemy ORM models — User, LessonCategory, Lesson, Scheme, UserSavedScheme, ContentTranslation (`backend/app/models/models.py`)
- [x] 10. Pydantic schemas — all request/response types (`backend/app/schemas/schemas.py`)
- [x] 11. Database seed SQL — pgvector, 8 lesson categories, 126 lessons, 6 government schemes, quiz questions (`backend/scripts/init.sql`)

---

## Phase 3: Authentication ✅

- [x] 12. JWT auth service — bcrypt (cost factor 12) + HS256 tokens (`backend/app/services/auth_service.py`)
- [x] 13. Auth routes — register, login, profile (`backend/app/api/routes/auth.py`)
- [x] 14. Demo user auto-seeding in development mode (`backend/app/main.py`)

---

## Phase 4: Lesson System ✅

- [x] 15. Lesson categories endpoint — 8 categories with lesson counts (`backend/app/api/routes/lessons.py`)
- [x] 16. Lesson detail endpoint — full lesson content with translations
- [x] 17. Translation service — bulk fetch with fallback chain (requested lang → Hindi → English) (`backend/app/services/translation_service.py`)
- [x] 18. Seed 126 lessons across 8 categories in init.sql

---

## Phase 5: Government Schemes ✅

- [x] 19. Scheme list endpoint — filter by category, state, crop, search (`backend/app/api/routes/schemes.py`)
- [x] 20. Scheme detail endpoint — full scheme info with translations
- [x] 21. Scheme save/unsave toggle endpoint
- [x] 22. Saved schemes list endpoint
- [x] 23. Scheme-specific AI Q&A endpoint — uses Bedrock with scheme context
- [x] 24. Global scheme AI search endpoint — keyword matching + AI answers
- [x] 25. Seed 6 government schemes (PM-Kisan, PMFBY, KCC, PM Awas, PMKMY, SMAM) in init.sql

---

## Phase 6: Home Dashboard ✅

- [x] 26. Farm snapshot endpoint — profit estimation, loan risk, emergency fund status (`backend/app/api/routes/home.py`)
- [x] 27. Profile update endpoint — patch user fields
- [x] 28. Daily tip rotation logic

---

## Phase 7: Practice Module (Partial) ✅

- [x] 29. Quiz routes — fetch questions, submit + grade (`backend/app/api/routes/practice.py`)
- [x] 30. Game service — loan comparison scenarios (`backend/app/services/game_service.py`)
- [x] 31. Game routes — start session, decide, history

---

## Phase 8: AWS Bedrock Integration ✅

- [x] 32. Bedrock service — Claude 3 Sonnet integration (`backend/app/services/bedrock_service.py`)
- [x] 33. Mock mode for development without AWS credentials
- [x] 34. Guardrails configuration for content safety

---

## Phase 9: React PWA Frontend ✅

- [x] 35. Vite + React 18 + Tailwind CSS scaffold (`frontend/`)
- [x] 36. Central API client — all backend calls, JWT storage (`frontend/src/lib/api.js`)
- [x] 37. i18n system — Hindi, Punjabi, Marathi, English (`frontend/src/i18n/`)
- [x] 38. useTranslation hook (`frontend/src/hooks/useTranslation.jsx`)
- [x] 39. Onboarding screen — language select, farmer profile, phone registration (`frontend/src/screens/Onboarding.jsx`)
- [x] 40. Login screen (`frontend/src/screens/Login.jsx`)
- [x] 41. Dashboard screen — 5 hub navigation cards (`frontend/src/screens/Dashboard.jsx`)
- [x] 42. Home screen — farm snapshot display (`frontend/src/screens/Home.jsx`)
- [x] 43. Tools screen — 8 calculator grid (`frontend/src/screens/Tools.jsx`)
- [x] 44. Learn screen — 8 lesson categories, lesson stack view (`frontend/src/screens/Learn.jsx`)
- [x] 45. LessonDetail screen — full lesson content (`frontend/src/screens/LessonDetail.jsx`)
- [x] 46. Schemes screen — 6 categories, filtered list, AI search (`frontend/src/screens/Schemes.jsx`)
- [x] 47. SchemeDetail screen — full scheme info, Q&A (`frontend/src/screens/SchemeDetail.jsx`)
- [x] 48. Profile screen — user profile editor (`frontend/src/screens/Profile.jsx`)
- [x] 49. 8 Calculator components (`frontend/src/screens/calculators/`)
  - [x] CropProfit.jsx
  - [x] LoanROI.jsx
  - [x] EMISafety.jsx
  - [x] StorageDecision.jsx
  - [x] EmergencyFund.jsx
  - [x] BreakEven.jsx
  - [x] CropComparison.jsx
  - [x] CostLeakage.jsx
- [x] 50. TopBar component — consistent header with back navigation (`frontend/src/components/TopBar.jsx`)
- [x] 51. FloatingAI component — AI assistant button (`frontend/src/components/FloatingAI.jsx`)
- [x] 52. OfflineBanner component — offline status indicator (`frontend/src/components/OfflineBanner.jsx`)

---

## Phase 10: Additional Frontend Sections (Partial) ✅

- [x] 53. Loans screen — loan management hub (`frontend/src/screens/Loans.jsx`)
- [x] 54. CashFlow screen — cash flow tracking (`frontend/src/screens/CashFlow.jsx`)
- [x] 55. Risk screen — risk assessment (`frontend/src/screens/Risk.jsx`)
- [x] 56. Market screen — market intelligence (`frontend/src/screens/Market.jsx`)
- [x] 57. WealthGrowth screen — wealth planning (`frontend/src/screens/WealthGrowth.jsx`)
- [x] 58. AIAssistant screen — global AI assistant (`frontend/src/screens/AIAssistant.jsx`)

---

## Phase 11: Kiro Specs & Steering ✅

- [x] 59. `product.md` — product overview and impact targets (`.kiro/steering/product.md`)
- [x] 60. `tech.md` — tech stack, commands, libraries (`.kiro/steering/tech.md`)
- [x] 61. `structure.md` — project organization and conventions (`.kiro/steering/structure.md`)
- [x] 62. `requirements.md` — 7 requirements with acceptance criteria (`.kiro/specs/farmer-fintech-platform/requirements.md`)
- [x] 63. `design.md` — architecture, DB schema, component design (`.kiro/specs/farmer-fintech-platform/design.md`)
- [x] 64. `tasks.md` — this file, implementation tracking (`.kiro/specs/farmer-fintech-platform/tasks.md`)

---

## Phase 12: Deployment & Infrastructure (Pending) [ ]

- [x] 65. Launch RDS PostgreSQL db.t3.micro in ap-south-1, run `init.sql`
- [x] 66. Launch ElastiCache Redis cache.t3.micro in ap-south-1
- [x] 67. Create S3 buckets for content storage
- [x] 68. Create DynamoDB tables for game sessions
- [x] 69. Setup AWS Secrets Manager with production credentials
- [x] 70. Build Docker image, push to Amazon ECR
- [x] 71. Create ECS Fargate cluster + task definition
- [x] 72. Create ECS Service with ALB + health check on `/health`
- [x] 73. Set up API Gateway HTTP API in front of ALB
- [x] 74. Deploy frontend to AWS Amplify from GitHub
- [x] 75. Configure CloudFront distribution + WAF
- [x] 76. Enable AWS Bedrock Claude 3 Sonnet model access (ap-south-1)
- [x] 77. Configure Bedrock Guardrails
- [x] 78. End-to-end smoke test: register → lessons → calculators → schemes → AI Q&A
- [x] 79. Record demo video
- [x] 80. Submit on hackathon dashboard

---

## Phase 13: Future Enhancements (Not Started) [ ]

- [ ] 81. PWA Service Worker — offline caching of lessons and schemes
- [ ] 82. Bhashini TTS/STT integration for voice interface
- [ ] 83. Story generation system with templates + Bedrock
- [ ] 84. Quiz system with progress tracking
- [ ] 85. Loan comparison game with scenarios
- [ ] 86. Recommendation engine based on completed modules
- [ ] 87. Lambda functions for offline sync and audio processing
- [ ] 88. WhatsApp bot integration
- [ ] 89. Community forum for peer learning
- [ ] 90. Real-time commodity price integration

---

## Progress Summary

| Phase | Tasks | Status |
|---|---|---|
| 1–11. Build (Backend + Frontend + Specs) | 1–64 | ✅ Complete (64/64) |
| 12. Deployment | 65–80 | ⏳ Pending (0/16) |
| 13. Future Enhancements | 81–90 | 📋 Planned (0/10) |

**Completed:** 64 / 90 tasks (71%)
**Deployment Pending:** 16 tasks
**Future Enhancements:** 10 tasks

**Current Status:** Core platform complete with 126 lessons, 8 calculators, government schemes database, and AI Q&A. Ready for deployment.
