import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.cache import cache_get, cache_set
from app.models.models import User, GeneratedStory, UserProgress, Module, LearningStage
from app.schemas.schemas import (
    StoryRequest, StoryResponse, AskQuestionRequest, AskQuestionResponse,
    LearningDashboard, ModuleProgressResponse,
)
from app.services.auth_service import get_current_user
from app.services.bedrock_service import bedrock_service

router = APIRouter(prefix="/education", tags=["Education"])


@router.post("/story/generate", response_model=StoryResponse)
async def generate_story(
    payload: StoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a personalized financial education story.
    Uses Redis cache first, then template engine, then Bedrock as last resort.
    """
    # Build cache key
    crop = payload.crop_type or current_user.crop_type
    cache_key = f"story:{payload.topic}:{crop.value}:{payload.language.value}"

    # Check cache (shared stories are cached; personalized ones aren't)
    cached = await cache_get(cache_key)
    if cached:
        # Save to user's history
        story = GeneratedStory(
            user_id=current_user.id,
            topic=payload.topic,
            language=payload.language,
            title=cached["title"],
            content=cached["content"],
            key_concepts=cached["key_concepts"],
            was_cached=True,
        )
        db.add(story)
        await db.commit()
        await db.refresh(story)
        return StoryResponse(
            id=story.id,
            title=cached["title"],
            content=cached["content"],
            topic=payload.topic,
            language=payload.language,
            key_concepts=cached["key_concepts"],
            was_cached=True,
        )

    # Generate story
    try:
        farmer_name = payload.farmer_name or current_user.name.split()[0]
        result = await bedrock_service.generate_story(
            topic=payload.topic,
            crop_type=crop,
            language=payload.language,
            farmer_name=farmer_name,
            district=current_user.district,
            state=current_user.state,
            farm_size_acres=current_user.farm_size_acres,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Cache the result for other users (template-based stories are shareable)
    if result.get("source") == "template":
        await cache_set(cache_key, {
            "title": result["title"],
            "content": result["content"],
            "key_concepts": result["key_concepts"],
        }, ttl=86400)  # 24 hours

    # Persist to DB
    story = GeneratedStory(
        user_id=current_user.id,
        topic=payload.topic,
        language=payload.language,
        title=result["title"],
        content=result["content"],
        key_concepts=result["key_concepts"],
        was_cached=False,
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)

    return StoryResponse(
        id=story.id,
        title=result["title"],
        content=result["content"],
        topic=payload.topic,
        language=payload.language,
        key_concepts=result["key_concepts"],
        was_cached=False,
    )


@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(
    payload: AskQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ask the AI learning assistant a financial question."""
    # Check FAQ cache first (major cost saver)
    cache_key = f"faq:{payload.language.value}:{payload.question.lower().strip()}"
    cached = await cache_get(cache_key)
    if cached:
        return AskQuestionResponse(answer=cached, was_cached=True)

    # Get story context if provided
    context = None
    if payload.context_story_id:
        result = await db.execute(
            select(GeneratedStory).where(GeneratedStory.id == payload.context_story_id)
        )
        story = result.scalar_one_or_none()
        if story:
            context = story.content[:500]  # First 500 chars as context

    answer = await bedrock_service.answer_question(
        question=payload.question,
        language=payload.language,
        context=context,
    )

    # Cache common questions for 6 hours
    await cache_set(cache_key, answer, ttl=21600)

    return AskQuestionResponse(answer=answer, was_cached=False)


@router.get("/stories/my", response_model=list[StoryResponse])
async def get_my_stories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 10,
):
    """Get stories generated for the current user."""
    result = await db.execute(
        select(GeneratedStory)
        .where(GeneratedStory.user_id == current_user.id)
        .order_by(GeneratedStory.created_at.desc())
        .limit(limit)
    )
    stories = result.scalars().all()
    return [
        StoryResponse(
            id=s.id,
            title=s.title,
            content=s.content,
            topic=s.topic,
            language=s.language,
            key_concepts=s.key_concepts,
            was_cached=s.was_cached,
        )
        for s in stories
    ]


@router.get("/dashboard", response_model=LearningDashboard)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's learning progress dashboard."""
    # Get all active modules
    mod_result = await db.execute(
        select(Module).where(Module.is_active == True).order_by(Module.order_index)
    )
    modules = mod_result.scalars().all()

    if not modules:
        # Return empty dashboard if no modules seeded yet
        return LearningDashboard(
            user_name=current_user.name,
            total_modules=0,
            mastered_modules=0,
            overall_progress_pct=0.0,
            ready_for_recommendations=False,
            modules=[],
        )

    # Get user progress for all modules
    prog_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == current_user.id)
    )
    progress_map = {str(p.module_id): p for p in prog_result.scalars().all()}

    module_responses = []
    mastered_count = 0

    for mod in modules:
        prog = progress_map.get(str(mod.id))
        module_responses.append(ModuleProgressResponse(
            module_id=mod.id,
            module_name=mod.name,
            topic=mod.topic,
            stage=prog.stage if prog else LearningStage.STORY,
            story_completed=prog.story_completed if prog else False,
            quiz_score=prog.quiz_score if prog else None,
            quiz_attempts=prog.quiz_attempts if prog else 0,
            is_mastered=prog.is_mastered if prog else False,
        ))
        if prog and prog.is_mastered:
            mastered_count += 1

    total = len(modules)
    progress_pct = (mastered_count / total * 100) if total > 0 else 0
    # Ready for recommendations when all core modules (first 3) are mastered
    core_mastered = sum(1 for m in module_responses[:3] if m.is_mastered)
    ready = core_mastered >= min(3, total)

    return LearningDashboard(
        user_name=current_user.name,
        total_modules=total,
        mastered_modules=mastered_count,
        overall_progress_pct=round(progress_pct, 1),
        ready_for_recommendations=ready,
        modules=module_responses,
    )
