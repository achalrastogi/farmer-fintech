import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, SectionLabel, ResultRow, BigResult, CalcButton, AIButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function BreakEven() {
  const { t } = useTranslation()
  const [f, setF] = useState({ sellingPrice: '', variableCost: '', fixedCost: '' })
  const [result, setResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiAnswer, setAIAnswer] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.sellingPrice && f.variableCost && f.fixedCost

  function calculate() {
    const price = Number(f.sellingPrice)
    const varCost = Number(f.variableCost)
    const fixedCost = Number(f.fixedCost)

    const contribution = price - varCost
    const breakevenQty = contribution > 0 ? fixedCost / contribution : Infinity
    const safeProduction = Math.ceil(breakevenQty * 1.2) // 20% buffer
    const marginOfSafety = contribution > 0 ? (contribution / price) * 100 : 0

    const verdict = contribution <= 0 ? 'red'
      : marginOfSafety > 40 ? 'green' : marginOfSafety > 20 ? 'yellow' : 'red'

    setResult({ price, varCost, fixedCost, contribution, breakevenQty, safeProduction, marginOfSafety, verdict })
    setShowAI(false)
    setAIAnswer('')
  }

  async function askAI() {
    if (!result) return
    setShowAI(true)
    setAILoading(true)
    const q = `मेरी फसल: बिक्री मूल्य ₹${result.price}/क्विंटल, चल लागत ₹${result.varCost}/क्विंटल, स्थायी लागत ₹${result.fixedCost}। ब्रेक-ईवन ${result.breakevenQty.toFixed(1)} क्विंटल है। ${result.verdict !== 'green' ? 'मार्जिन कम है।' : ''} लागत कैसे कम करूं?`
    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/education/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, language: 'hi' })
      })
      const data = await res.json()
      setAIAnswer(data?.answer || '• उन्नत बीज से उपज बढ़ाएं\n• सही खाद प्रबंधन से चल लागत कम करें\n• FPO से MSP पर बेचें\n• KVK से मुफ्त तकनीकी सलाह लें')
    } catch { setAIAnswer('नेटवर्क समस्या। बाद में पुनः प्रयास करें।') }
    finally { setAILoading(false) }
  }

  return (
    <CalcShell
      title={t('calc.break_even.title')}
      subtitle={t('calc.break_even.subtitle')}
      icon="⚖️"
      color="from-teal-600 to-cyan-700"
      description={t('calc.break_even.description')}
    >
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">प्रति क्विंटल</p>
        <Field label={t('calc.break_even.price_label')} value={f.sellingPrice} onChange={v => set('sellingPrice', v)} placeholder="2200" prefix="₹" suffix="/क्विंटल" />
        <Field label={t('calc.break_even.total_cost_label')} hint="बीज+खाद+मजदूरी प्रति क्विंटल" value={f.variableCost} onChange={v => set('variableCost', v)} placeholder="1400" prefix="₹" suffix="/क्विंटल" />
      </div>
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <Field label="स्थायी लागत" hint="किराया, मशीन, EMI — पूरे सीजन की" value={f.fixedCost} onChange={v => set('fixedCost', v)} placeholder="12000" prefix="₹" suffix="(सीजन)" />
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="ब्रेक-ईवन निकालें →" />

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.break_even.results_label')}</p>
            <ResultRow label={t('calc.break_even.break_even_qty')} value={`₹${fmtNum(result.contribution)}`} />
            <ResultRow label="Margin of Safety" value={`${result.marginOfSafety.toFixed(1)}%`} />
          </div>

          <BigResult
            label={t('calc.break_even.break_even_price')}
            value={result.contribution <= 0 ? 'असंभव ⚠️' : `${result.breakevenQty.toFixed(1)} क्विंटल`}
            color={result.verdict}
            sub={result.contribution <= 0 ? t('calc.break_even.verdict_loss') : t('calc.break_even.verdict_profit')}
          />

          {result.contribution > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-sm font-semibold text-gray-700">🎯 उत्पादन लक्ष्य</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">न्यूनतम (ब्रेक-ईवन)</p>
                  <p className="text-lg font-bold text-orange-700">{result.breakevenQty.toFixed(0)} क्विं.</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">सुरक्षित लक्ष्य (+20%)</p>
                  <p className="text-lg font-bold text-green-700">{result.safeProduction} क्विं.</p>
                </div>
              </div>
            </div>
          )}

          <AIButton question={t('calc.break_even.ai_question')} onClick={askAI} />
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
