import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, SectionLabel, ResultRow, BigResult, CalcButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

export default function EmergencyFund() {
  const { t } = useTranslation()
  const [f, setF] = useState({ householdExpense: '', farmFixedExpense: '', currentSavings: '' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canCalc = f.householdExpense || f.farmFixedExpense

  function calculate() {
    const household = Number(f.householdExpense) || 0
    const farm = Number(f.farmFixedExpense) || 0
    const savings = Number(f.currentSavings) || 0

    // Formula: (6 × Household) + (3 × Farm Fixed)
    const target = (6 * household) + (3 * farm)
    const gap = Math.max(0, target - savings)
    const pct = target > 0 ? Math.min(100, (savings / target) * 100) : 0

    const status = pct >= 100 ? 'green' : pct >= 50 ? 'yellow' : 'red'
    const statusLabel = pct >= 100
      ? t('calc.emergency.status_ready')
      : pct >= 50
      ? t('calc.emergency.status_partial')
      : t('calc.emergency.status_start')

    const monthly6 = gap > 0 ? Math.ceil(gap / 6) : 0
    const monthly12 = gap > 0 ? Math.ceil(gap / 12) : 0
    const monthly18 = gap > 0 ? Math.ceil(gap / 18) : 0

    setResult({ household, farm, savings, target, gap, pct, status, statusLabel, monthly6, monthly12, monthly18 })
  }

  return (
    <CalcShell
      title={t('calc.emergency.title')}
      subtitle={t('calc.emergency.subtitle')}
      icon="🛡️"
      color="from-red-600 to-rose-700"
      description={t('calc.emergency.description')}
    >
      <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
        <Field label={t('calc.emergency.monthly_expense_label')} hint="भोजन, दवाई, पढ़ाई, बिजली" value={f.householdExpense} onChange={v => set('householdExpense', v)} placeholder="8000" prefix="₹" />
        <Field label={t('calc.emergency.farming_expense_label')} hint="सिंचाई, EMI, ट्रैक्टर किराया" value={f.farmFixedExpense} onChange={v => set('farmFixedExpense', v)} placeholder="3000" prefix="₹" />
        <Field label={t('calc.emergency.current_fund_label')} value={f.currentSavings} onChange={v => set('currentSavings', v)} placeholder="0" prefix="₹" />
      </div>

      {/* Formula explanation */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800">
        <p className="font-semibold mb-1">📐 फॉर्मूला:</p>
        <p>(6 × घरेलू खर्च) + (3 × खेती खर्च) = लक्ष्य</p>
        <p className="mt-1 opacity-70">6 महीने का घर + 3 महीने की खेती का बफर — फसल खराब होने पर भी परिवार सुरक्षित</p>
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="लक्ष्य जानें →" />

      {result && (
        <div className="space-y-3">
          {/* Formula breakdown */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('calc.emergency.results_label')}</p>
            <ResultRow label={t('calc.emergency.household_target')} value={`₹${fmtNum(6 * result.household)}`} />
            <ResultRow label={t('calc.emergency.farming_target')} value={`₹${fmtNum(3 * result.farm)}`} />
            <ResultRow label={t('calc.emergency.current')} value={`₹${fmtNum(result.savings)}`} />
          </div>

          <BigResult
            label={t('calc.emergency.total_target')}
            value={`₹${fmtNum(result.target)}`}
            color={result.status}
            sub={result.statusLabel}
          />

          {/* Progress */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>प्रगति</span>
              <span className="font-semibold">{result.pct.toFixed(0)}% पूरा</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${result.status === 'green' ? 'bg-green-500' : result.status === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${result.pct}%` }} />
            </div>
          </div>

          {result.gap > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">💰 {t('calc.emergency.shortfall')}: ₹{fmtNum(result.gap)}</p>
              <ResultRow label={t('calc.emergency.monthly_saving') + ' (6m)'} value={`₹${fmtNum(result.monthly6)}/माह`} />
              <ResultRow label={t('calc.emergency.monthly_saving') + ' (12m)'} value={`₹${fmtNum(result.monthly12)}/माह`} />
              <ResultRow label={t('calc.emergency.monthly_saving') + ' (18m)'} value={`₹${fmtNum(result.monthly18)}/माह`} />
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            💡 <strong>बचत कहाँ रखें:</strong> Post Office RD/FD, SBI Savings, Jan Dhan — तुरंत निकाल सकते हैं
          </div>
        </div>
      )}
    </CalcShell>
  )
}
