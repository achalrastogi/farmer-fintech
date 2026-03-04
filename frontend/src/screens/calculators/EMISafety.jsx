import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, ResultRow, BigResult, RiskBar, CalcButton, AIButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function EMISafety() {
  const { t } = useTranslation()
  const [f, setF] = useState({ surplus: '', emi: '' })
  const [result, setResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiAnswer, setAIAnswer] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.surplus && f.emi

  function calculate() {
    const surplus = Number(f.surplus)
    const emi = Number(f.emi)
    const pct = surplus > 0 ? (emi / surplus) * 100 : 100

    const verdict = pct < 30 ? 'green' : pct < 50 ? 'yellow' : 'red'
    const verdictLabel = pct < 30
      ? t('calc.emi_safety.risk_safe')
      : pct < 50
      ? t('calc.emi_safety.risk_caution')
      : t('calc.emi_safety.risk_danger')
    const advice = pct < 30
      ? 'EMI आपकी मासिक बचत का 30% से कम है। यह कर्ज सुरक्षित है।'
      : pct < 50
      ? 'EMI बचत का 30-50% है। कोई आपात स्थिति में मुश्किल हो सकती है।'
      : 'EMI बचत के आधे से ज्यादा है। यह कर्ज मत लें — वित्तीय संकट आ सकता है।'
    const remaining = surplus - emi

    setResult({ surplus, emi, pct, verdict, verdictLabel, advice, remaining })
    setShowAI(false)
    setAIAnswer('')
  }

  async function askAI() {
    if (!result) return
    setShowAI(true)
    setAILoading(true)
    const q = `मेरी मासिक बचत ₹${fmtNum(result.surplus)} है और EMI ₹${fmtNum(result.emi)} है। EMI/बचत अनुपात ${result.pct.toFixed(1)}% है। ${result.verdict !== 'green' ? 'यह जोखिम भरा है।' : ''} मुझे क्या करना चाहिए?`
    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/education/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, language: 'hi' })
      })
      const data = await res.json()
      setAIAnswer(data?.answer || (result.verdict === 'red' ? '⚠️ यह कर्ज न लें। पहले EMI कम करने के तरीके खोजें।' : '✅ EMI ठीक है। समय पर चुकाते रहें।'))
    } catch { setAIAnswer(result.verdict === 'red' ? '⚠️ EMI बहुत अधिक है। कर्ज न लें।' : '✅ EMI ठीक है।') }
    finally { setAILoading(false) }
  }

  return (
    <CalcShell
      title={t('calc.emi_safety.title')}
      subtitle={t('calc.emi_safety.subtitle')}
      icon="📊"
      color="from-purple-600 to-violet-700"
      description={t('calc.emi_safety.description')}
    >
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">📥 मासिक जानकारी</p>
        <Field
          label={t('calc.emi_safety.monthly_income_label')}
          hint="आय − खर्च"
          value={f.surplus}
          onChange={v => set('surplus', v)}
          placeholder="जैसे: 15000"
          prefix="₹"
        />
        <Field
          label={t('calc.emi_safety.emi_label')}
          value={f.emi}
          onChange={v => set('emi', v)}
          placeholder="जैसे: 4000"
          prefix="₹"
        />
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="EMI जाँचें →" />

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.emi_safety.results_label')}</p>
            <ResultRow label={t('calc.emi_safety.monthly_income_label')} value={`₹${fmtNum(result.surplus)}`} />
            <ResultRow label={t('calc.emi_safety.emi_label')} value={`₹${fmtNum(result.emi)}`} />
            <ResultRow label={t('calc.emi_safety.excess_emi')} value={`₹${fmtNum(result.remaining)}`} />
          </div>

          {/* Visual bar meter */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-4">📈 EMI मीटर</p>
            <RiskBar
              pct={result.pct}
              label={t('calc.emi_safety.emi_ratio')}
              thresholds={[{ at: 30 }, { at: 50 }]}
            />
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>{'<'}30% सुरक्षित</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>30-50% जोखिम</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>{'>'}50% खतरा</span>
            </div>
          </div>

          <BigResult
            label={result.verdictLabel}
            value={`${result.pct.toFixed(1)}%`}
            color={result.verdict}
            sub={result.advice}
          />

          <AIButton question={t('calc.emi_safety.ai_question')} onClick={askAI} />
          {showAI && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              {aiLoading
                ? <div className="flex gap-1.5 justify-center py-2">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                : <p className="text-sm text-teal-800 leading-relaxed whitespace-pre-line">{aiAnswer}</p>}
            </div>
          )}
        </div>
      )}
    </CalcShell>
  )
}
