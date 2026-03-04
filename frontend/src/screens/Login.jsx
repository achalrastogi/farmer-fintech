import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolveIdentifier = (raw) => {
    const clean = raw.trim()
    if (/^[6-9]\d{9}$/.test(clean)) return `+91${clean}`
    return clean
  }

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const hashedPassword = await sha256(password)
      const res = await auth.loginWithIdentifier(resolveIdentifier(identifier), hashedPassword)
      auth.setToken(res.access_token)
      localStorage.setItem('fintech_user', JSON.stringify({ id: res.user_id, name: res.name }))
      localStorage.setItem('fintech_profile_complete', res.profile_complete ? '1' : '0')
      navigate('/')
    } catch {
      setError(t('auth.login_error'))
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setIdentifier('9999999999')
    setPassword('demo1234')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--surface)' }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🌾</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--earth-900)' }}>{t('auth.app_name')}</h1>
        <p className="text-sm" style={{ color: 'var(--earth-500)' }}>{t('auth.app_tagline')}</p>
      </div>

      <div className="rounded-3xl shadow-lg w-full max-w-sm p-6" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
        <h2 className="text-lg font-bold text-center mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{t('auth.login')}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.mobile_label')}</label>
            <div className="flex rounded-xl overflow-hidden focus-within:ring-2" style={{ border: '1px solid var(--earth-200)', '--tw-ring-color': 'var(--gold-400)' }}>
              <span className="px-3 py-3 text-sm" style={{ background: 'var(--earth-50)', color: 'var(--text-muted)' }}>+91</span>
              <input className="flex-1 p-3 outline-none text-base" style={{ background: 'transparent', color: 'var(--text-primary)' }}
                placeholder={t('auth.mobile_placeholder')} type="tel" inputMode="numeric" maxLength={10}
                value={identifier} onChange={e => setIdentifier(e.target.value.replace(/\D/g, ''))} autoComplete="tel" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.password_label')}</label>
            <input className="w-full p-3 rounded-xl text-base outline-none focus:ring-2"
              style={{ border: '1px solid var(--earth-200)', '--tw-ring-color': 'var(--gold-400)', color: 'var(--text-primary)' }}
              placeholder={t('auth.password_placeholder')} type="password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password" />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-sm text-center" style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}

        <button onClick={handleLogin} disabled={loading || !identifier || !password}
          className="mt-4 w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 2px 8px rgba(184,101,68,0.25)' }}>
          {loading ? t('auth.login_loading') : t('auth.login_btn')}
        </button>

        <button onClick={fillDemo}
          className="mt-3 w-full py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--gold-100)', border: '1px solid rgba(212,149,44,0.3)', color: 'var(--gold-600)' }}>
          {t('auth.demo_fill')}
        </button>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          {t('auth.new_account')}{' '}
          <button onClick={() => navigate('/onboarding')} className="font-semibold" style={{ color: 'var(--gold-600)' }}>
            {t('auth.register')}
          </button>
        </p>
      </div>

      <div className="mt-4 rounded-2xl p-3 w-full max-w-sm text-center" style={{ background: 'var(--gold-100)', border: '1px solid rgba(212,149,44,0.2)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--gold-600)' }}>{t('auth.demo_info')}</p>
      </div>
    </div>
  )
}
