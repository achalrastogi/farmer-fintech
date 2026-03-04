from fastapi import APIRouter, Depends
from app.models.models import User
from app.services.auth_service import get_current_user
from app.services.s3_service import get_presigned_upload_url

router = APIRouter(prefix="/sync", tags=["Offline Sync"])


@router.get("/upload-url")
async def get_sync_upload_url(current_user: User = Depends(get_current_user)):
    """
    Returns a pre-signed S3 POST URL so the PWA can upload offline
    sync payloads directly to S3 — this triggers the Lambda processor.
    """
    result = get_presigned_upload_url(str(current_user.id))
    if not result:
        return {"url": None, "fields": {}, "key": None,
                "message": "S3 not configured — offline sync unavailable"}
    return result
