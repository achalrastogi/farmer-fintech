from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.models import CropType, Language, LearningStage


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """
    TASK 2: Minimal registration — only name, phone, password required.
    All profile fields are optional with sensible defaults.
    """
    phone_number      : str            = Field(..., pattern=r"^\+91[6-9]\d{9}$")
    name              : str            = Field(..., min_length=2, max_length=100)
    password          : str            = Field(..., min_length=6)   # SHA-256 hash from frontend
    # Optional — filled in Profile later
    email             : Optional[str]  = None
    state             : Optional[str]  = ""
    district          : Optional[str]  = ""
    crop_type         : CropType       = CropType.WHEAT
    preferred_language: Language       = Language.HINDI
    farm_size_acres   : float          = Field(default=2.0, gt=0)
    annual_income     : int            = Field(default=100000, gt=0)
    loan_amount       : int            = Field(default=0, ge=0)
    monthly_expenses  : int            = Field(default=8000, gt=0)


class UserLogin(BaseModel):
    """
    TASK 3: Login with phone number OR email.
    Frontend sends whichever the user typed.
    """
    identifier: str   # phone (+91XXXXXXXXXX) or email address
    password  : str   # SHA-256 hash from frontend


class TokenResponse(BaseModel):
    access_token    : str
    token_type      : str  = "bearer"
    user_id         : str
    name            : str
    profile_complete: bool = False   # TASK 2 — frontend uses to show personalization banner


class UserProfile(BaseModel):
    id                : UUID
    phone_number      : str
    email             : Optional[str] = None
    name              : str
    state             : Optional[str] = ""
    district          : Optional[str] = ""
    crop_type         : CropType
    preferred_language: Language
    farm_size_acres   : float
    annual_income     : int
    loan_amount       : int  = 0
    monthly_expenses  : int  = 8000
    created_at        : datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name              : Optional[str]   = None
    email             : Optional[str]   = None
    state             : Optional[str]   = None
    district          : Optional[str]   = None
    crop_type         : Optional[str]   = None
    preferred_language: Optional[str]   = None
    farm_size_acres   : Optional[float] = None
    annual_income     : Optional[int]   = None
    loan_amount       : Optional[int]   = None
    monthly_expenses  : Optional[int]   = None


# ─── Story Schemas ─────────────────────────────────────────────────────────────

class StoryRequest(BaseModel):
    topic       : str            = Field(..., description="e.g. crop_loan, insurance, savings")
    language    : Language       = Language.HINDI
    crop_type   : Optional[CropType] = None
    farmer_name : Optional[str]  = None


class StoryResponse(BaseModel):
    id          : UUID
    title       : str
    content     : str
    topic       : str
    language    : Language
    key_concepts: List[str]
    was_cached  : bool
    audio_hint  : str = ""


class AskQuestionRequest(BaseModel):
    question         : str      = Field(..., min_length=3, max_length=500)
    context_story_id : Optional[UUID] = None
    language         : Language = Language.HINDI


class AskQuestionResponse(BaseModel):
    answer    : str
    disclaimer: str = "यह शैक्षणिक जानकारी है, वित्तीय सलाह नहीं।"
    was_cached: bool


# ─── Progress Schemas ──────────────────────────────────────────────────────────

class ModuleProgressResponse(BaseModel):
    module_id       : UUID
    module_name     : str
    topic           : str
    stage           : LearningStage
    story_completed : bool
    quiz_score      : Optional[float]
    quiz_attempts   : int
    is_mastered     : bool

    class Config:
        from_attributes = True


class LearningDashboard(BaseModel):
    user_name                : str
    total_modules            : int
    mastered_modules         : int
    overall_progress_pct     : float
    ready_for_recommendations: bool
    modules                  : List[ModuleProgressResponse]


# ─── Quiz Schemas ──────────────────────────────────────────────────────────────

class QuizOption(BaseModel):
    id  : str
    text: str


class QuizQuestion(BaseModel):
    id      : UUID
    question: str
    options : List[QuizOption]

    class Config:
        from_attributes = True


class QuizSubmission(BaseModel):
    module_id: UUID
    answers  : dict


class QuizResult(BaseModel):
    score          : float
    passed         : bool
    pass_threshold : float = 0.80
    correct_count  : int
    total_questions: int
    feedback       : List[dict]
    message        : str


# ─── Game Schemas ──────────────────────────────────────────────────────────────

class LoanOption(BaseModel):
    id                  : str
    lender              : str
    lender_type         : str
    interest_rate_annual: float
    interest_display    : str
    max_amount          : int
    tenure_months       : int
    processing_fee      : float
    collateral_required : bool
    notes               : str


class GameScenario(BaseModel):
    scenario_id : UUID
    description : str
    farmer_name : str
    crop        : str
    loan_needed : int
    purpose     : str
    season      : str
    loan_options: List[LoanOption]


class GameDecision(BaseModel):
    session_id     : UUID
    chosen_loan_id : str


class GameOutcome(BaseModel):
    session_id        : UUID
    chosen_loan       : LoanOption
    total_interest_paid: int
    total_repayment   : int
    monthly_burden    : int
    outcome_rating    : str
    outcome_message   : str
    comparison        : dict
    score             : float


# ─── Recommendation Schemas ────────────────────────────────────────────────────

class ProductRecommendation(BaseModel):
    id                  : UUID
    name                : str
    product_type        : str
    provider            : str
    description         : str
    interest_rate       : Optional[float]
    max_amount          : Optional[int]
    is_government_scheme: bool
    why_recommended     : str
    key_benefits        : List[str]
    how_to_apply        : str
    documents_needed    : List[str]

    class Config:
        from_attributes = True


class RecommendationsResponse(BaseModel):
    ready          : bool
    message        : str
    recommendations: List[ProductRecommendation]
    disclaimer     : str = "ये सिफारिशें शैक्षणिक उद्देश्यों के लिए हैं।"


# ─── Scheme Schemas ────────────────────────────────────────────────────────────

class SchemeResponse(BaseModel):
    id                      : UUID
    name                    : str
    name_hindi              : str
    category                : str
    description             : str
    description_hindi       : str
    benefit_amount          : str
    eligibility             : str
    eligibility_hindi       : str
    documents_required      : List[str]
    how_to_apply            : str
    official_website        : Optional[str]
    applicable_states       : List[str]
    applicable_crops        : List[str]
    common_rejection_reasons: List[str]
    fraud_warning           : Optional[str]
    faq_list                : List[dict] = []
    how_to_apply_steps      : List[str] = []
    scheme_type             : str = 'central'
    min_land_acres          : Optional[float] = None
    max_land_acres          : Optional[float] = None
    last_updated            : datetime
    is_saved                : bool = False

    class Config:
        from_attributes = True


class SchemeListResponse(BaseModel):
    schemes: List[SchemeResponse]
    total  : int


# ─── Lesson Schemas ────────────────────────────────────────────────────────────

class LessonSummary(BaseModel):
    id                : UUID
    title             : str
    title_hindi       : str
    related_calculator: Optional[str]
    order_index       : int

    class Config:
        from_attributes = True


class LessonDetail(BaseModel):
    id                : UUID
    title             : str
    title_hindi       : str
    key_points        : List[str]
    example           : str
    simple_calculation: Optional[str]
    common_mistakes   : List[str]
    try_this          : Optional[str]
    related_calculator: Optional[str]

    class Config:
        from_attributes = True


class LessonCategoryResponse(BaseModel):
    id        : UUID
    name      : str
    name_hindi: str
    icon      : str
    lessons   : List[LessonSummary]

    class Config:
        from_attributes = True


# ─── Home / Snapshot Schema ────────────────────────────────────────────────────

class FarmSnapshot(BaseModel):
    estimated_annual_profit: int
    profit_per_acre        : int
    loan_risk_level        : str
    loan_risk_label        : str
    emergency_fund_status  : str
    emergency_fund_label   : str
    tip_of_day             : str
