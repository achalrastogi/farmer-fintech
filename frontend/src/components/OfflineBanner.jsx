import { useState, useEffect } from 'react'
import { offline } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); offline.sync() }
    const goOffline = () => { setIsOnline(false); setPendingCount(offline.pendingCount()) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  if (isOnline) return null
  return (
    <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm z-50">
      {t('offline.banner')} — {pendingCount > 0 ? t('offline.changes_saved').replace('{count}', pendingCount) : t('offline.cached_available')}
    </div>
  )
}
