import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { education, offline } from '../lib/api'
import { textToSpeech, browserSpeak } from '../lib/bhashini'
import { useTranslation } from '../hooks/useTranslation'

export default function Story() {
  const { topic } = useParams()
  const { state: routeState } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const moduleId = routeState?.moduleId
  const moduleName = routeState?.moduleName

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [showAsk, setShowAsk] = useState(false)
  const audioRef = useRef(null)
  const ttsRef = useRef(null)

  const lang = localStorage.getItem('fintech_lang') || 'hi'

  useEffect(() => {
    education.generateStory(topic, lang)
      .then(data => {
        setStory(data)
        // Queue story_complete for offline sync
        if (!navigator.onLine) {
          offline.queue('story_complete', { module_id: moduleId, topic })
        }
      })
      .catch(() => {
        // Offline fallback — load from cache if available
        setStory({
          title: t('story.not_found'),
          content: t('offline.cached_available'),
          key_concepts: [],
        })
      })
      .finally(() => setLoading(false))
  }, [topic])

  async function togglePlay() {
    if (playing) {
      window.speechSynthesis?.cancel()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      setPlaying(false)
      return
    }

    setPlaying(true)
    const audioUrl = await textToSpeech(story.content, lang)
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.play()
      audio.onended = () => setPlaying(false)
    } else {
      ttsRef.current = browserSpeak(story.content, lang)
      setTimeout(() => setPlaying(false), story.content.length * 60)
    }
  }

  async function askQuestion() {
    if (!question.trim()) return
    setAskLoading(true)
    try {
      const res = await education.askQuestion(question, lang, story?.id)
      setAnswer(res.answer)
    } catch {
      setAnswer('माफ करें, अभी उत्तर देने में समस्या है।')
    } finally {
      setAskLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-spin">📖</div>
        <p className="text-amber-700 mt-2">{t('story.loading')}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <div className="bg-amber-600 text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <div>
          <p className="text-amber-200 text-xs">{moduleName}</p>
          <h1 className="font-bold text-lg leading-tight">{story?.title}</h1>
        </div>
      </div>

      {/* Play button */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b">
        <button
          onClick={togglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
            ${playing ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}
        >
          {playing ? '⏸ रोकें' : '🔊 सुनें'}
        </button>
        <span className="text-xs text-gray-500">कहानी को आवाज में सुनें</span>
      </div>

      {/* Story content */}
      <div className="px-4 py-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm leading-relaxed text-gray-800 text-base whitespace-pre-wrap">
          {story?.content}
        </div>

        {/* Key concepts */}
        {story?.key_concepts?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">📚 आज आपने सीखा:</p>
            <div className="flex flex-wrap gap-2">
              {story.key_concepts.map((c, i) => (
                <span key={i} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ask Question panel */}
      {showAsk && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-xl px-4 py-4">
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 p-3 border rounded-xl text-base"
              placeholder="सवाल पूछें..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askQuestion()}
            />
            <button
              onClick={askQuestion}
              disabled={askLoading}
              className="bg-green-600 text-white px-4 rounded-xl font-medium"
            >
              {askLoading ? '...' : 'पूछें'}
            </button>
          </div>
          {answer && (
            <div className="bg-green-50 rounded-xl p-3 text-sm text-gray-800">
              <p className="font-medium text-green-700 mb-1">AI का जवाब:</p>
              {answer}
              <p className="text-xs text-gray-400 mt-2">यह शैक्षणिक जानकारी है, वित्तीय सलाह नहीं।</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-3">
        <button
          onClick={() => setShowAsk(!showAsk)}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
        >
          ❓ सवाल पूछें
        </button>
        <button
          onClick={() => navigate(`/quiz/${moduleId}`, { state: { moduleName } })}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold"
        >
          Quiz दें →
        </button>
      </div>
    </div>
  )
}
