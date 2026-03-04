import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
import enum

from app.db.database import Base


class CropType(str, enum.Enum):
    WHEAT  = "wheat"
    COTTON = "cotton"
    RICE   = "rice"
    OTHER  = "other"


class Language(str, enum.Enum):
    HINDI   = "hi"
    PUNJABI = "pa"
    TELUGU  = "te"
    TAMIL   = "ta"
    MARATHI = "mr"
    BENGALI = "bn"
    ENGLISH = "en"


class LearningStage(str, enum.Enum):
    STORY          = "story"
    PRACTICE       = "practice"
    RECOMMENDATION = "recommendation"


class SchemeCategory(str, enum.Enum):
    INCOME_SUPPORT = "income_support"
    SUBSIDY        = "subsidy"
    INSURANCE      = "insurance"
    CREDIT         = "credit"
    PENSION        = "pension"
    INFRASTRUCTURE = "infrastructure"


class User(Base):
    __tablename__ = "users"

    id               : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number     : Mapped[str]       = mapped_column(String(20), unique=True, index=True)
    # TASK 3 — email login support (optional, unique when provided)
    email            : Mapped[str]       = mapped_column(String(255), unique=True, index=True, nullable=True)
    name             : Mapped[str]       = mapped_column(String(100))
    # TASK 2 — state/district now nullable; users fill them in Profile later
    state            : Mapped[str]       = mapped_column(String(50),  nullable=True, default="")
    district         : Mapped[str]       = mapped_column(String(100), nullable=True, default="")
    crop_type        : Mapped[CropType]  = mapped_column(SAEnum(CropType, values_callable=lambda x: [e.value for e in x]),  default=CropType.WHEAT)
    preferred_language: Mapped[Language] = mapped_column(SAEnum(Language, values_callable=lambda x: [e.value for e in x]),  default=Language.HINDI)
    farm_size_acres  : Mapped[float]     = mapped_column(Float,   default=2.0)
    annual_income    : Mapped[int]       = mapped_column(Integer, default=100000)
    loan_amount      : Mapped[int]       = mapped_column(Integer, default=0)
    monthly_expenses : Mapped[int]       = mapped_column(Integer, default=8000)
    hashed_password  : Mapped[str]       = mapped_column(String(255))
    is_active        : Mapped[bool]      = mapped_column(Boolean, default=True)
    created_at       : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)
    updated_at       : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    progress     : Mapped[list["UserProgress"]]    = relationship("UserProgress",    back_populates="user")
    game_sessions: Mapped[list["GameSession"]]     = relationship("GameSession",     back_populates="user")
    saved_schemes: Mapped[list["UserSavedScheme"]] = relationship("UserSavedScheme", back_populates="user")


class StoryTemplate(Base):
    __tablename__ = "story_templates"

    id           : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title        : Mapped[str]       = mapped_column(String(200))
    topic        : Mapped[str]       = mapped_column(String(100))
    crop_type    : Mapped[CropType]  = mapped_column(SAEnum(CropType, values_callable=lambda x: [e.value for e in x]))
    template_text: Mapped[str]       = mapped_column(Text)
    key_concepts : Mapped[list]      = mapped_column(JSON, default=list)
    difficulty_level: Mapped[int]    = mapped_column(Integer, default=1)
    embedding    : Mapped[list]      = mapped_column(Vector(384), nullable=True)
    is_active    : Mapped[bool]      = mapped_column(Boolean, default=True)
    created_at   : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)


class GeneratedStory(Base):
    __tablename__ = "generated_stories"

    id          : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    template_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("story_templates.id"), nullable=True)
    topic       : Mapped[str]       = mapped_column(String(100))
    language    : Mapped[Language]  = mapped_column(SAEnum(Language, values_callable=lambda x: [e.value for e in x]))
    title       : Mapped[str]       = mapped_column(String(200))
    content     : Mapped[str]       = mapped_column(Text)
    key_concepts: Mapped[list]      = mapped_column(JSON, default=list)
    was_cached  : Mapped[bool]      = mapped_column(Boolean, default=False)
    created_at  : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)


class Module(Base):
    __tablename__ = "modules"

    id                    : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name                  : Mapped[str]       = mapped_column(String(200))
    description           : Mapped[str]       = mapped_column(Text)
    topic                 : Mapped[str]       = mapped_column(String(100))
    order_index           : Mapped[int]       = mapped_column(Integer)
    prerequisite_module_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=True)
    pass_threshold        : Mapped[float]     = mapped_column(Float, default=0.80)
    is_active             : Mapped[bool]      = mapped_column(Boolean, default=True)


class UserProgress(Base):
    __tablename__ = "user_progress"

    id              : Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         : Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    module_id       : Mapped[uuid.UUID]     = mapped_column(UUID(as_uuid=True), ForeignKey("modules.id"))
    stage           : Mapped[LearningStage] = mapped_column(SAEnum(LearningStage, values_callable=lambda x: [e.value for e in x]), default=LearningStage.STORY)
    story_completed : Mapped[bool]          = mapped_column(Boolean, default=False)
    quiz_score      : Mapped[float]         = mapped_column(Float,   nullable=True)
    quiz_attempts   : Mapped[int]           = mapped_column(Integer, default=0)
    is_mastered     : Mapped[bool]          = mapped_column(Boolean, default=False)
    completed_at    : Mapped[datetime]      = mapped_column(DateTime, nullable=True)
    updated_at      : Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="progress")


class Quiz(Base):
    __tablename__ = "quizzes"

    id            : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id     : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("modules.id"))
    question      : Mapped[str]       = mapped_column(Text)
    options       : Mapped[list]      = mapped_column(JSON)
    correct_option: Mapped[str]       = mapped_column(String(5))
    explanation   : Mapped[str]       = mapped_column(Text)
    language      : Mapped[Language]  = mapped_column(SAEnum(Language, values_callable=lambda x: [e.value for e in x]), default=Language.HINDI)


class GameSession(Base):
    __tablename__ = "game_sessions"

    id             : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    game_type      : Mapped[str]       = mapped_column(String(50), default="loan_comparison")
    scenario_data  : Mapped[dict]      = mapped_column(JSON)
    decisions      : Mapped[list]      = mapped_column(JSON, default=list)
    final_score    : Mapped[float]     = mapped_column(Float,   nullable=True)
    outcome_summary: Mapped[str]       = mapped_column(Text,    nullable=True)
    is_completed   : Mapped[bool]      = mapped_column(Boolean, default=False)
    created_at     : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)
    completed_at   : Mapped[datetime]  = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="game_sessions")


class Scheme(Base):
    __tablename__ = "schemes"

    id                      : Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name                    : Mapped[str]               = mapped_column(String(200), index=True)
    name_hindi              : Mapped[str]               = mapped_column(String(200))
    category                : Mapped[SchemeCategory]    = mapped_column(SAEnum(SchemeCategory, values_callable=lambda x: [e.value for e in x]))
    description             : Mapped[str]               = mapped_column(Text)
    description_hindi       : Mapped[str]               = mapped_column(Text)
    benefit_amount          : Mapped[str]               = mapped_column(String(200))
    eligibility             : Mapped[str]               = mapped_column(Text)
    eligibility_hindi       : Mapped[str]               = mapped_column(Text)
    documents_required      : Mapped[list]              = mapped_column(JSON, default=list)
    how_to_apply            : Mapped[str]               = mapped_column(Text)
    official_website        : Mapped[str]               = mapped_column(String(300), nullable=True)
    applicable_states       : Mapped[list]              = mapped_column(JSON, default=list)
    applicable_crops        : Mapped[list]              = mapped_column(JSON, default=list)
    common_rejection_reasons: Mapped[list]              = mapped_column(JSON, default=list)
    fraud_warning           : Mapped[str]               = mapped_column(Text,    nullable=True)
    faq_list                : Mapped[list]              = mapped_column(JSON, default=list)
    how_to_apply_steps      : Mapped[list]              = mapped_column(JSON, default=list)
    scheme_type             : Mapped[str]               = mapped_column(String(20), default='central')
    min_land_acres          : Mapped[float]             = mapped_column(Float, nullable=True)
    max_land_acres          : Mapped[float]             = mapped_column(Float, nullable=True)
    last_updated            : Mapped[datetime]          = mapped_column(DateTime, default=datetime.utcnow)
    is_active               : Mapped[bool]              = mapped_column(Boolean,  default=True)

    saved_by: Mapped[list["UserSavedScheme"]] = relationship("UserSavedScheme", back_populates="scheme")


class UserSavedScheme(Base):
    __tablename__ = "user_saved_schemes"

    id        : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id   : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    scheme_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schemes.id"))
    saved_at  : Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)

    user  : Mapped["User"]   = relationship("User",   back_populates="saved_schemes")
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="saved_by")


class LessonCategory(Base):
    __tablename__ = "lesson_categories"

    id         : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       : Mapped[str]       = mapped_column(String(100))
    name_hindi : Mapped[str]       = mapped_column(String(100))
    icon       : Mapped[str]       = mapped_column(String(10))
    order_index: Mapped[int]       = mapped_column(Integer)
    is_active  : Mapped[bool]      = mapped_column(Boolean, default=True)

    lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="category")


class Lesson(Base):
    __tablename__ = "lessons"

    id                 : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id        : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lesson_categories.id"))
    title              : Mapped[str]       = mapped_column(String(200))
    title_hindi        : Mapped[str]       = mapped_column(String(200))
    key_points         : Mapped[list]      = mapped_column(JSON, default=list)
    example            : Mapped[str]       = mapped_column(Text)
    simple_calculation : Mapped[str]       = mapped_column(Text,    nullable=True)
    common_mistakes    : Mapped[list]      = mapped_column(JSON, default=list)
    try_this           : Mapped[str]       = mapped_column(Text,    nullable=True)
    related_calculator : Mapped[str]       = mapped_column(String(50), nullable=True)
    order_index        : Mapped[int]       = mapped_column(Integer)
    is_active          : Mapped[bool]      = mapped_column(Boolean, default=True)

    category: Mapped["LessonCategory"] = relationship("LessonCategory", back_populates="lessons")


class FinancialProduct(Base):
    __tablename__ = "financial_products"

    id                 : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name               : Mapped[str]       = mapped_column(String(200))
    product_type       : Mapped[str]       = mapped_column(String(50))
    provider           : Mapped[str]       = mapped_column(String(200))
    description        : Mapped[str]       = mapped_column(Text)
    eligibility_criteria: Mapped[dict]     = mapped_column(JSON)
    interest_rate      : Mapped[float]     = mapped_column(Float,   nullable=True)
    max_amount         : Mapped[int]       = mapped_column(Integer, nullable=True)
    applicable_crops   : Mapped[list]      = mapped_column(JSON, default=list)
    applicable_states  : Mapped[list]      = mapped_column(JSON, default=list)
    is_government_scheme: Mapped[bool]     = mapped_column(Boolean, default=False)
    is_active          : Mapped[bool]      = mapped_column(Boolean, default=True)
    embedding          : Mapped[list]      = mapped_column(Vector(384), nullable=True)


class ContentTranslation(Base):
    """
    Generic translations table.
    Stores per-field translations for any entity (scheme, lesson, lesson_category).

    entity_type = 'scheme' | 'lesson' | 'lesson_category'
    entity_id   = UUID of the source row
    language    = 'hi' | 'en' | 'pa' | 'mr' | ...
    field       = column name being translated (e.g. 'name', 'description', 'eligibility')
    value       = translated text
    """
    __tablename__ = "content_translations"

    id          : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type : Mapped[str]       = mapped_column(String(30), index=True)
    entity_id   : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    language    : Mapped[str]       = mapped_column(String(5), index=True)
    field       : Mapped[str]       = mapped_column(String(50))
    value       : Mapped[str]       = mapped_column(Text)
