import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Loans() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [view, setView] = useState('hub') // 'hub' | 'score' | section.id
  const [score, setScore] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const SCORE_QUESTIONS = t('loans.score_questions')

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
    <RiskScoreScreen
      answers={answers}
      setAnswers={setAnswers}
      answeredAll={answeredAll}
      onSubmit={submitScore}
      onBack={() => setView('hub')}
    />
  )

  // Build sections from translations
  const sectionsData = t('loans.sections')
  const sectionColors = {
    basics:    { color: 'from-blue-600 to-indigo-700',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
    rules:     { color: 'from-green-600 to-emerald-700', bg: 'bg-green-50',  border: 'border-green-200'  },
    types:     { color: 'from-teal-600 to-cyan-700',     bg: 'bg-teal-50',   border: 'border-teal-200'   },
    warning:   { color: 'from-red-600 to-rose-700',      bg: 'bg-red-50',    border: 'border-red-200',   risk: 'high' },
    kcc:       { color: 'from-amber-600 to-orange-700',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
    solutions: { color: 'from-indigo-600 to-purple-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  }
  const sectionIcons = { basics: '📖', rules: '📏', types: '🗂️', warning: '⚠️', kcc: '💳', solutions: '🔧' }
  const SECTIONS = ['basics','rules','types','warning','kcc','solutions'].map(id => ({
    id,
    icon: sectionIcons[id],
    title: sectionsData[id].title,
    sub: sectionsData[id].sub,
    desc: sectionsData[id].desc,
    ...sectionColors[id],
  }))

  const sectionData = SECTIONS.find(s => s.id === view)
  if (sectionData) return (
    <SectionDetail section={sectionData} onBack={() => setView('hub')} navigate={navigate} />
  )

  // ── Hub View ────────────────────────────────────────────────────────────────
  const scoreColor = score === null ? null : score <= 30 ? 'green' : score <= 60 ? 'yellow' : 'red'
  const scoreLabel = score === null ? null
    : score <= 30 ? t('loans.score_status_safe')
    : score <= 60 ? t('loans.score_status_caution')
    : t('loans.score_status_risk')
  const scoreEmoji = score === null ? null : score <= 30 ? '✅' : score <= 60 ? '⚠️' : '🔴'

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="flex items-center justify-between mb-4 relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-indigo-300 text-sm">
            <span className="text-xl font-bold">‹</span><span>{t('common.home')}</span>
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <span>🚪</span><span>{t('logout.btn')}</span>
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/30">
            <span className="text-3xl">🏦</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('loans.header_title')}</h1>
            <p className="text-indigo-300 text-xs mt-0.5">{t('loans.header_subtitle')}</p>
          </div>
        </div>

        <div className="relative mt-4 bg-white/10 rounded-xl p-3">
          <p className="text-indigo-100 text-xs leading-relaxed">
            {t('loans.header_goal')} <span className="text-white font-medium">{t('loans.header_goal_text')}</span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Risk Score Card */}
        <div className={`rounded-2xl p-4 border-2 ${
          score === null ? 'bg-white border-gray-200' :
          scoreColor === 'green' ? 'bg-green-50 border-green-300' :
          scoreColor === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
        }`}>
          {score === null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{t('loans.score_check_title')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('loans.score_check_sub')}</p>
              </div>
              <button onClick={() => setView('score')}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                {t('loans.score_start_btn')}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">{t('loans.score_title')}</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    scoreColor === 'green' ? 'text-green-600' : scoreColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{scoreEmoji} {scoreLabel}</p>
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
                <span>0 {t('loans.score_axis_safe')}</span><span>30</span><span>60</span><span>100 {t('loans.score_axis_risk')}</span>
              </div>
              <button onClick={() => setView('score')} className="mt-2 text-xs text-indigo-600 font-medium">
                {t('loans.score_recheck')}
              </button>
            </div>
          )}
        </div>

        {/* 6 Section Cards */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('loans.sections_label')}</p>
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
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">⚠️ {t('loans.risk_badge')}</span>
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
          <p className="text-xs font-semibold text-gray-500 mb-3">{t('loans.calc_section_label')}</p>
          <div className="grid grid-cols-3 gap-2">
            {t('loans.quick_tools').map(c => (
              <button key={c.path} onClick={() => navigate(c.path)}
                className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100 active:bg-gray-100">
                <span className="text-xl">{c.icon}</span>
                <p className="text-xs text-gray-600 font-medium mt-1 leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Related sections */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/cashflow')}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left">
            <p className="text-xl">💸</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">{t('loans.nav_cashflow')}</p>
            <p className="text-xs text-emerald-400">{t('loans.nav_cashflow_sub')}</p>
          </button>
          <button onClick={() => navigate('/risk')}
            className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
            <p className="text-xl">🛡️</p>
            <p className="text-xs font-semibold text-rose-700 mt-1">{t('loans.nav_risk')}</p>
            <p className="text-xs text-rose-400">{t('loans.nav_risk_sub')}</p>
          </button>
          <button onClick={() => navigate('/market')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xl">📈</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">{t('loans.nav_market')}</p>
            <p className="text-xs text-amber-400">{t('loans.nav_market_sub')}</p>
          </button>
          <button onClick={() => navigate('/wealth')}
            className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-left">
            <p className="text-xl">🌱</p>
            <p className="text-xs font-semibold text-teal-700 mt-1">{t('loans.nav_wealth')}</p>
            <p className="text-xs text-teal-400">{t('loans.nav_wealth_sub')}</p>
          </button>
        </div>

        <button onClick={() => navigate('/learn')}
          className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📘</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-indigo-700">{t('loans.learn_module')}</p>
            <p className="text-xs text-indigo-500">{t('loans.learn_module_sub')}</p>
          </div>
          <span className="text-indigo-300 text-xl ml-auto">›</span>
        </button>
      </div>

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-gray-800">{t('logout.confirm_title')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm">{t('logout.stay')}</button>
              <button onClick={handleLogout}
                className="py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">{t('logout.yes_logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Risk Score Quiz Screen ───────────────────────────────────────────────────
function RiskScoreScreen({ answers, setAnswers, answeredAll, onSubmit, onBack }) {
  const { t } = useTranslation()
  const SCORE_QUESTIONS = t('loans.score_questions')
  const [current, setCurrent] = useState(0)
  const q = SCORE_QUESTIONS[current]
  const progress = (current / SCORE_QUESTIONS.length) * 100

  function selectOption(idx) {
    setAnswers(prev => ({ ...prev, [q.id]: idx }))
    if (current < SCORE_QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 300)
    }
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col">
      <div className="px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-indigo-300 text-sm flex items-center gap-1 mb-4">
          <span className="text-xl">‹</span> {t('loans.quiz_back')}
        </button>
        <div className="flex justify-between text-xs text-indigo-400 mb-2">
          <span>{t('loans.quiz_question_of').replace('{current}', current + 1).replace('{total}', SCORE_QUESTIONS.length)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-indigo-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="bg-indigo-900 rounded-3xl p-6 mb-6">
          <p className="text-xs text-indigo-400 mb-2">{t('loans.quiz_question_label')} {current + 1}</p>
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
                  : 'bg-indigo-800 border-indigo-700 text-indigo-100 active:bg-indigo-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[q.id] === i ? 'bg-white border-white' : 'border-indigo-500'
                }`}>
                  {answers[q.id] === i && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
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
            className="w-full py-4 bg-amber-400 text-indigo-900 font-bold text-base rounded-2xl">
            {t('loans.quiz_submit')}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Section Detail ───────────────────────────────────────────────────────────
function SectionDetail({ section, onBack, navigate }) {
  const { t } = useTranslation()
  const calcLinks = t('loans.calc_links')
  const content = SECTION_CONTENT[section.id]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className={`bg-gradient-to-br ${section.color} text-white px-4 pt-10 pb-5`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span><span>{t('loans.header_title')}</span>
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
        {content}

        {calcLinks[section.id] && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('hubs.loans.calc_title')}</p>
            <div className="space-y-2">
              {calcLinks[section.id].map(c => (
                <button key={c.path} onClick={() => navigate(c.path)}
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

// ─── Shared Sub-Components ────────────────────────────────────────────────────
function InfoCard({ title, color = 'blue', children }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    teal: 'bg-teal-50 border-teal-200',
  }
  return (
    <div className={`rounded-2xl border ${colors[color]} p-4`}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  )
}

function ExampleBox({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    amber: 'bg-amber-100 text-amber-800',
  }
  return (
    <div className={`rounded-xl px-3 py-2 text-xs font-medium mt-2 ${colors[color]}`}>
      📋 उदाहरण: {children}
    </div>
  )
}

function RuleCard({ number, color, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className={`flex items-center gap-3 px-4 py-3 ${color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}>
          {number}
        </div>
        <p className="font-bold text-gray-800 text-sm">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function ProblemCard({ icon, title, color, solutions }) {
  const colors = {
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
  }
  const tagColors = {
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  }
  return (
    <div className={`rounded-2xl border ${colors[color]} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="font-bold text-gray-800 text-sm">{title}</p>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {solutions.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border border-white shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800">{s.action}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${tagColors[color]}`}>{s.tag}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{s.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section Content (educational body — kept inline per no-over-engineering rule) ──
const SECTION_CONTENT = {

  // ── 1. Basics ────────────────────────────────────────────────────────────────
  basics: (
    <div className="space-y-3">
      <InfoCard title="💰 ब्याज क्या होता है?" color="blue">
        <p className="text-sm text-gray-700 leading-relaxed">बैंक या साहूकार से पैसा उधार लेने पर उस पर एक अतिरिक्त शुल्क देते हैं — यही ब्याज है। यह मूलधन पर प्रतिशत के रूप में लगता है।</p>
        <ExampleBox>₹50,000 कर्ज पर 7% वार्षिक ब्याज = ₹3,500/वर्ष अतिरिक्त</ExampleBox>
      </InfoCard>

      <InfoCard title="📊 Simple vs Compound ब्याज" color="blue">
        <div className="space-y-2 text-sm text-gray-700">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="font-semibold text-green-700">Simple (सरल) — बैंक कर्ज पर</p>
            <p className="text-xs mt-1">₹50,000 × 7% × 3 साल = <strong>₹10,500 ब्याज</strong></p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="font-semibold text-red-700">Compound (चक्रवृद्धि) — NBFC/क्रेडिट कार्ड</p>
            <p className="text-xs mt-1">₹50,000 पर 3 साल बाद देय: <strong>₹61,257</strong> (11,257 ब्याज)</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="⚠️ मासिक vs वार्षिक दर का जाल" color="red">
        <p className="text-sm text-gray-700 mb-2">साहूकार अक्सर "सिर्फ 3%/माह" कहते हैं — यह <strong className="text-red-600">36%/वर्ष</strong> है!</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="font-bold text-green-700">KCC</p>
            <p className="text-green-600">4% / वर्ष</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="font-bold text-red-700">साहूकार</p>
            <p className="text-red-600">36–72% / वर्ष</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="📅 EMI की असली लागत" color="blue">
        <p className="text-xs text-gray-600 mb-2">₹1,00,000 कर्ज, 12% ब्याज, 5 वर्ष:</p>
        <div className="space-y-1.5 text-xs">
          {[
            { label: 'मूलधन', val: '₹1,00,000' },
            { label: 'कुल ब्याज चुकाएंगे', val: '₹33,306', red: true },
            { label: 'कुल देय राशि', val: '₹1,33,306', bold: true },
            { label: 'मासिक EMI', val: '₹2,224' },
          ].map(r => (
            <div key={r.label} className="flex justify-between bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="text-gray-600">{r.label}</span>
              <span className={`font-bold ${r.red ? 'text-red-600' : 'text-gray-800'}`}>{r.val}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  ),

  // ── 2. Safe Borrowing Rules ──────────────────────────────────────────────────
  rules: (
    <div className="space-y-3">
      <RuleCard number="1" color="green" title="EMI नियम: 30% से कम रखें">
        <p className="text-sm text-gray-700">आपकी कुल मासिक EMI, मासिक बचत/आय के 30% से ज्यादा नहीं होनी चाहिए।</p>
        <ExampleBox color="orange">मासिक आय ₹15,000 → EMI ≤ ₹4,500 (सुरक्षित)</ExampleBox>
      </RuleCard>

      <RuleCard number="2" color="green" title="उत्पादक कर्ज नियम">
        <p className="text-sm text-gray-700">केवल उस चीज़ के लिए कर्ज लें जो आय बढ़ाए — फसल, उपकरण, सिंचाई।</p>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1.5">
            <span className="text-green-600 font-bold">✅</span>
            <span className="text-gray-700">KCC से बुआई → फसल बेचकर चुकाएं</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
            <span className="text-red-600 font-bold">❌</span>
            <span className="text-gray-700">शादी / TV / वाहन के लिए high-interest कर्ज</span>
          </div>
        </div>
      </RuleCard>

      <RuleCard number="3" color="green" title="कर्ज से कर्ज मत चुकाएं">
        <p className="text-sm text-gray-700">नया कर्ज लेकर पुराना चुकाना — यह कर्ज जाल की शुरुआत है।</p>
        <div className="bg-red-50 rounded-xl p-3 mt-2 text-xs text-red-700">
          ⚠️ अगर ऐसा करना पड़ रहा है → तुरंत बैंक से restructuring माँगें
        </div>
      </RuleCard>

      <RuleCard number="4" color="red" title="Emergency Fund पहले, कर्ज बाद में">
        <p className="text-sm text-gray-700">कम से कम 3 महीने का Emergency Fund हो, तभी नया कर्ज लें।</p>
        <div className="bg-blue-50 rounded-xl p-3 mt-2 text-xs text-blue-700">
          💡 Emergency Fund से distress selling रुकती है और कर्ज की जरूरत कम होती है
        </div>
      </RuleCard>
    </div>
  ),

  // ── 3. Types of Farm Loans ───────────────────────────────────────────────────
  types: (
    <div className="space-y-3">
      <div className="space-y-2">
        {[
          { type: 'KCC (Kisan Credit Card)', rate: '4%/वर्ष', use: 'बुआई लागत, खाद, बीज', color: 'green', best: true },
          { type: 'Short-term Crop Loan', rate: '7–9%/वर्ष', use: 'एक फसल चक्र के लिए', color: 'blue', best: false },
          { type: 'Agriculture Term Loan', rate: '8–12%/वर्ष', use: 'उपकरण, सिंचाई, भूमि सुधार', color: 'teal', best: false },
          { type: 'Allied Activities Loan', rate: '9–11%/वर्ष', use: 'पशुपालन, मत्स्य पालन', color: 'blue', best: false },
          { type: 'NBFC/MFI Loan', rate: '18–26%/वर्ष', use: 'अंतिम विकल्प', color: 'orange', best: false },
          { type: 'साहूकार', rate: '36–72%/वर्ष', use: '⛔ बिल्कुल नहीं', color: 'red', best: false },
        ].map(r => (
          <div key={r.type} className={`rounded-xl p-3 border text-xs ${
            r.best ? 'bg-green-50 border-green-200' :
            r.color === 'red' ? 'bg-red-50 border-red-200' :
            r.color === 'orange' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-start">
              <p className={`font-bold text-sm ${r.best ? 'text-green-700' : r.color === 'red' ? 'text-red-700' : 'text-gray-700'}`}>{r.type}</p>
              <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${r.best ? 'bg-green-200 text-green-800' : r.color === 'red' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{r.rate}</span>
            </div>
            <p className="text-gray-500 mt-1">{r.use}</p>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <p className="text-xs font-bold text-amber-700 mb-1">💡 सरल नियम: हमेशा सबसे कम ब्याज वाला पहले चुनें</p>
        <p className="text-xs text-amber-600">KCC → Cooperative → Bank Loan → NBFC → साहूकार (कभी नहीं)</p>
      </div>
    </div>
  ),

  // ── 4. Debt Trap Warning ─────────────────────────────────────────────────────
  warning: (
    <div className="space-y-3">
      <div className="bg-red-600 rounded-2xl p-4 text-white">
        <p className="font-bold text-base">⚠️ 5 खतरनाक संकेत</p>
        <p className="text-xs text-red-100 mt-1">अगर इनमें से 2+ लागू हों — तुरंत कदम उठाएं</p>
      </div>

      {[
        { n: '1', title: 'EMI > बचत का 50%', desc: 'हर महीने आधी बचत EMI में जा रही है — खतरे का संकेत', color: 'red' },
        { n: '2', title: 'कर्ज से कर्ज चुकाना', desc: 'नए कर्ज से पुराना चुका रहे हैं — यह चक्र खतरनाक है', color: 'red' },
        { n: '3', title: 'साहूकार पर निर्भरता', desc: '36%+ ब्याज पर कर्ज — यह बर्बादी की राह है', color: 'red' },
        { n: '4', title: 'कुल कर्ज > वार्षिक आय', desc: 'जितनी सालाना कमाई उससे ज्यादा कर्ज — बहुत खतरनाक', color: 'red' },
        { n: '5', title: 'EMI बाउंस हो रही है', desc: 'CIBIL score गिर रहा है, और लोन मिलना मुश्किल होगा', color: 'red' },
      ].map(w => (
        <div key={w.n} className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50">
            <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{w.n}</div>
            <p className="font-bold text-gray-800 text-sm">{w.title}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-600">{w.desc}</p>
          </div>
        </div>
      ))}

      <InfoCard title="🆘 फँस गए तो क्या करें?" color="blue">
        <div className="space-y-1.5 text-xs text-gray-700">
          {[
            '1️⃣ बैंक/NABARD को लिखित में बताएं — छुपाएं नहीं',
            '2️⃣ KCC/कृषि ऋण restructuring के लिए आवेदन करें',
            '3️⃣ KVK से मुफ्त वित्तीय परामर्श लें',
            '4️⃣ PM Kisan Helpline: 155261',
          ].map((s, i) => <p key={i}>{s}</p>)}
        </div>
      </InfoCard>
    </div>
  ),

  // ── 5. KCC Deep Dive ──────────────────────────────────────────────────────
  kcc: (
    <div className="space-y-3">
      <div className="bg-amber-500 rounded-2xl p-4 text-white">
        <p className="text-base font-bold">💳 किसान क्रेडिट कार्ड</p>
        <p className="text-xs text-amber-100 mt-1">भारत का सबसे सस्ता कृषि ऋण — 4% नेट ब्याज</p>
      </div>

      <InfoCard title="💰 ब्याज सब्सिडी का जादू" color="amber">
        <div className="space-y-2 text-xs">
          {[
            { label: 'बैंक की सामान्य दर', rate: '7%', minus: false, bold: false, green: false },
            { label: '→ सरकार देती है 2% सब्सिडी', rate: '-2%', minus: true, bold: false, green: false },
            { label: '→ आप चुकाते हैं', rate: '5%', minus: false, bold: true, green: false },
            { label: '→ समय पर चुकाएं तो 3% और छूट', rate: '-3%', minus: true, bold: false, green: false },
            { label: '✅ आपकी असली दर', rate: '4%', note: '(कभी-कभी 1%!)', minus: false, bold: false, green: true },
          ].map((r, i) => (
            <div key={i} className={`flex justify-between rounded-lg px-3 py-2 ${r.green ? 'bg-green-100' : r.minus ? '' : 'bg-gray-50'}`}>
              <span className={`${r.green ? 'font-bold text-green-700' : r.minus ? 'text-green-600 text-xs' : 'text-gray-600'}`}>{r.label}</span>
              <span className={`font-bold ${r.green ? 'text-green-700' : r.minus ? 'text-green-600' : 'text-gray-800'}`}>{r.rate} {r.note}</span>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="📐 लिमिट कैसे तय होती है?" color="amber">
        <div className="text-xs text-gray-700 space-y-2">
          <div className="bg-amber-50 rounded-lg px-3 py-2">
            <p className="font-semibold text-amber-700">फॉर्मूला:</p>
            <p className="mt-0.5">एक वर्ष फसल लागत × 1.10 = KCC लिमिट</p>
          </div>
          <ExampleBox color="amber">2 एकड़ गेहूं, लागत ₹40,000/एकड़ → KCC = ₹88,000</ExampleBox>
          <p>• ज़मीन जितनी ज्यादा → लिमिट उतनी बड़ी</p>
          <p>• पहली बार: ₹25,000 तक बिना जमानत</p>
          <p>• अच्छे record पर हर साल 10% बढ़ती है</p>
        </div>
      </InfoCard>

      <InfoCard title="📅 Repayment Cycle" color="amber">
        <div className="text-xs text-gray-700 space-y-1.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-2"><p className="font-bold text-green-700">खरीफ</p><p>अप्रैल लें</p><p>→ नवंबर चुकाएं</p></div>
            <div className="bg-blue-50 rounded-lg p-2"><p className="font-bold text-blue-700">रबी</p><p>अक्टूबर लें</p><p>→ मार्च चुकाएं</p></div>
            <div className="bg-amber-50 rounded-lg p-2"><p className="font-bold text-amber-700">जायद</p><p>फरवरी लें</p><p>→ जून चुकाएं</p></div>
          </div>
          <div className="bg-red-50 rounded-lg px-3 py-2">
            <p className="text-red-700 font-semibold">⚠️ समय पर न चुकाएं तो:</p>
            <p className="text-red-600">• ब्याज सब्सिडी खत्म (4% → 7%+)</p>
            <p className="text-red-600">• NPA → अगले लोन में दिक्कत</p>
            <p className="text-red-600">• CIBIL Score खराब</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="📋 KCC के लिए ज़रूरी दस्तावेज" color="amber">
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {['✅ आधार कार्ड', '✅ खसरा / खतौनी', '✅ बैंक पासबुक', '✅ पासपोर्ट फोटो 2', '✅ भूमि स्वामित्व प्रमाण', '✅ Crop plan (कौन सी फसल)'].map(d => (
            <div key={d} className="bg-green-50 rounded-lg px-2 py-1.5 text-green-700">{d}</div>
          ))}
        </div>
        <div className="bg-blue-50 rounded-xl p-3 mt-2 text-xs text-blue-700">
          💡 रिन्यूअल: हर साल मार्च-अप्रैल में बैंक जाएं। नहीं गए तो account dormant हो जाएगा।
        </div>
      </InfoCard>
    </div>
  ),

  // ── 6. Loan Problems & Solutions ─────────────────────────────────────────
  solutions: (
    <div className="space-y-3">
      <ProblemCard
        icon="😰" title="EMI बहुत ज्यादा हो गई"
        color="orange"
        solutions={[
          { action: 'अवधि बढ़वाएं (Tenure Extension)', detail: 'EMI कम होगी, कुल ब्याज थोड़ा बढ़ेगा', tag: 'सबसे आसान' },
          { action: 'Refinance करें (कम ब्याज पर)', detail: 'दूसरे बैंक से कम दर पर नया लोन लें', tag: 'अच्छा विकल्प' },
          { action: 'Partial prepayment करें', detail: 'एकमुश्त कुछ चुकाएं — EMI घटती है', tag: 'अगर बचत हो तो' },
        ]}
      />

      <ProblemCard
        icon="😨" title="कर्ज चुकाना मुश्किल हो गया"
        color="red"
        solutions={[
          { action: '🏦 बैंक को जल्दी बताएं', detail: '90 दिन से पहले जाएं — NPA से पहले आसान होता है', tag: '⚡ तुरंत करें' },
          { action: 'Loan Restructuring माँगें', detail: 'RBI guideline: बैंक restructure करने को बाध्य है', tag: 'आपका अधिकार' },
          { action: 'NABARD / राज्य सरकार की relief scheme', detail: 'प्राकृतिक आपदा पर ब्याज माफी मिल सकती है', tag: 'जाँचें' },
        ]}
      />

      <ProblemCard
        icon="🙁" title="लोन rejected हो गया"
        color="blue"
        solutions={[
          { action: 'दस्तावेज ठीक करें', detail: 'खसरा, आधार, जमीन record — errors fix करें', tag: 'सबसे आम कारण' },
          { action: 'CIBIL score सुधारें', detail: 'पुराना बकाया चुकाएं, credit history बनाएं', tag: '3–6 महीने' },
          { action: 'SHG / FPO के माध्यम से लें', detail: 'ग्रुप guarantee से लोन आसान होता है', tag: 'नया तरीका' },
        ]}
      />

      <InfoCard title="📞 मदद के लिए संपर्क करें" color="blue">
        <div className="space-y-2 text-xs">
          {[
            { label: 'PM Kisan Helpline', num: '155261', note: '24×7 मुफ्त' },
            { label: 'Banking Ombudsman', num: '14448', note: 'बैंक शिकायत' },
            { label: 'KVK (Krishi Vigyan Kendra)', num: '1800-180-1551', note: 'मुफ्त कृषि सलाह' },
            { label: 'NABARD', num: '1800-200-0101', note: 'कृषि वित्त' },
          ].map(c => (
            <div key={c.label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div><p className="font-medium text-gray-700">{c.label}</p><p className="text-gray-400">{c.note}</p></div>
              <span className="font-bold text-blue-600">{c.num}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  ),
}
