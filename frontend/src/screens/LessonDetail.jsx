import TopBar from '../components/TopBar'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { lessons } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

const CALC_ROUTES = {
  crop_profit: '/tools/crop-profit',
  loan_roi: '/tools/loan-roi',
  emi_safety: '/tools/emi-safety',
  storage: '/tools/storage',
  emergency_fund: '/tools/emergency-fund',
  break_even: '/tools/break-even',
}

export default function LessonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lessons.get(id).then(data => {
      if (data) setLesson(data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-4 space-y-4 pt-6">
      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!lesson) return (
    <div className="p-4 text-center text-gray-400 pt-12">
      <p>{t('lesson.not_found')}</p>
      <button onClick={() => navigate('/learn')} className="mt-4 text-green-600">{t('lesson.go_back')}</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <TopBar title={lesson.title_hindi} subtitle={lesson.title} backTo="/learn" light />
      <div className="p-4 space-y-4">

      {/* Key Points */}
      <Section title={t('lesson.key_points')}>
        <ul className="space-y-2">
          {lesson.key_points?.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Example */}
      {lesson.example && (
        <Section title={t('lesson.example')}>
          <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-xl p-3">
            {lesson.example}
          </p>
        </Section>
      )}

      {/* Simple Calculation */}
      {lesson.simple_calculation && (
        <Section title={t('lesson.simple_calc')}>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-sm text-green-300 font-mono leading-relaxed">
              {lesson.simple_calculation}
            </p>
          </div>
        </Section>
      )}

      {/* Common Mistakes */}
      {lesson.common_mistakes?.length > 0 && (
        <Section title={t('lesson.common_mistakes')}>
          <ul className="space-y-2">
            {lesson.common_mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-red-500">✗</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Try This */}
      {lesson.try_this && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">{t('lesson.try_this')}</p>
          <p className="text-sm text-green-700">{lesson.try_this}</p>
        </div>
      )}

      {/* Calculator CTA */}
      {lesson.related_calculator && CALC_ROUTES[lesson.related_calculator] && (
        <button
          onClick={() => navigate(CALC_ROUTES[lesson.related_calculator])}
          className="w-full bg-green-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          {t('lesson.open_calculator')}
        </button>
      )}
    </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
      <p className="font-semibold text-gray-700 text-sm">{title}</p>
      {children}
    </div>
  )
}
