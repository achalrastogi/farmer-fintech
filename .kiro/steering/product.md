---
inclusion: auto
---

# Product Overview

Rural Farmer Fintech Education Platform — an education-first fintech platform for 800+ million rural Indian farmers (wheat, cotton, rice). Built for AI for Bharat Hackathon.

## Core Problem

Farmers fall into debt traps not due to lack of access, but lack of financial knowledge. A farmer who doesn't understand "5% per month = 60% per year" will always choose the moneylender over KCC (Kisan Credit Card).

## Solution Approach

Education-first: Farmers learn through structured lessons, interactive calculators, and government scheme discovery. Trust through knowledge, not sales pressure.

Learning flow: Structured Lessons → Interactive Calculators → Government Schemes → Personalized Dashboard

## Key Features

### Current Implementation (Phase 1)
- **126 structured financial lessons** across 8 modules (Farm Financial Empowerment Workbook)
- **8 interactive financial calculators** (Crop Profit, Loan ROI, EMI Safety, Storage Decision, Emergency Fund, Break-Even, Crop Comparison, Cost Leakage)
- **Government scheme database** with AI-powered Q&A (6 categories: Income Support, Insurance, Subsidy, Credit, Allied Activities, Pension)
- **Personalized dashboard** with farm snapshot, profit estimation, and risk assessment
- **Multi-language support** (Hindi, Punjabi, Marathi, English with fallback chain)
- **AI Assistant** (AWS Bedrock Claude 3 Sonnet) for scheme Q&A and financial concepts
- **Mobile-first PWA** optimized for low-end Android devices (8.0+, 1GB RAM)
- **2G-compatible** (64 kbps minimum, 10-second load time)

### Phase 2 (Months 7–12)
- Voice interface integration (Bhashini TTS/STT)
- Offline-first with Service Worker caching
- WhatsApp Bot Integration
- Community Forum
- Additional sections: Loans, Cash Flow, Risk, Market, Wealth Growth

### Phase 3 (Year 2)
- Direct loan application via partner bank APIs
- Real-time commodity price and weather data
- Desktop web version
- Full video lesson content
- Advanced AI story generation

## Target Impact

- 10,000 pilot farmers (Punjab wheat — Phase 1)
- 80% can explain interest rate difference after completing lessons
- 40% apply for formal credit vs moneylenders
- ₹15,000 average savings per user per year
- AI cost < ₹0.50 per user per month

## Demo Credentials

Phone: +919999999999
Password: demo1234

## Data Compliance

All data stays in ap-south-1 (Mumbai) — DPDPA 2023 compliant. TLS 1.3 in transit, AES-256 at rest (AWS KMS).
