// ─── Types ──────────────────────────────────────────────────────────────────

export interface Medicine {
  name: string
  dosage: string        // e.g. "500mg"
  frequency: string     // e.g. "Twice daily"
  duration: string      // e.g. "7 days"
  instructions: string  // e.g. "After meals"
  status: 'active' | 'completed' | 'stopped'
}

export interface LabReport {
  name: string          // e.g. "Complete Blood Count"
  result: string        // e.g. "Normal"
  value?: string        // e.g. "12.4 g/dL"
  referenceRange?: string
  status: 'normal' | 'abnormal' | 'pending'
}

export interface MedicalRecord {
  id: string
  patientName: string
  patientPhone: string
  date: string          // "YYYY-MM-DD"
  doctorName: string
  doctorId: string
  specialty: string
  hospitalName: string
  hospitalId: string
  appointmentId: string
  visitType: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup'
  chiefComplaint: string
  diagnosis: string
  notes: string
  medicines: Medicine[]
  labReports: LabReport[]
  followUpDate?: string
  bloodPressure?: string
  temperature?: string
  weight?: string
  heartRate?: string
  createdAt: string
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

const RECORDS_KEY = 'mediconnect_medical_records'

export function getAllRecords(): MedicalRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? (JSON.parse(raw) as MedicalRecord[]) : []
  } catch {
    return []
  }
}

export function getRecordsByPatient(phone: string): MedicalRecord[] {
  return getAllRecords()
    .filter((r) => r.patientPhone === phone)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRecordById(id: string): MedicalRecord | undefined {
  return getAllRecords().find((r) => r.id === id)
}

export function saveRecord(record: MedicalRecord): void {
  const all = getAllRecords()
  const idx = all.findIndex((r) => r.id === record.id)
  if (idx >= 0) all[idx] = record
  else all.push(record)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all))
}

export function deleteRecord(id: string): void {
  const all = getAllRecords().filter((r) => r.id !== id)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all))
}

export function generateRecordId(): string {
  return 'REC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Seed demo data ───────────────────────────────────────────────────────────
// Version-gated so new seed data is applied even if old records exist.

const SEED_VERSION = 'v3'
const SEED_VERSION_KEY = 'mediconnect_seed_version'

export function seedDemoRecords(): void {
  if (localStorage.getItem(SEED_VERSION_KEY) === SEED_VERSION) return
  // Clear old seeded records (keep any real user records)
  const existing = getAllRecords().filter((r) => !r.id.startsWith('REC-DEMO-'))
  const demo: MedicalRecord[] = [

    // ── Patient 1: Arjun Mehta (9999999999) ─────────────────────────────────

    {
      id: 'REC-DEMO-001',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2026-08-05',
      doctorName: 'Dr. Priya Sharma',
      doctorId: 'd-001',
      specialty: 'Cardiology',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: 'APT-DEMO-001',
      visitType: 'follow-up',
      chiefComplaint: 'Follow-up for hypertension management. Mild chest heaviness in the mornings.',
      diagnosis: 'Controlled hypertension on Amlodipine. Lipid levels improving. Continue current regimen.',
      notes: 'BP today 128/82 — significant improvement from last visit. Patient reports good medication compliance. Advised to continue low-sodium diet and daily 30-min brisk walk. Stress ECG within normal limits. Next review in 6 weeks.',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Morning with water', status: 'active' },
        { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'After breakfast', status: 'active' },
        { name: 'Rosuvastatin', dosage: '10mg', frequency: 'Once at bedtime', duration: 'Ongoing', instructions: 'For cholesterol management', status: 'active' },
        { name: 'Alprazolam', dosage: '0.25mg', frequency: 'At bedtime if needed', duration: '10 days', instructions: 'Only when anxious — course completed', status: 'completed' },
      ],
      labReports: [
        { name: 'Lipid Panel', result: 'Improved', value: 'LDL: 118 mg/dL', referenceRange: '< 130 mg/dL', status: 'normal' },
        { name: 'Blood Glucose (Fasting)', result: 'Normal', value: '91 mg/dL', referenceRange: '70–100 mg/dL', status: 'normal' },
        { name: 'Stress ECG', result: 'Negative for ischaemia', status: 'normal' },
      ],
      followUpDate: '2026-09-16',
      bloodPressure: '128/82 mmHg',
      temperature: '98.2°F',
      weight: '73 kg',
      heartRate: '80 bpm',
      createdAt: '2026-08-05T10:00:00.000Z',
    },

    {
      id: 'REC-DEMO-002',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2026-07-15',
      doctorName: 'Dr. Priya Sharma',
      doctorId: 'd-001',
      specialty: 'Cardiology',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: 'APT-DEMO-INIT',
      visitType: 'consultation',
      chiefComplaint: 'Chest discomfort and mild breathlessness on exertion. Occasional palpitations at night.',
      diagnosis: 'Newly diagnosed mild hypertension (Grade 1). Anxiety-related palpitations. No structural cardiac abnormality on echo.',
      notes: 'ECG normal. BP 142/88. 2D Echo: normal LV function, EF 62%. Advised lifestyle modification, low-sodium diet, daily walking. Pharmacotherapy initiated. Anxiety management counselling referred.',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Morning with water', status: 'completed' },
        { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast', status: 'completed' },
        { name: 'Alprazolam', dosage: '0.25mg', frequency: 'At bedtime if needed', duration: '10 days', instructions: 'Only when anxious', status: 'completed' },
      ],
      labReports: [
        { name: 'ECG (12-lead)', result: 'Normal sinus rhythm', status: 'normal' },
        { name: 'Chest X-Ray', result: 'Clear lung fields, normal cardiac silhouette', status: 'normal' },
        { name: '2D Echocardiogram', result: 'Normal LV function, EF 62%', status: 'normal' },
        { name: 'Lipid Panel', result: 'Borderline high', value: 'LDL: 142 mg/dL', referenceRange: '< 130 mg/dL', status: 'abnormal' },
        { name: 'Blood Glucose (Fasting)', result: 'Normal', value: '94 mg/dL', referenceRange: '70–100 mg/dL', status: 'normal' },
        { name: 'Serum Creatinine', result: 'Normal', value: '0.9 mg/dL', referenceRange: '0.6–1.2 mg/dL', status: 'normal' },
      ],
      followUpDate: '2026-08-05',
      bloodPressure: '142/88 mmHg',
      temperature: '98.4°F',
      weight: '74 kg',
      heartRate: '88 bpm',
      createdAt: '2026-07-15T10:30:00.000Z',
    },

    {
      id: 'REC-DEMO-003',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2026-05-20',
      doctorName: 'Dr. Rahul Verma',
      doctorId: 'd-002',
      specialty: 'Neurology',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: 'APT-DEMO-002',
      visitType: 'consultation',
      chiefComplaint: 'Recurrent migraines, 2–3 episodes per month. Each episode lasts 6–12 hours with nausea and photophobia.',
      diagnosis: 'Migraine without aura (ICD-10: G43.0). Tension-type headache component present. Sleep hygiene needs improvement.',
      notes: 'MRI brain with contrast — no structural abnormality, no space-occupying lesion. Headache diary to be maintained for 4 weeks. Triggers identified: irregular sleep, screen exposure >4h, skipping meals. Prophylactic therapy initiated with beta-blocker.',
      medicines: [
        { name: 'Propranolol', dosage: '40mg', frequency: 'Twice daily', duration: '90 days', instructions: 'With food', status: 'active' },
        { name: 'Sumatriptan', dosage: '50mg', frequency: 'At onset of migraine', duration: 'As needed', instructions: 'Max 2 tablets per attack, not >2 attacks/week', status: 'active' },
        { name: 'Domperidone', dosage: '10mg', frequency: 'With Sumatriptan', duration: 'As needed', instructions: 'For associated nausea', status: 'active' },
        { name: 'Amitriptyline', dosage: '10mg', frequency: 'Once at bedtime', duration: '30 days', instructions: 'Helps with sleep regulation and headache prevention', status: 'completed' },
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'At headache onset', duration: '10 days', instructions: 'With food — acute course only', status: 'stopped' },
      ],
      labReports: [
        { name: 'MRI Brain (with contrast)', result: 'No acute abnormality. No space-occupying lesion.', status: 'normal' },
        { name: 'Complete Blood Count', result: 'Within normal limits', value: 'Hb: 13.8 g/dL', referenceRange: '12–17 g/dL', status: 'normal' },
        { name: 'Serum Electrolytes', result: 'Normal', value: 'Na: 139, K: 4.1 mEq/L', status: 'normal' },
      ],
      followUpDate: '2026-08-20',
      bloodPressure: '118/76 mmHg',
      temperature: '98.2°F',
      weight: '72 kg',
      heartRate: '72 bpm',
      createdAt: '2026-05-20T14:00:00.000Z',
    },

    {
      id: 'REC-DEMO-004',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2026-03-10',
      doctorName: 'Dr. Ramesh Patel',
      doctorId: 'd-008',
      specialty: 'General Medicine',
      hospitalName: 'AIIMS New Delhi',
      hospitalId: 'hosp-004',
      appointmentId: 'APT-DEMO-003',
      visitType: 'routine-checkup',
      chiefComplaint: 'Annual health checkup. No specific complaints. Patient is 34 years old.',
      diagnosis: 'Generally healthy adult. Vitamin D deficiency (severe). Mild iron-deficiency anaemia. All other systems normal.',
      notes: 'BMI 23.4 — within healthy range. Blood pressure and heart rate normal. Respiratory, abdominal, and neurological examination normal. Flu vaccine administered. Advised: Vitamin D supplementation, iron-rich diet (spinach, lentils, red meat), repeat CBC in 3 months, adequate sun exposure 15 min/day.',
      medicines: [
        { name: 'Vitamin D3', dosage: '60,000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'With fatty meal for better absorption', status: 'completed' },
        { name: 'Ferrous Sulphate', dosage: '200mg', frequency: 'Once daily', duration: '60 days', instructions: 'Empty stomach or with Vitamin C juice', status: 'completed' },
        { name: 'Multivitamin with Zinc', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast', status: 'completed' },
        { name: 'Folic Acid', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'With meals', status: 'completed' },
      ],
      labReports: [
        { name: 'Vitamin D (25-OH)', result: 'Severely deficient', value: '14 ng/mL', referenceRange: '30–100 ng/mL', status: 'abnormal' },
        { name: 'Serum Iron', result: 'Low', value: '52 µg/dL', referenceRange: '65–175 µg/dL', status: 'abnormal' },
        { name: 'Haemoglobin', result: 'Mildly low', value: '11.8 g/dL', referenceRange: '13–17 g/dL', status: 'abnormal' },
        { name: 'Thyroid Profile (TSH)', result: 'Normal', value: '2.1 mIU/L', referenceRange: '0.5–4.5 mIU/L', status: 'normal' },
        { name: 'HbA1c', result: 'Normal', value: '5.2%', referenceRange: '< 5.7%', status: 'normal' },
        { name: 'Liver Function Tests (LFT)', result: 'Normal', value: 'ALT: 28 U/L', referenceRange: '< 40 U/L', status: 'normal' },
        { name: 'Kidney Function Tests (KFT)', result: 'Normal', value: 'Creatinine: 0.9 mg/dL', referenceRange: '0.6–1.2 mg/dL', status: 'normal' },
        { name: 'Urine Routine & Microscopy', result: 'Normal', status: 'normal' },
      ],
      bloodPressure: '120/78 mmHg',
      temperature: '98.6°F',
      weight: '70 kg',
      heartRate: '76 bpm',
      createdAt: '2026-03-10T09:00:00.000Z',
    },

    {
      id: 'REC-DEMO-005',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2025-12-02',
      doctorName: 'Dr. Kavitha Rao',
      doctorId: 'd-006',
      specialty: 'Dermatology',
      hospitalName: 'Manipal Hospitals',
      hospitalId: 'hosp-003',
      appointmentId: 'APT-DEMO-004',
      visitType: 'consultation',
      chiefComplaint: 'Persistent skin rash on forearms and neck for 3 weeks. Itching worsens at night.',
      diagnosis: 'Allergic contact dermatitis. Likely trigger: new laundry detergent / nickel watch strap. Secondary mild fungal involvement.',
      notes: 'Rash is erythematous, non-vesicular, well-defined border. Patch test recommended. Patient advised to switch to fragrance-free detergent, avoid metal contact on skin. Topical treatment prescribed for 2 weeks. If no improvement, patch testing and biopsy to be considered.',
      medicines: [
        { name: 'Betamethasone Cream 0.1%', dosage: 'Thin layer', frequency: 'Twice daily on affected area', duration: '14 days', instructions: 'Do not apply on face or groin. Avoid occlusive dressing.', status: 'completed' },
        { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '14 days', instructions: 'For itching — may cause drowsiness', status: 'completed' },
        { name: 'Clotrimazole Cream 1%', dosage: 'Thin layer', frequency: 'Once daily on affected area', duration: '14 days', instructions: 'For antifungal coverage', status: 'completed' },
        { name: 'Calamine Lotion', dosage: 'As required', frequency: 'Apply when itching', duration: '14 days', instructions: 'Cooling relief for itch', status: 'stopped' },
      ],
      labReports: [
        { name: 'KOH Mount (Skin Scraping)', result: 'Mild fungal hyphae seen', status: 'abnormal' },
        { name: 'Absolute Eosinophil Count', result: 'Mildly elevated', value: '620 cells/µL', referenceRange: '< 500 cells/µL', status: 'abnormal' },
        { name: 'Serum IgE', result: 'Elevated — suggests allergic component', value: '280 IU/mL', referenceRange: '< 100 IU/mL', status: 'abnormal' },
      ],
      bloodPressure: '118/74 mmHg',
      temperature: '98.4°F',
      weight: '70 kg',
      heartRate: '74 bpm',
      createdAt: '2025-12-02T11:00:00.000Z',
    },

    {
      id: 'REC-DEMO-006',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      date: '2025-09-18',
      doctorName: 'Dr. Ramesh Patel',
      doctorId: 'd-008',
      specialty: 'General Medicine',
      hospitalName: 'AIIMS New Delhi',
      hospitalId: 'hosp-004',
      appointmentId: 'APT-DEMO-005',
      visitType: 'emergency',
      chiefComplaint: 'High-grade fever (103°F) for 3 days. Body aches, severe headache, loss of appetite. Possible dengue exposure.',
      diagnosis: 'Dengue fever (NS1 Antigen positive). Platelet count low but stable. Managed conservatively.',
      notes: 'NS1 antigen positive, dengue IgM positive. No bleeding manifestations, no haemodynamic instability. Platelet count 85,000 on admission — monitored 8-hourly. IV hydration given. Discharged after 4 days when fever resolved and platelet count recovered to 1,28,000. Patient advised rest for 2 weeks, adequate fluid intake, platelet-boosting diet (papaya leaf extract). Mosquito prevention counselled.',
      medicines: [
        { name: 'Paracetamol', dosage: '650mg', frequency: 'Every 6 hours (fever)', duration: '5 days', instructions: 'Do NOT take Ibuprofen or Aspirin in dengue', status: 'completed' },
        { name: 'Papaya Leaf Extract', dosage: '2 capsules', frequency: 'Twice daily', duration: '7 days', instructions: 'To support platelet recovery', status: 'completed' },
        { name: 'ORS Sachet', dosage: '1 sachet in 1L water', frequency: 'Sip throughout the day', duration: '5 days', instructions: 'Prevent dehydration', status: 'completed' },
        { name: 'IV Ringer Lactate', dosage: '500mL', frequency: '8-hourly (inpatient)', duration: '4 days', instructions: 'Administered inpatient — fluid management', status: 'completed' },
      ],
      labReports: [
        { name: 'Dengue NS1 Antigen', result: 'Positive', status: 'abnormal' },
        { name: 'Dengue IgM Antibody', result: 'Positive', status: 'abnormal' },
        { name: 'Platelet Count (Day 1)', result: 'Low', value: '85,000 /µL', referenceRange: '1,50,000–4,50,000 /µL', status: 'abnormal' },
        { name: 'Platelet Count (Day 4)', result: 'Recovering', value: '1,28,000 /µL', referenceRange: '1,50,000–4,50,000 /µL', status: 'abnormal' },
        { name: 'Haematocrit', result: 'Normal', value: '42%', referenceRange: '40–52%', status: 'normal' },
        { name: 'Serum Bilirubin', result: 'Mildly elevated', value: '2.1 mg/dL', referenceRange: '0.3–1.2 mg/dL', status: 'abnormal' },
        { name: 'SGOT/AST', result: 'Elevated', value: '88 U/L', referenceRange: '< 40 U/L', status: 'abnormal' },
      ],
      bloodPressure: '104/68 mmHg',
      temperature: '103.2°F',
      weight: '68 kg',
      heartRate: '102 bpm',
      createdAt: '2025-09-18T22:00:00.000Z',
    },

    // ── Patient 2: Priya Nair (8888888888) ──────────────────────────────────

    {
      id: 'REC-DEMO-007',
      patientName: 'Priya Nair',
      patientPhone: '8888888888',
      date: '2026-08-10',
      doctorName: 'Dr. Meena Gupta',
      doctorId: 'd-005',
      specialty: 'Pediatrics',
      hospitalName: 'Fortis Medanta',
      hospitalId: 'hosp-002',
      appointmentId: 'APT-DEMO-006',
      visitType: 'consultation',
      chiefComplaint: 'Child (8 years) with recurrent throat infections, 4 episodes in 6 months. Difficulty swallowing solid food.',
      diagnosis: 'Recurrent tonsillitis. Bilateral grade 3 tonsillar hypertrophy. ENT referral recommended for tonsillectomy evaluation.',
      notes: 'Throat culture: Group A Streptococcus positive. Child appears well-nourished. No fever currently. Parents counselled about recurrent pattern and indications for surgery. Referred to ENT for tonsillectomy evaluation. Complete vaccination history reviewed — up to date.',
      medicines: [
        { name: 'Amoxicillin-Clavulanate', dosage: '375mg', frequency: 'Twice daily', duration: '10 days', instructions: 'With food. Complete full course.', status: 'completed' },
        { name: 'Paracetamol Syrup', dosage: '5mL (120mg)', frequency: 'Every 6 hours if pain/fever', duration: '5 days', instructions: 'For pain and fever', status: 'completed' },
        { name: 'Benzydamine Gargle', dosage: '15mL', frequency: 'Gargle every 3 hours', duration: '7 days', instructions: 'Do not swallow. Spit out after gargling.', status: 'completed' },
      ],
      labReports: [
        { name: 'Throat Culture & Sensitivity', result: 'Group A Streptococcus (GAS) — Positive', status: 'abnormal' },
        { name: 'Complete Blood Count', result: 'Mild leucocytosis', value: 'WBC: 11,200 /µL', referenceRange: '4,000–11,000 /µL', status: 'abnormal' },
        { name: 'ASO Titre', result: 'Elevated', value: '320 IU/mL', referenceRange: '< 200 IU/mL', status: 'abnormal' },
      ],
      bloodPressure: '98/62 mmHg',
      temperature: '99.8°F',
      weight: '26 kg',
      heartRate: '92 bpm',
      createdAt: '2026-08-10T10:30:00.000Z',
    },

    {
      id: 'REC-DEMO-008',
      patientName: 'Priya Nair',
      patientPhone: '8888888888',
      date: '2026-06-15',
      doctorName: 'Dr. Ananya Singh',
      doctorId: 'd-009',
      specialty: 'Psychiatry',
      hospitalName: 'AIIMS New Delhi',
      hospitalId: 'hosp-004',
      appointmentId: 'APT-DEMO-007',
      visitType: 'consultation',
      chiefComplaint: 'Persistent low mood for 4 months. Difficulty concentrating at work. Insomnia. Loss of interest in activities previously enjoyed.',
      diagnosis: 'Major Depressive Disorder, mild-to-moderate severity (ICD-10: F32.1). No suicidal ideation. PHQ-9 score: 14.',
      notes: 'PHQ-9: 14 (moderate depression). GAD-7: 8 (mild anxiety). No psychotic features. No history of mania. Sleep: difficulty initiating sleep, waking at 3-4 AM. Appetite reduced. Patient consented to pharmacotherapy and CBT referral. Weekly follow-up for 4 weeks, then fortnightly. Safety planning discussed.',
      medicines: [
        { name: 'Escitalopram', dosage: '10mg', frequency: 'Once daily in the morning', duration: '90 days', instructions: 'Takes 2–4 weeks for full effect. Do not stop abruptly.', status: 'active' },
        { name: 'Clonazepam', dosage: '0.5mg', frequency: 'Once at bedtime', duration: '14 days', instructions: 'Short-term only for insomnia. Taper gradually.', status: 'completed' },
        { name: 'Melatonin', dosage: '3mg', frequency: 'Once at bedtime (30 min before sleep)', duration: 'Ongoing', instructions: 'Non-habit forming. Helps regulate sleep cycle.', status: 'active' },
      ],
      labReports: [
        { name: 'Thyroid Profile (TSH)', result: 'Normal — ruled out hypothyroidism', value: '1.9 mIU/L', referenceRange: '0.5–4.5 mIU/L', status: 'normal' },
        { name: 'Complete Blood Count', result: 'Normal', status: 'normal' },
        { name: 'Vitamin B12', result: 'Low-normal', value: '218 pg/mL', referenceRange: '200–900 pg/mL', status: 'normal' },
        { name: 'Vitamin D (25-OH)', result: 'Insufficient', value: '22 ng/mL', referenceRange: '30–100 ng/mL', status: 'abnormal' },
      ],
      followUpDate: '2026-07-15',
      bloodPressure: '112/70 mmHg',
      temperature: '98.4°F',
      weight: '54 kg',
      heartRate: '78 bpm',
      createdAt: '2026-06-15T15:00:00.000Z',
    },

    {
      id: 'REC-DEMO-009',
      patientName: 'Priya Nair',
      patientPhone: '8888888888',
      date: '2026-04-22',
      doctorName: 'Dr. Sunita Joshi',
      doctorId: 'd-003',
      specialty: 'Orthopedics',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: 'APT-DEMO-008',
      visitType: 'consultation',
      chiefComplaint: 'Right knee pain for 6 weeks after a fall. Swelling and difficulty climbing stairs.',
      diagnosis: 'Grade II medial collateral ligament (MCL) sprain. No bony injury on X-ray. Conservative management initiated.',
      notes: 'X-ray right knee: no fracture, no dislocation. Mild joint effusion on MRI. MCL partially torn (Grade II). Advised RICE protocol: rest, ice pack 15 min 3x/day, compression bandage, elevation. Physiotherapy 3x/week for 4 weeks. Return to sports after 6–8 weeks if pain-free. Surgical option not indicated at this stage.',
      medicines: [
        { name: 'Etoricoxib', dosage: '60mg', frequency: 'Once daily after food', duration: '10 days', instructions: 'For pain and swelling. Take with food.', status: 'completed' },
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (before breakfast)', duration: '10 days', instructions: 'Stomach protection with NSAID', status: 'completed' },
        { name: 'Diclofenac Gel 1%', dosage: 'Small amount', frequency: 'Apply 3 times daily on knee', duration: '14 days', instructions: 'Massage gently. Wash hands after. Do not apply on broken skin.', status: 'completed' },
        { name: 'Calcium + Vitamin D3', dosage: '500mg + 250IU', frequency: 'Twice daily', duration: '60 days', instructions: 'For bone health', status: 'active' },
      ],
      labReports: [
        { name: 'X-Ray Right Knee (AP & Lateral)', result: 'No fracture. No dislocation. Mild soft tissue swelling.', status: 'normal' },
        { name: 'MRI Right Knee', result: 'Grade II MCL tear. Mild joint effusion. ACL intact.', status: 'abnormal' },
      ],
      bloodPressure: '116/74 mmHg',
      temperature: '98.6°F',
      weight: '55 kg',
      heartRate: '76 bpm',
      createdAt: '2026-04-22T12:00:00.000Z',
    },

    {
      id: 'REC-DEMO-010',
      patientName: 'Priya Nair',
      patientPhone: '8888888888',
      date: '2026-02-08',
      doctorName: 'Dr. Suresh Nair',
      doctorId: 'd-007',
      specialty: 'Gastroenterology',
      hospitalName: 'Manipal Hospitals',
      hospitalId: 'hosp-003',
      appointmentId: 'APT-DEMO-009',
      visitType: 'consultation',
      chiefComplaint: 'Recurrent abdominal pain (upper right), bloating, and nausea after fatty meals for 3 months.',
      diagnosis: 'Gallbladder polyps (3mm, 4mm — benign morphology on USG). Mild non-alcoholic fatty liver disease (NAFLD). Dietary modification advised.',
      notes: 'USG abdomen: Liver mildly enlarged with diffuse increased echogenicity — consistent with Grade I NAFLD. Gallbladder shows 2 polyps (3mm and 4mm) — no gallstones. BMI 24.8. Advised weight management, low-fat diet, regular aerobic exercise. Follow-up USG in 6 months to monitor polyp size. Repeat LFT in 3 months.',
      medicines: [
        { name: 'Ursodeoxycholic Acid (UDCA)', dosage: '300mg', frequency: 'Twice daily after meals', duration: '90 days', instructions: 'For liver and gallbladder health', status: 'active' },
        { name: 'Domperidone', dosage: '10mg', frequency: 'Before meals (3x daily)', duration: '14 days', instructions: 'For bloating and nausea', status: 'completed' },
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (30 min before breakfast)', duration: '30 days', instructions: 'For acidity', status: 'completed' },
      ],
      labReports: [
        { name: 'USG Abdomen & Pelvis', result: 'Mild hepatomegaly, Grade I fatty liver. GB polyps 3mm and 4mm.', status: 'abnormal' },
        { name: 'SGOT/AST', result: 'Mildly elevated', value: '52 U/L', referenceRange: '< 40 U/L', status: 'abnormal' },
        { name: 'SGPT/ALT', result: 'Mildly elevated', value: '64 U/L', referenceRange: '< 40 U/L', status: 'abnormal' },
        { name: 'Serum Bilirubin (Total)', result: 'Normal', value: '0.8 mg/dL', referenceRange: '0.3–1.2 mg/dL', status: 'normal' },
        { name: 'GGT', result: 'Elevated', value: '78 U/L', referenceRange: '< 50 U/L', status: 'abnormal' },
        { name: 'Fasting Lipid Profile', result: 'Triglycerides elevated', value: 'TG: 198 mg/dL', referenceRange: '< 150 mg/dL', status: 'abnormal' },
        { name: 'HBsAg', result: 'Negative', status: 'normal' },
        { name: 'Anti-HCV', result: 'Negative', status: 'normal' },
      ],
      followUpDate: '2026-08-08',
      bloodPressure: '118/76 mmHg',
      temperature: '98.4°F',
      weight: '56 kg',
      heartRate: '74 bpm',
      createdAt: '2026-02-08T11:30:00.000Z',
    },
  ]

  localStorage.setItem(RECORDS_KEY, JSON.stringify([...existing, ...demo]))
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
}
