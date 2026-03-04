import { useNavigate } from 'react-router-dom'

export default function TopNav({ title, subtitle, backTo, rightAction, bgColor = 'bg-white' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={`${bgColor} border-b border-gray-100 sticky top-0 z-30`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="वापस जाएं"
        >
          <span className="text-gray-600 text-lg font-medium" style={{ lineHeight: 1 }}>‹</span>
        </button>

        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-base font-bold text-gray-800 leading-tight truncate">{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 leading-tight truncate">{subtitle}</p>
          )}
        </div>

        {rightAction && (
          <div className="flex-shrink-0">{rightAction}</div>
        )}
      </div>
    </div>
  )
}
