import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'

// ─── Price Risk Score ─────────────────────────────────────────────────────────
const SCORE_QUESTIONS = [
  {
    id: 'crop_concentration',
    q: 'आप मुख्य रूप से कितनी फसलें बेचते हैं?',
    options: [
      { label: '3+ अलग-अलग फसलें ✅', pts: 0, color: 'green' },
      { label: '2 फसलें', pts: 20, color: 'yellow' },
      { label: 'सिर्फ 1 फसल 🔴', pts: 40, color: 'red' },
    ],
  },
  {
    id: 'market_channel',
    q: 'आप आमतौर पर कहाँ बेचते हैं?',
    options: [
      { label: 'FPO / eNAM / MSP — कई विकल्प ✅', pts: 0, color: 'green' },
      { label: 'सिर्फ स्थानीय मंडी', pts: 20, color: 'yellow' },
      { label: 'सिर्फ एक व्यापारी को 🔴', pts: 40, color: 'red' },
    ],
  },
  {
    id: 'storage',
    q: 'क्या आपके पास भंडारण की व्यवस्था है?',
    options: [
      { label: 'हाँ — warehouse / पक्का भंडार ✅', pts: 0, color: 'green' },
      { label: 'घर में कच्चा भंडार', pts: 15, color: 'yellow' },
      { label: 'नहीं — कटाई पर बेचना जरूरी 🔴', pts: 35, color: 'red' },
    ],
  },
  {
    id: 'price_knowledge',
    q: 'क्या आप बेचने से पहले मंडी का भाव जाँचते हैं?',
    options: [
      { label: 'हाँ — हमेशा eNAM / agmarknet देखता हूँ ✅', pts: 0, color: 'green' },
      { label: 'कभी-कभी', pts: 15, color: 'yellow' },
      { label: 'नहीं — जो मिले वो ले लेता हूँ 🔴', pts: 30, color: 'red' },
    ],
  },
  {
    id: 'loan_pressure',
    q: 'क्या कर्ज/EMI के दबाव में कटाई पर ही बेचना पड़ता है?',
    options: [
      { label: 'नहीं — Emergency Fund है ✅', pts: 0, color: 'green' },
      { label: 'कभी-कभी मजबूरी होती है', pts: 20, color: 'yellow' },
      { label: 'हाँ — हर बार कर्ज चुकाने को बेचना पड़ता है 🔴', pts: 40, color: 'red' },
    ],
  },
]

// ─── Sections ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'msp',
    icon: '🏛️',
    title: 'MSP क्या है — सही जानकारी',
    sub: 'What is MSP?',
    color: 'from-amber-600 to-orange-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    desc: 'MSP ≠ गारंटीड खरीद — यह गलतफहमी बहुत नुकसान पहुँचाती है',
  },
  {
    id: 'reality',
    icon: '⚠️',
    title: 'खरीद की जमीनी सच्चाई',
    sub: 'Procurement Reality',
    color: 'from-red-600 to-rose-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    desc: 'मॉइस्चर मानक, देरी, सीमित खरीद — MSP पर भरोसे की सीमा',
  },
  {
    id: 'cycle',
    icon: '📉',
    title: 'भाव का सीजनल चक्र',
    sub: 'Price Cycle Understanding',
    color: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'कटाई पर भाव कम, बाद में ज्यादा — इस cycle से फायदा उठाएं',
  },
  {
    id: 'storage_science',
    icon: '🏚️',
    title: 'भंडारण निर्णय विज्ञान',
    sub: 'Storage Decision Science',
    color: 'from-teal-600 to-cyan-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    desc: 'भंडारण सिर्फ तभी — जब (भाव वृद्धि) > (भंडारण लागत + ब्याज)',
  },
  {
    id: 'channels',
    icon: '🔀',
    title: 'बिक्री चैनल तुलना',
    sub: 'Selling Channels Comparison',
    color: 'from-violet-600 to-purple-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    desc: 'मंडी vs MSP vs व्यापारी vs FPO — नेट प्राइस तुलना',
  },
  {
    id: 'negotiation',
    icon: '🤝',
    title: 'मोलभाव और लागत जागरूकता',
    sub: 'Negotiation & Cost Awareness',
    color: 'from-green-600 to-emerald-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    desc: 'जानकारी = शक्ति — मंडी रेट जानकर बेहतर दाम पाएं',
  },
]

// ─── Main Hub ─────────────────────────────────────────────────────────────────
export default function Market() {
  const navigate = useNavigate()
  const [view, setView]       = useState('hub')
  const [score, setScore]     = useState(null)
  const [answers, setAnswers] = useState({})
  const [showLogout, setShowLogout] = useState(false)
  const user = JSON.parse(localStorage.getItem('fintech_user') || '{}')

  function handleLogout() { auth.clearToken(); navigate('/login') }

  function submitScore() {
    let total = 0
    SCORE_QUESTIONS.forEach(q => {
      const i = answers[q.id]
      if (i !== undefined) total += q.options[i].pts
    })
    setScore(Math.min(100, total))
    setView('hub')
  }

  const answeredAll = Object.keys(answers).length === SCORE_QUESTIONS.length
  const sc = score === null ? null : score <= 30 ? 'green' : score <= 60 ? 'yellow' : 'red'
  const sl = score === null ? null : score <= 30 ? 'कम जोखिम' : score <= 60 ? 'मध्यम जोखिम' : 'उच्च मूल्य जोखिम'
  const se = score === null ? null : score <= 30 ? '✅' : score <= 60 ? '⚠️' : '🔴'

  if (view === 'score') return (
    <ScoreScreen answers={answers} setAnswers={setAnswers}
      answeredAll={answeredAll} onSubmit={submitScore} onBack={() => setView('hub')} />
  )
  const sec = SECTIONS.find(s => s.id === view)
  if (sec) return <SectionDetail section={sec} onBack={() => setView('hub')} navigate={navigate} />

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900 via-amber-800 to-yellow-900 px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/10 rounded-full translate-y-1/2" />

        <div className="flex items-center justify-between mb-4 relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-amber-300 text-sm">
            <span className="text-xl font-bold">‹</span><span>होम</span>
          </button>
          <button onClick={() => setShowLogout(true)}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            🚪 लॉगआउट
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/30">
            <span className="text-3xl">📈</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">बाजार बुद्धिमत्ता</h1>
            <p className="text-amber-300 text-xs mt-0.5">Market & MSP Intelligence</p>
          </div>
        </div>

        <div className="relative mt-3 bg-white/10 rounded-xl p-3">
          <p className="text-amber-100 text-xs leading-relaxed">
            🎯 <span className="text-white font-medium">MSP की सच्चाई • सही समय पर बेचें • चैनल तुलना • मोलभाव की शक्ति</span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Price Risk Score */}
        <div className={`rounded-2xl p-4 border-2 ${
          score === null ? 'bg-white border-gray-200' :
          sc === 'green' ? 'bg-green-50 border-green-300' :
          sc === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
        }`}>
          {score === null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">📊 मूल्य जोखिम स्कोर जाँचें</p>
                <p className="text-xs text-gray-500 mt-0.5">5 सवाल • 2 मिनट • तुरंत रिपोर्ट</p>
              </div>
              <button onClick={() => setView('score')}
                className="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                शुरू करें →
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">मूल्य जोखिम स्कोर</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    sc === 'green' ? 'text-green-600' : sc === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{se} {sl}</p>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  sc === 'green' ? 'bg-green-500' : sc === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-2xl font-bold">{score}</span>
                </div>
              </div>
              <div className="h-3 bg-white/50 rounded-full overflow-hidden border border-white/30">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  sc === 'green' ? 'bg-green-500' : sc === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${score}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-60">
                <span>0 कम</span><span>30</span><span>60</span><span>100 ज्यादा</span>
              </div>
              <button onClick={() => setView('score')} className="mt-2 text-xs text-orange-600 font-medium">
                फिर से जाँचें →
              </button>
            </div>
          )}
        </div>

        {/* 6 Section Cards */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">6 अनुभाग</p>
          <div className="space-y-2.5">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setView(s.id)}
                className={`w-full ${s.bg} border ${s.border} rounded-2xl p-4 text-left active:scale-98 transition-all`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{s.desc}</p>
                  </div>
                  <span className="text-gray-300 text-xl">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Calculators */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">🧮 सीधे कैलकुलेटर</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { path: '/tools/storage',      icon: '🏚️', label: 'भंडारण निर्णय' },
              { path: '/tools/crop-compare', icon: '🆚',  label: 'फसल तुलना' },
              { path: '/tools/break-even',   icon: '⚖️',  label: 'Break-Even भाव' },
              { path: '/tools/crop-profit',  icon: '🌾',  label: 'मुनाफा हिसाब' },
            ].map(c => (
              <button key={c.path} onClick={() => navigate(c.path)}
                className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100 active:bg-gray-100">
                <span className="text-xl">{c.icon}</span>
                <p className="text-xs text-gray-600 font-medium text-left leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cross-section links */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/schemes')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xl">🏛️</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">eNAM / MSP योजना</p>
            <p className="text-xs text-amber-500">सरकारी खरीद पोर्टल</p>
          </button>
          <button onClick={() => navigate('/risk')}
            className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
            <p className="text-xl">🛡️</p>
            <p className="text-xs font-semibold text-rose-700 mt-1">जोखिम सुरक्षा</p>
            <p className="text-xs text-rose-500">PMFBY • Diversify</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/cashflow')}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left">
            <p className="text-xl">💸</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Cash Flow</p>
            <p className="text-xs text-emerald-500">Distress selling से बचें</p>
          </button>
          <button onClick={() => navigate('/loans')}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-left">
            <p className="text-xl">🏦</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">कर्ज सलाह</p>
            <p className="text-xs text-indigo-500">KCC Working Capital</p>
          </button>
          <button onClick={() => navigate('/wealth')}
            className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-left col-span-2">
            <div className="flex items-center gap-2">
              <p className="text-xl">🌱</p>
              <div>
                <p className="text-xs font-semibold text-teal-700">संपत्ति व विकास</p>
                <p className="text-xs text-teal-400">अतिरिक्त मुनाफा कहाँ लगाएं • बचत • खेती विस्तार</p>
              </div>
            </div>
          </button>
        </div>

        <button onClick={() => navigate('/learn')}
          className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📘</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-orange-700">Module 5 — विस्तार से पढ़ें</p>
            <p className="text-xs text-orange-500">Market & MSP Intelligence — सीखें अनुभाग में</p>
          </div>
          <span className="text-orange-300 text-xl ml-auto">›</span>
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-gray-800">लॉगआउट करें?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogout(false)}
                className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm">रुकें</button>
              <button onClick={handleLogout}
                className="py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">हाँ, लॉगआउट</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Score Quiz ───────────────────────────────────────────────────────────────
function ScoreScreen({ answers, setAnswers, answeredAll, onSubmit, onBack }) {
  const [current, setCurrent] = useState(0)
  const q = SCORE_QUESTIONS[current]
  const progress = (current / SCORE_QUESTIONS.length) * 100

  function select(i) {
    setAnswers(p => ({ ...p, [q.id]: i }))
    if (current < SCORE_QUESTIONS.length - 1) setTimeout(() => setCurrent(c => c + 1), 280)
  }

  return (
    <div className="min-h-screen bg-orange-950 flex flex-col">
      <div className="px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-orange-300 text-sm flex items-center gap-1 mb-4">
          <span className="text-xl">‹</span> वापस
        </button>
        <div className="flex justify-between text-xs text-orange-400 mb-2">
          <span>सवाल {current + 1} / {SCORE_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-orange-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="bg-orange-900 rounded-3xl p-6 mb-6">
          <p className="text-xs text-orange-400 mb-2">प्रश्न {current + 1}</p>
          <p className="text-white text-lg font-bold leading-snug">{q.q}</p>
        </div>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => select(i)}
              className={`w-full p-4 rounded-2xl text-left text-sm font-medium border-2 transition-all ${
                answers[q.id] === i
                  ? opt.color === 'green' ? 'bg-green-500 border-green-400 text-white'
                    : opt.color === 'yellow' ? 'bg-yellow-500 border-yellow-400 text-white'
                    : 'bg-red-500 border-red-400 text-white'
                  : 'bg-orange-800 border-orange-700 text-orange-100 active:bg-orange-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  answers[q.id] === i ? 'bg-white border-white' : 'border-orange-500'
                }`}>
                  {answers[q.id] === i && <div className="w-2.5 h-2.5 rounded-full bg-orange-700" />}
                </div>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {answeredAll && (
        <div className="p-4">
          <button onClick={onSubmit}
            className="w-full py-4 bg-yellow-400 text-orange-900 font-bold text-base rounded-2xl">
            मेरा स्कोर देखें →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Section Detail ───────────────────────────────────────────────────────────
function SectionDetail({ section, onBack, navigate }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className={`bg-gradient-to-br ${section.color} text-white px-4 pt-10 pb-5`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span> बाजार बुद्धिमत्ता
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">{section.icon}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{section.title}</h1>
            <p className="text-xs text-white/70">{section.sub}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {CONTENT[section.id]}

        {CALC_LINKS[section.id] && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">🧮 अभी हिसाब करें</p>
            <div className="space-y-2">
              {CALC_LINKS[section.id].map(c => (
                <button key={c.path} onClick={() => navigate(c.path)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100">
                  <span className="text-xl">{c.icon}</span>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-gray-700">{c.label}</p>
                    <p className="text-xs text-gray-400">{c.hint}</p>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function IC({ title, color = 'amber', children }) {
  const c = {
    amber:  'bg-amber-50 border-amber-200',  blue:   'bg-blue-50 border-blue-200',
    green:  'bg-green-50 border-green-200',  red:    'bg-red-50 border-red-200',
    teal:   'bg-teal-50 border-teal-200',    orange: 'bg-orange-50 border-orange-200',
    violet: 'bg-violet-50 border-violet-200',gray:   'bg-gray-50 border-gray-200',
  }
  return (
    <div className={`rounded-2xl border ${c[color] || c.gray} p-4`}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  )
}
function EX({ children, color = 'amber' }) {
  const c = { amber: 'bg-amber-100 text-amber-800', green: 'bg-green-100 text-green-800', blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800' }
  return <div className={`rounded-xl px-3 py-2 text-xs font-medium mt-2 ${c[color]}`}>📋 उदाहरण: {children}</div>
}

// ─── Calc links per section ───────────────────────────────────────────────────
const CALC_LINKS = {
  cycle:           [{ path: '/tools/storage',      icon: '🏚️', label: 'भंडारण निर्णय', hint: 'क्या इंतजार करना फायदेमंद है?' }],
  storage_science: [{ path: '/tools/storage',      icon: '🏚️', label: 'भंडारण निर्णय', hint: 'Net gain calculate करें' },
                    { path: '/tools/emi-safety',   icon: '📊', label: 'EMI Safety जाँचें', hint: 'Cash stress है तो न रोकें' }],
  channels:        [{ path: '/tools/crop-profit',  icon: '🌾', label: 'Net Price Calculator', hint: 'परिवहन/कमीशन घटाकर तुलना' },
                    { path: '/tools/crop-compare', icon: '🆚', label: 'फसल तुलना', hint: 'कौन सी फसल किस चैनल से?' }],
  negotiation:     [{ path: '/tools/break-even',   icon: '⚖️', label: 'Break-Even Price', hint: 'न्यूनतम बिक्री मूल्य जानें' }],
  msp:             [{ path: '/schemes',             icon: '🏛️', label: 'MSP/eNAM योजनाएं', hint: 'सरकारी खरीद portal' }],
}

// ─── Section Content ──────────────────────────────────────────────────────────
const CONTENT = {

  msp: (
    <div className="space-y-3">
      <div className="bg-amber-600 rounded-2xl p-4 text-white">
        <p className="text-base font-bold">⚠️ सबसे बड़ी गलतफहमी</p>
        <p className="text-sm text-amber-100 mt-1">MSP announced होना ≠ आपकी फसल MSP पर बिकेगी</p>
      </div>

      <IC title="📋 MSP क्या है — सटीक परिभाषा" color="amber">
        <div className="space-y-2 text-xs">
          {[
            { label: 'MSP का full form', val: 'Minimum Support Price' },
            { label: 'कब announce होता है', val: 'बुआई से पहले — CACP recommendation पर' },
            { label: 'किसके लिए लागू', val: '23 फसलें — गेहूं, धान, दाल आदि' },
            { label: 'खरीद की guarantee', val: '❌ नहीं — यह price floor है, खरीद नहीं' },
          ].map(r => (
            <div key={r.label} className="flex justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-gray-600">{r.label}</span>
              <span className="font-semibold text-gray-800 text-right max-w-xs">{r.val}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="🗺️ खरीद किस पर निर्भर करती है?" color="red">
        <div className="space-y-1.5 text-xs">
          {[
            '🏛️ राज्य सरकार — खरीद करे या न करे, उस पर निर्भर',
            '🌾 फसल — गेहूं/धान में FCI खरीदता है, दालों में NAFED',
            '📍 जिला — procurement center हर जिले में नहीं',
            '📅 समय — center खुलने की deadline होती है',
            '💧 गुणवत्ता — moisture, impurity standards पूरे होने पर ही',
          ].map(s => <div key={s} className="bg-red-50 rounded-lg px-3 py-2 text-red-700">{s}</div>)}
        </div>
      </IC>

      <IC title="✅ MSP का सही उपयोग" color="green">
        <div className="space-y-2 text-sm text-gray-700">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="font-semibold text-green-700 mb-1">MSP को Price Floor की तरह use करें:</p>
            <p className="text-xs">MSP से नीचे कभी न बेचें → अगर नीचे मिल रहा हो तो MSP center जाएं या FPO से बेचें</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="font-semibold text-blue-700 mb-1">Check करें:</p>
            <p className="text-xs">• agmarknet.nic.in — रोज का भाव<br />• Krishak Setu app — जिले का खरीद केंद्र<br />• PM Kisan portal — procurement status</p>
          </div>
        </div>
      </IC>
    </div>
  ),

  reality: (
    <div className="space-y-3">
      <IC title="⚠️ 5 ज़मीनी सच्चाइयाँ" color="red">
        <div className="space-y-2.5">
          {[
            { num: '1', title: 'Limited Procurement', desc: 'अनाज की माँग से कम खरीदा जाता है — जल्दी जाएं' },
            { num: '2', title: 'Delay होना सामान्य है', desc: 'Token मिले तो भी 2-7 दिन में payment हो सकता है' },
            { num: '3', title: 'Quality Standards सख्त', desc: 'Moisture, foreign matter, shriveled grains — reject हो सकते हैं' },
            { num: '4', title: 'Document जरूरी', desc: 'Aadhaar, Land record, Bank passbook — सब original चाहिए' },
            { num: '5', title: 'Center बंद होने की deadline', desc: 'Season समाप्त होने पर center बंद — फिर मंडी में ही बेचना पड़ेगा' },
          ].map(w => (
            <div key={w.num} className="bg-white rounded-xl border-l-4 border-red-500 px-4 py-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {w.num}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{w.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{w.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </IC>

      <IC title="💧 Moisture Standards" color="blue">
        <p className="text-xs text-gray-500 mb-2">MSP procurement के लिए अधिकतम नमी:</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { crop: '🌾 गेहूं', limit: '≤ 12%' },
            { crop: '🌾 धान', limit: '≤ 17%' },
            { crop: '🫘 दाल', limit: '≤ 10%' },
            { crop: '🌼 सरसों', limit: '≤ 8%' },
            { crop: '🫘 सोयाबीन', limit: '≤ 12%' },
            { crop: '🌽 मक्का', limit: '≤ 14%' },
          ].map(r => (
            <div key={r.crop} className="bg-blue-50 rounded-lg p-2 flex justify-between">
              <span className="text-gray-700">{r.crop}</span>
              <span className="font-bold text-blue-700">{r.limit}</span>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 rounded-xl p-2 mt-2 text-xs text-orange-700">
          💡 Harvest के बाद 3-4 दिन धूप में सुखाएं — moisture कम होती है
        </div>
      </IC>
    </div>
  ),

  cycle: (
    <div className="space-y-3">
      <IC title="📉 हार्वेस्ट के बाद भाव क्यों गिरता है?" color="blue">
        <div className="space-y-2 text-xs">
          {[
            { phase: 'कटाई का समय', supply: '⬆️ Supply ज्यादा', price: '⬇️ भाव कम', color: 'bg-red-50' },
            { phase: '2-3 महीने बाद', supply: '→ Supply सामान्य', price: '→ भाव ठीक होता है', color: 'bg-yellow-50' },
            { phase: '4-5 महीने बाद', supply: '⬇️ Supply कम', price: '⬆️ भाव अच्छा', color: 'bg-green-50' },
          ].map(p => (
            <div key={p.phase} className={`rounded-lg p-3 ${p.color}`}>
              <p className="font-bold text-gray-700">{p.phase}</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <p className="text-gray-600">{p.supply}</p>
                <p className="text-gray-600">{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </IC>

      <IC title="📊 असली नंबर — गेहूं उदाहरण" color="amber">
        <p className="text-xs text-gray-500 mb-2">80 क्विंटल गेहूं:</p>
        <div className="space-y-1.5 text-xs">
          {[
            { time: 'कटाई पर (अप्रैल)', price: '₹2,000/क्विं.', total: '₹1,60,000', tag: '' },
            { time: '3 माह बाद (जुलाई)', price: '₹2,250/क्विं.', total: '₹1,80,000', tag: '' },
            { time: 'अतिरिक्त आय', price: '', total: '+₹20,000', tag: 'gross' },
            { time: '(−) भंडारण लागत', price: '', total: '₹4,000', tag: 'cost' },
            { time: '(−) 3 माह ब्याज (9%)', price: '', total: '₹3,600', tag: 'cost' },
            { time: '✅ Net Gain', price: '', total: '₹12,400', tag: 'net' },
          ].map(r => (
            <div key={r.time} className={`flex justify-between rounded-lg px-3 py-2 ${
              r.tag === 'net' ? 'bg-green-50' : r.tag === 'gross' ? 'bg-amber-50' : 'bg-gray-50'
            }`}>
              <span className="text-gray-600">{r.time}</span>
              <span className={`font-semibold ${r.tag === 'net' ? 'text-green-700' : r.tag === 'cost' ? 'text-red-600' : 'text-gray-800'}`}>
                {r.total}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 rounded-xl p-3 mt-2 text-xs text-orange-700">
          ⚠️ Net Gain निकाले बिना "बाद में मिलेगा ज्यादा" सोचना गलत है — हमेशा calculate करें
        </div>
      </IC>

      <IC title="📅 Seasonal Price Calendar" color="teal">
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { crop: 'गेहूं', low: 'मार्च-अप्रैल', high: 'जून-अगस्त' },
            { crop: 'धान', low: 'अक्टूबर-नवंबर', high: 'जनवरी-मार्च' },
            { crop: 'सरसों', low: 'फरवरी-मार्च', high: 'मई-जून' },
            { crop: 'दाल', low: 'नवंबर', high: 'फरवरी-मार्च' },
          ].map(r => (
            <div key={r.crop} className="bg-teal-50 rounded-lg p-2">
              <p className="font-bold text-teal-700">{r.crop}</p>
              <p className="text-red-600 text-xs">⬇️ {r.low}</p>
              <p className="text-green-600 text-xs">⬆️ {r.high}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">⚠️ ये average patterns हैं — हर साल अलग हो सकते हैं</p>
      </IC>
    </div>
  ),

  storage_science: (
    <div className="space-y-3">
      <IC title="🔬 Scientific Formula" color="teal">
        <div className="bg-teal-100 rounded-xl p-3 text-sm font-semibold text-teal-800 text-center">
          भंडारण तभी करें जब:<br />
          <span className="text-green-700">(भाव वृद्धि × मात्रा)</span> &gt; <span className="text-red-600">(भंडारण लागत + ब्याज)</span>
        </div>
        <EX color="green">qty=80 क्विं, भाव ₹250 बढ़ा → ₹20,000 gain &gt; ₹7,600 cost = ✅ भंडारण करें</EX>
        <EX color="red">qty=20 क्विं, भाव ₹100 बढ़ा → ₹2,000 gain &lt; ₹3,000 cost = ❌ अभी बेचें</EX>
      </IC>

      <IC title="💰 Storage Cost Calculate करें" color="amber">
        <p className="text-xs text-gray-500 mb-2">प्रति माह खर्च (50 क्विंटल, 3 महीने):</p>
        <div className="space-y-1.5 text-xs">
          {[
            { item: 'WDRA Warehouse', rate: '₹2-4/kg/माह', cost: '₹3,000-6,000', tag: 'safe' },
            { item: 'घर में भंडारण', rate: '₹0.5-1/kg/माह', cost: '₹750-1,500', tag: 'risky' },
            { item: 'ब्याज लागत (9%/वर्ष)', rate: '₹750/लाख/माह', cost: 'loan amount पर', tag: 'always' },
          ].map(r => (
            <div key={r.item} className={`flex justify-between rounded-lg px-3 py-2 ${
              r.tag === 'safe' ? 'bg-green-50' : r.tag === 'risky' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div>
                <p className="font-medium text-gray-700">{r.item}</p>
                <p className="text-gray-400">{r.rate}</p>
              </div>
              <span className="font-bold text-gray-800">{r.cost}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="🏦 Warehouse Receipt Loan" color="blue">
        <p className="text-sm text-gray-700 leading-relaxed mb-2">WDRA warehouse में रखें → NWR (Negotiable Warehouse Receipt) मिले → उस पर loan लें → Cash भी मिले, फसल भी रहे</p>
        <div className="space-y-1 text-xs">
          {[
            '✅ Loan: 70-80% of commodity value',
            '✅ Interest: 7-9% — मंडी कर्ज से सस्ता',
            '✅ Fसल सुरक्षित — government-regulated',
            '✅ जब चाहें बेचें — flexibility',
          ].map(s => <div key={s} className="bg-blue-50 rounded-lg px-3 py-2 text-blue-700">{s}</div>)}
        </div>
        <div className="bg-orange-50 rounded-xl p-2 mt-2 text-xs text-orange-700">
          ⚠️ EMI pressure ज्यादा है तो पहले EMI चुकाएं — storage risk नहीं उठाएं
        </div>
      </IC>
    </div>
  ),

  channels: (
    <div className="space-y-3">
      <IC title="🔀 Net Price Formula" color="violet">
        <div className="bg-violet-100 rounded-xl p-3 text-sm font-semibold text-violet-800 text-center">
          Net Price = Selling Price<br />
          − Transport − Commission<br />
          − Loading/Unloading − Time cost
        </div>
        <div className="bg-orange-50 rounded-xl p-2 mt-2 text-xs text-orange-700">
          💡 दूर का ज्यादा भाव भी net में कम हो सकता है — हमेशा net निकालें
        </div>
      </IC>

      <IC title="📊 Channel Comparison" color="gray">
        <p className="text-xs text-gray-500 mb-2">50 क्विंटल गेहूं, मंडी भाव ₹2,200/क्विं.:</p>
        <div className="space-y-2">
          {[
            {
              channel: '🏛️ स्थानीय मंडी',
              gross: '₹1,10,000',
              deductions: 'Commission 4% + Loading ₹500 = ₹4,900',
              net: '₹1,05,100',
              color: 'bg-gray-50',
            },
            {
              channel: '🏛️ MSP Center',
              gross: '₹1,10,250 (@ ₹2,205)',
              deductions: 'Transport ₹2,000 = ₹2,000',
              net: '₹1,08,250',
              color: 'bg-green-50',
            },
            {
              channel: '🤝 FPO / eNAM',
              gross: '₹1,12,500 (@ ₹2,250)',
              deductions: '2% fee + Transport = ₹3,250',
              net: '₹1,09,250',
              color: 'bg-blue-50',
            },
            {
              channel: '👤 सीधे व्यापारी',
              gross: '₹1,07,500 (@ ₹2,150)',
              deductions: '0 commission',
              net: '₹1,07,500',
              color: 'bg-yellow-50',
            },
          ].map(r => (
            <div key={r.channel} className={`rounded-xl p-3 ${r.color}`}>
              <p className="text-sm font-bold text-gray-800">{r.channel}</p>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Gross: {r.gross}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-500">कटौती: {r.deductions}</span>
                <span className="font-bold text-gray-800">Net: {r.net}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">* उदाहरण मूल्य — वास्तविक स्थिति अलग होगी</p>
      </IC>
    </div>
  ),

  negotiation: (
    <div className="space-y-3">
      <IC title="💪 जानकारी = मोलभाव की शक्ति" color="green">
        <p className="text-sm text-gray-700 leading-relaxed">जो किसान मंडी का भाव जानता है वो बेहतर दाम पाता है। जो नहीं जानता वो जो मिले ले लेता है।</p>
        <EX color="green">Ramesh ने agmarknet.nic.in पर देखा — wheat ₹2,180 चल रहा है। व्यापारी ₹2,050 दे रहा था। Ramesh ने मना किया, मंडी गया → ₹2,160 मिला। 50 क्विं. × ₹110 = ₹5,500 extra।</EX>
      </IC>

      <IC title="📱 भाव जाँचने के Tools" color="blue">
        <div className="space-y-2 text-xs">
          {[
            { tool: 'agmarknet.nic.in', use: 'रोज का mandi rate — 2,000+ mandis', free: true },
            { tool: 'eNAM portal / app', use: 'Online trading + price discovery', free: true },
            { tool: 'Krishak Setu app', use: 'State-wise prices + procurement center', free: true },
            { tool: 'DAMU / State apps', use: 'Rajasthan, MP, UP — state specific', free: true },
          ].map(r => (
            <div key={r.tool} className="flex items-start justify-between bg-blue-50 rounded-lg px-3 py-2">
              <div>
                <p className="font-bold text-blue-700">{r.tool}</p>
                <p className="text-gray-600">{r.use}</p>
              </div>
              <span className="text-green-600 font-medium flex-shrink-0 ml-2">Free</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="💬 मोलभाव के 5 तरीके" color="green">
        <div className="space-y-2 text-xs">
          {[
            { tip: 'Data दिखाएं', detail: '"आज X मंडी में ₹Y चल रहा है" — phone पर दिखाएं' },
            { tip: 'Alternative हो', detail: '"नहीं दोगे तो FPO/दूसरी मंडी जाऊंगा" — विकल्प रखें' },
            { tip: 'Break-even जानें', detail: 'उससे नीचे बेचना = नुकसान — firm रहें' },
            { tip: 'Group में बेचें', detail: 'FPO से 5-10 किसान मिलकर — bargaining power बढ़ती है' },
            { tip: 'Commission पूछें', detail: 'Standard 2% है — 4%+ माँगे तो negotiate करें' },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-green-100 p-3">
              <p className="font-bold text-green-700 text-xs">{i+1}. {t.tip}</p>
              <p className="text-gray-600 text-xs mt-0.5">{t.detail}</p>
            </div>
          ))}
        </div>
      </IC>
    </div>
  ),
}
