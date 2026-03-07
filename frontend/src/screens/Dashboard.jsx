import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

/* ═══════════════════════════════════════════════════════════
   DASHBOARD — "Sona Mitti" (Golden Earth) Design
   Inspired by Indian harvest fields, terracotta, marigold
   ═══════════════════════════════════════════════════════════ */

const TILE_KEYS = [
  { path: '/learn',    icon: '📖', key: 'learn',    accent: 'purple'  },
  { path: '/tools',    icon: '🧮', key: 'tools',    accent: 'indigo'  },
  { path: '/schemes',  icon: '🏛️', key: 'schemes',  accent: 'amber'   },
  { path: '/loans',    icon: '🏦', key: 'loans',    accent: 'blue'    },
  { path: '/cashflow', icon: '💸', key: 'cashflow', accent: 'teal'    },
  { path: '/risk',     icon: '🛡️', key: 'risk',     accent: 'rose'    },
  { path: '/wealth',   icon: '🌱', key: 'wealth',   accent: 'emerald' },
  { path: '/market',   icon: '📈', key: 'market',   accent: 'orange'  },
]

const ACCENT_COLORS = {
  harvest: { border: '#4A7C3F', bg: '#EDF5E8', icon: '#3A6428', text: '#2D5A1E' },
  indigo:  { border: '#4F46E5', bg: '#EEF2FF', icon: '#3730A3', text: '#312E81' },
  purple:  { border: '#7C3AED', bg: '#F5F3FF', icon: '#6D28D9', text: '#5B21B6' },
  amber:   { border: '#D97706', bg: '#FFFBEB', icon: '#B45309', text: '#92400E' },
  blue:    { border: '#2563EB', bg: '#EFF6FF', icon: '#1D4ED8', text: '#1E40AF' },
  teal:    { border: '#0D9488', bg: '#F0FDFA', icon: '#0F766E', text: '#115E59' },
  rose:    { border: '#E11D48', bg: '#FFF1F2', icon: '#BE123C', text: '#9F1239' },
  emerald: { border: '#059669', bg: '#ECFDF5', icon: '#047857', text: '#065F46' },
  orange:  { border: '#EA580C', bg: '#FFF7ED', icon: '#C2410C', text: '#9A3412' },
}

function getGreeting(t) {
  const h = new Date().getHours()
  if (h < 6)  return { text: t('greetings.night'),     icon: '🌙' }
  if (h < 12) return { text: t('greetings.morning'),   icon: '🌅' }
  if (h < 17) return { text: t('greetings.afternoon'), icon: '☀️' }
  if (h < 20) return { text: t('greetings.evening'),   icon: '🌇' }
  return { text: t('greetings.night'), icon: '🌙' }
}

// ─── Decorative SVG wheat pattern for header ───────────────────────────────────
function WheatPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {[40, 120, 200, 280, 360].map((x, i) => (
        <g key={i} transform={`translate(${x}, ${160 + (i % 2) * 20}) rotate(${-15 + i * 8})`} fill="currentColor">
          {[0, 1, 2, 3, 4].map(j => (
            <ellipse key={j} cx={0} cy={-j * 18 - 10} rx={4} ry={9} opacity={0.6 + j * 0.08} />
          ))}
          <line x1={0} y1={0} x2={0} y2={-100} stroke="currentColor" strokeWidth={1.5} opacity={0.5} />
        </g>
      ))}
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t, formatDate } = useTranslation()
  const [showLogout, setShowLogout] = useState(false)
  const [mounted, setMounted] = useState(false)
  const user = JSON.parse(localStorage.getItem('fintech_user') || '{}')

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const now = new Date()
  const dateStr = formatDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const greeting = getGreeting(t)

  function handleLogout() {
    auth.clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface)', fontFamily: 'var(--font-body)' }}>

      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden grain-overlay" style={{ background: 'linear-gradient(165deg, var(--earth-950) 0%, var(--earth-900) 40%, var(--earth-800) 100%)' }}>
        <WheatPattern />

        <div className="relative px-5 pt-11 pb-7">
          {/* Top bar: Profile + Logout */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 rounded-full pr-4 pl-1 py-1 transition-all active:scale-95"
              style={{ background: 'rgba(212, 149, 44, 0.12)', border: '1px solid rgba(212, 149, 44, 0.25)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 2px 8px rgba(212, 149, 44, 0.3)' }}>
                <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>
                  {(user.name || 'क')[0]}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--gold-300)' }}>
                  {user.name || ''}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--earth-400)' }}>{t('common.view_profile')}</p>
              </div>
            </button>

            <button onClick={() => setShowLogout(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all active:scale-95"
              style={{ color: 'var(--earth-400)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 14 }}>⏻</span>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{t('logout.btn')}</span>
            </button>
          </div>

          {/* Greeting */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl">{greeting.icon}</span>
            <h1 className="text-2xl font-normal" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-200)' }}>
              {greeting.text}
            </h1>
          </div>
          <p className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#FFFCF7' }}>
            {user.name || ''} {t('common.ji')}
          </p>

          {/* Date strip */}
          <div className="flex items-center gap-2 mt-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--gold-500), transparent)' }} />
            <p className="text-xs tracking-wide whitespace-nowrap" style={{ color: 'var(--earth-400)', fontFamily: 'var(--font-body)' }}>
              {dateStr}
            </p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, var(--gold-500), transparent)' }} />
          </div>

          {/* Disclaimer badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(212, 149, 44, 0.1)', border: '1px solid rgba(212, 149, 44, 0.15)' }}>
            <span style={{ fontSize: 11 }}>📋</span>
            <p className="text-xs" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 400 }}>
              {t('common.educational_disclaimer')}
            </p>
          </div>
        </div>

        {/* Bottom edge: warm gradient fade */}
        <div className="h-3" style={{ background: 'linear-gradient(to bottom, transparent, var(--surface))' }} />
      </div>

      {/* ═══ SECTION LABEL ═══ */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--earth-200)' }} />
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--earth-500)', fontFamily: 'var(--font-body)', letterSpacing: '0.15em' }}>
          {t('dashboard.sections_label')}
        </p>
        <div className="h-px flex-1" style={{ background: 'var(--earth-200)' }} />
      </div>

      {/* ═══ TILE GRID ═══ */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {TILE_KEYS.map((tile, idx) => {
            const tileData = t(`dashboard.tiles.${tile.key}`)
            return (
              <TileCard
                key={tile.path}
                tile={{ ...tile, label: tileData?.label || tile.key, sub: tileData?.sub || '', desc: tileData?.desc || '' }}
                idx={idx}
                mounted={mounted}
                onClick={() => navigate(tile.path)}
              />
            )
          })}
        </div>
      </div>

      {/* ═══ TRUST FOOTER ═══ */}
      <div className="mx-5 mb-6 rounded-xl p-4 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)', boxShadow: '0 1px 3px rgba(42, 31, 20, 0.06)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--earth-500)', fontFamily: 'var(--font-body)' }}>
          {t('common.trust_footer')}
        </p>
      </div>

      {/* ═══ LOGOUT MODAL ═══ */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 fade-in" style={{ background: 'rgba(26, 20, 16, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 chat-enter" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--terra-500), var(--earth-700))' }}>
                <span className="text-2xl">⏻</span>
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {t('logout.confirm_title')}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('logout.confirm_msg')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogout(false)}
                className="py-3 rounded-xl font-medium text-sm transition-all active:scale-95"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--earth-200)' }}>
                {t('logout.stay')}
              </button>
              <button onClick={handleLogout}
                className="py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--terra-500), var(--terra-600))', boxShadow: '0 2px 8px rgba(184, 101, 68, 0.3)' }}>
                {t('logout.yes_logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TILE CARD COMPONENT ────────────────────────────────────────────────────────
function TileCard({ tile, idx, mounted, onClick }) {
  const [pressed, setPressed] = useState(false)
  const colors = ACCENT_COLORS[tile.accent] || ACCENT_COLORS.harvest

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`card-enter relative overflow-hidden rounded-2xl text-left transition-transform duration-150 ${pressed ? 'scale-[0.96]' : ''}`}
      style={{
        animationDelay: `${idx * 60 + 80}ms`,
        opacity: mounted ? undefined : 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--earth-200)',
        boxShadow: pressed
          ? '0 1px 2px rgba(42, 31, 20, 0.06)'
          : '0 2px 8px rgba(42, 31, 20, 0.06), 0 1px 2px rgba(42, 31, 20, 0.04)',
        minHeight: 136,
      }}
    >
      {/* Left accent border */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: colors.border }} />

      {/* Content */}
      <div className="p-4 pl-5">
        {/* Icon badge */}
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2.5"
          style={{ background: colors.bg, border: `1px solid ${colors.border}22`, boxShadow: `0 1px 4px ${colors.border}15` }}>
          <span className="text-xl">{tile.icon}</span>
        </div>

        <p className="font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
          {tile.label}
        </p>
        <p className="text-xs italic mb-1.5" style={{ fontFamily: 'var(--font-english)', color: colors.text, opacity: 0.7 }}>
          {tile.sub}
        </p>
        <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
          {tile.desc}
        </p>
      </div>

      {/* Corner flourish */}
      <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-[0.04]" style={{ background: colors.border }} />
    </button>
  )
}
