import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendations } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

export default function Recommendations() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const TYPE_CONFIG = {
    loan: { icon: '💰', label: t('recommendations.type_loan'), color: 'bg-blue-100 text-blue-700' },
    insurance: { icon: '🛡️', label: t('recommendations.type_insurance'), color: 'bg-purple-100 text-purple-700' },
    govt_scheme: { icon: '🏛️', label: t('recommendations.type_scheme'), color: 'bg-green-100 text-green-700' },
    savings: { icon: '🏦', label: t('recommendations.type_savings'), color: 'bg-yellow-100 text-yellow-700' },
  }

  useEffect(() => {
    recommendations.get().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>{t('recommendations.loading')}</p></div>

  return (
    <div className="min-h-screen bg-yellow-50 pb-8">
      <div className="bg-yellow-600 text-white px-4 pt-10 pb-5">
        <button onClick={() => navigate(-1)} className="text-2xl mb-1">←</button>
        <h1 className="text-xl font-bold">{t('recommendations.title')}</h1>
        <p className="text-yellow-200 text-sm">{t('recommendations.subtitle')}</p>
      </div>

      <div className="px-4 py-5">
        {!data?.ready ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-semibold text-gray-800">{t('recommendations.not_ready_title')}</p>
            <p className="text-gray-500 text-sm mt-2">{data?.message}</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-medium">
              {t('recommendations.continue_learning')}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">{data?.message}</p>
            <div className="space-y-3">
              {data?.recommendations?.map((rec, i) => {
                const cfg = TYPE_CONFIG[rec.product_type] || TYPE_CONFIG.loan
                const isOpen = expanded === i

                return (
                  <div key={rec.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full p-4 text-left flex items-start gap-3"
                    >
                      <div className="text-2xl">{cfg.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {rec.is_government_scheme && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {t('recommendations.govt_badge')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 mt-1">{rec.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{rec.provider}</p>
                        {rec.interest_rate && (
                          <p className="text-green-700 font-semibold text-sm mt-1">
                            {rec.interest_rate}{t('recommendations.interest_rate')}
                          </p>
                        )}
                      </div>
                      <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t pt-3 space-y-3">
                        <div className="bg-green-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">{t('recommendations.why_good')}</p>
                          <p className="text-sm text-gray-700">{rec.why_recommended}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">{t('recommendations.key_benefits')}</p>
                          {rec.key_benefits.map((b, bi) => (
                            <p key={bi} className="text-sm text-gray-700 flex gap-2">
                              <span>✓</span> {b}
                            </p>
                          ))}
                        </div>

                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">{t('recommendations.how_to_apply')}</p>
                          <p className="text-sm text-gray-700">{rec.how_to_apply}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">{t('recommendations.documents_needed')}</p>
                          {rec.documents_needed.map((d, di) => (
                            <p key={di} className="text-sm text-gray-600">• {d}</p>
                          ))}
                        </div>

                        <p className="text-xs text-gray-400 italic">{data?.disclaimer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
