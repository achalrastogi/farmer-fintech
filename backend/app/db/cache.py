import json
import redis.asyncio as aioredis
from typing import Any, Optional
from app.core.config import settings

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    redis = await get_redis()
    value = await redis.get(key)
    if value:
        return json.loads(value)
    return None


async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL_SECONDS):
    redis = await get_redis()
    await redis.setex(key, ttl, json.dumps(value))


async def cache_delete(key: str):
    redis = await get_redis()
    await redis.delete(key)
