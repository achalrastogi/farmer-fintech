import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'

const TOOL_KEYS = [
  { key: 'crop_profit',  path: '/tools/crop-profit',    icon: '🌾', badge: false },
  { key: 'loan_roi',     path: '/tools/loan-roi',       icon: '🏦', badge: false },
  { key: 'emi_safety',   path: '/tools/emi-safety',     icon: '📊', badge: false },
  { key: 'storage',      path: '/tools/storage',        icon: '🏚️', badge: false },
  { key: 'emergency',    path: '/tools/emergency-fund', icon: '🛡️', badge: false },
  { key: 'break_even',   path: '/tools/break-even',     icon: '⚖️', badge: false },
  { key: 'crop_compare', path: '/tools/crop-compare',   icon: '🆚', badge: true  },
  { key: 'cost_leakage', path: '/tools/cost-leakage',   icon: '🔍', badge: true  },
]

const ACCENT = [
  { bg: '#EDF5E8', border: '#4A7C3F' },
  { bg: '#EFF6FF', border: '#2563EB' },
  { bg: '#F5F3FF', border: '#7C3AED' },
  { bg: '#FFFBEB', border: '#D97706' },
  { bg: '#FFF1F2', border: '#E11D48' },
  { bg: '#F0FDFA', border: '#0D9488' },
  { bg: '#EEF2FF', border: '#4F46E5' },
  { bg: '#FFF1F2', border: '#E11D48' },
]

export default function Tools() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mounted] = useState(true)
  const user = JSON.parse(localStorage.getItem('fintech_user') || '{}')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="relative overflow-hidden grain-overlay"
        style={{ background: 'linear-gradient(165deg, var(--earth-950), var(--earth-900))' }}>
        <div className="relative px-5 pt-11 pb-6">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm mb-4 transition-all active:opacity-70"
            style={{ color: 'var(--earth-400)' }}>
            <span className="text-lg font-bold">‹</span>
            <span style={{ fontFamily: 'var(--font-body)' }}>{t('common.home')}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-2xl">🧮</span>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#FFFCF7' }}>{t('tools.title')}</h1>
              <p className="text-xs" style={{ color: 'var(--earth-400)' }}>{t('tools.subtitle')}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(212,149,44,0.1)', border: '1px solid rgba(212,149,44,0.15)' }}>
            <span className="text-sm">👤</span>
            <p className="text-xs" style={{ color: 'var(--gold-300)' }}>
              {user.name || t('common.home')} {t('common.ji')} — {t('tools.user_msg')}
            </p>
          </div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1" style={{ background: 'var(--earth-200)' }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--earth-500)', letterSpacing: '0.12em' }}>
            {t('tools.choose_label')}
          </p>
          <div className="h-px flex-1" style={{ background: 'var(--earth-200)' }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TOOL_KEYS.map((tool, idx) => {
            const a = ACCENT[idx]
            const info = t(`tools.items.${tool.key}`)
            return (
              <button key={tool.path} onClick={() => navigate(tool.path)}
                className="card-enter relative overflow-hidden rounded-2xl text-left transition-transform active:scale-[0.96]"
                style={{
                  animationDelay: `${idx * 50 + 60}ms`,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--earth-200)',
                  boxShadow: '0 2px 8px rgba(42,31,20,0.05)',
                  minHeight: 128,
                }}>
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: a.border }} />
                {tool.badge && (
                  <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                    style={{ background: a.border, fontSize: 10 }}>
                    {t('common.new_badge')}
                  </span>
                )}
                <div className="p-4 pl-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: a.bg, border: `1px solid ${a.border}22` }}>
                    <span className="text-lg">{tool.icon}</span>
                  </div>
                  <p className="font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
                    {info?.label || tool.key}
                  </p>
                  <p className="text-xs italic mb-1" style={{ fontFamily: 'var(--font-english)', color: a.border, opacity: 0.7 }}>
                    {info?.sub || ''}
                  </p>
                  <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {info?.desc || ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Trust footer */}
        <div className="mt-4 rounded-xl p-3 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--earth-500)' }}>{t('tools.trust_msg')}</p>
        </div>
      </div>
    </div>
  )
}
