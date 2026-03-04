import TopBar from '../components/TopBar'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { lessons } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

const MODULE_INFO = {
  'Farm Profit & Cost Mastery':  { emoji: '💰', color: 'bg-green-500',  lessons: 15 },
  'Cash Flow & Stability':        { emoji: '💸', color: 'bg-blue-500',   lessons: 14, badge: 'Interactive Hub →' },
  'Loan & Credit Intelligence':   { emoji: '🏦', color: 'bg-purple-500', lessons: 16, badge: 'Interactive Hub →' },
  'Risk & Insurance':             { emoji: '🛡️', color: 'bg-red-500',    lessons: 14, badge: 'Interactive Hub →' },
  'Market & MSP Intelligence':    { emoji: '📈', color: 'bg-orange-500', lessons: 16, badge: 'Interactive Hub →' },
  'Government Schemes':           { emoji: '🏛️', color: 'bg-teal-500',   lessons: 25 },
  'Institutional Support':        { emoji: '🤝', color: 'bg-indigo-500', lessons: 12 },
  'Long-Term Wealth Planning':    { emoji: '🌱', color: 'bg-emerald-500',lessons: 10, badge: 'Interactive Hub →' },
}

export default function Learn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)   // category object when drilling in
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lessons.categories().then(data => {
      if (data) setCategories(data)
    }).finally(() => setLoading(false))
  }, [])

  if (selected) {
    return <LessonStack category={selected} onBack={() => setSelected(null)} />
  }

  const totalLessons = categories.reduce((s, c) => s + c.lessons.length, 0)

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <TopBar title={t('hubs.learn.title')} subtitle={t('hubs.learn.subtitle')} backTo="/" showLogout />
      <div className="p-4 space-y-4">
      <div className="pt-0">
        <h1 className="text-xl font-bold text-gray-800 hidden">📘 वित्तीय शिक्षा</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalLessons} पाठ • 8 मॉड्यूल • 3-5 मिनट प्रति पाठ
        </p>
      </div>

      {/* Progress banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <p className="text-sm font-semibold">🎯 अपनी गति से सीखें</p>
        <p className="text-xs opacity-90 mt-1">
          कोई भी मॉड्यूल चुनें → पाठ की सूची देखें → पढ़ें और समझें
        </p>
      </div>

      {/* Module cards grid */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => {
            const info = MODULE_INFO[cat.name] || { emoji: '📖', color: 'bg-gray-500', lessons: cat.lessons.length }
            return (
              <button
                key={cat.id}
                onClick={() => setSelected(cat)}
                className="w-full bg-white rounded-2xl shadow-sm overflow-hidden flex active:scale-98 transition-transform"
              >
                {/* Color stripe */}
                <div className={`${info.color} w-2 flex-shrink-0`} />
                {/* Content */}
                <div className="flex items-center gap-4 p-4 flex-1">
                  <div className={`${info.color} bg-opacity-10 rounded-xl p-3 flex-shrink-0`}>
                    <span className="text-2xl">{info.emoji}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800 text-sm leading-tight">
                      Module {idx + 1}
                    </p>
                    <p className="text-sm text-gray-600">{cat.name_hindi}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.name}</p>
                    {info.badge && (
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        ✨ {info.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-700">{cat.lessons.length}</p>
                    <p className="text-xs text-gray-400">पाठ</p>
                  </div>
                  <span className="text-gray-300 text-xl ml-1">›</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="bg-gray-100 rounded-xl p-3 text-center">
        <p className="text-xs text-gray-500">
          📚 {totalLessons} पाठ • Farm Financial Empowerment Workbook पर आधारित
        </p>
      </div>
    </div>
  </div>
  )
}

// ─── Lesson Stack View ────────────────────────────────────────────────────────
function LessonStack({ category, onBack }) {
  const navigate = useNavigate()
  const info = MODULE_INFO[category.name] || { emoji: '📖', color: 'bg-gray-500' }
  const [search, setSearch] = useState('')

  const filtered = category.lessons.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.title_hindi.includes(search)
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className={`${info.color} text-white p-4 pt-6`}>
        <button onClick={onBack} className="flex items-center gap-2 text-white opacity-80 mb-3">
          <span className="text-xl">‹</span>
          <span className="text-sm">सभी मॉड्यूल</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{info.emoji}</span>
          <div>
            <h1 className="text-lg font-bold">{category.name_hindi}</h1>
            <p className="text-xs opacity-80">{category.name} • {category.lessons.length} पाठ</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 bg-gray-50"
            placeholder="पाठ खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lesson cards — the "stack" */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {filtered.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            number={idx + 1}
            moduleColor={info.color}
            onClick={() => navigate(`/learn/lesson/${lesson.id}`)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>कोई पाठ नहीं मिला</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Individual Lesson Card ───────────────────────────────────────────────────
function LessonCard({ lesson, number, moduleColor, onClick }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50"
      >
        {/* Number badge */}
        <div className={`${moduleColor} text-white rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs font-bold">{number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm leading-tight">{lesson.title_hindi}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{lesson.title}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {lesson.related_calculator && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🧮</span>
          )}
          <span className={`text-gray-300 text-lg transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>›</span>
        </div>
      </button>

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Key takeaway */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">🔑 मुख्य बातें</p>
            <ul className="space-y-1">
              {lesson.key_points?.slice(0, 3).map((pt, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span>{pt}</span>
                </li>
              ))}
              {(lesson.key_points?.length || 0) > 3 && (
                <li className="text-xs text-gray-400">+ {lesson.key_points.length - 3} और बातें...</li>
              )}
            </ul>
          </div>

          {/* Open full lesson button */}
          <button
            onClick={onClick}
            className={`w-full ${moduleColor} text-white py-2.5 rounded-xl text-sm font-semibold`}
          >
            पूरा पाठ पढ़ें →
          </button>
        </div>
      )}
    </div>
  )
}
