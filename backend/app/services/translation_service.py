"""
Translation service — fetches content_translations rows and overlays
them onto entity dicts. Falls back to Hindi, then to original columns.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.models import ContentTranslation


async def get_translations(
    db: AsyncSession,
    entity_type: str,
    entity_id: UUID,
    language: str,
) -> dict[str, str]:
    """
    Fetch all translated fields for a single entity+language.
    Returns dict like {'name': '...', 'description': '...', ...}
    """
    result = await db.execute(
        select(ContentTranslation.field, ContentTranslation.value)
        .where(
            ContentTranslation.entity_type == entity_type,
            ContentTranslation.entity_id == entity_id,
            ContentTranslation.language == language,
        )
    )
    return {row[0]: row[1] for row in result.fetchall()}


async def get_translations_bulk(
    db: AsyncSession,
    entity_type: str,
    entity_ids: list[UUID],
    language: str,
) -> dict[UUID, dict[str, str]]:
    """
    Fetch translations for multiple entities at once.
    Returns {entity_id: {field: value, ...}, ...}
    """
    if not entity_ids:
        return {}

    result = await db.execute(
        select(
            ContentTranslation.entity_id,
            ContentTranslation.field,
            ContentTranslation.value,
        )
        .where(
            ContentTranslation.entity_type == entity_type,
            ContentTranslation.entity_id.in_(entity_ids),
            ContentTranslation.language == language,
        )
    )

    out: dict[UUID, dict[str, str]] = {}
    for eid, field, value in result.fetchall():
        out.setdefault(eid, {})[field] = value
    return out


async def get_translations_with_fallback(
    db: AsyncSession,
    entity_type: str,
    entity_id: UUID,
    language: str,
    fallback_lang: str = "hi",
) -> dict[str, str]:
    """
    Get translations for a language, falling back to Hindi for any missing fields.
    """
    translations = await get_translations(db, entity_type, entity_id, language)

    if language != fallback_lang:
        hi_translations = await get_translations(db, entity_type, entity_id, fallback_lang)
        # Fill in any fields missing from the requested language
        for field, value in hi_translations.items():
            if field not in translations:
                translations[field] = value

    return translations


async def get_translations_bulk_with_fallback(
    db: AsyncSession,
    entity_type: str,
    entity_ids: list[UUID],
    language: str,
    fallback_lang: str = "hi",
) -> dict[UUID, dict[str, str]]:
    """
    Bulk fetch with Hindi fallback for missing fields.
    """
    translations = await get_translations_bulk(db, entity_type, entity_ids, language)

    if language != fallback_lang:
        hi_translations = await get_translations_bulk(db, entity_type, entity_ids, fallback_lang)
        for eid, hi_fields in hi_translations.items():
            if eid not in translations:
                translations[eid] = hi_fields
            else:
                for field, value in hi_fields.items():
                    if field not in translations[eid]:
                        translations[eid][field] = value

    return translations
