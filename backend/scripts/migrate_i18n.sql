-- ═══════════════════════════════════════════════════════════
--  MIGRATION: content_translations table + seed data
--  Phase 2 i18n — Hindi, English, Punjabi, Marathi
-- ═══════════════════════════════════════════════════════════

-- 1. Create the content_translations table
CREATE TABLE IF NOT EXISTS content_translations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(30)  NOT NULL,
    entity_id   UUID         NOT NULL,
    language    VARCHAR(5)   NOT NULL,
    field       VARCHAR(50)  NOT NULL,
    value       TEXT         NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ct_entity ON content_translations (entity_type, entity_id, language);
CREATE INDEX IF NOT EXISTS idx_ct_lang   ON content_translations (language);

-- Unique constraint: one translation per entity+field+language
CREATE UNIQUE INDEX IF NOT EXISTS idx_ct_unique
    ON content_translations (entity_type, entity_id, language, field);


-- ═══════════════════════════════════════════════════════════
-- 2. SEED: Hindi translations from existing columns
--    (copies data so the translation system works even for Hindi)
-- ═══════════════════════════════════════════════════════════

-- 2a. Scheme Hindi translations (auto-copy from existing columns)
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'name', name FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'name_hindi', name_hindi FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'description', description FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'description_hindi', description_hindi FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'eligibility', eligibility FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'eligibility_hindi', eligibility_hindi FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'benefit_amount', benefit_amount FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'how_to_apply', how_to_apply FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'hi', 'fraud_warning', fraud_warning FROM schemes WHERE fraud_warning IS NOT NULL AND is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- 2b. Lesson Hindi translations (auto-copy from existing columns)
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'title', title FROM lessons WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'title_hindi', title_hindi FROM lessons WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'example', example FROM lessons WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'key_points', key_points::text FROM lessons WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'common_mistakes', common_mistakes::text FROM lessons WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'try_this', try_this FROM lessons WHERE try_this IS NOT NULL AND is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', id, 'hi', 'simple_calculation', simple_calculation FROM lessons WHERE simple_calculation IS NOT NULL AND is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- 2c. Lesson Category Hindi translations
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', id, 'hi', 'name', name FROM lesson_categories WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', id, 'hi', 'name_hindi', name_hindi FROM lesson_categories WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 3. SEED: English translations for first 6 schemes
--    (English names already exist as the 'name' column;
--     we also translate description_hindi, eligibility_hindi, etc.)
-- ═══════════════════════════════════════════════════════════

-- English scheme translations: copy English columns directly
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'name', name FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'name_hindi', name FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'description', description FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'description_hindi', description FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'eligibility', eligibility FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'eligibility_hindi', eligibility FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'benefit_amount', benefit_amount FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', id, 'en', 'how_to_apply', how_to_apply FROM schemes WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 4. SEED: Punjabi (pa) translations — first 6 schemes
-- ═══════════════════════════════════════════════════════════

-- PM-Kisan
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM-Kisan Samman Nidhi'),
  ('name_hindi',       'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ'),
  ('description',      'All farmer families get ₹6,000/year direct income support in 3 instalments of ₹2,000 each.'),
  ('description_hindi','ਸਾਰੇ ਕਿਸਾਨ ਪਰਿਵਾਰਾਂ ਨੂੰ ਸਾਲ ਵਿੱਚ ₹6,000 ਦੀ ਆਰਥਿਕ ਮਦਦ — ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ₹2,000 ਹਰੇਕ।'),
  ('benefit_amount',   '₹6,000/ਸਾਲ (3 ਕਿਸ਼ਤਾਂ ₹2,000)'),
  ('eligibility',      'All small and marginal farmers who own cultivable land.'),
  ('eligibility_hindi','ਸਾਰੇ ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨ ਜਿਨ੍ਹਾਂ ਕੋਲ ਖੇਤੀਯੋਗ ਜ਼ਮੀਨ ਹੈ।'),
  ('how_to_apply',     'pmkisan.gov.in ਤੇ ਰਜਿਸਟਰ ਕਰੋ ਜਾਂ ਨਜ਼ਦੀਕੀ CSC ਸੈਂਟਰ ਜਾਓ। ਪਟਵਾਰੀ ਜ਼ਮੀਨ ਦੀ ਤਸਦੀਕ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।'),
  ('fraud_warning',    '⚠️ ਸਾਵਧਾਨ: PM-Kisan ਦੇ ਨਾਮ ਤੇ ਕੋਈ ਪੈਸੇ ਮੰਗੇ ਤਾਂ ਨਾ ਦਿਓ। ਇਹ ਯੋਜਨਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫ਼ਤ ਹੈ।')
) AS f(field, value)
WHERE s.name ILIKE '%PM-Kisan%' AND s.is_active = true
LIMIT 9
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PMFBY
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'Pradhan Mantri Fasal Bima Yojana (PMFBY)'),
  ('name_hindi',       'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ'),
  ('description',      'Crop insurance scheme. Farmers pay only 1.5-2% premium; government covers the rest.'),
  ('description_hindi','ਫ਼ਸਲ ਬੀਮਾ ਯੋਜਨਾ। ਕਿਸਾਨ ਸਿਰਫ਼ 1.5-2% ਪ੍ਰੀਮੀਅਮ ਦਿੰਦੇ ਹਨ, ਬਾਕੀ ਸਰਕਾਰ ਦਿੰਦੀ ਹੈ। ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋਣ ਤੇ ਪੂਰਾ ਮੁਆਵਜ਼ਾ।'),
  ('benefit_amount',   'ਰਬੀ 1.5%, ਖ਼ਰੀਫ਼ 2% ਪ੍ਰੀਮੀਅਮ। ਫ਼ਸਲ ਫ਼ੇਲ ਹੋਣ ਤੇ ਪੂਰੀ ਬੀਮਾ ਰਕਮ।'),
  ('eligibility',      'All farmers growing notified crops in notified areas.'),
  ('eligibility_hindi','ਸੂਚਿਤ ਖੇਤਰਾਂ ਵਿੱਚ ਸੂਚਿਤ ਫ਼ਸਲ ਉਗਾਉਣ ਵਾਲੇ ਸਾਰੇ ਕਿਸਾਨ। KCC ਅਤੇ ਗ਼ੈਰ-KCC ਦੋਵੇਂ ਯੋਗ।'),
  ('how_to_apply',     'ਬੀਜਣ ਦੀ ਤਰੀਕ ਤੋਂ ਪਹਿਲਾਂ ਨਜ਼ਦੀਕੀ ਬੈਂਕ, CSC, ਜਾਂ pmfby.gov.in ਤੇ ਅਪਲਾਈ ਕਰੋ।')
) AS f(field, value)
WHERE s.name ILIKE '%PMFBY%' AND s.is_active = true
LIMIT 8
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- KCC
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'Kisan Credit Card (KCC)'),
  ('name_hindi',       'ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ (KCC)'),
  ('description',      'Short-term farm loan at just 4% annual interest (with subsidy). Limit up to ₹3 lakh without collateral.'),
  ('description_hindi','ਸਿਰਫ਼ 4% ਸਾਲਾਨਾ ਵਿਆਜ ਤੇ ਛੋਟੀ ਮਿਆਦ ਦਾ ਖੇਤੀ ਕਰਜ਼। ₹3 ਲੱਖ ਤੱਕ ਬਿਨਾਂ ਗਾਰੰਟੀ।'),
  ('benefit_amount',   '4% ਸਾਲਾਨਾ ਵਿਆਜ (ਸਬਸਿਡੀ ਨਾਲ), ₹3 ਲੱਖ ਤੱਕ ਬਿਨਾਂ ਗਾਰੰਟੀ'),
  ('eligibility',      'All farmers including tenant farmers, sharecroppers, and SHG members.'),
  ('eligibility_hindi','ਸਾਰੇ ਕਿਸਾਨ ਜਿਵੇਂ ਕਿਰਾਏਦਾਰ, ਹਿੱਸੇਦਾਰ, ਅਤੇ SHG ਮੈਂਬਰ ਵੀ ਯੋਗ।'),
  ('how_to_apply',     'ਨਜ਼ਦੀਕੀ ਬੈਂਕ ਸ਼ਾਖਾ ਵਿੱਚ ਜ਼ਮੀਨ ਦੇ ਕਾਗਜ਼, ਆਧਾਰ, ਅਤੇ ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫੋਟੋ ਲੈ ਕੇ ਜਾਓ।')
) AS f(field, value)
WHERE s.name ILIKE '%KCC%' OR s.name ILIKE '%Kisan Credit%' AND s.is_active = true
LIMIT 8
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PM-KUSUM (Solar)
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM-KUSUM (Solar Pump Scheme)'),
  ('name_hindi',       'ਪੀ.ਐਮ. ਕੁਸੁਮ — ਸੋਲਰ ਪੰਪ ਯੋਜਨਾ'),
  ('description',      '60% subsidy on solar irrigation pumps. Farmer pays only 10%.'),
  ('description_hindi','ਸੋਲਰ ਸਿੰਚਾਈ ਪੰਪਾਂ ਤੇ 60% ਸਬਸਿਡੀ। ਕਿਸਾਨ ਸਿਰਫ਼ 10% ਦਿੰਦਾ ਹੈ।'),
  ('benefit_amount',   '60% ਸਬਸਿਡੀ ਸੋਲਰ ਪੰਪ ਤੇ'),
  ('eligibility_hindi','ਸਾਰੇ ਕਿਸਾਨ ਜਿਨ੍ਹਾਂ ਕੋਲ ਖੇਤੀਯੋਗ ਜ਼ਮੀਨ ਅਤੇ ਪਾਣੀ ਦਾ ਸੋਮਾ ਹੈ।'),
  ('how_to_apply',     'ਰਾਜ ਦੇ ਖੇਤੀਬਾੜੀ/ਊਰਜਾ ਵਿਭਾਗ ਦੀ ਵੈੱਬਸਾਈਟ ਤੇ ਅਪਲਾਈ ਕਰੋ ਜਾਂ ਬਲਾਕ ਦਫ਼ਤਰ ਜਾਓ।')
) AS f(field, value)
WHERE s.name ILIKE '%KUSUM%' AND s.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PMKSY (Irrigation)
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM Krishi Sinchayee Yojana (PMKSY)'),
  ('name_hindi',       'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕ੍ਰਿਸ਼ੀ ਸਿੰਚਾਈ ਯੋਜਨਾ'),
  ('description',      '55% subsidy on drip and sprinkler irrigation. Saves 50% water, increases yield.'),
  ('description_hindi','ਡ੍ਰਿੱਪ ਅਤੇ ਸਪ੍ਰਿੰਕਲਰ ਸਿੰਚਾਈ ਤੇ 55% ਸਬਸਿਡੀ। 50% ਪਾਣੀ ਬਚਾਉਂਦੀ ਹੈ, ਝਾੜ ਵਧਾਉਂਦੀ ਹੈ।'),
  ('benefit_amount',   '55% ਸਬਸਿਡੀ ਡ੍ਰਿੱਪ/ਸਪ੍ਰਿੰਕਲਰ ਤੇ'),
  ('eligibility_hindi','ਸਾਰੇ ਕਿਸਾਨ, ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਨੂੰ ਤਰਜੀਹ।'),
  ('how_to_apply',     'ਜ਼ਿਲ੍ਹਾ ਖੇਤੀਬਾੜੀ ਦਫ਼ਤਰ ਜਾਂ ਰਾਜ ਦੀ ਸਿੰਚਾਈ ਪੋਰਟਲ ਤੇ ਅਪਲਾਈ ਕਰੋ।')
) AS f(field, value)
WHERE s.name ILIKE '%Sinchayee%' OR s.name ILIKE '%PMKSY%' AND s.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PM Kisan Maandhan (Pension)
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'pa', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM Kisan Maandhan Yojana'),
  ('name_hindi',       'ਪੀ.ਐਮ. ਕਿਸਾਨ ਮਾਨਧਨ ਯੋਜਨਾ'),
  ('description',      'Pension scheme for small farmers. ₹3,000/month pension after age 60.'),
  ('description_hindi','ਛੋਟੇ ਕਿਸਾਨਾਂ ਲਈ ਪੈਨਸ਼ਨ ਯੋਜਨਾ। 60 ਸਾਲ ਬਾਅਦ ₹3,000/ਮਹੀਨਾ ਪੈਨਸ਼ਨ।'),
  ('benefit_amount',   '₹3,000/ਮਹੀਨਾ ਪੈਨਸ਼ਨ 60 ਸਾਲ ਬਾਅਦ'),
  ('eligibility_hindi','18-40 ਸਾਲ ਦੇ ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨ (2 ਹੈਕਟੇਅਰ ਤੱਕ)।'),
  ('how_to_apply',     'ਨਜ਼ਦੀਕੀ CSC ਸੈਂਟਰ ਤੇ ਆਧਾਰ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਲੈ ਕੇ ਜਾਓ।')
) AS f(field, value)
WHERE s.name ILIKE '%Maandhan%' AND s.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 5. SEED: Marathi (mr) translations — first 6 schemes
-- ═══════════════════════════════════════════════════════════

-- PM-Kisan
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM-Kisan Samman Nidhi'),
  ('name_hindi',       'प्रधानमंत्री किसान सन्मान निधी'),
  ('description',      'Direct income support of ₹6,000 per year to all farmer families.'),
  ('description_hindi','सर्व शेतकरी कुटुंबांना वर्षाला ₹6,000 थेट आर्थिक मदत — तीन हप्त्यांमध्ये प्रत्येकी ₹2,000.'),
  ('benefit_amount',   '₹6,000/वर्ष (3 हप्ते ₹2,000)'),
  ('eligibility',      'All small and marginal farmers who own cultivable land.'),
  ('eligibility_hindi','शेतजमीन असलेले सर्व लहान आणि सीमांत शेतकरी.'),
  ('how_to_apply',     'pmkisan.gov.in वर नोंदणी करा किंवा जवळच्या CSC केंद्रात जा. पटवारी जमीन पडताळणीत मदत करू शकतो.'),
  ('fraud_warning',    '⚠️ सावधान: PM-Kisan च्या नावाने कोणी पैसे मागत असेल तर देऊ नका. ही योजना पूर्णपणे मोफत आहे.')
) AS f(field, value)
WHERE s.name ILIKE '%PM-Kisan%' AND s.is_active = true
LIMIT 9
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PMFBY
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'Pradhan Mantri Fasal Bima Yojana (PMFBY)'),
  ('name_hindi',       'प्रधानमंत्री पीक विमा योजना'),
  ('description',      'Crop insurance scheme. Farmers pay only 1.5-2% premium.'),
  ('description_hindi','पीक विमा योजना. शेतकरी फक्त 1.5-2% प्रीमियम भरतात, बाकी सरकार भरते. पीक खराब झाल्यास पूर्ण भरपाई.'),
  ('benefit_amount',   'रब्बी 1.5%, खरीप 2% प्रीमियम. पीक अपयश आल्यास पूर्ण विमा रक्कम.'),
  ('eligibility',      'All farmers growing notified crops in notified areas.'),
  ('eligibility_hindi','अधिसूचित क्षेत्रांमध्ये अधिसूचित पीक घेणारे सर्व शेतकरी. KCC आणि बिगर-KCC दोन्ही पात्र.'),
  ('how_to_apply',     'पेरणीच्या तारखेपूर्वी जवळच्या बँक, CSC, किंवा pmfby.gov.in वर अर्ज करा.')
) AS f(field, value)
WHERE s.name ILIKE '%PMFBY%' AND s.is_active = true
LIMIT 8
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- KCC
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'Kisan Credit Card (KCC)'),
  ('name_hindi',       'किसान क्रेडिट कार्ड (KCC)'),
  ('description',      'Short-term farm loan at just 4% annual interest.'),
  ('description_hindi','फक्त 4% वार्षिक व्याजावर अल्पकालीन शेती कर्ज. ₹3 लाखांपर्यंत तारणाशिवाय.'),
  ('benefit_amount',   '4% वार्षिक व्याज (अनुदानासह), ₹3 लाखांपर्यंत तारणाशिवाय'),
  ('eligibility_hindi','सर्व शेतकरी, भाडेकरू शेतकरी, वाटेकरी, आणि SHG सदस्य पात्र.'),
  ('how_to_apply',     'जवळच्या बँक शाखेत जमिनीचे कागदपत्रे, आधार, आणि पासपोर्ट साईज फोटो घेऊन जा.')
) AS f(field, value)
WHERE s.name ILIKE '%KCC%' OR s.name ILIKE '%Kisan Credit%' AND s.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PM-KUSUM
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM-KUSUM (Solar Pump Scheme)'),
  ('name_hindi',       'पीएम कुसुम — सौर पंप योजना'),
  ('description_hindi','सौर सिंचन पंपांवर 60% अनुदान. शेतकरी फक्त 10% देतो.'),
  ('benefit_amount',   'सौर पंपांवर 60% अनुदान'),
  ('eligibility_hindi','शेतजमीन आणि पाण्याचा स्रोत असलेले सर्व शेतकरी.'),
  ('how_to_apply',     'राज्य कृषी/ऊर्जा विभागाच्या वेबसाईटवर अर्ज करा किंवा तालुका कार्यालयात जा.')
) AS f(field, value)
WHERE s.name ILIKE '%KUSUM%' AND s.is_active = true
LIMIT 6
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PMKSY
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM Krishi Sinchayee Yojana (PMKSY)'),
  ('name_hindi',       'प्रधानमंत्री कृषी सिंचन योजना'),
  ('description_hindi','ठिबक आणि तुषार सिंचनावर 55% अनुदान. 50% पाणी बचत, उत्पादन वाढ.'),
  ('benefit_amount',   'ठिबक/तुषार सिंचनावर 55% अनुदान'),
  ('eligibility_hindi','सर्व शेतकरी, लहान आणि सीमांत यांना प्राधान्य.'),
  ('how_to_apply',     'जिल्हा कृषी कार्यालय किंवा राज्य सिंचन पोर्टलवर अर्ज करा.')
) AS f(field, value)
WHERE s.name ILIKE '%Sinchayee%' OR s.name ILIKE '%PMKSY%' AND s.is_active = true
LIMIT 6
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- PM Kisan Maandhan
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'scheme', s.id, 'mr', f.field, f.value
FROM schemes s,
(VALUES
  ('name',             'PM Kisan Maandhan Yojana'),
  ('name_hindi',       'पीएम किसान मानधन योजना'),
  ('description_hindi','लहान शेतकऱ्यांसाठी पेन्शन योजना. 60 वर्षांनंतर ₹3,000/महिना पेन्शन.'),
  ('benefit_amount',   '60 वर्षांनंतर ₹3,000/महिना पेन्शन'),
  ('eligibility_hindi','18-40 वर्षे वयाचे लहान आणि सीमांत शेतकरी (2 हेक्टरपर्यंत).'),
  ('how_to_apply',     'जवळच्या CSC केंद्रात आधार आणि बँक पासबुक घेऊन जा.')
) AS f(field, value)
WHERE s.name ILIKE '%Maandhan%' AND s.is_active = true
LIMIT 6
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 6. SEED: Lesson translations — first 4 lessons (Eng + Pa + Mr)
-- ═══════════════════════════════════════════════════════════

-- Lesson: "What is Profit?" — English
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'en', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'What is Profit?'),
  ('title_hindi',        'What is Profit?'),
  ('example',            'Ramesh grew wheat on 2 acres. He sold 20 quintals at ₹2,015/quintal = ₹40,300. His total cost was ₹22,000. Profit = ₹40,300 - ₹22,000 = ₹18,300. Profit per acre = ₹9,150.'),
  ('key_points',         '["Revenue = Quantity sold × Selling price","Cost = Seeds + Fertilizer + Labour + Water + Transport","Profit = Revenue - Total Cost","Profit per acre = Total Profit ÷ Acres","If Profit < 0, it is a Loss"]'),
  ('common_mistakes',    '["Forgetting transport cost","Not counting own labour as cost","Using expected price not actual price","Ignoring loan interest in cost"]'),
  ('try_this',           'Write down all your costs for last season. Calculate your actual profit per acre. Was it more or less than you expected?'),
  ('simple_calculation', 'Profit = Revenue - Cost. Revenue = Qty × Price. Cost = Seeds + Fertilizer + Labour + Irrigation + Transport.')
) AS f(field, value)
WHERE l.title = 'What is Profit?' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "What is Profit?" — Punjabi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'pa', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'What is Profit?'),
  ('title_hindi',        'ਮੁਨਾਫ਼ਾ ਕੀ ਹੁੰਦਾ ਹੈ?'),
  ('example',            'ਰਮੇਸ਼ ਨੇ 2 ਏਕੜ ਵਿੱਚ ਕਣਕ ਬੀਜੀ। ਉਸਨੇ 20 ਕੁਇੰਟਲ ₹2,015/ਕੁਇੰਟਲ ਤੇ ਵੇਚੀ = ₹40,300। ਕੁੱਲ ਖ਼ਰਚ ₹22,000। ਮੁਨਾਫ਼ਾ = ₹18,300। ਪ੍ਰਤੀ ਏਕੜ ₹9,150।'),
  ('key_points',         '["ਆਮਦਨ = ਵੇਚੀ ਮਾਤਰਾ × ਵੇਚ ਕੀਮਤ","ਲਾਗਤ = ਬੀਜ + ਖਾਦ + ਮਜ਼ਦੂਰੀ + ਪਾਣੀ + ਢੋਆ-ਢੁਆਈ","ਮੁਨਾਫ਼ਾ = ਆਮਦਨ - ਕੁੱਲ ਲਾਗਤ","ਪ੍ਰਤੀ ਏਕੜ ਮੁਨਾਫ਼ਾ = ਕੁੱਲ ਮੁਨਾਫ਼ਾ ÷ ਏਕੜ","ਜੇ ਮੁਨਾਫ਼ਾ < 0 ਤਾਂ ਘਾਟਾ ਹੈ"]'),
  ('common_mistakes',    '["ਢੋਆ-ਢੁਆਈ ਦਾ ਖ਼ਰਚ ਭੁੱਲਣਾ","ਆਪਣੀ ਮਿਹਨਤ ਨੂੰ ਲਾਗਤ ਵਿੱਚ ਨਾ ਗਿਣਨਾ","ਉਮੀਦ ਕੀਮਤ ਵਰਤਣਾ, ਅਸਲ ਨਹੀਂ","ਕਰਜ਼ ਦਾ ਵਿਆਜ ਲਾਗਤ ਵਿੱਚ ਨਾ ਜੋੜਨਾ"]'),
  ('try_this',           'ਪਿਛਲੇ ਮੌਸਮ ਦੇ ਸਾਰੇ ਖ਼ਰਚੇ ਲਿਖੋ। ਆਪਣਾ ਅਸਲ ਪ੍ਰਤੀ ਏਕੜ ਮੁਨਾਫ਼ਾ ਕੈਲਕੁਲੇਟ ਕਰੋ।'),
  ('simple_calculation', 'ਮੁਨਾਫ਼ਾ = ਆਮਦਨ - ਲਾਗਤ। ਆਮਦਨ = ਮਾਤਰਾ × ਕੀਮਤ। ਲਾਗਤ = ਬੀਜ + ਖਾਦ + ਮਜ਼ਦੂਰੀ + ਸਿੰਚਾਈ + ਢੋਆ-ਢੁਆਈ।')
) AS f(field, value)
WHERE l.title = 'What is Profit?' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "What is Profit?" — Marathi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'mr', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'What is Profit?'),
  ('title_hindi',        'नफा म्हणजे काय?'),
  ('example',            'रमेशने 2 एकरात गहू पेरला. त्याने 20 क्विंटल ₹2,015/क्विंटल ला विकला = ₹40,300. एकूण खर्च ₹22,000. नफा = ₹18,300. प्रति एकर ₹9,150.'),
  ('key_points',         '["उत्पन्न = विक्री प्रमाण × विक्री किंमत","खर्च = बियाणे + खत + मजुरी + पाणी + वाहतूक","नफा = उत्पन्न - एकूण खर्च","प्रति एकर नफा = एकूण नफा ÷ एकर","नफा < 0 असल्यास तोटा"]'),
  ('common_mistakes',    '["वाहतूक खर्च विसरणे","स्वतःची मजुरी खर्चात न मोजणे","अपेक्षित किंमत वापरणे, प्रत्यक्ष नाही","कर्जाचे व्याज खर्चात न जोडणे"]'),
  ('try_this',           'गेल्या हंगामातील सर्व खर्च लिहा. प्रति एकर प्रत्यक्ष नफा मोजा.'),
  ('simple_calculation', 'नफा = उत्पन्न - खर्च. उत्पन्न = प्रमाण × किंमत. खर्च = बियाणे + खत + मजुरी + सिंचन + वाहतूक.')
) AS f(field, value)
WHERE l.title = 'What is Profit?' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Break-Even Point" — Punjabi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'pa', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Break-Even Point'),
  ('title_hindi',        'ਬ੍ਰੇਕ-ਈਵਨ ਪੁਆਇੰਟ'),
  ('example',            'ਸੁਰੇਸ਼ ਨੇ 2 ਏਕੜ ਝੋਨੇ ਤੇ ₹24,000 ਖ਼ਰਚ ਕੀਤੇ। 18 ਕੁਇੰਟਲ ਝਾੜ ਹੋਈ। ਬ੍ਰੇਕ-ਈਵਨ ₹24,000 ÷ 18 = ₹1,333/ਕੁਇੰਟਲ। ਬਾਜ਼ਾਰ ਭਾਅ ₹1,800 — ਉਹ ਸੁਰੱਖਿਅਤ ਹੈ।'),
  ('key_points',         '["ਬ੍ਰੇਕ-ਈਵਨ = ਉਹ ਕੀਮਤ ਜਿਸ ਤੇ ਸਾਰੀ ਲਾਗਤ ਨਿਕਲ ਜਾਵੇ","ਬ੍ਰੇਕ-ਈਵਨ ਤੋਂ ਘੱਟ ਤੇ ਵੇਚਣਾ = ਘਾਟਾ","MSP ਨਾਲ ਤੁਲਨਾ ਕਰੋ ਵੇਚਣ ਤੋਂ ਪਹਿਲਾਂ","ਕਰਜ਼ ਲੈਣ ਤੋਂ ਪਹਿਲਾਂ ਜ਼ਰੂਰ ਕੈਲਕੁਲੇਟ ਕਰੋ"]'),
  ('common_mistakes',    '["ਬ੍ਰੇਕ-ਈਵਨ ਤੋਂ ਘੱਟ ਤੇ ਵੇਚਣਾ","ਕਰਜ਼ ਵਿਆਜ ਨੂੰ ਲਾਗਤ ਵਿੱਚ ਨਾ ਜੋੜਨਾ","ਬਹੁਤ ਜ਼ਿਆਦਾ ਝਾੜ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਉਣਾ"]'),
  ('simple_calculation', 'ਬ੍ਰੇਕ-ਈਵਨ ਕੀਮਤ = ਕੁੱਲ ਲਾਗਤ ÷ ਅਨੁਮਾਨਿਤ ਝਾੜ (ਕੁਇੰਟਲ)। ਜੇ ਬਾਜ਼ਾਰ ਕੀਮਤ > ਬ੍ਰੇਕ-ਈਵਨ ਤਾਂ ਮੁਨਾਫ਼ਾ।')
) AS f(field, value)
WHERE l.title = 'Break-Even Point' AND l.is_active = true
LIMIT 6
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Break-Even Point" — Marathi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'mr', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Break-Even Point'),
  ('title_hindi',        'ब्रेक-इव्हन पॉइंट'),
  ('example',            'सुरेशने 2 एकर भातावर ₹24,000 खर्च केले. 18 क्विंटल उत्पादन. ब्रेक-इव्हन = ₹24,000 ÷ 18 = ₹1,333/क्विंटल. बाजार भाव ₹1,800 — तो सुरक्षित आहे.'),
  ('key_points',         '["ब्रेक-इव्हन = ती किंमत ज्यावर सर्व खर्च भरून निघतो","ब्रेक-इव्हन पेक्षा कमी किंमतीला विकणे = तोटा","विकण्यापूर्वी MSP शी तुलना करा","कर्ज घेण्यापूर्वी नक्की मोजा"]'),
  ('common_mistakes',    '["ब्रेक-इव्हन पेक्षा कमी किमतीला विकणे","कर्ज व्याज खर्चात न मोजणे","जास्त उत्पादनाचा अंदाज लावणे"]'),
  ('simple_calculation', 'ब्रेक-इव्हन किंमत = एकूण खर्च ÷ अपेक्षित उत्पादन (क्विंटल). बाजार किंमत > ब्रेक-इव्हन असल्यास नफा.')
) AS f(field, value)
WHERE l.title = 'Break-Even Point' AND l.is_active = true
LIMIT 6
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Moneylender vs Bank" — Punjabi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'pa', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Moneylender vs Bank — The Real Difference'),
  ('title_hindi',        'ਸਾਹੂਕਾਰ vs ਬੈਂਕ — ਅਸਲ ਫ਼ਰਕ'),
  ('example',            'ਮੋਹਨ ਨੇ ₹50,000 ਸਾਹੂਕਾਰ ਤੋਂ 5%/ਮਹੀਨਾ ਤੇ ਲਏ। 1 ਸਾਲ ਬਾਅਦ ₹30,000 ਵਿਆਜ ਦਿੱਤਾ! ਉਸਦੇ ਗੁਆਂਢੀ ਨੇ KCC ਤੋਂ 4%/ਸਾਲ ਤੇ ਲਿਆ — ਸਿਰਫ਼ ₹2,000 ਵਿਆਜ। ₹28,000 ਦੀ ਬੱਚਤ!'),
  ('key_points',         '["5%/ਮਹੀਨਾ = 60%/ਸਾਲ (12 ਗੁਣਾ ਮਹਿੰਗਾ)","KCC ਬੈਂਕ ਦਰ: ਸਿਰਫ਼ 4%/ਸਾਲ","₹50,000 ਤੇ: ਬੈਂਕ ₹2,000/ਸਾਲ, ਸਾਹੂਕਾਰ ₹30,000/ਸਾਲ","ਹਮੇਸ਼ਾ ਸਾਲਾਨਾ ਦਰ ਨਾਲ ਤੁਲਨਾ ਕਰੋ","KCC ₹1.6 ਲੱਖ ਤੱਕ ਬਿਨਾਂ ਗਾਰੰਟੀ"]'),
  ('common_mistakes',    '["ਮਹੀਨਾਵਾਰ ਅਤੇ ਸਾਲਾਨਾ ਦਰ ਸਿੱਧੀ ਤੁਲਨਾ ਕਰਨਾ","ਕਰਜ਼ ਸਮਝੌਤਾ ਧਿਆਨ ਨਾਲ ਨਾ ਪੜ੍ਹਨਾ","ਕਈ ਕਰਜ਼ੇ ਬਿਨਾਂ ਹਿਸਾਬ ਲੈਣਾ"]'),
  ('simple_calculation', 'ਸਾਲਾਨਾ ਵਿਆਜ = ਮੂਲ × (ਦਰ/100)। ਮਹੀਨਾਵਾਰ ਦਰ × 12 = ਸਾਲਾਨਾ ਦਰ। ਹਮੇਸ਼ਾ ਸਾਲਾਨਾ ਵਿੱਚ ਬਦਲ ਕੇ ਤੁਲਨਾ ਕਰੋ।')
) AS f(field, value)
WHERE l.title ILIKE '%Moneylender%Bank%' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Moneylender vs Bank" — Marathi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'mr', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Moneylender vs Bank — The Real Difference'),
  ('title_hindi',        'सावकार vs बँक — खरा फरक'),
  ('example',            'मोहनने ₹50,000 सावकाराकडून 5%/महिना दराने घेतले. 1 वर्षानंतर ₹30,000 व्याज भरले! शेजाऱ्याने KCC ने 4%/वर्ष दराने घेतले — फक्त ₹2,000 व्याज. ₹28,000 बचत!'),
  ('key_points',         '["5%/महिना = 60%/वर्ष (12 पट महाग)","KCC बँक दर: फक्त 4%/वर्ष","₹50,000 वर: बँक ₹2,000/वर्ष, सावकार ₹30,000/वर्ष","नेहमी वार्षिक दराने तुलना करा","KCC ₹1.6 लाखांपर्यंत तारणाशिवाय"]'),
  ('common_mistakes',    '["मासिक आणि वार्षिक दर सरळ तुलना करणे","कर्ज करार नीट न वाचणे","अनेक कर्जे हिशोबाशिवाय घेणे"]'),
  ('simple_calculation', 'वार्षिक व्याज = मूळ रक्कम × (दर/100). मासिक दर × 12 = वार्षिक दर. नेहमी वार्षिक मध्ये बदलून तुलना करा.')
) AS f(field, value)
WHERE l.title ILIKE '%Moneylender%Bank%' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Why Crop Insurance is Not Optional" — Punjabi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'pa', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Why Crop Insurance is Not Optional'),
  ('title_hindi',        'ਫ਼ਸਲ ਬੀਮਾ ਕਿਉਂ ਜ਼ਰੂਰੀ ਹੈ'),
  ('example',            'ਗੀਤਾ ਨੇ 2 ਏਕੜ ਕਣਕ ਲਈ ₹1,500 PMFBY ਪ੍ਰੀਮੀਅਮ ਦਿੱਤਾ (ਬੀਮਾ ₹1,00,000)। ਬੇਮੌਸਮੀ ਮੀਂਹ ਕਰਕੇ ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋਈ। ₹95,000 ਕਲੇਮ ਮਿਲਿਆ!'),
  ('key_points',         '["PMFBY ਪ੍ਰੀਮੀਅਮ: ਸਿਰਫ਼ 1.5-2% ਬੀਮਾ ਰਕਮ ਦਾ","ਬਾਕੀ 98% ਸਰਕਾਰ ਦਿੰਦੀ ਹੈ","ਸੋਕੇ, ਹੜ੍ਹ, ਕੀੜੇ ਤੋਂ ਸੁਰੱਖਿਆ","ਬੀਮਾ ਬਿਨਾਂ ਇੱਕ ਮਾੜਾ ਮੌਸਮ = ਕਰਜ਼ ਜਾਲ","ਬੀਜਣ ਤੋਂ ਪਹਿਲਾਂ ਅਪਲਾਈ ਕਰੋ"]'),
  ('common_mistakes',    '["ਬੁਰਾ ਮੌਸਮ ਨਹੀਂ ਆਵੇਗਾ ਸੋਚ ਕੇ ਛੱਡਣਾ","ਅਰਜ਼ੀ ਦੀ ਆਖ਼ਰੀ ਤਰੀਕ ਖੁੰਝਾਉਣਾ","ਕਲੇਮ ਪ੍ਰਕਿਰਿਆ ਪਹਿਲਾਂ ਨਾ ਪੜ੍ਹਨਾ"]'),
  ('simple_calculation', 'ਪ੍ਰੀਮੀਅਮ = ਬੀਮਾ ਰਕਮ × 1.5%। ਕਲੇਮ = (ਸੀਮਾ ਝਾੜ - ਅਸਲ ਝਾੜ) ÷ ਸੀਮਾ ਝਾੜ × ਬੀਮਾ ਰਕਮ।')
) AS f(field, value)
WHERE l.title ILIKE '%Crop Insurance%' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Lesson: "Why Crop Insurance is Not Optional" — Marathi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson', l.id, 'mr', f.field, f.value
FROM lessons l,
(VALUES
  ('title',              'Why Crop Insurance is Not Optional'),
  ('title_hindi',        'पीक विमा का आवश्यक आहे'),
  ('example',            'गीताने 2 एकर गव्हासाठी ₹1,500 PMFBY प्रीमियम भरला (विमा ₹1,00,000). अवकाळी पावसाने पीक खराब. ₹95,000 दावा मिळाला!'),
  ('key_points',         '["PMFBY प्रीमियम: फक्त 1.5-2% विमा रकमेचा","उर्वरित 98% सरकार देते","दुष्काळ, पूर, कीड यांपासून संरक्षण","विम्याशिवाय एक वाईट हंगाम = कर्ज सापळा","पेरणीपूर्वी अर्ज करा"]'),
  ('common_mistakes',    '["वाईट हवामान होणार नाही असे वाटून सोडणे","अर्जाची शेवटची तारीख चुकवणे","दावा प्रक्रिया आधी न वाचणे"]'),
  ('simple_calculation', 'प्रीमियम = विमा रक्कम × 1.5%. दावा = (सीमा उत्पादन - प्रत्यक्ष उत्पादन) ÷ सीमा उत्पादन × विमा रक्कम.')
) AS f(field, value)
WHERE l.title ILIKE '%Crop Insurance%' AND l.is_active = true
LIMIT 7
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 7. SEED: Lesson Category translations
-- ═══════════════════════════════════════════════════════════

-- English
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', id, 'en', 'name', name FROM lesson_categories WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', id, 'en', 'name_hindi', name FROM lesson_categories WHERE is_active = true
ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Punjabi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Profit & Cost'), ('name_hindi', 'ਲਾਭ ਅਤੇ ਲਾਗਤ')) AS f(field, value)
WHERE lc.name = 'Profit & Cost' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Cash Flow'), ('name_hindi', 'ਨਕਦ ਪ੍ਰਵਾਹ')) AS f(field, value)
WHERE lc.name = 'Cash Flow' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Loans'), ('name_hindi', 'ਕਰਜ਼ ਅਤੇ ਵਿਆਜ')) AS f(field, value)
WHERE lc.name = 'Loans' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Risk & Insurance'), ('name_hindi', 'ਜੋਖ਼ਮ ਅਤੇ ਬੀਮਾ')) AS f(field, value)
WHERE lc.name = 'Risk & Insurance' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Market & MSP'), ('name_hindi', 'ਬਾਜ਼ਾਰ ਅਤੇ MSP')) AS f(field, value)
WHERE lc.name = 'Market & MSP' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Government Schemes'), ('name_hindi', 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ')) AS f(field, value)
WHERE lc.name = 'Government Schemes' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'pa', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Long-term Stability'), ('name_hindi', 'ਲੰਬੇ ਸਮੇਂ ਦੀ ਸਥਿਰਤਾ')) AS f(field, value)
WHERE lc.name = 'Long-term Stability' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

-- Marathi
INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Profit & Cost'), ('name_hindi', 'नफा आणि खर्च')) AS f(field, value)
WHERE lc.name = 'Profit & Cost' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Cash Flow'), ('name_hindi', 'रोख प्रवाह')) AS f(field, value)
WHERE lc.name = 'Cash Flow' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Loans'), ('name_hindi', 'कर्ज आणि व्याज')) AS f(field, value)
WHERE lc.name = 'Loans' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Risk & Insurance'), ('name_hindi', 'जोखीम आणि विमा')) AS f(field, value)
WHERE lc.name = 'Risk & Insurance' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Market & MSP'), ('name_hindi', 'बाजार आणि MSP')) AS f(field, value)
WHERE lc.name = 'Market & MSP' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Government Schemes'), ('name_hindi', 'सरकारी योजना')) AS f(field, value)
WHERE lc.name = 'Government Schemes' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;

INSERT INTO content_translations (id, entity_type, entity_id, language, field, value)
SELECT uuid_generate_v4(), 'lesson_category', lc.id, 'mr', f.field, f.value
FROM lesson_categories lc,
(VALUES ('name', 'Long-term Stability'), ('name_hindi', 'दीर्घकालीन स्थैर्य')) AS f(field, value)
WHERE lc.name = 'Long-term Stability' ON CONFLICT (entity_type, entity_id, language, field) DO NOTHING;


-- Done!
-- Summary:
-- Table: content_translations (entity_type, entity_id, language, field, value)
-- Indexes: composite on (entity_type, entity_id, language), unique on (entity_type, entity_id, language, field)
-- Seeds: Hindi (auto-copied from columns), English, Punjabi, Marathi for 6 schemes + 4 lessons + 7 categories
