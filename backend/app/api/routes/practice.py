import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.dynamo import (
    save_game_session, complete_game_session, get_user_game_history
)
from app.models.models import User, Quiz, UserProgress, Module, LearningStage
from app.schemas.schemas import (
    QuizQuestion, QuizOption, QuizSubmission, QuizResult,
    GameScenario, GameDecision, GameOutcome,
)
from app.services.auth_service import get_current_user
from app.services.game_service import game_service

router = APIRouter(prefix="/practice", tags=["Practice"])


# ─── Quiz Routes ─────────────────────────────────────────────────────────────

@router.get("/quiz/{module_id}", response_model=list[QuizQuestion])
async def get_quiz(
    module_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get quiz questions for a module."""
    result = await db.execute(select(Quiz).where(Quiz.module_id == module_id))
    questions = result.scalars().all()
    if not questions:
        raise HTTPException(status_code=404, detail="इस मॉड्यूल के लिए प्रश्न नहीं मिले।")
    return [
        QuizQuestion(id=q.id, question=q.question, options=[QuizOption(**o) for o in q.options])
        for q in questions
    ]


@router.post("/quiz/submit", response_model=QuizResult)
async def submit_quiz(
    payload: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit quiz answers and get score + per-question feedback."""
    result = await db.execute(select(Quiz).where(Quiz.module_id == payload.module_id))
    questions = result.scalars().all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    correct = 0
    feedback = []
    for q in questions:
        user_answer = payload.answers.get(str(q.id))
        is_correct = user_answer == q.correct_option
        if is_correct:
            correct += 1
        feedback.append({
            "question_id": str(q.id),
            "question": q.question,
            "your_answer": user_answer,
            "correct_answer": q.correct_option,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    score = correct / len(questions) if questions else 0
    passed = score >= 0.80

    # Update UserProgress in RDS
    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.module_id == payload.module_id,
        )
    )
    progress = prog_result.scalar_one_or_none()
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            module_id=payload.module_id,
            stage=LearningStage.PRACTICE,
            story_completed=True,
        )
        db.add(progress)

    progress.quiz_score = score
    progress.quiz_attempts += 1
    if passed:
        progress.is_mastered = True
        progress.stage = LearningStage.RECOMMENDATION
        progress.completed_at = datetime.utcnow()
    await db.commit()

    if passed:
        message = f"🎉 शाबाश! आपने {correct}/{len(questions)} सही उत्तर दिए। अगला विषय अनलॉक हो गया!"
    elif score >= 0.5:
        message = f"अच्छी कोशिश! {correct}/{len(questions)} सही। 80% चाहिए — एक बार और प्रयास करें!"
    else:
        message = f"कोई बात नहीं! {correct}/{len(questions)} सही। कहानी दोबारा पढ़ें फिर प्रयास करें।"

    return QuizResult(
        score=round(score * 100, 1),
        passed=passed,
        correct_count=correct,
        total_questions=len(questions),
        feedback=feedback,
        message=message,
    )


# ─── Game Routes — sessions stored in DynamoDB ───────────────────────────────

@router.post("/game/start", response_model=GameScenario)
async def start_game(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a Loan Comparison Game session. Session saved to DynamoDB."""
    scenario = game_service.get_scenario(
        crop_type=current_user.crop_type,
        state=current_user.state,
        farmer_name=current_user.name.split()[0],
    )

    # Save to DynamoDB (replaces RDS GameSession table)
    await save_game_session(
        session_id=str(scenario.scenario_id),
        user_id=str(current_user.id),
        scenario_data={
            "description": scenario.description,
            "crop": scenario.crop,
            "loan_needed": scenario.loan_needed,
            "loan_options": [opt.model_dump() for opt in scenario.loan_options],
        },
    )
    return scenario


@router.post("/game/decide", response_model=GameOutcome)
async def make_game_decision(
    payload: GameDecision,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit loan choice, calculate outcome, persist to DynamoDB."""
    outcome = game_service.calculate_outcome(
        session_id=payload.session_id,
        scenario_key="",
        chosen_loan_id=payload.chosen_loan_id,
        farmer_name=current_user.name.split()[0],
        crop_type=current_user.crop_type,
        state=current_user.state,
    )

    await complete_game_session(
        session_id=str(payload.session_id),
        user_id=str(current_user.id),
        chosen_loan_id=payload.chosen_loan_id,
        final_score=outcome.score,
        outcome_summary=outcome.outcome_message,
    )
    return outcome


@router.get("/game/sessions")
async def get_game_history(
    current_user: User = Depends(get_current_user),
):
    """Get user's completed game sessions from DynamoDB."""
    sessions = await get_user_game_history(str(current_user.id))
    return [
        {
            "session_id": s.get("session_id"),
            "final_score": s.get("final_score"),
            "outcome_summary": s.get("outcome_summary"),
            "chosen_loan": s.get("chosen_loan"),
            "completed_at": s.get("completed_at"),
        }
        for s in sessions
    ]
