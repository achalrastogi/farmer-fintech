import { fmtNum } from '../../lib/locale'
import { useState } from 'react'
import CalcShell, { Field, SectionLabel, BigResult, CalcButton } from './CalcShell'
import { useTranslation } from '../../hooks/useTranslation'

const CROPS = [
  { value: '', label: 'फसल चुनें' },
  { value: 'wheat', label: '🌾 गेहूं' },
  { value: 'rice', label: '🌾 धान' },
  { value: 'cotton', label: '🌿 कपास' },
  { value: 'soybean', label: '🫘 सोयाबीन' },
  { value: 'mustard', label: '🌼 सरसों' },
  { value: 'sugarcane', label: '🎋 गन्ना' },
  { value: 'potato', label: '🥔 आलू' },
  { value: 'onion', label: '🧅 प्याज' },
  { value: 'other', label: '🌱 अन्य' },
]

function CropInput({ label, color, value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  return (
    <div className={`rounded-2xl p-4 border-2 ${color} space-y-3`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base font-bold text-gray-800">{label}</span>
      </div>
      <select
        value={value.name || ''}
        onChange={e => set('name', e.target.value)}
        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none"
      >
        {CROPS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">उपज (क्विंटल/एकड़)</label>
        <input type="number" inputMode="decimal" placeholder="जैसे: 20"
          value={value.yield || ''} onChange={e => set('yield', e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">बाजार भाव (₹/क्विंटल)</label>
        <input type="number" inputMode="decimal" placeholder="जैसे: 2200"
          value={value.price || ''} onChange={e => set('price', e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">कुल लागत (₹/एकड़)</label>
        <input type="number" inputMode="decimal" placeholder="जैसे: 15000"
          value={value.cost || ''} onChange={e => set('cost', e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
      </div>
    </div>
  )
}

export default function CropComparison() {
  const { t } = useTranslation()
  const [cropA, setCropA] = useState({ name: '', yield: '', price: '', cost: '' })
  const [cropB, setCropB] = useState({ name: '', yield: '', price: '', cost: '' })
  const [result, setResult] = useState(null)

  const canCalc = cropA.yield && cropA.price && cropA.cost && cropB.yield && cropB.price && cropB.cost

  function calc(crop) {
    const yld = Number(crop.yield)
    const price = Number(crop.price)
    const cost = Number(crop.cost)
    const revenue = yld * price
    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const risk = margin >= 35 ? 'green' : margin >= 20 ? 'yellow' : 'red'
    const riskLabel = margin >= 35 ? '✅ मजबूत' : margin >= 20 ? '⚠️ सामान्य' : '🔴 कमज़ोर'
    return { revenue, profit, margin, risk, riskLabel }
  }

  function calculate() {
    const a = calc(cropA)
    const b = calc(cropB)
    const winner = a.profit > b.profit ? 'A' : b.profit > a.profit ? 'B' : 'equal'
    setResult({ a, b, winner })
  }

  const cropName = (c) => CROPS.find(x => x.value === c.name)?.label?.replace(/^[^ ]+ /, '') || c.name || '?'

  return (
    <CalcShell
      title={t('calc.crop_compare.title')}
      subtitle={t('calc.crop_compare.subtitle')}
      icon="🆚"
      color="from-indigo-600 to-purple-700"
      description={t('calc.crop_compare.description')}
    >
      <div className="grid grid-cols-2 gap-3">
        <CropInput label={t('calc.crop_compare.crop1_label')} color="border-indigo-200 bg-indigo-50" value={cropA} onChange={setCropA} />
        <CropInput label={t('calc.crop_compare.crop2_label')} color="border-purple-200 bg-purple-50" value={cropB} onChange={setCropB} />
      </div>

      <CalcButton onClick={calculate} disabled={!canCalc} label="तुलना करें →" />

      {result && (
        <div className="space-y-3">
          {/* Side-by-side comparison */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-2">
              <span>मापदंड</span>
              <span className="text-center text-indigo-600">🅰️ {cropName(cropA)}</span>
              <span className="text-center text-purple-600">🅱️ {cropName(cropB)}</span>
            </div>
            {[
              { label: t('calc.crop_compare.revenue'), aVal: `₹${fmtNum(Math.round(result.a.revenue))}`, bVal: `₹${fmtNum(Math.round(result.b.revenue))}` },
              { label: t('calc.crop_compare.profit'), aVal: `₹${fmtNum(Math.round(result.a.profit))}`, bVal: `₹${fmtNum(Math.round(result.b.profit))}` },
              { label: t('calc.crop_compare.margin'), aVal: `${result.a.margin.toFixed(1)}%`, bVal: `${result.b.margin.toFixed(1)}%` },
              { label: 'जोखिम', aVal: result.a.riskLabel, bVal: result.b.riskLabel },
            ].map((row, i) => {
              const aWins = row.label !== 'जोखिम' && parseFloat(row.aVal) > parseFloat(row.bVal)
              const bWins = row.label !== 'जोखिम' && parseFloat(row.bVal) > parseFloat(row.aVal)
              return (
                <div key={i} className="grid grid-cols-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500 self-center">{row.label}</span>
                  <span className={`text-xs font-semibold text-center self-center ${aWins ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{row.aVal}</span>
                  <span className={`text-xs font-semibold text-center self-center ${bWins ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{row.bVal}</span>
                </div>
              )
            })}
          </div>

          {/* Winner */}
          {result.winner !== 'equal' ? (
            <div className={`rounded-2xl p-4 text-center border-2 ${result.winner === 'A' ? 'bg-indigo-50 border-indigo-200' : 'bg-purple-50 border-purple-200'}`}>
              <p className="text-2xl mb-1">🏆</p>
              <p className="font-bold text-gray-800">
                {result.winner === 'A' ? `🅰️ ${cropName(cropA)}` : `🅱️ ${cropName(cropB)}`} {t('calc.crop_compare.winner')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                मुनाफे में अंतर: ₹{fmtNum(Math.abs(result.a.profit - result.b.profit))}/एकड़
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4 text-center border-2 border-gray-200">
              <p className="font-bold text-gray-700">⚖️ दोनों फसलें बराबर हैं</p>
              <p className="text-xs text-gray-500 mt-1">अन्य कारक देखें — पानी, मंडी दूरी, जोखिम</p>
            </div>
          )}

          {/* Visual profit bars */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3">मुनाफे की तुलना (प्रति एकड़)</p>
            {[
              { label: `🅰️ ${cropName(cropA)}`, profit: result.a.profit, color: 'bg-indigo-400' },
              { label: `🅱️ ${cropName(cropB)}`, profit: result.b.profit, color: 'bg-purple-400' },
            ].map(bar => {
              const maxP = Math.max(result.a.profit, result.b.profit)
              const pct = maxP > 0 ? Math.max(0, (bar.profit / maxP) * 100) : 0
              return (
                <div key={bar.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{bar.label}</span>
                    <span className="font-semibold text-gray-800">{bar.profit >= 0 ? '₹' : '-₹'}{fmtNum(Math.abs(Math.round(bar.profit)))}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            💡 <strong>याद रखें:</strong> मुनाफे के अलावा — पानी की जरूरत, मंडी की दूरी, मिट्टी की अनुकूलता भी देखें। KVK से मुफ्त सलाह लें।
          </div>
        </div>
      )}
    </CalcShell>
  )
}
