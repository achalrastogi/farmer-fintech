import { fmtDate } from '../lib/locale'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { schemes } from '../lib/api'
import TopBar from '../components/TopBar'
import { useTranslation } from '../hooks/useTranslation'

export default function SchemeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [scheme, setScheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showEligibility, setShowEligibility] = useState(false)
  const [checkedDocs, setCheckedDocs] = useState({})

  useEffect(() => {
    schemes.get(id).then(data => { if (data) setScheme(data) }).finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    setSaving(true)
    const res = await schemes.toggleSave(id)
    if (res) setScheme(s => ({ ...s, is_saved: res.saved }))
    setSaving(false)
  }

  const toggleDoc = (doc) => setCheckedDocs(prev => ({ ...prev, [doc]: !prev[doc] }))
  const checkedCount = Object.values(checkedDocs).filter(Boolean).length
  const totalDocs = scheme?.documents_required?.length || 0

  if (loading) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="h-24 bg-amber-600 animate-pulse" />
      <div className="p-4 space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!scheme) return (
    <div className="p-4 text-center text-gray-400 pt-20">
      <p className="text-3xl mb-2">🔍</p>
      <p>{t('scheme_detail.not_found')}</p>
      <button onClick={() => navigate('/schemes')} className="mt-4 text-green-600 font-medium">{t('scheme_detail.go_back_schemes')}</button>
    </div>
  )

  if (showAI) return (
    <SchemeAIChat scheme={scheme} onClose={() => setShowAI(false)} />
  )

  if (showEligibility) return (
    <EligibilityChecker scheme={scheme} onClose={() => setShowEligibility(false)} />
  )

  const steps = scheme.how_to_apply_steps?.length > 0 ? scheme.how_to_apply_steps : null

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Coloured header */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white px-4 pt-10 pb-5">
        <button onClick={() => navigate('/schemes')} className="flex items-center gap-1 text-white/80 text-sm mb-3">
          <span className="text-lg">‹</span> {t('scheme_detail.back')}
        </button>
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h1 className="text-lg font-bold leading-tight">{scheme.name_hindi}</h1>
            <p className="text-xs opacity-80 mt-0.5">{scheme.name}</p>
          </div>
          <button onClick={toggleSave} disabled={saving}
            className={`text-2xl p-1 flex-shrink-0 ${scheme.is_saved ? 'text-yellow-300' : 'text-white/50'}`}>
            ⭐
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
            💰 {scheme.benefit_amount}
          </span>
          <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-full">
            {scheme.scheme_type === 'central' ? t('scheme_detail.central_badge') : t('scheme_detail.state_badge')}
          </span>
          <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-full">
            📅 {fmtDate(scheme.last_updated, { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Source trust bar */}
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <p className="text-xs text-gray-600">{t('scheme_detail.source')}</p>
          </div>
          {scheme.official_website && (
            <a href={scheme.official_website} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 font-medium">{t('scheme_detail.official')}</a>
          )}
        </div>

        {/* AI + Eligibility CTAs */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowEligibility(true)}
            className="bg-green-600 text-white rounded-2xl p-3 text-center active:scale-95 transition-transform">
            <p className="text-base mb-0.5">✅</p>
            <p className="text-xs font-bold">{t('scheme_detail.check_eligibility')}</p>
            <p className="text-xs opacity-80">{t('scheme_detail.check_eligibility_sub')}</p>
          </button>
          <button onClick={() => setShowAI(true)}
            className="bg-teal-600 text-white rounded-2xl p-3 text-center active:scale-95 transition-transform">
            <p className="text-base mb-0.5">🤖</p>
            <p className="text-xs font-bold">{t('scheme_detail.ask_ai')}</p>
            <p className="text-xs opacity-80">{t('scheme_detail.ask_ai_sub')}</p>
          </button>
        </div>

        {/* 1. What is this scheme */}
        <Section title={`📋 ${t('scheme_detail.what_is')}`} number="1">
          <p className="text-sm text-gray-700 leading-relaxed">{scheme.description_hindi}</p>
          {scheme.description !== scheme.description_hindi && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{scheme.description}</p>
          )}
        </Section>

        {/* 2. Who is eligible */}
        <Section title={`✅ ${t('scheme_detail.who_eligible')}`} number="2">
          <p className="text-sm text-gray-700 leading-relaxed">{scheme.eligibility_hindi}</p>
        </Section>

        {/* 3. Financial benefit */}
        <Section title={`💰 ${t('scheme_detail.benefit')}`} number="3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{t('scheme_detail.benefit_amount')}</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{scheme.benefit_amount}</p>
          </div>
        </Section>

        {/* 4. Documents required — checklist */}
        {totalDocs > 0 && (
          <Section title={`📄 ${t('scheme_detail.documents')}`} number="4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">
                {t('scheme_detail.docs_ready').replace('{checked}', checkedCount).replace('{total}', totalDocs)}
              </p>
              {checkedCount === totalDocs && totalDocs > 0 && (
                <span className="text-xs text-green-600 font-medium">{t('scheme_detail.docs_all_ready')}</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full mb-3">
              <div
                className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${totalDocs ? (checkedCount / totalDocs) * 100 : 0}%` }}
              />
            </div>
            <div className="space-y-2">
              {scheme.documents_required.map((doc, i) => (
                <button key={i} onClick={() => toggleDoc(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    checkedDocs[doc]
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checkedDocs[doc] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {checkedDocs[doc] && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm ${checkedDocs[doc] ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                    {doc}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* 5. How to apply — step by step */}
        <Section title={`📝 ${t('scheme_detail.how_to_apply')}`} number="5">
          {steps ? (
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{scheme.how_to_apply}</p>
          )}
          {scheme.official_website && (
            <a href={scheme.official_website} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-medium">
              {t('scheme_detail.official_website')}
            </a>
          )}
        </Section>

        {/* 6. Common rejection reasons */}
        {scheme.common_rejection_reasons?.length > 0 && (
          <Section title={`⚠️ ${t('scheme_detail.rejection_reasons')}`} number="6">
            <div className="space-y-2">
              {scheme.common_rejection_reasons.map((r, i) => (
                <div key={i} className="flex gap-2 text-sm text-orange-800 bg-orange-50 rounded-xl p-2.5">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 7. Fraud warning */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2">{t('scheme_detail.fraud_warning')}</p>
          <p className="text-sm text-red-600 leading-relaxed">
            {scheme.fraud_warning || t('scheme_detail.fraud_default')}
          </p>
          <div className="mt-2 space-y-1">
            {['किसान हेल्पलाइन: 1800-180-1551 (मुफ्त)', 'Helpline: 14447 (फसल बीमा)'].map((t, i) => (
              <p key={i} className="text-xs text-red-500 font-medium">📞 {t}</p>
            ))}
          </div>
        </div>

        {/* FAQ if available */}
        {scheme.faq_list?.length > 0 && (
          <Section title={`❓ ${t('scheme_detail.faq')}`} number="8">
            <FAQList faqs={scheme.faq_list} />
          </Section>
        )}

        {/* Bottom CTA */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={toggleSave} disabled={saving}
            className={`py-3 rounded-2xl font-semibold text-sm transition-colors ${
              scheme.is_saved
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-amber-600 text-white'
            }`}>
            {scheme.is_saved ? t('scheme_detail.saved_scheme') : t('scheme_detail.save_scheme')}
          </button>
          <button onClick={() => setShowAI(true)}
            className="py-3 rounded-2xl font-semibold text-sm bg-teal-600 text-white">
            🤖 {t('scheme_detail.ask_ai')}
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 pb-2">
          {t('scheme_detail.last_updated')} {fmtDate(scheme.last_updated)} •
          <button className="ml-1 text-red-400">{t('scheme_detail.report_wrong')}</button>
        </p>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, number, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left active:bg-gray-50">
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <span className={`text-gray-400 text-lg transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  )
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQList({ faqs }) {
  const [openIdx, setOpenIdx] = useState(null)
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between p-3 text-left">
            <p className="text-sm font-medium text-gray-800 flex-1 pr-2">❓ {faq.q}</p>
            <span className={`text-gray-400 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-90' : ''}`}>›</span>
          </button>
          {openIdx === i && (
            <div className="px-3 pb-3">
              <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── AI Chat about specific scheme ───────────────────────────────────────────
function SchemeAIChat({ scheme, onClose }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `नमस्ते! मैं आपको **${scheme.name_hindi}** के बारे में जानकारी दे सकता हूं।\n\nआपके सवाल पूछें — जैसे:\n• "मेरी किस्त क्यों रुकी?"\n• "आवेदन कहाँ करें?"\n• "क्या मैं पात्र हूं?"`
    }
  ])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)

  const QUICK_QUESTIONS = (scheme.faq_list || []).slice(0, 3).map(f => f.q)
    .concat(['आवेदन कैसे करें?', 'पात्रता की शर्तें क्या हैं?']).slice(0, 4)

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const q = text || query.trim()
    if (!q || loading) return
    setQuery('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch(`/api/v1/schemes/${scheme.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'ai', text: data.answer || t('scheme_detail.ai_disclaimer') }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: t('ai_assistant.error_msg') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-4 pt-10 pb-4">
        <button onClick={onClose} className="flex items-center gap-1 text-white/80 text-sm mb-2">
          <span className="text-lg">‹</span> {t('scheme_detail.back')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <p className="font-bold text-sm">{scheme.name_hindi} — {t('scheme_detail.ai_helper_title')}</p>
            <p className="text-xs opacity-80">{t('scheme_detail.ai_context_help')}</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
        <p className="text-xs text-amber-700">{t('scheme_detail.ai_disclaimer')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-teal-600 text-white rounded-tr-none'
                : 'bg-white shadow-sm border border-gray-100 rounded-tl-none text-gray-800'
            }`}>
              {m.role === 'ai' && <span className="text-xs text-teal-600 font-medium block mb-1">🤖 AI</span>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {QUICK_QUESTIONS.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => send(q)}
                className="flex-shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 active:bg-gray-100">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-6 pt-1">
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-teal-400"
            placeholder={t('scheme_detail.ai_placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={() => send()} disabled={loading || !query.trim()}
            className="w-11 h-11 bg-teal-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">↑</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Eligibility Checker ──────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 'land', label: 'आपकी जमीन कितनी है?', type: 'select',
    options: [{ v: '', l: 'चुनें' }, { v: '0', l: 'जमीन नहीं है' }, { v: '0.5', l: '0.5 एकड़ से कम' },
      { v: '1', l: '0.5-1 एकड़' }, { v: '2', l: '1-2 एकड़' }, { v: '3', l: '2-4 एकड़' }, { v: '5', l: '4+ एकड़' }] },
  { id: 'crop', label: 'मुख्य फसल क्या है?', type: 'select',
    options: [{ v: '', l: 'चुनें' }, { v: 'wheat', l: '🌾 गेहूं' }, { v: 'rice', l: '🌾 धान' },
      { v: 'cotton', l: '🌿 कपास' }, { v: 'other', l: '🌱 अन्य' }] },
  { id: 'aadhaar', label: 'आधार बैंक से लिंक है?', type: 'yesno' },
  { id: 'bank', label: 'बैंक खाता सक्रिय है?', type: 'yesno' },
  { id: 'portal', label: 'राज्य कृषि पोर्टल पर पंजीकृत हैं?', type: 'yesno' },
]

function EligibilityChecker({ scheme, onClose }) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const set = (id, val) => setAnswers(p => ({ ...p, [id]: val }))
  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined && answers[q.id] !== '')

  const check = () => {
    let score = 0, max = 0, issues = []

    // Land check
    if (scheme.min_land_acres !== null) {
      max += 2
      const land = parseFloat(answers.land || 0)
      if (land >= (scheme.min_land_acres || 0)) score += 2
      else issues.push(`न्यूनतम ${scheme.min_land_acres} एकड़ जमीन चाहिए`)
    }
    if (scheme.max_land_acres !== null) {
      const land = parseFloat(answers.land || 99)
      if (land > scheme.max_land_acres) issues.push(`अधिकतम ${scheme.max_land_acres} एकड़ तक पात्रता`)
    }

    // Aadhaar
    max += 2
    if (answers.aadhaar === 'yes') score += 2
    else issues.push('आधार-बैंक लिंक जरूरी है')

    // Bank
    max += 1
    if (answers.bank === 'yes') score += 1
    else issues.push('सक्रिय बैंक खाता जरूरी है')

    // Crop match
    if (scheme.applicable_crops?.length > 0) {
      max += 1
      if (answers.crop && scheme.applicable_crops.includes(answers.crop)) score += 1
      else if (answers.crop) issues.push(`${answers.crop} फसल इस योजना में नहीं`)
    }

    const pct = max > 0 ? score / max : 1
    let status, color, label

    if (issues.length === 0 && pct >= 0.8) {
      status = 'eligible'; color = 'text-green-700 bg-green-50 border-green-200'
      label = t('scheme_detail.eligible_label')
    } else if (pct >= 0.5) {
      status = 'maybe'; color = 'text-yellow-700 bg-yellow-50 border-yellow-200'
      label = t('scheme_detail.maybe_label')
    } else {
      status = 'ineligible'; color = 'text-red-700 bg-red-50 border-red-200'
      label = t('scheme_detail.ineligible_label')
    }

    setResult({ status, color, label, issues, score, max })
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 pt-10 pb-4">
        <button onClick={onClose} className="flex items-center gap-1 text-white/80 text-sm mb-2">
          <span className="text-lg">‹</span> {t('scheme_detail.back')}
        </button>
        <h1 className="font-bold text-base">{t('scheme_detail.eligibility_title')}</h1>
        <p className="text-xs opacity-80">{scheme.name_hindi}</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Questions */}
        {!result && QUESTIONS.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-3">{i + 1}. {q.label}</p>
            {q.type === 'yesno' ? (
              <div className="flex gap-2">
                {['yes', 'no'].map(v => (
                  <button key={v} onClick={() => set(q.id, v)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                      answers[q.id] === v
                        ? v === 'yes' ? 'bg-green-500 text-white border-green-500' : 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                    {v === 'yes' ? '✅ हाँ' : '❌ नहीं'}
                  </button>
                ))}
              </div>
            ) : (
              <select value={answers[q.id] || ''} onChange={e => set(q.id, e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                {q.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            )}
          </div>
        ))}

        {/* Check button */}
        {!result && (
          <button onClick={check} disabled={!allAnswered}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-base disabled:opacity-40">
            {t('scheme_detail.check_btn')}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className={`border-2 rounded-2xl p-5 text-center ${result.color}`}>
              <p className="text-lg font-bold">{result.label}</p>
              <div className="flex justify-center items-center gap-1 mt-2">
                {Array.from({ length: result.max }).map((_, i) => (
                  <div key={i} className={`w-6 h-2 rounded-full ${i < result.score ? 'bg-current opacity-80' : 'bg-current opacity-20'}`} />
                ))}
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="font-semibold text-gray-800 text-sm mb-2">{t('scheme_detail.what_to_do')}</p>
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex gap-2 text-sm text-orange-700 bg-orange-50 rounded-xl p-2.5 mb-2">
                    <span>⚠️</span><span>{issue}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">{t('scheme_detail.important_note')}</p>
              <p className="text-xs text-blue-700">{t('scheme_detail.important_note_text')}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setResult(null)}
                className="py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600">
                {t('scheme_detail.check_again')}
              </button>
              <button onClick={onClose}
                className="py-3 bg-green-600 text-white rounded-2xl text-sm font-medium">
                {t('scheme_detail.view_details')}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-gray-400">
          {t('scheme_detail.result_not_guaranteed')}
        </p>
      </div>
    </div>
  )
}
