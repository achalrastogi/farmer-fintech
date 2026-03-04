// ═══════════════════════════════════════════════════════════
//  Locale-aware formatting utilities
//  Reads user's language from localStorage, returns correct locale.
//  Works inside React components AND plain JS (no hooks needed).
// ═══════════════════════════════════════════════════════════

const LOCALE_MAP = {
  hi: 'hi-IN',
  en: 'en-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
}

/**
 * Get the current locale string (e.g. 'hi-IN', 'pa-IN').
 */
export function getLocale() {
  const lang = localStorage.getItem('fintech_lang') || 'hi'
  return LOCALE_MAP[lang] || 'hi-IN'
}

/**
 * Format a number with the user's locale.
 *   fmtNum(150000) → '1,50,000' (hi-IN) or '1,50,000' (pa-IN) etc.
 */
export function fmtNum(num) {
  if (num === null || num === undefined || isNaN(num)) return ''
  return Number(num).toLocaleString(getLocale())
}

/**
 * Format a date with the user's locale.
 *   fmtDate('2024-03-15') → '15 मार्च 2024' (hi-IN)
 *   fmtDate(new Date(), { month: 'short', year: 'numeric' })
 */
export function fmtDate(date, options) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(getLocale(), options)
}

/**
 * Format currency — shorthand for ₹ + formatted number.
 *   fmtRupee(50000) → '₹50,000'
 */
export function fmtRupee(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹0'
  return `₹${fmtNum(Math.round(Number(num)))}`
}
