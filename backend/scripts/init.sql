-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE croptype AS ENUM ('wheat','cotton','rice','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE language AS ENUM ('hi','pa','te','ta','mr','bn','en');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE learningstage AS ENUM ('story','practice','recommendation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE schemecategory AS ENUM ('income_support','subsidy','insurance','credit','pension','infrastructure');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT '',
    district VARCHAR(100) DEFAULT '',
    crop_type croptype DEFAULT 'wheat',
    preferred_language language DEFAULT 'hi',
    farm_size_acres FLOAT DEFAULT 2.0,
    annual_income INTEGER DEFAULT 100000,
    loan_amount INTEGER DEFAULT 0,
    monthly_expenses INTEGER DEFAULT 8000,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    crop_type croptype NOT NULL,
    template_text TEXT NOT NULL,
    key_concepts JSON DEFAULT '[]',
    difficulty_level INTEGER DEFAULT 1,
    embedding vector(384),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    template_id UUID REFERENCES story_templates(id),
    topic VARCHAR(100) NOT NULL,
    language language NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    key_concepts JSON DEFAULT '[]',
    was_cached BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    prerequisite_module_id UUID REFERENCES modules(id),
    pass_threshold FLOAT DEFAULT 0.80,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    module_id UUID REFERENCES modules(id),
    stage learningstage DEFAULT 'story',
    story_completed BOOLEAN DEFAULT false,
    quiz_score FLOAT,
    quiz_attempts INTEGER DEFAULT 0,
    is_mastered BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id),
    question TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option VARCHAR(5) NOT NULL,
    explanation TEXT NOT NULL,
    language language DEFAULT 'hi'
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    game_type VARCHAR(50) DEFAULT 'loan_comparison',
    scenario_data JSON NOT NULL,
    decisions JSON DEFAULT '[]',
    final_score FLOAT,
    outcome_summary TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    name_hindi VARCHAR(200) NOT NULL,
    category schemecategory NOT NULL,
    description TEXT NOT NULL,
    description_hindi TEXT NOT NULL,
    benefit_amount VARCHAR(200) NOT NULL,
    eligibility TEXT NOT NULL,
    eligibility_hindi TEXT NOT NULL,
    documents_required JSON DEFAULT '[]',
    how_to_apply TEXT NOT NULL,
    official_website VARCHAR(300),
    applicable_states JSON DEFAULT '[]',
    applicable_crops JSON DEFAULT '[]',
    common_rejection_reasons JSON DEFAULT '[]',
    fraud_warning TEXT,
    faq_list JSON DEFAULT '[]',
    how_to_apply_steps JSON DEFAULT '[]',
    scheme_type VARCHAR(20) DEFAULT 'central',
    min_land_acres FLOAT,
    max_land_acres FLOAT,
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_saved_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    scheme_id UUID REFERENCES schemes(id),
    saved_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_hindi VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES lesson_categories(id),
    title VARCHAR(200) NOT NULL,
    title_hindi VARCHAR(200) NOT NULL,
    key_points JSON DEFAULT '[]',
    example TEXT NOT NULL,
    simple_calculation TEXT,
    common_mistakes JSON DEFAULT '[]',
    try_this TEXT,
    related_calculator VARCHAR(50),
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS financial_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    provider VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    eligibility_criteria JSON NOT NULL,
    interest_rate FLOAT,
    max_amount INTEGER,
    applicable_crops JSON DEFAULT '[]',
    applicable_states JSON DEFAULT '[]',
    is_government_scheme BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    embedding vector(384)
);

CREATE TABLE IF NOT EXISTS content_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    language VARCHAR(5) NOT NULL,
    field VARCHAR(50) NOT NULL,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ct_entity ON content_translations (entity_type, entity_id, language);
CREATE INDEX IF NOT EXISTS idx_ct_lang ON content_translations (language);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ct_unique ON content_translations (entity_type, entity_id, language, field);

-- ─── Seed: Learning Modules ───────────────────────────────────────────────────
INSERT INTO modules (id, name, description, topic, order_index, pass_threshold, is_active)
VALUES
  (uuid_generate_v4(), 'ब्याज दर को समझें', 'साहूकार vs बैंक — असली अंतर जानें', 'crop_loan', 1, 0.80, true),
  (uuid_generate_v4(), 'फसल बीमा क्यों जरूरी है', 'PMFBY से अपनी फसल को सुरक्षित करें', 'insurance', 2, 0.80, true),
  (uuid_generate_v4(), 'सुरक्षित बचत कैसे करें', 'बचत को सही जगह रखना सीखें', 'savings', 3, 0.80, true),
  (uuid_generate_v4(), 'सरकारी योजनाओं का फायदा उठाएं', 'PM-Kisan, KCC और अन्य योजनाएं', 'government_schemes', 4, 0.80, true)
ON CONFLICT DO NOTHING;

-- ─── Seed: Quiz Questions (Hindi, Module 1) ───────────────────────────────────
INSERT INTO quizzes (id, module_id, question, options, correct_option, explanation, language)
SELECT
  uuid_generate_v4(),
  m.id,
  'अगर साहूकार 5% प्रति माह ब्याज लेता है, तो साल में कितना प्रतिशत होगा?',
  '[{"id":"a","text":"5%"},{"id":"b","text":"30%"},{"id":"c","text":"60%"},{"id":"d","text":"120%"}]'::json,
  'c',
  '5% × 12 महीने = 60% प्रति वर्ष। यह बैंक से 15 गुना महंगा है!',
  'hi'
FROM modules m WHERE m.topic = 'crop_loan'
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, module_id, question, options, correct_option, explanation, language)
SELECT
  uuid_generate_v4(),
  m.id,
  'KCC (किसान क्रेडिट कार्ड) पर ब्याज दर कितनी है?',
  '[{"id":"a","text":"4% प्रति वर्ष"},{"id":"b","text":"12% प्रति वर्ष"},{"id":"c","text":"24% प्रति वर्ष"},{"id":"d","text":"36% प्रति वर्ष"}]'::json,
  'a',
  'KCC पर सरकारी सब्सिडी के साथ सिर्फ 4% प्रति वर्ष ब्याज लगता है।',
  'hi'
FROM modules m WHERE m.topic = 'crop_loan'
ON CONFLICT DO NOTHING;

-- ─── Seed: Government Schemes ─────────────────────────────────────────────────
INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, official_website,
  applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, last_updated, is_active
) VALUES

-- 1. PM-Kisan
(
  uuid_generate_v4(),
  'PM-Kisan Samman Nidhi',
  'प्रधानमंत्री किसान सम्मान निधि',
  'income_support',
  'Direct income support of ₹6,000 per year to all farmer families in 3 installments of ₹2,000 each.',
  'सभी किसान परिवारों को साल में ₹6,000 की आर्थिक सहायता — तीन किस्तों में ₹2,000 प्रत्येक।',
  '₹6,000/year (3 installments of ₹2,000)',
  'All small and marginal farmers who own cultivable land.',
  'सभी छोटे और सीमांत किसान जिनके पास खेती योग्य जमीन है।',
  '["Aadhaar Card", "Bank Account linked to Aadhaar", "Land Records (Khasra/Khatauni)", "Mobile Number"]',
  'Register at pmkisan.gov.in or visit nearest CSC (Common Service Centre). Village Patwari can help with land verification.',
  'https://pmkisan.gov.in',
  '[]',
  '[]',
  '["Land records not updated", "Bank account not Aadhaar-linked", "Duplicate registration", "Income tax payer in family"]',
  '⚠️ सावधान: कोई भी PM-Kisan के नाम पर पैसे मांगे तो मत दें। यह योजना पूरी तरह मुफ्त है।',
  NOW(),
  true
),

-- 2. PMFBY
(
  uuid_generate_v4(),
  'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
  'प्रधानमंत्री फसल बीमा योजना',
  'insurance',
  'Crop insurance scheme. Farmers pay only 1.5-2% premium; government covers the rest. Full claim if crop fails.',
  'फसल बीमा योजना। किसान सिर्फ 1.5-2% प्रीमियम देते हैं, बाकी सरकार देती है। फसल खराब होने पर पूरा मुआवजा।',
  '1.5% premium for Rabi, 2% for Kharif. Full sum insured on crop failure.',
  'All farmers growing notified crops in notified areas. Both loanee and non-loanee farmers eligible.',
  'अधिसूचित क्षेत्रों में अधिसूचित फसल उगाने वाले सभी किसान। KCC धारक और गैर-KCC दोनों पात्र।',
  '["Aadhaar Card", "Bank Passbook", "Land Records", "Sowing Certificate from Patwari", "Mobile Number"]',
  'Apply before sowing date at nearest bank, CSC, or pmfby.gov.in. For KCC holders, enrollment may be automatic — verify with bank.',
  'https://pmfby.gov.in',
  '[]',
  '["wheat", "cotton", "rice", "other"]',
  '["Late application after sowing deadline", "Crop not notified in your area", "Incorrect bank details", "No sowing certificate"]',
  '⚠️ बीमा कंपनी का एजेंट घर आकर अतिरिक्त शुल्क मांगे तो मना करें। प्रीमियम सीधे बैंक से काटा जाता है।',
  NOW(),
  true
),

-- 3. KCC
(
  uuid_generate_v4(),
  'Kisan Credit Card (KCC)',
  'किसान क्रेडिट कार्ड',
  'credit',
  'Flexible credit for farmers at 4% annual interest. Cover crop expenses, post-harvest expenses, and allied activities.',
  'किसानों के लिए सिर्फ 4% वार्षिक ब्याज पर लचीला कर्ज। फसल, कटाई के बाद और अन्य खर्चों के लिए।',
  'Up to ₹3 lakh at 4% per year. No collateral up to ₹1.6 lakh.',
  'All farmers — individual, joint borrowers, tenant farmers, sharecroppers with cultivable land.',
  'सभी किसान — व्यक्तिगत, संयुक्त उधारकर्ता, किरायेदार किसान, बटाईदार।',
  '["Aadhaar Card", "Land Records (Khasra)", "2 Passport Photos", "Bank Account", "Income Certificate (if required)"]',
  'Apply at any nationalized bank, regional rural bank, or cooperative bank. Bring land records and Aadhaar. Approval in 2-4 weeks.',
  'https://www.nabard.org/content1.aspx?id=569',
  '[]',
  '["wheat", "cotton", "rice", "other"]',
  '["No land records in applicant name", "Previous loan default", "Incomplete documentation"]',
  '⚠️ कोई भी KCC के लिए दलाली मांगे तो सीधे बैंक जाएं। बैंक में KCC आवेदन मुफ्त है।',
  NOW(),
  true
),

-- 4. PM Awas Gramin
(
  uuid_generate_v4(),
  'PM Awas Yojana Gramin (PMAY-G)',
  'प्रधानमंत्री आवास योजना ग्रामीण',
  'subsidy',
  'Financial assistance for construction of pucca house for rural households. ₹1.2-1.3 lakh subsidy.',
  'ग्रामीण परिवारों को पक्का मकान बनाने के लिए ₹1.2-1.3 लाख की सहायता।',
  '₹1.2 lakh (plains) / ₹1.3 lakh (hilly/difficult areas)',
  'BPL families and those in SECC-2011 list without pucca house or living in kutcha house.',
  'BPL परिवार और SECC-2011 सूची में शामिल वे परिवार जिनके पास पक्का मकान नहीं है।',
  '["Aadhaar Card", "Bank Account", "SECC List inclusion proof", "Land document for house construction"]',
  'Beneficiaries are selected from SECC-2011 data by Gram Panchayat. Contact Gram Pradhan or Block Development Officer.',
  'https://pmayg.nic.in',
  '[]',
  '[]',
  '["Already has pucca house", "Not in SECC-2011 list", "Income above threshold"]',
  '⚠️ आवास योजना में नाम जोड़वाने के लिए कोई पैसे मांगे तो मना करें।',
  NOW(),
  true
),

-- 5. PMKMY (Pension)
(
  uuid_generate_v4(),
  'PM Kisan Mandhan Yojana (PMKMY)',
  'प्रधानमंत्री किसान मानधन योजना',
  'pension',
  'Pension scheme for small and marginal farmers. ₹3,000/month pension after age 60.',
  'छोटे और सीमांत किसानों के लिए पेंशन योजना। 60 साल की उम्र के बाद ₹3,000/माह पेंशन।',
  '₹3,000/month pension after age 60',
  'Small and marginal farmers aged 18-40 with less than 2 hectares of land. Must not be covered under EPFO/ESIC.',
  '18-40 साल के छोटे और सीमांत किसान जिनके पास 2 हेक्टेयर से कम जमीन हो।',
  '["Aadhaar Card", "Bank Account", "Land Records", "Age Proof"]',
  'Visit nearest CSC (Jan Seva Kendra) with Aadhaar and bank passbook. Monthly premium ranges from ₹55-200 depending on age.',
  'https://maandhan.in',
  '[]',
  '[]',
  '["Age above 40", "Land holding above 2 hectares", "Already in another pension scheme"]',
  NULL,
  NOW(),
  true
),

-- 6. SMAM (Farm equipment subsidy)
(
  uuid_generate_v4(),
  'Sub-Mission on Agricultural Mechanisation (SMAM)',
  'कृषि यंत्रीकरण उप-मिशन (SMAM)',
  'subsidy',
  'Up to 50-80% subsidy on farm machinery and equipment for small farmers.',
  'छोटे किसानों के लिए कृषि मशीनरी और उपकरणों पर 50-80% सब्सिडी।',
  '50-80% subsidy on farm machinery',
  'Small, marginal, SC/ST farmers and women farmers get highest priority for subsidized machinery.',
  'छोटे, सीमांत, SC/ST किसान और महिला किसानों को प्राथमिकता मिलती है।',
  '["Aadhaar Card", "Land Records", "Bank Account", "Category Certificate (if SC/ST)"]',
  'Apply through state agriculture department or agrimachinery.nic.in portal. Districts have annual quota.',
  'https://agrimachinery.nic.in',
  '[]',
  '[]',
  '["Quota already exhausted for the year", "Machinery not in approved list", "Income above limit"]',
  NULL,
  NOW(),
  true
)

ON CONFLICT DO NOTHING;

-- ─── Seed: Lesson Categories ──────────────────────────────────────────────────
INSERT INTO lesson_categories (id, name, name_hindi, icon, order_index, is_active)
VALUES
  (uuid_generate_v4(), 'Profit & Cost',        'लाभ और लागत',        '💰', 1, true),
  (uuid_generate_v4(), 'Cash Flow',             'नकद प्रवाह',          '💸', 2, true),
  (uuid_generate_v4(), 'Loans',                 'कर्ज और ब्याज',       '🏦', 3, true),
  (uuid_generate_v4(), 'Risk & Insurance',      'जोखिम और बीमा',       '🛡️', 4, true),
  (uuid_generate_v4(), 'Market & MSP',          'बाजार और MSP',        '📈', 5, true),
  (uuid_generate_v4(), 'Government Schemes',    'सरकारी योजनाएं',      '🏛️', 6, true),
  (uuid_generate_v4(), 'Long-term Stability',   'दीर्घकालिक स्थिरता', '🌱', 7, true)
ON CONFLICT DO NOTHING;

-- ─── Seed: Lessons (Profit & Cost category) ───────────────────────────────────
INSERT INTO lessons (
  id, category_id, title, title_hindi,
  key_points, example, simple_calculation, common_mistakes, try_this,
  related_calculator, order_index, is_active
)
SELECT
  uuid_generate_v4(),
  lc.id,
  'What is Profit?',
  'मुनाफा क्या होता है?',
  '["Revenue = Quantity sold × Selling price", "Cost = Seeds + Fertilizer + Labour + Water + Transport", "Profit = Revenue - Total Cost", "Profit per acre = Total Profit ÷ Acres", "If Profit < 0, it is a Loss"]'::json,
  'Ramesh grew wheat on 2 acres. He sold 20 quintals at ₹2,015/quintal = ₹40,300. His total cost was ₹22,000. Profit = ₹40,300 - ₹22,000 = ₹18,300. Profit per acre = ₹18,300 ÷ 2 = ₹9,150.',
  'Profit = Revenue - Cost. Revenue = Qty × Price. Cost = Seeds + Fertilizer + Labour + Irrigation + Transport.',
  '["Forgetting transport cost", "Not counting own labour as cost", "Using expected price not actual price", "Ignoring loan interest in cost"]'::json,
  'Write down all your costs for last season. Calculate your actual profit per acre. Was it more or less than you expected?',
  'crop_profit',
  1,
  true
FROM lesson_categories lc WHERE lc.name = 'Profit & Cost'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (
  id, category_id, title, title_hindi,
  key_points, example, simple_calculation, common_mistakes, try_this,
  related_calculator, order_index, is_active
)
SELECT
  uuid_generate_v4(),
  lc.id,
  'Break-Even Point',
  'ब्रेक-ईवन पॉइंट',
  '["Break-even = the price at which you recover all costs", "Below break-even price = you are making a loss", "Compare break-even with MSP before deciding to sell", "Helps you decide minimum selling price", "Critical tool before taking a loan for farming"]'::json,
  'Suresh spent ₹24,000 on 2 acres of rice. He harvested 18 quintals. Break-even price = ₹24,000 ÷ 18 = ₹1,333/quintal. Current market rate is ₹1,800. So he is safe to sell now.',
  'Break-even price = Total Cost ÷ Expected Yield (quintals). If market price > break-even price, you profit.',
  '["Selling below break-even thinking any sale is good", "Not including loan interest in total cost", "Using optimistic yield estimate"]'::json,
  'Calculate your break-even price for last season. Compare it with the price you actually sold at.',
  'break_even',
  2,
  true
FROM lesson_categories lc WHERE lc.name = 'Profit & Cost'
ON CONFLICT DO NOTHING;

-- Loans category lesson
INSERT INTO lessons (
  id, category_id, title, title_hindi,
  key_points, example, simple_calculation, common_mistakes, try_this,
  related_calculator, order_index, is_active
)
SELECT
  uuid_generate_v4(),
  lc.id,
  'Moneylender vs Bank — The Real Difference',
  'साहूकार vs बैंक — असली अंतर',
  '["5% per month = 60% per year (12× more expensive)", "KCC bank rate: 4% per year only", "On ₹50,000 loan: Bank charges ₹2,000/year, Moneylender charges ₹30,000/year", "Always compare annual rates, not monthly", "KCC has no collateral requirement up to ₹1.6 lakh"]'::json,
  'Mohan took ₹50,000 from moneylender at 5%/month. After 1 year he paid ₹30,000 as interest! His neighbour took KCC at 4%/year and paid only ₹2,000 interest. Mohan could have saved ₹28,000.',
  'Annual Interest = Principal × (Rate/100). Monthly rate × 12 = Annual rate. Always convert to annual before comparing.',
  '["Comparing monthly vs annual rates directly", "Not reading loan agreement carefully", "Taking multiple loans without calculating total burden"]'::json,
  'Find out what interest rate your current loan charges. Convert to annual rate. Compare with KCC rate of 4%.',
  'loan_roi',
  1,
  true
FROM lesson_categories lc WHERE lc.name = 'Loans'
ON CONFLICT DO NOTHING;

-- Risk & Insurance lesson
INSERT INTO lessons (
  id, category_id, title, title_hindi,
  key_points, example, simple_calculation, common_mistakes, try_this,
  related_calculator, order_index, is_active
)
SELECT
  uuid_generate_v4(),
  lc.id,
  'Why Crop Insurance is Not Optional',
  'फसल बीमा क्यों जरूरी है',
  '["PMFBY premium: only 1.5-2% of sum insured", "Government pays the remaining 98% premium", "Protects against drought, flood, pest attacks", "One bad season without insurance = debt trap", "Apply before sowing deadline — cannot apply after"]'::json,
  'Geeta paid ₹1,500 as PMFBY premium for her 2-acre wheat crop (sum insured ₹1,00,000). That year, her crop failed due to unseasonal rain. She received ₹95,000 as claim. Without insurance, she would have lost everything and taken a moneylender loan.',
  'Premium amount = Sum Insured × 1.5%. If crop fails, claim = (Threshold Yield - Actual Yield) ÷ Threshold Yield × Sum Insured.',
  '["Skipping insurance thinking bad weather will not happen", "Missing the application deadline", "Not reading the claim process before applying"]'::json,
  'Calculate your PMFBY premium for your farm size. Visit pmfby.gov.in to find the sum insured for your crop and district.',
  NULL,
  1,
  true
FROM lesson_categories lc WHERE lc.name = 'Risk & Insurance'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: All 126 Lessons from the Farm Financial Empowerment Workbook
-- 8 Modules across 8 Lesson Categories
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: ensure all 8 categories exist (upsert by name to avoid duplicates)
INSERT INTO lesson_categories (id, name, name_hindi, icon, order_index, is_active)
VALUES
  (uuid_generate_v4(), 'Farm Profit & Cost Mastery',  'खेती लाभ और लागत',   '💰', 1, true),
  (uuid_generate_v4(), 'Cash Flow & Stability',        'नकदी प्रवाह',         '💸', 2, true),
  (uuid_generate_v4(), 'Loan & Credit Intelligence',   'कर्ज और क्रेडिट',     '🏦', 3, true),
  (uuid_generate_v4(), 'Risk & Insurance',             'जोखिम और बीमा',       '🛡️', 4, true),
  (uuid_generate_v4(), 'Market & MSP Intelligence',    'बाजार और MSP',        '📈', 5, true),
  (uuid_generate_v4(), 'Government Schemes',           'सरकारी योजनाएं',      '🏛️', 6, true),
  (uuid_generate_v4(), 'Institutional Support',        'संस्थागत सहायता',     '🤝', 7, true),
  (uuid_generate_v4(), 'Long-Term Wealth Planning',    'दीर्घकालिक धन योजना','🌱', 8, true)
ON CONFLICT DO NOTHING;

-- ─── MODULE 1: Farm Profit & Cost Mastery (Lessons 1–15) ─────────────────────

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Farm Profit & Cost Mastery' LIMIT 1;

  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES

  (uuid_generate_v4(), cat_id, 'Understanding Farm Profit', 'खेत का मुनाफा समझें',
   '["Revenue = Quantity × Price", "Profit = Revenue - Total Cost", "Profit per acre = Total Profit ÷ Acres", "Track every rupee of cost", "Compare season-to-season"]'::json,
   'Ramesh grew 20 quintals of wheat and sold at ₹2,015/quintal = ₹40,300. His total cost was ₹22,000. Profit = ₹18,300.',
   'Profit = Revenue - Cost. Revenue = Qty × Price.',
   '["Forgetting transport cost", "Not counting own labour", "Using expected not actual price"]'::json,
   'Write down last season''s actual income and all costs. Calculate real profit.', 'crop_profit', 1, true),

  (uuid_generate_v4(), cat_id, 'Identifying All Farm Costs', 'सभी लागतें पहचानें',
   '["Seeds, fertiliser, pesticide are direct costs", "Labour includes family labour (assign value)", "Irrigation, electricity, fuel are hidden costs", "Land lease and loan interest are fixed costs", "Transport to mandi is often forgotten"]'::json,
   'Geeta thought her cost was ₹18,000 but forgot ₹2,000 irrigation electricity and ₹1,500 transport. Real cost: ₹21,500.',
   'Total Cost = Seeds + Fertiliser + Labour + Irrigation + Transport + Loan Interest.',
   '["Ignoring own labour value", "Skipping electricity bills", "Not counting mandi charges"]'::json,
   'Make a list of every expense from last season. Are any missing from what you normally count?', 'crop_profit', 2, true),

  (uuid_generate_v4(), cat_id, 'Profit Per Acre Analysis', 'प्रति एकड़ मुनाफा',
   '["Profit per acre = Total Profit ÷ Total Acres", "Compare different crops on per-acre basis", "Higher yield is not always higher profit", "Input efficiency matters more than size", "Track per-acre trends over 3 seasons"]'::json,
   'Suresh: 2 acres wheat, profit ₹36,600 = ₹18,300/acre. Neighbour: 3 acres cotton, profit ₹51,000 = ₹17,000/acre. Wheat was more efficient per acre.',
   'Profit/Acre = Total Profit ÷ Acres. Compare crops using this number only.',
   '["Comparing total profit without adjusting for size", "Not tracking per-acre over multiple years"]'::json,
   'Calculate your profit per acre for last 2 seasons. Which was better?', 'crop_profit', 3, true),

  (uuid_generate_v4(), cat_id, 'Break-Even Price Calculation', 'ब्रेक-ईवन मूल्य',
   '["Break-even = Total Cost ÷ Expected Yield", "Below break-even you lose money on every quintal", "Always compare break-even with MSP before sowing", "Factor in loan interest in total cost", "Break-even tells minimum acceptable selling price"]'::json,
   'Mohan''s total cost: ₹24,000. Expected yield: 18 quintals. Break-even = ₹1,333/quintal. MSP is ₹2,015. He is safe.',
   'Break-even price = Total Cost ÷ Yield (quintals).',
   '["Using optimistic yield instead of realistic", "Not including loan interest", "Selling below break-even out of desperation"]'::json,
   'Calculate break-even for your main crop this season before spending more.', 'break_even', 4, true),

  (uuid_generate_v4(), cat_id, 'Profit Margin & Percentage', 'लाभ मार्जिन प्रतिशत',
   '["Profit Margin % = (Profit ÷ Revenue) × 100", "Below 15% margin means very thin profitability", "25%+ margin is healthy for farming", "Margin helps compare across different crop sizes", "Rising costs with flat prices squeeze margin every year"]'::json,
   'Revenue ₹40,300, Cost ₹22,000, Profit ₹18,300. Margin = 18,300/40,300 × 100 = 45%. Excellent season.',
   'Margin % = (Profit ÷ Revenue) × 100.',
   '["Confusing absolute profit with margin", "Ignoring that margin shrinks as input costs rise"]'::json,
   'Calculate your profit margin % for last season. Is it above 20%?', 'crop_profit', 5, true),

  (uuid_generate_v4(), cat_id, 'Comparing Crop Profitability', 'फसलों की तुलना करें',
   '["Compare crops using same land and same time period", "Include all costs including water rights", "Cotton looks profitable but needs more inputs", "Rice needs heavy water — add real irrigation cost", "Diversification reduces risk but requires planning"]'::json,
   'Wheat: ₹18,300/acre profit, low input. Rice: ₹22,000/acre profit but needs 5× more water. In water-scarce areas wheat wins.',
   'For fair comparison: Profit/acre after ALL crop-specific costs.',
   '["Comparing crops without adjusting for water and labour differences", "Looking only at market price not net profit"]'::json,
   'Compare 2 crops you could grow on your land. Which gives better per-acre profit after all costs?', 'crop_profit', 6, true),

  (uuid_generate_v4(), cat_id, 'Tracking Costs Season-to-Season', 'मौसम-दर-मौसम लागत ट्रैक करें',
   '["Keep a simple notebook with date, item, amount", "Cost of seeds and fertiliser rises ~7% each year", "Tracking shows where costs increased", "Data from 3+ seasons reveals patterns", "Mobile apps or diary work equally well"]'::json,
   'Priya tracked costs for 3 years. Found fertiliser cost rose ₹2,000 each year while price stayed flat. She switched to organic methods and saved ₹3,500.',
   'Simple cost tracker: Date | Item | Quantity | Price | Total.',
   '["Relying on memory instead of records", "Only tracking big expenses and forgetting small ones"]'::json,
   'Start a cost notebook today. Record every expense for one week.', 'crop_profit', 7, true),

  (uuid_generate_v4(), cat_id, 'Input Efficiency Optimisation', 'इनपुट दक्षता बढ़ाएं',
   '["Right dose of fertiliser saves 20-30% cost", "Drip irrigation cuts water cost by 50%", "Integrated Pest Management reduces pesticide by 40%", "Soil test before fertilising — spend smart not more", "Efficiency improvement = same output, less cost"]'::json,
   'Ajay soil-tested his 2-acre wheat. Was using ₹8,000 fertiliser. After test, used ₹5,200 targeted mix — same yield, ₹2,800 saved.',
   'Efficiency saving = Old cost - New cost after optimisation.',
   '["Applying fertiliser by habit not by soil need", "Skipping soil test to save ₹500 but wasting ₹3,000"]'::json,
   'Get your soil tested this season. Cost: ₹300. Potential saving: ₹2,000+.', 'crop_profit', 8, true),

  (uuid_generate_v4(), cat_id, 'Revenue Maximisation Strategies', 'आय बढ़ाने के तरीके',
   '["Sell at MSP — do not let traders buy below it", "Grade your produce — A grade gets 15-20% premium", "Dry produce properly — moisture reduces grade", "FPO collective selling gets better price", "Sell at peak price not at harvest rush"]'::json,
   'Vikram sold wheat same day as neighbours for ₹1,950. Stored for 3 weeks, sold at ₹2,150. Extra ₹4,000 on 20 quintals.',
   'Extra Revenue = (Better Price - Rushed Price) × Quantity.',
   '["Panic selling at harvest when price is lowest", "Not grading produce before selling"]'::json,
   'Find out the MSP for your crop. Is the local mandi paying at least MSP?', 'crop_profit', 9, true),

  (uuid_generate_v4(), cat_id, 'Hidden Costs Farmers Miss', 'छुपी हुई लागतें',
   '["Family labour has real value — count it", "Interest on own capital tied up in farm", "Depreciation of tools and equipment", "Cost of failed crops and replanting", "Health and travel costs for farm work"]'::json,
   'Sunita worked 60 days on her farm. At ₹350/day MGNREGA rate, her labour = ₹21,000. Not counting it made profit look ₹21,000 higher than real.',
   'True Profit = Revenue - Cash Costs - Imputed Labour Value.',
   '["Treating family labour as free", "Ignoring equipment wear and tear cost"]'::json,
   'How many days did you or your family work on the farm? Multiply by local daily wage. Add this to your costs.', 'crop_profit', 10, true),

  (uuid_generate_v4(), cat_id, 'Post-Harvest Loss Reduction', 'कटाई के बाद नुकसान कम करें',
   '["Post-harvest losses in India = 10-15% of produce", "Proper drying reduces spoilage by 60%", "Good storage bags prevent pest damage", "Sort and grade immediately after harvest", "Each 1% loss reduction = direct profit increase"]'::json,
   'Ravi lost 150 kg of wheat to moisture damage = ₹3,023 loss. New storage bags cost ₹800. Net saving ₹2,223.',
   'Loss Value = Lost Quantity (kg) × Price per kg.',
   '["Stacking wet grain", "Using torn bags from previous season", "Storing near walls with moisture"]'::json,
   'Check your storage bags and storage area. Is there moisture? Are bags sealed?', 'crop_profit', 11, true),

  (uuid_generate_v4(), cat_id, 'Seasonal Profit Planning', 'मौसमी लाभ योजना',
   '["Rabi (Oct-Mar) and Kharif (Jun-Oct) have different cost profiles", "Water costs peak in summer Kharif season", "Labour costs rise during peak sowing and harvest", "Plan cash needs 2 months before each season", "Buffer savings for bad weather years"]'::json,
   'Meera plans Kharif costs in April. Books labour early at ₹350/day. Those who wait pay ₹450 at peak harvest — saves ₹6,000.',
   'Season Cost Plan: Fixed costs + Variable inputs + Labour + Contingency 10%.',
   '["Last-minute input buying at peak price", "Not saving from good season for bad season"]'::json,
   'Make a cost plan for next season now. What will you need and when?', 'crop_profit', 12, true),

  (uuid_generate_v4(), cat_id, 'Profit vs Cash Flow Difference', 'मुनाफा बनाम नकदी प्रवाह',
   '["Profit is annual. Cash flow is monthly.", "You can show profit on paper but have no cash for June rent", "Timing of expenses and income creates cash gaps", "Identify your cash-tight months in advance", "Short-term credit for cash gaps is fine if planned"]'::json,
   'Dinesh made ₹40,000 profit in March harvest. By June all was spent. He had to take moneylender loan for next season inputs. Could have avoided it with cash planning.',
   'Monthly Cash Balance = Opening Balance + Income - Expenses.',
   '["Spending harvest money without saving for next input season", "Confusing one good harvest with being debt-free"]'::json,
   'Map out your months: when does income arrive? When are big expenses? Identify gaps.', 'crop_profit', 13, true),

  (uuid_generate_v4(), cat_id, 'Benchmarking Against Neighbours', 'पड़ोसियों से तुलना करें',
   '["Compare your cost per quintal with other farmers", "Join a farmer group for data sharing", "FPOs provide benchmarking data", "If your cost is 20% higher — find why", "Learn from best-performing farmers in village"]'::json,
   'Rajesh found his wheat cost ₹1,450/quintal. Village average: ₹1,200. Investigated and found he was over-irrigating by 3 extra waterings = ₹800 wasted.',
   'Your Cost/Quintal vs Village Average Cost/Quintal.',
   '["Pride preventing learning from neighbours", "Copying inputs without understanding why they work for others"]'::json,
   'Ask 2-3 farming neighbours what their cost per quintal was last season.', 'crop_profit', 14, true),

  (uuid_generate_v4(), cat_id, 'Annual Farm Financial Review', 'वार्षिक वित्तीय समीक्षा',
   '["Review full year profit after Rabi harvest", "Compare actual vs planned costs", "Identify which crop performed best", "Check if debt increased or decreased", "Set 3 financial goals for next year"]'::json,
   'Kamla does annual review every April. Found 3-year trend: cotton profit rising, wheat flat. Shifted 1 acre to cotton. Income increased ₹15,000.',
   'Annual Review: Total Revenue - Total Costs - Loan Payments = Net Farm Income.',
   '["Not doing formal year-end review", "Forgetting loan interest in annual calculation"]'::json,
   'Calculate your complete annual farm income and expense for last year. Write it down.', 'crop_profit', 15, true)

  ON CONFLICT DO NOTHING;
END $$;

-- ─── MODULE 2: Cash Flow & Stability (Lessons 16–29) ─────────────────────────

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Cash Flow & Stability' LIMIT 1;

  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES

  (uuid_generate_v4(), cat_id, 'What is Cash Flow?', 'नकदी प्रवाह क्या है?',
   '["Cash flow = money actually moving in and out", "Profit is annual — cash flow is monthly", "Positive cash flow = more in than out", "Negative cash flow = crisis even with good annual profit", "Track cash weekly in lean months"]'::json,
   'Prem had ₹40,000 annual profit. But in July, ₹0 income and ₹12,000 expenses. Negative cash flow forced him to borrow.',
   'Monthly Cash Flow = Income This Month - Expenses This Month.',
   '["Thinking annual profit means no monthly cash problem", "Not tracking small daily expenses"]'::json,
   'Write down every rupee coming in and going out this week.', NULL, 1, true),

  (uuid_generate_v4(), cat_id, 'Identifying Cash Flow Gaps', 'नकदी की कमी पहचानें',
   '["Farm income is seasonal — expenses are monthly", "June-September is typically cash-tight for Rabi farmers", "School fees, weddings, medical create unpredictable gaps", "Map each month: expected income vs expected expenses", "Gaps identified early can be planned for"]'::json,
   'Saroj mapped her year: ₹0 income June-September, but ₹8,000 monthly household expense + school fees in June. Gap = ₹40,000. She saved from March harvest to cover it.',
   'Cash Gap = Months with no harvest × Monthly Expenses.',
   '["Assuming income will somehow appear", "Not saving from harvest months for lean months"]'::json,
   'Draw a 12-month calendar. Mark harvest months green, lean months red. How many red months?', NULL, 2, true),

  (uuid_generate_v4(), cat_id, 'Building a 3-Month Emergency Buffer', 'आपातकालीन बफर बनाएं',
   '["3 months of expenses = minimum safety net", "Keeps moneylender away during lean months", "Store in Post Office savings or RD — not cash at home", "Start with ₹500/month if you cannot save more", "Emergency fund is insurance, not investment"]'::json,
   'Harish saved ₹1,000/month for 12 months = ₹12,000 buffer. When his pump broke in October, he paid from buffer instead of borrowing at 5%/month.',
   'Target = Monthly Expenses × 3. Monthly Saving Needed = Gap ÷ Months Available.',
   '["Treating emergency fund as spending money", "Keeping it in cash at home (easy to spend)"]'::json,
   'Calculate your 3-month expense target. How much can you save monthly toward it?', 'emergency_fund', 3, true),

  (uuid_generate_v4(), cat_id, 'Managing Harvest Season Money', 'कटाई के मौसम में पैसे संभालें',
   '["Harvest creates one-time large income — plan before it arrives", "Allocate: Next season inputs, debt repayment, emergency fund, household", "Pay off highest-interest debt first", "Avoid large purchases during harvest excitement", "Write a budget before money arrives"]'::json,
   'Deepa received ₹80,000 from wheat. Pre-planned: ₹25,000 next inputs, ₹20,000 KCC repayment, ₹10,000 emergency fund, ₹25,000 household. Zero moneylender needed.',
   'Harvest Allocation: Inputs + Debt Repayment + Emergency Buffer + Household.',
   '["Impulse purchases right after harvest", "Paying social obligations before debt repayment"]'::json,
   'Before next harvest, write down exactly how you will allocate the money.', NULL, 4, true),

  (uuid_generate_v4(), cat_id, 'Income Diversification Basics', 'आय विविधीकरण की बुनियाद',
   '["One crop = one income = one risk", "Small animal husbandry provides monthly income", "Kitchen garden reduces household food expenses", "Seasonal labour on others'' farms during gaps", "Skill-based income: repair, driving, teaching"]'::json,
   'Lalita farms wheat. Added 2 cows: ₹4,000/month milk income. Now lean months (June-Sept) are covered without borrowing.',
   'Monthly Diversified Income = Milk + Eggs + Labour + Other.',
   '["Starting too many diversifications at once", "Not calculating actual profit from each source"]'::json,
   'List 2 income sources you could add alongside your main crop. Which is easiest to start?', NULL, 5, true),

  (uuid_generate_v4(), cat_id, 'SHG and Farmer Group Savings', 'SHG और किसान समूह बचत',
   '["SHG (Self Help Group) pools savings for group loans", "Typical saving: ₹100-500/month", "Internal group loans at 2% vs moneylender at 5%/month", "Social accountability improves saving discipline", "NABARD and banks link SHGs for formal credit"]'::json,
   'Meena joined SHG, saves ₹200/month. After 12 months, borrowed ₹8,000 at 2%/month for inputs — saved ₹3,200 vs moneylender.',
   'SHG loan interest = Principal × 2% × Months. Compare vs moneylender at 5%/month.',
   '["Missing monthly meetings (lose trust and loan access)", "Borrowing more than repayment capacity"]'::json,
   'Is there an SHG in your village? Ask about joining or how to start one.', NULL, 6, true),

  (uuid_generate_v4(), cat_id, 'Reducing Household Expenditure', 'घरेलू खर्च कम करें',
   '["Household leakage is often the biggest cash drain", "Mobile recharge, tobacco, eating out add up to ₹2,000+/month", "Bulk buying of staples saves 10-15%", "Reducing wedding/function debt is high priority", "Social pressure spending is the hardest to control"]'::json,
   'Rattan tracked household spending for 1 month. Found ₹1,800 on unnecessary items. Reduced to ₹600. ₹1,200/month saved = ₹14,400/year extra.',
   'Monthly Saving = Current Expenses - Essential Expenses.',
   '["Tracking income but not household expenses", "Social spending driven by pressure not capacity"]'::json,
   'Track every household rupee for 7 days. What can you cut by 20%?', NULL, 7, true),

  (uuid_generate_v4(), cat_id, 'Post Office Savings Schemes', 'डाकघर बचत योजनाएं',
   '["Post Office Recurring Deposit: start from ₹100/month", "Post Office FD: 6.9-7.5% interest, safer than bank", "NSC (National Savings Certificate): 7.7% guaranteed", "Sukanya Samriddhi for daughters: 8.2% — highest safe rate", "All PO schemes are government guaranteed — zero risk"]'::json,
   'Anita opened ₹500/month Post Office RD. After 5 years: deposited ₹30,000, received ₹35,450 (6.7% interest). Bank FD would give ₹33,200.',
   'RD Maturity = Principal + Interest at applicable rate for tenure.',
   '["Keeping savings in cash at home where it gets spent", "Not knowing post office offers better rates than banks"]'::json,
   'Visit nearest post office. Ask about RD and monthly deposit requirement.', NULL, 8, true),

  (uuid_generate_v4(), cat_id, 'Avoiding Debt Traps', 'कर्ज के जाल से बचें',
   '["Debt trap = interest exceeds income", "5% per month moneylender doubles debt in 14 months", "Multiple simultaneous loans create unmanageable burden", "Borrowing for consumption (weddings, TV) — most dangerous", "Rule: Never borrow for non-income-generating purpose at high interest"]'::json,
   'Shankar took ₹50,000 moneylender at 5%/month. After 14 months owed ₹1,00,000. Farm income ₹1,20,000/year. Debt consumed 83% of income.',
   'Months to double debt = 14 months at 5%/month compound.',
   '["Borrowing to repay another loan", "Not calculating total interest before accepting loan"]'::json,
   'List all your current debts. Calculate total monthly interest. What % of income is it?', NULL, 9, true),

  (uuid_generate_v4(), cat_id, 'Budgeting for Irregular Income', 'अनियमित आय का बजट',
   '["Divide annual income by 12 for monthly budget", "Separate accounts for farm and household", "Pay yourself a fixed ''salary'' from harvest", "Remaining in farm account for next season inputs", "This prevents overspending in good months"]'::json,
   'Kavita earns ₹1,80,000/year from 2 harvests. Divides by 12 = ₹15,000 monthly budget. Transfers ₹15,000 to household account monthly from farm account.',
   'Monthly Budget = Annual Farm Income ÷ 12.',
   '["Spending freely after harvest, then suffering in lean months", "No separation between farm and household money"]'::json,
   'Calculate your annual income ÷ 12. That is your monthly budget ceiling.', NULL, 10, true),

  (uuid_generate_v4(), cat_id, 'Government Transfer Benefits', 'सरकारी हस्तांतरण लाभ',
   '["PM-Kisan: ₹6,000/year automatic to bank — check you are enrolled", "State government bonuses vary by crop and year", "Disaster compensation schemes — apply within deadline", "These are not charity — you paid taxes, claim what is yours", "Missing deadlines means losing money permanently"]'::json,
   'Bhanu did not apply for drought compensation in 2022. Neighbours received ₹8,500. She missed deadline and lost it. Now she tracks all scheme deadlines.',
   'Annual transfer income = PM-Kisan + State bonuses + Compensation claimed.',
   '["Not checking bank statement for PM-Kisan credit", "Missing disaster compensation deadline"]'::json,
   'Check your PM-Kisan registration at pmkisan.gov.in right now.', NULL, 11, true),

  (uuid_generate_v4(), cat_id, 'Stabilising Income Through Contracts', 'कॉन्ट्रैक्ट से आय स्थिर करें',
   '["Contract farming: sell at fixed price before sowing", "Removes price risk at harvest", "Food companies: Pepsi potato, ITC wheat, Sugarcane mills", "Price may be below peak but above crash price", "Read contract carefully — penalties for shortfall"]'::json,
   'Sukhdev signed contract with sugar mill at ₹340/quintal sugarcane. Market crashed to ₹290 that year. He was protected — earned ₹50 more per quintal.',
   'Contract advantage = Contract Price - Market Price (if market falls).',
   '["Signing contract without reading terms", "Over-committing acreage and unable to deliver"]'::json,
   'Are there any contract farming opportunities in your area? Ask at district agriculture office.', NULL, 12, true),

  (uuid_generate_v4(), cat_id, 'Managing Medical Emergency Costs', 'चिकित्सा आपातकाल का खर्च',
   '["Medical emergencies are top cause of farmer debt", "Ayushman Bharat covers ₹5 lakh hospitalisation — free", "Jan Arogya card from CSC centre — free", "State government health schemes often additional", "Keep health card and family ID ready at home"]'::json,
   'Kishan''s wife needed surgery. Cost ₹45,000. His Ayushman Bharat card paid ₹42,000. He paid only ₹3,000 instead of borrowing ₹45,000.',
   'Max protection = Ayushman Bharat (₹5L) + State scheme + Emergency Fund.',
   '["Not knowing Ayushman Bharat eligibility", "Taking moneylender loan before checking government health coverage"]'::json,
   'Do you have an Ayushman Bharat card? Check eligibility at pmjay.gov.in.', NULL, 13, true),

  (uuid_generate_v4(), cat_id, 'Saving Specifically for Children''s Education', 'बच्चों की शिक्षा के लिए बचत',
   '["Education cost doubles every 7 years", "Class 12 to engineering/medical = ₹5-15 lakh", "Sukanya Samriddhi (daughters): 8.2% — start now", "Post Office RD for specific goal: simple and safe", "₹1,000/month for 10 years = ₹1.7 lakh at 7%"]'::json,
   'Rama started ₹800/month Sukanya for daughter born 2015. By age 21 (2036) = estimated ₹5.2 lakh for education. Started early = huge benefit.',
   'Future value (approx) = Monthly saving × months × (1 + rate/12)^months.',
   '["Waiting until child is teenager to start saving", "Borrowing at high interest for education when early saving could have covered it"]'::json,
   'How old is your youngest child? Calculate how much to save monthly for their education.', NULL, 14, true)

  ON CONFLICT DO NOTHING;
END $$;

-- ─── MODULE 3: Loan & Credit Intelligence (Lessons 30–45) ────────────────────

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Loan & Credit Intelligence' LIMIT 1;

  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES

  (uuid_generate_v4(), cat_id, 'Types of Agricultural Loans', 'कृषि ऋण के प्रकार',
   '["KCC (Kisan Credit Card): short-term, 4% rate", "Term loan: for equipment, land development", "Gold loan: fast but uses family jewellery", "Cooperative credit: low rate through society", "NBFC loans: fast approval but higher cost"]'::json,
   'Comparison: KCC at 4%/yr = ₹2,000 on ₹50,000. Gold loan at 12%/yr = ₹6,000. Moneylender at 5%/month = ₹30,000. KCC is 15× cheaper than moneylender.',
   'Annual interest = Principal × Rate% ÷ 100.',
   '["Taking gold loan without checking KCC eligibility", "Mixing short-term and long-term loans"]'::json,
   'Do you have a KCC? If not, visit your nearest bank and ask about eligibility.', 'loan_roi', 1, true),

  (uuid_generate_v4(), cat_id, 'Understanding Interest Rates', 'ब्याज दरें समझें',
   '["Always convert to annual rate for comparison", "Monthly 5% = Annual 60% (NOT 5%)", "Flat rate vs reducing balance — big difference", "APR (Annual Percentage Rate) includes all fees", "Banks must disclose APR by RBI rule — ask for it"]'::json,
   'NBFC advertised 2%/month ''flat''. On ₹50,000 for 12 months: Total interest = ₹12,000. Effective annual rate = 43% — not 24% as advertised.',
   'Annual Rate = Monthly Rate × 12. Effective rate considers reducing balance.',
   '["Accepting monthly rate without converting to annual", "Not reading loan agreement APR"]'::json,
   'Find your current loan''s annual interest rate. Convert any monthly rate to annual for true comparison.', 'loan_roi', 2, true),

  (uuid_generate_v4(), cat_id, 'KCC — Kisan Credit Card Deep Dive', 'KCC की पूरी जानकारी',
   '["KCC limit based on landholding × crop value", "Revolving credit — repay after harvest, draw again", "Interest subvention: effective rate = 4% if repaid on time", "Available at: SBI, PNB, cooperative banks", "Documents: land records, Aadhaar, passport photo"]'::json,
   'Ramnath has 2 acres wheat. KCC limit = ₹1,60,000. Draws ₹60,000 for inputs. Repays at harvest. Annual interest at 4% = ₹2,400. Vs ₹36,000 at moneylender.',
   'KCC interest = Amount drawn × 4% × (days used ÷ 365).',
   '["Not repaying on time (rate jumps to 7%+)", "Drawing more than needed and paying unnecessary interest"]'::json,
   'Visit your bank or CSC centre. Ask: Am I eligible for KCC? What documents to bring?', 'loan_roi', 3, true),

  (uuid_generate_v4(), cat_id, 'EMI Calculation and Safety', 'EMI गणना और सुरक्षा',
   '["EMI = fixed monthly payment covering interest + principal", "EMI should not exceed 30% of monthly income", "Longer tenure = lower EMI but higher total interest", "Prepayment reduces total interest significantly", "Miss one EMI = penalty + credit score damage"]'::json,
   'Harpal: ₹1,00,000 loan at 9%/yr for 24 months. EMI = ₹4,568/month. Monthly income ₹18,000. EMI ratio = 25%. Safe.',
   'EMI = P × r × (1+r)^n / ((1+r)^n - 1). Where r = monthly rate, n = months.',
   '["Taking loan without calculating if EMI fits income", "Choosing long tenure thinking it is cheaper (it is not)"]'::json,
   'Use the EMI calculator in the app with your current or planned loan details.', 'emi_safety', 4, true),

  (uuid_generate_v4(), cat_id, 'Loan Documentation Requirements', 'ऋण दस्तावेज जरूरतें',
   '["Aadhaar + PAN mandatory for all loans above ₹50,000", "Land records (Khasra/Khatauni) for agricultural loans", "6-month bank statement shows repayment capacity", "Existing loan NOC if taking new loan from another bank", "Keep all documents in plastic folder — ready to go"]'::json,
   'Gita spent 3 trips to bank over 2 weeks because documents were missing each time. Now she keeps a ''loan folder'' with all documents photocopied and ready.',
   'Loan folder checklist: Aadhaar, PAN, land records, bank passbook, 2 photos, income proof.',
   '["Going to bank without complete documents", "Land records not in applicant''s name — get updated"]'::json,
   'Prepare your ''loan folder'' today. List what is missing.', NULL, 5, true),

  (uuid_generate_v4(), cat_id, 'Credit Score and Its Importance', 'क्रेडिट स्कोर और उसकी अहमियत',
   '["CIBIL score 750+ = best loan terms", "Missed payments reduce score — hard to recover", "Check your free CIBIL score at cibil.com", "Multiple loan applications reduce score temporarily", "Rural farmers often have zero score — start building"]'::json,
   'Balveer had no CIBIL score. Bank refused loan. He opened FD-backed credit card, used it for small purchases, paid full amount monthly. After 12 months: score 720.',
   'Good score = Lower interest rate = Save ₹10,000-50,000 over loan tenure.',
   '["Closing old credit accounts (hurts score)", "Multiple simultaneous loan applications"]'::json,
   'Check your CIBIL score free at cibil.com/freecreditscore', NULL, 6, true),

  (uuid_generate_v4(), cat_id, 'Recognising Predatory Lending', 'शोषणकारी ऋण पहचानें',
   '["Rate above 2% per month = predatory", "No written agreement = trap", "Threatening behaviour for repayment = illegal", "Land as collateral to moneylender = dangerous", "Debt bondage (farming for lender instead of paying) = crime"]'::json,
   'Champa borrowed ₹30,000 against land document. Moneylender charged 10% per month. In 12 months owed ₹93,832. Could not repay. Lost 0.5 acre. She did not know her rights.',
   'Red flags: No paperwork + Rate above 2%/month + Land as collateral.',
   '["Signing blank papers for lender", "Not getting written receipt for cash payments made"]'::json,
   'Know your rights: moneylender must be registered with state govt. Report illegal lending to district collector.', NULL, 7, true),

  (uuid_generate_v4(), cat_id, 'Cooperative Credit Societies', 'सहकारी ऋण समितियां',
   '["PACS (Primary Agricultural Credit Society) in most villages", "Rates: 6-9% vs bank 10-14% vs moneylender 60%+", "Membership typically ₹100-500 one-time", "Crop loans, input credit, equipment hire available", "Voice in society decisions as member"]'::json,
   'Devraj joined PACS for ₹200. Gets fertiliser credit at cost price (saves ₹1,500), seasonal loan at 8% (saves ₹4,000 vs bank). Total saving ₹5,500/year.',
   'PACS benefit = (Commercial price - PACS price) × quantity + interest saving.',
   '["Not knowing PACS exists in their village", "Irregular repayment causing credit limit reduction"]'::json,
   'Is there a PACS in your village? Ask any older farmer or at panchayat office.', NULL, 8, true),

  (uuid_generate_v4(), cat_id, 'Debt Restructuring Options', 'ऋण पुनर्गठन के विकल्प',
   '["Banks can restructure if you ask formally before default", "NPA (Non-Performing Asset) status = negative for you", "RBI guidelines: banks must offer restructuring for crop failure", "One-time settlement (OTS) for distressed loans", "Debt Relief Scheme varies by state — check annually"]'::json,
   'Sukhbir had ₹2,00,000 NPL loan after 2 bad harvests. Bank offered OTS: pay ₹1,20,000 total, waive rest. He took it and is debt-free.',
   'OTS saving = Original Dues - Settlement Amount.',
   '["Defaulting without talking to bank first", "Not knowing RBI restructuring guidelines exist"]'::json,
   'If you have a stuck loan, visit the bank manager and ask: "Can I get restructuring under RBI guidelines?"', NULL, 9, true),

  (uuid_generate_v4(), cat_id, 'Using Gold Loans Wisely', 'सोने के कर्ज का सही उपयोग',
   '["Gold loan: fastest disbursement — same day", "Rate: 9-18%/year vs moneylender 60%+", "LTV: banks lend 75% of gold value", "Risk: default = bank auctions family gold", "Use only for productive purpose with repayment plan"]'::json,
   'Phool needed ₹25,000 urgently for medical. Gold loan from Muthoot: 12% annual = ₹3,000 for 1 year. Vs moneylender ₹15,000 for same period.',
   'Gold loan interest = Loan × Rate%/100 × (months/12).',
   '["Using gold loan for consumption without repayment plan", "Multiple gold loans from different sources"]'::json,
   'Do you have family gold? Know its approximate value at current rate × 75% = maximum gold loan available.', NULL, 10, true),

  (uuid_generate_v4(), cat_id, 'Loan Against FD and Insurance', 'FD और बीमा पर कर्ज',
   '["FD loan: 1% above FD rate — cheapest formal loan available", "Life insurance loan: 90% of surrender value, low rate", "No credit check required for these", "FD continues earning interest during loan period", "Useful for short-term cash gap without breaking savings"]'::json,
   'Bhupinder had ₹50,000 FD at 6.5%. Took loan against it at 7.5%. Paid 1% net. Vs breaking FD and losing ₹4,000 premature penalty.',
   'FD loan cost = FD interest earned - Loan interest paid (net cost very low).',
   '["Breaking FD early instead of taking loan against it", "Not knowing life insurance surrender value loan option"]'::json,
   'Do you have any FD or life insurance policy? Ask the bank/insurer about loan facility.', NULL, 11, true),

  (uuid_generate_v4(), cat_id, 'NABARD Schemes for Farmers', 'किसानों के लिए NABARD योजनाएं',
   '["NABARD funds rural cooperative banks and RRBs", "Kisan Credit Card scheme administered through NABARD", "NABARD SHG-Bank Linkage: supports women farmer groups", "Warehouse Receipt Finance: store crop, get loan against it", "RIDF (Rural Infrastructure Development Fund) — state level"]'::json,
   'Through NABARD''s SHG-bank linkage, Seema''s group of 15 women got ₹2,00,000 collectively at 12% from cooperative bank. Each borrowed ₹13,000 — no collateral needed.',
   'Group loan limit ≈ 4× savings corpus after 6 months of banking.',
   '["Not knowing NABARD-linked cooperative bank exists locally", "SHG not maintaining proper accounts (disqualifies for bank linkage)"]'::json,
   'Find the nearest NABARD-linked Regional Rural Bank or Cooperative Bank in your district.', NULL, 12, true),

  (uuid_generate_v4(), cat_id, 'Priority Sector Lending Rights', 'प्राथमिकता क्षेत्र ऋण अधिकार',
   '["Banks MUST give 18% of total lending to agriculture by RBI rule", "If bank refuses agriculture loan — escalate to RBI Banking Ombudsman", "Interest subvention scheme: effective rate = 4% for crop loans up to ₹3L", "Kisan helpline: 1800-180-1551 (free)", "Right to appeal bank rejection within 30 days"]'::json,
   'Vijender''s loan was rejected without reason. He filed complaint with Banking Ombudsman. Bank approved loan within 3 weeks.',
   'Your right: Banks cannot refuse agricultural loan without written reason.',
   '["Accepting rejection without asking for written reason", "Not knowing Banking Ombudsman is free to use"]'::json,
   'Know the Banking Ombudsman number: 14448. Save it in your phone.', NULL, 13, true),

  (uuid_generate_v4(), cat_id, 'Loan Repayment Strategies', 'ऋण चुकाने की रणनीति',
   '["Avalanche method: pay highest interest first (cheapest)", "Snowball method: pay smallest loan first (motivation)", "For farmers: pay moneylender first — highest rate", "Prepayment reduces total interest — do it when possible", "Never miss a bank EMI — penalty and CIBIL damage"]'::json,
   'Ramkali had: ₹20,000 moneylender at 60%/yr, ₹50,000 bank at 9%. Avalanche: used harvest to clear moneylender first. Saved ₹12,000 annual interest.',
   'Interest saving from clearing moneylender first = Cleared amount × (60% - 9%) = 51% annually.',
   '["Paying minimum everywhere instead of clearing one fully", "Ignoring moneylender loan while paying EMI on bank loan"]'::json,
   'List all your loans with interest rate. Which is highest rate? That is your first repayment target.', NULL, 14, true),

  (uuid_generate_v4(), cat_id, 'Avoiding Loan Guarantor Traps', 'गारंटर के जाल से बचें',
   '["Guarantor is legally liable if borrower defaults", "Bank can recover from guarantor''s property", "Guarantor''s CIBIL also affected by borrower''s default", "Only guarantee loans you can pay if borrower fails", "Get written assurance from borrower before guaranteeing"]'::json,
   'Harbhajan guaranteed cousin''s ₹1,50,000 loan. Cousin migrated and stopped paying. Bank recovered from Harbhajan''s fixed deposit. He lost his savings.',
   'Guarantor risk = Full loan amount if borrower defaults.',
   '["Guaranteeing for social pressure without thinking", "Not tracking loan status of borrower after guaranteeing"]'::json,
   'Are you a guarantor for any loan? Check the status with the bank immediately.', NULL, 15, true),

  (uuid_generate_v4(), cat_id, 'Loan Insurance and Protection', 'ऋण बीमा और सुरक्षा',
   '["Pradhan Mantri Jeevan Jyoti Bima: ₹330/year, ₹2L life cover", "Loan insurance: if you die, loan is paid — family not burdened", "PMSBY: ₹20/year, ₹2L accidental insurance", "These are the cheapest insurance available anywhere", "Bank may auto-enrol — check if you are covered"]'::json,
   'Mangal paid ₹350/year for PMJJBY. He died in accident. Family received ₹2,00,000 — cleared entire farm loan. Family kept the land.',
   'Total annual cost: PMJJBY ₹330 + PMSBY ₹20 = ₹350/year for ₹4L cover.',
   '["Not knowing these schemes exist", "Not nominating family member properly"]'::json,
   'Ask your bank: Am I enrolled in PMJJBY and PMSBY? If not, enrol today for ₹350/year.', NULL, 16, true)

  ON CONFLICT DO NOTHING;
END $$;

-- ─── MODULE 4: Risk & Insurance (Lessons 46–59) ──────────────────────────────

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Risk & Insurance' LIMIT 1;

  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES

  (uuid_generate_v4(), cat_id, 'Types of Farm Risk', 'खेती के जोखिम के प्रकार',
   '["Production risk: weather, pest, disease", "Price risk: market crash at harvest", "Financial risk: debt burden, interest rate change", "Human risk: illness, death, accident", "Institutional risk: policy change, input supply"]'::json,
   'Tara''s 2022 analysis: drought risk (40%), price crash risk (25%), illness risk (20%), other (15%). She bought PMFBY + PMJJBY to cover top 2 risks.',
   'Risk priority = Probability × Impact. Cover highest priority risks first.',
   '["Thinking insurance is only for weather risk", "Not planning for multiple simultaneous risks"]'::json,
   'List 3 risks that worry you most. How can each be reduced or insured?', NULL, 1, true),

  (uuid_generate_v4(), cat_id, 'PMFBY Crop Insurance in Detail', 'PMFBY फसल बीमा विस्तार से',
   '["Premium: 1.5% Rabi, 2% Kharif — farmer pays this only", "Government pays remaining 85-98% premium", "Sum insured = district average yield × MSP", "Claim triggered: area approach (district) or individual (survey)", "Apply before notified cut-off date — no late applications accepted"]'::json,
   'Geeta''s 2-acre wheat: sum insured ₹1,00,000. Premium = ₹1,500. That year drought hit. She received ₹87,500 claim. ROI = 5,733%. No investment beats this.',
   'Premium = Sum Insured × Crop Rate%. Claim = (Threshold Yield - Actual Yield) / Threshold Yield × Sum Insured.',
   '["Missing application deadline", "Not verifying bank has applied for KCC holders", "Not filing individual complaint within 72 hours of localised damage"]'::json,
   'What is the PMFBY premium rate for your crop and district? Check at pmfby.gov.in.', NULL, 2, true),

  (uuid_generate_v4(), cat_id, 'PMFBY Claim Filing Process', 'PMFBY दावा दाखिल करना',
   '["Notify insurer within 72 hours of localised loss", "For widespread (area) loss — automatic based on crop cutting experiments", "Documents: claim form, Aadhaar, bank account, loss photo/video", "Village level agriculture officer must certify loss", "Dispute: escalate to district agriculture officer"]'::json,
   'Sharda noticed her wheat had hailstorm damage. Called helpline 14447 within 72 hours. Filed individual complaint. Received ₹35,000 survey-based claim.',
   'Claim timeline: Notification within 72 hrs → Survey within 10 days → Payment within 30 days.',
   '["Not notifying within 72 hours for localised loss", "Not keeping farm photos as evidence"]'::json,
   'Save PMFBY helpline 14447 in your phone now. Report all farm damage within 72 hours.', NULL, 3, true),

  (uuid_generate_v4(), cat_id, 'Weather-Based Crop Insurance', 'मौसम आधारित फसल बीमा',
   '["WBCIS: payout based on weather station data, not crop inspection", "Faster payout than traditional PMFBY", "Rainfall index: payout if below threshold mm", "Temperature index: covers cold/heat stress", "Available for: tomato, potato, chilli, mango in pilot areas"]'::json,
   'Ramesh grew mango. Enrolled in WBCIS. That year unseasonal rainfall exceeded threshold. Received automatic ₹18,000 payout within 15 days — no survey needed.',
   'WBCIS payout = (Actual weather shortfall / Required weather) × Sum Insured.',
   '["Not knowing WBCIS exists for horticulture", "Distance from weather station affects payout accuracy"]'::json,
   'Ask at district agriculture office if WBCIS is available for your crop.', NULL, 4, true),

  (uuid_generate_v4(), cat_id, 'Life Insurance for Farmers', 'किसानों के लिए जीवन बीमा',
   '["PMJJBY: ₹330/year, ₹2L term life cover — cheapest available", "LIC Jeevan Shanti: pension product for long-term", "Term insurance online: ₹1Cr cover for ₹7,000/year at age 30", "Farm loan must be paid if you die — insure it", "Nominee must know policy exists and where documents are"]'::json,
   'Dhan paid ₹330/year PMJJBY. His widow received ₹2,00,000. Paid off entire ₹1,40,000 outstanding KCC. Kept the land. Children''s education continued.',
   'Minimum life cover needed = All outstanding loans + 2 years household expenses.',
   '["Under-insuring (only partial loan covered)", "Nominee not knowing policy exists"]'::json,
   'Calculate: Outstanding loans + 2 years expenses = minimum life cover you need.', NULL, 5, true),

  (uuid_generate_v4(), cat_id, 'Accidental Insurance Options', 'दुर्घटना बीमा के विकल्प',
   '["PMSBY: ₹20/year, ₹2L accidental cover — auto-debit from bank", "Farmer accident insurance in some states: additional cover", "Partial disability covered in PMSBY after amendment", "Auto-renewal annually from bank account", "Claim within 30 days of accident"]'::json,
   'Surjit lost his right hand in thresher. PMSBY paid ₹1,00,000 for partial permanent disability. Allowed family to survive while he could not work.',
   'Total accidental cover = PMSBY ₹2L + State scheme + any other policy.',
   '["Not knowing PMSBY covers disability not just death", "Lapsed policy due to insufficient bank balance on debit date"]'::json,
   'Check your bank statement: Is ₹20 being deducted annually for PMSBY? If not, enrol today.', NULL, 6, true),

  (uuid_generate_v4(), cat_id, 'Animal Husbandry Insurance', 'पशुपालन बीमा',
   '["Cattle insurance: ₹100-200/year per animal", "Covers death, permanent disability", "Required documents: animal tag number, current photo, value certificate", "NABARD and state govts subsidise premium", "Buffalo insured value: market price certified by vet"]'::json,
   'Rani insured 2 buffaloes at ₹180 total annual premium. One died of disease. She received ₹28,000 market value. Premium investment: ₹180. Return: ₹28,000.',
   'Expected value = (Claim probability × Animal value) - Annual Premium.',
   '["Not tagging animals before insurance (makes claim invalid)", "Not renewing annually"]'::json,
   'Visit nearest Krishi Vigyan Kendra or livestock office for cattle insurance rates in your area.', NULL, 7, true),

  (uuid_generate_v4(), cat_id, 'Diversification as Risk Management', 'जोखिम प्रबंधन के रूप में विविधीकरण',
   '["Never put all land in one crop", "2-crop model: 60% main crop + 40% alternate", "Different harvest seasons = income throughout year", "Vegetables or horticulture: higher value per acre but more risk", "Animal + crop combination smooths monthly income"]'::json,
   'Nirmala: 2 acres wheat, 1 acre vegetables. Wheat failed 2021. Vegetables earned ₹40,000 that year — kept family stable.',
   'Risk reduction = If crop A fails and crop B succeeds, combined loss < 100%.',
   '["Growing same crop year after year (soil depletion + price risk)", "Diversifying without knowledge of new crop requirements"]'::json,
   'What is one crop you could grow on 25% of your land alongside your main crop?', NULL, 8, true),

  (uuid_generate_v4(), cat_id, 'Water Risk and Irrigation Planning', 'पानी का जोखिम और सिंचाई योजना',
   '["Water scarcity is #1 production risk in most of India", "Drip irrigation reduces water use 50%, cost 40%", "PM Krishi Sinchai Yojana: 55% subsidy on micro-irrigation", "Rainwater harvesting: free source if farm pond built", "Groundwater depletion — plan for reducing water-intensive crops"]'::json,
   'Kailash installed drip irrigation at ₹35,000 (after 55% subsidy = ₹15,750 actual cost). Water cost dropped ₹8,000/year. Break-even in 2 years.',
   'Drip system payback = Investment ÷ Annual Water Cost Saving.',
   '["Continuing flood irrigation when drip is subsidised", "Not applying for PM Krishi Sinchai Yojana subsidy"]'::json,
   'Apply for PM Krishi Sinchai Yojana at your district agriculture office. 55% subsidy on drip/sprinkler.', NULL, 9, true),

  (uuid_generate_v4(), cat_id, 'Pest and Disease Risk Reduction', 'कीट और रोग जोखिम',
   '["IPM (Integrated Pest Management) reduces pesticide cost 40%", "Early warning apps: Plantix, mKRISHI for disease detection", "Resistant varieties reduce risk significantly", "Farmer Field Schools teach IPM — free, ask KVK", "Pesticide cost is often money wasted — correct identification first"]'::json,
   'Asha spent ₹4,500 on pesticide spraying without diagnosis. KVK visit showed wrong pest — she sprayed for caterpillar but had fungal disease. ₹4,500 wasted.',
   'Real saving = Correct identification first → Right pesticide → Minimum quantity.',
   '["Spraying pesticide on neighbour''s advice without checking", "Buying expensive branded pesticide when generic works same"]'::json,
   'Download the Plantix app. It identifies crop disease from photo — free.', NULL, 10, true),

  (uuid_generate_v4(), cat_id, 'Climate Risk Adaptation', 'जलवायु जोखिम अनुकूलन',
   '["Rainfall patterns shifting — adjust sowing dates by 2-3 weeks", "Heat-tolerant varieties now available for wheat, rice", "Kharif crops face higher drought risk in current climate", "Cover crops protect soil during fallow season", "ICAR releases climate-adapted varieties — check with KVK"]'::json,
   'Bhajan shifted wheat sowing 15 days later based on IMD forecast. Other farmers who sowed early faced October heat stress. His yield 18 quintals vs their 13 quintals.',
   'Climate adaptation: Seed selection + Timing adjustment = Risk reduction without cost.',
   '["Using same sowing calendar as 20 years ago", "Not tracking actual rainfall vs historical average"]'::json,
   'Check sowing advisories from your state agriculture department or mKRISHI app before next season.', NULL, 11, true),

  (uuid_generate_v4(), cat_id, 'Social Risk: Debt and Mental Health', 'सामाजिक जोखिम: कर्ज और मानसिक स्वास्थ्य',
   '["Farm debt is top driver of farmer stress", "Interest compounding silently increases burden", "Talk to bank, KVK, or district office before crisis", "Kisan helpline 1800-180-1551 — free counselling", "Debt restructuring is legal right — ask for it"]'::json,
   'Sukhpal was overwhelmed by ₹3L moneylender debt. Called Kisan helpline. Was directed to NABARD-linked NGO who negotiated settlement. Debt reduced to ₹1.8L with payment plan.',
   'Debt stress: Act early, before default. Options narrow after default.',
   '["Hiding debt from family until crisis", "Not knowing helplines exist for free advice"]'::json,
   'Save Kisan helpline 1800-180-1551 in your phone. It is free.', NULL, 12, true),

  (uuid_generate_v4(), cat_id, 'Building Financial Resilience', 'वित्तीय लचीलापन बनाएं',
   '["Resilience = ability to absorb shocks without crisis", "3 layers: insurance + emergency fund + diversified income", "Even one bad season should not end in moneylender debt", "Each year add one resilience layer", "Target: after 3 years, one bad harvest = inconvenience not disaster"]'::json,
   'Before 2019: Parveen had no insurance, no savings. One drought = ₹80,000 moneylender debt. After 2022: PMFBY + ₹15,000 emergency fund + dairy income. Same drought = managed without borrowing.',
   'Resilience score: Insurance ✓ + Emergency fund ✓ + Diverse income ✓ = Fully resilient.',
   '["Building only one layer of resilience thinking it is enough", "Withdrawing emergency fund for non-emergency"]'::json,
   'Score yourself: Do you have insurance? Emergency fund? Diversified income? Plan to add the missing one.', NULL, 13, true),

  (uuid_generate_v4(), cat_id, 'Record Keeping for Risk Management', 'जोखिम प्रबंधन के लिए रिकॉर्ड रखें',
   '["Records prove loss for insurance claim", "Crop photos before and after loss", "Input purchase receipts prove investment", "Bank statements show income pattern for credit applications", "3-year records build credibility with any lender or insurer"]'::json,
   'Jagdish kept crop photos and input receipts. When hailstorm damaged crop, insurance surveyor saw evidence. Received ₹42,000 vs neighbour with no records who got ₹18,000 for same damage.',
   'Documentation value = Difference in claim outcome with vs without evidence.',
   '["Throwing away purchase bills", "Taking no photos before damage occurs (not useful after)"]'::json,
   'Take photos of your standing crop today. Store on phone or WhatsApp. Do it every season.', NULL, 14, true)

  ON CONFLICT DO NOTHING;
END $$;

-- ─── MODULES 5-8: Abbreviated seeds (remaining lessons) ──────────────────────
-- Full content for Modules 5-8, 10 key lessons each

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Market & MSP Intelligence' LIMIT 1;
  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES
  (uuid_generate_v4(), cat_id, 'What is MSP and Why it Matters', 'MSP क्या है और क्यों जरूरी है', '["MSP = Minimum Support Price set by central government", "Government procures at MSP — you have the right to sell at this price", "MSP announced before sowing season", "23 crops have MSP: wheat, rice, pulses, oilseeds", "If mandi price < MSP, sell to government procurement centre (PAC/FCI)"]'::json, 'Wheat MSP 2024: ₹2,275/quintal. Mandi price dropped to ₹2,050. Harjinder sold to FCI at ₹2,275. Earned extra ₹2,250 on 10 quintals.', 'Extra income = (MSP - Market Price) × Quintals sold to government.', '["Not knowing where government procurement centre is", "Selling to trader before checking if MSP procurement is open"]'::json, 'Find your nearest FCI/PACS procurement centre. Save the contact number.', NULL, 1, true),
  (uuid_generate_v4(), cat_id, 'Mandi Price Tracking', 'मंडी भाव ट्रैक करें', '["Check prices before harvesting — not after", "e-NAM portal: daily prices for 1000+ mandis", "State government agricultural marketing websites", "WhatsApp farmer groups share daily prices", "Compare 2-3 mandis — prices vary significantly"]'::json, 'Santosh checked e-NAM before selling wheat. Nearest mandi: ₹2,100. Next district: ₹2,250. Transport cost: ₹80/quintal. Net better price: ₹70/quintal × 25 quintals = ₹1,750 extra.', 'Net benefit = (Better mandi price - Worse mandi price) - Extra transport cost.', '["Selling at first offer without checking alternatives", "Not factoring transport cost in price comparison"]'::json, 'Download e-NAM app or check enam.gov.in for prices at nearby mandis.', NULL, 2, true),
  (uuid_generate_v4(), cat_id, 'Grading and Quality Premium', 'ग्रेडिंग और गुणवत्ता प्रीमियम', '["Grade A produce gets 10-20% price premium", "Proper drying: moisture below 14% for wheat", "Sorting removes damaged/discoloured grains", "Cleaning and bagging properly commands better price", "FPO collective grading achieves consistent quality for bulk buyers"]'::json, 'Rekha sorted and dried wheat properly. Grade A certification. Sold at ₹2,400 vs neighbours'' ₹2,100. Extra ₹300/quintal × 15 quintals = ₹4,500 premium.', 'Quality premium = (Grade A price - Grade B price) × Total quantity.', '["Rushing to sell without drying below 14% moisture", "Mixing different quality grades"]'::json, 'Check moisture meter at nearest PACS or KVK — free service.', NULL, 3, true),
  (uuid_generate_v4(), cat_id, 'Futures and Forward Contracts', 'वायदा और फॉरवर्ड कॉन्ट्रैक्ट', '["Forward contract: fix sale price today for future delivery", "Removes price uncertainty at harvest time", "NCDEX (commodity exchange) for formal futures", "Local trader forward contracts: less formal but practical", "Suitable if you need certainty over maximising price"]'::json, 'Bhola forward-sold 10 quintals wheat at ₹2,200 in February for April delivery. Price crashed to ₹1,900 in April. He delivered at ₹2,200. Protected.', 'Forward contract benefit = (Forward price - Spot price at delivery) × Quantity — if price falls.', '["Forward contracting 100% of crop (no upside if price rises)", "Not understanding delivery obligations"]'::json, 'Research whether any commodity forward contracts exist for your main crop.', NULL, 4, true),
  (uuid_generate_v4(), cat_id, 'Collective Selling through FPO', 'FPO के माध्यम से सामूहिक बिक्री', '["FPO (Farmer Producer Organisation): collective bargaining", "100+ farmers together get bulk buyer prices", "PM-FPO scheme: government support for formation", "FPO members get better input prices AND better output prices", "Negotiating power: 1 farmer vs corporate = weak. 200 farmers = strong"]'::json, 'Sushma''s FPO: 150 farmers, 300 acres wheat. Negotiated directly with flour mill at ₹2,350/quintal vs mandi ₹2,100. Collective saving: ₹75,000 total.', 'FPO advantage = (FPO price - Individual price) × Total collective volume.', '["Not forming or joining FPO thinking it is too complex", "Poor coordination leading to missed delivery commitments"]'::json, 'Find nearest FPO through state agriculture department or sfacindia.com', NULL, 5, true),
  (uuid_generate_v4(), cat_id, 'Storage Decision Making', 'भंडारण का निर्णय', '["Store if price expected to rise more than storage cost", "Warehouse receipt: store and get loan against it", "CWC (Central Warehouse Corporation) reliable storage", "Calculate break-even holding period before deciding", "Price typically rises 3-8% in 3 months after harvest"]'::json, 'Neelam stored 20 quintals wheat at ₹120/month warehouse cost. After 2 months price rose ₹180/quintal. Revenue gain ₹3,600 - storage cost ₹240 = ₹3,360 net gain.', 'Storage profit = (Future price - Current price) × Qty - Storage cost.', '["Storing when you have urgent loan repayment need", "Storing in unprotected home storage with insect damage"]'::json, 'Use the Storage Decision Calculator in Tools to evaluate your decision.', 'storage', 6, true),
  (uuid_generate_v4(), cat_id, 'Understanding Commodity Price Cycles', 'कमोडिटी मूल्य चक्र समझें', '["Farm commodity prices follow supply-demand cycles", "Large crop nationally = low price that year", "2 consecutive good years often followed by price crash", "Diversify crops to avoid all-eggs-in-one-basket", "Government intervention (MSP, import duty) creates price floor"]'::json, 'Tomato price: May ₹8/kg, August (harvest) ₹2/kg, November ₹25/kg. Farmers who stored lost to spoilage. Contract pre-sell at ₹10/kg in May for August delivery was best.', 'Price cycle: sow when prices high, harvest when prices low = natural cycle.', '["All farmers growing same crop = collective price crash at harvest", "Not tracking national sowing data from agriculture ministry"]'::json, 'Check agmarknet.gov.in for historical price trends for your crop.', NULL, 7, true),
  (uuid_generate_v4(), cat_id, 'Export and Premium Market Opportunities', 'निर्यात और प्रीमियम बाजार', '["Organic certification: 30-50% premium in export market", "APEDA registers exporters — FPO can apply", "Basmati rice, turmeric, spices: strong export demand", "State agriculture export policy: check for your crop", "First step: get soil health card showing chemical-free"]'::json, 'Amrik''s 20-farmer group got organic certification. Turmeric sold at ₹120/kg vs domestic ₹65/kg. Extra ₹55/kg × 2,000 kg = ₹1,10,000 collective premium.', 'Export premium = (Export price - Domestic price) × Quantity.', '["Organic certification not worth it for single small farmer — needs group", "Not knowing APEDA supports registration"]'::json, 'Check apeda.gov.in for export opportunities for your crop/state.', NULL, 8, true),
  (uuid_generate_v4(), cat_id, 'Digital Payment and Banking for Sales', 'बिक्री के लिए डिजिटल भुगतान', '["Mandi cash payment risk: theft, counting errors", "RTGS/NEFT same day transfer for large amounts", "UPI for immediate smaller payments", "Keep payment receipt for income tax records", "Bank account in own name — not father/brother"]'::json, 'Ranjit received ₹1,80,000 mandi payment. Chose NEFT to his account instead of cash. Zero theft risk, instant record, no counting errors.', 'Risk of cash = Transport theft + Counting error + No proof of income.', '["Accepting cash for large transactions when bank transfer available", "Not keeping payment receipts"]'::json, 'Request NEFT/RTGS payment from mandi for your next sale above ₹10,000.', NULL, 9, true),
  (uuid_generate_v4(), cat_id, 'Market Intelligence Sources', 'बाजार सूचना स्रोत', '["e-NAM: real-time mandi prices", "AGMARKNET: historical price data", "State agriculture department SMS service", "Doordarshan Kisan: free TV channel, market prices daily", "WhatsApp farmer groups: local intelligence"]'::json, 'Gurmeet subscribed to state agriculture SMS service. Got wheat price alert when price peaked ₹2,350 in his district. Sold same week. Neighbours waited and got ₹2,050.', 'Information advantage = Sell at better time due to price data.', '["Relying on trader''s price information (conflict of interest)", "Not using free government price services"]'::json, 'Subscribe to your state agriculture department SMS price service today. Ask at agriculture office.', NULL, 10, true)
  ON CONFLICT DO NOTHING;
END $$;

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Government Schemes' LIMIT 1;
  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES
  (uuid_generate_v4(), cat_id, 'PM-Kisan — Complete Guide', 'PM-Kisan — पूरी जानकारी', '["₹6,000/year in 3 installments of ₹2,000 each", "Check status at pmkisan.gov.in", "Update Aadhaar-bank link if installment missing", "Register through village Patwari or CSC", "Income tax payers and government servants not eligible"]'::json, 'Manju registered for PM-Kisan in 2021. Received ₹24,000 over 4 years — directly in bank, no middleman, no cost to her.', 'Annual benefit: ₹6,000 automatically if enrolled.', '["Not registering assuming someone else will do it", "Aadhaar not linked to bank account causing payment failure"]'::json, 'Check your PM-Kisan status at pmkisan.gov.in → Beneficiary Status.', NULL, 1, true),
  (uuid_generate_v4(), cat_id, 'PMFBY — Enrollment Process', 'PMFBY — नामांकन प्रक्रिया', '["Enrol before notified cut-off date — state-specific", "KCC holders: auto-enrolled, verify with bank", "Non-KCC: apply at bank, CSC, or pmfby.gov.in", "Documents: Aadhaar, bank passbook, land records, sowing certificate", "Premium deducted from bank account or pay cash at CSC"]'::json, 'Balwant missed PMFBY enrollment for 5 years. That year hailstorm destroyed his crop. ₹0 insurance. Neighbours with PMFBY received ₹45,000-80,000.', 'Annual loss without insurance vs ₹1,500 premium cost.', '["Missing deadline every year", "Not checking if bank enrolled you for PMFBY with KCC"]'::json, 'Find your district''s PMFBY enrollment deadline at pmfby.gov.in.', NULL, 2, true),
  (uuid_generate_v4(), cat_id, 'KCC Application Walkthrough', 'KCC आवेदन की प्रक्रिया', '["Visit any nationalised bank or cooperative bank", "Carry: Aadhaar, PAN, land records, passport photo", "Application processed in 15 days by law", "Limit: based on landholding and crop", "Interest rate: 4% effective with timely repayment"]'::json, 'Darshan applied KCC at SBI with 3 acres land records. Got ₹2,40,000 limit in 12 days. Uses ₹80,000 each season, repays at harvest. Annual interest: ₹3,200.', 'KCC limit ≈ (Crop cost per acre × Acres) + 10% margin.', '["Going to bank without complete documents", "Not repaying on time (rate penalty)"]'::json, 'Visit nearest bank with your land records. Ask: How much KCC limit am I eligible for?', 'loan_roi', 3, true),
  (uuid_generate_v4(), cat_id, 'Soil Health Card Scheme', 'मृदा स्वास्थ्य कार्ड योजना', '["Free soil test every 2 years at government lab", "Card shows exact NPK and micronutrient status", "Reduces fertiliser overuse by 20-30%", "Apply at: Krishi Vigyan Kendra or agriculture department", "Saves ₹1,000-3,000 on fertiliser per acre per year"]'::json, 'Renu got soil health card. Lab showed her soil had excess phosphorus — she was wasting ₹1,200 on phosphate fertiliser. Stopped that application. Yield unchanged. Saved ₹1,200.', 'Fertiliser saving = Over-applied fertiliser cost ÷ (based on soil test result).', '["Not applying for soil health card thinking it is complicated", "Ignoring soil health card recommendations"]'::json, 'Register for soil health card at soilhealth.dac.gov.in or nearest KVK.', NULL, 4, true),
  (uuid_generate_v4(), cat_id, 'PMKSY — Irrigation Subsidy', 'PMKSY — सिंचाई सब्सिडी', '["55% subsidy on drip and sprinkler irrigation", "Remaining 45% can be financed by bank loan", "Application through state horticulture/agriculture department", "Annual budget limited — apply early in year", "Micro-irrigation fund: ₹5,000 crore allocated nationally"]'::json, 'Govind installed drip at ₹40,000 total. Subsidy: ₹22,000. His cost: ₹18,000. Water saving: ₹9,000/year. Payback in 2 years.', 'Net cost after subsidy = System cost × 45%. Break-even = Net cost ÷ Annual savings.', '["Not applying thinking subsidy is for big farmers only", "Not applying in Q1 of financial year when budget available"]'::json, 'Apply for PMKSY at pmksy.gov.in or district agriculture department.', NULL, 5, true),
  (uuid_generate_v4(), cat_id, 'PM-Kisan Maandhan Yojana (Pension)', 'PM-Kisan मानधन योजना', '["₹3,000/month pension from age 60", "Entry age: 18-40 years only", "Monthly contribution: ₹55-200 depending on age", "Government contributes equal amount", "Enrol at CSC centre with Aadhaar and bank account"]'::json, 'Nanak enrolled at age 25. Monthly contribution: ₹55. Government adds ₹55. At 60 receives ₹3,000/month pension for life.', 'Total monthly cost: ₹55 (your contribution). Government matches it. Return: ₹3,000/month for life after 60.', '["Not enrolling before age 40 (permanently ineligible after that)", "Stopping contributions midway (loses all contributions)"]'::json, 'Enrol at nearest CSC. Bring Aadhaar and bank passbook. Cost: ₹55/month if age 25.', NULL, 6, true),
  (uuid_generate_v4(), cat_id, 'Ayushman Bharat — Health Coverage', 'आयुष्मान भारत — स्वास्थ्य कवच', '["₹5 lakh health cover per family per year — free", "Covers hospitalisation at empanelled government and private hospitals", "No premium — fully government funded", "Eligible: bottom 40% families by SECC-2011 data", "Get card at CSC with Aadhaar, PM letter, or family ID"]'::json, 'Shyamala''s husband needed cardiac surgery: ₹1,20,000. Ayushman Bharat paid full ₹1,20,000. Zero out-of-pocket. Saved from taking moneylender loan.', 'Protection value: up to ₹5,00,000 per family per year = prevents medical debt.', '["Not knowing eligibility or how to get card", "Going to non-empanelled hospital (not covered)"]'::json, 'Check eligibility at pmjay.gov.in/is-my-family-eligible. Get card at nearest CSC.', NULL, 7, true),
  (uuid_generate_v4(), cat_id, 'SMAM — Equipment Subsidy', 'SMAM — कृषि यंत्र सब्सिडी', '["50-80% subsidy on farm machinery for small/marginal farmers", "SC/ST farmers get highest subsidy", "Apply at: agrimachinery.nic.in or district agriculture office", "Annual quota — first come first served", "FPO applications get preference for larger equipment"]'::json, 'Manjit applied for power tiller under SMAM. Market price: ₹1,40,000. Subsidy 50%: ₹70,000. His cost: ₹70,000. Saved 4 labourers at ₹500/day × 20 days = ₹10,000/year.', 'Net machine cost = Market price × (1 - subsidy%). Break-even = Net cost ÷ Annual labour saving.', '["Missing annual application window (quota filled early)", "Applying alone vs through FPO (FPO gets priority)"]'::json, 'Check agrimachinery.nic.in for available equipment and subsidy rates in your state.', NULL, 8, true),
  (uuid_generate_v4(), cat_id, 'e-NAM Digital Market Platform', 'e-NAM डिजिटल बाजार', '["e-NAM = Electronic National Agriculture Market", "Sell directly to buyers across India — 1000+ mandis", "Better price discovery — competitive bidding", "FPO registration gets priority access", "Documents: FPO membership or individual trader licence"]'::json, 'Tejinder''s FPO listed wheat on e-NAM. Got bidders from 3 states. Final price: ₹2,320/quintal vs local mandi ₹2,090. Extra ₹230/quintal × 200 quintals = ₹46,000.', 'e-NAM premium = (e-NAM price - Local mandi price) × Quantity.', '["Not registering assuming it is complicated", "Listing poor quality produce (leads to low bids and reputation damage)"]'::json, 'Visit enam.gov.in. Check if your crop and mandi are on the platform.', NULL, 9, true),
  (uuid_generate_v4(), cat_id, 'Pradhan Mantri Awas Yojana Gramin', 'प्रधानमंत्री आवास योजना (ग्रामीण)', '["₹1,20,000-1,30,000 housing assistance (state varies)", "For: BPL and lower income rural households", "Eligibility: SECC-2011 list or state-specific", "Additional: ₹12,000 for toilet (Swachh Bharat)", "Construction must complete in time or grant cancelled"]'::json, 'Chameli received PMAY-G ₹1,20,000. Built 2-room pucca house instead of borrowing ₹2,00,000 at high interest for construction.', 'Saving = Alternative loan amount × Interest rate × Years = Thousands saved.', '["Not applying claiming land dispute (can apply with alternative land proof)", "Starting construction and stopping (non-completion penalty)"]'::json, 'Check PMAY-G eligibility at rhreporting.nic.in or gram panchayat.', NULL, 10, true)
  ON CONFLICT DO NOTHING;
END $$;

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Institutional Support' LIMIT 1;
  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES
  (uuid_generate_v4(), cat_id, 'Role of KVK (Krishi Vigyan Kendra)', 'KVK की भूमिका', '["One KVK per district — free services for farmers", "Free soil testing, crop disease diagnosis", "Demonstration farms to try new varieties risk-free", "Training programmes: modern farming, value addition", "Mobile advisory service in some KVKs"]'::json, 'Paramjit visited KVK for his diseased wheat. Expert identified army worm, gave correct pesticide advice. Saved ₹6,000 vs random spraying he was about to do.', 'KVK saving = Avoided wrong pesticide cost + Correct solution at minimal cost.', '["Not knowing KVK is free", "Going after problem has spread (go early)"]'::json, 'Find your district KVK at icar.org.in/kvk. Save the phone number.', NULL, 1, true),
  (uuid_generate_v4(), cat_id, 'FPO Formation and Benefits', 'FPO गठन और लाभ', '["FPO = Farmer Producer Organisation (collective)", "Register at state agriculture department", "Government equity grant: ₹15 lakh after 5 years", "Collective buying: inputs at wholesale", "Collective selling: negotiate like a large enterprise"]'::json, 'Hardev helped form 80-farmer FPO. First year: saved ₹1,500/farmer on seeds + sold produce at ₹180/quintal above individual price. Each farmer benefit: ₹4,500.', 'Annual FPO member benefit = Input saving + Better output price × production.', '["Not forming FPO thinking it requires big farmer", "Poor governance leading to FPO failure"]'::json, 'Find PM-FPO scheme details at enam.gov.in/web/about/fpo', NULL, 2, true),
  (uuid_generate_v4(), cat_id, 'Banking Ombudsman for Farmers', 'किसानों के लिए बैंकिंग लोकपाल', '["Free escalation when bank treats you unfairly", "Covers: loan rejection, excessive charges, account issues", "File complaint at RBI Banking Ombudsman: 14448", "Resolution typically within 30-45 days", "Bank must give written reason for agricultural loan rejection"]'::json, 'Jaspal''s KCC application rejected without reason. Banking Ombudsman complaint filed online. Bank approved KCC in 18 days with written apology.', 'Your right: Get written rejection reason within 30 days.', '["Accepting bank rejection silently", "Not knowing Ombudsman is completely free"]'::json, 'Save Banking Ombudsman helpline 14448. Use it if bank is unresponsive.', NULL, 3, true),
  (uuid_generate_v4(), cat_id, 'Legal Aid for Farmers', 'किसानों के लिए कानूनी सहायता', '["Free legal aid at District Legal Services Authority (DLSA)", "For: land disputes, moneylender harassment, water rights", "Tollfree: 15100 (National Legal Services Authority)", "Village-level Lok Adalat for quick dispute resolution", "Agriculture tribunal for tenancy and contract disputes"]'::json, 'Surinder had land dispute with cousin. DLSA provided free lawyer. Dispute resolved in 6 months at Lok Adalat. Court would have taken 10 years and ₹1,00,000+ in fees.', 'Free legal aid saves: Lawyer fees + Court costs + Years of stress.', '["Not knowing free legal services exist", "Settling land disputes informally under pressure (can be reversed)"]'::json, 'Find nearest DLSA at nalsa.gov.in or call 15100.', NULL, 4, true),
  (uuid_generate_v4(), cat_id, 'MGNREGA for Farm Income Supplement', 'खेती की आय पूरक के लिए मनरेगा', '["100 days guaranteed employment at notified wage", "Farm-related work: farm ponds, soil conservation", "Payment directly to bank account within 15 days", "Job card from gram panchayat — free", "Can do farm pond on own land under MGNREGA"]'::json, 'Kamini worked 80 MGNREGA days in lean months at ₹338/day = ₹27,040. Plus farm pond built on her land (₹1,20,000 value). Dual benefit.', 'Annual MGNREGA income = Days worked × Daily wage rate.', '["Not knowing farm-related work (ponds, trenches) is allowed on own land", "Not getting job card from panchayat"]'::json, 'Get MGNREGA job card from gram panchayat. Free. Takes 15 days.', NULL, 5, true),
  (uuid_generate_v4(), cat_id, 'Digital Literacy for Farmers', 'किसानों के लिए डिजिटल साक्षरता', '["Smartphone use for: price checking, scheme applications, weather", "e-governance: Aadhaar update, PM-Kisan status, PMFBY", "Trusted apps: PM Kisan, mKRISHI, Plantix, UMANG, eNAM", "CSC (Common Service Centre): helps with digital tasks if you cannot do alone", "Digital literacy = access to schemes, markets, information simultaneously"]'::json, 'Bimla learned smartphone basics at PM-Kisan digital literacy camp. Now checks PM-Kisan installments, mandi prices, and weather forecast daily. Saved ₹8,000 in one season from better decisions.', 'Digital literacy return = Better price + Avoided scheme loss + Right time decisions.', '["Relying only on others for digital access (creates dependency)", "Trusting unofficial apps and websites"]'::json, 'Learn to use UMANG app — gives access to 1200+ government services.', NULL, 6, true),
  (uuid_generate_v4(), cat_id, 'Cooperative Movement and Benefits', 'सहकारी आंदोलन और लाभ', '["India''s cooperative movement: 300,000+ village cooperatives", "IFFCO fertiliser cooperative: 36 million farmer members", "Cooperative dairy (Amul model): village-level milk collection", "Cooperative sugar mills: profit sharing with cane growers", "Membership cost: ₹100-1,000 one time. Benefits: ongoing"]'::json, 'Rameshwari joined dairy cooperative. Provides 5L milk daily at ₹28/L = ₹4,200/month. Stable income. Cooperative handles transport, quality, marketing.', 'Monthly cooperative income = Daily production × Cooperative procurement price.', '["Not joining cooperative thinking meetings are waste of time", "Withdrawing membership before receiving first dividend"]'::json, 'Find nearest cooperative society through state cooperative department.', NULL, 7, true),
  (uuid_generate_v4(), cat_id, 'Agricultural Insurance Ombudsman', 'कृषि बीमा लोकपाल', '["File complaint if insurer delays or rejects valid PMFBY claim", "State government appoints agricultural insurance ombudsman", "Timeline: insurer must resolve within 30 days of complaint", "Free to file — no fee, no lawyer needed", "Contact: district agriculture office for referral"]'::json, 'Hukam''s PMFBY claim was rejected despite valid crop loss. Ombudsman complaint filed. Insurer paid ₹58,000 in 25 days to avoid ombudsman order.', 'Ombudsman power: Force payment + penalise insurer for delay.', '["Accepting rejection without escalating", "Not knowing ombudsman is free to use"]'::json, 'If PMFBY claim is delayed or rejected, contact district agriculture office immediately.', NULL, 8, true),
  (uuid_generate_v4(), cat_id, 'Commodity Exchanges and Hedging', 'कमोडिटी एक्सचेंज और हेजिंग', '["NCDEX (National Commodity Derivative Exchange) for agricultural commodities", "Futures contract: hedge price risk before sowing", "Not speculation — risk management tool", "FPO of 200+ farmers can participate cost-effectively", "Separate from trading — only for price protection"]'::json, 'Chandan''s FPO of 300 farmers hedged 500 MT wheat on NCDEX at ₹2,200. Harvest price: ₹1,900. FPO members protected at ₹2,200 — ₹3,00,000 collective saving.', 'Hedge benefit = (Futures price - Spot price at harvest) × Quantity hedged.', '["Treating futures as investment/speculation instead of insurance", "Individual farmers (not FPO) trying to use — too small for practical hedging"]'::json, 'Learn more about commodity price hedging at ncdex.com', NULL, 9, true),
  (uuid_generate_v4(), cat_id, 'Building Relationships with Bank Officials', 'बैंक अधिकारियों से संबंध बनाएं', '["Personal relationship = faster loan processing", "Maintain account with regular transactions", "Always repay on time — even small amounts", "Introduce yourself at bank — don''t be anonymous", "Join farmer group linked to bank for priority access"]'::json, 'Pawan maintained SB account with monthly transactions at Bank of Baroda for 3 years. When he applied for ₹3L farm loan, branch manager processed in 7 days (norm: 21 days).', 'Relationship value = Faster processing + Flexibility when repayment delay needed.', '["Visiting bank only for problems, never for relationship building", "Depositing only minimum, creating no account activity"]'::json, 'Visit your bank branch this week even if you have no transaction. Introduce yourself to the manager.', NULL, 10, true)
  ON CONFLICT DO NOTHING;
END $$;

DO $$ DECLARE cat_id UUID; BEGIN
  SELECT id INTO cat_id FROM lesson_categories WHERE name = 'Long-Term Wealth Planning' LIMIT 1;
  INSERT INTO lessons (id, category_id, title, title_hindi, key_points, example, simple_calculation, common_mistakes, try_this, related_calculator, order_index, is_active) VALUES
  (uuid_generate_v4(), cat_id, 'Building Net Worth Systematically', 'व्यवस्थित रूप से संपत्ति बनाएं', '["Net worth = Assets - Liabilities", "Assets: land, equipment, gold, savings, FD, livestock", "Liabilities: all outstanding loans", "Track net worth annually — is it growing?", "Target: net worth doubles every 7-10 years"]'::json, 'Shivkaran''s 2022: Assets ₹8,00,000, Loans ₹2,50,000. Net worth: ₹5,50,000. 2024: Assets ₹9,20,000, Loans ₹1,80,000. Net worth: ₹7,40,000. Growing.', 'Net Worth = Total Assets Value - Total Loan Outstanding.', '["Only counting land as asset, ignoring savings and livestock", "Not tracking year-on-year change"]'::json, 'Calculate your net worth: list all assets with value + list all loans. Assets - Loans = Net worth.', NULL, 1, true),
  (uuid_generate_v4(), cat_id, 'Land Investment and Records', 'भूमि निवेश और रिकॉर्ड', '["Land is your most valuable asset — protect records", "Update mutation (dakhil-kharij) after every purchase or inheritance", "Demarcation survey prevents boundary disputes", "Check annual land record at tehsil — unauthorized entries happen", "Never let others use land without written agreement"]'::json, 'Gurnam''s father''s land was encroached 0.25 acres over 15 years due to no annual record check. Legal recovery cost ₹35,000 and 4 years. Prevention: ₹0.', 'Annual check: Visit tehsil, check your khasra/khatauni record. Free.', '["Not updating mutation after purchase or inheritance", "Allowing occupancy without written agreement"]'::json, 'Check your land record at your state''s Bhulekh portal. Free, online.', NULL, 2, true),
  (uuid_generate_v4(), cat_id, 'Gold as Financial Safety Net', 'सुरक्षा के रूप में सोना', '["Gold holds value during inflation — reliable store of value", "Do not buy more gold for investment than 10-15% of assets", "Gold ETF/Sovereign Gold Bond — earns 2.5% interest too", "Physical gold: safety risk, no income", "Use gold for emergencies not as primary investment"]'::json, 'Malkit bought 20gm Sovereign Gold Bond at ₹5,500/gm = ₹1,10,000. After 8 years: gold price ₹9,200/gm + 2.5% annual interest = ₹2,40,000 total return.', 'SGB return = (Current gold price - Purchase price) × grams + 2.5%/year interest.', '["Buying physical gold with all savings (zero income generation)", "Not knowing Sovereign Gold Bond earns interest unlike physical gold"]'::json, 'Learn about Sovereign Gold Bond at rbi.org.in — better than physical gold for investment purpose.', NULL, 3, true),
  (uuid_generate_v4(), cat_id, 'Retirement Planning for Farmers', 'किसानों की सेवानिवृत्ति योजना', '["PMKMY: ₹3,000/month pension at 60 — enrol before 40", "NPS (National Pension System): flexible, market-linked", "Post Office MIS: ₹9,250/month income on ₹15L deposit", "Land lease income after retirement: steady annual income", "Plan: by age 55, have assets generating ₹10,000+/month"]'::json, 'Kartar enrolled PMKMY at 35 (₹72/month contribution) + started Post Office RD ₹1,000/month. At 60: PMKMY ₹3,000/month + PO maturity income ₹8,000/month. Total ₹11,000/month secured.', 'Monthly retirement income = PMKMY + FD interest + Land lease + Other passive income.', '["Not planning until 55-60 when options are limited", "Assuming children will support (not reliable)"]'::json, 'Calculate: How much monthly income do you need at age 60? What will your sources be?', NULL, 4, true),
  (uuid_generate_v4(), cat_id, 'Children''s Future: Education & Career Planning', 'बच्चों का भविष्य: शिक्षा और करियर', '["Higher education: ₹5-20L needed, plan early", "Sukanya Samriddhi: highest safe rate (8.2%) for daughters", "PPF account: long-term tax-free savings for education", "Agricultural education: ICAR institutions, state agriculture universities", "Agri-entrepreneur: value addition, FPO leadership, agri-tech"]'::json, 'Jasvir started ₹2,000/month PPF for son born 2015. At 18 years: ₹7.2L contributed, estimated maturity ₹12L+ at 7.1% compound. Engineering college covered.', 'PPF 15-year maturity ≈ Contributions × 2.4× (approximate at 7.1%).', '["Not starting education fund until child is 15 (too late for meaningful accumulation)", "Borrowing at high interest for education when planned saving could have covered"]'::json, 'Open PPF or Sukanya account at post office this week. Minimum ₹500/year to keep account active.', NULL, 5, true),
  (uuid_generate_v4(), cat_id, 'Tax Planning for Farmers', 'किसानों के लिए कर योजना', '["Agricultural income is fully exempt from income tax in India", "Income from allied activities (dairy, poultry) partially exempt", "Non-farm income (labour, business): standard deductions apply", "File ITR even if no tax — builds credit history", "Agricultural income certificate from tehsil supports other applications"]'::json, 'Nachhatar earns ₹2,80,000 farm + ₹60,000 transport income. Farm income: zero tax. Transport ₹60,000: taxable but after standard deduction = zero tax. Files ITR anyway for credit score.', 'Tax on farming income = Zero (Section 10(1) IT Act).', '["Not filing ITR because thinking farmers don''t need to", "Not knowing ITR filing builds CIBIL score"]'::json, 'File ITR next year even with zero tax. It builds your financial credibility.', NULL, 6, true),
  (uuid_generate_v4(), cat_id, 'Value Addition and Agri-Processing', 'मूल्य संवर्धन और कृषि प्रसंस्करण', '["Value addition: process commodity into product = 3-10× value", "Wheat → atta (flour): value doubles. Tomato → puree: 5× value", "PMKVY and PMEGP provide training and capital for processing", "FPO can set up collective processing unit — shared cost", "Start small: manual grader, dryer, basic packaging"]'::json, 'Leela''s SHG set up chilli grinding unit. Buys chilli at ₹40/kg, grinds and packages, sells at ₹120/kg. 3× value multiplication on ₹50,000/month throughput.', 'Value addition return = (Processed price - Raw price - Processing cost) × Volume.', '["Starting large expensive unit before testing market", "Not calculating processing cost accurately before scaling"]'::json, 'What is one product from your farm that you could process or grade before selling?', NULL, 7, true),
  (uuid_generate_v4(), cat_id, 'Digital Financial Services for Farmers', 'किसानों के लिए डिजिटल वित्तीय सेवाएं', '["UPI for instant transfer — no cash handling risk", "Mobile banking for scheme status check", "Google Pay/PhonePe: payment proof, digital record", "Jan Dhan account: zero balance, free ATM, insurance", "BHIM UPI works without internet in USSD mode (*99#)"]'::json, 'Sukhdev sends ₹5,000 monthly to wife''s account via UPI — instant, recorded, free. Vs earlier: ₹150 money order + 2-day delay + no proof.', 'Digital payment saving = Physical transfer cost × Transactions per year.', '["Avoiding digital payments due to fear of fraud (use only official apps)", "Not registering for Jan Dhan account (free, has insurance benefit)"]'::json, 'Register for Jan Dhan account at any bank if you don''t have one. Zero balance, free insurance.', NULL, 8, true),
  (uuid_generate_v4(), cat_id, 'Estate Planning and Will Making', 'संपत्ति योजना और वसीयत', '["Will prevents family disputes after death", "Registered will: ₹200-500 at sub-registrar, legally strongest", "Without will: Hindu Succession Act governs — wife may get less than expected", "Nominate family members in all bank accounts and policies", "Land mutation after death requires death certificate + succession certificate"]'::json, 'Amar died without will. 3 sons, wife all disputed 10 acres. Court case 7 years. Legal fees ₹2,00,000. Land unused during dispute. Registered will would have taken 1 day, ₹500.', 'Will cost: ₹500. Dispute cost: ₹2,00,000+ and years.', '["Thinking will is only for rich people", "Not updating nominees in bank accounts after marriage or children born"]'::json, 'Update nominees in all your bank accounts, FD, insurance this week. Free at bank.', NULL, 9, true),
  (uuid_generate_v4(), cat_id, 'Creating a 10-Year Financial Roadmap', '10 साल की वित्तीय रोडमैप बनाएं', '["Year 1-2: Emergency fund complete, all insurance in place", "Year 3-4: Clear high-interest debt completely", "Year 5-6: Invest in productivity (drip, equipment, new crop)", "Year 7-8: Diversify income (value addition or allied)", "Year 9-10: Retirement savings prominent, children''s education funded"]'::json, 'Darshan made 10-year plan at age 35. 2024 review at 45: emergency fund ✓, moneylender debt zero ✓, drip installed ✓, daughter''s Sukanya funded ✓. On track.', '10-year wealth target = Current net worth × 2 (doubles with disciplined saving).', '["Not making plan because future seems uncertain", "Making plan but not reviewing annually"]'::json, 'Write down 3 financial goals for: 1 year, 5 years, 10 years. Share with spouse for accountability.', NULL, 10, true)
  ON CONFLICT DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ENRICH EXISTING SCHEMES with FAQ, steps, type, and land criteria
-- Also update category for allied_activities (new UI category maps to existing)
-- ─────────────────────────────────────────────────────────────────────────────

-- PM-Kisan
UPDATE schemes SET
  faq_list = '[
    {"q":"मेरी किस्त क्यों रुकी?","a":"आधार-बैंक लिंक न होना, eKYC पेंडिंग, या भूमि रिकॉर्ड अपडेट न होना मुख्य कारण हैं। pmkisan.gov.in पर जाकर Farmer Corner में Status चेक करें।"},
    {"q":"कितना पैसा मिलता है और कब?","a":"साल में ₹6,000 — तीन किस्तों में ₹2,000-₹2,000-₹2,000। अप्रैल-जुलाई, अगस्त-नवंबर, दिसंबर-मार्च।"},
    {"q":"PM-Kisan के लिए कैसे रजिस्टर करें?","a":"pmkisan.gov.in → New Farmer Registration → आधार, बैंक, भूमि विवरण भरें। या नज़दीकी CSC सेंटर से मुफ्त पंजीकरण।"},
    {"q":"क्या किराएदार किसान पात्र हैं?","a":"नहीं। केवल भूमि मालिक किसान पात्र हैं जिनके नाम पर ज़मीन दर्ज है।"},
    {"q":"eKYC कैसे करें?","a":"pmkisan.gov.in पर जाएं → eKYC → आधार OTP से पूरा करें। या नज़दीकी CSC।"}
  ]'::json,
  how_to_apply_steps = '["pmkisan.gov.in पर जाएं","New Farmer Registration क्लिक करें","आधार नंबर और राज्य चुनें","भूमि रिकॉर्ड विवरण भरें","बैंक खाता नंबर और IFSC दर्ज करें","OTP से वेरीफाई करें","आवेदन सबमिट करें — SMS पुष्टि आएगी"]'::json,
  scheme_type = 'central',
  min_land_acres = 0.01
WHERE name = 'PM-Kisan Samman Nidhi';

-- PMFBY
UPDATE schemes SET
  faq_list = '[
    {"q":"प्रीमियम कितना है?","a":"रबी फसलों के लिए 1.5%, खरीफ के लिए 2%, बागवानी के लिए 5% — बाकी सरकार भरती है।"},
    {"q":"क्लेम कैसे मिलता है?","a":"72 घंटे के भीतर बीमा कंपनी को स्थानीय क्षति की सूचना दें। हेल्पलाइन: 14447। या बैंक/कृषि विभाग से।"},
    {"q":"KCC वालों का बीमा अपने आप होता है?","a":"हाँ, KCC धारकों का फसल बीमा बैंक द्वारा अपने आप किया जाता है। बैंक से पुष्टि कर लें।"},
    {"q":"आवेदन की अंतिम तिथि क्या है?","a":"राज्य और फसल के अनुसार अलग-अलग होती है। pmfby.gov.in या जिला कृषि कार्यालय से पता करें।"},
    {"q":"बीमा राशि कैसे तय होती है?","a":"जिले की औसत उपज × MSP मूल्य। आपकी व्यक्तिगत उपज नहीं — जिले की सर्वेक्षण उपज के आधार पर।"}
  ]'::json,
  how_to_apply_steps = '["pmfby.gov.in पर जाएं","Login करें (नया: New Registration)","अपना राज्य, जिला, फसल चुनें","भूमि विवरण और बुवाई तिथि भरें","प्रीमियम राशि चेक करें","बैंक से ऑटो-डेबिट या नकद भुगतान","नामांकन पुष्टि SMS सहेजें"]'::json,
  scheme_type = 'central',
  min_land_acres = 0.01
WHERE name = 'Pradhan Mantri Fasal Bima Yojana';

-- KCC
UPDATE schemes SET
  faq_list = '[
    {"q":"KCC की ब्याज दर क्या है?","a":"प्रभावी दर 4% प्रति वर्ष — यदि समय पर चुकाएं। सरकार 3% ब्याज सब्सिडी देती है (7% में से)।"},
    {"q":"KCC लिमिट कैसे तय होती है?","a":"फसल लागत + रखरखाव खर्च के आधार पर। आमतौर पर ₹1.6 लाख प्रति एकड़ (गेहूं)।"},
    {"q":"KCC का पैसा कब वापस करना है?","a":"फसल कटाई के बाद। रबी: मार्च-जून। खरीफ: नवंबर-जनवरी।"},
    {"q":"क्या पशुपालन के लिए भी KCC मिलती है?","a":"हाँ। डेयरी, मत्स्य पालन के लिए भी KCC उपलब्ध है।"},
    {"q":"KCC आवेदन कहाँ करें?","a":"किसी भी राष्ट्रीयकृत बैंक, क्षेत्रीय ग्रामीण बैंक, या सहकारी बैंक में।"}
  ]'::json,
  how_to_apply_steps = '["नज़दीकी बैंक शाखा जाएं","KCC आवेदन फॉर्म भरें","भूमि रिकॉर्ड, आधार, PAN जमा करें","बैंक अधिकारी फील्ड वेरीफिकेशन करेगा","15 दिन में कार्ड जारी होता है","ATM + क्रेडिट सुविधा एक्टिव होती है"]'::json,
  scheme_type = 'central',
  min_land_acres = 0.01
WHERE name = 'Kisan Credit Card';

-- SMAM (machinery subsidy)
UPDATE schemes SET
  faq_list = '[
    {"q":"कितनी सब्सिडी मिलती है?","a":"सामान्य किसान: 40-50%। SC/ST और छोटे-सीमांत किसान: 50-80%।"},
    {"q":"कौन-कौन सी मशीनें शामिल हैं?","a":"ट्रैक्टर, पावर टिलर, सीड ड्रिल, थ्रेशर, कंबाइन हार्वेस्टर, स्प्रेयर, सोलर पंप आदि।"},
    {"q":"आवेदन कहाँ करें?","a":"agrimachinery.nic.in पर ऑनलाइन। या जिला कृषि कार्यालय में।"},
    {"q":"लॉटरी सिस्टम क्यों है?","a":"बजट सीमित है। अधिक आवेदन होने पर लॉटरी से चयन होता है।"},
    {"q":"क्या FPO को प्राथमिकता मिलती है?","a":"हाँ। FPO आवेदनों को बड़ी मशीनरी के लिए प्राथमिकता दी जाती है।"}
  ]'::json,
  how_to_apply_steps = '["agrimachinery.nic.in पर जाएं","State और Scheme चुनें","Registration करें","मशीन चुनें और आवेदन भरें","दस्तावेज अपलोड करें","लॉटरी/स्वीकृति का इंतजार करें","स्वीकृति पर मशीन खरीदें — सब्सिडी बाद में खाते में आएगी"]'::json,
  scheme_type = 'central',
  min_land_acres = 0.01
WHERE name = 'Sub Mission on Agricultural Mechanisation';

-- PMKMY pension
UPDATE schemes SET
  faq_list = '[
    {"q":"₹55 महीने में ₹3,000 पेंशन — सच है?","a":"हाँ। 25 साल की उम्र में ₹55/माह से शुरू। सरकार भी बराबर योगदान करती है। 60 साल पर ₹3,000/माह पेंशन।"},
    {"q":"अगर बीच में छोड़ दें तो?","a":"10 साल बाद छोड़ें तो NPS में ट्रांसफर होगा। 10 साल से पहले छोड़ने पर केवल जमा + ब्याज मिलेगा।"},
    {"q":"पत्नी को पेंशन मिलेगी?","a":"किसान की मृत्यु पर जीवनसाथी को 50% — ₹1,500/माह मिलेगा।"},
    {"q":"कहाँ रजिस्ट्रेशन होगा?","a":"नज़दीकी CSC (Common Service Centre) में। आधार और बचत खाता लेकर जाएं।"},
    {"q":"40 साल से ज्यादा उम्र में?","a":"40 साल से अधिक उम्र में नामांकन संभव नहीं। 40 से पहले अनिवार्य।"}
  ]'::json,
  how_to_apply_steps = '["नज़दीकी CSC सेंटर जाएं","PM-Kisan Portal पर Maandhan लिंक खोलें","आधार, बैंक पासबुक, मोबाइल नंबर दें","उम्र के अनुसार मासिक योगदान चुनें","ऑटो-डेबिट सेटअप करें","पेंशन कार्ड/ID प्राप्त करें"]'::json,
  scheme_type = 'central',
  min_land_acres = 0.01,
  max_land_acres = 4.94
WHERE name = 'PM Kisan Maan Dhan Yojana';

-- PMAY-G housing
UPDATE schemes SET
  faq_list = '[
    {"q":"कितनी सहायता मिलती है?","a":"मैदानी क्षेत्र: ₹1.20 लाख। पहाड़ी/नक्सल क्षेत्र: ₹1.30 लाख। शौचालय: ₹12,000 अलग।"},
    {"q":"SECC 2011 में नाम नहीं है?","a":"राज्य आवास सर्वे में नाम है तो आवेदन हो सकता है। ग्राम पंचायत से पता करें।"},
    {"q":"पैसा कब मिलता है?","a":"किस्तों में — निर्माण की प्रगति के साथ। आधार लिंक बैंक खाते में DBT।"},
    {"q":"पक्का घर होने पर?","a":"यदि पक्का घर है तो अपात्र। कच्चा/एक कमरे वाले पात्र हो सकते हैं।"}
  ]'::json,
  how_to_apply_steps = '["ग्राम पंचायत या BDO कार्यालय जाएं","SECC 2011 सूची में नाम चेक करें","आवेदन फॉर्म भरें","आधार, भूमि/आवास दस्तावेज जमा करें","स्वीकृति पर बैंक खाते में पहली किस्त","निर्माण शुरू करें — जियो-टैग फोटो जमा करें","प्रत्येक चरण पर किस्त मिलेगी"]'::json,
  scheme_type = 'central'
WHERE name = 'Pradhan Mantri Awas Yojana Gramin';

-- Add 3 more rich schemes for better coverage
INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, official_website,
  applicable_states, applicable_crops, common_rejection_reasons,
  fraud_warning, faq_list, how_to_apply_steps, scheme_type,
  min_land_acres, is_active, last_updated
) VALUES

-- SOLAR PUMP SCHEME
(
  uuid_generate_v4(),
  'PM-KUSUM (Solar Pump Scheme)',
  'पीएम कुसुम - सौर पंप योजना',
  'subsidy',
  'Pradhan Mantri Kisan Urja Suraksha Evam Utthan Mahabhiyan (PM-KUSUM) provides 60% subsidy on solar irrigation pumps. Farmer pays only 10%, government gives 30% central + 30% state subsidy.',
  'सौर ऊर्जा से चलने वाले पंप पर 60% सरकारी सब्सिडी। किसान को केवल 10% देना है। बाकी 30% केंद्र और 30% राज्य सरकार देती है। डीज़ल पंप बदलने पर बिजली बिल शून्य।',
  '60% subsidy — farmer pays only 10% (₹15,000-40,000 for 5HP pump)',
  'All farmers with agricultural land connection. Priority to areas without grid electricity or diesel pump users.',
  'कृषि भूमि वाले सभी किसान। बिना बिजली कनेक्शन वाले क्षेत्र और डीज़ल पंप उपयोगकर्ताओं को प्राथमिकता।',
  '["Aadhaar Card","Land Records (Khasra/Khatauni)","Bank Passbook","Photo","Existing pump details (if replacing)","Water source certificate"]',
  'Apply at state agriculture department or PM-KUSUM portal. pvtgov.pmkusum.mnre.gov.in',
  'https://pmkusum.mnre.gov.in',
  '[]',
  '[]',
  '["Already has grid power supply","Commercial/industrial land","Application submitted after quota full"]',
  'कभी भी किसी एजेंट को ''गारंटीड सब्सिडी'' के लिए पैसे न दें। आवेदन मुफ्त है।',
  '[
    {"q":"कितना फायदा होता है?","a":"5HP डीज़ल पंप चलाने पर ₹12,000-15,000 साल में खर्च होता है। सोलर पंप पर शून्य बिजली खर्च। 3-4 साल में निवेश वसूल।"},
    {"q":"कौन से राज्यों में उपलब्ध है?","a":"लगभग सभी राज्यों में — राज्य कोटा के आधार पर। अपने राज्य की कृषि विभाग वेबसाइट चेक करें।"},
    {"q":"किस साइज़ का पंप मिलेगा?","a":"2 HP से 10 HP तक के DC/AC सोलर पंप। खेत के आकार और पानी की जरूरत के अनुसार।"},
    {"q":"मेंटेनेंस कौन करेगा?","a":"आपूर्तिकर्ता कंपनी 5 साल की वारंटी और AMC देती है।"}
  ]'::json,
  '["pmkusum.mnre.gov.in पर जाएं","State → District → Block चुनें","Online Application Form भरें","दस्तावेज अपलोड करें","Demand Note जारी होने पर 10% राशि जमा करें","पंप इंस्टालेशन और चालू — सब्सिडी सीधे DBT"]'::json,
  'central',
  0.5,
  true,
  NOW()
),

-- ANIMAL HUSBANDRY / DAIRY
(
  uuid_generate_v4(),
  'National Livestock Mission - Dairy',
  'राष्ट्रीय पशुधन मिशन - डेयरी',
  'subsidy',
  'Provides up to 50% subsidy on dairy unit establishment, feed, and equipment. Supports small farmers to start or expand dairy income for stable monthly earnings.',
  'डेयरी इकाई शुरू करने या बढ़ाने पर 50% तक सब्सिडी। 2 से 10 पशुओं की डेयरी यूनिट के लिए। मासिक दूध आय से खेती की आय पूरक करें।',
  '25-50% subsidy (up to ₹2 lakh for 5-cow unit)',
  'Farmers with land for cattle, no criminal record, willing to join milk cooperative. SC/ST farmers get higher subsidy.',
  'पशुओं के लिए जमीन वाले किसान। SC/ST किसानों को अधिक सब्सिडी। दूध सहकारी से जुड़ने की इच्छा होनी चाहिए।',
  '["Aadhaar Card","Land/house certificate","Bank Passbook","SC/ST certificate if applicable","Animal Husbandry Department registration"]',
  'Apply at District Animal Husbandry Office or state NLM portal. Subsidy credited after purchase and verification.',
  'https://dahd.nic.in/nlm',
  '[]',
  '["dairy","livestock","cattle"]',
  '["No land/space for cattle","Animals purchased before approval","Incomplete documentation"]',
  'सरकारी सब्सिडी के लिए कभी एजेंट को पैसे न दें। जिला पशुपालन कार्यालय में मुफ्त आवेदन करें।',
  '[
    {"q":"कितनी गायें/भैंसें खरीद सकते हैं?","a":"सब्सिडी 2 से अधिकतम 10 पशु इकाई के लिए। पहले 2 से शुरू करना बेहतर।"},
    {"q":"दूध कहाँ बेचें?","a":"नज़दीकी दूध सहकारी (अमूल, सफेद, Mother Dairy नेटवर्क) में रजिस्ट्रेशन करें।"},
    {"q":"पशु बीमा है?","a":"हाँ। NABARD/राज्य योजना से ₹100-200 वार्षिक प्रीमियम पर पशु बीमा लें।"},
    {"q":"कमाई कितनी होगी?","a":"1 भैंस: 8-10 लीटर/दिन × ₹35-50 = ₹280-500/दिन। महीने में ₹8,000-15,000 स्थिर आय।"}
  ]'::json,
  '["जिला पशुपालन कार्यालय जाएं","NLM आवेदन फॉर्म भरें","दस्तावेज जमा करें","पशुपालन अधिकारी निरीक्षण करेगा","स्वीकृति आदेश मिलने के बाद पशु खरीदें","खरीद के 30 दिन के भीतर सत्यापन","सब्सिडी राशि बैंक खाते में"]'::json,
  'central',
  0,
  true,
  NOW()
),

-- FISHERIES
(
  uuid_generate_v4(),
  'Pradhan Mantri Matsya Sampada Yojana',
  'प्रधानमंत्री मत्स्य संपदा योजना',
  'subsidy',
  'India''s largest fisheries development scheme providing 40-60% subsidy on fish pond construction, boats, nets, cold storage, and processing. Opens new income source for farmers with water bodies.',
  'मछली पालन के लिए सबसे बड़ी सरकारी योजना। तालाब, नाव, जाल, कोल्ड स्टोरेज पर 40-60% सब्सिडी। भूमि वाले किसान सीजन में ₹50,000-1 लाख अतिरिक्त कमाई कर सकते हैं।',
  '40-60% subsidy on fisheries infrastructure (up to ₹3 lakh for small unit)',
  'Farmers with access to water bodies (ponds, rivers), fisherfolk, self-help groups. SC/ST/women get higher subsidy.',
  'जल निकाय (तालाब, नदी) वाले किसान, मत्स्य पालक, महिला SHG। SC/ST/महिला को अधिक सब्सिडी।',
  '["Aadhaar","Land/water body document","Bank Passbook","Photo","PMMSY application form"]',
  'Apply at District Fisheries Office or pmmsy.dof.gov.in',
  'https://pmmsy.dof.gov.in',
  '[]',
  '["fish","rice","other"]',
  '["No water body nearby","Area not covered under scheme","Infrastructure built before approval"]',
  'मत्स्य विभाग कार्यालय में आवेदन मुफ्त है। कोई शुल्क न चुकाएं।',
  '[
    {"q":"तालाब के बिना मछली पालन?","a":"हाँ — बायोफ्लॉक टैंक सिस्टम। ₹1-2 लाख में शुरू। जमीन पर टैंक बनाकर मछली पालन।"},
    {"q":"कितनी कमाई होती है?","a":"0.5 एकड़ तालाब से ₹50,000-80,000 प्रति वर्ष। मेहनत कम, पानी की जरूरत नहीं।"},
    {"q":"मछली की मार्केटिंग कहाँ?","a":"स्थानीय मछली बाज़ार, रेस्टोरेंट, या SHG के माध्यम से बेचें।"}
  ]'::json,
  '["pmmsy.dof.gov.in पर जाएं","State → District → Block चुनें","Component चुनें (तालाब/नाव/जाल)","Form भरें और दस्तावेज अपलोड करें","District Fisheries Officer वेरीफाई करेगा","स्वीकृति के बाद काम शुरू करें","पूरा होने पर Geo-tag photo जमा करें","सब्सिडी DBT से खाते में"]'::json,
  'central',
  0,
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- ─── UPDATE existing schemes with FAQ, steps, and richer data ────────────────

UPDATE schemes SET
  how_to_apply_steps = '[
    "pmkisan.gov.in पर जाएं → New Farmer Registration",
    "अपना आधार नंबर और राज्य चुनें",
    "जमीन के दस्तावेज (खसरा/खतौनी) अपलोड करें",
    "बैंक खाता नंबर और IFSC कोड डालें",
    "सबमिट करें — स्थानीय पटवारी जाँच करेगा",
    "pmkisan.gov.in पर Beneficiary Status से ट्रैक करें"
  ]'::json,
  faq_list = '[
    {"question": "किस्त कब आती है?", "answer": "हर 4 महीने में — अप्रैल, अगस्त, दिसंबर। pmkisan.gov.in पर स्थिति देखें।"},
    {"question": "किस्त क्यों रुकी?", "answer": "Aadhaar-बैंक लिंक नहीं, eKYC बाकी, या भूमि विवाद।"},
    {"question": "परिवार में एक ही आवेदन होगा?", "answer": "हाँ, एक परिवार = एक आवेदन। पति-पत्नी अलग-अलग नहीं कर सकते।"},
    {"question": "किरायेदार किसान को मिलेगा?", "answer": "नहीं, केवल जमीन के मालिक को।"}
  ]'::json,
  scheme_type = 'central'
WHERE name = 'PM-Kisan Samman Nidhi';

UPDATE schemes SET
  how_to_apply_steps = '[
    "बुवाई से पहले pmfby.gov.in या नजदीकी बैंक/CSC जाएं",
    "KCC धारक: बैंक से पूछें कि आटोमेटिक नामांकन हुआ या नहीं",
    "गैर-KCC: आवेदन फॉर्म भरें, दस्तावेज दें",
    "प्रीमियम बैंक खाते से काटा जाएगा",
    "पुष्टि SMS आएगी — नंबर सुरक्षित रखें",
    "नुकसान होने पर 72 घंटे में 14447 पर सूचित करें"
  ]'::json,
  faq_list = '[
    {"question": "प्रीमियम कितना है?", "answer": "रबी फसलों पर 1.5%, खरीफ पर 2% — आप सिर्फ यही देते हैं।"},
    {"question": "दावा कब मिलेगा?", "answer": "सर्वे के बाद 30-45 दिन में सीधे बैंक में।"},
    {"question": "क्या बाढ़ भी कवर है?", "answer": "हाँ — सूखा, बाढ़, ओले, कीट, बेमौसम बारिश सभी।"},
    {"question": "72 घंटे में सूचना क्यों?", "answer": "स्थानीय नुकसान (लोकलाइज्ड क्लेम) के लिए जरूरी। व्यापक क्षेत्र में सरकारी सर्वे खुद होता है।"}
  ]'::json
WHERE name = 'Pradhan Mantri Fasal Bima Yojana (PMFBY)';

UPDATE schemes SET
  how_to_apply_steps = '[
    "नजदीकी बैंक या को-ऑपरेटिव बैंक जाएं",
    "आधार, PAN, जमीन के कागज, 2 फोटो साथ लाएं",
    "KCC आवेदन फॉर्म भरें",
    "बैंक 15 दिन में लिमिट तय करेगा",
    "KCC कार्ड मिलने के बाद ATM की तरह उपयोग करें",
    "फसल बिकने पर तुरंत चुकाएं — 4% ब्याज बना रहेगा"
  ]'::json,
  faq_list = '[
    {"question": "ब्याज दर कितनी है?", "answer": "4% प्रति वर्ष — समय पर चुकाने पर। देरी पर 7% हो जाती है।"},
    {"question": "अधिकतम लिमिट कितनी?", "answer": "₹3 लाख तक बिना गारंटी। उससे अधिक पर संपत्ति गिरवी।"},
    {"question": "नई फसल के लिए दोबारा आवेदन?", "answer": "नहीं — KCC रिवॉल्विंग क्रेडिट है। चुकाएं और फिर निकालें।"},
    {"question": "पशुपालन के लिए भी मिलेगा?", "answer": "हाँ, KCC में पशुपालन और मत्स्य पालन भी शामिल है।"}
  ]'::json,
  min_land_acres = 0.25
WHERE name = 'Kisan Credit Card (KCC)';

-- Insert additional schemes for better category coverage
INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps, official_website,
  applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning,
  faq_list, scheme_type, min_land_acres, last_updated, is_active
) VALUES

-- SUBSIDY: PMKSY
(
  uuid_generate_v4(),
  'PM Krishi Sinchayee Yojana (PMKSY)',
  'प्रधानमंत्री कृषि सिंचाई योजना',
  'subsidy',
  '55% subsidy on micro-irrigation systems (drip and sprinkler). Reduces water use by 50% and increases yield.',
  'ड्रिप और स्प्रिंकलर सिंचाई पर 55% सब्सिडी। पानी की खपत 50% कम, उत्पादकता बढ़े।',
  '55% subsidy on drip/sprinkler installation',
  'All farmers with cultivable land. SC/ST farmers get additional subsidy.',
  'सभी किसान जिनके पास खेती योग्य जमीन है। SC/ST किसानों को अधिक सब्सिडी।',
  '["Aadhaar Card", "Land Records", "Bank Account", "Photo", "Quote from approved vendor"]',
  'Apply at district agriculture office or pmksy.gov.in with land records and vendor quote.',
  '["pmksy.gov.in पर जाएं या जिला कृषि कार्यालय जाएं", "भूमि रिकॉर्ड और विक्रेता उद्धरण साथ लाएं", "आवेदन फॉर्म भरें", "तकनीकी मंजूरी के बाद, अनुमोदित विक्रेता से स्थापना करवाएं", "बिल और फोटो जमा करने पर सब्सिडी बैंक में"]',
  'https://pmksy.gov.in',
  '[]', '[]',
  '["Applying after budget exhaustion (apply in April-May)", "Unapproved vendor used", "Land records mismatch"]',
  '⚠️ केवल अनुमोदित विक्रेताओं से उपकरण खरीदें। किसी अज्ञात एजेंट को पैसे न दें।',
  '[{"question": "सब्सिडी कितने दिन में मिलेगी?", "answer": "स्थापना और बिल जमा के 30-60 दिन में सीधे बैंक में।"}, {"question": "क्या पट्टे की जमीन पर मिलेगी?", "answer": "हाँ, किरायेदार किसान भी पात्र हैं।"}]'::json,
  'central', 0.5, NOW(), true
),

-- PENSION: PM Kisan Maandhan
(
  uuid_generate_v4(),
  'PM Kisan Maandhan Yojana',
  'PM किसान मानधन योजना',
  'pension',
  '₹3,000 per month pension after age 60. Government matches your contribution. Entry age 18-40 only.',
  '60 साल के बाद ₹3,000 प्रति माह पेंशन। सरकार भी उतना ही देती है। 18-40 उम्र में ही नामांकन।',
  '₹3,000/month pension after 60 years',
  'Farmers aged 18-40 years with cultivable land. Not applicable to income tax payers.',
  '18-40 साल के किसान जिनके पास खेती की जमीन है। आयकर दाता पात्र नहीं।',
  '["Aadhaar Card", "Bank Account", "Land Records", "Mobile Number"]',
  'Enroll at nearest CSC (Common Service Centre) with Aadhaar and bank passbook.',
  '["नजदीकी CSC (Common Service Centre) जाएं", "आधार और बैंक पासबुक साथ लाएं", "नामांकन फॉर्म भरें", "पहली किस्त कटेगी — पुष्टि SMS मिलेगी", "60 साल बाद ₹3,000/माह स्वचालित बैंक में"]',
  'https://maandhan.in',
  '[]', '[]',
  '["Enrolling after age 40 (not eligible)", "Stopping contributions (loses all benefits)", "Not updating bank account changes"]',
  '⚠️ केवल सरकारी CSC केंद्र पर नामांकन करें। कोई भी एजेंट अलग से पैसे मांगे तो ना करें।',
  '[{"question": "₹55 प्रति माह पर्याप्त है?", "answer": "25 साल की उम्र में ₹55/माह। सरकार भी ₹55 देती है। 60 साल पर ₹3,000/माह आजीवन।"}, {"question": "बीच में छोड़ दें तो?", "answer": "सभी योगदान बैंक ब्याज के साथ वापस मिलेंगे, पेंशन नहीं।"}]'::json,
  'central', 0.0, NOW(), true
),

-- ALLIED: PM Matsya Sampada
(
  uuid_generate_v4(),
  'PM Matsya Sampada Yojana',
  'प्रधानमंत्री मत्स्य संपदा योजना',
  'infrastructure',
  'Support for fisheries and aquaculture development. 40-60% subsidy on pond creation, equipment, cold chain.',
  'मत्स्य पालन और जलकृषि के विकास के लिए सहायता। तालाब, उपकरण, कोल्ड चेन पर 40-60% सब्सिडी।',
  '40-60% subsidy on fisheries infrastructure',
  'Fishermen, fish farmers, SHGs engaged in aquaculture.',
  'मत्स्य पालक, जलकृषि में लगे SHG।',
  '["Aadhaar Card", "Bank Account", "Land/Water Body Records", "Project Report", "Caste Certificate (if SC/ST)"]',
  'Apply at district fisheries office or pmmsy.gov.in',
  '["pmmsy.gov.in पर या जिला मत्स्य पालन कार्यालय जाएं", "परियोजना रिपोर्ट तैयार करें", "आवेदन जमा करें", "भौतिक सत्यापन के बाद अनुदान मंजूरी"]',
  'https://pmmsy.gov.in',
  '[]', '[]',
  '["No project report", "Water body not legally accessible", "Incomplete documentation"]',
  '⚠️ सरकारी योजना मुफ्त है। एजेंट को अतिरिक्त शुल्क न दें।',
  '[{"question": "SC/ST को कितनी सब्सिडी?", "answer": "SC/ST को 60%, सामान्य वर्ग को 40%।"}, {"question": "क्या तालाब खुदाई भी कवर है?", "answer": "हाँ, नया तालाब खुदाई, नवीनीकरण, उपकरण सब।"}]'::json,
  'central', 0.0, NOW(), true
),

-- INSURANCE: PMSBY + PMJJBY
(
  uuid_generate_v4(),
  'PMJJBY + PMSBY Insurance Combo',
  'PMJJBY + PMSBY बीमा कॉम्बो',
  'insurance',
  '₹2 lakh life cover (PMJJBY) + ₹2 lakh accidental cover (PMSBY) for just ₹350/year total. Mandatory for every farmer.',
  'मात्र ₹350/साल में ₹2 लाख जीवन बीमा + ₹2 लाख दुर्घटना बीमा। हर किसान के लिए जरूरी।',
  '₹4 lakh total cover for ₹350/year',
  'Any bank account holder aged 18-50 (PMJJBY) or 18-70 (PMSBY).',
  '18-50 साल का कोई भी बैंक खाताधारक।',
  '["Bank Account", "Aadhaar Card", "Nomination form"]',
  'Visit your bank and ask to enroll in PMJJBY and PMSBY. Auto-debit from account annually.',
  '["अपने बैंक जाएं", "PMJJBY और PMSBY दोनों के लिए फॉर्म मांगें", "नॉमिनी का नाम भरें", "₹350 ऑटो-डेबिट मंजूरी दें", "हर साल मई में स्वचालित नवीनीकरण"]',
  'https://www.jansuraksha.gov.in',
  '[]', '[]',
  '["Insufficient balance on debit date (May 31)", "Nominee name mismatch", "Age above limit"]',
  '⚠️ यह बैंक सीधे ऑफर करता है — कोई बाहरी एजेंट नहीं चाहिए।',
  '[{"question": "क्लेम कैसे करें?", "answer": "मृत्यु पर 30 दिन में, दुर्घटना पर 30 दिन में — नॉमिनी बैंक जाए।"}, {"question": "क्या विकलांगता भी कवर?", "answer": "PMSBY में आंशिक विकलांगता पर ₹1 लाख।"}]'::json,
  'central', 0.0, NOW(), true
)

ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE SCHEMES SEED — 20+ schemes across all 6 categories
-- ═══════════════════════════════════════════════════════════════════════════

-- ── INCOME SUPPORT (4 schemes) ─────────────────────────────────────────────

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
  'प्रधानमंत्री किसान सम्मान निधि',
  'income_support',
  'Direct income support of Rs 6,000 per year to all land-holding farmer families, paid in three equal instalments of Rs 2,000 every four months directly to their bank accounts.',
  'सभी भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष की सीधी आय सहायता — तीन समान किस्तों में, सीधे बैंक खाते में।',
  '₹6,000 प्रति वर्ष (3 किस्तें)',
  'All landholding farmer families across India. Excludes institutional land holders, government employees, income tax payers, and professionals.',
  'भारत के सभी भूमिधारक किसान परिवार। सरकारी कर्मचारी, आयकर दाता, पेशेवर और संस्थागत भूमि धारक को छोड़कर।',
  '["आधार कार्ड", "भूमि अभिलेख / खतौनी", "बैंक पासबुक", "मोबाइल नंबर आधार से लिंक"]',
  'Visit pmkisan.gov.in → New Farmer Registration → Fill form → Upload documents → Submit → Track payment status.',
  '["pmkisan.gov.in पर जाएं", "New Farmer Registration पर क्लिक करें", "आधार नंबर और मोबाइल दर्ज करें", "भूमि विवरण और बैंक खाता भरें", "दस्तावेज अपलोड करें और Submit करें", "स्थिति जानने के लिए Beneficiary Status चेक करें"]',
  'https://pmkisan.gov.in',
  '[]',
  '[]',
  '["आधार-बैंक लिंक नहीं है", "eKYC नहीं हुआ", "भूमि रिकॉर्ड में नाम मेल नहीं", "बैंक खाता निष्क्रिय है", "मोबाइल OTP सत्यापन लंबित"]',
  '⛔ PM-KISAN के लिए कोई शुल्क नहीं है। किसी भी एजेंट को पैसे न दें। pmkisan.gov.in पर खुद आवेदन करें या नज़दीकी CSC जाएं।',
  '[{"q": "मेरी किस्त क्यों नहीं आई?", "a": "सबसे आम कारण: आधार-बैंक लिंक नहीं, eKYC pending, या बैंक खाता बंद। pmkisan.gov.in पर Beneficiary Status चेक करें।"}, {"q": "eKYC कहाँ करें?", "a": "pmkisan.gov.in पर eKYC ऑप्शन है, या नज़दीकी CSC सेंटर या बैंक में OTP/Biometric से कराएं।"}, {"q": "नया रजिस्ट्रेशन कैसे करें?", "a": "pmkisan.gov.in → Farmers Corner → New Farmer Registration → आधार नंबर डालें → फॉर्म भरें।"}, {"q": "क्या किरायेदार किसान पात्र हैं?", "a": "नहीं, यह योजना केवल भूमि-धारक किसान परिवारों के लिए है। किरायेदार किसान पात्र नहीं।"}]',
  'central', 0.1, NULL, '2026-01-15', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'MGNREGA - Mahatma Gandhi National Rural Employment Guarantee',
  'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी योजना',
  'income_support',
  'Guarantees 100 days of wage employment per financial year to rural households whose adult members volunteer to do unskilled manual work. Wage is paid within 15 days.',
  'ग्रामीण परिवारों को प्रति वित्त वर्ष 100 दिनों के अकुशल काम की गारंटी। 15 दिनों के भीतर मजदूरी बैंक/डाकघर खाते में।',
  '₹224-374 प्रति दिन (राज्य अनुसार)',
  'Any adult member of a rural household willing to do unskilled manual work. No land requirement.',
  'ग्रामीण परिवार का कोई भी वयस्क सदस्य जो अकुशल मेहनत करने को तैयार हो। जमीन की जरूरत नहीं।',
  '["आधार कार्ड", "बैंक / डाकघर खाता", "जॉब कार्ड (ग्राम पंचायत से)"]',
  'Register at Gram Panchayat → Get Job Card → Apply for work when needed → Work assigned within 15 days → Payment in 15 days.',
  '["ग्राम पंचायत कार्यालय जाएं", "जॉब कार्ड के लिए परिवार के सभी वयस्क सदस्यों के आधार दें", "जॉब कार्ड मिलने के बाद, काम चाहिए तो लिखित आवेदन दें", "15 दिन में काम मिलेगा या बेरोजगारी भत्ता", "काम पूरा होने पर 15 दिन में बैंक में मजदूरी"]',
  'https://nrega.nic.in',
  '[]',
  '[]',
  '["जॉब कार्ड नहीं है", "बैंक खाता नहीं है", "आवेदन लिखित नहीं था", "काम उपलब्ध नहीं — बेरोजगारी भत्ता माँगें"]',
  '⛔ MGNREGA जॉब कार्ड बिल्कुल मुफ्त है। कोई भी राशि न दें। ग्राम पंचायत में सीधे आवेदन करें।',
  '[{"q": "जॉब कार्ड कैसे बनवाएं?", "a": "ग्राम पंचायत में जाएं, परिवार के सभी वयस्क सदस्यों का नाम दें, फोटो और आधार दें। 15 दिन में जॉब कार्ड मिलेगा।"}, {"q": "15 दिन में काम नहीं मिला तो?", "a": "बेरोजगारी भत्ता माँगने का अधिकार है। ग्राम पंचायत को लिखित में दें, वे राज्य सरकार से भत्ता दिलाएंगे।"}]',
  'central', 0, NULL, '2026-01-10', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PM-AASHA (PM Annadata Aay SanraksHan Abhiyan)',
  'प्रधानमंत्री अन्नदाता आय संरक्षण अभियान',
  'income_support',
  'Ensures farmers receive MSP (Minimum Support Price) for oilseeds, pulses, and copra through three components: PSS, PDPS, and PPSS. Protects against market price fall.',
  'तिलहन, दलहन और खोपरा के लिए MSP सुनिश्चित करती है। बाजार भाव MSP से कम होने पर अंतर राशि सीधे बैंक में।',
  'MSP और बाजार भाव का अंतर (₹ प्रति क्विंटल)',
  'Farmers growing oilseeds (soybean, groundnut, sunflower, mustard), pulses (tur, moong, urad), and copra in notified states during procurement season.',
  'तिलहन, दलहन और खोपरा उगाने वाले किसान — अधिसूचित राज्यों में, MSP सीजन के दौरान।',
  '["आधार कार्ड", "भूमि अभिलेख", "बुवाई का प्रमाण", "बैंक पासबुक", "मंडी पंजीकरण"]',
  'Register on state agriculture portal → Crop declaration before sowing → If market price falls below MSP, sell at state procurement center and claim difference.',
  '["राज्य कृषि पोर्टल पर पंजीकरण करें", "बुवाई से पहले फसल घोषणा फॉर्म भरें", "फसल तैयार होने पर नजदीकी मंडी/प्रोक्योरमेंट सेंटर पर ले जाएं", "MSP से कम दाम मिलने पर PDPS क्लेम करें", "15 दिन में बैंक में राशि आएगी"]',
  'https://agri.rajasthan.gov.in',
  '["Rajasthan", "Madhya Pradesh", "Maharashtra", "Karnataka", "Andhra Pradesh", "Gujarat"]',
  '["wheat", "other"]',
  '["फसल घोषणा समय पर नहीं हुई", "जमीन रिकॉर्ड में गड़बड़ी", "MSP सीजन के बाहर बेचा", "पंजीकरण नहीं था"]',
  '⛔ PM-AASHA में किसी एजेंट को कमीशन न दें। राज्य सरकार के अधिकृत खरीद केंद्र पर ही बेचें।',
  '[{"q": "कौन सी फसलें शामिल हैं?", "a": "मुख्यतः सोयाबीन, मूंगफली, सरसों, सूरजमुखी, अरहर, मूंग, उड़द और खोपरा।"}, {"q": "MSP कैसे पता करें?", "a": "हर साल अक्टूबर में केंद्र सरकार MSP घोषित करती है। agmarknet.gov.in पर देखें।"}]',
  'central', 0.5, NULL, '2026-01-20', true
) ON CONFLICT DO NOTHING;

-- ── CROP & LIVESTOCK INSURANCE (3 schemes) ────────────────────────────────

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMFBY - Pradhan Mantri Fasal Bima Yojana',
  'प्रधानमंत्री फसल बीमा योजना',
  'insurance',
  'Comprehensive crop insurance covering losses due to natural calamities, pests, diseases. Premium as low as 1.5% for Rabi, 2% for Kharif crops, 5% for commercial crops. Remaining premium paid by government.',
  'प्राकृतिक आपदा, कीट, बीमारी से फसल नुकसान पर बीमा। रबी के लिए 1.5%, खरीफ के लिए 2% प्रीमियम। बाकी सरकार भरती है।',
  'क्षति का 100% मुआवजा (फसल उत्पादन के अनुसार)',
  'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas.',
  'सभी किसान — भूमि-धारक, बटाईदार, किरायेदार — अधिसूचित क्षेत्र में अधिसूचित फसल उगाने वाले।',
  '["आधार कार्ड", "भूमि अभिलेख / किरायेदार हेतु रेंट एग्रीमेंट", "बैंक पासबुक", "बुवाई प्रमाण पत्र", "मोबाइल नंबर"]',
  'Apply at bank, CSC, or pmfby.gov.in within cut-off date before crop season ends. KCC loan holders are auto-enrolled for notified crops.',
  '["बुवाई के 10 दिन के भीतर: pmfby.gov.in पर जाएं या बैंक/CSC जाएं", "फसल और जमीन की जानकारी भरें", "प्रीमियम का भुगतान करें (KCC वालों का ऑटो डेबिट)", "नुकसान होने पर 72 घंटे में helpline 14447 या ऐप पर सूचना दें", "सर्वे के बाद 2 हफ्ते में क्लेम मिलेगा"]',
  'https://pmfby.gov.in',
  '[]',
  '["wheat", "rice", "cotton", "other"]',
  '["आवेदन देर से किया", "नुकसान 72 घंटे में सूचित नहीं किया", "गलत खसरा नंबर", "फसल अधिसूचित नहीं थी", "eKYC नहीं हुआ", "बैंक खाता बंद"]',
  '⛔ बीमा कंपनी के नाम पर फर्जी कॉल से सावधान। कोई भी बैंक खाता नंबर या OTP शेयर न करें। 14447 हेल्पलाइन पर शिकायत करें।',
  '[{"q": "क्लेम कैसे करें?", "a": "नुकसान होने के 72 घंटे के भीतर: Crop Insurance App पर या 14447 हेल्पलाइन पर सूचित करें। खसरा नंबर, फसल और नुकसान का कारण बताएं।"}, {"q": "बटाईदार किसान कैसे apply करें?", "a": "बटाईदार को जमीन मालिक का NOC और अपना रेंट एग्रीमेंट देना होगा। CSC सेंटर से मदद लें।"}, {"q": "प्रीमियम कितना है?", "a": "रबी: 1.5%, खरीफ: 2%, बागवानी: 5% — अधिकतम प्रीमियम। सरकार बाकी देती है।"}, {"q": "पैसे कब मिलेंगे?", "a": "क्लेम मंज़ूर होने पर 15 दिन के भीतर बैंक में। कुल मुआवजा 2 महीने में आना चाहिए।"}]',
  'central', 0.1, NULL, '2026-01-25', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'NLM - National Livestock Mission (Livestock Insurance)',
  'राष्ट्रीय पशुधन मिशन — पशु बीमा',
  'insurance',
  'Provides insurance coverage for livestock including cattle, buffalo, sheep, goats, and poultry against natural death or accident. Subsidy up to 50% on premium for BPL and SC/ST farmers.',
  'गाय, भैंस, बकरी, भेड़ और मुर्गी के लिए बीमा। BPL और SC/ST किसानों को 50% प्रीमियम सब्सिडी।',
  'पशु मूल्य का 100% (मृत्यु पर)',
  'All livestock farmers. BPL, SC/ST, and small/marginal farmers get 50% subsidy on premium.',
  'सभी पशुपालक किसान। BPL, SC/ST और छोटे-सीमांत किसानों को 50% प्रीमियम सब्सिडी।',
  '["आधार कार्ड", "पशु का नस्ल प्रमाण (कान-टैग सहित)", "बैंक पासबुक", "BPL/SC/ST प्रमाण (अगर सब्सिडी चाहिए)"]',
  'Visit nearest veterinary hospital or CSC center → Get animal ear-tagged → Fill insurance form → Pay subsidized premium.',
  '["नज़दीकी पशु चिकित्सालय या CSC सेंटर जाएं", "पशु का कान-टैग और फोटो लगवाएं", "बीमा आवेदन फॉर्म भरें", "सब्सिडी के लिए BPL/SC/ST प्रमाण दें", "प्रीमियम भरें — 1-3% वार्षिक", "पशु मृत्यु पर 48 घंटे में बीमा कंपनी को सूचित करें"]',
  'https://dahd.nic.in',
  '[]',
  '[]',
  '["कान-टैग नहीं था", "मृत्यु की सूचना 48 घंटे बाद दी", "पोस्टमार्टम नहीं हुआ", "खरीद का प्रमाण नहीं था"]',
  '⛔ पशु बीमा सरकारी सहायता से होता है। अनजान व्यक्ति के कहने पर पैसे न दें।',
  '[{"q": "कितने पशुओं का बीमा हो सकता है?", "a": "अधिकतम 5 बड़े पशु (गाय/भैंस) प्रति परिवार सब्सिडी पर। बकरी/भेड़ के लिए 50 तक।"}, {"q": "प्रीमियम कितना है?", "a": "गाय/भैंस: 3% वार्षिक। सब्सिडी के बाद BPL किसान को 1.5% देना होगा।"}]',
  'central', 0, NULL, '2026-01-15', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'WBCIS - Weather Based Crop Insurance Scheme',
  'मौसम आधारित फसल बीमा योजना',
  'insurance',
  'Insurance based on weather parameters (temperature, rainfall, frost, humidity) instead of yield loss. Faster claim settlement as it uses automatic weather station data.',
  'मौसम डेटा (तापमान, वर्षा, पाला, नमी) के आधार पर फसल बीमा। क्षेत्र सर्वेक्षण की जरूरत नहीं — स्वचालित मौसम स्टेशन से तेज़ क्लेम।',
  'प्रति हेक्टेयर तय राशि (मौसम पैरामीटर अनुसार)',
  'Farmers in areas where automatic weather stations are installed. Particularly suitable for horticulture, vegetables, spices.',
  'जिन क्षेत्रों में स्वचालित मौसम स्टेशन है। बागवानी, सब्जी और मसाला किसानों के लिए विशेष रूप से उपयोगी।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक", "बुवाई / रोपाई प्रमाण"]',
  'Apply at bank or CSC before cut-off date → Pay premium → If weather parameters trigger threshold, automatic payout without claim application.',
  '["निर्धारित अंतिम तिथि से पहले बैंक/CSC में आवेदन दें", "प्रीमियम भरें", "मौसम थ्रेशोल्ड ट्रिगर होने पर", "स्वचालित रूप से बैंक में राशि आती है — अलग क्लेम नहीं करना"]',
  'https://pmfby.gov.in',
  '[]',
  '["wheat", "rice", "cotton", "other"]',
  '["आवेदन देर से किया", "क्षेत्र में मौसम स्टेशन नहीं", "फसल WBCIS सूची में नहीं"]',
  '⛔ WBCIS क्लेम स्वचालित है। कोई एजेंट क्लेम दिलाने का वादा करे तो यह धोखाधड़ी है।',
  '[{"q": "PMFBY और WBCIS में क्या फर्क है?", "a": "PMFBY में खेत सर्वेक्षण से क्लेम होता है। WBCIS में मौसम स्टेशन डेटा से ऑटो क्लेम — तेज़ और आसान।"}, {"q": "थ्रेशोल्ड क्या होता है?", "a": "हर फसल के लिए न्यूनतम/अधिकतम वर्षा, तापमान तय होता है। उससे कम/ज्यादा हुआ तो पैसे मिलते हैं।"}]',
  'central', 0.1, NULL, '2026-01-10', true
) ON CONFLICT DO NOTHING;

-- ── SUBSIDIES (5 schemes) ──────────────────────────────────────────────────

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMKSY - Pradhan Mantri Krishi Sinchayee Yojana (Drip/Sprinkler)',
  'प्रधानमंत्री कृषि सिंचाई योजना — ड्रिप/स्प्रिंकलर',
  'subsidy',
  'Subsidy for micro-irrigation systems (drip and sprinkler) to promote water efficiency. Small and marginal farmers get 55% subsidy, other farmers 45% subsidy on total cost.',
  'ड्रिप और स्प्रिंकलर सिंचाई प्रणाली पर सब्सिडी — छोटे-सीमांत किसान को 55%, अन्य को 45% सब्सिडी।',
  '45-55% सब्सिडी (₹20,000-₹1,00,000 तक)',
  'All farmers with own land. Small and marginal farmers (up to 5 acres) get higher subsidy.',
  'सभी भूमिधारक किसान। छोटे-सीमांत किसान (5 एकड़ तक) को ज्यादा सब्सिडी।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक", "खसरा/खतौनी", "पासपोर्ट फोटो"]',
  'Apply at District Agriculture Office or state agriculture portal → Get approval → Purchase from empanelled vendor → Install → Claim subsidy.',
  '["जिला कृषि कार्यालय या राज्य कृषि पोर्टल पर आवेदन करें", "स्वीकृति मिलने के बाद पंजीकृत विक्रेता से खरीदें (पहले से न खरीदें!)", "तकनीशियन से इंस्टॉलेशन कराएं", "बिल और इंस्टॉलेशन सर्टिफिकेट के साथ क्लेम दाखिल करें", "सब्सिडी राशि 1-2 महीने में बैंक में"]',
  'https://pmksy.gov.in',
  '[]',
  '["wheat", "rice", "cotton", "other"]',
  '["स्वीकृति से पहले खरीदा", "अपंजीकृत विक्रेता से खरीदा", "गलत या अधूरे कागज़", "भूमि पर ऋण/विवाद"]',
  '⛔ स्वीकृति से पहले ड्रिप/स्प्रिंकलर न खरीदें। केवल सरकारी पंजीकृत विक्रेताओं से खरीदें।',
  '[{"q": "ड्रिप और स्प्रिंकलर में कौन सा बेहतर है?", "a": "ड्रिप: बागबानी, सब्जी, गन्ना के लिए। स्प्रिंकलर: गेहूं, दलहन, मूंगफली के लिए। KVK से सलाह लें।"}, {"q": "सब्सिडी कब मिलेगी?", "a": "इंस्टॉलेशन के बाद कागज जमा करने पर 1-2 महीने में।"}]',
  'central', 0.5, NULL, '2026-01-20', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PM-KUSUM - Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan',
  'PM-KUSUM — सोलर पंप योजना',
  'subsidy',
  'Solar-powered irrigation pumps with 60% subsidy (30% central + 30% state). Farmer pays only 10% if loan taken from bank. Reduces diesel cost and provides clean energy.',
  'सोलर पंप पर 60% सब्सिडी (30% केंद्र + 30% राज्य)। किसान केवल 10% देता है (बैंक ऋण से)। डीज़ल खर्च शून्य।',
  '60% सब्सिडी — 2HP से 10HP पंप पर',
  'Farmers with existing diesel/electric pump or new pump requirement. Valid land record required.',
  'जिनके पास डीज़ल/बिजली पंप है या नए पंप की जरूरत है। वैध भूमि रिकॉर्ड जरूरी।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक", "वर्तमान पंप का विवरण (अगर है)", "पासपोर्ट फोटो"]',
  'Register on state agriculture portal or DISCOM portal → Apply for component B (stand-alone solar pump) → Get loan sanction if needed → Installation by empanelled vendor.',
  '["राज्य DISCOM या कृषि पोर्टल पर पंजीकरण करें", "PM-KUSUM Component B के लिए ऑनलाइन आवेदन", "बैंक से 30% ऋण (केवल 10% देना होगा, बाकी सब्सिडी)", "पंजीकृत सोलर वेंडर से इंस्टॉलेशन", "बिजली/पानी बिल बचत का आनंद लें"]',
  'https://pmkusum.mnre.gov.in',
  '[]',
  '[]',
  '["स्वीकृति से पहले खरीदा", "DISCOM/राज्य पोर्टल पर पंजीकरण नहीं था", "बजट सीमा पूरी हो गई"]',
  '⛔ कोई भी एजेंट PM-KUSUM में जल्दी नंबर दिलाने का वादा करे तो धोखाधड़ी है। सरकारी पोर्टल पर खुद Apply करें।',
  '[{"q": "UP में PM-KUSUM कहाँ Apply करें?", "a": "upneda.com पर या UPPCL पोर्टल पर। राज्य कृषि विभाग के जिला कार्यालय से भी जानकारी लें।"}, {"q": "सोलर पंप से बचत कितनी होगी?", "a": "5 एकड़ किसान को सालाना ₹30,000-₹50,000 डीज़ल बचत हो सकती है।"}]',
  'central', 1, NULL, '2026-01-15', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'SMAM - Sub Mission on Agricultural Mechanization (Farm Machinery Subsidy)',
  'कृषि यंत्रीकरण उप मिशन — कृषि यंत्र सब्सिडी',
  'subsidy',
  'Subsidy of 40-50% on purchase of tractors, power tillers, threshers, reapers, seed drills, and other farm machinery. Helps reduce labor cost and improve efficiency.',
  'ट्रैक्टर, पावर टिलर, थ्रेशर, रीपर, सीड ड्रिल सहित कृषि यंत्रों पर 40-50% सब्सिडी।',
  '40-50% सब्सिडी (SC/ST/महिला को 50%)',
  'All farmers. SC/ST farmers and women farmers get 50% subsidy. Farmer should not have received similar subsidy in last 5 years.',
  'सभी किसान। SC/ST और महिला किसान को 50% सब्सिडी। पिछले 5 साल में समान यंत्र पर सब्सिडी न ली हो।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक", "SC/ST/OBC प्रमाण (अगर लागू)", "पुराने यंत्र का विवरण (अगर है)"]',
  'Apply on state agriculture portal → Get token number → Purchase from empanelled dealer with token → Submit bills → Subsidy credited in 30-60 days.',
  '["राज्य कृषि पोर्टल या DBT Agriculture पोर्टल पर आवेदन", "Token Number मिलेगा", "Token के साथ पंजीकृत डीलर से खरीदें", "बिल और खरीद प्रमाण अपलोड करें", "30-60 दिन में सब्सिडी बैंक में"]',
  'https://agrimachinery.nic.in',
  '[]',
  '[]',
  '["Token के बिना खरीदा", "अपंजीकृत डीलर से खरीदा", "5 साल की अवधि पूरी नहीं", "कागज़ अधूरे थे"]',
  '⛔ Token मिलने से पहले कभी यंत्र न खरीदें। केवल agrimachinery.nic.in पर पंजीकृत डीलर से खरीदें।',
  '[{"q": "ट्रैक्टर पर कितनी सब्सिडी मिलती है?", "a": "सामान्य किसान: 25%, SC/ST/महिला: 50%, सीमांत किसान: 35% — राज्य अनुसार अलग हो सकती है।"}, {"q": "Custom Hiring Centre क्या है?", "a": "SMAM से FPO/SHG मिलकर यंत्र किराए पर देने का केंद्र बना सकते हैं। इसमें 40% सब्सिडी है।"}]',
  'central', 0.5, NULL, '2026-01-18', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'NHM - National Horticulture Mission (Vegetable & Fruit Subsidy)',
  'राष्ट्रीय बागवानी मिशन — सब्जी और फल सब्सिडी',
  'subsidy',
  'Subsidy for horticulture activities including seedlings, greenhouse/polyhouse, drip irrigation, post-harvest infrastructure, cold storage, and marketing. Up to 50% subsidy.',
  'बागवानी के लिए: नर्सरी, ग्रीनहाउस, पॉलीहाउस, ड्रिप सिंचाई, पैक हाउस, शीत भंडार पर 50% तक सब्सिडी।',
  '25-50% सब्सिडी (गतिविधि अनुसार)',
  'Farmers engaged in horticulture — vegetables, fruits, flowers, spices, medicinal plants.',
  'बागवानी करने वाले किसान — सब्जी, फल, फूल, मसाला, औषधीय पौधे।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक", "फसल का विवरण", "DPR (विस्तृत परियोजना रिपोर्ट, बड़े प्रोजेक्ट के लिए)"]',
  'Apply at District Horticulture Office → Inspection and approval → Purchase/construct → Claim subsidy with bills.',
  '["जिला बागवानी कार्यालय में आवेदन", "स्वीकृति और निरीक्षण", "पंजीकृत विक्रेता से सामग्री खरीदें", "काम पूरा होने पर बिल जमा करें", "1-2 महीने में सब्सिडी"]',
  'https://nhm.nic.in',
  '[]',
  '["other"]',
  '["स्वीकृति से पहले निर्माण/खरीद", "गलत क्षेत्रफल दर्शाया", "DPR नहीं थी"]',
  '⛔ सब्सिडी के बाद काम पूरा करें — पहले नहीं। DPR तैयार करने में KVK से मुफ्त मदद लें।',
  '[{"q": "पॉलीहाउस पर कितनी सब्सिडी है?", "a": "4000 वर्ग मीटर तक पॉलीहाउस पर 50% सब्सिडी। NHM से लगभग ₹3.5 लाख मिल सकते हैं।"}]',
  'central', 0.5, NULL, '2026-01-12', true
) ON CONFLICT DO NOTHING;

-- ── CREDIT & LOAN SCHEMES (3 schemes) ─────────────────────────────────────

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'KCC - Kisan Credit Card',
  'किसान क्रेडिट कार्ड',
  'credit',
  'Revolving credit facility for farmers at 4% interest rate (after 2% interest subvention + 3% prompt repayment incentive). Credit limit based on land size and crop. Up to Rs 3 lakh per year.',
  'किसानों के लिए चक्रीय ऋण सुविधा — 4% ब्याज दर पर ₹3 लाख तक। समय पर चुकाने पर 3% ब्याज माफी।',
  '4% ब्याज पर ₹3 लाख तक (खरीफ + रबी)',
  'All farmers including small, marginal, tenant farmers, sharecroppers, oral lessees, and SHG members.',
  'सभी किसान — छोटे, सीमांत, बटाईदार, किरायेदार, मौखिक पट्टेदार और SHG सदस्य।',
  '["आधार कार्ड", "भूमि अभिलेख / पट्टे का प्रमाण", "बैंक पासबुक", "पासपोर्ट साइज़ फोटो", "पिछले 2 वर्ष का आयकर रिटर्न (अगर लागू)"]',
  'Apply at nearest bank, cooperative bank or RRB with land documents → Bank assesses land → KCC issued within 14 days.',
  '["नज़दीकी बैंक (SBI, PNB, BOB, सहकारी बैंक, RRB) में जाएं", "KCC आवेदन फॉर्म भरें और दस्तावेज दें", "बैंक जमीन का सत्यापन करेगा", "14 दिन में KCC जारी", "किसी भी ATM/PoS/ऑनलाइन से उपयोग करें", "फसल बेचने के बाद समय पर चुकाएं और 3% और माफी पाएं"]',
  'https://www.nabard.org/kcc',
  '[]',
  '["wheat", "rice", "cotton", "other"]',
  '["CIBIL स्कोर खराब है", "पहले का ऋण बकाया है", "भूमि पर विवाद है", "दस्तावेज़ अधूरे हैं", "बैंक में पहले NPA है"]',
  '⛔ KCC के लिए कोई दलाल/एजेंट की जरूरत नहीं। बैंक में सीधे जाएं। कोई भी एजेंट को कमीशन न दें।',
  '[{"q": "KCC पर ब्याज कितना है?", "a": "₹3 लाख तक: 7% सामान्य, लेकिन 3% सब्सिडी मिलती है → 4% net. समय पर चुकाने पर अतिरिक्त 3% छूट → 1% net!"}, {"q": "KCC से क्या-क्या खरीद सकते हैं?", "a": "बीज, खाद, कीटनाशक, डीज़ल, और कृषि यंत्र किराया। फसल बेचने तक के 12 महीने के खर्च।"}, {"q": "KCC renewal कैसे होता है?", "a": "हर साल फसल का ब्योरा दें और बकाया चुकाएं। बैंक KCC renew कर देगा।"}, {"q": "KCC न मिले तो क्या करें?", "a": "बैंक से लिखित में कारण माँगें। जिला लीड बैंक मैनेजर या RBI लोकपाल से शिकायत करें।"}]',
  'central', 0.5, NULL, '2026-01-20', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'Agricultural Infrastructure Fund (AIF)',
  'कृषि अवसंरचना निधि',
  'credit',
  'Medium to long term debt financing for post-harvest management infrastructure like warehouses, cold chains, processing units, sorting/grading units. 3% interest subvention.',
  'पैक हाउस, शीत भंडार, गोदाम, प्रसंस्करण इकाई के लिए ₹2 करोड़ तक का ऋण। 3% ब्याज अनुदान।',
  '3% ब्याज माफी, ₹2 करोड़ तक CGTMSE गारंटी',
  'Farmers, FPOs, SHGs, cooperatives, startups, and entrepreneurs for agri-infrastructure projects.',
  'किसान, FPO, SHG, सहकारी समिति, स्टार्टअप — कृषि बुनियादी ढांचे के लिए।',
  '["आधार कार्ड", "भूमि/किरायेदारी दस्तावेज", "बैंक खाता", "व्यवसाय योजना / DPR", "GST (लागू हो तो)"]',
  'Apply on agriinfra.dac.gov.in → Bank processes loan → 3% interest subvention for 7 years directly from government.',
  '["agriinfra.dac.gov.in पर पंजीकरण", "प्रोजेक्ट DPR तैयार करें (KVK मदद कर सकता है)", "बैंक में ऋण आवेदन करें", "बैंक स्वीकृति के बाद 3% सब्सिडी ऑटोमैटिक"]',
  'https://agriinfra.dac.gov.in',
  '[]',
  '[]',
  '["DPR कमज़ोर थी", "जमीन का स्वामित्व स्पष्ट नहीं", "CIBIL स्कोर कम था"]',
  '⛔ AIF सरकारी ऋण है। किसी प्राइवेट NBFC से AIF के नाम पर ऋण न लें।',
  '[{"q": "गोदाम बनाने पर क्या मिलेगा?", "a": "AIF से गोदाम/शीत भंडार पर ₹2 करोड़ तक ऋण, 3% ब्याज माफी, 7 साल तक।"}, {"q": "FPO कैसे आवेदन करे?", "a": "agriinfra.dac.gov.in पर FPO के रूप में पंजीकरण करें। नाबार्ड DDM से मदद लें।"}]',
  'central', 0, NULL, '2026-01-22', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'Interest Subvention Scheme for Short Term Agricultural Credit',
  'अल्पकालीन कृषि ऋण पर ब्याज अनुदान योजना',
  'credit',
  'Government provides 2% interest subvention on short term crop loans up to Rs 3 lakh to banks, which pass it to farmers. Additional 3% for prompt repayment, making effective rate 4%.',
  '₹3 लाख तक के फसल ऋण पर 2% ब्याज अनुदान (+ 3% समय पर चुकाने पर) → कुल 4% ब्याज।',
  '2% + 3% = 5% ब्याज माफी → 4% प्रभावी ब्याज',
  'Farmers taking short-term crop loans up to Rs 3 lakh from scheduled banks, cooperative banks, or RRBs.',
  '₹3 लाख तक का फसल ऋण लेने वाले सभी किसान — राष्ट्रीयकृत बैंक, सहकारी बैंक या RRB से।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक खाता", "फसल विवरण"]',
  'Apply for Kisan Credit Card (KCC) or crop loan at any scheduled bank. Subvention applied automatically.',
  '["KCC या फसल ऋण के लिए बैंक में आवेदन करें", "2% सब्सिडी अपने आप लागू होगी", "समय पर चुकाएं — अतिरिक्त 3% और मिलेगा", "KCC बनाएं और हर साल renew कराएं"]',
  'https://www.rbi.org.in',
  '[]',
  '["wheat", "rice", "cotton", "other"]',
  '["KCC नहीं है", "ऋण 3 लाख से अधिक", "समय पर नहीं चुकाया — 3% माफी नहीं मिलेगी"]',
  '⛔ यह सब्सिडी बैंक अपने आप देता है। कोई एजेंट इसके लिए पैसे माँगे तो धोखाधड़ी है।',
  '[{"q": "4% ब्याज कैसे मिलता है?", "a": "7% में 2% सरकार देती है → 5% net. फसल बेचकर तुरंत चुकाएं → और 3% → 2% net effective rate!"}, {"q": "किस बैंक से मिलेगा?", "a": "SBI, PNB, BOB, Canara समेत सभी राष्ट्रीयकृत बैंक, सहकारी बैंक और RRB।"}]',
  'central', 0.1, 12.5, '2026-01-20', true
) ON CONFLICT DO NOTHING;

-- ── ALLIED ACTIVITIES — Dairy, Fisheries, Processing (3 schemes, in subsidy category) ──

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMMSY - Pradhan Mantri Matsya Sampada Yojana (Fisheries)',
  'प्रधानमंत्री मत्स्य संपदा योजना',
  'subsidy',
  'Development of fisheries sector with 40-60% subsidy for fish ponds, cages, boats, nets, cold chains. Special benefits for SC/ST and women (60% subsidy).',
  'मत्स्य पालन विकास: तालाब, केज, नाव, जाल, कोल्ड चेन पर 40-60% सब्सिडी। SC/ST और महिला को 60% सब्सिडी।',
  '40-60% सब्सिडी (गतिविधि अनुसार)',
  'Fish farmers, fishermen, fish vendors, SHGs, cooperatives, and entrepreneurs.',
  'मछली किसान, मछुआरे, मछली विक्रेता, SHG, सहकारी समिति।',
  '["आधार कार्ड", "भूमि/जल क्षेत्र का स्वामित्व प्रमाण", "बैंक पासबुक", "SC/ST/महिला प्रमाण (सब्सिडी के लिए)", "DPR (बड़े प्रोजेक्ट के लिए)"]',
  'Apply at District Fisheries Office or state fisheries department portal → Get approval → Start project → Claim subsidy.',
  '["जिला मत्स्य पालन कार्यालय में संपर्क करें", "स्वीकृत गतिविधियों की सूची देखें", "आवेदन फॉर्म और DPR जमा करें", "स्वीकृति के बाद काम शुरू करें", "पूरा होने पर दस्तावेज जमा करें और सब्सिडी पाएं"]',
  'https://pmmsy.dof.gov.in',
  '[]',
  '[]',
  '["DPR कमज़ोर थी", "जल क्षेत्र का अधिकार नहीं था"]',
  '⛔ PMMSY सब्सिडी सरकारी विभाग से मिलती है। दलाल के माध्यम से अधिक सब्सिडी का वादा धोखाधड़ी है।',
  '[{"q": "1 एकड़ तालाब पर क्या मिलेगा?", "a": "मत्स्य पालन तालाब पर ₹3.5-5 लाख लागत में 40-60% सब्सिडी। जिला मत्स्य कार्यालय से पूरी जानकारी लें।"}]',
  'central', 0, NULL, '2026-01-18', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMFME - PM Formalisation of Micro Food Enterprises',
  'PM सूक्ष्म खाद्य प्रसंस्करण उद्यम औपचारिकता योजना',
  'subsidy',
  '35% credit-linked subsidy (max Rs 10 lakh) for micro food processing enterprises — pickles, flour mills, dal mills, oil expellers, dairy units, etc.',
  'अचार, आटा चक्की, दाल मिल, तेल घानी, डेयरी — ₹10 लाख तक 35% क्रेडिट-लिंक्ड सब्सिडी।',
  '35% सब्सिडी (अधिकतम ₹10 लाख)',
  'Existing micro food processing units with annual turnover below Rs 1 crore. ODOP products preferred.',
  'मौजूदा सूक्ष्म खाद्य प्रसंस्करण इकाइयाँ — सालाना टर्नओवर ₹1 करोड़ से कम। ODOP उत्पाद को प्राथमिकता।',
  '["आधार कार्ड", "व्यवसाय पंजीकरण / MSME उद्यम रजिस्ट्रेशन", "बैंक पासबुक", "DPR", "FSSAI लाइसेंस"]',
  'Apply on mofpi.gov.in → Bank processes project loan → 35% subsidy disbursed by government to bank.',
  '["mofpi.gov.in पर पंजीकरण करें", "MSME पंजीकरण (Udyam) करें अगर नहीं है", "DPR बनाएं", "बैंक में ऋण आवेदन करें", "35% सब्सिडी ऑटोमैटिक बैंक को मिलेगी"]',
  'https://www.mofpi.gov.in/pmfme',
  '[]',
  '[]',
  '["FSSAI लाइसेंस नहीं था", "DPR कमज़ोर थी", "बैंक ने ऋण नहीं दिया"]',
  '⛔ सब्सिडी सीधे बैंक को जाती है, आपके खाते में नहीं। कोई एजेंट नकद सब्सिडी दिलाने का वादा करे तो धोखाधड़ी है।',
  '[{"q": "आटा चक्की पर कितनी सब्सिडी?", "a": "₹5 लाख की आटा चक्की पर 35% → ₹1.75 लाख सब्सिडी। ₹3.25 लाख खुद लगाने होंगे।"}]',
  'central', 0, NULL, '2026-01-15', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'NLM - National Livestock Mission (Dairy Entrepreneurship)',
  'राष्ट्रीय पशुधन मिशन — डेयरी उद्यमिता',
  'subsidy',
  'Subsidy for establishing dairy units, poultry farms, goat farms, and vermicompost units. SC/ST and women get 33.33% subsidy, others get 25% capital subsidy.',
  'डेयरी यूनिट, कुक्कुट, बकरी पालन, वर्मीकम्पोस्ट के लिए 25-33% पूंजी सब्सिडी।',
  '25-33% पूंजी सब्सिडी (₹2 लाख - ₹10 लाख)',
  'Farmers, SHGs, cooperatives, entrepreneurs for livestock development activities.',
  'किसान, SHG, सहकारी समिति — पशुपालन और डेयरी विकास के लिए।',
  '["आधार कार्ड", "भूमि/किराया दस्तावेज", "बैंक खाता", "पशुपालन विभाग पंजीकरण", "SC/ST प्रमाण (लागू हो तो)"]',
  'Apply at District Animal Husbandry Office → Get project sanctioned → Establish unit → Inspection → Subsidy credited.',
  '["जिला पशु चिकित्सा/पशुपालन कार्यालय में आवेदन", "प्रोजेक्ट DPR जमा करें", "स्वीकृति मिले तो काम शुरू करें", "पूरा होने पर निरीक्षण", "बैंक में सब्सिडी राशि"]',
  'https://dahd.nic.in',
  '[]',
  '[]',
  '["जमीन का मालिकाना हक नहीं था", "पशुचिकित्सा प्रमाण नहीं था"]',
  '⛔ डेयरी/पोल्ट्री सब्सिडी NABARD और राज्य सरकार से मिलती है। किसी प्राइवेट फर्म के माध्यम से नहीं।',
  '[{"q": "10 गाय की डेयरी पर क्या मिलेगा?", "a": "₹6-7 लाख लागत में 25-33% सब्सिडी → ₹1.5-2.3 लाख। NABARD DEDS स्कीम देखें।"}]',
  'central', 0, NULL, '2026-01-14', true
) ON CONFLICT DO NOTHING;

-- ── PENSION & FAMILY WELFARE (4 schemes) ──────────────────────────────────

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PM-KMY - Pradhan Mantri Kisan Maan-Dhan Yojana (Farmer Pension)',
  'प्रधानमंत्री किसान मान-धन योजना',
  'pension',
  'Voluntary and contributory pension scheme for small and marginal farmers. Monthly contribution of Rs 55-200 (age-based), government contributes equal amount. Rs 3,000 pension per month from age 60.',
  '₹55-200/माह जमा करें (उम्र के अनुसार) — सरकार भी उतनी ही राशि देती है। 60 वर्ष के बाद ₹3,000/माह पेंशन।',
  '₹3,000 प्रति माह (60 वर्ष के बाद)',
  'Small and marginal farmers aged 18-40 years with land up to 2 hectares (5 acres). Should not be covered under NPS, ESIC, or EPFO.',
  'छोटे-सीमांत किसान — 18-40 आयु, 5 एकड़ तक जमीन। NPS/ESIC/EPFO का सदस्य न हो।',
  '["आधार कार्ड", "भूमि अभिलेख", "बैंक पासबुक (ऑटो-डेबिट के लिए)", "मोबाइल नंबर"]',
  'Apply at CSC center with Aadhaar and bank account → Select contribution amount → Auto-debit set up → Wait till age 60 for pension.',
  '["नज़दीकी CSC सेंटर जाएं", "आधार और बैंक पासबुक लाएं", "उम्र के अनुसार मासिक अंशदान तय होगा (₹55-200)", "बैंक ऑटो-डेबिट सेट करें", "हर महीने अंशदान कटेगा", "60 वर्ष होने पर ₹3,000/माह पेंशन शुरू"]',
  'https://pmkmy.gov.in',
  '[]',
  '[]',
  '["उम्र 18-40 के बाहर", "5 एकड़ से ज्यादा जमीन", "पहले से EPFO/NPS में हैं", "आधार-बैंक लिंक नहीं"]',
  '⛔ PM-KMY CSC सेंटर पर बिल्कुल मुफ्त नामांकन है। कोई भी राशि एजेंट को न दें।',
  '[{"q": "60 साल से पहले मृत्यु पर क्या होगा?", "a": "पति/पत्नी को ₹1,500/माह फैमिली पेंशन मिलेगी। या जमा राशि वापस।"}, {"q": "योजना छोड़ना हो तो?", "a": "किसी भी समय बैंक बचत दर पर ब्याज सहित जमा राशि वापस मिलेगी।"}, {"q": "35 साल में join करने पर कितना जमा करना होगा?", "a": "₹87/माह + सरकार ₹87 = ₹174/माह जमा। 60 साल तक → ₹3,000/माह पेंशन।"}]',
  'central', 0, 5, '2026-01-20', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMJJBY - Pradhan Mantri Jeevan Jyoti Bima Yojana (Life Insurance)',
  'प्रधानमंत्री जीवन ज्योति बीमा योजना',
  'pension',
  'Life insurance of Rs 2 lakh for death from any cause at annual premium of just Rs 436 (Rs 1.19 per day). Renewable every year. Auto-debited from bank account.',
  'किसी भी कारण मृत्यु पर ₹2 लाख — सालाना प्रीमियम ₹436 (₹1.19/दिन)। बैंक से ऑटो-डेबिट।',
  '₹2 लाख जीवन बीमा (₹436/वर्ष)',
  'Any Indian citizen aged 18-50 with a bank account. Renewable up to age 55.',
  '18-50 वर्ष आयु, बैंक खाता वाला कोई भी भारतीय। 55 वर्ष तक नवीनीकरण।',
  '["आधार कार्ड", "बैंक पासबुक (ऑटो-डेबिट)"]',
  'Visit bank or submit form to bank → One time enrollment → Auto-debit every year in June.',
  '["अपने बैंक में जाएं या बैंक पोर्टल पर", "PMJJBY enrollment form भरें", "बैंक खाते से हर जून में ₹436 ऑटो-डेबिट होगा", "मृत्यु पर परिवार को ₹2 लाख क्लेम मिलेगा"]',
  'https://www.jansuraksha.gov.in',
  '[]',
  '[]',
  '["उम्र 50 से ज्यादा", "बैंक खाता नहीं था", "प्रीमियम की तारीख पर खाते में राशि नहीं थी"]',
  '⛔ PMJJBY सीधे बैंक से होता है। कोई एजेंट बीमा कराने के लिए पैसे माँगे तो धोखाधड़ी है।',
  '[{"q": "क्लेम कैसे मिलेगा?", "a": "मृत्यु के बाद परिवार बैंक में Death Certificate, Policy Certificate और क्लेम फॉर्म जमा करे। 30 दिन में ₹2 लाख मिलेंगे।"}, {"q": "PMSBY से क्या फर्क है?", "a": "PMJJBY: किसी भी कारण मृत्यु पर ₹2 लाख (₹436/वर्ष). PMSBY: दुर्घटना मृत्यु/विकलांगता पर ₹2 लाख (₹20/वर्ष)."}]',
  'central', 0, NULL, '2026-01-10', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'Ayushman Bharat PM-JAY (Health Insurance)',
  'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
  'pension',
  'Health insurance of Rs 5 lakh per family per year for hospitalization at any empanelled government or private hospital. Covers 1,929 medical procedures. No premium for beneficiaries.',
  'प्रति परिवार ₹5 लाख/वर्ष स्वास्थ्य बीमा — सूचीबद्ध सरकारी और निजी अस्पतालों में। 1,929 बीमारियाँ। परिवार को कोई प्रीमियम नहीं।',
  '₹5 लाख/वर्ष स्वास्थ्य बीमा (मुफ्त)',
  'Bottom 40% population of India as per SECC 2011 data. D1-D5 categories of rural deprivation. Urban occupational categories. PM-KISAN beneficiaries automatically included.',
  'SECC 2011 के अनुसार निचले 40% परिवार। ग्रामीण D1-D5 श्रेणी। PM-KISAN लाभार्थी स्वचालित रूप से शामिल।',
  '["आधार कार्ड", "राशन कार्ड", "Ayushman Card (जरूरत पर)"]',
  'Check eligibility at pmjay.gov.in or call 14555 → Get Ayushman Card made at CSC → Use at any empanelled hospital.',
  '["pmjay.gov.in पर नाम जाँचें या 14555 पर कॉल करें", "नाम है तो CSC से Ayushman Card बनवाएं", "भर्ती की जरूरत पर किसी भी सूचीबद्ध अस्पताल में Card दिखाएं", "पूरा खर्च सरकार देगी — कैशलेस"]',
  'https://pmjay.gov.in',
  '[]',
  '[]',
  '["SECC 2011 सूची में नाम नहीं था", "Ayushman Card नहीं था", "अस्पताल empanelled नहीं था", "इलाज सूचीबद्ध नहीं था"]',
  '⛔ Ayushman Card बनाने का कोई शुल्क नहीं। CSC में नि:शुल्क बनता है। OTP माँगने वाले से सावधान।',
  '[{"q": "मेरा नाम सूची में है या नहीं?", "a": "pmjay.gov.in पर या 14555 पर कॉल करें। राशन कार्ड नंबर या आधार से जाँचें।"}, {"q": "कौन से अस्पताल में होगा?", "a": "pmjay.gov.in → Find Hospital पर अपने जिले के अस्पताल देखें। 25,000+ सरकारी और निजी अस्पताल।"}, {"q": "5 लाख से ज्यादा खर्च हो तो?", "a": "5 लाख तक कवर है। अधिक होने पर राज्य सरकार की योजना (जैसे UP की CMHIS) भी देखें।"}]',
  'central', 0, NULL, '2026-01-25', true
) ON CONFLICT DO NOTHING;

INSERT INTO schemes (
  id, name, name_hindi, category, description, description_hindi,
  benefit_amount, eligibility, eligibility_hindi,
  documents_required, how_to_apply, how_to_apply_steps,
  official_website, applicable_states, applicable_crops,
  common_rejection_reasons, fraud_warning, faq_list,
  scheme_type, min_land_acres, max_land_acres, last_updated, is_active
) VALUES (
  gen_random_uuid(),
  'PMSBY - Pradhan Mantri Suraksha Bima Yojana (Accident Insurance)',
  'प्रधानमंत्री सुरक्षा बीमा योजना',
  'pension',
  'Accident insurance of Rs 2 lakh for death or permanent disability at annual premium of only Rs 20. Available to all bank account holders aged 18-70.',
  'दुर्घटना में मृत्यु या स्थायी विकलांगता पर ₹2 लाख — सालाना प्रीमियम केवल ₹20 (₹1.67/माह)।',
  '₹2 लाख (मृत्यु/पूर्ण विकलांगता) / ₹1 लाख (आंशिक विकलांगता)',
  'Any Indian citizen aged 18-70 with a savings bank account.',
  '18-70 वर्ष — बचत बैंक खाता वाला कोई भी भारतीय।',
  '["आधार कार्ड", "बैंक पासबुक"]',
  'Apply at bank or bank portal → Rs 20 auto-debited every June → Accident coverage active.',
  '["बैंक में PMSBY enrollment form भरें", "₹20 प्रति वर्ष ऑटो-डेबिट सेट करें", "दुर्घटना पर 30 दिन में FIR + Medical Certificate + Claim Form बैंक में जमा करें"]',
  'https://www.jansuraksha.gov.in',
  '[]',
  '[]',
  '["उम्र 70 से ज्यादा", "बैंक में ₹20 नहीं था जून में", "दुर्घटना का प्रमाण नहीं था"]',
  '⛔ PMSBY में ₹20 से ज्यादा कोई भी राशि कहीं नहीं जाती। एजेंट को कुछ न दें।',
  '[{"q": "PMJJBY और PMSBY साथ में ले सकते हैं?", "a": "हाँ! PMSBY: ₹20/वर्ष + PMJJBY: ₹436/वर्ष = कुल ₹456/वर्ष में ₹2 + ₹2 = ₹4 लाख कवर।"}]',
  'central', 0, NULL, '2026-01-10', true
) ON CONFLICT DO NOTHING;

