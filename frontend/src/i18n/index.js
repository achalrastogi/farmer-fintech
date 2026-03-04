// ═══════════════════════════════════════════════════════════
//  i18n Registry — language loader + metadata
// ═══════════════════════════════════════════════════════════
import hi from './hi'
import en from './en'
import pa from './pa'
import mr from './mr'

// All supported languages (order = display order)
export const LANGUAGES = [
  { code: 'hi', label: 'हिंदी',   labelEn: 'Hindi',   script: 'Devanagari' },
  { code: 'en', label: 'English', labelEn: 'English', script: 'Latin'      },
  { code: 'pa', label: 'ਪੰਜਾਬੀ',  labelEn: 'Punjabi', script: 'Gurmukhi'   },
  { code: 'mr', label: 'मराठी',   labelEn: 'Marathi', script: 'Devanagari' },
]

// Translation bundles
const BUNDLES = { hi, en, pa, mr }

// Default fallback
export const DEFAULT_LANG = 'hi'

/**
 * Get translation bundle for a language code.
 * Falls back to Hindi if language not found.
 */
export function getBundle(langCode) {
  return BUNDLES[langCode] || BUNDLES[DEFAULT_LANG]
}

/**
 * Get the user's preferred language from localStorage.
 */
export function getStoredLang() {
  return localStorage.getItem('fintech_lang') || DEFAULT_LANG
}

/**
 * Store the user's preferred language.
 */
export function setStoredLang(code) {
  localStorage.setItem('fintech_lang', code)
}

/**
 * Get the locale string for number/date formatting.
 * e.g. 'hi-IN', 'en-IN', 'pa-IN', 'mr-IN'
 */
export function getLocale(langCode) {
  const bundle = getBundle(langCode)
  return bundle._meta?.locale || 'hi-IN'
}
