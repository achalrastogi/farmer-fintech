import { fmtDate } from '../lib/locale'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { schemes } from '../lib/api'
import TopBar from '../components/TopBar'

// ─── Layer 1 Categories ───────────────────────────────────────────────────────
const SCHEME_CATEGORIES = [
  {
    id: 'income_support',
    icon: '💰',
    label: 'आय सहायता',
    sub: 'Income Support',
    desc: 'PM-Kisan, MGNREGA, DBT transfers',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    id: 'insurance',
    icon: '🌾',
    label: 'फसल और पशु बीमा',
    sub: 'Crop & Livestock Insurance',
    desc: 'PMFBY, WBCIS, पशु बीमा',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    id: 'subsidy',
    icon: '🚜',
    label: 'सब्सिडी',
    sub: 'Irrigation, Machinery, Solar',
    desc: 'PMKSY, SMAM, PM-KUSUM',
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    id: 'credit',
    icon: '🏦',
    label: 'ऋण और क्रेडिट',
    sub: 'Credit & Loan Schemes',
    desc: 'KCC, NABARD, SHG लिंकेज',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'allied',
    icon: '🐄',
    label: 'सहायक गतिविधियां',
    sub: 'Dairy, Fisheries, Processing',
    desc: 'NLM, PMMSY, खाद्य प्रसंस्करण',
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    id: 'pension',
    icon: '👵',
    label: 'पेंशन और परिवार',
    sub: 'Pension & Family Welfare',
    desc: 'PMKMY, PMJJBY, Ayushman',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
]

// Map UI categories to DB categories
const CAT_MAP = {
  income_support: ['income_support'],
  insurance: ['insurance'],
  subsidy: ['subsidy', 'infrastructure'],
  credit: ['credit'],
  allied: ['subsidy'],   // uses subsidy DB category, filtered by ALLIED_KEYWORDS
  pension: ['pension'],
}

// Keywords to filter allied schemes from subsidy bucket
const ALLIED_KEYWORDS = ['dairy', 'fisheries', 'matsya', 'pmmsy', 'pmfme', 'nlm', 
  'livestock', 'processing', 'poultry', 'goat', 'mts', 'पशु', 'मत्स्य', 'खाद्य प्रसंस्करण',
  'डेयरी', 'पोल्ट्री']
const SUBSIDY_EXCLUDE_ALLIED = ['pmksy', 'smam', 'kusum', 'solar', 'drip', 'sprinkler',
  'machinery', 'mechaniz', 'nhm', 'horticulture', 'सिंचाई', 'यंत्र', 'सोलर', 'बागवानी']

const STATES = ['','Andhra Pradesh','Bihar','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal']
const FARMER_TYPES = [
  { value: '', label: 'सभी किसान' },
  { value: 'small', label: 'छोटे किसान (2 एकड़ से कम)' },
  { value: 'marginal', label: 'सीमांत किसान (1 एकड़ से कम)' },
]
const CROP_TYPES = [
  { value: '', label: 'सभी फसलें' },
  { value: 'wheat', label: '🌾 गेहूं' },
  { value: 'rice', label: '🌾 धान' },
  { value: 'cotton', label: '🌿 कपास' },
  { value: 'other', label: '🌱 अन्य' },
]

function eligibilityTag(scheme, userProfile) {
  // Quick eligibility check based on profile
  if (!userProfile?.state && !userProfile?.farm_size_acres) return { label: 'जाँचें', color: 'bg-gray-100 text-gray-600' }
  
  const stateMatch = !scheme.applicable_states?.length || 
    (userProfile?.state && scheme.applicable_states.includes(userProfile.state))
  const cropMatch = !scheme.applicable_crops?.length ||
    (userProfile?.crop_type && scheme.applicable_crops.includes(userProfile.crop_type))
  
  if (stateMatch && cropMatch) return { label: '✓ पात्र हो सकते हैं', color: 'bg-green-100 text-green-700' }
  if (stateMatch || cropMatch) return { label: '〜 संभवतः', color: 'bg-yellow-100 text-yellow-700' }
  return { label: '? जाँचें', color: 'bg-gray-100 text-gray-600' }
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Schemes() {
  const navigate = useNavigate()
  const location = useLocation()
  const [layer, setLayer] = useState(1)  // 1 = categories, 2 = filtered list
  const [selectedCat, setSelectedCat] = useState(null)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterCrop, setFilterCrop] = useState('')
  const [filterFarmer, setFilterFarmer] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [tab, setTab] = useState('all')

  const profile = JSON.parse(localStorage.getItem('fintech_profile') || '{}')

  // Check if AI mode was requested via URL
  useEffect(() => {
    if (location.search.includes('ai=1')) setShowAI(true)
  }, [location.search])

  const openCategory = useCallback(async (cat) => {
    setSelectedCat(cat)
    setLayer(2)
    setSearch('')
    setLoading(true)
    try {
      // Map to DB category
      const dbCats = CAT_MAP[cat.id] || [cat.id]
      const allResults = await Promise.all(
        dbCats.map(c => schemes.list({ category: c, state: filterState || profile?.state }))
      )
      let merged = allResults.flatMap(r => r?.schemes || [])
      // For allied category: show only dairy/fisheries/processing schemes
      if (cat.id === 'allied') {
        merged = merged.filter(s => {
          const text = `${s.name} ${s.name_hindi} ${s.description}`.toLowerCase()
          return ALLIED_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))
        })
      }
      // For subsidy category: exclude allied activities
      if (cat.id === 'subsidy') {
        merged = merged.filter(s => {
          const text = `${s.name} ${s.name_hindi} ${s.description}`.toLowerCase()
          return !ALLIED_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))
        })
      }
      // Deduplicate by id
      const seen = new Set()
      const unique = merged.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true })
      setList(unique)
    } finally {
      setLoading(false)
    }
  }, [filterState, profile?.state])

  const handleSearch = useCallback(async () => {
    if (!selectedCat) return
    setLoading(true)
    try {
      const dbCats = CAT_MAP[selectedCat.id] || [selectedCat.id]
      const allResults = await Promise.all(
        dbCats.map(c => schemes.list({
          category: c,
          search: search || undefined,
          state: filterState || undefined,
          crop: filterCrop || undefined,
        }))
      )
      const merged = allResults.flatMap(r => r?.schemes || [])
      const seen = new Set()
      setList(merged.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true }))
    } finally {
      setLoading(false)
    }
  }, [selectedCat, search, filterState, filterCrop])

  useEffect(() => {
    if (layer === 2 && selectedCat) handleSearch()
  }, [search, filterState, filterCrop])

  if (showAI) return <GlobalAISearch onClose={() => setShowAI(false)} />
  if (layer === 2 && selectedCat) {
    return (
      <SchemeList
        category={selectedCat}
        list={list}
        loading={loading}
        search={search}
        onSearch={setSearch}
        filterState={filterState}
        onFilterState={setFilterState}
        filterCrop={filterCrop}
        onFilterCrop={setFilterCrop}
        filterFarmer={filterFarmer}
        onFilterFarmer={setFilterFarmer}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(f => !f)}
        profile={profile}
        onSchemeClick={id => navigate(`/schemes/${id}`)}
        onBack={() => { setLayer(1); setSelectedCat(null) }}
      />
    )
  }

  // ── LAYER 1: Category grid ──
  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <TopBar title="सरकारी योजनाएं" subtitle="Government Schemes" backTo="/" showLogout />

      <div className="p-4 space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-4 text-white">
          <p className="font-bold text-base">🏛️ योजना खोजें</p>
          <p className="text-xs opacity-90 mt-1">श्रेणी चुनें → योजना देखें → पात्रता जाँचें → AI से पूछें</p>
        </div>

        {/* AI Assistant button */}
        <button
          onClick={() => setShowAI(true)}
          className="w-full flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-2xl p-4 active:scale-98 transition-transform"
        >
          <span className="text-2xl">🤖</span>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm">AI वित्तीय सहायक से पूछें</p>
            <p className="text-xs opacity-80">"UP में सोलर पंप सब्सिडी कौन सी है?" जैसे सवाल</p>
          </div>
          <span className="text-white/70 text-xl">›</span>
        </button>

        {/* 6 Category cards */}
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">श्रेणी चुनें</p>
        <div className="grid grid-cols-2 gap-3">
          {SCHEME_CATEGORIES.map(cat => (
            <CategoryCard key={cat.id} cat={cat} onClick={() => openCategory(cat)} />
          ))}
        </div>

        {/* Trust architecture */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600">🛡️ विश्वसनीयता का आश्वासन</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['✅', 'सत्यापित स्रोत', 'आधिकारिक सरकारी पोर्टल'],
              ['📅', 'नियमित अपडेट', 'जनवरी 2026'],
              ['🔒', 'कोई शुल्क नहीं', 'सभी जानकारी मुफ्त'],
              ['📞', 'हेल्पलाइन', 'किसान कॉल: 1800-180-1551'],
            ].map(([icon, t, s]) => (
              <div key={t} className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-base">{icon}</p>
                <p className="text-xs font-medium text-gray-700 mt-1">{t}</p>
                <p className="text-xs text-gray-400">{s}</p>
              </div>
            ))}
          </div>
          <button className="w-full text-xs text-red-500 mt-1">🚩 गलत जानकारी रिपोर्ट करें</button>
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ cat, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`${cat.bg} border ${cat.border} rounded-2xl p-4 text-left transition-all duration-150 ${pressed ? 'scale-95' : 'hover:shadow-md'}`}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} mb-2 shadow-sm`}>
        <span className="text-2xl">{cat.icon}</span>
      </div>
      <p className="font-bold text-gray-800 text-sm leading-tight">{cat.label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{cat.sub}</p>
      <p className="text-xs text-gray-400 mt-1 leading-tight">{cat.desc}</p>
    </button>
  )
}

// ─── LAYER 2: Filtered Scheme List ────────────────────────────────────────────
function SchemeList({ category, list, loading, search, onSearch, filterState, onFilterState,
  filterCrop, onFilterCrop, filterFarmer, onFilterFarmer, showFilters, onToggleFilters,
  profile, onSchemeClick, onBack }) {

  const formatDate = (d) => {
    try { return fmtDate(d, { month: 'short', year: 'numeric' }) }
    catch { return '' }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Header with back to categories */}
      <div className={`bg-gradient-to-br ${category.color} text-white px-4 pt-10 pb-4`}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/80 text-sm mb-2">
          <span className="text-lg">‹</span> सभी श्रेणियां
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h1 className="font-bold text-lg">{category.label}</h1>
            <p className="text-xs opacity-80">{category.sub} • {list.length} योजनाएं</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-green-400"
              placeholder="योजना खोजें..."
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
          <button
            onClick={onToggleFilters}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-1 ${showFilters ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            ⚙️ फ़िल्टर
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">फ़िल्टर करें:</p>
            <div className="grid grid-cols-2 gap-2">
              <select value={filterState} onChange={e => onFilterState(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs bg-white outline-none">
                <option value="">सभी राज्य</option>
                {STATES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterCrop} onChange={e => onFilterCrop(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs bg-white outline-none">
                {CROP_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={filterFarmer} onChange={e => onFilterFarmer(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl text-xs bg-white outline-none col-span-2">
                {FARMER_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 pt-3 space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p>इस श्रेणी में कोई योजना नहीं मिली</p>
            <p className="text-xs mt-1">खोज या फ़िल्टर बदलकर देखें</p>
          </div>
        ) : list.map(s => {
          const tag = eligibilityTag(s, profile)
          return (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{s.name_hindi}</p>
                  <p className="text-xs text-gray-400">{s.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${tag.color}`}>
                  {tag.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                  {s.benefit_amount}
                </span>
                {s.scheme_type === 'central' && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">केंद्रीय</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  अपडेट: {formatDate(s.last_updated)}
                </p>
                <button
                  onClick={() => onSchemeClick(s.id)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r ${category.color} text-white active:scale-95 transition-transform`}
                >
                  विवरण देखें →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── GLOBAL AI SEARCH ────────────────────────────────────────────────────────
function GlobalAISearch({ onClose }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'नमस्ते! मैं आपका वित्तीय सहायक हूं। आप मुझसे सरकारी योजनाओं, सब्सिडी, बीमा या कृषि वित्त के बारे में पूछ सकते हैं।\n\n🔍 उदाहरण:\n• "UP में सोलर पंप सब्सिडी कौन सी है?"\n• "2 एकड़ जमीन के लिए कौन सी योजनाएं हैं?"\n• "फसल बीमा क्लेम क्यों रुकता है?"' }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)
  const profile = JSON.parse(localStorage.getItem('fintech_profile') || '{}')

  const QUICK_PROMPTS = [
    'PM-Kisan किसत क्यों रुकी?',
    'कौन सी सब्सिडी मिल सकती है?',
    'KCC कैसे बनवाएं?',
    'PMFBY क्लेम कैसे करें?',
  ]

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    const q = text || query.trim()
    if (!q || loading) return
    setQuery('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    try {
      const token = localStorage.getItem('fintech_token')
      const res = await fetch('/api/v1/schemes/global-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          question: q,
          user_state: profile?.state || null,
          user_acres: profile?.farm_size_acres || null,
        })
      })
      const data = await res.json()
      const answer = data?.answer || 'माफ करें, अभी उत्तर देने में समस्या है।'
      // If schemes were found, show them as quick links
      const relatedSchemes = data?.schemes || []
      setMessages(m => [...m, { role: 'ai', text: answer, schemes: relatedSchemes }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'नेटवर्क समस्या। कृपया दोबारा प्रयास करें।' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-4 pt-10 pb-4">
        <button onClick={onClose} className="flex items-center gap-1 text-white/80 text-sm mb-2">
          <span className="text-lg">‹</span> योजनाएं
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="font-bold text-base">AI वित्तीय सहायक</h1>
            <p className="text-xs opacity-80">सरकारी योजनाओं के बारे में पूछें</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
        <p className="text-xs text-amber-700">⚠️ AI जानकारी शैक्षणिक है। अंतिम निर्णय के लिए आधिकारिक पोर्टल देखें।</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-teal-600 text-white rounded-tr-none'
                : 'bg-white text-gray-800 shadow-sm rounded-tl-none border border-gray-100'
            }`}>
              {m.role === 'ai' && <span className="text-xs text-gray-400 block mb-1">🤖 AI</span>}
              {m.text}
            </div>
            {m.schemes?.length > 0 && (
              <div className="mt-1.5 flex gap-1.5 flex-wrap max-w-xs">
                {m.schemes.map(s => (
                  <button key={s.id} onClick={() => { onClose(); setTimeout(() => window.location.href = `/schemes/${s.id}`, 100) }}
                    className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-2 py-1 rounded-full">
                    📋 {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 active:bg-gray-100">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-1">
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-teal-400"
            placeholder="यहाँ सवाल टाइप करें..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={() => sendMessage()}
            disabled={loading || !query.trim()}
            className="w-11 h-11 bg-teal-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">↑</span>
          </button>
        </div>
      </div>
    </div>
  )
}
