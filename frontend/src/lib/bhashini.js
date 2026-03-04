// Bhashini API integration — Government of India's Indic language TTS/STT
// Docs: https://bhashini.gov.in/ulca/search-model

const BHASHINI_BASE = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'
const BHASHINI_API_KEY = import.meta.env.VITE_BHASHINI_KEY || ''

// Language code mapping: our lang codes → Bhashini's sourceLanguage codes
const LANG_MAP = {
  hi: 'hi', pa: 'pa', te: 'te', ta: 'ta', mr: 'mr', bn: 'bn', en: 'en'
}

// ─── Text to Speech ───────────────────────────────────────────────────────────
export async function textToSpeech(text, language = 'hi') {
  const sourceLang = LANG_MAP[language] || 'hi'

  try {
    const response = await fetch(BHASHINI_BASE, {
      method: 'POST',
      headers: {
        'Authorization': BHASHINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pipelineTasks: [{
          taskType: 'tts',
          config: {
            language: { sourceLanguage: sourceLang },
            gender: 'female',
            samplingRate: 8000,  // Low sample rate = smaller file for 2G
          }
        }],
        inputData: { input: [{ source: text }] }
      })
    })

    const data = await response.json()
    const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent

    if (audioContent) {
      // Convert base64 audio to blob URL
      const audioBlob = base64ToBlob(audioContent, 'audio/wav')
      return URL.createObjectURL(audioBlob)
    }
  } catch (e) {
    console.warn('Bhashini TTS failed, using browser TTS fallback:', e)
  }

  // Fallback: Web Speech API (English only, limited Indic support)
  return null
}

// ─── Speech to Text ───────────────────────────────────────────────────────────
export async function speechToText(audioBlob, language = 'hi') {
  const sourceLang = LANG_MAP[language] || 'hi'

  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob)

    const response = await fetch(BHASHINI_BASE, {
      method: 'POST',
      headers: {
        'Authorization': BHASHINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pipelineTasks: [{
          taskType: 'asr',
          config: {
            language: { sourceLanguage: sourceLang },
            audioFormat: 'wav',
            samplingRate: 16000,
          }
        }],
        inputData: {
          audio: [{ audioContent: base64Audio }]
        }
      })
    })

    const data = await response.json()
    return data?.pipelineResponse?.[0]?.output?.[0]?.source || ''
  } catch (e) {
    console.warn('Bhashini STT failed:', e)
    return ''
  }
}

// ─── Browser fallback TTS (when Bhashini key not available) ──────────────────
export function browserSpeak(text, language = 'hi') {
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = `${language}-IN`
  utterance.rate = 0.85  // Slightly slower for comprehension
  window.speechSynthesis.speak(utterance)

  return {
    stop: () => window.speechSynthesis.cancel(),
    pause: () => window.speechSynthesis.pause(),
    resume: () => window.speechSynthesis.resume(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType })
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}
