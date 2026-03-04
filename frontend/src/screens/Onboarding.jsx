import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'
import { LANGUAGES } from '../i18n'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useTranslation()
  const [step, setStep] = useState('lang') // 'lang' → 'form'
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const canSubmit = form.name.trim().length >= 2
    && form.phone.length === 10
    && form.password.length >= 6

  async function handleRegister() {
    setLoading(true)
    setError('')
    try {
      const hashedPassword = await sha256(form.password)
      const res = await auth.register({
        phone_number: `+91${form.phone}`,
        name: form.name.trim(),
        password: hashedPassword,
        preferred_language: lang,
      })
      auth.setToken(res.access_token)
      localStorage.setItem('fintech_user', JSON.stringify({ id: res.user_id, name: res.name }))
      localStorage.setItem('fintech_profile_complete', res.profile_complete ? '1' : '0')
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 1: Language Selection ───────────────────────────
  if (step === 'lang') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--surface)' }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--earth-900)' }}>
            {t('auth.app_name')}
          </h1>
        </div>

        <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)', boxShadow: '0 4px 20px rgba(42,31,20,0.08)' }}>
          <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {t('auth.choose_language')}
          </h2>
          <p className="text-xs text-center mb-5" style={{ color: 'var(--text-muted)' }}>
            {t('auth.choose_language_desc')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="relative rounded-2xl p-4 text-center transition-all active:scale-[0.96]"
                style={{
                  background: lang === l.code
                    ? 'linear-gradient(135deg, var(--gold-100), var(--earth-100))'
                    : 'var(--earth-50)',
                  border: lang === l.code
                    ? '2px solid var(--gold-500)'
                    : '2px solid var(--earth-200)',
                  boxShadow: lang === l.code ? '0 2px 12px rgba(212,149,44,0.15)' : 'none',
                }}
              >
                {lang === l.code && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--gold-500)' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <p className="text-lg font-bold mb-0.5" style={{ fontFamily: l.script === 'Latin' ? 'var(--font-english)' : 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {l.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-english)', fontStyle: 'italic' }}>
                  {l.labelEn}
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('form')}
            className="mt-5 w-full py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 2px 12px rgba(184,101,68,0.25)' }}
          >
            {t('common.next')} →
          </button>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          {t('auth.already_account')}{' '}
          <button onClick={() => navigate('/login')} className="font-semibold" style={{ color: 'var(--gold-600)' }}>
            {t('auth.login')}
          </button>
        </p>
      </div>
    )
  }

  // ─── Step 2: Registration Form ────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface)' }}>
      <div className="p-6 pt-12 text-center">
        <div className="text-5xl mb-2">🌾</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--earth-900)' }}>{t('auth.app_name')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--earth-500)' }}>{t('auth.app_tagline')}</p>
      </div>

      <div className="flex-1 px-4 pb-8">
        <div className="rounded-3xl shadow-lg p-6" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
          {/* Back to language */}
          <button onClick={() => setStep('lang')}
            className="flex items-center gap-1 text-sm mb-4 transition-all active:opacity-70"
            style={{ color: 'var(--gold-600)' }}>
            <span className="text-lg font-bold">‹</span>
            <span>{t('auth.choose_language')}</span>
          </button>

          <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{t('auth.register_title')}</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>{t('auth.register_subtitle')}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.name_label')}</label>
              <input className="w-full p-3 rounded-xl text-base outline-none focus:ring-2"
                style={{ border: '1px solid var(--earth-200)', '--tw-ring-color': 'var(--gold-400)', color: 'var(--text-primary)' }}
                placeholder={t('auth.name_placeholder')} value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.mobile_label')} *</label>
              <div className="flex rounded-xl overflow-hidden focus-within:ring-2" style={{ border: '1px solid var(--earth-200)', '--tw-ring-color': 'var(--gold-400)' }}>
                <span className="px-3 py-3 text-sm font-medium" style={{ background: 'var(--earth-50)', color: 'var(--text-muted)' }}>+91</span>
                <input className="flex-1 p-3 outline-none text-base" style={{ background: 'transparent', color: 'var(--text-primary)' }}
                  placeholder={t('auth.mobile_placeholder')} type="tel" inputMode="numeric" maxLength={10}
                  value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} autoComplete="tel" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.password_register_label')}</label>
              <input className="w-full p-3 rounded-xl text-base outline-none focus:ring-2"
                style={{ border: '1px solid var(--earth-200)', '--tw-ring-color': 'var(--gold-400)', color: 'var(--text-primary)' }}
                placeholder={t('auth.password_register_placeholder')} type="password" value={form.password}
                onChange={e => set('password', e.target.value)} autoComplete="new-password" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('auth.password_encrypted')}</p>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          <button onClick={handleRegister} disabled={loading || !canSubmit}
            className="mt-5 w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 2px 12px rgba(184,101,68,0.25)' }}>
            {loading ? t('auth.register_loading') : t('auth.register_btn')}
          </button>

          <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}>
            <p className="text-xs" style={{ color: '#1D4ED8' }}>{t('auth.profile_tip')}</p>
          </div>
        </div>

        {/* Demo */}
        <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--gold-100)', border: '1px solid rgba(212,149,44,0.2)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--gold-600)' }}>{t('auth.demo_try')}</p>
          <p className="text-sm" style={{ color: 'var(--gold-600)' }}>{t('auth.demo_mobile')}: <strong>9999999999</strong></p>
          <p className="text-sm" style={{ color: 'var(--gold-600)' }}>{t('auth.demo_password')}: <strong>demo1234</strong></p>
          <button onClick={() => navigate('/login')} className="mt-2 text-sm underline" style={{ color: 'var(--gold-600)' }}>
            {t('auth.go_to_login')}
          </button>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          {t('auth.already_account')}{' '}
          <button onClick={() => navigate('/login')} className="font-semibold" style={{ color: 'var(--gold-600)' }}>
            {t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  )
}
