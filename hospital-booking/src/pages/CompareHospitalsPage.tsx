import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getHospitalsWithComparison } from '../data/hospitalComparisons'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

type MetricKey =
  | 'successRate'
  | 'surgerySuccess'
  | 'patientSatisfaction'
  | 'infectionControl'
  | 'avgWaitMins'
  | 'dischargeDays'
  | 'generalCheckup'
  | 'specialistConsult'
  | 'diagnosticPackage'
  | 'icuBeds'
  | 'rating'
  | 'beds'

const METRICS: { key: MetricKey; label: string; hint: string; better: 'high' | 'low'; format: (v: number) => string }[] = [
  { key: 'successRate', label: 'Overall success rate', hint: 'Treatment outcomes across departments', better: 'high', format: (v) => `${v}%` },
  { key: 'surgerySuccess', label: 'Surgery success rate', hint: 'Major procedures completed without complication', better: 'high', format: (v) => `${v}%` },
  { key: 'patientSatisfaction', label: 'Patient satisfaction', hint: 'Post-visit feedback score', better: 'high', format: (v) => `${v}%` },
  { key: 'rating', label: 'Hospital rating', hint: 'Verified patient rating', better: 'high', format: (v) => `${v.toFixed(1)} ★` },
  { key: 'infectionControl', label: 'Infection control', hint: 'Hygiene & isolation protocol score', better: 'high', format: (v) => `${v}/100` },
  { key: 'avgWaitMins', label: 'Avg. OPD wait', hint: 'Typical wait before consultation', better: 'low', format: (v) => `${v} min` },
  { key: 'dischargeDays', label: 'Avg. stay / discharge', hint: 'Typical inpatient length of stay', better: 'low', format: (v) => `${v} days` },
  { key: 'generalCheckup', label: 'General checkup', hint: 'Standard health checkup package', better: 'low', format: (v) => INR.format(v) },
  { key: 'specialistConsult', label: 'Specialist consultation', hint: 'First visit fee for a specialist', better: 'low', format: (v) => INR.format(v) },
  { key: 'diagnosticPackage', label: 'Diagnostic package', hint: 'Blood, imaging & basic labs bundle', better: 'low', format: (v) => INR.format(v) },
  { key: 'icuBeds', label: 'ICU beds', hint: 'Critical-care capacity', better: 'high', format: (v) => String(v) },
  { key: 'beds', label: 'Total beds', hint: 'Overall hospital capacity', better: 'high', format: (v) => String(v) },
]

function metricValue(
  key: MetricKey,
  row: ReturnType<typeof getHospitalsWithComparison>[number]
): number {
  const { hospital, comparison } = row
  if (key === 'rating') return hospital.rating
  if (key === 'beds') return hospital.beds
  return comparison[key]
}

export default function CompareHospitalsPage() {
  const { navigate } = useApp()
  const all = useMemo(() => getHospitalsWithComparison(), [])
  const [selected, setSelected] = useState<string[]>(() => all.slice(0, 3).map((r) => r.hospital.id))

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const rows = all.filter((r) => selected.includes(r.hospital.id))

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </button>

        <h1 className="font-instrument text-white text-4xl md:text-6xl leading-tight">
          Compare <span className="italic">Hospitals</span>
        </h1>
        <p className="text-white/50 font-inter mt-3 text-sm md:text-base max-w-2xl">
          Side-by-side success rates, checkup fees, wait times, and care quality — pick 2 to 4 hospitals.
        </p>

        <div className="mt-8 mb-6">
          <p className="text-white/35 text-[10px] font-inter uppercase tracking-widest mb-3">
            Select hospitals ({selected.length}/4)
          </p>
          <div className="flex flex-wrap gap-2">
            {all.map(({ hospital }) => {
              const on = selected.includes(hospital.id)
              return (
                <button
                  key={hospital.id}
                  onClick={() => toggle(hospital.id)}
                  className={`text-xs font-inter px-3.5 py-2 rounded-full border transition-all
                    ${on
                      ? 'bg-white/12 border-white/35 text-white'
                      : 'bg-white/4 border-white/10 text-white/45 hover:border-white/25 hover:text-white/80'}`}
                >
                  {hospital.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 font-inter text-[11px] uppercase tracking-wider px-5 py-4 w-[220px]">
                  Metric
                </th>
                {rows.map(({ hospital }) => (
                  <th key={hospital.id} className="text-left px-4 py-4 align-top">
                    <p className="text-white font-inter text-sm font-medium leading-snug">{hospital.name}</p>
                    <p className="text-white/35 font-inter text-[11px] mt-0.5">{hospital.city}</p>
                    <button
                      onClick={() => navigate('hospital-detail', { selectedHospitalId: hospital.id })}
                      className="mt-2 text-[11px] font-inter text-white/45 hover:text-white transition-colors"
                    >
                      View hospital →
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric, idx) => {
                const values = rows.map((r) => metricValue(metric.key, r))
                const best = metric.better === 'high' ? Math.max(...values) : Math.min(...values)
                return (
                  <tr key={metric.key} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-5 py-3.5 align-top">
                      <p className="text-white/80 font-inter text-sm">{metric.label}</p>
                      <p className="text-white/30 font-inter text-[11px] mt-0.5">{metric.hint}</p>
                    </td>
                    {rows.map((row, i) => {
                      const val = values[i]
                      const isBest = val === best && rows.length > 1
                      return (
                        <td key={row.hospital.id} className="px-4 py-3.5 align-middle">
                          <span className={`font-inter text-sm font-medium ${isBest ? 'text-emerald-400' : 'text-white/75'}`}>
                            {metric.format(val)}
                          </span>
                          {isBest && (
                            <span className="ml-2 text-[10px] font-inter uppercase tracking-wide text-emerald-400/70">
                              Best
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              <tr>
                <td className="px-5 py-3.5">
                  <p className="text-white/80 font-inter text-sm">NABH accredited</p>
                  <p className="text-white/30 font-inter text-[11px] mt-0.5">National quality certification</p>
                </td>
                {rows.map(({ hospital, comparison }) => (
                  <td key={hospital.id} className="px-4 py-3.5">
                    <span className={`font-inter text-sm ${comparison.nabhAccredited ? 'text-emerald-400' : 'text-white/50'}`}>
                      {comparison.nabhAccredited ? 'Yes' : 'No'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="px-5 py-3.5">
                  <p className="text-white/80 font-inter text-sm">Insurance</p>
                  <p className="text-white/30 font-inter text-[11px] mt-0.5">Networks & cashless cover</p>
                </td>
                {rows.map(({ hospital, comparison }) => (
                  <td key={hospital.id} className="px-4 py-3.5">
                    <span className="text-white/70 font-inter text-sm leading-snug">{comparison.insuranceAccepted}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3.5">
                  <p className="text-white/80 font-inter text-sm">Specialties</p>
                  <p className="text-white/30 font-inter text-[11px] mt-0.5">Departments on campus</p>
                </td>
                {rows.map(({ hospital }) => (
                  <td key={hospital.id} className="px-4 py-3.5">
                    <p className="text-white/65 font-inter text-xs leading-relaxed">{hospital.specialties.join(', ')}</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-white/25 font-inter text-[11px] mt-4">
          Figures are indicative for comparison on MediConnect and may vary by department, doctor, and package.
        </p>
      </div>
    </div>
  )
}
