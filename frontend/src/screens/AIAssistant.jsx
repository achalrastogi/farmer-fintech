import { useState, useRef } from 'react'
import { education } from '../lib/api'
import TopNav from '../components/TopNav'
import { useTranslation } from '../hooks/useTranslation'

const SUGGESTED_QUESTIONS = [
  { text: 'UP में सोलर पंप के लिए कौन सी सब्सिडी है?', icon: '☀️' },
  { text: 'मेरे पास 2 एकड़ जमीन है, कौन सी योजनाएं मिलेंगी?', icon: '🌾' },
  { text: 'फसल बीमा का दावा क्यों अस्वीकृत हुआ?', icon: '❌' },
  { text: 'KCC के लिए क्या-क्या दस्तावेज चाहिए?', icon: '📄' },
  { text: 'PM-Kisan की किस्त क्यों नहीं आई?', icon: '💰' },
  { text: 'सबसे सस्ता कर्ज कैसे मिलेगा?', icon: '🏦' },
]

const AI_SYSTEM_PROMPT = (profile) => `You are a trusted financial advisor for Indian farmers. You help with:
1. Government schemes (PM-Kisan, PMFBY, KCC, subsidies)
2. Farm finance (loans, crop profit, savings)
3. Eligibility questions
4. Application processes

User profile: State: ${profile?.state || 'not set'}, Farm: ${profile?.farm_size_acres || 'not set'} acres, Crop: ${profile?.crop_type || 'not set'}

Rules:
- Answer in ${profile?.language || 'Hindi'} only
- Be specific and fact-based  
- Never guarantee scheme approval
- Never give political opinions
- Always suggest official portal for verification
- Keep answers concise (3-5 sentences)
- End with official resource when applicable`

export default function AIAssistant() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const profile = JSON.parse(localStorage.getItem('fintech_profile') || '{}')

  const sendMessage = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg = { role: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const fullQuestion = `${AI_SYSTEM_PROMPT(profile)}\n\nUser question: ${q}`

    try {
      const res = await education.ask(fullQuestion, 'hi')
      setMessages(prev => [...prev, {
        role: 'ai',
        text: res?.answer || t('ai_assistant.fallback_msg')
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: t('ai_assistant.error_msg')
      }])
    } finally {
      setLoading(false)
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav title={t('ai_assistant.title')} subtitle={t('ai_assistant.subtitle')} backTo="/" />

      {/* Safety Banner */}
      <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-700 leading-relaxed">
          {t('ai_assistant.safety_banner')}
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
        {messages.length === 0 && (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-2xl p-4">
              <p className="font-bold mb-1">{t('ai_assistant.welcome_title')}</p>
              <p className="text-sm opacity-90">{t('ai_assistant.welcome_desc')}</p>
            </div>

            {/* Suggested questions */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {t('ai_assistant.suggested_label')}
              </p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map(sq => (
                  <button
                    key={sq.text}
                    onClick={() => sendMessage(sq.text)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-left flex items-center gap-3 active:bg-gray-50 shadow-sm"
                  >
                    <span className="text-xl flex-shrink-0">{sq.icon}</span>
                    <span className="text-sm text-gray-700 leading-tight">{sq.text}</span>
                    <span className="text-gray-300 ml-auto">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <span className="text-sm">🤖</span>
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-green-600 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'}`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
        <div className="max-w-md mx-auto flex gap-2 items-end">
          <textarea
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-teal-400 resize-none leading-relaxed"
            placeholder={t('ai_assistant.input_placeholder')}
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            style={{ maxHeight: 100 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-teal-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
          >
            <span className="text-lg">→</span>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">{t('ai_assistant.footer_note')}</p>
      </div>
    </div>
  )
}
