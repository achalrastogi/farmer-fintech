import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, SectionLabel, ResultRow, BigResult, RiskBar, CalcButton, AIButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function LoanROI() {
  const { t } = useTranslation()
  const [f, setF] = useState({ loanAmount: '', interestRate: '', extraIncome: '' })
  const [result, setResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [aiAnswer, setAIAnswer] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.loanAmount && f.interestRate && f.extraIncome

  function calculate() {
    const loan = Number(f.loanAmount)
    const rate = Number(f.interestRate)
    const income = Number(f.extraIncome)

    const interestCost = loan * (rate / 100)
    const roi = (income / loan) * 100
    const netGain = income - interestCost

    const verdict = roi > rate + 5 ? 'green'
      : roi > rate - 5 ? 'yellow' : 'red'
    const verdictLabel = verdict === 'green'
      ? `✅ ${t('calc.loan_roi.verdict_good')} — ROI (${roi.toFixed(1)}%) > ब्याज (${rate}%)`
      : verdict === 'yellow'
      ? `⚠️ ${t('calc.loan_roi.verdict_risky')} — ROI और ब्याज लगभग बराबर`
      : `🔴 ${t('calc.loan_roi.verdict_bad')} — ROI (${roi.toFixed(1)}%) < ब्याज (${rate}%)`

    setResult({ loan, rate, income, interestCost, roi, netGain, verdict, verdictLabel })
    setShowAI(false)
    setAIAnswer('')
  }

  async function askAI() {
    if (!result) return
    setShowAI(true)
    setAILoading(true)
    const q = `मैंने ₹${fmtNum(result.loan)} का कर्ज ${result.rate}% ब्याज पर लिया। इससे अतिरिक्त आय ₹${fmtNum(result.income)}/वर्ष होगी। ROI ${result.roi.toFixed(1)}% है और ब्याज खर्च ₹${fmtNum(Math.round(result.interestCost))} है। ${result.verdict !== 'green' ? 'यह कर्ज जोखिम भरा लग रहा है।' : ''} क्या करूं?`
    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/education/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, language: 'hi' })
      })
      const data = await res.json()
      setAIAnswer(data?.answer || fallback(result))
    } catch { setAIAnswer(fallback(result)) }
    finally { setAILoading(false) }
  }

  function fallback(r) {
    if (r.verdict === 'red') return `⚠️ यह कर्ज फायदेमंद नहीं लगता:\n\n• कर्ज राशि कम करें\n• अनुमानित आय दोबारा जाँचें\n• KCC से 4% ब्याज पर कर्ज लेने की कोशिश करें\n• PM-KISAN/PMFBY सब्सिडी से खर्च कम करें\n\n📞 KCC के लिए नज़दीकी बैंक जाएं`
    if (r.verdict === 'yellow') return `⚖️ सावधानी बरतें:\n\n• उपज बढ़ाने के उपाय करें\n• बेहतर भाव के लिए FPO/eNAM से बेचें\n• अगर अनिश्चित हों तो कम कर्ज लें`
    return `✅ यह कर्ज फायदेमंद है!\n\n• समय पर चुकाएं — KCC पर 3% और छूट मिलेगी\n• अतिरिक्त आय बचत खाते में रखें\n• PMFBY बीमा जरूर लें`
  }

  return (
    <CalcShell
      title={t('calc.loan_roi.title')}
      subtitle={t('calc.loan_roi.subtitle')}
      icon="🏦"
      color="from-blue-600 to-indigo-700"
      description={t('calc.loan_roi.description')}
    >
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">📥 कर्ज की जानकारी</p>
        <Field label={t('calc.loan_roi.loan_amount_label')} value={f.loanAmount} onChange={v => set('loanAmount', v)} placeholder="50000" prefix="₹" />
        <Field label={t('calc.loan_roi.interest_rate_label')} value={f.interestRate} onChange={v => set('interestRate', v)} placeholder="जैसे: 7" suffix="% प्रति वर्ष" />
        <Field label={t('calc.loan_roi.extra_income_label')} hint={t('calc.loan_roi.extra_income_hint')} value={f.extraIncome} onChange={v => set('extraIncome', v)} placeholder="जैसे: 25000" prefix="₹" />
      </div>

      {/* Tip */}
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
        💡 <strong>KCC ब्याज:</strong> 4% प्रति वर्ष | <strong>साहूकार:</strong> 36-72% प्रति वर्ष — सही स्रोत से लोन लें
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="ROI जाँचें →" />

      {result && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.loan_roi.results_label')}</p>
            <ResultRow label={t('calc.loan_roi.interest_cost')} value={`₹${fmtNum(Math.round(result.interestCost))}`} />
            <ResultRow label={t('calc.loan_roi.extra_income_label')} value={`₹${fmtNum(result.income)}`} />
            <ResultRow label={t('calc.loan_roi.roi')} value={`${result.roi.toFixed(1)}%`} />
            <ResultRow label={t('calc.loan_roi.interest_rate_label')} value={`${result.rate}%`} />
          </div>

          <BigResult
            label={t('calc.loan_roi.net_gain')}
            value={`${result.netGain >= 0 ? '+' : ''}₹${fmtNum(Math.abs(Math.round(result.netGain)))}`}
            color={result.verdict}
            sub={result.verdictLabel}
          />

          {/* ROI vs Interest visual */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">ROI vs ब्याज दर</p>
            <div className="flex items-end gap-3 h-16">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-blue-400 transition-all"
                  style={{ height: `${Math.min(100, (result.roi / Math.max(result.roi, result.rate)) * 60)}px` }} />
                <span className="text-xs text-gray-600">ROI {result.roi.toFixed(0)}%</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-orange-400 transition-all"
                  style={{ height: `${Math.min(100, (result.rate / Math.max(result.roi, result.rate)) * 60)}px` }} />
                <span className="text-xs text-gray-600">ब्याज {result.rate}%</span>
              </div>
            </div>
          </div>

          <AIButton question={t('calc.loan_roi.ai_question')} onClick={askAI} />
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
