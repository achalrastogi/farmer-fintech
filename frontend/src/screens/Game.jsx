import { fmtNum } from '../lib/locale'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { practice } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

const LENDER_COLORS = {
  moneylender: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700' },
  govt_scheme: { bg: 'bg-green-50', border: 'border-green-400', badge: 'bg-green-100 text-green-700' },
  cooperative: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-700' },
  nbfc: { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-700' },
}

const RATING_CONFIG = {
  excellent: { emoji: '🌟', color: 'text-green-600', bg: 'bg-green-50' },
  good: { emoji: '👍', color: 'text-blue-600', bg: 'bg-blue-50' },
  poor: { emoji: '🤔', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  disaster: { emoji: '⚠️', color: 'text-red-600', bg: 'bg-red-50' },
}

export default function Game() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scenario, setScenario] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    practice.startGame()
      .then(setScenario)
      .finally(() => setLoading(false))
  }, [])

  async function submitDecision() {
    if (!selected) return
    setSubmitting(true)
    try {
      const result = await practice.decide(scenario.scenario_id, selected)
      setOutcome(result)
    } catch (e) {
      alert(t('game.error_msg'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-bounce">🎮</div>
        <p className="text-blue-700 mt-2">{t('game.loading')}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-blue-50 pb-8">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 pt-10 pb-5">
        <button onClick={() => navigate(-1)} className="text-2xl mb-2">←</button>
        <h1 className="text-xl font-bold">{t('game.title')}</h1>
        <p className="text-blue-200 text-sm mt-1">{t('game.subtitle')}</p>
      </div>

      {!outcome ? (
        // ── Scenario + Loan Options ───────────────────────────────────────────
        <div className="px-4 py-5">
          {/* Scenario description */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-gray-800 leading-relaxed">{scenario?.description}</p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">{t('game.crop_label')}</p>
                <p className="font-semibold text-green-700">{scenario?.crop}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">{t('game.amount_label')}</p>
                <p className="font-semibold text-green-700">₹{fmtNum(scenario?.loan_needed)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">{t('game.season_label')}</p>
                <p className="font-semibold text-green-700 text-xs">{scenario?.season}</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-600 mb-3">{t('game.choose_prompt')}</p>

          {/* Loan option cards */}
          <div className="space-y-3">
            {scenario?.loan_options?.map(opt => {
              const colors = LENDER_COLORS[opt.lender_type] || LENDER_COLORS.cooperative
              const isSelected = selected === opt.id

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                    ${colors.bg} ${isSelected ? `${colors.border} shadow-md scale-[1.01]` : 'border-transparent'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {opt.lender_type === 'govt_scheme' ? '🏛️ ' + t('game.lender_govt') :
                           opt.lender_type === 'moneylender' ? '⚠️ ' + t('game.lender_money') :
                           opt.lender_type === 'cooperative' ? '🤝 ' + t('game.lender_coop') : '🏢 ' + t('game.lender_nbfc')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800">{opt.lender}</h3>
                      <p className="text-lg font-bold text-green-700 mt-1">{opt.interest_display}</p>
                      <p className="text-xs text-gray-500 mt-1">{opt.notes}</p>
                    </div>
                    <div className="text-2xl ml-2">{isSelected ? '✅' : '⭕'}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={submitDecision}
            disabled={!selected || submitting}
            className="mt-5 w-full bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            {submitting ? t('game.submitting') : t('game.submit_btn')}
          </button>
        </div>

      ) : (
        // ── Outcome Screen ────────────────────────────────────────────────────
        <div className="px-4 py-5">
          {(() => {
            const cfg = RATING_CONFIG[outcome.outcome_rating] || RATING_CONFIG.good
            return (
              <>
                <div className={`rounded-2xl p-5 text-center mb-4 ${cfg.bg}`}>
                  <div className="text-5xl mb-2">{cfg.emoji}</div>
                  <p className={`text-xl font-bold ${cfg.color}`}>{outcome.outcome_message}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{outcome.score}/100</p>
                </div>

                {/* Financial breakdown */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
                  <h3 className="font-semibold text-gray-700">{t('game.your_choice')} {outcome.chosen_loan?.lender}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('game.interest_paid')}</p>
                      <p className="font-bold text-red-600">₹{fmtNum(outcome.total_interest_paid)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('game.total_repay')}</p>
                      <p className="font-bold text-gray-800">₹{fmtNum(outcome.total_repayment)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('game.per_month')}</p>
                      <p className="font-bold text-gray-800">₹{fmtNum(outcome.monthly_burden)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('game.score')}</p>
                      <p className={`font-bold ${cfg.color}`}>{outcome.score}/100</p>
                    </div>
                  </div>
                </div>

                {/* Comparison */}
                {outcome.comparison && (
                  <div className={`rounded-2xl p-4 mb-4 ${outcome.comparison.is_best ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="text-sm font-medium text-gray-700">{outcome.comparison.message}</p>
                    {!outcome.comparison.is_best && outcome.comparison.could_have_saved > 0 && (
                      <p className="text-green-700 font-bold mt-1">
                        💡 {outcome.comparison.best_option} {t('game.could_save')} ₹{fmtNum(outcome.comparison.could_have_saved)}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setOutcome(null); setSelected(null) }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
                  >
                    {t('game.play_again')}
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold"
                  >
                    {t('game.go_dashboard')}
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
