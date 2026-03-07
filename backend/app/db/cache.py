import json
import redis.asyncio as aioredis
from typing import Any, Optional
from app.core.config import settings
import ssl
import asyncio

_redis_client: Optional[aioredis.Redis] = None

async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            ssl=True,
            ssl_cert_reqs=ssl.CERT_NONE,
            socket_connect_timeout=3,
            socket_timeout=3,
            max_connections=10
        )
    return _redis_client

async def cache_get(key: str) -> Optional[Any]:
    try:
        redis = await get_redis()
        value = await asyncio.wait_for(redis.get(key), timeout=2)
        if value:
            return json.loads(value)
    except Exception:
        return None
    return None

async def cache_set(key: str, value: Any, ttl: int):
    try:
        redis = await get_redis()
        await asyncio.wait_for(redis.setex(key, ttl, json.dumps(value)), timeout=2)
    except Exception:
        pass

async def cache_delete(key: str):
    try:
        redis = await get_redis()
        await asyncio.wait_for(redis.delete(key), timeout=2)
    except Exception:
        pass
