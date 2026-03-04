import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'

const TABS = [
  { path: '/',        icon: '🏠', navKey: 'home'    },
  { path: '/tools',   icon: '🧮', navKey: 'tools'   },
  { path: '/learn',   icon: '📘', navKey: 'learn'   },
  { path: '/schemes', icon: '🏛',  navKey: 'schemes' },
  { path: '/profile', icon: '👤', navKey: 'profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-md mx-auto flex justify-around">
        {TABS.map(tab => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors
              ${isActive(tab.path)
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs mt-0.5 font-medium ${isActive(tab.path) ? 'text-green-600' : ''}`}>
              {t(`nav.${tab.navKey}`)}
            </span>
            {isActive(tab.path) && (
              <div className="w-1 h-1 bg-green-600 rounded-full mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
