from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid, json

from app.db.database import get_db
from app.models.models import LessonCategory, Lesson, User
from app.schemas.schemas import LessonCategoryResponse, LessonDetail, LessonSummary
from app.services.auth_service import get_current_user
from app.services.translation_service import (
    get_translations_bulk_with_fallback,
    get_translations_with_fallback,
)

router = APIRouter(prefix="/lessons", tags=["Learn"])


@router.get("/categories", response_model=list[LessonCategoryResponse])
async def get_categories(
    lang: Optional[str] = Query(None, description="Language code: hi, en, pa, mr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all lesson categories with their lesson list.
    Pass ?lang=pa to get Punjabi translations, etc.
    Falls back to Hindi -> original columns."""
    language = lang or current_user.preferred_language.value

    result = await db.execute(
        select(LessonCategory)
        .where(LessonCategory.is_active == True)
        .order_by(LessonCategory.order_index)
    )
    categories = result.scalars().all()

    # Fetch all lessons grouped by category
    all_lessons = []
    cat_lessons_map: dict[uuid.UUID, list] = {}
    for cat in categories:
        lessons_result = await db.execute(
            select(Lesson)
            .where(Lesson.category_id == cat.id, Lesson.is_active == True)
            .order_by(Lesson.order_index)
        )
        lessons = lessons_result.scalars().all()
        cat_lessons_map[cat.id] = lessons
        all_lessons.extend(lessons)

    # Bulk-fetch translations for categories and lessons
    cat_ids = [c.id for c in categories]
    lesson_ids = [l.id for l in all_lessons]

    cat_trans = await get_translations_bulk_with_fallback(
        db, "lesson_category", cat_ids, language
    )
    lesson_trans = await get_translations_bulk_with_fallback(
        db, "lesson", lesson_ids, language
    )

    response = []
    for cat in categories:
        ct = cat_trans.get(cat.id, {})
        lessons = cat_lessons_map.get(cat.id, [])

        response.append(LessonCategoryResponse(
            id=cat.id,
            name=ct.get("name", cat.name),
            name_hindi=ct.get("name_hindi", cat.name_hindi),
            icon=cat.icon,
            lessons=[
                LessonSummary(
                    id=l.id,
                    title=lesson_trans.get(l.id, {}).get("title", l.title),
                    title_hindi=lesson_trans.get(l.id, {}).get("title_hindi", l.title_hindi),
                    related_calculator=l.related_calculator,
                    order_index=l.order_index,
                )
                for l in lessons
            ],
        ))
    return response


@router.get("/{lesson_id}", response_model=LessonDetail)
async def get_lesson(
    lesson_id: uuid.UUID,
    lang: Optional[str] = Query(None, description="Language code: hi, en, pa, mr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full content for a single lesson, translated to the requested language."""
    language = lang or current_user.preferred_language.value

    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    trans = await get_translations_with_fallback(
        db, "lesson", lesson.id, language
    )

    def get_json_field(field_name: str, fallback):
        val = trans.get(field_name)
        if val:
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return fallback
        return fallback

    return LessonDetail(
        id=lesson.id,
        title=trans.get("title", lesson.title),
        title_hindi=trans.get("title_hindi", lesson.title_hindi),
        key_points=get_json_field("key_points", lesson.key_points),
        example=trans.get("example", lesson.example),
        simple_calculation=trans.get("simple_calculation", lesson.simple_calculation),
        common_mistakes=get_json_field("common_mistakes", lesson.common_mistakes),
        try_this=trans.get("try_this", lesson.try_this),
        related_calculator=lesson.related_calculator,
    )
