import { fmtNum } from '../lib/locale'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'

// ─── Wealth Stability Score Engine ───────────────────────────────────────────
const SCORE_QUESTIONS = [
  {
    id: 'emergency',
    q: 'आपके पास आपातकालीन फंड कितने महीने का है?',
    options: [
      { label: '6 महीने या ज्यादा (मजबूत)', pts: 0, color: 'green' },
      { label: '3–6 महीने', pts: 10, color: 'yellow' },
      { label: '3 महीने से कम', pts: 25, color: 'red' },
      { label: 'कोई फंड नहीं', pts: 40, color: 'red' },
    ],
  },
  {
    id: 'loan_level',
    q: 'आपका कुल कर्ज, सालाना आय का कितना है?',
    options: [
      { label: 'कोई कर्ज नहीं या 30% से कम', pts: 0, color: 'green' },
      { label: '30–60%', pts: 15, color: 'yellow' },
      { label: '60% से ज्यादा', pts: 30, color: 'red' },
    ],
  },
  {
    id: 'insurance',
    q: 'क्या आपके पास फसल बीमा (PMFBY) या जीवन बीमा है?',
    options: [
      { label: 'हाँ — दोनों हैं', pts: 0, color: 'green' },
      { label: 'सिर्फ एक है', pts: 10, color: 'yellow' },
      { label: 'कोई बीमा नहीं', pts: 25, color: 'red' },
    ],
  },
  {
    id: 'diversification',
    q: 'आपकी आय के कितने स्रोत हैं?',
    options: [
      { label: '3 या ज्यादा (फसल + डेयरी + अन्य)', pts: 0, color: 'green' },
      { label: '2 स्रोत', pts: 10, color: 'yellow' },
      { label: 'सिर्फ 1 फसल से आय', pts: 25, color: 'red' },
    ],
  },
  {
    id: 'savings',
    q: 'क्या आप हर महीने कुछ बचत करते हैं?',
    options: [
      { label: 'हाँ — नियमित FD/RD/पोस्ट ऑफिस में', pts: 0, color: 'green' },
      { label: 'कभी-कभी — जब बच जाए', pts: 15, color: 'yellow' },
      { label: 'नहीं — सब खर्च हो जाता है', pts: 30, color: 'red' },
    ],
  },
]

// ─── Section Data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'priority',
    icon: '🎯',
    title: 'वित्तीय प्राथमिकता क्रम',
    sub: 'Financial Priority Order',
    color: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    risk: 'high',
    desc: 'अतिरिक्त पैसा मिले तो पहले कहाँ लगाएं? सही क्रम जानें',
  },
  {
    id: 'savings',
    icon: '🏦',
    title: 'सुरक्षित बचत विकल्प',
    sub: 'Safe Savings Options',
    color: 'from-green-600 to-emerald-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    risk: null,
    desc: 'FD, पोस्ट ऑफिस, सरकारी बॉन्ड — सुरक्षित तरीके',
  },
  {
    id: 'expansion',
    icon: '🚜',
    title: 'खेती विस्तार योजना',
    sub: 'Farm Expansion Planning',
    color: 'from-amber-600 to-orange-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    risk: null,
    desc: 'ट्रैक्टर, जमीन, ड्रिप — ROI पहले, निवेश बाद में',
  },
  {
    id: 'retirement',
    icon: '🌅',
    title: 'किसान रिटायरमेंट योजना',
    sub: 'Retirement Planning',
    color: 'from-purple-600 to-violet-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    risk: null,
    desc: 'पेंशन नहीं है? खुद बनाएं — छोटी शुरुआत, बड़ा भविष्य',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: 'परिवार व अगली पीढ़ी',
    sub: 'Family & Intergenerational',
    color: 'from-rose-600 to-pink-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    risk: null,
    desc: 'बच्चों की शिक्षा, जमीन बँटवारा, नॉमिनी, वसीयत',
  },
  {
    id: 'stability',
    icon: '🏗️',
    title: 'दीर्घकालिक स्थिरता',
    sub: 'Long-Term Stability',
    color: 'from-teal-600 to-cyan-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    risk: null,
    desc: 'बहु-आय मॉडल, कम कर्ज, अनुशासित खर्च — स्थिर खेती',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WealthGrowth() {
  const navigate = useNavigate()
  const [view, setView] = useState('hub') // 'hub' | 'score' | section.id
  const [score, setScore] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const user = JSON.parse(localStorage.getItem('fintech_user') || '{}')

  function handleLogout() {
    auth.clearToken()
    navigate('/login')
  }

  function calcScore(ans) {
    let total = 0
    SCORE_QUESTIONS.forEach(q => {
      const chosen = ans[q.id]
      if (chosen !== undefined) total += q.options[chosen].pts
    })
    return Math.min(100, total)
  }

  function submitScore() {
    const s = calcScore(answers)
    setScore(s)
    setView('hub')
  }

  const answeredAll = Object.keys(answers).length === SCORE_QUESTIONS.length

  if (view === 'score') return (
    <ScoreScreen
      answers={answers}
      setAnswers={setAnswers}
      answeredAll={answeredAll}
      onSubmit={submitScore}
      onBack={() => setView('hub')}
    />
  )

  // Retirement projection calculator view
  if (view === 'retirement_calc') return (
    <RetirementProjection onBack={() => setView('retirement')} />
  )

  const sectionData = SECTIONS.find(s => s.id === view)
  if (sectionData) return (
    <SectionDetail
      section={sectionData}
      onBack={() => setView('hub')}
      navigate={navigate}
      setView={setView}
    />
  )

  // ── Hub View ────────────────────────────────────────────────────────────────
  const scoreColor = score === null ? null : score <= 30 ? 'green' : score <= 60 ? 'yellow' : 'red'
  const scoreLabel = score === null ? null : score <= 30 ? 'मजबूत नींव' : score <= 60 ? 'बढ़ रही है' : 'कमजोर — सुधारें'
  const scoreEmoji = score === null ? null : score <= 30 ? '✅' : score <= 60 ? '⚠️' : '🔴'
  const scoreLabelEn = score === null ? null : score <= 30 ? 'Strong Foundation' : score <= 60 ? 'Growing' : 'Vulnerable'

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-lime-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-emerald-300/5 rounded-full" />

        <div className="flex items-center justify-between mb-4 relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-emerald-300 text-sm">
            <span className="text-xl font-bold">‹</span><span>होम</span>
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <span>🚪</span><span>लॉगआउट</span>
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-lime-400/20 rounded-2xl flex items-center justify-center border border-lime-400/30">
            <span className="text-3xl">🌱</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">संपत्ति व विकास</h1>
            <p className="text-emerald-300 text-xs mt-0.5">Wealth & Farm Growth</p>
          </div>
        </div>

        <div className="relative mt-4 bg-white/10 rounded-xl p-3">
          <p className="text-emerald-100 text-xs leading-relaxed">
            🎯 <span className="text-white font-medium">अगले 10 साल की सोचें:</span> बचत कहाँ करें? • खेती कैसे बढ़ाएं? • रिटायरमेंट प्लान • बच्चों का भविष्य
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Wealth Stability Score Card */}
        <div className={`rounded-2xl p-4 border-2 ${
          score === null ? 'bg-white border-gray-200' :
          scoreColor === 'green' ? 'bg-green-50 border-green-300' :
          scoreColor === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
        }`}>
          {score === null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">🌱 अपना स्थिरता स्कोर जाँचें</p>
                <p className="text-xs text-gray-500 mt-0.5">5 सवाल • 2 मिनट • Wealth Stability Score</p>
              </div>
              <button onClick={() => setView('score')}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                शुरू करें →
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">आपका स्थिरता स्कोर</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    scoreColor === 'green' ? 'text-green-600' : scoreColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{scoreEmoji} {scoreLabel}</p>
                  <p className="text-xs text-gray-400">{scoreLabelEn}</p>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  scoreColor === 'green' ? 'bg-green-500' : scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-2xl font-bold">{score}</span>
                </div>
              </div>
              <div className="h-3 bg-white/50 rounded-full overflow-hidden border border-white/30">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  scoreColor === 'green' ? 'bg-green-500' : scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${score}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-60">
                <span>0 मजबूत</span><span>30</span><span>60</span><span>100 कमजोर</span>
              </div>
              <button onClick={() => setView('score')}
                className="mt-2 text-xs text-emerald-600 font-medium">
                फिर से जाँचें →
              </button>
            </div>
          )}
        </div>

        {/* 10 Year Vision Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white">
          <p className="text-sm font-bold">🔭 10 साल आगे की सोचें</p>
          <p className="text-xs opacity-90 mt-1 leading-relaxed">
            ज्यादातर किसान सिर्फ अगली फसल की सोचते हैं। जो 5-10 साल आगे सोचता है, वही वित्तीय स्वतंत्रता पाता है।
          </p>
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
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      {s.risk === 'high' && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">⚠️ जरूरी</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{s.desc}</p>
                  </div>
                  <span className="text-gray-300 text-xl">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick calc links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">🧮 सीधे कैलकुलेटर पर जाएं</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { path: '/tools/loan-roi', icon: '🏦', label: 'लोन ROI' },
              { path: '/tools/emergency-fund', icon: '🛡️', label: 'इमर्जेंसी फंड' },
              { path: '/tools/break-even', icon: '📊', label: 'ब्रेक-ईवन' },
            ].map(c => (
              <button key={c.path} onClick={() => navigate(c.path)}
                className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100 active:bg-gray-100">
                <span className="text-xl">{c.icon}</span>
                <p className="text-xs text-gray-600 font-medium mt-1 leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Related Hubs */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/cashflow')}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left">
            <p className="text-xl">💸</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Cash Flow</p>
            <p className="text-xs text-emerald-400">Emergency Fund • बचत</p>
          </button>
          <button onClick={() => navigate('/loans')}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-left">
            <p className="text-xl">🏦</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">कर्ज सलाह</p>
            <p className="text-xs text-indigo-400">KCC • EMI • कर्ज जाल</p>
          </button>
          <button onClick={() => navigate('/risk')}
            className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
            <p className="text-xl">🛡️</p>
            <p className="text-xs font-semibold text-rose-700 mt-1">जोखिम सुरक्षा</p>
            <p className="text-xs text-rose-400">PMFBY • Diversify</p>
          </button>
          <button onClick={() => navigate('/market')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xl">📈</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">बाजार & MSP</p>
            <p className="text-xs text-amber-400">भाव चक्र • बिक्री चैनल</p>
          </button>
        </div>

        {/* Link to Learn module */}
        <button onClick={() => navigate('/learn')}
          className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📘</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-emerald-700">और गहराई से पढ़ें</p>
            <p className="text-xs text-emerald-500">Module 8: 10 विस्तृत पाठ — सीखें अनुभाग में</p>
          </div>
          <span className="text-emerald-300 text-xl ml-auto">›</span>
        </button>
      </div>

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-gray-800">लॉगआउट करें?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
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

// ─── Wealth Stability Score Quiz Screen ──────────────────────────────────────
function ScoreScreen({ answers, setAnswers, answeredAll, onSubmit, onBack }) {
  const [current, setCurrent] = useState(0)
  const q = SCORE_QUESTIONS[current]
  const progress = ((current) / SCORE_QUESTIONS.length) * 100

  function selectOption(idx) {
    setAnswers(prev => ({ ...prev, [q.id]: idx }))
    if (current < SCORE_QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 300)
    }
  }

  return (
    <div className="min-h-screen bg-green-950 flex flex-col">
      <div className="px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-emerald-300 text-sm flex items-center gap-1 mb-4">
          <span className="text-xl">‹</span> वापस
        </button>
        <div className="flex justify-between text-xs text-emerald-400 mb-2">
          <span>सवाल {current + 1} / {SCORE_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-green-800 rounded-full overflow-hidden">
          <div className="h-full bg-lime-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="bg-green-900 rounded-3xl p-6 mb-6">
          <p className="text-xs text-emerald-400 mb-2">प्रश्न {current + 1}</p>
          <p className="text-white text-lg font-bold leading-snug">{q.q}</p>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => selectOption(i)}
              className={`w-full p-4 rounded-2xl text-left transition-all text-sm font-medium border-2 ${
                answers[q.id] === i
                  ? opt.color === 'green' ? 'bg-green-500 border-green-400 text-white'
                    : opt.color === 'yellow' ? 'bg-yellow-500 border-yellow-400 text-white'
                    : 'bg-red-500 border-red-400 text-white'
                  : 'bg-green-800 border-green-700 text-emerald-100 active:bg-green-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[q.id] === i ? 'bg-white border-white' : 'border-green-500'
                }`}>
                  {answers[q.id] === i && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                </div>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-8 flex gap-3">
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)}
            className="bg-green-800 text-emerald-200 py-3 px-5 rounded-2xl text-sm font-medium flex-shrink-0">
            ‹ पिछला
          </button>
        )}
        {answeredAll && (
          <button onClick={onSubmit}
            className="flex-1 bg-lime-500 text-green-900 py-3 rounded-2xl text-sm font-bold">
            स्कोर देखें →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Retirement Projection Tool ──────────────────────────────────────────────
function RetirementProjection({ onBack }) {
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(20)
  const [rate, setRate] = useState(7)

  // Compound interest: FV = P * [((1+r)^n - 1)/r] where r=monthly rate, n=total months
  const monthlyRate = rate / 100 / 12
  const totalMonths = years * 12
  const futureValue = monthlyRate > 0
    ? Math.round(monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate))
    : monthly * totalMonths
  const totalInvested = monthly * totalMonths
  const interestEarned = futureValue - totalInvested

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 text-white px-4 pt-10 pb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span><span>रिटायरमेंट प्लानिंग</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">रिटायरमेंट प्रोजेक्शन</h1>
            <p className="text-xs text-white/70">Savings Projection Tool</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Input controls */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              💰 मासिक बचत: <span className="text-purple-600">₹{fmtNum(monthly)}</span>
            </label>
            <input type="range" min={500} max={20000} step={500} value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>₹500</span><span>₹20,000</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              📅 अवधि: <span className="text-purple-600">{years} साल</span>
            </label>
            <input type="range" min={5} max={30} step={1} value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 साल</span><span>30 साल</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              📈 वार्षिक ब्याज दर: <span className="text-purple-600">{rate}%</span>
            </label>
            <input type="range" min={4} max={12} step={0.5} value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>4%</span><span>12%</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border-2 border-purple-200">
          <p className="text-xs font-semibold text-purple-500 mb-3">📊 {years} साल बाद आपके पास होगा</p>
          <p className="text-3xl font-bold text-purple-700">
            ₹{fmtNum(futureValue)}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">आपका निवेश</span>
              <span className="font-semibold text-gray-700">₹{fmtNum(totalInvested)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">ब्याज की कमाई</span>
              <span className="font-semibold text-green-600">+₹{fmtNum(interestEarned)}</span>
            </div>
            {/* Visual bar */}
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mt-2">
              <div className="bg-purple-500 h-full" style={{ width: `${(totalInvested / futureValue) * 100}%` }} />
              <div className="bg-green-500 h-full" style={{ width: `${(interestEarned / futureValue) * 100}%` }} />
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> निवेश</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> ब्याज</span>
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">💡 मुख्य सीख</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            {monthly <= 2000
              ? 'छोटी शुरुआत भी बड़ा असर करती है! ₹2,000/माह भी 20 साल में लाखों बन जाते हैं।'
              : years >= 20
              ? `समय ही सबसे बड़ा दोस्त है! ₹${fmtNum(monthly)}/माह से ${years} साल में ₹${fmtNum(interestEarned)} सिर्फ ब्याज से कमाई।`
              : 'जितनी जल्दी शुरू करें, उतना ज्यादा फायदा। Compound interest का जादू समय के साथ बढ़ता है।'
            }
          </p>
        </div>

        {/* Safe options */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 mb-3">🏦 कहाँ निवेश करें (सुरक्षित)</p>
          <div className="space-y-2">
            {[
              { name: 'Post Office RD', rate: '6.7%', risk: 'बहुत कम' },
              { name: 'PPF (15 वर्ष)', rate: '7.1%', risk: 'शून्य (सरकारी)' },
              { name: 'Bank FD', rate: '6-7%', risk: 'बहुत कम' },
              { name: 'PM Kisan Maandhan', rate: 'पेंशन ₹3,000/माह', risk: 'सरकारी योजना' },
            ].map((opt, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{opt.name}</p>
                  <p className="text-xs text-gray-400">जोखिम: {opt.risk}</p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{opt.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          ⚠️ यह शैक्षिक अनुमान है, वित्तीय सलाह नहीं। वास्तविक रिटर्न भिन्न हो सकते हैं।
        </p>
      </div>
    </div>
  )
}

// ─── Section Detail Component ────────────────────────────────────────────────
function SectionDetail({ section, onBack, navigate, setView }) {
  const content = SECTION_CONTENT[section.id]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className={`bg-gradient-to-br ${section.color} text-white px-4 pt-10 pb-5`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span><span>संपत्ति व विकास</span>
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
        {typeof content === 'function' ? content({ navigate, setView }) : content}

        {/* Calculator CTAs */}
        {CALC_LINKS[section.id] && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">🧮 अभी हिसाब करें</p>
            <div className="space-y-2">
              {CALC_LINKS[section.id].map(c => (
                <button key={c.path} onClick={() => c.action ? c.action() : navigate(c.path)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 active:bg-gray-100">
                  <span className="text-xl">{c.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700">{c.label}</p>
                    <p className="text-xs text-gray-400">{c.hint}</p>
                  </div>
                  <span className="ml-auto text-gray-300 text-lg">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Calculator Links per section ─────────────────────────────────────────────
const CALC_LINKS = {
  priority: [
    { path: '/tools/emergency-fund', icon: '🛡️', label: 'आपातकालीन फंड कैलकुलेटर', hint: 'कितना फंड चाहिए?' },
    { path: '/tools/loan-roi', icon: '🏦', label: 'लोन ROI जाँच', hint: 'कर्ज चुकाएं या बचत करें?' },
  ],
  savings: [
    { path: '/tools/emergency-fund', icon: '🛡️', label: 'Emergency Fund Target', hint: 'पहले यह भरें' },
  ],
  expansion: [
    { path: '/tools/loan-roi', icon: '🏦', label: 'ROI कैलकुलेटर', hint: 'क्या निवेश फायदेमंद?' },
    { path: '/tools/break-even', icon: '📊', label: 'ब्रेक-ईवन', hint: 'कब तक लागत निकलेगी?' },
    { path: '/tools/emi-safety', icon: '💰', label: 'EMI सुरक्षा जाँच', hint: 'क्या EMI झेल सकते हैं?' },
  ],
  retirement: [
    { path: '#', icon: '📊', label: 'रिटायरमेंट प्रोजेक्शन टूल', hint: 'कितना बचाएं, कितना मिलेगा?', action: null },
  ],
  family: [
    { path: '/tools/emergency-fund', icon: '🛡️', label: 'परिवार सुरक्षा फंड', hint: 'कितना चाहिए?' },
  ],
  stability: [
    { path: '/tools/crop-compare', icon: '🌾', label: 'फसल तुलना', hint: 'विविधता बढ़ाएं' },
    { path: '/tools/cost-leakage', icon: '🔍', label: 'लागत रिसाव', hint: 'खर्च कहाँ बच सकता है?' },
  ],
}

// Fix retirement calc link to use setView
// This is handled in the section content itself

// ─── Detailed Section Content ─────────────────────────────────────────────────
const SECTION_CONTENT = {

  // ── 1. Financial Priority Order ─────────────────────────────────────────────
  priority: (
    <div className="space-y-3">
      <InfoCard title="🎯 पैसा मिले तो पहले कहाँ लगाएं?" color="blue">
        <p className="text-sm text-gray-700 leading-relaxed">
          जब भी अतिरिक्त पैसा मिले (फसल बिक्री, सरकारी मदद, या कोई भी आय), तो एक निश्चित क्रम में लगाएं। यह क्रम कभी उल्टा न करें।
        </p>
      </InfoCard>

      {/* Priority Pyramid */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">📊 वित्तीय प्राथमिकता पिरामिड</p>
        {[
          { num: '1️⃣', title: 'आपातकालीन फंड', desc: '6 महीने का घर + खेती खर्च अलग रखें', color: 'bg-red-500', width: '100%' },
          { num: '2️⃣', title: 'बीमा (Insurance)', desc: 'PMFBY फसल बीमा + जीवन बीमा', color: 'bg-orange-500', width: '85%' },
          { num: '3️⃣', title: 'महँगा कर्ज चुकाएं', desc: '12% से ज्यादा ब्याज वाला कर्ज पहले खत्म करें', color: 'bg-yellow-500', width: '70%' },
          { num: '4️⃣', title: 'सुरक्षित बचत', desc: 'FD, PPF, Post Office — नियमित बचत', color: 'bg-green-500', width: '55%' },
          { num: '5️⃣', title: 'खेती विस्तार', desc: 'ट्रैक्टर, जमीन, ड्रिप — सबसे आखिर में', color: 'bg-blue-500', width: '40%' },
        ].map((item, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{item.num}</span>
              <span className="text-sm font-bold text-gray-800">{item.title}</span>
            </div>
            <div className="h-8 rounded-lg overflow-hidden bg-gray-100" style={{ width: item.width }}>
              <div className={`h-full ${item.color} rounded-lg flex items-center px-3`}>
                <span className="text-xs text-white font-medium truncate">{item.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <InfoCard title="📋 उदाहरण: ₹2,00,000 अतिरिक्त मिले" color="green">
        <div className="space-y-2 mt-2">
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <p className="text-xs text-gray-600">अगर कर्ज ब्याज = <span className="font-bold text-red-600">12%</span></p>
            <p className="text-xs text-gray-600">FD रिटर्न = <span className="font-bold text-green-600">6%</span></p>
            <p className="text-sm font-bold text-gray-800 mt-1">✅ पहले कर्ज चुकाएं! (12% बचत &gt; 6% कमाई)</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <p className="text-xs text-gray-600">अगर कर्ज ब्याज = <span className="font-bold text-green-600">4% (KCC)</span></p>
            <p className="text-xs text-gray-600">FD रिटर्न = <span className="font-bold text-green-600">7%</span></p>
            <p className="text-sm font-bold text-gray-800 mt-1">✅ FD में डालें! (7% कमाई &gt; 4% कर्ज लागत)</p>
          </div>
        </div>
      </InfoCard>

      <WarningBox>
        ❌ कभी भी आपातकालीन फंड से निवेश न करें। कभी भी फसल की पूँजी को "डबल" करने की योजना में न लगाएं।
      </WarningBox>
    </div>
  ),

  // ── 2. Safe Savings Options ─────────────────────────────────────────────────
  savings: (
    <div className="space-y-3">
      <InfoCard title="🏦 सुरक्षित बचत विकल्प" color="green">
        <p className="text-sm text-gray-700 leading-relaxed">
          किसानों के लिए सबसे महत्वपूर्ण बात: पैसा सुरक्षित रखना। ज्यादा रिटर्न के चक्कर में मूलधन न गँवाएं।
        </p>
      </InfoCard>

      {/* Savings comparison table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">📊 बचत विकल्प तुलना</p>
        <div className="space-y-2">
          {[
            { name: 'Bank FD', rate: '6–7%', lock: '1-5 साल', risk: '🟢 बहुत कम', best: 'शॉर्ट टर्म बचत' },
            { name: 'Post Office RD', rate: '6.7%', lock: '5 साल', risk: '🟢 बहुत कम', best: 'मासिक बचत की आदत' },
            { name: 'PPF', rate: '7.1%', lock: '15 साल', risk: '🟢 शून्य', best: 'रिटायरमेंट + टैक्स बचत' },
            { name: 'Sukanya Samriddhi', rate: '8.2%', lock: '21 साल', risk: '🟢 शून्य', best: 'बेटी का भविष्य' },
            { name: 'KVP (Kisan Vikas Patra)', rate: '~7.5%', lock: '~9 साल', risk: '🟢 बहुत कम', best: 'पैसा दोगुना करना' },
            { name: 'सोना (Gold)', rate: 'अस्थिर', lock: 'कोई नहीं', risk: '🟡 मध्यम', best: 'कुल का 10-15% तक' },
          ].map((opt, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-800">{opt.name}</p>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">{opt.rate}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>🔒 {opt.lock}</span>
                <span>{opt.risk}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">✨ सबसे अच्छा: {opt.best}</p>
            </div>
          ))}
        </div>
      </div>

      <WarningBox>
        🚫 कभी निवेश न करें: Emergency Fund • फसल Working Capital • "पैसा डबल" स्कीम में • बिना समझे किसी भी स्कीम में
      </WarningBox>

      <InfoCard title="⚠️ इनसे बचें — खतरनाक!" color="red">
        <div className="space-y-2 mt-1">
          {[
            '❌ "3 महीने में पैसा डबल" — यह 100% धोखा है',
            '❌ चिट फंड (बिना रजिस्ट्रेशन वाले)',
            '❌ Crypto / Bitcoin — बहुत ज्यादा जोखिम',
            '❌ अनजान व्यक्ति की "गारंटीड रिटर्न" स्कीम',
          ].map((item, i) => (
            <p key={i} className="text-xs text-red-700 font-medium">{item}</p>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="✅ सोने में निवेश — सही तरीका" color="amber">
        <p className="text-sm text-gray-700 leading-relaxed">
          सोना अच्छा है, लेकिन कुल बचत का 10-15% से ज्यादा नहीं। बेहतर विकल्प: Sovereign Gold Bond (SGB) — सरकारी + 2.5% ब्याज भी मिलता है।
        </p>
      </InfoCard>
    </div>
  ),

  // ── 3. Farm Expansion Planning ──────────────────────────────────────────────
  expansion: ({ navigate }) => (
    <div className="space-y-3">
      <InfoCard title="🚜 वैज्ञानिक तरीके से खेती बढ़ाएं" color="amber">
        <p className="text-sm text-gray-700 leading-relaxed">
          ट्रैक्टर, जमीन, पॉलीहाउस, या ड्रिप सिस्टम — कोई भी बड़ा निवेश करने से पहले 3 सवाल जरूर पूछें।
        </p>
      </InfoCard>

      {/* 3 Questions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">🤔 निवेश से पहले 3 सवाल</p>
        {[
          { num: '1', q: 'ROI कितना है?', desc: 'इस निवेश से कितनी अतिरिक्त आय होगी? क्या यह ब्याज दर से ज्यादा है?', color: 'bg-blue-500' },
          { num: '2', q: 'Payback कितने साल?', desc: 'निवेश की राशि कितने सालों में वापस आएगी? 3-5 साल से ज्यादा = सावधानी', color: 'bg-amber-500' },
          { num: '3', q: 'कर्ज का बोझ?', desc: 'अगर कर्ज लेना पड़े — EMI मासिक बचत का 30% से कम होगी?', color: 'bg-red-500' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm font-bold">{item.num}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{item.q}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Drip Example */}
      <InfoCard title="📋 उदाहरण: ड्रिप सिस्टम लगाना" color="green">
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3 border border-green-100 text-center">
              <p className="text-xs text-gray-500">लागत</p>
              <p className="text-lg font-bold text-gray-800">₹1,00,000</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-100 text-center">
              <p className="text-xs text-gray-500">अतिरिक्त आय/वर्ष</p>
              <p className="text-lg font-bold text-green-600">₹30,000</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Payback Period</span>
              <span className="font-bold text-blue-600">3.3 साल</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">कर्ज ब्याज दर</span>
              <span className="font-bold text-gray-700">7%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">ROI</span>
              <span className="font-bold text-green-600">30% (7% से बहुत ज्यादा)</span>
            </div>
          </div>
          <p className="text-sm font-bold text-green-700">✅ अच्छा निवेश — ROI &gt; ब्याज दर, Payback &lt; 5 साल</p>
        </div>
      </InfoCard>

      {/* Bad Example */}
      <InfoCard title="❌ खराब उदाहरण: नई गाड़ी लेना" color="red">
        <div className="bg-white rounded-xl p-3 border border-red-100 mt-2">
          <p className="text-xs text-gray-600">लागत = ₹8,00,000 • कर्ज ब्याज = 12% • अतिरिक्त आय = ₹0</p>
          <p className="text-sm font-bold text-red-700 mt-1">❌ ROI = 0%, EMI बोझ ज्यादा, Payback = कभी नहीं</p>
        </div>
      </InfoCard>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-2">🔗 ROI Calculator से जाँचें</p>
        <p className="text-xs text-blue-600 mb-3">कोई भी बड़ा निवेश करने से पहले कैलकुलेटर में डालकर देखें</p>
        <button onClick={() => navigate('/tools/loan-roi')}
          className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          ROI Calculator खोलें →
        </button>
      </div>
    </div>
  ),

  // ── 4. Retirement Planning ──────────────────────────────────────────────────
  retirement: ({ setView }) => (
    <div className="space-y-3">
      <InfoCard title="🌅 किसानों के लिए रिटायरमेंट" color="purple">
        <p className="text-sm text-gray-700 leading-relaxed">
          नौकरीपेशा लोगों को पेंशन मिलती है, लेकिन किसानों को नहीं। इसलिए खुद से रिटायरमेंट फंड बनाना बहुत जरूरी है। सिर्फ जमीन बेचने पर निर्भर रहना खतरनाक है।
        </p>
      </InfoCard>

      {/* Reality Check */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-red-800 mb-2">⚠️ कड़वी सच्चाई</p>
        <div className="space-y-1.5">
          {[
            '❌ "जमीन बेच दूँगा" — अगर भाव गिरा तो?',
            '❌ "बच्चे देख लेंगे" — बच्चों पर अतिरिक्त बोझ',
            '❌ "अभी सोचने की जरूरत नहीं" — बाद में बहुत देर',
            '✅ "₹3,000/माह से शुरू करता हूँ" — 20 साल बाद लाखों',
          ].map((item, i) => (
            <p key={i} className="text-xs text-red-700 font-medium">{item}</p>
          ))}
        </div>
      </div>

      {/* Projection Examples */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">📊 अगर हर महीने बचाएं तो...</p>
        <div className="space-y-2">
          {[
            { monthly: '₹2,000', years: 20, rate: 7, result: '₹10,39,000' },
            { monthly: '₹5,000', years: 20, rate: 7, result: '₹25,99,000' },
            { monthly: '₹5,000', years: 25, rate: 7, result: '₹40,56,000' },
            { monthly: '₹10,000', years: 20, rate: 7, result: '₹51,98,000' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between bg-purple-50 rounded-xl p-3 border border-purple-100">
              <div>
                <p className="text-xs font-bold text-purple-800">{row.monthly}/माह × {row.years} साल</p>
                <p className="text-xs text-purple-500">@ {row.rate}% वार्षिक</p>
              </div>
              <p className="text-sm font-bold text-green-600">{row.result}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tool CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-4 text-white">
        <p className="text-sm font-bold">📊 रिटायरमेंट प्रोजेक्शन टूल</p>
        <p className="text-xs opacity-90 mt-1">अपनी बचत और अवधि डालकर देखें — कितना मिलेगा?</p>
        <button onClick={() => setView('retirement_calc')}
          className="mt-3 bg-white text-purple-700 text-xs font-bold px-4 py-2 rounded-xl">
          प्रोजेक्शन देखें →
        </button>
      </div>

      {/* Government Schemes */}
      <InfoCard title="🏛️ सरकारी पेंशन योजना" color="green">
        <div className="bg-white rounded-xl p-3 border border-green-100 mt-2">
          <p className="text-sm font-bold text-gray-800">PM Kisan Maandhan Yojana</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600">• उम्र 18-40 साल वाले किसान</p>
            <p className="text-xs text-gray-600">• ₹55-200/माह जमा करें (उम्र अनुसार)</p>
            <p className="text-xs text-gray-600">• 60 साल बाद ₹3,000/माह पेंशन</p>
            <p className="text-xs text-gray-600">• सरकार बराबर का योगदान देती है</p>
          </div>
          <p className="text-xs text-green-600 font-bold mt-2">📍 नजदीकी CSC केंद्र पर आवेदन करें</p>
        </div>
      </InfoCard>

      <InfoCard title="💡 शुरू करने के 3 आसान कदम" color="blue">
        <div className="space-y-2 mt-1">
          {[
            { step: '1', text: 'Post Office RD खोलें — ₹500/माह से शुरू', icon: '🏤' },
            { step: '2', text: 'PM Kisan Maandhan में रजिस्टर करें', icon: '🏛️' },
            { step: '3', text: 'हर फसल बिक्री से 10% अलग निकालें', icon: '💰' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-blue-100">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{item.step}</span>
              </div>
              <p className="text-xs text-gray-700 font-medium">{item.icon} {item.text}</p>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  ),

  // ── 5. Family & Intergenerational Planning ──────────────────────────────────
  family: (
    <div className="space-y-3">
      <InfoCard title="👨‍👩‍👧‍👦 परिवार और अगली पीढ़ी की योजना" color="rose">
        <p className="text-sm text-gray-700 leading-relaxed">
          बहुत से किसान परिवारों में अचानक मृत्यु के बाद वित्तीय समस्याएं आती हैं — सिर्फ इसलिए कि दस्तावेज़ तैयार नहीं थे। थोड़ी तैयारी से पूरे परिवार का भविष्य सुरक्षित हो सकता है।
        </p>
      </InfoCard>

      {/* Education Fund */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">📚 बच्चों की शिक्षा फंड</p>
        <div className="space-y-2">
          <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
            <p className="text-xs font-bold text-rose-800">✅ अलग खाता खोलें</p>
            <p className="text-xs text-rose-600 mt-1">बच्चों की शिक्षा के पैसे को घर के खर्चों से मिलाएं नहीं</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs font-bold text-blue-800">🏦 बेहतरीन विकल्प</p>
            <div className="mt-1 space-y-1">
              <p className="text-xs text-blue-600">• Sukanya Samriddhi (बेटी): 8.2% — सबसे ज्यादा रिटर्न</p>
              <p className="text-xs text-blue-600">• PPF: 7.1% — बच्चे के नाम पर खाता</p>
              <p className="text-xs text-blue-600">• Post Office RD: 6.7% — नियमित बचत</p>
            </div>
          </div>
        </div>
      </div>

      {/* Land Division Warning */}
      <InfoCard title="🏡 जमीन बँटवारा — सावधानी" color="amber">
        <p className="text-sm text-gray-700 leading-relaxed mt-1">
          बिना सोचे-समझे जमीन बाँटने से हर हिस्सा छोटा हो जाता है और खेती घाटे में जा सकती है।
        </p>
        <div className="mt-2 space-y-1.5">
          {[
            '⚠️ बँटवारे से पहले कानूनी सलाह लें',
            '⚠️ सभी भाई/बहनों की सहमति लिखित में लें',
            '⚠️ रजिस्ट्री और म्यूटेशन जरूर करवाएं',
            '💡 विकल्प: संयुक्त खेती कंपनी बनाएं (FPO)',
          ].map((item, i) => (
            <p key={i} className="text-xs text-amber-700 font-medium">{item}</p>
          ))}
        </div>
      </InfoCard>

      {/* Documentation Checklist */}
      <div className="bg-white rounded-2xl border-2 border-red-200 p-4">
        <p className="text-sm font-bold text-red-800 mb-3">📋 जरूरी दस्तावेज़ चेकलिस्ट</p>
        <p className="text-xs text-red-600 mb-3">⚠️ अचानक मृत्यु पर बिना इन दस्तावेज़ों के परिवार को बहुत कठिनाई होती है</p>
        <div className="space-y-2">
          {[
            { doc: 'बैंक खातों में नॉमिनी', desc: 'हर खाते में पत्नी/बच्चे का नाम जोड़ें', urgent: true },
            { doc: 'जमीन का स्वामित्व रिकॉर्ड', desc: 'खसरा, खतौनी अपडेट रखें', urgent: true },
            { doc: 'वसीयत (Will)', desc: 'कानूनी रूप से वैध वसीयत बनवाएं', urgent: true },
            { doc: 'बीमा पॉलिसी कॉपी', desc: 'परिवार को पता हो कहाँ रखी है', urgent: false },
            { doc: 'KCC/लोन दस्तावेज़', desc: 'सब एक जगह व्यवस्थित रखें', urgent: false },
            { doc: 'Aadhaar/PAN लिंक', desc: 'सभी खातों से लिंक करें', urgent: false },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.urgent ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{item.doc}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              {item.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-auto flex-shrink-0">जरूरी</span>}
            </div>
          ))}
        </div>
      </div>

      <WarningBox>
        💡 आज ही नजदीकी बैंक शाखा जाएं और सभी खातों में नॉमिनी अपडेट करें। यह 10 मिनट का काम है जो परिवार की जिंदगी बदल सकता है।
      </WarningBox>
    </div>
  ),

  // ── 6. Building Long-Term Stability ─────────────────────────────────────────
  stability: (
    <div className="space-y-3">
      <InfoCard title="🏗️ स्थिर खेती कैसे बनाएं?" color="teal">
        <p className="text-sm text-gray-700 leading-relaxed">
          स्थिर खेती = एक फसल के नुकसान से पूरा परिवार न डूबे। यह सिर्फ पैसे की बात नहीं — यह सिस्टम बनाने की बात है।
        </p>
      </InfoCard>

      {/* Stability Model */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-200 p-4">
        <p className="text-sm font-bold text-teal-800 mb-3">🏛️ स्थिर खेती के 5 स्तंभ</p>
        <div className="space-y-2">
          {[
            { icon: '💰', title: 'कम कर्ज', desc: 'कुल कर्ज < सालाना आय का 30%', color: 'bg-green-500' },
            { icon: '🛡️', title: 'आपातकालीन फंड', desc: '6 महीने का खर्च अलग', color: 'bg-blue-500' },
            { icon: '📋', title: 'बीमा सुरक्षा', desc: 'PMFBY + जीवन बीमा', color: 'bg-purple-500' },
            { icon: '🌾', title: 'विविध आय', desc: '3+ स्रोत (फसल + डेयरी + अन्य)', color: 'bg-amber-500' },
            { icon: '📊', title: 'अनुशासित खर्च', desc: 'लक्जरी < 10% आय', color: 'bg-rose-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-teal-100">
              <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Income Model */}
      <InfoCard title="🌾 बहु-आय मॉडल (60/20/20)" color="green">
        <p className="text-sm text-gray-700 leading-relaxed mt-1">
          एक फसल पर 100% निर्भर रहना खतरनाक है। आय को बाँटें:
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 bg-green-500 rounded-lg flex items-center px-2" style={{ width: '60%' }}>
              <span className="text-xs text-white font-bold">60% मुख्य फसल</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 bg-amber-500 rounded-lg flex items-center px-2" style={{ width: '40%' }}>
              <span className="text-xs text-white font-bold">20% सब्जी/फल</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 bg-blue-500 rounded-lg flex items-center px-2" style={{ width: '40%' }}>
              <span className="text-xs text-white font-bold">20% डेयरी/मुर्गी</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-green-600 font-medium mt-3">
          💡 अगर गेहूं खराब हो भी जाए, डेयरी और सब्जी से परिवार चल सकता है
        </p>
      </InfoCard>

      {/* Growth Principles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-3">📈 धीरे-धीरे बढ़ें — सिद्धांत</p>
        <div className="space-y-2">
          {[
            { rule: 'जमीन सुधार > लक्जरी खर्च', desc: 'ट्रैक्टर से पहले मिट्टी सुधारें, ड्रिप लगाएं', icon: '🌱' },
            { rule: 'धीमा और स्थिर विस्तार', desc: 'एक साल में 1 नई चीज़ करें — सब एक साथ नहीं', icon: '🐢' },
            { rule: 'रूढ़िवादी उधारी', desc: 'कर्ज सिर्फ उत्पादक काम के लिए — शादी/गाड़ी के लिए नहीं', icon: '⚖️' },
            { rule: 'ज्ञान में निवेश', desc: 'KVK, FPO मीटिंग, नई तकनीक सीखना — बिना पैसे का सबसे बड़ा ROI', icon: '📚' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span>{item.icon}</span>
                <p className="text-xs font-bold text-gray-800">{item.rule}</p>
              </div>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Long-term vision */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-4 text-white">
        <p className="text-sm font-bold">🔭 10 साल का लक्ष्य बनाएं</p>
        <div className="mt-2 space-y-1.5">
          <p className="text-xs opacity-90">साल 1-2: Emergency fund पूरा + कर्ज कम</p>
          <p className="text-xs opacity-90">साल 3-4: बीमा + दूसरा आय स्रोत शुरू</p>
          <p className="text-xs opacity-90">साल 5-7: बचत नियमित + छोटा विस्तार</p>
          <p className="text-xs opacity-90">साल 8-10: स्थिर आय + रिटायरमेंट फंड बढ़ता</p>
        </div>
        <p className="text-xs font-bold mt-3 opacity-80">
          "जो किसान 10 साल आगे सोचता है, वही वित्तीय स्वतंत्रता पाता है" 🌾
        </p>
      </div>
    </div>
  ),
}

// ─── Shared Sub-Components ────────────────────────────────────────────────────
function InfoCard({ title, color = 'blue', children }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    teal: 'bg-teal-50 border-teal-200',
    purple: 'bg-purple-50 border-purple-200',
    rose: 'bg-rose-50 border-rose-200',
  }
  return (
    <div className={`rounded-2xl border ${colors[color]} p-4`}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  )
}

function WarningBox({ children }) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
      <p className="text-xs text-red-700 font-medium leading-relaxed">{children}</p>
    </div>
  )
}
