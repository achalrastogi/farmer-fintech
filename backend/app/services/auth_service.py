import re
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.db.database import get_db
from app.models.models import User

security = HTTPBearer()
ALGORITHM = "HS256"

# SHA-256 hex string is always 64 chars — well within bcrypt's 72-byte limit
SHA256_HEX_PATTERN = re.compile(r'^[a-f0-9]{64}$')


def _validate_prehashed(password: str) -> None:
    """Reject anything that isn't a SHA-256 hex string from the frontend."""
    if not SHA256_HEX_PATTERN.match(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password format. Client must send SHA-256 hash.",
        )


def hash_password(pre_hashed: str) -> str:
    """bcrypt the SHA-256 hash received from frontend."""
    _validate_prehashed(pre_hashed)
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pre_hashed.encode(), salt).decode()


def verify_password(pre_hashed: str, stored_bcrypt: str) -> bool:
    """Verify SHA-256 hash against stored bcrypt hash."""
    _validate_prehashed(pre_hashed)
    return bcrypt.checkpw(pre_hashed.encode(), stored_bcrypt.encode())


def create_access_token(user_id: str, name: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "name": name, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user
