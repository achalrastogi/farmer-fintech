import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'

export default function CalcShell({ title, subtitle, description, icon, color = 'from-green-600 to-emerald-700', children }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Coloured header */}
      <div className={`bg-gradient-to-br ${color} text-white px-4 pt-10 pb-5`}>
        <button onClick={() => navigate('/tools')}
          className="flex items-center gap-1 text-white/80 text-sm mb-3">
          <span className="text-xl font-bold">‹</span>
          <span>{t('calc.back_to_tools')}</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {description && (
          <p className="text-xs text-white/80 mt-3 leading-relaxed bg-white/10 rounded-xl p-2.5">{description}</p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {children}

        {/* Trust disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700 text-center">
            {t('calc.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
export function Field({ label, hint, value, onChange, placeholder = '0', prefix, suffix }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-xs text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      <div className="flex items-center border border-gray-200 rounded-xl bg-white focus-within:border-green-400 overflow-hidden">
        {prefix && <span className="px-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-100 py-3">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          className="flex-1 px-3 py-3 text-base outline-none bg-transparent"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {suffix && <span className="px-3 text-sm text-gray-400">{suffix}</span>}
      </div>
    </div>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────
export function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────
export function ResultRow({ label, value, sub, strong }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${strong ? 'text-base text-gray-900' : 'text-gray-800'}`}>{value}</span>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Big result display ───────────────────────────────────────────────────────
export function BigResult({ label, value, color = 'green', sub }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`border-2 rounded-2xl p-4 text-center ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  )
}

// ─── Risk bar ─────────────────────────────────────────────────────────────────
export function RiskBar({ pct, label, thresholds }) {
  // thresholds: [{at: 30, color: 'green'}, {at: 50, color: 'yellow'}, {at: 100, color: 'red'}]
  const capped = Math.min(pct, 100)
  const color = pct < (thresholds?.[0]?.at || 30) ? '#22c55e'
    : pct < (thresholds?.[1]?.at || 50) ? '#eab308' : '#ef4444'

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{label}</span>
        <span className="font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${capped}%`, backgroundColor: color }} />
        {thresholds?.map(t => (
          <div key={t.at} className="absolute top-0 bottom-0 w-0.5 bg-white/80"
            style={{ left: `${t.at}%` }} />
        ))}
      </div>
      {thresholds && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          {thresholds.map(t => <span key={t.at}>{t.at}%</span>)}
        </div>
      )}
    </div>
  )
}

// ─── Calculate button ─────────────────────────────────────────────────────────
export function CalcButton({ onClick, disabled, label }) {
  const { t } = useTranslation()
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-base shadow-sm disabled:opacity-40 active:scale-98 transition-transform">
      🧮 {label || t('calc.calculate_btn')}
    </button>
  )
}

// ─── AI Ask button ────────────────────────────────────────────────────────────
export function AIButton({ question, context, onClick }) {
  const { t } = useTranslation()
  return (
    <button onClick={onClick}
      className="w-full py-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:bg-teal-100">
      <span className="text-base">🤖</span>
      {question || t('calc.ai_ask_default')}
    </button>
  )
}
