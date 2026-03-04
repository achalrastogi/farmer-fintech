import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { education } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

/* ═══════════════════════════════════════════════════════════
   FLOATING AI ASSISTANT — "Sona Mitti" Design
   Marigold gold button, parchment chat, warm earth tones
   ═══════════════════════════════════════════════════════════ */

const ALLOWED_TOPICS = [
  'कृषि','खेती','फसल','किसान','कर्ज','लोन','ब्याज','EMI','बीमा','PMFBY',
  'KCC','योजना','सब्सिडी','PM-Kisan','MSP','मंडी','बाजार','भाव',
  'बचत','FD','PPF','पोस्ट ऑफिस','रिटायरमेंट','पेंशन','सोना','gold',
  'Emergency','आपातकालीन','ट्रैक्टर','ड्रिप','सिंचाई','जमीन','भूमि',
  'डेयरी','मुर्गी','पशु','सब्जी','गेहूं','धान','कपास','सरसों',
  'नॉमिनी','वसीयत','बँटवारा','ROI','profit','loss','मुनाफा','घाटा',
  'loan','credit','insurance','scheme','subsidy','farm','crop','agriculture',
  'savings','investment','pension','market','price','mandi','govt',
  'government','eNAM','NABARD','FPO','KVK','सरकार','कैलकुलेट',
  'interest','bank','बैंक','ऋण','किस्त','installment','premium',
  'solar','pump','polyhouse','warehouse','storage','भंडारण','गोदाम',
  'Sukanya','सुकन्या','tax','टैक्स','income','आय','खर्च','expense',
  'risk','जोखिम','diversify','विविधता','wealth','संपत्ति','financial','वित्तीय',
]

export default function FloatingAI() {
  const location = useLocation()
  const { t, lang } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  const suggested = t('ai.suggested') || []

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  function isRelevant(text) {
    const lower = text.toLowerCase()
    return ALLOWED_TOPICS.some(topic => lower.includes(topic.toLowerCase()))
  }

  if (['/login', '/onboarding'].includes(location.pathname)) return null
  if (!localStorage.getItem('fintech_token')) return null

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    if (!isRelevant(q)) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: t('ai.off_topic') }])
        setLoading(false)
      }, 400)
      return
    }

    try {
      const data = await education.askQuestion(q, lang)
      setMessages(prev => [...prev, { role: 'ai', text: data?.answer || t('ai.fallback_error') }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: t('ai.network_error') }])
    } finally {
      setLoading(false)
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <>
      {/* ═══ FLOATING BUTTON ═══ */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 ai-pulse transition-transform active:scale-90"
          style={{
            bottom: 20, right: 20,
            width: 58, height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--terra-500) 100%)',
            border: '2px solid rgba(255,252,247,0.25)',
            boxShadow: '0 4px 20px rgba(184, 101, 68, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Decorative ring */}
          <div className="absolute inset-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
          <span className="text-2xl relative" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>🌾</span>
        </button>
      )}

      {/* ═══ CHAT WINDOW ═══ */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col fade-in" style={{ maxWidth: 448, margin: '0 auto' }}>
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(26, 20, 16, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />

          {/* Chat panel */}
          <div className="relative mt-auto flex flex-col chat-enter overflow-hidden" 
            style={{ maxHeight: '85vh', minHeight: '55vh', borderRadius: '24px 24px 0 0', background: 'var(--surface)', boxShadow: '0 -8px 40px rgba(26, 20, 16, 0.25)' }}>

            {/* Header */}
            <div className="relative overflow-hidden grain-overlay flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--earth-950) 0%, var(--earth-900) 60%, var(--earth-800) 100%)' }}>
              <div className="relative px-4 py-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))', boxShadow: '0 2px 8px rgba(212, 149, 44, 0.3)' }}>
                  <span className="text-xl">🌾</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-200)' }}>
                    {t('ai.title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--earth-400)', fontFamily: 'var(--font-body)' }}>
                    {t('ai.subtitle')}
                  </p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--earth-400)', fontSize: 16 }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Safety banner */}
            <div className="mx-3 mt-2.5 px-3 py-2 rounded-lg flex-shrink-0"
              style={{ background: 'var(--gold-100)', border: '1px solid rgba(212, 149, 44, 0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--gold-600)', fontFamily: 'var(--font-body)' }}>
                {t('ai.safety_banner')}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  {/* Welcome */}
                  <div className="rounded-2xl p-3.5"
                    style={{ background: 'linear-gradient(135deg, var(--earth-900), var(--earth-800))', border: '1px solid var(--earth-700)' }}>
                    <p className="font-bold text-sm mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-300)' }}>
                      {t('ai.welcome')}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--earth-300)' }}>
                      {t('ai.welcome_desc')}
                    </p>
                  </div>

                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--earth-400)', letterSpacing: '0.1em' }}>
                    {t('ai.suggested_label')}
                  </p>
                  <div className="space-y-1.5">
                    {(Array.isArray(suggested) ? suggested : []).map(sq => (
                      <button key={sq.text} onClick={() => send(sq.text)}
                        className="w-full rounded-xl px-3 py-2.5 text-left flex items-center gap-2.5 transition-all active:scale-[0.98]"
                        style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)', boxShadow: '0 1px 3px rgba(42,31,20,0.04)' }}>
                        <span className="text-lg flex-shrink-0">{sq.icon}</span>
                        <span className="text-xs flex-1 leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                          {sq.text}
                        </span>
                        <span style={{ color: 'var(--earth-300)', fontSize: 14 }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-1.5 mt-1"
                      style={{ background: 'var(--gold-100)', border: '1px solid rgba(212,149,44,0.2)' }}>
                      <span style={{ fontSize: 11 }}>🌾</span>
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`} style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, var(--earth-900), var(--earth-800))',
                    color: 'var(--gold-200)',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 2px 6px rgba(26,20,16,0.15)',
                  } : {
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    border: '1px solid var(--earth-200)',
                    boxShadow: '0 1px 4px rgba(42,31,20,0.06)',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--gold-100)' }}>
                    <span style={{ fontSize: 11 }}>🌾</span>
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-card)', border: '1px solid var(--earth-200)' }}>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full"
                          style={{ background: 'var(--gold-500)', animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-3 py-2.5 flex gap-2 items-end"
              style={{ borderTop: '1px solid var(--earth-200)', background: 'var(--surface-card)' }}>
              <textarea
                ref={inputRef}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none resize-none leading-relaxed"
                placeholder={t('ai.input_placeholder')}
                value={input}
                rows={1}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{
                  maxHeight: 80,
                  fontFamily: 'var(--font-body)',
                  background: 'var(--earth-50)',
                  border: '1px solid var(--earth-200)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-30"
                style={{
                  background: 'linear-gradient(135deg, var(--gold-500), var(--terra-500))',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(212, 149, 44, 0.3)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
