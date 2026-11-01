import { HOSPITALS } from './hospitals'

export interface HospitalComparison {
  hospitalId: string
  successRate: number // overall treatment/surgery success %
  surgerySuccess: number
  patientSatisfaction: number // %
  infectionControl: number // score out of 100
  avgWaitMins: number
  dischargeDays: number
  generalCheckup: number // INR
  specialistConsult: number
  diagnosticPackage: number
  icuBeds: number
  nabhAccredited: boolean
  insuranceAccepted: string
}

export const HOSPITAL_COMPARISONS: HospitalComparison[] = [
  {
    hospitalId: 'hosp-001',
    successRate: 96.4,
    surgerySuccess: 97.1,
    patientSatisfaction: 94,
    infectionControl: 92,
    avgWaitMins: 28,
    dischargeDays: 3.2,
    generalCheckup: 1800,
    specialistConsult: 1200,
    diagnosticPackage: 4500,
    icuBeds: 48,
    nabhAccredited: true,
    insuranceAccepted: 'Most major insurers',
  },
  {
    hospitalId: 'hosp-002',
    successRate: 95.8,
    surgerySuccess: 96.5,
    patientSatisfaction: 91,
    infectionControl: 90,
    avgWaitMins: 35,
    dischargeDays: 3.6,
    generalCheckup: 2200,
    specialistConsult: 1500,
    diagnosticPackage: 5200,
    icuBeds: 72,
    nabhAccredited: true,
    insuranceAccepted: 'Cashless + TPA',
  },
  {
    hospitalId: 'hosp-003',
    successRate: 94.2,
    surgerySuccess: 94.8,
    patientSatisfaction: 89,
    infectionControl: 88,
    avgWaitMins: 42,
    dischargeDays: 4.0,
    generalCheckup: 1500,
    specialistConsult: 900,
    diagnosticPackage: 3800,
    icuBeds: 36,
    nabhAccredited: true,
    insuranceAccepted: 'Most major insurers',
  },
  {
    hospitalId: 'hosp-004',
    successRate: 97.8,
    surgerySuccess: 98.2,
    patientSatisfaction: 96,
    infectionControl: 95,
    avgWaitMins: 55,
    dischargeDays: 4.8,
    generalCheckup: 800,
    specialistConsult: 500,
    diagnosticPackage: 2200,
    icuBeds: 180,
    nabhAccredited: true,
    insuranceAccepted: 'CGHS, Ayushman, most TPAs',
  },
  {
    hospitalId: 'hosp-005',
    successRate: 96.1,
    surgerySuccess: 96.9,
    patientSatisfaction: 93,
    infectionControl: 93,
    avgWaitMins: 22,
    dischargeDays: 2.9,
    generalCheckup: 2500,
    specialistConsult: 1800,
    diagnosticPackage: 6800,
    icuBeds: 64,
    nabhAccredited: true,
    insuranceAccepted: 'Premium cashless network',
  },
  {
    hospitalId: 'hosp-006',
    successRate: 97.2,
    surgerySuccess: 98.0,
    patientSatisfaction: 92,
    infectionControl: 91,
    avgWaitMins: 32,
    dischargeDays: 3.4,
    generalCheckup: 1200,
    specialistConsult: 800,
    diagnosticPackage: 3200,
    icuBeds: 120,
    nabhAccredited: true,
    insuranceAccepted: 'Ayushman + major insurers',
  },
]

export function getComparison(hospitalId: string): HospitalComparison | undefined {
  return HOSPITAL_COMPARISONS.find((c) => c.hospitalId === hospitalId)
}

export function getHospitalsWithComparison() {
  return HOSPITALS.map((h) => ({
    hospital: h,
    comparison: getComparison(h.id)!,
  })).filter((row) => row.comparison)
}
