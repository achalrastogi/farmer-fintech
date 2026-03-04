from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.models.models import User, UserProgress, UserSavedScheme
from app.schemas.schemas import FarmSnapshot, UserUpdateRequest, UserProfile
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/home", tags=["Home"])

TIPS = [
    "KCC (किसान क्रेडिट कार्ड) पर ब्याज दर सिर्फ 4% है — साहूकार से 15 गुना सस्ता।",
    "फसल बीमा (PMFBY) के लिए प्रीमियम सिर्फ 1.5% है। अगर फसल बर्बाद हो तो पूरा मुआवजा मिलता है।",
    "PM-Kisan योजना से हर साल ₹6,000 सीधे आपके खाते में आते हैं। आवेदन करें।",
    "5% प्रति माह = 60% प्रति वर्ष। साहूकार का कर्ज सबसे महंगा होता है।",
    "आपातकालीन फंड = 3 महीने का खर्च। इसे बचत खाते में रखें।",
    "MSP (न्यूनतम समर्थन मूल्य) पर बेचें — बाजार से ज्यादा मिलता है।",
    "फसल काटने से पहले बाजार भाव जांचें। भंडारण से 20-30% ज्यादा मिल सकता है।",
]

RISK_THRESHOLDS = {
    "low": 0.3,       # loan < 30% of annual income
    "moderate": 0.6,  # loan 30-60% of annual income
}


def _compute_snapshot(user: User) -> FarmSnapshot:
    # Simplified profit estimation based on crop and farm size
    PROFIT_PER_ACRE = {"wheat": 18000, "cotton": 25000, "rice": 20000, "other": 15000}
    crop_key = user.crop_type.value if user.crop_type else "other"
    profit_per_acre = PROFIT_PER_ACRE.get(crop_key, 15000)
    annual_profit = int(profit_per_acre * user.farm_size_acres)

    # Loan risk
    loan = user.loan_amount or 0
    income = user.annual_income or 100000
    ratio = loan / income if income > 0 else 0

    if ratio < RISK_THRESHOLDS["low"]:
        risk_level = "low"
        risk_label = "✅ कम जोखिम"
    elif ratio < RISK_THRESHOLDS["moderate"]:
        risk_level = "moderate"
        risk_label = "⚠️ मध्यम जोखिम"
    else:
        risk_level = "high"
        risk_label = "🔴 अधिक जोखिम"

    # Emergency fund — target = 3 months of expenses
    monthly_exp = user.monthly_expenses or 8000
    target = monthly_exp * 3
    # We don't track savings explicitly — use income proxy
    estimated_savings = max(0, (user.annual_income or 0) // 12 - monthly_exp)
    fund_ready = estimated_savings >= target

    import datetime
    tip = TIPS[datetime.date.today().timetuple().tm_yday % len(TIPS)]

    return FarmSnapshot(
        estimated_annual_profit=annual_profit,
        profit_per_acre=profit_per_acre,
        loan_risk_level=risk_level,
        loan_risk_label=risk_label,
        emergency_fund_status="ready" if fund_ready else "not_ready",
        emergency_fund_label="✅ तैयार" if fund_ready else "❌ तैयार नहीं",
        tip_of_day=tip,
    )


@router.get("/snapshot", response_model=FarmSnapshot)
async def get_farm_snapshot(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the personalised farm snapshot for the home dashboard."""
    return _compute_snapshot(current_user)


@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile fields. Only provided fields are updated."""
    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user
