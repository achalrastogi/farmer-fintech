from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User, FinancialProduct, UserProgress
from app.schemas.schemas import RecommendationsResponse, ProductRecommendation
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Hardcoded government schemes and products for MVP
# In production: fetched from DB with vector similarity search
PRODUCTS = [
    {
        "name": "Kisan Credit Card (KCC)",
        "product_type": "loan",
        "provider": "All Nationalized Banks (SBI, PNB, BOI, etc.)",
        "description": "सरकारी किसान ऋण योजना — फसली कर्ज के लिए सबसे सस्ता विकल्प।",
        "interest_rate": 4.0,
        "max_amount": 300000,
        "is_government_scheme": True,
        "applicable_crops": ["wheat", "cotton", "rice", "other"],
        "applicable_states": ["all"],
        "eligibility": {"min_land": 0.1, "documents": ["आधार", "जमीन के कागज (खसरा)", "फोटो"]},
        "why_recommended": "आपकी फसल के लिए सबसे कम ब्याज दर (4% प्रति साल) और सरकारी सुरक्षा।",
        "key_benefits": [
            "4% ब्याज (सब्सिडी के बाद)",
            "₹3 लाख तक बिना गारंटी के",
            "ATM कार्ड से कभी भी पैसे निकालें",
            "फसल बीमा शामिल",
        ],
        "how_to_apply": "नज़दीकी SBI / PNB / Bank of Baroda शाखा जाएं या PM-Kisan पोर्टल पर आवेदन करें।",
        "documents_needed": ["आधार कार्ड", "भूमि रिकॉर्ड (खसरा/खतौनी)", "पासपोर्ट फोटो", "बैंक पासबुक"],
    },
    {
        "name": "PM Fasal Bima Yojana (PMFBY)",
        "product_type": "insurance",
        "provider": "Agriculture Insurance Company of India",
        "description": "प्रधानमंत्री फसल बीमा योजना — प्राकृतिक आपदा में फसल नुकसान की भरपाई।",
        "interest_rate": None,
        "max_amount": 200000,
        "is_government_scheme": True,
        "applicable_crops": ["wheat", "cotton", "rice", "other"],
        "applicable_states": ["all"],
        "eligibility": {"min_land": 0.1},
        "why_recommended": "बाढ़, सूखा, ओलावृष्टि — किसी भी आपदा में मुआवजा मिलेगा।",
        "key_benefits": [
            "रबी फसलों पर सिर्फ 1.5% प्रीमियम",
            "खरीफ फसलों पर सिर्फ 2% प्रीमियम",
            "नुकसान होने पर पूरी भरपाई",
            "ऑनलाइन क्लेम प्रक्रिया",
        ],
        "how_to_apply": "बुवाई के 10 दिन के अंदर नज़दीकी बैंक या CSC केंद्र पर जाएं। KCC से आवेदन अपने आप हो जाता है।",
        "documents_needed": ["आधार कार्ड", "बैंक खाता", "बुवाई का प्रमाण"],
    },
    {
        "name": "PM-Kisan Samman Nidhi",
        "product_type": "govt_scheme",
        "provider": "Government of India — Ministry of Agriculture",
        "description": "हर साल ₹6,000 सीधे आपके बैंक खाते में — बिना किसी शर्त के।",
        "interest_rate": None,
        "max_amount": 6000,
        "is_government_scheme": True,
        "applicable_crops": ["wheat", "cotton", "rice", "other"],
        "applicable_states": ["all"],
        "eligibility": {"land_ownership": True},
        "why_recommended": "यह मुफ्त पैसा है! हर 4 महीने में ₹2,000 — कोई ब्याज नहीं, कोई वापसी नहीं।",
        "key_benefits": [
            "₹6,000 प्रति वर्ष",
            "हर 4 महीने ₹2,000 की किस्त",
            "सीधे बैंक खाते में",
            "बुवाई, खाद, दवाई पर खर्च करें",
        ],
        "how_to_apply": "pmkisan.gov.in पर रजिस्टर करें या नज़दीकी CSC / पटवारी से मिलें।",
        "documents_needed": ["आधार कार्ड", "बैंक खाता नंबर", "भूमि रिकॉर्ड"],
    },
    {
        "name": "Jan Dhan Savings Account + RD",
        "product_type": "savings",
        "provider": "All Scheduled Commercial Banks",
        "description": "Jan Dhan खाते में Recurring Deposit से सुरक्षित बचत — 7% ब्याज के साथ।",
        "interest_rate": 7.0,
        "max_amount": None,
        "is_government_scheme": True,
        "applicable_crops": ["wheat", "cotton", "rice", "other"],
        "applicable_states": ["all"],
        "eligibility": {},
        "why_recommended": "घर में पैसे रखना खतरनाक है। बैंक में रखने पर ब्याज मिलता है और सुरक्षित रहता है।",
        "key_benefits": [
            "7% ब्याज प्रति वर्ष",
            "कोई न्यूनतम बैलेंस नहीं",
            "₹2 लाख का दुर्घटना बीमा मुफ्त",
            "RuPay डेबिट कार्ड",
        ],
        "how_to_apply": "किसी भी बैंक में जाएं। सिर्फ आधार कार्ड और फोटो चाहिए।",
        "documents_needed": ["आधार कार्ड", "पासपोर्ट फोटो"],
    },
]


@router.get("/", response_model=RecommendationsResponse)
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get personalized financial product recommendations.
    Only available after user has completed core learning modules.
    """
    # Check learning progress
    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.is_mastered == True,
        )
    )
    mastered = prog_result.scalars().all()
    mastered_count = len(mastered)

    # Check if ready (at least 1 module mastered for MVP, or skip if no modules seeded)
    # In production: require 3+ core modules mastered
    ready = mastered_count >= 1

    if not ready and mastered_count == 0:
        # Check if modules exist at all
        mod_result = await db.execute(select(FinancialProduct).limit(1))
        # If no modules are seeded yet, show recommendations anyway for demo
        pass

    # Filter products by user's crop and state
    relevant = [
        p for p in PRODUCTS
        if (
            current_user.crop_type.value in p["applicable_crops"]
            and ("all" in p["applicable_states"] or current_user.state.lower() in p["applicable_states"])
        )
    ]

    # Government schemes first (our priority)
    relevant.sort(key=lambda p: (not p["is_government_scheme"], p["product_type"]))

    import uuid as _uuid
    recommendations = [
        ProductRecommendation(
            id=_uuid.uuid4(),
            name=p["name"],
            product_type=p["product_type"],
            provider=p["provider"],
            description=p["description"],
            interest_rate=p.get("interest_rate"),
            max_amount=p.get("max_amount"),
            is_government_scheme=p["is_government_scheme"],
            why_recommended=p["why_recommended"],
            key_benefits=p["key_benefits"],
            how_to_apply=p["how_to_apply"],
            documents_needed=p["documents_needed"],
        )
        for p in relevant
    ]

    if not ready:
        return RecommendationsResponse(
            ready=False,
            message=f"अभी {mastered_count} मॉड्यूल पूरे किए हैं। सिफारिशें पाने के लिए कम से कम 3 मॉड्यूल पास करें।",
            recommendations=[],
        )

    return RecommendationsResponse(
        ready=True,
        message=f"शाबाश! {mastered_count} विषय सीखे। आपके लिए {len(recommendations)} उत्पाद उपयुक्त हैं:",
        recommendations=recommendations,
    )
