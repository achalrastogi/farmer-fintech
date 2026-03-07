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

    # -------------------------------------------------------
    # Build request body depending on model type
    # -------------------------------------------------------
    def _build_request(self, prompt: str, max_tokens: int, system: Optional[str] = None):

        model_id = settings.BEDROCK_MODEL_ID.lower()

        # Claude models
        if "anthropic" in model_id or "claude" in model_id:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }

            if system:
                body["system"] = system

            return body

        # Nova models
        if "nova" in model_id:
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": max_tokens,
                    "temperature": 0.3
                }
            }

            if system:
                body["system"] = [
                    {"text": system}
                ]

            return body

        # Generic fallback
        return {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

    # -------------------------------------------------------
    # Extract response text safely
    # -------------------------------------------------------
    def _extract_text(self, body: dict) -> str:

        # Claude format
        if "content" in body:
            return body["content"][0]["text"]

        # Nova format
        if "output" in body:
            return body["output"]["message"]["content"][0]["text"]

        return ""

    # -------------------------------------------------------
    # Question Answering
    # -------------------------------------------------------
    async def answer_question(
        self,
        question: str,
        language: Language,
        context: Optional[str] = None
    ) -> str:

        if settings.BEDROCK_MOCK_MODE:
            return f"[Demo Mode] आपका प्रश्न: '{question}' — AWS Bedrock enable होने के बाद यहाँ उत्तर आएगा।"

        lang_name = LANGUAGE_NAMES.get(language, "Hindi")

        system_prompt = """
You are a financial literacy educator for rural Indian farmers.

Rules:
- Only answer financial education questions
- Use simple language
- Keep answer under 100 words
- Use rupee examples where relevant
- If outside financial topic, redirect politely
"""

        user_prompt = f"""
Question from a farmer (answer in {lang_name}):

{question}

{("Context from story: " + context) if context else ""}
"""

        try:

            client = self._get_client()

            request_body = self._build_request(
                prompt=user_prompt,
                max_tokens=300,
                system=system_prompt
            )

            response = client.invoke_model(
                modelId=settings.BEDROCK_MODEL_ID,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json",
            )

            body = json.loads(response["body"].read())

            return self._extract_text(body)

        except ClientError as e:

            logger.error(f"Bedrock Q&A error: {e}")

            # Preserve existing fallback behavior
            return "माफ करें, अभी उत्तर देने में समस्या है। कृपया बाद में प्रयास करें।"


# Singleton instance
bedrock_service = BedrockService()

