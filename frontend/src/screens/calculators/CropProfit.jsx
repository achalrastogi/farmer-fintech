import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, SectionLabel, ResultRow, BigResult, RiskBar, CalcButton, AIButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function CropProfit() {
  const { t } = useTranslation()
  const [f, setF] = useState({ acres: '', yieldPerAcre: '', price: '', inputCost: '', loanInterest: '' })
  const [result, setResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiAnswer, setAIAnswer] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.acres && f.yieldPerAcre && f.price && f.inputCost

  function calculate() {
    const acres = Number(f.acres)
    const yld = Number(f.yieldPerAcre)
    const price = Number(f.price)
    const cost = Number(f.inputCost)
    const interest = Number(f.loanInterest) || 0

    const revenue = acres * yld * price
    const totalCost = cost + interest
    const profit = revenue - totalCost
    const profitPerAcre = acres > 0 ? profit / acres : 0
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    const risk = margin >= 35 ? 'green' : margin >= 20 ? 'yellow' : 'red'
    const riskLabel = margin >= 35 ? t('calc.crop_profit.risk_strong') : margin >= 20 ? t('calc.crop_profit.risk_moderate') : t('calc.crop_profit.risk_weak')

    setResult({ revenue, totalCost, profit, profitPerAcre, margin, risk, riskLabel, acres, yld, price, cost, interest })
    setShowAI(false)
    setAIAnswer('')
  }

  async function askAI() {
    if (!result) return
    setShowAI(true)
    setAILoading(true)
    const q = `मेरी फसल: ${result.acres} एकड़, उपज ${result.yld} क्विंटल/एकड़, भाव ₹${result.price}/क्विंटल। कुल आय ₹${fmtNum(Math.round(result.revenue))}, लागत ₹${fmtNum(Math.round(result.totalCost))}, मुनाफा ₹${fmtNum(Math.round(result.profit))}, मार्जिन ${result.margin.toFixed(1)}%। मेरा मुनाफा ${result.risk === 'red' ? 'बहुत कम' : result.risk === 'yellow' ? 'कम' : 'ठीक'} है — मुझे क्या सुधारना चाहिए?`
    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/education/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, language: 'hi' })
      })
      const data = await res.json()
      setAIAnswer(data?.answer || fallbackAdvice(result))
    } catch { setAIAnswer(fallbackAdvice(result)) }
    finally { setAILoading(false) }
  }

  function fallbackAdvice(r) {
    const tips = []
    if (r.margin < 20) tips.push('• लागत कम करें: KVK से मृदा परीक्षण करवाएं — सही खाद डालें, अंधाधुंध नहीं')
    if (r.yld < 20) tips.push('• उन्नत बीज और सही बुवाई समय अपनाएं — KVK से मुफ्त सलाह लें')
    if (r.price < 2000) tips.push('• MSP या FPO के माध्यम से बेचें — बिचौलिए से बचें')
    if (r.interest > r.cost * 0.2) tips.push('• KCC से ₹3 लाख तक 4% ब्याज पर कर्ज लें — साहूकार से बचें')
    if (tips.length === 0) tips.push('• PMFBY बीमा जरूर लें — अगली फसल सुरक्षित रखें')
    return `आपकी स्थिति:\n${tips.join('\n')}\n\n💡 अधिक जानकारी के लिए: KVK हेल्पलाइन 1800-180-1551`
  }

  return (
    <CalcShell
      title={t('calc.crop_profit.title')}
      subtitle={t('calc.crop_profit.subtitle')}
      icon="🌾"
      color="from-green-600 to-emerald-700"
      description={t('calc.crop_profit.description')}
    >
      {/* Inputs */}
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">📥 फसल की जानकारी</p>
        <Field label={t('calc.crop_profit.acres_label')} hint="एकड़" value={f.acres} onChange={v => set('acres', v)} placeholder="जैसे: 3" suffix="एकड़" />
        <Field label={t('calc.crop_profit.yield_label')} hint="क्विंटल" value={f.yieldPerAcre} onChange={v => set('yieldPerAcre', v)} placeholder="जैसे: 20" suffix="क्विंटल" />
        <Field label={t('calc.crop_profit.price_label')} value={f.price} onChange={v => set('price', v)} placeholder="जैसे: 2200" prefix="₹" suffix="/क्विंटल" />
      </div>

      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">💸 लागत की जानकारी</p>
        <Field label={t('calc.crop_profit.input_cost_label')} hint={t('calc.crop_profit.input_cost_hint')} value={f.inputCost} onChange={v => set('inputCost', v)} placeholder="जैसे: 45000" prefix="₹" />
        <Field label={t('calc.crop_profit.loan_interest_label')} hint={t('calc.crop_profit.loan_interest_hint')} value={f.loanInterest} onChange={v => set('loanInterest', v)} placeholder="0" prefix="₹" />
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} />

      {result && (
        <div className="space-y-3">
          {/* Result card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-0">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.crop_profit.results_label')}</p>
            <ResultRow label={t('calc.crop_profit.revenue')} value={`₹${fmtNum(Math.round(result.revenue))}`} />
            <ResultRow label={t('calc.crop_profit.total_cost')} value={`₹${fmtNum(Math.round(result.totalCost))}`} />
            <ResultRow label={t('calc.crop_profit.profit_per_acre')} value={`₹${fmtNum(Math.round(result.profitPerAcre))}`} />
          </div>

          <BigResult
            label={result.profit >= 0 ? t('calc.crop_profit.profit') : 'कुल नुकसान'}
            value={`₹${fmtNum(Math.abs(Math.round(result.profit)))}`}
            color={result.profit >= 0 ? result.risk : 'red'}
            sub={`${t('calc.crop_profit.margin')}: ${result.margin.toFixed(1)}%`}
          />

          {/* Risk meter */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">🎯 मुनाफा संकेत</p>
            <RiskBar
              pct={Math.max(0, result.margin)}
              label="Profit Margin"
              thresholds={[{ at: 20 }, { at: 35 }]}
            />
            <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium text-center
              ${result.risk === 'green' ? 'bg-green-50 text-green-700' :
                result.risk === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
              {result.riskLabel}
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>{'<'}20% कमज़ोर</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>20-35% सामान्य</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>{'>'}35% मजबूत</span>
            </div>
          </div>

          <AIButton question={t('calc.crop_profit.ai_question')} onClick={askAI} />

          {showAI && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              {aiLoading ? (
                <div className="flex gap-1.5 justify-center py-2">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              ) : (
                <p className="text-sm text-teal-800 leading-relaxed whitespace-pre-line">{aiAnswer}</p>
              )}
            </div>
          )}
        </div>
      )}
    </CalcShell>
  )
}
