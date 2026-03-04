"""
DynamoDB client — handles GameSessions and OfflineSyncQueue tables.
These two tables are moved from RDS to DynamoDB because:
- High write volume, simple key-value access, no JOINs needed
- Game sessions are written once, read a few times, auto-expire after 90 days
- Offline sync queue needs fast burst writes when devices reconnect
"""

import boto3
import json
from datetime import datetime, timezone
from typing import Optional
from app.core.config import settings

_dynamo_client = None
_dynamo_resource = None


def get_dynamo_client():
    global _dynamo_client
    if _dynamo_client is None:
        _dynamo_client = boto3.client(
            "dynamodb",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
    return _dynamo_client


def get_dynamo_resource():
    global _dynamo_resource
    if _dynamo_resource is None:
        _dynamo_resource = boto3.resource(
            "dynamodb",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
    return _dynamo_resource


# ─── Table names (set via env, defaults for local/dev) ────────────────────────
GAME_SESSIONS_TABLE = "FintechGameSessions"
OFFLINE_SYNC_TABLE = "FintechOfflineSyncQueue"


# ─── GameSessions ─────────────────────────────────────────────────────────────

async def save_game_session(
    session_id: str,
    user_id: str,
    scenario_data: dict,
) -> bool:
    """Save a new game session to DynamoDB."""
    try:
        table = get_dynamo_resource().Table(GAME_SESSIONS_TABLE)
        table.put_item(Item={
            "user_id": user_id,
            "session_id": session_id,
            "scenario_data": json.dumps(scenario_data),
            "decisions": "[]",
            "is_completed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            # TTL: 90 days from now (DynamoDB auto-deletes expired items)
            "ttl": int(datetime.now(timezone.utc).timestamp()) + (90 * 24 * 3600),
        })
        return True
    except Exception as e:
        # Fall back gracefully — game still works, just not persisted
        print(f"DynamoDB save_game_session error: {e}")
        return False


async def complete_game_session(
    session_id: str,
    user_id: str,
    chosen_loan_id: str,
    final_score: float,
    outcome_summary: str,
) -> bool:
    """Mark a game session as completed with outcome."""
    try:
        table = get_dynamo_resource().Table(GAME_SESSIONS_TABLE)
        table.update_item(
            Key={"user_id": user_id, "session_id": session_id},
            UpdateExpression=(
                "SET is_completed = :done, "
                "final_score = :score, "
                "outcome_summary = :summary, "
                "chosen_loan = :loan, "
                "completed_at = :ts"
            ),
            ExpressionAttributeValues={
                ":done": True,
                ":score": str(final_score),
                ":summary": outcome_summary,
                ":loan": chosen_loan_id,
                ":ts": datetime.now(timezone.utc).isoformat(),
            },
        )
        return True
    except Exception as e:
        print(f"DynamoDB complete_game_session error: {e}")
        return False


async def get_user_game_history(user_id: str, limit: int = 10) -> list:
    """Get completed game sessions for a user."""
    try:
        table = get_dynamo_resource().Table(GAME_SESSIONS_TABLE)
        response = table.query(
            KeyConditionExpression="user_id = :uid",
            FilterExpression="is_completed = :done",
            ExpressionAttributeValues={":uid": user_id, ":done": True},
            ScanIndexForward=False,  # newest first
            Limit=limit,
        )
        return response.get("Items", [])
    except Exception as e:
        print(f"DynamoDB get_user_game_history error: {e}")
        return []


# ─── OfflineSyncQueue ─────────────────────────────────────────────────────────

async def queue_offline_action(
    user_id: str,
    action_type: str,
    payload: dict,
) -> bool:
    """
    Queue an action taken while offline.
    Lambda processes these when device reconnects and uploads to S3.
    action_type: "quiz_submit" | "game_decide" | "story_complete"
    """
    try:
        table = get_dynamo_resource().Table(OFFLINE_SYNC_TABLE)
        timestamp = datetime.now(timezone.utc).isoformat()
        table.put_item(Item={
            "user_id": user_id,
            "timestamp": timestamp,
            "action_type": action_type,
            "payload": json.dumps(payload),
            "synced": False,
            "ttl": int(datetime.now(timezone.utc).timestamp()) + (7 * 24 * 3600),  # 7 days
        })
        return True
    except Exception as e:
        print(f"DynamoDB queue_offline_action error: {e}")
        return False


async def mark_synced(user_id: str, timestamp: str) -> bool:
    """Mark an offline action as synced after processing."""
    try:
        table = get_dynamo_resource().Table(OFFLINE_SYNC_TABLE)
        table.update_item(
            Key={"user_id": user_id, "timestamp": timestamp},
            UpdateExpression="SET synced = :s",
            ExpressionAttributeValues={":s": True},
        )
        return True
    except Exception as e:
        print(f"DynamoDB mark_synced error: {e}")
        return False
