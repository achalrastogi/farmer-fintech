from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserProfile
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _profile_complete(user: User) -> bool:
    """Returns True if the user has filled in the key profile fields."""
    return bool(user.state and user.district and user.state.strip() and user.district.strip())


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    TASK 2: Minimal registration — only name, phone_number, password needed.
    password must be SHA-256(plain_password) — 64-char hex string from frontend.
    """
    # Check phone uniqueness
    result = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="यह मोबाइल नंबर पहले से रजिस्टर है।")

    # Check email uniqueness if provided
    if payload.email:
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="यह ईमेल पहले से रजिस्टर है।")

    user = User(
        phone_number      = payload.phone_number,
        email             = payload.email or None,
        name              = payload.name,
        state             = payload.state or "",
        district          = payload.district or "",
        crop_type         = payload.crop_type,
        preferred_language= payload.preferred_language,
        farm_size_acres   = payload.farm_size_acres,
        annual_income     = payload.annual_income,
        loan_amount       = payload.loan_amount,
        monthly_expenses  = payload.monthly_expenses,
        hashed_password   = hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.name)
    return TokenResponse(
        access_token    = token,
        user_id         = str(user.id),
        name            = user.name,
        profile_complete= _profile_complete(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    TASK 3: Login with phone number (+91XXXXXXXXXX) OR email address.
    password must be SHA-256(plain_password) — 64-char hex string from frontend.
    """
    identifier = payload.identifier.strip()

    # Detect whether identifier is email or phone
    if "@" in identifier:
        # Email login
        result = await db.execute(
            select(User).where(User.email == identifier, User.is_active == True)
        )
    else:
        # Phone login — auto-prefix +91 if user typed 10 digits without it
        if not identifier.startswith("+") and len(identifier) == 10:
            identifier = f"+91{identifier}"
        result = await db.execute(
            select(User).where(User.phone_number == identifier, User.is_active == True)
        )

    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="गलत मोबाइल नंबर / ईमेल या पासवर्ड।",
        )

    token = create_access_token(str(user.id), user.name)
    return TokenResponse(
        access_token    = token,
        user_id         = str(user.id),
        name            = user.name,
        profile_complete= _profile_complete(user),
    )


@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current logged-in user's profile."""
    return current_user
