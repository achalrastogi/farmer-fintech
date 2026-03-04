from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional
import uuid, logging, json

from app.db.database import get_db
from app.models.models import Scheme, UserSavedScheme, SchemeCategory, User
from app.schemas.schemas import SchemeResponse, SchemeListResponse
from app.services.auth_service import get_current_user
from app.services.bedrock_service import bedrock_service
from app.services.translation_service import (
    get_translations_bulk_with_fallback,
    get_translations_with_fallback,
)
from app.models.models import Language

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/schemes", tags=["Schemes"])


def _to_response(scheme: Scheme, saved_ids: set, trans: dict = None) -> SchemeResponse:
    """Build SchemeResponse, overlaying translations if provided."""
    t = trans or {}

    def get_json(field, fallback):
        val = t.get(field)
        if val:
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return fallback
        return fallback

    return SchemeResponse(
        id=scheme.id,
        name=t.get("name", scheme.name),
        name_hindi=t.get("name_hindi", scheme.name_hindi),
        category=scheme.category.value,
        description=t.get("description", scheme.description),
        description_hindi=t.get("description_hindi", scheme.description_hindi),
        benefit_amount=t.get("benefit_amount", scheme.benefit_amount),
        eligibility=t.get("eligibility", scheme.eligibility),
        eligibility_hindi=t.get("eligibility_hindi", scheme.eligibility_hindi),
        documents_required=get_json("documents_required", scheme.documents_required or []),
        how_to_apply=t.get("how_to_apply", scheme.how_to_apply),
        official_website=scheme.official_website,
        applicable_states=scheme.applicable_states or [],
        applicable_crops=scheme.applicable_crops or [],
        common_rejection_reasons=get_json("common_rejection_reasons", scheme.common_rejection_reasons or []),
        fraud_warning=t.get("fraud_warning", scheme.fraud_warning),
        faq_list=get_json("faq_list", scheme.faq_list or []),
        how_to_apply_steps=get_json("how_to_apply_steps", scheme.how_to_apply_steps or []),
        scheme_type=scheme.scheme_type or 'central',
        min_land_acres=scheme.min_land_acres,
        max_land_acres=scheme.max_land_acres,
        last_updated=scheme.last_updated,
        is_saved=scheme.id in saved_ids,
    )


@router.get("/", response_model=SchemeListResponse)
async def list_schemes(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    lang: Optional[str] = Query(None, description="Language code: hi, en, pa, mr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    language = lang or current_user.preferred_language.value

    query = select(Scheme).where(Scheme.is_active == True)
    if search:
        t = f"%{search.lower()}%"
        query = query.where(or_(
            Scheme.name.ilike(t), Scheme.name_hindi.ilike(t),
            Scheme.description.ilike(t),
        ))
    if category:
        try:
            query = query.where(Scheme.category == SchemeCategory(category))
        except ValueError:
            pass

    result = await db.execute(query.order_by(Scheme.name))
    schemes = result.scalars().all()

    if state:
        schemes = [s for s in schemes if not s.applicable_states or state in s.applicable_states]
    if crop:
        schemes = [s for s in schemes if not s.applicable_crops or crop in s.applicable_crops]

    saved_result = await db.execute(
        select(UserSavedScheme.scheme_id).where(UserSavedScheme.user_id == current_user.id)
    )
    saved_ids = {row[0] for row in saved_result.fetchall()}

    # Bulk-fetch translations
    scheme_ids = [s.id for s in schemes]
    all_trans = await get_translations_bulk_with_fallback(db, "scheme", scheme_ids, language)

    return SchemeListResponse(
        schemes=[_to_response(s, saved_ids, all_trans.get(s.id)) for s in schemes],
        total=len(schemes),
    )


@router.get("/saved", response_model=SchemeListResponse)
async def get_saved_schemes(
    lang: Optional[str] = Query(None, description="Language code: hi, en, pa, mr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    language = lang or current_user.preferred_language.value
    result = await db.execute(
        select(Scheme).join(UserSavedScheme, Scheme.id == UserSavedScheme.scheme_id)
        .where(UserSavedScheme.user_id == current_user.id, Scheme.is_active == True)
    )
    schemes = result.scalars().all()
    saved_ids = {s.id for s in schemes}
    scheme_ids = [s.id for s in schemes]
    all_trans = await get_translations_bulk_with_fallback(db, "scheme", scheme_ids, language)
    return SchemeListResponse(
        schemes=[_to_response(s, saved_ids, all_trans.get(s.id)) for s in schemes],
        total=len(schemes),
    )


@router.get("/{scheme_id}", response_model=SchemeResponse)
async def get_scheme(
    scheme_id: uuid.UUID,
    lang: Optional[str] = Query(None, description="Language code: hi, en, pa, mr"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    language = lang or current_user.preferred_language.value
    result = await db.execute(select(Scheme).where(Scheme.id == scheme_id))
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    saved_result = await db.execute(
        select(UserSavedScheme).where(
            UserSavedScheme.user_id == current_user.id,
            UserSavedScheme.scheme_id == scheme_id,
        )
    )
    is_saved = saved_result.scalar_one_or_none() is not None
    trans = await get_translations_with_fallback(db, "scheme", scheme.id, language)
    return _to_response(scheme, {scheme_id} if is_saved else set(), trans)


@router.post("/{scheme_id}/save")
async def toggle_save_scheme(
    scheme_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSavedScheme).where(
            UserSavedScheme.user_id == current_user.id,
            UserSavedScheme.scheme_id == scheme_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
        return {"saved": False}
    else:
        db.add(UserSavedScheme(user_id=current_user.id, scheme_id=scheme_id))
        await db.commit()
        return {"saved": True}


@router.post("/{scheme_id}/ask")
async def ask_about_scheme(
    scheme_id: uuid.UUID,
    question: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered Q&A about a specific scheme, using user profile as context."""
    result = await db.execute(select(Scheme).where(Scheme.id == scheme_id))
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    # Build rich context for the AI
    faq_text = ""
    if scheme.faq_list:
        faq_items = "\n".join([f"Q: {f['q']}\nA: {f['a']}" for f in scheme.faq_list[:5]])
        faq_text = f"\nKnown FAQs:\n{faq_items}"

    context = f"""SCHEME: {scheme.name} ({scheme.name_hindi})
Category: {scheme.category.value}
Benefit: {scheme.benefit_amount}
Eligibility: {scheme.eligibility}
Documents Required: {', '.join(scheme.documents_required or [])}
How to Apply: {scheme.how_to_apply}
Common Rejection Reasons: {', '.join(scheme.common_rejection_reasons or [])}
Official Website: {scheme.official_website or 'Not specified'}
{faq_text}

USER PROFILE:
State: {current_user.state or 'Not specified'}
Land size: {current_user.farm_size_acres} acres
Crop: {current_user.crop_type.value}
Loan amount: ₹{current_user.loan_amount:,}
Annual income: ₹{current_user.annual_income:,}

AI RULES (follow strictly):
1. Answer ONLY based on the scheme information above. Do NOT speculate.
2. Never promise eligibility or guarantee benefit payment.
3. Always recommend visiting the official portal for final verification.
4. Never give political opinions.
5. If the question is outside the scheme's scope, politely redirect to official portal.
6. Keep response under 150 words. Use simple Hindi.
7. If user profile data is relevant to the question, use it."""

    try:
        answer = await bedrock_service.answer_question(
            question=question,
            language=current_user.preferred_language,
            context=context,
        )
    except Exception as e:
        logger.warning(f"Bedrock scheme Q&A failed: {e}")
        # Intelligent fallback using FAQ matching
        answer = _faq_fallback(question, scheme)

    return {"answer": answer, "scheme_name": scheme.name_hindi}


def _faq_fallback(question: str, scheme: Scheme) -> str:
    """Smart fallback when Bedrock is unavailable — matches against scheme FAQs."""
    q_lower = question.lower()

    # Try to match against stored FAQs
    for faq in (scheme.faq_list or []):
        faq_q = faq.get('q', '').lower()
        # Simple keyword matching
        question_words = set(q_lower.split())
        faq_words = set(faq_q.split())
        if len(question_words & faq_words) >= 2:
            return faq.get('a', '')

    # Generic helpful response
    rejection_hint = ""
    if scheme.common_rejection_reasons:
        rejection_hint = f"\n\nआम अस्वीकृति कारण: {', '.join(scheme.common_rejection_reasons[:3])}"

    return (
        f"{scheme.name_hindi} के बारे में अधिक जानकारी के लिए:\n\n"
        f"✅ आधिकारिक वेबसाइट: {scheme.official_website or 'सरकारी पोर्टल'} पर जाएं\n"
        f"📞 हेल्पलाइन: 1800-180-1551 (किसान कॉल सेंटर)\n"
        f"🏛️ नज़दीकी CSC (Common Service Centre) से सहायता लें"
        f"{rejection_hint}"
    )


@router.post("/global-ask")
async def global_scheme_ask(
    question: str = Body(..., embed=True),
    user_state: str = Body(None, embed=True),
    user_acres: float = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Smart scheme-aware AI assistant. Works with or without Bedrock."""
    # Search schemes relevant to the question
    q_lower = question.lower()

    # Keyword → category mapping
    keyword_categories = {
        'pm-kisan': ['income_support'], 'किसान सम्मान': ['income_support'],
        'income': ['income_support'], 'आय': ['income_support'],
        'bima': ['insurance'], 'insurance': ['insurance'], 'बीमा': ['insurance'],
        'fasal': ['insurance'], 'फसल': ['insurance'],
        'pmfby': ['insurance'], 'crop insurance': ['insurance'],
        'subsidy': ['subsidy'], 'सब्सिडी': ['subsidy'],
        'solar': ['subsidy'], 'pump': ['subsidy'], 'सोलर': ['subsidy'],
        'drip': ['subsidy'], 'sprinkler': ['subsidy'], 'सिंचाई': ['subsidy'],
        'tractor': ['subsidy'], 'machinery': ['subsidy'], 'यंत्र': ['subsidy'],
        'kcc': ['credit'], 'loan': ['credit'], 'ऋण': ['credit'], 'credit': ['credit'],
        'kisan credit': ['credit'],
        'pension': ['pension'], 'पेंशन': ['pension'],
        'health': ['pension'], 'ayushman': ['pension'], 'स्वास्थ्य': ['pension'],
        'jeevan': ['pension'], 'life insurance': ['pension'],
        'dairy': ['subsidy'], 'fisheries': ['subsidy'], 'डेयरी': ['subsidy'],
        'matsya': ['subsidy'], 'livestock': ['subsidy'],
    }

    cats_to_search = set()
    for kw, cats in keyword_categories.items():
        if kw in q_lower:
            cats_to_search.update(cats)

    # Search full text in DB
    text_filter = f"%{question[:40]}%"
    base_query = select(Scheme).where(Scheme.is_active == True)

    if cats_to_search:
        cat_objects = []
        for c in cats_to_search:
            try:
                cat_objects.append(SchemeCategory(c))
            except ValueError:
                pass
        if cat_objects:
            from sqlalchemy import or_ as sql_or
            base_query = base_query.where(Scheme.category.in_(cat_objects))

    # Also text search
    text_query = select(Scheme).where(
        Scheme.is_active == True,
        or_(
            Scheme.name.ilike(f"%{q_lower[:30]}%"),
            Scheme.name_hindi.ilike(f"%{q_lower[:30]}%"),
            Scheme.description.ilike(f"%{q_lower[:30]}%"),
        )
    ).limit(5)

    result1 = await db.execute(base_query.limit(5))
    result2 = await db.execute(text_query)
    
    all_schemes = list(result1.scalars().all()) + list(result2.scalars().all())
    
    # Deduplicate
    seen = set()
    unique_schemes = []
    for s in all_schemes:
        if s.id not in seen:
            seen.add(s.id)
            unique_schemes.append(s)
    
    # Filter by state if provided
    state = user_state or current_user.state
    if state:
        state_filtered = [s for s in unique_schemes if not s.applicable_states or state in s.applicable_states]
        if state_filtered:
            unique_schemes = state_filtered

    # Try Bedrock first with rich context
    if unique_schemes:
        scheme_context = "\n".join([
            f"- {s.name_hindi} ({s.name}): {s.benefit_amount}. {s.description[:100]}"
            for s in unique_schemes[:5]
        ])
        context = f"""User profile: State={state or 'unknown'}, Land={user_acres or current_user.farm_size_acres} acres.
Relevant schemes found:
{scheme_context}

Answer the farmer's question based on above scheme data. Keep it under 120 words in simple Hindi."""
        try:
            answer = await bedrock_service.answer_question(
                question=question,
                language=current_user.preferred_language,
                context=context,
            )
            if not answer.startswith('[Demo Mode]'):
                return {"answer": answer, "schemes": [{"id": str(s.id), "name": s.name_hindi} for s in unique_schemes[:3]]}
        except Exception:
            pass

    # Smart rule-based fallback
    answer = _build_smart_answer(question, unique_schemes, state, user_acres or current_user.farm_size_acres)
    return {
        "answer": answer,
        "schemes": [{"id": str(s.id), "name": s.name_hindi, "benefit": s.benefit_amount} for s in unique_schemes[:4]]
    }


def _build_smart_answer(question: str, matching_schemes: list, state: str, acres: float) -> str:
    q = question.lower()

    if not matching_schemes:
        return (
            f"आपके सवाल का जवाब ढूंढने में मदद चाहिए। कृपया ये जाँचें:\n\n"
            f"📞 किसान कॉल सेंटर: 1800-180-1551 (मुफ्त)\n"
            f"🏛️ नज़दीकी कृषि विभाग कार्यालय\n"
            f"💻 agricoop.nic.in — सभी योजनाओं की जानकारी\n\n"
            f"हमारे {6} श्रेणियों में से एक चुनें — आपके सवाल से संबंधित योजनाएं मिलेंगी।"
        )

    lines = []

    # For state-specific questions
    if state and ('state' in q or 'up' in q or 'rajasthan' in q or 'राज्य' in q or
                  state.lower() in q):
        lines.append(f"📍 {state} में उपलब्ध योजनाएं:\n")

    lines.append(f"आपके सवाल से संबंधित {len(matching_schemes)} योजनाएं मिलीं:\n")
    
    for s in matching_schemes[:4]:
        lines.append(f"✅ **{s.name_hindi}**")
        lines.append(f"   💰 लाभ: {s.benefit_amount}")
        if s.eligibility_hindi:
            lines.append(f"   📋 पात्रता: {s.eligibility_hindi[:80]}...")
        lines.append("")

    # Specific helpful hints based on question type
    if any(kw in q for kw in ['क्यों नहीं', 'रुकी', 'नहीं आई', 'not received', 'stop']):
        lines.append("⚠️ भुगतान रुकने के आम कारण:\n• आधार-बैंक लिंक नहीं\n• eKYC pending\n• बैंक खाता बंद\n• भूमि रिकॉर्ड मेल नहीं")
    elif any(kw in q for kw in ['कैसे', 'apply', 'आवेदन', 'register']):
        lines.append("📝 आवेदन के लिए: नज़दीकी CSC सेंटर जाएं या आधिकारिक पोर्टल पर जाएं।")

    lines.append(f"\n⚠️ यह जानकारी शैक्षणिक है। अंतिम निर्णय आधिकारिक पोर्टल से सत्यापित करें।")
    return "\n".join(lines)
