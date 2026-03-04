"""
Run this inside the Docker container to create the demo user.
Docker: docker exec fintech_api python scripts/seed_demo_user.py

Demo credentials:
  Phone:    +919999999999
  Password: demo1234
"""
import asyncio, hashlib, bcrypt, sys, os
sys.path.insert(0, '/app')

os.environ.setdefault('DATABASE_URL', os.getenv('DATABASE_URL', 'postgresql+asyncpg://fintech:fintech123@db:5432/farmerfintech'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

DEMO_PHONE    = "+919999999999"
DEMO_NAME     = "Demo Farmer"
DEMO_PASSWORD = "demo1234"

async def seed():
    db_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://fintech:fintech123@db:5432/farmerfintech')
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # SHA-256 the password (same as frontend does)
    sha_hash = hashlib.sha256(DEMO_PASSWORD.encode()).hexdigest()
    # bcrypt the sha256 hash (same as auth_service does)
    bcrypt_hash = bcrypt.hashpw(sha_hash.encode(), bcrypt.gensalt(rounds=12)).decode()

    async with async_session() as session:
        # Check if already exists
        result = await session.execute(
            text("SELECT id FROM users WHERE phone_number = :phone"),
            {"phone": DEMO_PHONE}
        )
        existing = result.fetchone()

        if existing:
            print(f"✅ Demo user already exists — phone: {DEMO_PHONE} | password: {DEMO_PASSWORD}")
        else:
            await session.execute(text("""
                INSERT INTO users (
                    id, phone_number, name, state, district,
                    crop_type, preferred_language, farm_size_acres,
                    annual_income, loan_amount, monthly_expenses,
                    hashed_password, is_active, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :phone, :name, 'Punjab', 'Ludhiana',
                    'wheat', 'hi', 3.5,
                    180000, 50000, 10000,
                    :hashed_password, true, NOW(), NOW()
                )
            """), {
                "phone": DEMO_PHONE,
                "name": DEMO_NAME,
                "hashed_password": bcrypt_hash,
            })
            await session.commit()
            print(f"✅ Demo user created!")
            print(f"   Phone:    {DEMO_PHONE}")
            print(f"   Password: {DEMO_PASSWORD}")
            print(f"   Name:     {DEMO_NAME}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
