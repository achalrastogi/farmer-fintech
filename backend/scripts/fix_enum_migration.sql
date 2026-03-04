-- Run this SQL once to fix the enum mismatch.
-- This converts the PostgreSQL enums from uppercase (WHEAT) to lowercase (wheat)
-- to match what SQLAlchemy now stores via values_callable.

-- 1. Rename old enums
ALTER TYPE croptype RENAME TO croptype_old;
ALTER TYPE language RENAME TO language_old;
ALTER TYPE learningstage RENAME TO learningstage_old;
ALTER TYPE schemecategory RENAME TO schemecategory_old;

-- 2. Create new enums with lowercase values
CREATE TYPE croptype AS ENUM ('wheat','cotton','rice','other');
CREATE TYPE language AS ENUM ('hi','pa','te','ta','mr','bn','en');
CREATE TYPE learningstage AS ENUM ('story','practice','recommendation');
CREATE TYPE schemecategory AS ENUM ('income_support','subsidy','insurance','credit','pension','infrastructure');

-- 3. Convert columns in users table
ALTER TABLE users
  ALTER COLUMN crop_type TYPE croptype USING lower(crop_type::text)::croptype,
  ALTER COLUMN preferred_language TYPE language USING lower(preferred_language::text)::language;

-- 4. Convert other tables
ALTER TABLE story_templates
  ALTER COLUMN crop_type TYPE croptype USING lower(crop_type::text)::croptype;

ALTER TABLE generated_stories
  ALTER COLUMN language TYPE language USING lower(language::text)::language;

ALTER TABLE user_progress
  ALTER COLUMN stage TYPE learningstage USING lower(stage::text)::learningstage;

ALTER TABLE quizzes
  ALTER COLUMN language TYPE language USING lower(language::text)::language;

ALTER TABLE schemes
  ALTER COLUMN category TYPE schemecategory USING lower(category::text)::schemecategory;

ALTER TABLE financial_products ALTER COLUMN id SET DEFAULT gen_random_uuid(); -- no-op, just to test

-- 5. Drop old enums
DROP TYPE croptype_old;
DROP TYPE language_old;
DROP TYPE learningstage_old;
DROP TYPE schemecategory_old;

SELECT 'Enum migration complete ✅' AS status;
