import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, home } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'
import { LANGUAGES } from '../i18n'

const CROPS = ['wheat', 'cotton', 'rice', 'other']
const CROP_EMOJI = { wheat: '🌾', cotton: '🌿', rice: '🌾', other: '🌱' }

export default function Profile() {
  const navigate = useNavigate()
  const { t, lang, setLang, formatDate } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    auth.me().then(data => {
      if (data) {
        setProfile(data)
        setForm(data)
        localStorage.setItem('fintech_profile', JSON.stringify(data))
        // Sync language from DB to app
        if (data.preferred_language && data.preferred_language !== lang) {
          setLang(data.preferred_language)
        }
      }
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLanguageChange = (code) => {
    set('preferred_language', code)
    setLang(code) // Immediately switch UI language
  }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await home.updateProfile({
        name: form.name,
        state: form.state,
        district: form.district,
        crop_type: form.crop_type,
        preferred_language: form.preferred_language,
        farm_size_acres: parseFloat(form.farm_size_acres),
        annual_income: parseInt(form.annual_income),
        loan_amount: parseInt(form.loan_amount || 0),
        monthly_expenses: parseInt(form.monthly_expenses || 8000),
      })
      if (updated) {
        setProfile(updated)
        setForm(updated)
        localStorage.setItem('fintech_profile', JSON.stringify(updated))
        localStorage.setItem('fintech_user', JSON.stringify({ id: updated.id, name: updated.name }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const logout = () => { auth.clearToken(); navigate('/login') }

  if (!profile) return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <div className="p-5 pt-14 space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--earth-100)' }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface)' }}>
      {/* ═══ HEADER ═══ */}
      <div className="relative overflow-hidden grain-overlay"
        style={{ background: 'linear-gradient(165deg, var(--earth-950), var(--earth-900))' }}>
        <div className="relative px-5 pt-11 pb-6">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm mb-4 transition-all active:opacity-70"
            style={{ color: 'var(--earth-400)' }}>
            <span className="text-lg font-bold">‹</span>
            <span style={{ fontFamily: 'var(--font-body)' }}>{t('common.home')}</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 4px 16px rgba(212,149,44,0.3)' }}>
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#FFFCF7' }}>
                  {profile.name}
                </h1>
                <p className="text-sm" style={{ color: 'var(--earth-400)' }}>{profile.phone_number}</p>
              </div>
            </div>

            <button onClick={() => editing ? save() : setEditing(true)} disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={editing ? {
                background: 'linear-gradient(135deg, var(--harvest-500), var(--harvest-600))',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(74,124,63,0.3)',
              } : {
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--gold-300)',
                border: '1px solid rgba(212,149,44,0.2)',
              }}>
              {saving ? '...' : editing ? t('profile.save') : t('profile.edit')}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ SAVED TOAST ═══ */}
      {saved && (
        <div className="mx-5 mt-3 rounded-xl p-3 text-center card-enter"
          style={{ background: 'rgba(74,124,63,0.1)', border: '1px solid rgba(74,124,63,0.2)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--harvest-600)' }}>{t('profile.saved_msg')}</p>
        </div>
      )}

      {/* ═══ FORM FIELDS ═══ */}
      <div className="px-5 pt-4 space-y-4">

        {/* Language Selector — prominent section */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)', boxShadow: '0 2px 8px rgba(42,31,20,0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌐</span>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
              {t('profile.language')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(l => {
              const selected = form.preferred_language === l.code
              return (
                <button key={l.code}
                  onClick={() => editing && handleLanguageChange(l.code)}
                  disabled={!editing}
                  className="relative rounded-xl p-3 text-center transition-all"
                  style={{
                    background: selected ? 'linear-gradient(135deg, var(--gold-100), var(--earth-100))' : 'var(--earth-50)',
                    border: selected ? '2px solid var(--gold-500)' : '2px solid var(--earth-200)',
                    opacity: editing ? 1 : (selected ? 1 : 0.5),
                    boxShadow: selected ? '0 2px 8px rgba(212,149,44,0.12)' : 'none',
                  }}>
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--gold-500)' }}>
                      <span className="text-white" style={{ fontSize: 9 }}>✓</span>
                    </div>
                  )}
                  <p className="text-base font-bold" style={{ fontFamily: l.script === 'Latin' ? 'var(--font-english)' : 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {l.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-english)', fontStyle: 'italic' }}>
                    {l.labelEn}
                  </p>
                </button>
              )
            })}
          </div>
          {editing && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              {t('auth.choose_language_desc')}
            </p>
          )}
        </div>

        {/* Profile fields card */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)', boxShadow: '0 2px 8px rgba(42,31,20,0.05)' }}>
          <Field label={t('profile.name')} value={form.name} editing={editing} onChange={v => set('name', v)} />
          <Field label={t('profile.state')} value={form.state} editing={editing} onChange={v => set('state', v)} />
          <Field label={t('profile.district')} value={form.district} editing={editing} onChange={v => set('district', v)} />
          <Field label={t('profile.farm_size')} value={form.farm_size_acres} editing={editing} onChange={v => set('farm_size_acres', v)} type="number" />
          <Field label={t('profile.annual_income')} value={form.annual_income} editing={editing} onChange={v => set('annual_income', v)} type="number" />
          <Field label={t('profile.total_loan')} value={form.loan_amount || 0} editing={editing} onChange={v => set('loan_amount', v)} type="number" />
          <Field label={t('profile.monthly_expense')} value={form.monthly_expenses || 8000} editing={editing} onChange={v => set('monthly_expenses', v)} type="number" />

          {/* Crop selection */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('profile.main_crop')}</p>
            {editing ? (
              <div className="grid grid-cols-2 gap-2">
                {CROPS.map(c => (
                  <button key={c} onClick={() => set('crop_type', c)}
                    className="p-2.5 rounded-xl text-sm text-left transition-all"
                    style={{
                      background: form.crop_type === c ? 'var(--gold-100)' : 'var(--earth-50)',
                      border: form.crop_type === c ? '2px solid var(--gold-500)' : '2px solid var(--earth-200)',
                      color: 'var(--text-primary)',
                    }}>
                    {CROP_EMOJI[c]} {t(`profile.crops.${c}`)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {CROP_EMOJI[form.crop_type] || '🌱'} {t(`profile.crops.${form.crop_type}`) || form.crop_type}
              </p>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--earth-50)', border: '1px solid var(--earth-200)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('profile.account_created')}: {formatDate(profile.created_at, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('common.educational_only')}</p>
        </div>

        {/* Logout */}
        <button onClick={() => setShowLogout(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'rgba(152,76,44,0.06)', border: '1px solid rgba(152,76,44,0.2)', color: 'var(--terra-500)' }}>
          🚪 {t('logout.btn')}
        </button>
      </div>

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 fade-in"
          style={{ background: 'rgba(26,20,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 chat-enter"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--terra-500), var(--earth-700))' }}>
                <span className="text-xl">⏻</span>
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{t('logout.confirm_title')}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('logout.confirm_msg')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogout(false)} className="py-3 rounded-xl text-sm font-medium"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--earth-200)' }}>{t('logout.stay')}</button>
              <button onClick={logout} className="py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--terra-500), var(--terra-600))' }}>{t('logout.yes_logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, editing, onChange, type = 'text' }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {editing ? (
        <input type={type} value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full p-2.5 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--earth-200)', background: 'var(--earth-50)', color: 'var(--text-primary)' }} />
      ) : (
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
      )}
    </div>
  )
}
