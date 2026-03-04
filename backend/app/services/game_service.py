"""
Loan Comparison Game — the centrepiece practice module.
Farmers choose between loan options and see projected 12-month outcomes.
"""
import uuid
from typing import Optional
from app.models.models import CropType, Language
from app.schemas.schemas import GameScenario, LoanOption, GameOutcome


# Pre-built game scenarios for different crops/regions
GAME_SCENARIOS = {
    "wheat_punjab": {
        "description": "रबी सीजन आ गया है। {farmer_name} को गेहूं की बुवाई के लिए ₹50,000 चाहिए। नीचे दिए विकल्पों में से सबसे अच्छा कर्ज चुनें:",
        "crop": "गेहूं",
        "loan_needed": 50000,
        "purpose": "बुवाई — बीज, खाद, मजदूरी",
        "season": "रबी (अक्टूबर-मार्च)",
        "loan_options": [
            {
                "id": "moneylender",
                "lender": "गांव का साहूकार",
                "lender_type": "moneylender",
                "interest_rate_annual": 60.0,
                "interest_display": "5% प्रति माह (= 60% प्रति साल!)",
                "max_amount": 100000,
                "tenure_months": 6,
                "processing_fee": 0,
                "collateral_required": False,
                "notes": "तुरंत मिलता है, कोई कागज नहीं — लेकिन बहुत महंगा!"
            },
            {
                "id": "kcc",
                "lender": "किसान क्रेडिट कार्ड (KCC)",
                "lender_type": "govt_scheme",
                "interest_rate_annual": 4.0,
                "interest_display": "4% प्रति साल (सरकारी सब्सिडी के साथ)",
                "max_amount": 300000,
                "tenure_months": 12,
                "processing_fee": 0,
                "collateral_required": False,
                "notes": "किसी भी राष्ट्रीय बैंक से मिलता है। आधार + खसरा चाहिए।"
            },
            {
                "id": "cooperative",
                "lender": "सहकारी बैंक",
                "lender_type": "cooperative",
                "interest_rate_annual": 9.0,
                "interest_display": "9% प्रति साल",
                "max_amount": 100000,
                "tenure_months": 12,
                "processing_fee": 500,
                "collateral_required": False,
                "notes": "KCC से थोड़ा महंगा लेकिन आसानी से मिलता है।"
            }
        ]
    },
    "cotton_maharashtra": {
        "description": "खरीफ सीजन शुरू हो रहा है। {farmer_name} को कपास की बुवाई के लिए ₹75,000 चाहिए:",
        "crop": "कपास",
        "loan_needed": 75000,
        "purpose": "खरीफ बुवाई — BT कपास बीज, कीटनाशक, सिंचाई",
        "season": "खरीफ (जून-नवंबर)",
        "loan_options": [
            {
                "id": "moneylender",
                "lender": "स्थानीय साहूकार",
                "lender_type": "moneylender",
                "interest_rate_annual": 48.0,
                "interest_display": "4% प्रति माह (= 48% प्रति साल)",
                "max_amount": 200000,
                "tenure_months": 6,
                "processing_fee": 0,
                "collateral_required": True,
                "notes": "जमीन गिरवी रखनी होगी — बहुत जोखिम भरा!"
            },
            {
                "id": "kcc",
                "lender": "KCC — SBI / Bank of Maharashtra",
                "lender_type": "govt_scheme",
                "interest_rate_annual": 7.0,
                "interest_display": "7% प्रति साल (3% सब्सिडी के बाद 4% असल में)",
                "max_amount": 300000,
                "tenure_months": 12,
                "processing_fee": 0,
                "collateral_required": False,
                "notes": "Maharashtra में कपास किसानों के लिए विशेष KCC योजना।"
            },
            {
                "id": "nbfc",
                "lender": "माइक्रोफाइनेंस संस्था",
                "lender_type": "nbfc",
                "interest_rate_annual": 24.0,
                "interest_display": "24% प्रति साल",
                "max_amount": 100000,
                "tenure_months": 12,
                "processing_fee": 1500,
                "collateral_required": False,
                "notes": "KCC से महंगा, साहूकार से सस्ता — बीच का विकल्प।"
            }
        ]
    },
    "rice_tamilnadu": {
        "description": "पुंबा सीजन आने वाला है। {farmer_name} को धान की खेती के लिए ₹40,000 चाहिए:",
        "crop": "धान",
        "loan_needed": 40000,
        "purpose": "धान बुवाई — बीज, उर्वरक, पानी पंप",
        "season": "पुंबा (अगस्त-जनवरी)",
        "loan_options": [
            {
                "id": "moneylender",
                "lender": "गांव का पैसेवाला",
                "lender_type": "moneylender",
                "interest_rate_annual": 36.0,
                "interest_display": "3% प्रति माह (= 36% प्रति साल)",
                "max_amount": 50000,
                "tenure_months": 6,
                "processing_fee": 0,
                "collateral_required": True,
                "notes": "अगली फसल गिरवी रखनी होगी।"
            },
            {
                "id": "kcc",
                "lender": "KCC — Indian Bank / Canara Bank",
                "lender_type": "govt_scheme",
                "interest_rate_annual": 4.0,
                "interest_display": "4% प्रति साल",
                "max_amount": 200000,
                "tenure_months": 12,
                "processing_fee": 0,
                "collateral_required": False,
                "notes": "Tamil Nadu में धान किसानों के लिए विशेष योजना।"
            },
            {
                "id": "tnsc_bank",
                "lender": "TNSC सहकारी बैंक",
                "lender_type": "cooperative",
                "interest_rate_annual": 7.0,
                "interest_display": "7% प्रति साल",
                "max_amount": 75000,
                "tenure_months": 12,
                "processing_fee": 250,
                "collateral_required": False,
                "notes": "Tamil Nadu State Cooperative Bank — किसानों के लिए।"
            }
        ]
    }
}

# Score mapping based on choice quality
CHOICE_SCORES = {
    "kcc": 100,
    "cooperative": 70,
    "tnsc_bank": 70,
    "nbfc": 40,
    "moneylender": 10,
}

OUTCOME_RATINGS = {
    (80, 100): ("excellent", "शाबाश! 🌟 आपने सबसे समझदारी का फैसला किया!"),
    (60, 79): ("good", "अच्छा चुनाव! 👍 लेकिन और बेहतर विकल्प भी था।"),
    (30, 59): ("poor", "ठीक है, लेकिन इससे बेहतर हो सकता था। 🤔"),
    (0, 29): ("disaster", "यह फैसला बहुत महंगा पड़ेगा! ⚠️ आइए सीखते हैं क्यों।"),
}


class GameService:
    def get_scenario(
        self, crop_type: CropType, state: str, farmer_name: str
    ) -> GameScenario:
        """Get appropriate game scenario for the farmer."""
        # Map to scenario key
        scenario_map = {
            ("wheat", "punjab"): "wheat_punjab",
            ("wheat", "haryana"): "wheat_punjab",
            ("cotton", "maharashtra"): "cotton_maharashtra",
            ("rice", "tamil nadu"): "rice_tamilnadu",
            ("rice", "west bengal"): "rice_tamilnadu",
        }
        key = scenario_map.get(
            (crop_type.value, state.lower()),
            "wheat_punjab"  # default
        )
        data = GAME_SCENARIOS[key]

        options = [
            LoanOption(
                id=opt["id"],
                lender=opt["lender"],
                lender_type=opt["lender_type"],
                interest_rate_annual=opt["interest_rate_annual"],
                interest_display=opt["interest_display"],
                max_amount=opt["max_amount"],
                tenure_months=opt["tenure_months"],
                processing_fee=opt["processing_fee"],
                collateral_required=opt["collateral_required"],
                notes=opt["notes"],
            )
            for opt in data["loan_options"]
        ]

        return GameScenario(
            scenario_id=uuid.uuid4(),
            description=data["description"].format(farmer_name=farmer_name),
            farmer_name=farmer_name,
            crop=data["crop"],
            loan_needed=data["loan_needed"],
            purpose=data["purpose"],
            season=data["season"],
            loan_options=options,
        )

    def calculate_outcome(
        self,
        session_id: uuid.UUID,
        scenario_key: str,
        chosen_loan_id: str,
        farmer_name: str,
        crop_type: CropType,
        state: str,
    ) -> GameOutcome:
        """Calculate game outcome after farmer makes their loan choice."""
        scenario_map = {
            ("wheat", "punjab"): "wheat_punjab",
            ("wheat", "haryana"): "wheat_punjab",
            ("cotton", "maharashtra"): "cotton_maharashtra",
            ("rice", "tamil nadu"): "rice_tamilnadu",
            ("rice", "west bengal"): "rice_tamilnadu",
        }
        key = scenario_map.get((crop_type.value, state.lower()), "wheat_punjab")
        data = GAME_SCENARIOS[key]
        loan_needed = data["loan_needed"]

        # Find chosen loan
        chosen_raw = next((o for o in data["loan_options"] if o["id"] == chosen_loan_id), None)
        if not chosen_raw:
            raise ValueError(f"Invalid loan choice: {chosen_loan_id}")

        # Find best loan (lowest annual rate)
        best_raw = min(data["loan_options"], key=lambda o: o["interest_rate_annual"])

        chosen = LoanOption(**chosen_raw)
        tenure_years = chosen.tenure_months / 12

        # Financial calculations
        total_interest = int(loan_needed * (chosen.interest_rate_annual / 100) * tenure_years)
        total_interest += int(chosen.processing_fee)
        total_repayment = loan_needed + total_interest
        monthly_burden = total_repayment // chosen.tenure_months

        # Best option calculations for comparison
        best_interest = int(loan_needed * (best_raw["interest_rate_annual"] / 100) * (best_raw["tenure_months"] / 12))
        best_total = loan_needed + best_interest
        potential_saving = total_repayment - best_total

        # Score
        score = float(CHOICE_SCORES.get(chosen_loan_id, 50))

        # Rating
        rating, message = ("good", "अच्छा चुनाव!")
        for (low, high), (r, m) in OUTCOME_RATINGS.items():
            if low <= score <= high:
                rating, message = r, m
                break

        # Build comparison data
        if chosen_loan_id == best_raw["id"]:
            comparison = {
                "is_best": True,
                "message": f"आपने सबसे अच्छा विकल्प चुना! ✅ आप ₹{potential_saving:,} तक बचाएंगे।",
                "saved_vs_worst": potential_saving,
            }
        else:
            comparison = {
                "is_best": False,
                "best_option": best_raw["lender"],
                "best_rate": f"{best_raw['interest_rate_annual']}% प्रति साल",
                "could_have_saved": potential_saving,
                "message": f"'{best_raw['lender']}' चुनने से आप ₹{potential_saving:,} बचा सकते थे।",
            }

        return GameOutcome(
            session_id=session_id,
            chosen_loan=chosen,
            total_interest_paid=total_interest,
            total_repayment=total_repayment,
            monthly_burden=monthly_burden,
            outcome_rating=rating,
            outcome_message=message,
            comparison=comparison,
            score=score,
        )


game_service = GameService()
