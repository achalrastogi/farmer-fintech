from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, hashlib, bcrypt

from app.core.config import settings
from app.db.database import create_tables, get_db
from app.api.routes import auth, education, practice, recommendations, sync, schemes, lessons, home

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_PHONE    = "+919999999999"
DEMO_NAME     = "Demo Farmer 🌾"
DEMO_PASSWORD = "demo1234"   # frontend will sha256 this before sending


async def _seed_demo_user():
    """Create a default demo user in development if it doesn't exist."""
    try:
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy import select, text
        from app.db.database import async_session_factory

        sha_hash    = hashlib.sha256(DEMO_PASSWORD.encode()).hexdigest()
        bcrypt_hash = bcrypt.hashpw(sha_hash.encode(), bcrypt.gensalt(rounds=12)).decode()

        async with async_session_factory() as session:
            result = await session.execute(
                text("SELECT id FROM users WHERE phone_number = :phone"),
                {"phone": DEMO_PHONE}
            )
            if not result.fetchone():
                await session.execute(text("""
                    INSERT INTO users (
                        id, phone_number, name, state, district,
                        crop_type, preferred_language, farm_size_acres,
                        annual_income, loan_amount, monthly_expenses,
                        hashed_password, is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), :phone, :name, 'Punjab', 'Ludhiana',
                        'wheat', 'hi', 3.5, 180000, 50000, 10000,
                        :pw, true, NOW(), NOW()
                    )
                """), {"phone": DEMO_PHONE, "name": DEMO_NAME, "pw": bcrypt_hash})
                await session.commit()
                logger.info(f"✅ Demo user created — phone: {DEMO_PHONE} | password: {DEMO_PASSWORD}")
            else:
                logger.info(f"ℹ️  Demo user already exists — {DEMO_PHONE}")
    except Exception as e:
        logger.warning(f"⚠️  Demo user seed skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🌾 Starting {settings.APP_NAME} [{settings.ENVIRONMENT}]")
    try:
        await create_tables()
        logger.info("✅ Database tables ready")
    except Exception as e:
        logger.warning(f"⚠️  DB setup: {e}")

    if settings.ENVIRONMENT == "development":
        await _seed_demo_user()

    yield
    logger.info("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    description="Rural Farmer Fintech Education Platform — AI for Bharat Hackathon",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/v1")
app.include_router(home.router,            prefix="/api/v1")
app.include_router(education.router,       prefix="/api/v1")
app.include_router(practice.router,        prefix="/api/v1")
app.include_router(schemes.router,         prefix="/api/v1")
app.include_router(lessons.router,         prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(sync.router,            prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
        "demo": {"phone": DEMO_PHONE, "password": DEMO_PASSWORD},
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "region": settings.AWS_REGION}
