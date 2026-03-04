import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, ResultRow, BigResult, CalcButton, AIButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function StorageDecision() {
  const { t } = useTranslation()
  const [f, setF] = useState({ qty: '', currentPrice: '', expectedPrice: '', storageCost: '' })
  const [result, setResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiAnswer, setAIAnswer] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.qty && f.currentPrice && f.expectedPrice

  function calculate() {
    const qty = Number(f.qty)
    const curr = Number(f.currentPrice)
    const exp = Number(f.expectedPrice)
    const storageCost = Number(f.storageCost) || 0

    const sellNow = qty * curr
    const extraGain = (exp - curr) * qty
    const netGain = extraGain - storageCost

    const verdict = netGain > 1000 ? 'green' : netGain >= 0 ? 'yellow' : 'red'
    const decision = netGain > 1000
      ? t('calc.storage.verdict_store')
      : netGain >= 0
      ? t('calc.storage.verdict_sell')
      : t('calc.storage.verdict_sell')

    setResult({ qty, curr, exp, sellNow, extraGain, storageCost, netGain, verdict, decision })
    setShowAI(false)
    setAIAnswer('')
  }

  async function askAI() {
    if (!result) return
    setShowAI(true)
    setAILoading(true)
    const q = `मेरे पास ${result.qty} क्विंटल फसल है। अभी ₹${result.curr}/क्विंटल, बाद में ₹${result.exp}/क्विंटल मिलेगा। भंडारण लागत ₹${result.storageCost}। शुद्ध लाभ ₹${fmtNum(Math.round(result.netGain))} होगा। ${result.verdict === 'red' ? 'भंडारण नुकसानदेह है।' : 'भंडारण फायदेमंद है।'} मुझे क्या करना चाहिए?`
    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/education/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, language: 'hi' })
      })
      const data = await res.json()
      setAIAnswer(data?.answer || (result.verdict === 'red'
        ? '⚠️ अभी बेचना बेहतर है। भंडारण लागत और मूल्य अनिश्चितता से नुकसान हो सकता है।\n\n💡 वेयरहाउस रसीद से कर्ज लेकर बेचने का इंतजार कर सकते हैं — Agrifinance portals देखें।'
        : '✅ भंडारण फायदेमंद है। WDRA रजिस्टर्ड वेयरहाउस में रखें — सुरक्षित और NWR ऋण भी मिलता है।'))
    } catch { setAIAnswer('नेटवर्क समस्या। कृपया फिर प्रयास करें।') }
    finally { setAILoading(false) }
  }

  return (
    <CalcShell
      title={t('calc.storage.title')}
      subtitle={t('calc.storage.subtitle')}
      icon="🏚️"
      color="from-amber-600 to-orange-700"
      description={t('calc.storage.description')}
    >
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <Field label={t('calc.storage.qty_label')} value={f.qty} onChange={v => set('qty', v)} placeholder="20" suffix="क्विंटल" />
        <Field label={t('calc.storage.current_price_label')} value={f.currentPrice} onChange={v => set('currentPrice', v)} placeholder="1800" prefix="₹" suffix="/क्विंटल" />
        <Field label={t('calc.storage.expected_price_label')} value={f.expectedPrice} onChange={v => set('expectedPrice', v)} placeholder="2200" prefix="₹" suffix="/क्विंटल" />
        <Field label={t('calc.storage.storage_cost_label')} hint="वैकल्पिक" value={f.storageCost} onChange={v => set('storageCost', v)} placeholder="0" prefix="₹" />
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="निर्णय लें →" />

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.storage.results_label')}</p>
            <ResultRow label={t('calc.storage.price_gain')} value={`₹${fmtNum(Math.round(result.sellNow))}`} />
            <ResultRow label={t('calc.storage.storage_cost_total')} value={`₹${fmtNum(Math.round(result.extraGain))}`} />
            <ResultRow label={t('calc.storage.interest_cost')} value={`₹${fmtNum(Math.round(result.storageCost))}`} />
          </div>

          <BigResult
            label={t('calc.storage.net_gain')}
            value={`${result.netGain >= 0 ? '+' : ''}₹${fmtNum(Math.abs(Math.round(result.netGain)))}`}
            color={result.verdict}
            sub={result.decision}
          />

          {/* Simple comparison visual */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className={`rounded-xl p-3 border-2 ${result.verdict === 'red' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-xl">💰</p>
                <p className="text-xs font-semibold text-gray-700 mt-1">अभी बेचें</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">₹{fmtNum(Math.round(result.sellNow))}</p>
              </div>
              <div className={`rounded-xl p-3 border-2 ${result.verdict !== 'red' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-xl">🏚️</p>
                <p className="text-xs font-semibold text-gray-700 mt-1">बाद में बेचें</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">₹{fmtNum(Math.round(result.sellNow + result.netGain))}</p>
              </div>
            </div>
          </div>

          <AIButton question={t('calc.storage.ai_question')} onClick={askAI} />
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
