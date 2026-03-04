// Central API client — all calls to FastAPI backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getToken = () => localStorage.getItem('fintech_token')
const setToken = (token) => localStorage.setItem('fintech_token', token)
const clearToken = () => {
  localStorage.removeItem('fintech_token')
  localStorage.removeItem('fintech_user')
}

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

async function request(method, path, body = null) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
      return
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
  } catch (e) {
    if (!navigator.onLine) {
      offline.queue({ method, path, body })
      return null
    }
    throw e
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  register: (payload) => request('POST', '/api/v1/auth/register', payload),
  loginWithIdentifier: (identifier, password) =>
    request('POST', '/api/v1/auth/login', { identifier, password }),
  me: () => request('GET', '/api/v1/auth/me'),
  setToken,
  getToken,
  clearToken,
  isLoggedIn: () => !!getToken(),
}

// ─── Home ─────────────────────────────────────────────────────────────────
export const home = {
  snapshot: () => request('GET', '/api/v1/home/snapshot'),
  updateProfile: (data) => request('PATCH', '/api/v1/home/profile', data),
}

// ─── Schemes ──────────────────────────────────────────────────────────────
export const schemes = {
  list: (params = {}) => {
    // Auto-inject lang from stored preference
    const lang = localStorage.getItem('fintech_lang') || 'hi'
    const allParams = { lang, ...params }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(allParams).filter(([, v]) => v))
    ).toString()
    return request('GET', `/api/v1/schemes/${qs ? '?' + qs : ''}`)
  },
  get: (id) => {
    const lang = localStorage.getItem('fintech_lang') || 'hi'
    return request('GET', `/api/v1/schemes/${id}?lang=${lang}`)
  },
  saved: () => {
    const lang = localStorage.getItem('fintech_lang') || 'hi'
    return request('GET', `/api/v1/schemes/saved?lang=${lang}`)
  },
  toggleSave: (id) => request('POST', `/api/v1/schemes/${id}/save`),
}

// ─── Lessons ──────────────────────────────────────────────────────────────
export const lessons = {
  categories: () => {
    const lang = localStorage.getItem('fintech_lang') || 'hi'
    return request('GET', `/api/v1/lessons/categories?lang=${lang}`)
  },
  get: (id) => {
    const lang = localStorage.getItem('fintech_lang') || 'hi'
    return request('GET', `/api/v1/lessons/${id}?lang=${lang}`)
  },
}

// ─── Education (Stories + Q&A) ────────────────────────────────────────────
export const education = {
  generateStory: (topic, language) =>
    request('POST', '/api/v1/education/story/generate', { topic, language }),
  askQuestion: (question, language, contextStoryId = null) =>
    request('POST', '/api/v1/education/ask', {
      question,
      language,
      context_story_id: contextStoryId,
    }),
  dashboard: () => request('GET', '/api/v1/education/dashboard'),
}

// ─── Practice ─────────────────────────────────────────────────────────────
export const practice = {
  getQuiz: (moduleId) => request('GET', `/api/v1/practice/quiz/${moduleId}`),
  submitQuiz: (moduleId, answers) =>
    request('POST', '/api/v1/practice/quiz/submit', {
      module_id: moduleId,
      answers,
    }),
  startGame: () => request('POST', '/api/v1/practice/game/start'),
  makeDecision: (sessionId, loanId) =>
    request('POST', '/api/v1/practice/game/decide', {
      session_id: sessionId,
      chosen_loan_id: loanId,
    }),
}

// ─── Offline queue ────────────────────────────────────────────────────────
const QUEUE_KEY = 'fintech_offline_queue'

export const offline = {
  queue(action) {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    q.push({ ...action, queued_at: Date.now() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
  },
  pendingCount() {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length
  },
  async sync() {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    if (!q.length) return
    const failed = []
    for (const action of q) {
      try {
        await request(action.method, action.path, action.body)
      } catch {
        failed.push(action)
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed))
  },
}


