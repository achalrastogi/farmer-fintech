# Requirements — Rural Farmer Fintech Education Platform

## Introduction

The Rural Farmer Fintech Education Platform addresses financial illiteracy among rural Indian farmers (wheat, cotton, and rice growers) who fall into debt traps, miss government schemes, and make poor financial decisions due to lack of knowledge — not lack of access. The solution is an **education-first** fintech platform that provides:

1. **126 structured financial lessons** across 8 modules (Farm Financial Empowerment Workbook)
2. **8 interactive financial calculators** (crop profit, loan ROI, EMI safety, break-even, etc.)
3. **Government scheme database** with AI-powered Q&A
4. **Personalized dashboard** with farm snapshot and risk assessment
5. **Multi-language support** (Hindi, Punjabi, Marathi, English, etc.)

**Target Users:**
- Primary: Wheat, cotton, and rice farmers with low digital literacy
- Secondary: Regional language speakers with limited access to financial education

## Glossary

- **Lesson_System** — 126 structured financial lessons across 8 categories
- **Calculator_Hub** — 8 interactive financial calculators for practical decision-making
- **Scheme_Database** — Government scheme catalog with AI-powered Q&A
- **Dashboard** — Personalized farm snapshot with profit estimation and risk assessment
- **AI_Assistant** — AWS Bedrock-powered Q&A for schemes and financial concepts
- **Translation_Service** — Multi-language content delivery with fallback chain
- **Home_Hub** — Central navigation to Learn, Tools, Schemes, and financial sections
- **Authentication_System** — JWT-based user identity and session management
- **Profile_Manager** — User farming context (crop, state, land size, income)

---

## Requirement 1: Structured Financial Education Lessons

**User Story:** As a rural farmer, I want to access structured financial lessons organized by topic so that I can learn specific concepts relevant to my farming decisions.

### Acceptance Criteria

1. WHEN a user opens the Learn section, THE Lesson_System SHALL display 8 lesson categories (Farm Profit & Cost Mastery, Cash Flow & Stability, Loan & Credit Intelligence, Risk & Insurance, Market & MSP Intelligence, Government Schemes, Institutional Support, Long-Term Wealth Planning).

2. WHEN a user selects a category, THE Lesson_System SHALL show all lessons in that category with title, key points preview, and related calculator links.

3. WHEN a user opens a lesson, THE Lesson_System SHALL display: title (Hindi + English), key points list, practical example, simple calculation formula, common mistakes, and "try this" exercise.

4. WHEN lessons reference calculators, THE Lesson_System SHALL provide direct navigation to the related calculator tool.

5. WHEN content is requested in a specific language, THE Translation_Service SHALL return translated content with fallback to Hindi if translation unavailable.

---

## Requirement 2: Interactive Financial Calculators

**User Story:** As a farmer making financial decisions, I want to use calculators to estimate outcomes so that I can make informed choices about crops, loans, and expenses.

### Acceptance Criteria

1. WHEN a user opens the Tools section, THE Calculator_Hub SHALL display 8 calculators: Crop Profit, Loan ROI, EMI Safety, Storage Decision, Emergency Fund, Break-Even, Crop Comparison, and Cost Leakage.

2. WHEN a user inputs values into a calculator, THE Calculator_Hub SHALL compute results in real-time and display clear explanations of the calculations.

3. WHEN calculator results are displayed, THE Calculator_Hub SHALL provide actionable insights and recommendations based on the computed values.

4. WHEN a calculator is linked from a lesson, THE Calculator_Hub SHALL pre-populate example values from the lesson context.

5. WHEN calculations involve financial comparisons, THE Calculator_Hub SHALL highlight the better option and show potential savings.

---

## Requirement 3: Government Scheme Discovery and AI Q&A

**User Story:** As a farmer, I want to discover relevant government schemes and ask questions about them so that I can access benefits I'm eligible for.

### Acceptance Criteria

1. WHEN a user opens the Schemes section, THE Scheme_Database SHALL display 6 categories: Income Support, Crop & Livestock Insurance, Subsidy, Credit & Loan, Allied Activities, and Pension & Family.

2. WHEN a user selects a category, THE Scheme_Database SHALL filter schemes by category and optionally by state, crop type, and farmer type.

3. WHEN a user views a scheme, THE Scheme_Database SHALL display: name (Hindi + English), benefit amount, eligibility criteria, required documents, application steps, common rejection reasons, fraud warnings, and official website.

4. WHEN a user asks a question about a specific scheme, THE AI_Assistant SHALL provide contextual answers using scheme data and user profile, with disclaimer that information is educational.

5. WHEN a user uses global AI search, THE AI_Assistant SHALL search across all schemes, match by keywords and categories, and provide relevant scheme recommendations with quick links.

---

## Requirement 4: Personalized Farm Dashboard

**User Story:** As a farmer, I want to see a personalized snapshot of my farm's financial health so that I can track my progress and identify areas for improvement.

### Acceptance Criteria

1. WHEN a user logs in, THE Dashboard SHALL display a farm snapshot with: estimated annual profit, profit per acre, loan risk level, emergency fund status, and daily financial tip.

2. WHEN calculating profit estimates, THE Dashboard SHALL use crop-specific profit-per-acre values (wheat: ₹18,000, cotton: ₹25,000, rice: ₹20,000) multiplied by user's farm size.

3. WHEN assessing loan risk, THE Dashboard SHALL compute loan-to-income ratio and categorize as: low (<30%), moderate (30-60%), or high (>60%).

4. WHEN checking emergency fund status, THE Dashboard SHALL compare estimated savings against 3-month expense target.

5. WHEN displaying daily tips, THE Dashboard SHALL rotate through financial literacy tips relevant to farming decisions.

---

## Requirement 5: Multi-Hub Navigation Architecture

**User Story:** As a farmer, I want to navigate between different financial sections easily so that I can access the information I need quickly.

### Acceptance Criteria

1. WHEN a user opens the app, THE Home_Hub SHALL display 6 main sections: Home (dashboard), Tools (calculators), Learn (lessons), Schemes (government programs), and Profile.

2. WHEN a user is in any section, THE Home_Hub SHALL provide a back button to return to the main dashboard.

3. WHEN a user navigates to Tools, THE Home_Hub SHALL show the calculator hub with all 8 calculators organized by category.

4. WHEN a user navigates to Learn, THE Home_Hub SHALL show the lesson categories with lesson counts and module information.

5. WHEN a user navigates to Schemes, THE Home_Hub SHALL show the category grid with scheme counts and AI assistant access.

---

## Requirement 6: Secure User Data and Privacy Protection

**User Story:** As a farmer concerned about data privacy, I want my personal and financial information to be securely protected so that I can trust the platform with sensitive information.

### Acceptance Criteria

1. WHEN a user creates an account, THE Authentication_System SHALL hash passwords with bcrypt (cost factor 12) and issue JWT tokens (HS256, 24-hour expiry).

2. WHEN storing user data, THE Authentication_System SHALL ensure all data resides in AWS ap-south-1 (Mumbai) in compliance with DPDPA 2023.

3. WHEN a user updates their profile, THE Profile_Manager SHALL validate inputs and update only provided fields (crop type, state, district, farm size, income, expenses).

4. WHEN transmitting data between client and server, THE Authentication_System SHALL enforce TLS 1.3 and AES-256 encryption at rest (AWS KMS).

5. WHEN a user's session expires, THE Authentication_System SHALL require re-authentication without exposing sensitive data.

---

## Requirement 7: Performance and Device Compatibility

**User Story:** As a farmer using a low-cost Android phone in a rural area with slow internet, I want the app to load and work quickly on my device so that poor connectivity does not stop me from learning.

### Acceptance Criteria

1. WHEN the app loads on a 2G connection (64 kbps minimum), THE Dashboard SHALL display the main navigation within 10 seconds.

2. WHEN a user is on a low-end device (Android 8.0+, 1GB RAM minimum), THE Lesson_System SHALL run without crashes and maintain smooth scrolling.

3. WHEN a user navigates between sections, THE Home_Hub SHALL cache previously loaded content to reduce data usage.

4. WHEN the backend serves API requests, THE Authentication_System SHALL respond within 2 seconds at the 95th percentile under normal load.

5. WHEN the system is under peak load, THE infrastructure (ECS Fargate auto-scaling + ElastiCache Redis) SHALL maintain response times without degradation.

---

## Future Design Phases

### Phase 2 (Months 7–12)
- Voice interface integration (Bhashini TTS/STT)
- Offline-first PWA with Service Worker caching
- WhatsApp Bot Integration for conversational access
- Community Forum for peer-to-peer farmer learning
- Additional interactive sections: Loans, Cash Flow, Risk, Market, Wealth Growth

### Phase 3 (Year 2)
- Direct loan application submission via partner bank APIs
- Real-time commodity price and weather data integration
- Desktop web version for institutional partnerships
- Full video lesson content
- Advanced AI story generation for personalized narratives

### Explicitly Excluded from Current Version
- AI-generated images (pre-built asset library only)
- Social media login or sharing
- Cryptocurrency or trading education
- Cross-border payments or remittances
- Gamification with scores and leaderboards
