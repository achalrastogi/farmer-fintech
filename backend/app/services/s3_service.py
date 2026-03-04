"""
S3 service — handles two buckets:
1. farmer-fintech-content: story audio files, images, compressed assets
2. farmer-fintech-sync: offline sync payloads uploaded by PWA
"""

import boto3
import json
from datetime import datetime, timezone
from app.core.config import settings

_s3_client = None

CONTENT_BUCKET = "farmer-fintech-content"
SYNC_BUCKET = "farmer-fintech-sync"


def get_s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
    return _s3_client


def get_audio_url(story_topic: str, language: str, quality: str = "standard") -> str:
    """
    Get a pre-signed URL for a story audio file.
    Audio files stored as: s3://farmer-fintech-content/audio/{quality}/{topic}_{lang}.mp3
    quality: standard | compressed (2G-friendly)
    """
    key = f"audio/{quality}/{story_topic}_{language}.mp3"
    try:
        url = get_s3().generate_presigned_url(
            "get_object",
            Params={"Bucket": CONTENT_BUCKET, "Key": key},
            ExpiresIn=3600,  # 1 hour
        )
        return url
    except Exception:
        return ""


def upload_sync_payload(user_id: str, payload: dict) -> str:
    """
    Upload an offline sync payload from PWA to S3.
    This triggers the offline-sync-processor Lambda.
    Returns: S3 object key
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    key = f"sync/{user_id}/{timestamp}.json"
    try:
        get_s3().put_object(
            Bucket=SYNC_BUCKET,
            Key=key,
            Body=json.dumps(payload),
            ContentType="application/json",
        )
        return key
    except Exception as e:
        print(f"S3 upload_sync_payload error: {e}")
        return ""


def get_presigned_upload_url(user_id: str) -> dict:
    """
    Generate a pre-signed POST URL so the PWA can upload
    sync payloads directly to S3 without going through the API.
    This reduces ECS load when many devices reconnect simultaneously.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    key = f"sync/{user_id}/{timestamp}.json"
    try:
        response = get_s3().generate_presigned_post(
            Bucket=SYNC_BUCKET,
            Key=key,
            ExpiresIn=300,  # 5 minutes
        )
        return {"url": response["url"], "fields": response["fields"], "key": key}
    except Exception as e:
        print(f"S3 presigned URL error: {e}")
        return {}
