import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

/**
 * TopBar — back button + optional logout button on all authenticated screens.
 */
export default function TopBar({ title, subtitle, backTo, action, light = false, showLogout = false }) {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const { t } = useTranslation()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  function handleLogout() {
    auth.clearToken()
    navigate('/login')
  }

  return (
    <>
      {light ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 flex-shrink-0">
            <span className="text-lg font-bold">‹</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-base leading-tight truncate">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
          {showLogout && (
            <button onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1 text-xs text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
              🚪
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 pt-8 pb-3 bg-white">
          <button onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 flex-shrink-0"
            aria-label="Go back">
            <span className="text-xl font-semibold leading-none">‹</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
          {showLogout && (
            <button onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-xl hover:bg-gray-200 flex-shrink-0">
              <span>🚪</span>
              <span>{t('logout.btn')}</span>
            </button>
          )}
        </div>
      )}

      {/* Logout confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-gray-800">{t('logout.confirm_title')}</h2>
              <p className="text-sm text-gray-400 mt-1">{t('logout.confirm_msg')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm">
                {t('logout.stay')}
              </button>
              <button onClick={handleLogout}
                className="py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">
                {t('logout.yes_logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
