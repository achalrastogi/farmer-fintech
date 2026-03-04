import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'

// ─── Risk Profile Builder ─────────────────────────────────────────────────────
const RISK_CATEGORIES = [
  { id: 'weather',    icon: '🌧️', label: 'मौसम जोखिम',     sub: 'Weather Risk',   examples: 'बाढ़, सूखा, ओलावृष्टि, अनावृष्टि' },
  { id: 'pest',      icon: '🐛',  label: 'कीट/रोग जोखिम',  sub: 'Pest/Disease',   examples: 'टिड्डी, ब्लाइट, फंगस, वायरस' },
  { id: 'price',     icon: '📉',  label: 'बाजार/भाव जोखिम', sub: 'Market Risk',    examples: 'भाव गिरना, oversupply, export ban' },
  { id: 'financial', icon: '💸',  label: 'वित्तीय जोखिम',   sub: 'Financial Risk', examples: 'कर्ज बोझ, EMI, cash crunch' },
  { id: 'personal',  icon: '🏥',  label: 'व्यक्तिगत जोखिम', sub: 'Personal Risk',  examples: 'बीमारी, दुर्घटना, परिवार संकट' },
  { id: 'input',     icon: '🌱',  label: 'इनपुट जोखिम',     sub: 'Input Risk',     examples: 'बीज/खाद की कमी, बिजली कटौती' },
]

// ─── Risk Score Quiz ──────────────────────────────────────────────────────────
const SCORE_QUESTIONS = [
  {
    id: 'crop_concentration',
    q: 'आप कितनी फसलें उगाते हैं?',
    options: [
      { label: '3+ फसलें (विविध) ✅', pts: 0, color: 'green' },
      { label: '2 फसलें', pts: 15, color: 'yellow' },
      { label: 'सिर्फ 1 फसल 🔴', pts: 35, color: 'red' },
    ],
  },
  {
    id: 'insurance',
    q: 'क्या आपने PMFBY या कोई फसल बीमा लिया है?',
    options: [
      { label: 'हाँ — इस सीजन बीमा है ✅', pts: 0, color: 'green' },
      { label: 'कभी-कभी लेता हूँ', pts: 20, color: 'yellow' },
      { label: 'नहीं — कभी नहीं लिया 🔴', pts: 40, color: 'red' },
    ],
  },
  {
    id: 'emergency_fund',
    q: 'आपातकालीन फंड कितने महीने के खर्च को कवर करता है?',
    options: [
      { label: '6+ महीने ✅', pts: 0, color: 'green' },
      { label: '3-6 महीने', pts: 15, color: 'yellow' },
      { label: '1-3 महीने', pts: 30, color: 'yellow' },
      { label: 'कोई फंड नहीं 🔴', pts: 50, color: 'red' },
    ],
  },
  {
    id: 'debt_load',
    q: 'कुल कर्ज, वार्षिक खेती आय का कितना % है?',
    options: [
      { label: '50% से कम', pts: 0, color: 'green' },
      { label: '50–100%', pts: 20, color: 'yellow' },
      { label: '100% से ज्यादा 🔴', pts: 40, color: 'red' },
      { label: 'कोई कर्ज नहीं ✅', pts: 0, color: 'green' },
    ],
  },
  {
    id: 'diversification',
    q: 'क्या खेती के अलावा कोई आय का स्रोत है?',
    options: [
      { label: 'हाँ — डेयरी / मजदूरी / व्यापार ✅', pts: 0, color: 'green' },
      { label: 'थोड़ा बहुत', pts: 10, color: 'yellow' },
      { label: 'नहीं — सिर्फ खेती 🔴', pts: 25, color: 'red' },
    ],
  },
]

// ─── 6 Sections ───────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'types',    icon: '📋', title: 'खेती के 4 जोखिम',      sub: 'Types of Farm Risks',        color: 'from-slate-600 to-gray-700',   bg: 'bg-slate-50', border: 'border-slate-200', desc: 'उत्पादन, बाजार, वित्तीय, व्यक्तिगत — अपना Risk Profile बनाएं' },
  { id: 'weather',  icon: '🌧️', title: 'मौसम जोखिम',           sub: 'Weather Risk & Planning',    color: 'from-blue-600 to-sky-700',     bg: 'bg-blue-50',  border: 'border-blue-200',  desc: 'बाढ़/सूखे का वित्तीय प्रभाव और बचाव की रणनीति' },
  { id: 'pest',     icon: '🐛', title: 'कीट व उत्पादन जोखिम', sub: 'Pest & Production Risk',     color: 'from-amber-600 to-yellow-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'कीट से आय पर असर — मार्जिन buffer क्यों जरूरी है' },
  { id: 'market',   icon: '📉', title: 'बाजार व भाव जोखिम',    sub: 'Market & Price Risk',        color: 'from-orange-600 to-red-700',   bg: 'bg-orange-50',border: 'border-orange-200',desc: 'भाव गिरना, oversupply — इससे कैसे बचें' },
  { id: 'insurance',icon: '🛡️', title: 'बीमा — सरल भाषा में', sub: 'Insurance Explained',        color: 'from-green-600 to-emerald-700',bg: 'bg-green-50', border: 'border-green-200', desc: 'PMFBY क्या है, कब काम आती है, कब नहीं' },
  { id: 'diversify',icon: '🌈', title: 'विविधता से स्थिरता',   sub: 'Diversification & Stability',color: 'from-violet-600 to-purple-700',bg: 'bg-violet-50',border: 'border-violet-200',desc: '100% एक फसल vs 60/20/20 मॉडल — जोखिम कम करें' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Risk() {
  const navigate = useNavigate()
  const [view, setView]           = useState('hub')
  const [score, setScore]         = useState(null)
  const [answers, setAnswers]     = useState({})
  const [riskProfile, setRiskProfile] = useState([])
  const [showLogout, setShowLogout]   = useState(false)
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

  const answeredAll    = Object.keys(answers).length === SCORE_QUESTIONS.length
  const scoreColor     = score === null ? null : score <= 30 ? 'green' : score <= 60 ? 'yellow' : 'red'
  const scoreLabel     = score === null ? null : score <= 30 ? 'कम जोखिम' : score <= 60 ? 'मध्यम जोखिम' : 'उच्च जोखिम'
  const scoreEmoji     = score === null ? null : score <= 30 ? '✅' : score <= 60 ? '⚠️' : '🔴'
  const hasManyRisks   = riskProfile.length >= 3

  if (view === 'score') return (
    <ScoreScreen answers={answers} setAnswers={setAnswers}
      answeredAll={answeredAll} onSubmit={submitScore} onBack={() => setView('hub')} />
  )
  if (view === 'profile') return (
    <RiskProfileScreen
      selected={riskProfile} setSelected={setRiskProfile}
      onBack={() => setView('hub')} />
  )
  const sectionData = SECTIONS.find(s => s.id === view)
  if (sectionData) return (
    <SectionDetail section={sectionData} onBack={() => setView('hub')} navigate={navigate} />
  )

  // ── Hub ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-900 via-red-800 to-orange-900 px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-orange-300/10 rounded-full translate-y-1/2" />

        <div className="flex items-center justify-between mb-4 relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-rose-300 text-sm">
            <span className="text-xl font-bold">‹</span><span>होम</span>
          </button>
          <button onClick={() => setShowLogout(true)}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            🚪 लॉगआउट
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-rose-400/20 rounded-2xl flex items-center justify-center border border-rose-400/30">
            <span className="text-3xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">जोखिम सुरक्षा</h1>
            <p className="text-rose-300 text-xs mt-0.5">Risk & Insurance</p>
          </div>
        </div>

        <div className="relative mt-3 bg-white/10 rounded-xl p-3">
          <p className="text-rose-100 text-xs leading-relaxed">
            🎯 <span className="text-white font-medium">एक बुरा सीजन सब बर्बाद न करे</span> — जोखिम पहचानें, बीमा समझें, विविधता से स्थिरता पाएं
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Risk Score + Profile in 2-col */}
        <div className="grid grid-cols-2 gap-3">
          {/* Risk Score */}
          <div className={`rounded-2xl p-3 border-2 col-span-${score === null ? 1 : 2} ${
            score === null ? 'bg-white border-gray-200' :
            scoreColor === 'green' ? 'bg-green-50 border-green-300' :
            scoreColor === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
          }`} style={score !== null ? {} : {}}>
            {score === null ? (
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700">🎯 जोखिम स्कोर</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">5 सवाल • 2 मिनट</p>
                <button onClick={() => setView('score')}
                  className="w-full bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl">
                  शुरू करें →
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-800">जोखिम स्कोर</p>
                    <p className={`text-xs font-medium ${scoreColor === 'green' ? 'text-green-600' : scoreColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {scoreEmoji} {scoreLabel}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scoreColor === 'green' ? 'bg-green-500' : scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    <span className="text-white text-xl font-bold">{score}</span>
                  </div>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${scoreColor === 'green' ? 'bg-green-500' : scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }} />
                </div>
                <button onClick={() => setView('score')} className="mt-1.5 text-xs text-rose-600">फिर जाँचें →</button>
              </div>
            )}
          </div>

          {/* Risk Profile builder */}
          {score === null && (
            <div className="rounded-2xl p-3 border-2 bg-white border-gray-200">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700">📋 Risk Profile</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">
                  {riskProfile.length > 0 ? `${riskProfile.length} जोखिम चुने` : 'अपने जोखिम चुनें'}
                </p>
                <button onClick={() => setView('profile')}
                  className="w-full bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl">
                  {riskProfile.length > 0 ? 'बदलें →' : 'बनाएं →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Risk Profile summary if selected */}
        {riskProfile.length > 0 && (
          <div className={`rounded-xl p-3 border ${hasManyRisks ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold ${hasManyRisks ? 'text-red-700' : 'text-yellow-700'}`}>
                {hasManyRisks ? '⚠️ उच्च जोखिम प्रोफ़ाइल' : '📋 आपके जोखिम'}: {riskProfile.length} पहचाने गए
              </p>
              <button onClick={() => setView('profile')} className="text-xs text-gray-500">बदलें</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {riskProfile.map(id => {
                const rc = RISK_CATEGORIES.find(r => r.id === id)
                return rc ? (
                  <span key={id} className={`text-xs px-2 py-0.5 rounded-full ${hasManyRisks ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {rc.icon} {rc.label}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* 6 Section cards */}
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

        {/* Quick tools */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">🧮 सम्बन्धित कैलकुलेटर</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { path: '/tools/emergency-fund', icon: '🛡️', label: 'Emergency Fund' },
              { path: '/tools/crop-compare',   icon: '🆚', label: 'फसल तुलना' },
              { path: '/tools/storage',        icon: '🏚️', label: 'भंडारण निर्णय' },
              { path: '/tools/break-even',     icon: '⚖️', label: 'Break-Even' },
            ].map(c => (
              <button key={c.path} onClick={() => navigate(c.path)}
                className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100 active:bg-gray-100">
                <span className="text-xl">{c.icon}</span>
                <p className="text-xs text-gray-600 font-medium text-left leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cross-links */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/schemes')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-sm">🏛️</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">PMFBY योजना</p>
            <p className="text-xs text-amber-500">बीमा के लिए apply करें</p>
          </button>
          <button onClick={() => navigate('/cashflow')}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left">
            <p className="text-sm">💸</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Cash Flow</p>
            <p className="text-xs text-emerald-500">Emergency fund बनाएं</p>
          </button>
          <button onClick={() => navigate('/market')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-sm">📈</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">बाजार & MSP</p>
            <p className="text-xs text-amber-500">भाव चक्र • Storage</p>
          </button>
          <button onClick={() => navigate('/loans')}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-left">
            <p className="text-xl">🏦</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">कर्ज सलाह</p>
            <p className="text-xs text-indigo-400">KCC • EMI Safety</p>
          </button>
          <button onClick={() => navigate('/wealth')}
            className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-left">
            <p className="text-xl">🌱</p>
            <p className="text-xs font-semibold text-teal-700 mt-1">संपत्ति व विकास</p>
            <p className="text-xs text-teal-400">बचत • स्थिरता</p>
          </button>
        </div>

        <button onClick={() => navigate('/learn')}
          className="w-full bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📘</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-700">Module 4 — विस्तार से पढ़ें</p>
            <p className="text-xs text-red-400">14 पाठ: Risk & Insurance — सीखें अनुभाग में</p>
          </div>
          <span className="text-red-300 text-xl ml-auto">›</span>
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5"><p className="text-3xl mb-2">🚪</p><h2 className="text-lg font-bold text-gray-800">लॉगआउट करें?</h2></div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogout(false)} className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm">रुकें</button>
              <button onClick={handleLogout} className="py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">हाँ, लॉगआउट</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Risk Profile Builder ─────────────────────────────────────────────────────
function RiskProfileScreen({ selected, setSelected, onBack }) {
  function toggle(id) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-br from-rose-800 to-red-900 px-4 pt-10 pb-5 text-white">
        <button onClick={onBack} className="flex items-center gap-1 text-rose-300 text-sm mb-3">
          <span className="text-xl">‹</span> जोखिम सुरक्षा
        </button>
        <h1 className="text-xl font-bold">📋 Risk Profile बनाएं</h1>
        <p className="text-xs text-rose-200 mt-1">जो जोखिम आपके खेत पर लागू हों — सब चुनें</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {RISK_CATEGORIES.map(rc => (
            <button key={rc.id} onClick={() => toggle(rc.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selected.includes(rc.id)
                  ? 'bg-rose-50 border-rose-400'
                  : 'bg-white border-gray-100'
              }`}>
              <span className="text-2xl">{rc.icon}</span>
              <p className="text-sm font-bold text-gray-800 mt-2">{rc.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{rc.sub}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{rc.examples}</p>
              {selected.includes(rc.id) && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-xs text-rose-600 font-medium">चुना गया</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className={`rounded-2xl p-4 border-2 ${selected.length >= 3 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`text-sm font-bold ${selected.length >= 3 ? 'text-red-700' : 'text-yellow-700'}`}>
              {selected.length >= 3 ? '⚠️ उच्च जोखिम प्रोफ़ाइल' : '📋 आपने चुना है'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {selected.length} जोखिम • {selected.length >= 4 ? 'तुरंत सुरक्षा उपाय करें' : selected.length >= 2 ? 'सावधानी जरूरी है' : 'सतर्क रहें'}
            </p>
          </div>
        )}

        <button onClick={onBack}
          className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl">
          Profile सेव करें ({selected.length} चुने) →
        </button>
      </div>
    </div>
  )
}

// ─── Risk Score Quiz ──────────────────────────────────────────────────────────
function ScoreScreen({ answers, setAnswers, answeredAll, onSubmit, onBack }) {
  const [current, setCurrent] = useState(0)
  const q = SCORE_QUESTIONS[current]
  const progress = (current / SCORE_QUESTIONS.length) * 100

  function select(i) {
    setAnswers(p => ({ ...p, [q.id]: i }))
    if (current < SCORE_QUESTIONS.length - 1) setTimeout(() => setCurrent(c => c + 1), 280)
  }

  return (
    <div className="min-h-screen bg-rose-950 flex flex-col">
      <div className="px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-rose-300 text-sm flex items-center gap-1 mb-4">
          <span className="text-xl">‹</span> वापस
        </button>
        <div className="flex justify-between text-xs text-rose-400 mb-2">
          <span>सवाल {current + 1} / {SCORE_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-rose-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="bg-rose-900 rounded-3xl p-6 mb-6">
          <p className="text-xs text-rose-400 mb-2">प्रश्न {current + 1}</p>
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
                  : 'bg-rose-800 border-rose-700 text-rose-100 active:bg-rose-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[q.id] === i ? 'bg-white border-white' : 'border-rose-500'}`}>
                  {answers[q.id] === i && <div className="w-2.5 h-2.5 rounded-full bg-rose-700" />}
                </div>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>
      {answeredAll && (
        <div className="p-4">
          <button onClick={onSubmit} className="w-full py-4 bg-orange-400 text-rose-900 font-bold text-base rounded-2xl">
            मेरा जोखिम स्कोर देखें →
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
          <span className="text-xl font-bold">‹</span> जोखिम सुरक्षा
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
function IC({ title, color = 'rose', children }) {
  const c = {
    rose:   'bg-rose-50 border-rose-200',   blue:  'bg-blue-50 border-blue-200',
    green:  'bg-green-50 border-green-200', red:   'bg-red-50 border-red-200',
    amber:  'bg-amber-50 border-amber-200', orange:'bg-orange-50 border-orange-200',
    violet: 'bg-violet-50 border-violet-200', gray: 'bg-gray-50 border-gray-200',
  }
  return (
    <div className={`rounded-2xl border ${c[color] || c.gray} p-4`}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  )
}
function EX({ children, color = 'orange' }) {
  const c = { orange: 'bg-orange-100 text-orange-800', blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800' }
  return <div className={`rounded-xl px-3 py-2 text-xs font-medium mt-2 ${c[color]}`}>📋 उदाहरण: {children}</div>
}

// ─── Calculator links per section ─────────────────────────────────────────────
const CALC_LINKS = {
  weather:   [{ path: '/tools/emergency-fund', icon: '🛡️', label: 'Emergency Fund जाँचें', hint: 'बाढ़/सूखे से बचाव का buffer' }],
  pest:      [{ path: '/tools/crop-profit',    icon: '🌾', label: 'Margin जाँचें',         hint: 'कीट नुकसान के बाद मुनाफा?' }, { path: '/tools/break-even', icon: '⚖️', label: 'Break-even Price', hint: 'न्यूनतम बिक्री भाव' }],
  market:    [{ path: '/tools/storage',        icon: '🏚️', label: 'Storage निर्णय',        hint: 'अभी बेचें या रोकें?' }, { path: '/tools/crop-compare', icon: '🆚', label: 'फसल तुलना करें',   hint: 'कौन सी फसल कम जोखिम?' }],
  insurance: [{ path: '/schemes',              icon: '🏛️', label: 'PMFBY योजना देखें',     hint: 'बीमा के लिए apply करें' }],
  diversify: [{ path: '/tools/crop-compare',   icon: '🆚', label: 'फसल तुलना करें',        hint: 'कौन सी combination सही?' }, { path: '/tools/crop-profit', icon: '🌾', label: 'Multi-crop Profit', hint: 'अलग-अलग फसलों का मुनाफा' }],
}

// ─── Section Content ──────────────────────────────────────────────────────────
const CONTENT = {

  types: (
    <div className="space-y-3">
      <IC title="📋 4 प्रकार के कृषि जोखिम" color="gray">
        <div className="grid grid-cols-2 gap-2">
          {[
            { letter: 'A', type: 'उत्पादन जोखिम', color: 'bg-blue-500', items: ['मौसम — बाढ़, सूखा', 'कीट और रोग', 'खराब बीज/इनपुट'] },
            { letter: 'B', type: 'बाजार जोखिम',   color: 'bg-orange-500',items: ['भाव गिरना', 'Oversupply', 'Export/import ban'] },
            { letter: 'C', type: 'वित्तीय जोखिम', color: 'bg-red-500',   items: ['ज्यादा कर्ज', 'EMI pressure', 'Cash crunch'] },
            { letter: 'D', type: 'व्यक्तिगत जोखिम',color: 'bg-purple-500',items: ['बीमारी/दुर्घटना', 'परिवार संकट', 'मानसिक तनाव'] },
          ].map(r => (
            <div key={r.letter} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className={`${r.color} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-2`}>{r.letter}</div>
              <p className="text-xs font-bold text-gray-800 mb-1">{r.type}</p>
              {r.items.map(s => <p key={s} className="text-xs text-gray-500">• {s}</p>)}
            </div>
          ))}
        </div>
      </IC>

      <IC title="⚡ सबसे बड़ा सच" color="red">
        <p className="text-sm text-gray-700 leading-relaxed">एकल जोखिम क्षतिपूर्ति होती है। लेकिन <strong>मौसम + भाव गिरना एक साथ</strong> = बड़ा संकट।</p>
        <EX color="red">2023 टमाटर: बाढ़ से 40% उपज कम + भाव ₹4 → Revenue ₹4,800 (expected ₹20,000)</EX>
        <div className="bg-rose-50 rounded-xl p-3 mt-2 text-xs text-rose-700">
          🛡️ <strong>पहली सुरक्षा:</strong> Emergency Fund + PMFBY बीमा — दोनों एक साथ
        </div>
      </IC>

      <IC title="📊 Controllable vs Uncontrollable" color="blue">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-50 rounded-lg p-2">
            <p className="font-bold text-red-700 mb-1">❌ Control नहीं</p>
            {['मौसम', 'MSP नीति', 'Import duty', 'Pandemic'].map(s => <p key={s} className="text-gray-600">• {s}</p>)}
            <p className="text-red-600 font-medium mt-1">→ Insurance से बचाएं</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="font-bold text-green-700 mb-1">✅ Control है</p>
            {['फसल चुनाव', 'Emergency fund', 'Loan level', 'Irrigation'].map(s => <p key={s} className="text-gray-600">• {s}</p>)}
            <p className="text-green-600 font-medium mt-1">→ Planning से बचाएं</p>
          </div>
        </div>
      </IC>
    </div>
  ),

  weather: (
    <div className="space-y-3">
      <IC title="💸 Weather Risk का वित्तीय प्रभाव" color="blue">
        <p className="text-xs text-gray-500 mb-2">अगर बाढ़ से 40% उपज कम हो तो:</p>
        <div className="space-y-1.5">
          {[
            { row: 'Expected Revenue', val: '₹2,00,000', color: '' },
            { row: 'Actual Revenue (−40%)', val: '₹1,20,000', color: 'text-red-600' },
            { row: 'नुकसान', val: '₹80,000 😨', color: 'text-red-700 font-bold' },
            { row: 'अगर PMFBY था', val: '₹50,000–60,000 वापस', color: 'text-green-700 font-bold' },
          ].map(r => (
            <div key={r.row} className="flex justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{r.row}</span>
              <span className={r.color || 'text-gray-800'}>{r.val}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="🛡️ 3-Layer Weather Protection" color="green">
        <div className="space-y-2">
          {[
            { layer: 'Layer 1', title: 'PMFBY बीमा', desc: 'Premium: 2% खरीफ, 1.5% रबी — सरकार 90%+ भरती है', color: 'bg-green-50 border-green-200' },
            { layer: 'Layer 2', title: 'Emergency Fund', desc: '(6×घरेलू) + (3×खेती) = buffer बिना कर्ज के', color: 'bg-blue-50 border-blue-200' },
            { layer: 'Layer 3', title: 'Diversification', desc: '2-3 फसलें — एक खराब तो दूसरी बचाए', color: 'bg-amber-50 border-amber-200' },
          ].map(l => (
            <div key={l.layer} className={`rounded-xl border p-3 ${l.color}`}>
              <div className="flex gap-2">
                <span className="text-xs font-bold text-gray-500">{l.layer}:</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">{l.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{l.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </IC>

      <IC title="📅 Weather Risk Calendar" color="amber">
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { season: 'मार्च-अप्रैल', risk: 'ओलावृष्टि', action: 'बीमा deadline जाँचें' },
            { season: 'जून-जुलाई',   risk: 'बाढ़',       action: 'निचले खेत → drainage' },
            { season: 'अगस्त',       risk: 'अत्यधिक वर्षा', action: 'फसल protection' },
            { season: 'अक्टूबर',     risk: 'अकाल वर्षा', action: 'जल्दी कटाई plan' },
          ].map(r => (
            <div key={r.season} className="bg-blue-50 rounded-lg p-2">
              <p className="font-semibold text-blue-700">{r.season}</p>
              <p className="text-red-600">⚡ {r.risk}</p>
              <p className="text-green-600">→ {r.action}</p>
            </div>
          ))}
        </div>
      </IC>
    </div>
  ),

  pest: (
    <div className="space-y-3">
      <IC title="💰 कीट का वित्तीय असर" color="amber">
        <p className="text-sm text-gray-700 leading-relaxed">कीट control की लागत से ज्यादा महत्वपूर्ण है — <strong>आय पर असर</strong>।</p>
        <div className="bg-amber-50 rounded-xl p-3 mt-2">
          <p className="text-xs text-gray-500 mb-2">5 एकड़ गेहूं, 20% yield loss से:</p>
          <div className="space-y-1 text-xs">
            {[
              { label: 'Normal उपज', val: '100 क्विं. × ₹2,200 = ₹2,20,000' },
              { label: 'Pest के बाद',  val: '80 क्विं. × ₹2,200 = ₹1,76,000' },
              { label: 'आय नुकसान',    val: '₹44,000', red: true },
              { label: 'Pesticide cost', val: '₹8,000 (अलग से)', red: true },
            ].map(r => (
              <div key={r.label} className={`flex justify-between bg-white rounded-lg px-3 py-1.5 ${r.red ? '' : ''}`}>
                <span className="text-gray-600">{r.label}</span>
                <span className={`font-semibold ${r.red ? 'text-red-600' : 'text-gray-800'}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </IC>

      <IC title="📊 Low Margin = High Vulnerability" color="red">
        <p className="text-sm text-gray-700 mb-2">जिस फसल का मार्जिन कम है, उसमें pest का असर ज्यादा होता है।</p>
        <div className="space-y-2 text-xs">
          {[
            { crop: 'Crop A (40% margin)', loss: '20% yield loss', profit: 'अभी भी +20% profit बचा', color: 'green' },
            { crop: 'Crop B (15% margin)', loss: '20% yield loss', profit: 'Total loss + में चला गया!', color: 'red' },
          ].map(r => (
            <div key={r.crop} className={`rounded-lg p-3 ${r.color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-bold ${r.color === 'green' ? 'text-green-700' : 'text-red-700'}`}>{r.crop}</p>
              <p className="text-gray-600">{r.loss} → {r.profit}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 rounded-xl p-3 mt-2 text-xs text-amber-700">
          💡 नियम: Margin 30%+ रखें — pest झेलने का buffer होता है
        </div>
      </IC>

      <IC title="✅ IPM से लागत कम करें" color="green">
        <div className="space-y-1.5 text-xs">
          {[
            '🌱 सही बीज चुनें — resistant varieties',
            '🔍 Early monitoring — हफ्ते में एक बार खेत देखें',
            '🐝 Biological control — friendly insects',
            '💊 Chemical: सिर्फ जरूरत पर — सही dose',
            '📞 KVK से मुफ्त सलाह: 1800-180-1551',
          ].map(s => (
            <div key={s} className="bg-gray-50 rounded-lg px-3 py-2 text-gray-700">{s}</div>
          ))}
        </div>
      </IC>
    </div>
  ),

  market: (
    <div className="space-y-3">
      <IC title="📉 Price Crash का असर" color="orange">
        <p className="text-xs text-gray-500 mb-2">टमाटर — अनुमानित ₹12/kg, actual ₹4/kg:</p>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'Expected Revenue (100 क्विं.)', val: '₹1,20,000' },
            { label: 'Actual Revenue', val: '₹40,000', red: true },
            { label: 'Input Cost', val: '₹35,000', red: true },
            { label: 'Net Loss', val: '₹5,000 😨', bold: true, red: true },
          ].map(r => (
            <div key={r.label} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{r.label}</span>
              <span className={`${r.bold ? 'font-bold' : 'font-medium'} ${r.red ? 'text-red-600' : 'text-gray-800'}`}>{r.val}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="🛡️ Market Risk कम करने के 4 तरीके" color="green">
        <div className="space-y-2 text-xs">
          {[
            { num: '1', tip: 'Diversify — 3 crops', detail: 'एक गिरे, दो सहारा दें', color: 'green' },
            { num: '2', tip: 'Storage + Timing', detail: 'भाव गिरे तो warehouse में रखें — बाद में बेचें', color: 'blue' },
            { num: '3', tip: 'FPO/eNAM', detail: 'सामूहिक बिक्री = बेहतर bargaining power', color: 'teal' },
            { num: '4', tip: 'MSP crops', detail: 'गेहूं/धान — price floor मिलता है', color: 'amber' },
          ].map(r => (
            <div key={r.num} className={`rounded-xl p-3 bg-${r.color}-50 border border-${r.color}-100`}>
              <div className="flex gap-2">
                <span className={`w-5 h-5 rounded-full bg-${r.color}-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold`}>{r.num}</span>
                <div>
                  <p className="font-bold text-gray-800">{r.tip}</p>
                  <p className="text-gray-600 mt-0.5">{r.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </IC>

      <IC title="⚠️ Forward Contracts — सावधानी" color="red">
        <p className="text-sm text-gray-700 leading-relaxed mb-2">Forward contract में पहले से भाव fix होता है। लेकिन छोटे किसान के लिए जोखिम भी है:</p>
        <div className="space-y-1 text-xs">
          {['अगर बाजार भाव बढ़ा — contract rate पर देना होगा', 'उत्पादन कम हुआ — penalty हो सकती है', 'बड़े buyers contract तोड़ सकते हैं'].map(r => (
            <div key={r} className="bg-red-50 rounded-lg px-3 py-1.5 text-red-700">⚠️ {r}</div>
          ))}
        </div>
        <div className="bg-green-50 rounded-xl p-2 mt-2 text-xs text-green-700">
          ✅ FPO के माध्यम से forward contract करना ज्यादा सुरक्षित
        </div>
      </IC>
    </div>
  ),

  insurance: (
    <div className="space-y-3">
      <div className="bg-green-600 rounded-2xl p-4 text-white">
        <p className="text-base font-bold">🛡️ बीमा क्या है — और क्या नहीं</p>
        <p className="text-xs text-green-200 mt-1">यह सबसे गलत समझा जाने वाला financial tool है</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '✅ बीमा है', items: ['बड़े नुकसान से protection', 'Disaster में survival', 'Crop failure का partial cover'], color: 'bg-green-50 border-green-200 text-green-700' },
          { label: '❌ बीमा नहीं है', items: ['हर साल profit', 'Small price changes', 'Guaranteed payout', 'Investment return'], color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(b => (
          <div key={b.label} className={`rounded-2xl border p-3 ${b.color}`}>
            <p className="text-xs font-bold mb-2">{b.label}</p>
            {b.items.map(s => <p key={s} className="text-xs mb-1">• {s}</p>)}
          </div>
        ))}
      </div>

      <IC title="📊 क्या बीमा लेना सही है?" color="green">
        <p className="text-xs text-gray-600 mb-2">Simple Risk Math:</p>
        <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 font-mono">
          <p>नुकसान संभावना = 10%</p>
          <p>अनुमानित नुकसान = ₹60,000</p>
          <p className="border-t border-gray-200 pt-1">Expected loss = 10% × ₹60,000 = <span className="font-bold text-red-600">₹6,000</span></p>
          <p className="pt-1">PMFBY Premium = <span className="font-bold text-green-600">₹1,500</span></p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 mt-2 text-xs text-green-700">
          ✅ Premium &lt; Expected Loss → <strong>बीमा लेना सही है!</strong>
        </div>
      </IC>

      <IC title="💳 PMFBY — मुख्य बातें" color="blue">
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'खरीफ Premium', val: 'आय का 2% (बाकी सरकार)' },
            { label: 'रबी Premium',  val: 'आय का 1.5%' },
            { label: 'बागवानी',     val: '5% premium' },
            { label: 'Claim deadline', val: '72 घंटे में सूचना' },
            { label: 'Apply करें',   val: 'CSC / बैंक / PM Fasal Portal' },
          ].map(r => (
            <div key={r.label} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{r.label}</span>
              <span className="font-medium text-gray-800">{r.val}</span>
            </div>
          ))}
        </div>
        <div className="bg-red-50 rounded-xl p-3 mt-2 text-xs text-red-700">
          ⚠️ Claim file नहीं किया तो नहीं मिलेगा — deadline याद रखें
        </div>
      </IC>
    </div>
  ),

  diversify: (
    <div className="space-y-3">
      <IC title="❓ एकल फसल का खतरा" color="red">
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
          <div className="bg-red-50 rounded-xl p-3">
            <p className="font-bold text-red-700">100% गेहूं</p>
            <div className="my-2 text-2xl">📉</div>
            <p className="text-gray-600">भाव गिरा या फसल खराब</p>
            <p className="text-red-600 font-bold mt-1">= Total Loss</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="font-bold text-green-700">60+20+20 मॉडल</p>
            <div className="my-2 text-2xl">🌈</div>
            <p className="text-gray-600">गेहूं + सब्जी + डेयरी</p>
            <p className="text-green-600 font-bold mt-1">= Partial Loss only</p>
          </div>
        </div>
      </IC>

      <IC title="🌈 60/20/20 Diversification Model" color="violet">
        <div className="space-y-2">
          {[
            { pct: '60%', type: 'मुख्य फसल', examples: 'गेहूं, धान, सोयाबीन', color: 'bg-blue-500', risk: 'मध्यम' },
            { pct: '20%', type: 'सब्जी/दाल/मसाले', examples: 'टमाटर, प्याज, मेथी', color: 'bg-green-500', risk: 'ज्यादा आय' },
            { pct: '20%', type: 'डेयरी/बागवानी', examples: '2-3 गाय, आम/अमरूद', color: 'bg-amber-500', risk: 'Monthly cash' },
          ].map(r => (
            <div key={r.pct} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
              <div className={`${r.color} text-white text-sm font-bold w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>{r.pct}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{r.type}</p>
                <p className="text-xs text-gray-500">{r.examples}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{r.risk}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="📊 Income Volatility तुलना" color="blue">
        <p className="text-xs text-gray-500 mb-3">सालाना आय में उतार-चढ़ाव:</p>
        <div className="space-y-3">
          {[
            { label: 'एकल फसल', bars: [90, 30, 85, 15, 70], color: 'bg-red-400' },
            { label: 'Diversified', bars: [65, 55, 70, 60, 68], color: 'bg-green-400' },
          ].map(r => (
            <div key={r.label}>
              <p className="text-xs font-semibold text-gray-600 mb-1">{r.label}</p>
              <div className="flex items-end gap-1 h-10">
                {r.bars.map((h, i) => (
                  <div key={i} className={`flex-1 ${r.color} rounded-t-sm`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-green-50 rounded-xl p-2 mt-2 text-xs text-green-700">
          ✅ Diversified = कम volatility, stable income year-round
        </div>
      </IC>
    </div>
  ),
}
