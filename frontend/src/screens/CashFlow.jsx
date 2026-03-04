import { fmtNum } from '../lib/locale'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

export default function CashFlow() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [view, setView] = useState('hub')
  const [score, setScore] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showLogout, setShowLogout] = useState(false)

  const SCORE_QUESTIONS = t('cashflow.score_questions')

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
  const scoreColor = score === null ? null : score <= 30 ? 'green' : score <= 60 ? 'yellow' : 'red'
  const scoreLabel = score === null ? null
    : score <= 30 ? t('cashflow.score_status_stable')
    : score <= 60 ? t('cashflow.score_status_moderate')
    : t('cashflow.score_status_stress')
  const scoreEmoji = score === null ? null : score <= 30 ? '✅' : score <= 60 ? '⚠️' : '🔴'

  if (view === 'score') return (
    <ScoreScreen answers={answers} setAnswers={setAnswers} answeredAll={answeredAll}
      onSubmit={submitScore} onBack={() => setView('hub')} />
  )
  if (view === 'planner') return <PlannerScreen onBack={() => setView('hub')} navigate={navigate} />

  const sections = t('cashflow.sections')
  const sectionIds = ['seasonal', 'planner', 'emergency', 'distress', 'separation', 'working']
  const sectionColors = {
    seasonal:   { color: 'from-blue-600 to-indigo-700',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
    planner:    { color: 'from-emerald-600 to-green-700',  bg: 'bg-emerald-50', border: 'border-emerald-200', isPlanner: true },
    emergency:  { color: 'from-red-600 to-rose-700',       bg: 'bg-red-50',     border: 'border-red-200'    },
    distress:   { color: 'from-orange-600 to-amber-700',   bg: 'bg-orange-50',  border: 'border-orange-200' },
    separation: { color: 'from-teal-600 to-cyan-700',      bg: 'bg-teal-50',    border: 'border-teal-200'   },
    working:    { color: 'from-violet-600 to-purple-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  }
  const sectionIcons = { seasonal: '📅', planner: '📊', emergency: '🛡️', distress: '🚫', separation: '📒', working: '🔄' }

  const SECTIONS = sectionIds.map(id => ({
    id,
    icon: sectionIcons[id],
    title: sections[id].title,
    sub: sections[id].sub,
    desc: sections[id].desc,
    ...sectionColors[id],
  }))

  const sectionData = SECTIONS.find(s => s.id === view)
  if (sectionData) return (
    <SectionDetail section={sectionData} onBack={() => setView('hub')} navigate={navigate} />
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-4 w-20 h-20 bg-emerald-300/10 rounded-full translate-y-1/2" />

        <div className="flex items-center justify-between mb-4 relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-emerald-300 text-sm">
            <span className="text-xl font-bold">‹</span><span>{t('common.home')}</span>
          </button>
          <button onClick={() => setShowLogout(true)}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            <span>🚪</span><span>{t('logout.btn')}</span>
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-emerald-400/20 rounded-2xl flex items-center justify-center border border-emerald-400/30">
            <span className="text-3xl">💸</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('cashflow.header_title')}</h1>
            <p className="text-emerald-300 text-xs mt-0.5">{t('cashflow.header_subtitle')}</p>
          </div>
        </div>

        <div className="relative mt-3 bg-white/10 rounded-xl p-3">
          <p className="text-emerald-100 text-xs leading-relaxed">
            {t('cashflow.header_goal')} <span className="text-white font-medium">{t('cashflow.header_goal_text')}</span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Risk Score */}
        <div className={`rounded-2xl p-4 border-2 ${
          score === null ? 'bg-white border-gray-200' :
          scoreColor === 'green' ? 'bg-green-50 border-green-300' :
          scoreColor === 'yellow' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
        }`}>
          {score === null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{t('cashflow.score_check_title')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('cashflow.score_check_sub')}</p>
              </div>
              <button onClick={() => setView('score')}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                {t('cashflow.score_start_btn')}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">{t('cashflow.score_title')}</p>
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
                <span>0 {t('cashflow.score_axis_stable')}</span><span>30</span><span>60</span><span>100 {t('cashflow.score_axis_stress')}</span>
              </div>
              <button onClick={() => setView('score')} className="mt-2 text-xs text-emerald-600 font-medium">
                {t('cashflow.score_recheck')}
              </button>
            </div>
          )}
        </div>

        {/* 6 Sections */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('cashflow.sections_label')}</p>
          <div className="space-y-2.5">
            {SECTIONS.map(s => (
              <button key={s.id}
                onClick={() => s.isPlanner ? setView('planner') : setView(s.id)}
                className={`w-full ${s.bg} border ${s.border} rounded-2xl p-4 text-left active:scale-98 transition-all`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      {s.isPlanner && <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">Tool</span>}
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

        {/* Quick tools */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">{t('cashflow.calc_section_label')}</p>
          <div className="grid grid-cols-2 gap-2">
            {t('cashflow.quick_tools').map(c => (
              <button key={c.path} onClick={() => navigate(c.path)}
                className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 active:bg-gray-100 flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>
                <p className="text-xs text-gray-600 font-medium text-left leading-tight">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/risk')}
            className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
            <p className="text-xl">🛡️</p>
            <p className="text-xs font-semibold text-rose-700 mt-1">{t('cashflow.nav_risk')}</p>
            <p className="text-xs text-rose-400">{t('cashflow.nav_risk_sub')}</p>
          </button>
          <button onClick={() => navigate('/loans')}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-left">
            <p className="text-xl">🏦</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">{t('cashflow.nav_loans')}</p>
            <p className="text-xs text-indigo-400">{t('cashflow.nav_loans_sub')}</p>
          </button>
          <button onClick={() => navigate('/market')}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xl">📈</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">{t('cashflow.nav_market')}</p>
            <p className="text-xs text-amber-400">{t('cashflow.nav_market_sub')}</p>
          </button>
          <button onClick={() => navigate('/wealth')}
            className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-left">
            <p className="text-xl">🌱</p>
            <p className="text-xs font-semibold text-teal-700 mt-1">{t('cashflow.nav_wealth')}</p>
            <p className="text-xs text-teal-400">{t('cashflow.nav_wealth_sub')}</p>
          </button>
        </div>
        <button onClick={() => navigate('/learn')}
          className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📘</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-700">{t('cashflow.learn_module')}</p>
            <p className="text-xs text-blue-500">{t('cashflow.learn_module_sub')}</p>
          </div>
          <span className="text-blue-300 text-xl ml-auto">›</span>
        </button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-gray-800">{t('logout.confirm_title')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogout(false)} className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm">{t('logout.stay')}</button>
              <button onClick={handleLogout} className="py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">{t('logout.yes_logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Risk Score Quiz ──────────────────────────────────────────────────────────
function ScoreScreen({ answers, setAnswers, answeredAll, onSubmit, onBack }) {
  const { t } = useTranslation()
  const SCORE_QUESTIONS = t('cashflow.score_questions')
  const [current, setCurrent] = useState(0)
  const q = SCORE_QUESTIONS[current]
  const progress = (current / SCORE_QUESTIONS.length) * 100

  function select(i) {
    setAnswers(p => ({ ...p, [q.id]: i }))
    if (current < SCORE_QUESTIONS.length - 1) setTimeout(() => setCurrent(c => c + 1), 280)
  }

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col">
      <div className="px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-emerald-300 text-sm flex items-center gap-1 mb-4">
          <span className="text-xl">‹</span> {t('cashflow.quiz_back')}
        </button>
        <div className="flex justify-between text-xs text-emerald-400 mb-2">
          <span>{t('cashflow.quiz_question_of').replace('{current}', current + 1).replace('{total}', SCORE_QUESTIONS.length)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-emerald-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="bg-emerald-900 rounded-3xl p-6 mb-6">
          <p className="text-xs text-emerald-400 mb-2">{t('cashflow.quiz_question_label')} {current + 1}</p>
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
                  : 'bg-emerald-800 border-emerald-700 text-emerald-100 active:bg-emerald-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[q.id] === i ? 'bg-white border-white' : 'border-emerald-500'
                }`}>
                  {answers[q.id] === i && <div className="w-2.5 h-2.5 rounded-full bg-emerald-700" />}
                </div>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>
      {answeredAll && (
        <div className="p-4">
          <button onClick={onSubmit} className="w-full py-4 bg-green-400 text-emerald-900 font-bold text-base rounded-2xl">
            {t('cashflow.quiz_submit')}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 12-Month Planner Tool ────────────────────────────────────────────────────
function PlannerScreen({ onBack, navigate }) {
  const { t } = useTranslation()
  const MONTHS = t('cashflow.months')
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const [data, setData] = useState(() =>
    MONTHS.reduce((acc, _, i) => ({ ...acc, [i]: { income: '', expense: '' } }), {})
  )
  const [calculated, setCalculated] = useState(false)

  const set = (month, field, val) => {
    setData(p => ({ ...p, [month]: { ...p[month], [field]: val } }))
    setCalculated(false)
  }

  const results = MONTHS.map((_, i) => {
    const income = Number(data[i].income) || 0
    const expense = Number(data[i].expense) || 0
    const net = income - expense
    return { income, expense, net, status: net > 0 ? 'surplus' : net < 0 ? 'deficit' : 'zero' }
  })

  const deficitMonths = results.filter(r => r.status === 'deficit').length
  const totalSurplus = results.reduce((s, r) => s + Math.max(0, r.net), 0)
  const totalDeficit = results.reduce((s, r) => s + Math.min(0, r.net), 0)
  const maxVal = Math.max(...results.map(r => Math.max(r.income, r.expense, 1)))

  let maxConsecutive = 0, curr = 0
  results.forEach(r => { if (r.status === 'deficit') { curr++; maxConsecutive = Math.max(maxConsecutive, curr) } else curr = 0 })

  const filledMonths = MONTHS.filter((_, i) => data[i].income || data[i].expense).length

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white px-4 pt-10 pb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span><span>{t('cashflow.header_title')}</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('cashflow.planner_title')}</h1>
            <p className="text-xs text-white/70">{t('cashflow.planner_subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Monthly input grid */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <span>{t('cashflow.planner_col_month')}</span>
            <span className="text-center text-green-600">{t('cashflow.planner_col_income')}</span>
            <span className="text-center text-red-500">{t('cashflow.planner_col_expense')}</span>
          </div>
          {MONTHS.map((m, i) => (
            <div key={i} className={`grid grid-cols-3 items-center px-4 py-2 border-b border-gray-50 last:border-0 ${
              calculated && results[i].status === 'deficit' ? 'bg-red-50' :
              calculated && results[i].status === 'surplus' ? 'bg-green-50' : ''
            }`}>
              <div>
                <p className="text-xs font-semibold text-gray-700">{m}</p>
                <p className="text-xs text-gray-400">{MONTHS_EN[i]}</p>
              </div>
              <input type="number" inputMode="decimal" placeholder="0"
                value={data[i].income} onChange={e => set(i, 'income', e.target.value)}
                className="mx-1 p-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-green-400 bg-transparent" />
              <input type="number" inputMode="decimal" placeholder="0"
                value={data[i].expense} onChange={e => set(i, 'expense', e.target.value)}
                className="mx-1 p-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none focus:border-red-300 bg-transparent" />
            </div>
          ))}
        </div>

        <button onClick={() => setCalculated(true)} disabled={filledMonths < 3}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-bold text-base shadow-sm disabled:opacity-40">
          {t('cashflow.planner_calculate_btn')}
        </button>

        {calculated && filledMonths >= 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">{t('cashflow.planner_total_surplus')}</p>
                <p className="text-lg font-bold text-green-700">+₹{fmtNum(totalSurplus)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">{t('cashflow.planner_total_deficit')}</p>
                <p className="text-lg font-bold text-red-700">₹{fmtNum(Math.abs(totalDeficit))}</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-4">{t('cashflow.planner_chart_title')}</p>
              <div className="flex items-end gap-1 h-24">
                {results.map((r, i) => {
                  const incH = r.income > 0 ? Math.max(4, (r.income / maxVal) * 80) : 0
                  const expH = r.expense > 0 ? Math.max(4, (r.expense / maxVal) * 80) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="flex items-end gap-0.5 w-full">
                        <div className="flex-1 bg-green-400 rounded-t-sm" style={{ height: incH }} />
                        <div className="flex-1 bg-red-400 rounded-t-sm" style={{ height: expH }} />
                      </div>
                      <p className="text-gray-400" style={{ fontSize: 7 }}>{MONTHS_EN[i]}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-400 rounded inline-block"/>{t('cashflow.planner_legend_income')}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-400 rounded inline-block"/>{t('cashflow.planner_legend_expense')}</span>
              </div>
            </div>

            {/* Warning for 3+ consecutive deficits */}
            {maxConsecutive >= 3 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
                <p className="text-sm font-bold text-red-700">{t('cashflow.planner_stress_warning')}</p>
                <p className="text-xs text-red-600 mt-1">
                  {t('cashflow.planner_stress_detail').replace('{months}', maxConsecutive)}
                </p>
                <p className="text-xs text-red-500 mt-1">{t('cashflow.planner_stress_tip')}</p>
              </div>
            )}

            {/* Month-wise summary */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">{t('cashflow.planner_monthly_summary')}</p>
              {results.map((r, i) => (
                (r.income > 0 || r.expense > 0) ? (
                  <div key={i} className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 ${
                    r.status === 'deficit' ? 'bg-red-50' : r.status === 'surplus' ? 'bg-green-50' : ''
                  }`}>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{MONTHS[i]}</p>
                      <p className={`text-xs font-bold ${r.status === 'deficit' ? 'text-red-600' : 'text-green-600'}`}>
                        {r.status === 'deficit' ? `−₹${fmtNum(Math.abs(r.net))}` : `+₹${fmtNum(r.net)}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${r.status === 'deficit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.status === 'deficit' ? t('cashflow.planner_deficit_tag') : t('cashflow.planner_surplus_tag')}
                    </span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section Detail ───────────────────────────────────────────────────────────
function SectionDetail({ section, onBack, navigate }) {
  const { t } = useTranslation()
  const calcLinks = t('cashflow.calc_links')

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className={`bg-gradient-to-br ${section.color} text-white px-4 pt-10 pb-5`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <span className="text-xl font-bold">‹</span><span>{t('cashflow.header_title')}</span>
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

        {calcLinks[section.id] && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('hubs.cashflow.calc_title')}</p>
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

// ─── Shared helpers ───────────────────────────────────────────────────────────
function IC({ title, color = 'blue', children }) {
  const c = { blue: 'bg-blue-50 border-blue-200', green: 'bg-green-50 border-green-200', red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200', teal: 'bg-teal-50 border-teal-200', orange: 'bg-orange-50 border-orange-200', violet: 'bg-violet-50 border-violet-200' }
  return (
    <div className={`rounded-2xl border ${c[color]} p-4`}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  )
}
function EX({ children, color = 'blue' }) {
  const c = { blue: 'bg-blue-100 text-blue-800', orange: 'bg-orange-100 text-orange-800', green: 'bg-green-100 text-green-800' }
  return <div className={`rounded-xl px-3 py-2 text-xs font-medium mt-2 ${c[color]}`}>📋 {children}</div>
}

// ─── Section Content (static educational content — kept inline intentionally) ─
// NOTE: The rich educational cards below contain structured data visuals
// (comparison grids, step charts, example calculations) that are tightly
// coupled to their layout. Extracting every string would require the i18n
// system to return complex nested JSX, which goes against the project's
// "no over-engineering" rule. Core UI chrome (headers, buttons, labels) is
// fully translated via t(). The educational body content remains in Hindi as
// the primary language for this audience and mirrors the existing pattern used
// in other hub screens.
const CONTENT = {
  seasonal: (
    <div className="space-y-3">
      <IC title="⚡ मूल समस्या" color="blue">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded-lg p-2 text-center"><p className="font-bold text-green-700">आय आती है</p><p className="text-gray-600">साल में 2-3 बार</p><p className="text-xs text-gray-400">(कटाई के समय)</p></div>
          <div className="bg-red-50 rounded-lg p-2 text-center"><p className="font-bold text-red-700">खर्च होता है</p><p className="text-gray-600">हर महीने</p><p className="text-xs text-gray-400">(राशन, दवा, पढ़ाई)</p></div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 mt-2 text-xs text-orange-700">
          ⚠️ यह अंतर ही Cash Stress, जल्दबाजी में बिक्री और महंगे कर्ज की असली वजह है
        </div>
      </IC>

      <IC title="📅 आय का सही बँटवारा करें" color="green">
        <p className="text-xs text-gray-600 mb-2">कटाई पर मिले ₹1,00,000 को ऐसे बाँटें:</p>
        {[
          { label: '✅ अगली फसल लागत', pct: '30%', amt: '₹30,000', color: 'bg-blue-50 text-blue-700' },
          { label: '🛡️ Emergency Fund', pct: '20%', amt: '₹20,000', color: 'bg-red-50 text-red-700' },
          { label: '📅 अगले 6 महीने खर्च', pct: '35%', amt: '₹35,000', color: 'bg-green-50 text-green-700' },
          { label: '📈 बचत / निवेश', pct: '15%', amt: '₹15,000', color: 'bg-purple-50 text-purple-700' },
        ].map(r => (
          <div key={r.label} className={`flex items-center justify-between rounded-lg px-3 py-2 mb-1 ${r.color}`}>
            <span className="text-xs font-medium">{r.label}</span>
            <span className="text-xs font-bold">{r.pct} = {r.amt}</span>
          </div>
        ))}
      </IC>

      <IC title="📊 मासिक खर्च का Budget बनाएं" color="teal">
        <p className="text-sm text-gray-700 leading-relaxed">कटाई से मिले पैसे को 6 बराबर हिस्सों में बाँटें और हर महीने उतना ही खर्च करें।</p>
        <EX color="green">₹60,000 रबी surplus → ₹10,000/माह × 6 = मार्च तक निश्चिंत</EX>
        <div className="bg-blue-50 rounded-xl p-3 mt-2 text-xs text-blue-700">
          💡 Simple तरीका: Post Office RD में 6 किस्त जमा करें, हर महीने एक निकालें
        </div>
      </IC>
    </div>
  ),

  emergency: (
    <div className="space-y-3">
      <IC title="🆘 Emergency Fund क्यों ज़रूरी?" color="red">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-50 rounded-lg p-2">
            <p className="font-bold text-red-700 mb-1">❌ बिना फंड</p>
            {['बीमारी → साहूकार', 'फसल खराब → कर्ज', 'मरम्मत → गहने गिरवी'].map(s => <p key={s} className="text-red-600">• {s}</p>)}
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="font-bold text-green-700 mb-1">✅ फंड के साथ</p>
            {['बीमारी → खुद चुकाएं', 'फसल खराब → झेल सकते', 'मरम्मत → तुरंत करें'].map(s => <p key={s} className="text-green-600">• {s}</p>)}
          </div>
        </div>
      </IC>

      <IC title="📐 सही लक्ष्य कैसे तय करें?" color="blue">
        <div className="bg-blue-100 rounded-lg px-3 py-2 text-xs font-semibold text-blue-800 mb-2">
          फॉर्मूला: (6 × घरेलू खर्च) + (3 × खेती खर्च)
        </div>
        <EX>घरेलू ₹8,000/माह + खेती ₹3,000/माह → लक्ष्य = ₹48,000 + ₹9,000 = <strong>₹57,000</strong></EX>
      </IC>

      <IC title="💡 धीरे-धीरे कैसे बनाएं?" color="green">
        <div className="space-y-1.5 text-xs">
          {[
            { step: 'Phase 1', goal: '1 महीने का buffer', time: '2-3 महीने में' },
            { step: 'Phase 2', goal: '3 महीने का buffer', time: '6-12 महीने में' },
            { step: 'Phase 3', goal: '6 महीने का buffer', time: '18-24 महीने में' },
          ].map(p => (
            <div key={p.step} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-semibold text-gray-700">{p.step}: {p.goal}</span>
              <span className="text-green-600">{p.time}</span>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 rounded-xl p-3 mt-2 text-xs text-amber-700">
          💰 Post Office RD, SBI Savings, Jan Dhan — आसानी से निकाल सकते हैं
        </div>
      </IC>
    </div>
  ),

  distress: (
    <div className="space-y-3">
      <IC title="❓ Distress Selling क्या है?" color="orange">
        <p className="text-sm text-gray-700 leading-relaxed">कटाई के तुरंत बाद — जब बाजार में supply सबसे ज्यादा और भाव सबसे कम होता है — सिर्फ cash की जरूरत के कारण जल्दबाजी में बेचना।</p>
        <div className="mt-2 space-y-1 text-xs">
          {['कटाई → बाजार में supply बढ़ी → भाव गिरे', 'Cash चाहिए → मजबूरी में बेचा', 'कुछ हफ्ते बाद भाव 20-30% ऊपर गया'].map(s => (
            <div key={s} className="bg-orange-50 rounded-lg px-3 py-1.5 text-orange-700">→ {s}</div>
          ))}
        </div>
      </IC>

      <IC title="📊 नुकसान का हिसाब" color="red">
        <p className="text-xs text-gray-500 mb-2">20 क्विंटल गेहूं, November में:</p>
        <div className="space-y-1.5 text-xs">
          {[
            { time: 'कटाई पर (नवंबर)', total: '₹36,000' },
            { time: 'जनवरी में', total: '₹42,000' },
            { time: 'नुकसान', total: '₹6,000 😥' },
          ].map(r => (
            <div key={r.time} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-600">{r.time}</span>
              <span className={`font-bold ${r.time === 'नुकसान' ? 'text-red-600' : 'text-gray-800'}`}>{r.total}</span>
            </div>
          ))}
        </div>
      </IC>

      <IC title="✅ बचने का नियम" color="green">
        <div className="space-y-2 text-sm text-gray-700">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="font-semibold text-green-700 mb-1">अगर Emergency Fund है:</p>
            <p className="text-xs">Cash की जरूरत Emergency Fund से पूरी करें → फसल रोकें → बेहतर भाव मिलने पर बेचें</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="font-semibold text-blue-700 mb-1">Storage + Warehouse Receipt:</p>
            <p className="text-xs">WDRA warehouse में रखें → NWR Loan लें → पैसे मिलें → बाद में अच्छे भाव पर बेचें</p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 mt-2">
          <p className="text-xs font-bold text-orange-800">📌 नियम: केवल cash की कमी के कारण कभी न बेचें। भाव देखकर बेचें।</p>
        </div>
      </IC>
    </div>
  ),

  separation: (
    <div className="space-y-3">
      <IC title="❌ मिलाने से क्या नुकसान?" color="red">
        <p className="text-sm text-gray-700 leading-relaxed mb-2">जब खेती और घर का पैसा एक ही जगह हो तो कोई clarity नहीं रहती।</p>
        <div className="space-y-1.5 text-xs">
          {[
            'फसल बेचकर मिले ₹80,000 → घरेलू खर्च में खर्च हो गए',
            'अगली फसल के लिए पैसा नहीं → साहूकार के पास गए',
            'खेती का असली मुनाफा पता ही नहीं चला',
          ].map(s => (
            <div key={s} className="bg-red-50 rounded-lg px-3 py-2 text-red-700">✗ {s}</div>
          ))}
        </div>
      </IC>

      <IC title="📒 सरल हिसाब का तरीका" color="teal">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="font-bold text-green-700 mb-2">🌾 खेती खाता</p>
            {['बीज, खाद, मजदूरी', 'सिंचाई, ढुलाई', 'कर्ज EMI', 'फसल बिक्री आय'].map(s => <p key={s} className="text-gray-600">• {s}</p>)}
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-bold text-blue-700 mb-2">🏠 घर खाता</p>
            {['राशन, बिजली', 'दवाई, पढ़ाई', 'त्योहार, कपड़े', 'किराया'].map(s => <p key={s} className="text-gray-600">• {s}</p>)}
          </div>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 mt-2 text-xs text-teal-700">
          💡 Simple तरीका: 2 अलग नोटबुक, या Jan Dhan + Basic Savings दो अलग accounts
        </div>
      </IC>

      <IC title="🎉 त्योहार budget कैसे तय करें?" color="amber">
        <p className="text-sm text-gray-700 leading-relaxed">त्योहार पर खर्च करने से पहले जाँचें:</p>
        <div className="space-y-1 text-xs mt-2">
          {[
            { check: 'Emergency Fund भरा है?', yes: 'तब खर्च करें', no: 'पहले fund भरें' },
            { check: 'Surplus महीना है?', yes: 'ठीक है', no: 'बजट कम रखें' },
            { check: 'EMI चुकानी बाकी है?', yes: 'पहले EMI', no: 'खर्च कर सकते हैं' },
          ].map(c => (
            <div key={c.check} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-amber-600 font-medium flex-shrink-0">→</span>
              <span className="text-gray-700">{c.check} <span className="text-green-600">✅ {c.yes}</span> / <span className="text-red-600">❌ {c.no}</span></span>
            </div>
          ))}
        </div>
      </IC>
    </div>
  ),

  working: (
    <div className="space-y-3">
      <IC title="💡 Working Capital क्या है?" color="violet">
        <p className="text-sm text-gray-700 leading-relaxed">बुआई से लेकर कटाई तक खेत चलाने के लिए जो पैसा चाहिए — यही Working Capital है।</p>
        <div className="bg-violet-50 rounded-xl p-3 mt-2 text-xs font-semibold text-violet-800">
          फॉर्मूला: Working Capital Gap = Pre-harvest expenses − Available savings
        </div>
        <EX color="blue">बुआई लागत ₹40,000, बचत ₹15,000 → Gap = ₹25,000 → यही loan लें, ज्यादा नहीं</EX>
      </IC>

      <IC title="📊 Gap के लिए क्या करें?" color="teal">
        <div className="space-y-2">
          {[
            { src: '✅ KCC (Kisan Credit Card)', rate: '4%/वर्ष', best: true, tip: 'सबसे बेहतर — सिर्फ use हुई रकम पर ब्याज' },
            { src: '🟡 Cooperative Society Loan', rate: '6-8%/वर्ष', best: false, tip: 'PACS सदस्य हों तो अच्छा विकल्प' },
            { src: '🟡 SHG/FPO Working Capital', rate: '7-10%/वर्ष', best: false, tip: 'महिला किसान/group के लिए' },
            { src: '🔴 साहूकार', rate: '36-72%/वर्ष', best: false, tip: 'कभी नहीं — 10× महंगा' },
          ].map(r => (
            <div key={r.src} className={`rounded-xl p-3 text-xs ${r.best ? 'bg-green-50 border border-green-200' : r.rate.includes('36') ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">{r.src}</span>
                <span className={`font-bold ${r.rate.includes('36') ? 'text-red-600' : r.best ? 'text-green-600' : 'text-gray-600'}`}>{r.rate}</span>
              </div>
              <p className="text-gray-500 mt-0.5">{r.tip}</p>
            </div>
          ))}
        </div>
      </IC>

      <IC title="🔄 Working Capital का चक्र" color="green">
        <div className="flex items-center gap-2 text-xs overflow-x-auto py-1">
          {['बुआई\n(कर्ज)', '→', 'खेत\n(जमा)', '→', 'कटाई\n(बिक्री)', '→', 'KCC\n(चुकाएं)', '→', 'अगला\nसीजन'].map((s, i) => (
            s === '→' ? <span key={i} className="text-gray-400 flex-shrink-0">›</span> :
            <div key={i} className="bg-green-50 rounded-lg p-2 text-center flex-shrink-0 min-w-12">
              <p className="text-green-700 font-semibold whitespace-pre-line leading-tight">{s}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 rounded-xl p-3 mt-2 text-xs text-blue-700">
          💡 KCC = रिवॉल्विंग credit — बार-बार उठाएं और चुकाएं, सिर्फ use पर ब्याज
        </div>
      </IC>
    </div>
  ),
}
