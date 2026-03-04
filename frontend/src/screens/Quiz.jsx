// Quiz.jsx
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { practice } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

export function Quiz() {
  const { t } = useTranslation()
  const { moduleId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    practice.getQuiz(moduleId).then(setQuestions).finally(() => setLoading(false))
  }, [moduleId])

  async function submit() {
    const res = await practice.submitQuiz(moduleId, answers)
    setResult(res)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>{t('quiz.loading')}</p></div>

  if (result) return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4">
      <div className={`text-center p-6 rounded-2xl w-full max-w-sm ${result.passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
        <div className="text-5xl mb-3">{result.passed ? '🎉' : '💪'}</div>
        <p className="text-xl font-bold">{result.score}%</p>
        <p className="text-gray-700 mt-2">{result.message}</p>
        <div className="mt-4 space-y-3 text-left">
          {result.feedback.map((f, i) => (
            <div key={i} className={`p-3 rounded-xl ${f.is_correct ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm font-medium">{f.is_correct ? '✅' : '❌'} {f.question}</p>
              {!f.is_correct && <p className="text-xs text-gray-600 mt-1">{f.explanation}</p>}
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} className="mt-5 w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
          {t('quiz.go_dashboard')}
        </button>
      </div>
    </div>
  )

  const answered = Object.keys(answers).length
  const total = questions.length

  return (
    <div className="min-h-screen bg-green-50 pb-8">
      <div className="bg-green-700 text-white px-4 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-2xl mb-1">←</button>
        <h1 className="text-xl font-bold">{t('quiz.title')} — {state?.moduleName}</h1>
        <p className="text-green-200 text-sm">{t('quiz.answers_given').replace('{answered}', answered).replace('{total}', total)}</p>
      </div>
      <div className="px-4 py-5 space-y-5">
        {questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-medium text-gray-800 mb-3">{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                  className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all
                    ${answers[q.id] === opt.id ? 'border-green-500 bg-green-50 font-medium' : 'border-gray-200'}`}
                >
                  {opt.id.toUpperCase()}. {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50"
        >
          {t('quiz.submit_btn')}
        </button>
      </div>
    </div>
  )
}

export default Quiz
