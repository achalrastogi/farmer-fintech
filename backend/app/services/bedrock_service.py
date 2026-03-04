"""
AWS Bedrock Service — Story Generation via Claude 3 Sonnet
Implements template-first approach for cost efficiency:
  - 90% of stories use templates with variable substitution (zero Bedrock cost)
  - Bedrock used only for personalization/complex queries
"""

import json
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import logging

from app.core.config import settings
from app.models.models import CropType, Language

logger = logging.getLogger(__name__)


# ─── Language display names ───────────────────────────────────────────────────
LANGUAGE_NAMES = {
    Language.HINDI: "Hindi",
    Language.PUNJABI: "Punjabi",
    Language.TELUGU: "Telugu",
    Language.TAMIL: "Tamil",
    Language.MARATHI: "Marathi",
    Language.BENGALI: "Bengali",
    Language.ENGLISH: "English",
}

# ─── Story Templates (Template-first, Bedrock-fallback) ───────────────────────
STORY_TEMPLATES = {
    "crop_loan": {
        "wheat": {
            "title": "{farmer_name} की गेहूं की फसल और कर्ज का फैसला",
            "template": """
{farmer_name} {district}, {state} में {farm_size} एकड़ जमीन पर गेहूं उगाते हैं।
बुवाई का मौसम आया। बीज, खाद और मजदूरी के लिए ₹{loan_amount} की जरूरत थी।

गांव के साहूकार ने कहा: "मैं दे दूंगा — बस 5% प्रति महीना।"
बैंक ने कहा: "7% प्रति साल।"

{farmer_name} ने सोचा — "साहूकार के 5% तो बैंक के 7% से कम है!"

लेकिन रुकिए। आइए गणना करते हैं:
📊 साहूकार: 5% × 12 महीने = 60% प्रति साल!
📊 बैंक: 7% प्रति साल = सिर्फ 7%!

₹{loan_amount} पर फर्क:
💸 साहूकार को ब्याज: ₹{moneylender_interest}
🏦 बैंक को ब्याज: ₹{bank_interest}
✅ बचत: ₹{savings}

{farmer_name} ने बैंक से कर्ज लिया। फसल कटाई पर आराम से चुकाया।

सीख: हमेशा "प्रति महीना" ब्याज को "प्रति साल" में बदलकर तुलना करें!
            """.strip()
        },
        "cotton": {
            "title": "{farmer_name} का कपास और सही कर्ज",
            "template": """
{farmer_name} {district}, {state} में {farm_size} एकड़ में कपास उगाते हैं।
बुवाई से पहले ₹{loan_amount} की जरूरत पड़ी।

महाराष्ट्र में किसानों के लिए KCC (Kisan Credit Card) है — 4% ब्याज पर!
गांव के साहूकार ने 3% प्रति महीना मांगा।

3% महीना = 36% साल बनाम KCC का 4% साल।

₹{loan_amount} पर:
🏦 KCC ब्याज: ₹{bank_interest}
💸 साहूकार ब्याज: ₹{moneylender_interest}
✅ KCC से बचत: ₹{savings}

{farmer_name} ने नज़दीकी बैंक से KCC बनवाई। ब्याज में हजारों बचाए।
            """.strip()
        },
        "rice": {
            "title": "{farmer_name} की धान की फसल और समझदारी",
            "template": """
{farmer_name} {district}, {state} में धान उगाते हैं।
खरीफ सीजन में ₹{loan_amount} की जरूरत थी।

PM-Kisan Samman Nidhi से ₹6,000 साल में मिलते हैं।
Fasal Bima Yojana से फसल बीमा मिलता है।

{farmer_name} को इन योजनाओं की जानकारी नहीं थी।
साहूकार से 4% महीना (48% साल!) पर कर्ज लिया।

बाद में पता चला:
✅ KCC मिलती — 4% साल पर
✅ PM-Kisan — मुफ्त ₹2,000 हर 4 महीने
✅ Fasal Bima — बाढ़/सूखे में सुरक्षा

सरकारी योजनाओं की जानकारी ही सबसे बड़ी पूंजी है!
            """.strip()
        }
    },
    "insurance": {
        "wheat": {
            "title": "जब बेमौसम बारिश ने {farmer_name} की फसल बर्बाद की",
            "template": """
{farmer_name} ने {farm_size} एकड़ में गेहूं बोया। लागत लगाई ₹{loan_amount}।

मार्च में ओलावृष्टि हो गई। पूरी फसल बर्बाद।

{farmer_name} के पड़ोसी रमेश ने Pradhan Mantri Fasal Bima Yojana लिया था।
उन्हें मिला: ₹{insurance_payout} का मुआवजा।
बीमा प्रीमियम? केवल 1.5% — यानी ₹{premium}!

{farmer_name} ने बीमा नहीं लिया था। उन्हें कुछ नहीं मिला।

Rabi फसलों का बीमा प्रीमियम: सिर्फ 1.5%
Kharif फसलों का: सिर्फ 2%

अगले साल {farmer_name} ने बीमा लिया। मन में सुकून आया।
            """.strip()
        }
    },
    "savings": {
        "wheat": {
            "title": "{farmer_name} ने सीखा — बचत कैसे करें",
            "template": """
{farmer_name} हर साल गेहूं बेचते। पैसे घर में रखते।

एक दिन बेटे की पढ़ाई के लिए पैसे चाहिए थे — नहीं थे।

पड़ोसी ने बताया: बैंक में Recurring Deposit (RD) खोलो।
हर महीने ₹500 जमा करो। 7% ब्याज मिलेगा।

5 साल में:
💰 जमा: ₹30,000
💰 ब्याज: ₹5,600
💰 कुल: ₹35,600

घर में रखने पर: ₹30,000 (चोरी/नुकसान का खतरा + महंगाई से घटती कीमत)

Jan Dhan खाता + RD = सुरक्षित भविष्य
            """.strip()
        }
    }
}


# ─── Mock responses for development (when Bedrock not yet enabled) ─────────────
MOCK_BEDROCK_RESPONSES = {
    "crop_loan": "यह एक AI-जनित कहानी है। [MOCK MODE - Enable AWS Bedrock for real content]",
    "default": "AI content will appear here once AWS Bedrock is enabled."
}


class BedrockService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = boto3.client(
                "bedrock-runtime",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
            )
        return self._client

    async def generate_story(
        self,
        topic: str,
        crop_type: CropType,
        language: Language,
        farmer_name: str,
        district: str,
        state: str,
        farm_size_acres: float,
        loan_amount: int = 50000,
    ) -> dict:
        """
        Generate a personalized financial education story.
        Strategy: Template first → Bedrock personalization if needed.
        """
        # Step 1: Try template-based generation (FREE, instant)
        story = self._generate_from_template(
            topic=topic,
            crop_type=crop_type,
            farmer_name=farmer_name,
            district=district,
            state=state,
            farm_size_acres=farm_size_acres,
            loan_amount=loan_amount,
        )

        if story:
            return {**story, "was_cached": False, "source": "template"}

        # Step 2: Fall back to Bedrock (costs tokens, but personalizes deeply)
        bedrock_story = await self._generate_via_bedrock(
            topic=topic,
            crop_type=crop_type,
            language=language,
            farmer_name=farmer_name,
            district=district,
            state=state,
            farm_size_acres=farm_size_acres,
            loan_amount=loan_amount,
        )
        return {**bedrock_story, "was_cached": False, "source": "bedrock"}

    def _generate_from_template(
        self, topic: str, crop_type: CropType,
        farmer_name: str, district: str, state: str,
        farm_size_acres: float, loan_amount: int,
    ) -> Optional[dict]:
        """Fill in story templates — zero AI cost."""
        crop_key = crop_type.value
        templates = STORY_TEMPLATES.get(topic, {})

        # Try specific crop, fall back to wheat template
        template_data = templates.get(crop_key) or templates.get("wheat")
        if not template_data:
            return None

        # Calculate financial figures for the story
        bank_rate = 0.07  # 7% per year
        moneylender_rate = 0.60  # 5%/month = 60%/year
        premium_rate = 0.015  # 1.5% insurance premium

        bank_interest = int(loan_amount * bank_rate)
        moneylender_interest = int(loan_amount * moneylender_rate)
        savings = moneylender_interest - bank_interest
        insurance_payout = int(loan_amount * 0.8)
        premium = int(loan_amount * premium_rate)

        variables = {
            "farmer_name": farmer_name,
            "district": district,
            "state": state,
            "farm_size": f"{farm_size_acres:.1f}",
            "loan_amount": f"{loan_amount:,}",
            "bank_interest": f"{bank_interest:,}",
            "moneylender_interest": f"{moneylender_interest:,}",
            "savings": f"{savings:,}",
            "insurance_payout": f"{insurance_payout:,}",
            "premium": f"{premium:,}",
        }

        title = template_data["title"].format(**variables)
        content = template_data["template"].format(**variables)

        concept_map = {
            "crop_loan": ["ब्याज दर की तुलना", "प्रति माह vs प्रति साल", "KCC कार्ड", "बैंक vs साहूकार"],
            "insurance": ["फसल बीमा", "PMFBY", "प्रीमियम", "मुआवजा"],
            "savings": ["RD खाता", "Jan Dhan", "ब्याज की शक्ति", "सुरक्षित बचत"],
        }

        return {
            "title": title,
            "content": content,
            "key_concepts": concept_map.get(topic, ["वित्तीय साक्षरता"]),
        }

    async def _generate_via_bedrock(
        self, topic: str, crop_type: CropType, language: Language,
        farmer_name: str, district: str, state: str,
        farm_size_acres: float, loan_amount: int,
    ) -> dict:
        """Generate story via AWS Bedrock Claude 3 Sonnet."""

        if settings.BEDROCK_MOCK_MODE:
            # Return mock for development before Bedrock is enabled
            return {
                "title": f"{farmer_name} की वित्तीय यात्रा [Demo Mode]",
                "content": f"""
{farmer_name} {district}, {state} के एक किसान हैं जो {crop_type.value} उगाते हैं।

[यह डेमो मोड है। AWS Bedrock सक्रिय होने के बाद यहाँ AI-generated कहानी दिखेगी।]

मुख्य विषय: {topic}
किसान का नाम: {farmer_name}
जमीन: {farm_size_acres} एकड़
जरूरी राशि: ₹{loan_amount:,}

AWS Bedrock enable करने के लिए:
1. AWS Console → Bedrock → Model Access
2. "Claude 3 Sonnet" request करें
3. .env में BEDROCK_MOCK_MODE=false करें
                """.strip(),
                "key_concepts": ["वित्तीय साक्षरता", "बैंकिंग", topic],
            }

        lang_name = LANGUAGE_NAMES.get(language, "Hindi")

        prompt = f"""You are a financial literacy educator for rural Indian farmers.

Create a short, engaging educational story (200-250 words) in {lang_name} about: {topic}

Character details:
- Farmer name: {farmer_name}
- Location: {district}, {state}
- Crop: {crop_type.value}
- Farm size: {farm_size_acres} acres
- Financial need: ₹{loan_amount:,}

Story requirements:
1. Use simple language a low-literacy farmer can understand
2. Include a concrete financial mistake and its consequence
3. Show the correct financial decision with actual numbers (rupee amounts)
4. End with 1-2 clear "key learnings" (सीख)
5. Be culturally relevant to Indian farming context
6. Include relevant government schemes if applicable (PM-Kisan, KCC, PMFBY, etc.)

Format your response as JSON:
{{
  "title": "Story title in {lang_name}",
  "content": "Full story in {lang_name}",
  "key_concepts": ["concept1", "concept2", "concept3"]
}}

Respond ONLY with the JSON, no other text."""

        try:
            client = self._get_client()
            response = client.invoke_model(
                modelId=settings.BEDROCK_MODEL_ID,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": settings.BEDROCK_MAX_TOKENS,
                    "messages": [{"role": "user", "content": prompt}],
                }),
                contentType="application/json",
                accept="application/json",
            )
            body = json.loads(response["body"].read())
            text = body["content"][0]["text"]
            return json.loads(text)

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"Bedrock error [{error_code}]: {e}")
            if error_code == "AccessDeniedException":
                raise ValueError(
                    "AWS Bedrock access denied. Please enable Claude 3 Sonnet in "
                    "AWS Console → Bedrock → Model Access (ap-south-1 region)."
                )
            raise

    async def answer_question(
        self, question: str, language: Language,
        context: Optional[str] = None
    ) -> str:
        """Answer a farmer's financial question via Bedrock."""

        if settings.BEDROCK_MOCK_MODE:
            return f"[Demo Mode] आपका प्रश्न: '{question}' — AWS Bedrock enable होने के बाद यहाँ उत्तर आएगा।"

        lang_name = LANGUAGE_NAMES.get(language, "Hindi")

        system_prompt = """You are a financial literacy educator for rural Indian farmers.
Answer ONLY financial education questions. For medical, legal, or political questions, politely redirect.
Keep answers simple, under 100 words, with concrete rupee examples where relevant.
Always answer in the requested language."""

        user_prompt = f"""Question from a farmer (answer in {lang_name}): {question}

{"Context from story they just read: " + context if context else ""}

Rules:
- Only answer financial education topics
- Use simple language
- Give practical examples with rupee amounts
- If question is outside financial scope, redirect politely
- Do NOT give specific financial advice — educational information only"""

        try:
            client = self._get_client()
            response = client.invoke_model(
                modelId=settings.BEDROCK_MODEL_ID,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 300,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                }),
                contentType="application/json",
                accept="application/json",
            )
            body = json.loads(response["body"].read())
            return body["content"][0]["text"]

        except ClientError as e:
            logger.error(f"Bedrock Q&A error: {e}")
            return "माफ करें, अभी उत्तर देने में समस्या है। कृपया बाद में प्रयास करें।"


# Singleton
bedrock_service = BedrockService()
