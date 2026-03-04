import { fmtNum } from '../lib/locale'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { home } from '../lib/api'
import TopBar from '../components/TopBar'
import { useTranslation } from '../hooks/useTranslation'

const RISK_COLORS = {
  low:      { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  high:     { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    },
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)

  const profileComplete = localStorage.getItem('fintech_profile_complete') === '1'

  const QUICK_ACTIONS = [
    { label: t('home.quick_actions_items.profit'), icon: '💰', path: '/tools/crop-profit' },
    { label: t('home.quick_actions_items.loan'),   icon: '🏦', path: '/loans' },
    { label: t('home.quick_actions_items.cashflow'),icon: '💸', path: '/cashflow' },
    { label: t('home.quick_actions_items.risk'),   icon: '🛡️', path: '/risk' },
  ]

  useEffect(() => {
    home.snapshot().then(data => { if (data) setSnapshot(data) }).finally(() => setLoading(false))
  }, [])

  const risk = snapshot ? (RISK_COLORS[snapshot.loan_risk_level] || RISK_COLORS.low) : RISK_COLORS.low

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <TopBar title={t('home.title')} subtitle={t('home.subtitle')} backTo="/" showLogout />

      <div className="p-4 space-y-4">
        {!profileComplete && (
          <div className="bg-blue-600 text-white rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">💡</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('home.profile_fill_title')}</p>
              <p className="text-xs opacity-90 mt-0.5">{t('home.profile_fill_desc')}</p>
              <button onClick={() => navigate('/profile')} className="mt-2 bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {t('home.profile_fill_btn')}
              </button>
            </div>
            <button onClick={() => localStorage.setItem('fintech_profile_complete','1')} className="text-white opacity-60 text-lg">×</button>
          </div>
        )}

        {snapshot?.tip_of_day && (
          <div className="bg-green-600 text-white rounded-2xl p-4">
            <p className="text-xs font-semibold opacity-80 mb-1">{'💡 ' + t('home.tip_of_day')}</p>
            <p className="text-sm leading-relaxed">{snapshot.tip_of_day}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">{t('home.farm_summary')}</h2>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-100 rounded" /><div className="h-8 bg-gray-100 rounded" />
            </div>
          ) : snapshot ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{t('home.annual_profit')}</p>
                <p className="text-lg font-bold text-green-700">₹{fmtNum(snapshot.estimated_annual_profit)}</p>
                <p className="text-xs text-gray-400">₹{fmtNum(snapshot.profit_per_acre)}{t('home.per_acre')}</p>
              </div>
              <div className={`${risk.bg} rounded-xl p-3 border ${risk.border}`}>
                <p className="text-xs text-gray-500">{t('home.loan_risk')}</p>
                <p className={`text-sm font-bold ${risk.text} mt-1`}>{snapshot.loan_risk_label}</p>
              </div>
              <div className={`rounded-xl p-3 col-span-2 ${snapshot.emergency_fund_status === 'ready' ? 'bg-green-50' : 'bg-orange-50'}`}>
                <p className="text-xs text-gray-500">{t('home.emergency_fund')}</p>
                <p className={`text-sm font-bold mt-0.5 ${snapshot.emergency_fund_status === 'ready' ? 'text-green-700' : 'text-orange-600'}`}>
                  {snapshot.emergency_fund_label}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">{t('home.fill_profile_summary')}</p>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 text-sm mb-2">{t('home.quick_actions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center text-center active:scale-95 transition-transform">
                <span className="text-2xl mb-1">{a.icon}</span>
                <span className="text-xs text-gray-700 font-medium leading-tight whitespace-pre-line">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{t('home.trust_footer')}</p>
        </div>
      </div>
    </div>
  )
}
