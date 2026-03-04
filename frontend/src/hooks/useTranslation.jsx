// ═══════════════════════════════════════════════════════════
//  I18nContext + useTranslation hook
//  Provides t() function, lang, setLang, locale across app
// ═══════════════════════════════════════════════════════════
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { getBundle, getStoredLang, setStoredLang, getLocale, DEFAULT_LANG } from '../i18n'
import { getLocale as getLocaleStr } from '../lib/locale'

const I18nContext = createContext(null)

/**
 * Deep-get a nested key from an object using dot notation.
 * e.g. resolve(obj, 'auth.login') → obj.auth.login
 * Supports template variables: t('msg', { amount: 5000 }) replaces {amount}
 */
function resolve(obj, path, vars) {
  const val = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj)
  if (val === undefined) return undefined
  if (typeof val !== 'string' || !vars) return val
  // Replace {key} with vars
  return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`))
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang)

  const bundle = useMemo(() => getBundle(lang), [lang])
  const fallback = useMemo(() => (lang !== DEFAULT_LANG ? getBundle(DEFAULT_LANG) : null), [lang])
  const locale = useMemo(() => getLocale(lang), [lang])

  const setLang = useCallback((code) => {
    setStoredLang(code)
    setLangState(code)
  }, [])

  /**
   * t(key, vars?) — translate a key.
   * Falls back to Hindi if not found, then to the key itself.
   * 
   * Usage:
   *   t('auth.login')           → 'लॉगिन करें'
   *   t('auth.login_btn')       → 'लॉगिन →'
   *   t('msg', { amount: 500 }) → replaces {amount} with 500
   */
  const t = useCallback((key, vars) => {
    let val = resolve(bundle, key, vars)
    if (val !== undefined) return val
    // Fallback to Hindi
    if (fallback) {
      val = resolve(fallback, key, vars)
      if (val !== undefined) return val
    }
    // Return key as last resort
    return key
  }, [bundle, fallback])

  /**
   * Format a number using the current locale.
   */
  const formatNumber = useCallback((num) => {
    if (num === null || num === undefined) return ''
    return Number(num).toLocaleString(locale)
  }, [locale])

  /**
   * Format a date using the current locale.
   */
  const formatDate = useCallback((date, options) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(locale, options)
  }, [locale])

  const value = useMemo(() => ({
    t,
    lang,
    setLang,
    locale,
    formatNumber,
    formatDate,
    meta: bundle._meta,
  }), [t, lang, setLang, locale, formatNumber, formatDate, bundle])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Hook to access translations.
 * 
 * const { t, lang, setLang, locale, formatNumber, formatDate } = useTranslation()
 */
export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
