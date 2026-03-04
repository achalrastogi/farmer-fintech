import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { CalcButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

// District average costs per acre (₹) based on national averages
const BENCHMARKS = {
  fertilizer: { avg: 3200, label: 'खाद / उर्वरक', icon: '🧪', unit: '₹/एकड़' },
  diesel:     { avg: 2800, label: 'डीज़ल / ऊर्जा',  icon: '⛽', unit: '₹/एकड़' },
  labour:     { avg: 4500, label: 'मजदूरी',         icon: '👷', unit: '₹/एकड़' },
  transport:  { avg: 1200, label: 'ढुलाई / परिवहन', icon: '🚛', unit: '₹/एकड़' },
  seeds:      { avg: 1800, label: 'बीज',            icon: '🌱', unit: '₹/एकड़' },
  pesticide:  { avg: 1500, label: 'कीटनाशक',        icon: '🧴', unit: '₹/एकड़' },
  irrigation: { avg: 2000, label: 'सिंचाई',          icon: '💧', unit: '₹/एकड़' },
}

const THRESHOLD = 0.15  // 15% above average = red flag

export default function CostLeakage() {
  const { t } = useTranslation()
  const [costs, setCosts] = useState({})
  const [selected, setSelected] = useState(
    Object.fromEntries(Object.keys(BENCHMARKS).map(k => [k, false]))
  )
  const [result, setResult] = useState(null)

  const toggleCat = (k) => {
    setSelected(prev => ({ ...prev, [k]: !prev[k] }))
    if (selected[k]) setCosts(prev => { const n = {...prev}; delete n[k]; return n })
    setResult(null)
  }

  const setCost = (k, v) => { setCosts(prev => ({ ...prev, [k]: v })); setResult(null) }

  const selectedKeys = Object.keys(selected).filter(k => selected[k])
  const canCalc = selectedKeys.length > 0 && selectedKeys.every(k => costs[k])

  function calculate() {
    const items = selectedKeys.map(k => {
      const userCost = Number(costs[k])
      const avg = BENCHMARKS[k].avg
      const diff = userCost - avg
      const diffPct = (diff / avg) * 100
      const status = diffPct > THRESHOLD * 100 ? 'red' : diffPct < -THRESHOLD * 100 ? 'green' : 'yellow'
      const potentialSaving = status === 'red' ? diff : 0
      return { key: k, userCost, avg, diff, diffPct, status, potentialSaving, ...BENCHMARKS[k] }
    })
    const totalLoss = items.reduce((s, i) => s + i.potentialSaving, 0)
    const leaks = items.filter(i => i.status === 'red').length
    setResult({ items, totalLoss, leaks })
  }

  return (
    <CalcShell
      title={t('calc.cost_leakage.title')}
      subtitle={t('calc.cost_leakage.subtitle')}
      icon="🔍"
      color="from-rose-600 to-pink-700"
      description={t('calc.cost_leakage.description')}
    >
      {/* Step 1: Select categories */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">📋 Step 1: लागत श्रेणी चुनें</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(BENCHMARKS).map(([k, b]) => (
            <button key={k} onClick={() => toggleCat(k)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                selected[k] ? 'border-rose-400 bg-rose-50' : 'border-gray-100 bg-gray-50'
              }`}>
              <span className="text-xl">{b.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{b.label}</p>
                <p className="text-xs text-gray-400">औसत: ₹{fmtNum(b.avg)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Enter costs */}
      {selectedKeys.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-700">📥 Step 2: आपकी लागत डालें (₹/एकड़)</p>
          {selectedKeys.map(k => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-xl w-8 flex-shrink-0">{BENCHMARKS[k].icon}</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-0.5">{BENCHMARKS[k].label}</label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 focus-within:border-rose-400 overflow-hidden">
                  <span className="px-2.5 text-sm text-gray-400">₹</span>
                  <input
                    type="number" inputMode="decimal"
                    placeholder={`औसत: ${BENCHMARKS[k].avg}`}
                    value={costs[k] || ''}
                    onChange={e => setCost(k, e.target.value)}
                    className="flex-1 py-2.5 pr-3 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CalcButton onClick={calculate} disabled={!canCalc} label="रिसाव जाँचें →" />

      {result && (
        <div className="space-y-3">
          {/* Summary */}
          {result.leaks > 0 ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-base font-bold text-red-700">⚠️ {result.leaks} {t('calc.cost_leakage.highest_cost')}</p>
              <p className="text-sm text-red-600 mt-1">
                {t('calc.cost_leakage.total_cost')}: <strong>₹{fmtNum(Math.round(result.totalLoss))}/एकड़</strong>
              </p>
              <p className="text-xs text-red-500 mt-1">इसे ठीक करने पर प्रति एकड़ यह बचत हो सकती है।</p>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
              <p className="text-base font-bold text-green-700">✅ कोई बड़ा रिसाव नहीं!</p>
              <p className="text-sm text-green-600 mt-1">आपकी लागत जिला औसत के करीब है।</p>
            </div>
          )}

          {/* Item-by-item breakdown */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-2">
              <span className="col-span-2">लागत</span>
              <span className="text-right">आपकी</span>
              <span className="text-right">औसत</span>
            </div>
            {result.items.map(item => (
              <div key={item.key} className={`grid grid-cols-4 px-4 py-3 border-b border-gray-50 last:border-0 ${
                item.status === 'red' ? 'bg-red-50' : item.status === 'green' ? 'bg-green-50' : ''
              }`}>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className={`text-xs font-medium ${
                      item.status === 'red' ? 'text-red-600' : item.status === 'green' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {item.status === 'red' ? `+${item.diffPct.toFixed(0)}% अधिक` :
                       item.status === 'green' ? `${item.diffPct.toFixed(0)}% कम 👍` : '±15% सामान्य'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold text-right self-center ${
                  item.status === 'red' ? 'text-red-600' : 'text-gray-800'
                }`}>₹{fmtNum(item.userCost)}</span>
                <span className="text-xs text-gray-400 text-right self-center">₹{fmtNum(item.avg)}</span>
              </div>
            ))}
          </div>

          {/* Visual bars */}
          {result.items.filter(i => i.status === 'red').length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">🔴 रिसाव वाली लागतें</p>
              {result.items.filter(i => i.status === 'red').map(item => (
                <div key={item.key} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{item.icon} {item.label}</span>
                    <span className="text-red-600 font-semibold">₹{fmtNum(item.potentialSaving)} अतिरिक्त</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
                    {/* Average line */}
                    <div className="absolute h-full bg-green-300 rounded-full" style={{ width: `${(item.avg / item.userCost) * 100}%` }} />
                    <div className="absolute h-full bg-red-300 rounded-full" style={{ left: `${(item.avg / item.userCost) * 100}%`, right: 0 }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-green-600" style={{ left: `${(item.avg / item.userCost) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>₹0</span>
                    <span className="text-green-600">औसत ₹{fmtNum(item.avg)}</span>
                    <span className="text-red-600">आपकी ₹{fmtNum(item.userCost)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Improvement tips */}
          {result.items.filter(i => i.status === 'red').map(item => (
            <div key={item.key} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-orange-800 mb-1">{item.icon} {item.label} सुधारें:</p>
              <p className="text-xs text-orange-700">{getTip(item.key)}</p>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            📌 <strong>नोट:</strong> जिला औसत राष्ट्रीय कृषि आंकड़ों पर आधारित हैं। स्थानीय KVK से सटीक औसत जानें।
          </div>
        </div>
      )}
    </CalcShell>
  )
}

function getTip(key) {
  const tips = {
    fertilizer: 'मृदा परीक्षण (Soil Testing) कराएं — KVK में मुफ्त। सही मात्रा में खाद डालें, ज्यादा नहीं। नीम-कोटेड यूरिया इस्तेमाल करें।',
    diesel:     'ड्रिप/स्प्रिंकलर से सिंचाई 40% डीज़ल बचाती है। PM-KUSUM सोलर पंप पर 60% सब्सिडी मिलती है।',
    labour:     'मशीनीकरण अपनाएं — SMAM योजना से 40% सब्सिडी। FPO बनाकर साझा मशीन खरीदें।',
    transport:  'FPO/मंडी में सामूहिक बिक्री करें। eNAM पर सीधे बेचें। नज़दीकी मंडी में ले जाएं।',
    seeds:      'NSC/राज्य बीज निगम से प्रमाणित बीज लें — सस्ते और भरोसेमंद। खुद बीज संरक्षण सीखें।',
    pesticide:  'IPM (Integrated Pest Management) अपनाएं। रोपाई से पहले मौसम पूर्वानुमान देखें। जैव कीटनाशक सस्ते होते हैं।',
    irrigation:  'ड्रिप इरीगेशन से 50% पानी बचाएं। PMKSY योजना से 55% सब्सिडी मिलती है।',
  }
  return tips[key] || 'KVK (Krishi Vigyan Kendra) से मुफ्त सलाह लें — 1800-180-1551।'
}
