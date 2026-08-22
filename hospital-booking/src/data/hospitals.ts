export interface Doctor {
  id: string
  name: string
  specialty: string
  qualification: string
  experience: number // years
  rating: number
  availableDays: string[] // e.g. ['Mon','Tue','Wed']
  slotDuration: number // minutes per appointment
  startTime: string // "09:00"
  endTime: string // "17:00"
  avatar: string // initials fallback
}

export interface Hospital {
  id: string
  name: string
  location: string
  city: string
  rating: number
  specialties: string[]
  doctors: Doctor[]
  image: string // gradient class or color
  beds: number
  established: number
}

export const HOSPITALS: Hospital[] = [
  {
    id: 'hosp-001',
    name: 'Apollo City Hospital',
    location: 'Bandra West, Mumbai',
    city: 'Mumbai',
    rating: 4.8,
    beds: 420,
    established: 1995,
    specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology'],
    image: 'from-blue-900 to-blue-700',
    doctors: [
      {
        id: 'd-001',
        name: 'Dr. Priya Sharma',
        specialty: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology), FACC',
        experience: 18,
        rating: 4.9,
        availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
        slotDuration: 20,
        startTime: '09:00',
        endTime: '17:00',
        avatar: 'PS',
      },
      {
        id: 'd-002',
        name: 'Dr. Rahul Verma',
        specialty: 'Neurology',
        qualification: 'MBBS, DM (Neurology)',
        experience: 12,
        rating: 4.7,
        availableDays: ['Mon', 'Wed', 'Fri'],
        slotDuration: 30,
        startTime: '10:00',
        endTime: '16:00',
        avatar: 'RV',
      },
      {
        id: 'd-003',
        name: 'Dr. Sunita Joshi',
        specialty: 'Orthopedics',
        qualification: 'MBBS, MS (Ortho)',
        experience: 15,
        rating: 4.8,
        availableDays: ['Tue', 'Thu', 'Sat'],
        slotDuration: 20,
        startTime: '09:00',
        endTime: '14:00',
        avatar: 'SJ',
      },
    ],
  },
  {
    id: 'hosp-002',
    name: 'Fortis Medanta',
    location: 'Sector 44, Gurugram',
    city: 'Delhi NCR',
    rating: 4.7,
    beds: 600,
    established: 2009,
    specialties: ['Oncology', 'Cardiology', 'Transplants', 'Pediatrics'],
    image: 'from-indigo-900 to-indigo-700',
    doctors: [
      {
        id: 'd-004',
        name: 'Dr. Anil Kumar',
        specialty: 'Oncology',
        qualification: 'MBBS, MD, DM (Oncology)',
        experience: 22,
        rating: 4.9,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu'],
        slotDuration: 30,
        startTime: '08:00',
        endTime: '15:00',
        avatar: 'AK',
      },
      {
        id: 'd-005',
        name: 'Dr. Meena Gupta',
        specialty: 'Pediatrics',
        qualification: 'MBBS, MD (Pediatrics)',
        experience: 10,
        rating: 4.8,
        availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
        slotDuration: 15,
        startTime: '10:00',
        endTime: '18:00',
        avatar: 'MG',
      },
    ],
  },
  {
    id: 'hosp-003',
    name: 'Manipal Hospitals',
    location: 'HAL Airport Road, Bangalore',
    city: 'Bangalore',
    rating: 4.6,
    beds: 380,
    established: 2001,
    specialties: ['Dermatology', 'ENT', 'Gastroenterology', 'Nephrology'],
    image: 'from-teal-900 to-teal-700',
    doctors: [
      {
        id: 'd-006',
        name: 'Dr. Kavitha Rao',
        specialty: 'Dermatology',
        qualification: 'MBBS, MD (Dermatology)',
        experience: 9,
        rating: 4.7,
        availableDays: ['Tue', 'Wed', 'Thu', 'Sat'],
        slotDuration: 15,
        startTime: '09:00',
        endTime: '17:00',
        avatar: 'KR',
      },
      {
        id: 'd-007',
        name: 'Dr. Suresh Nair',
        specialty: 'Gastroenterology',
        qualification: 'MBBS, DM (Gastro)',
        experience: 16,
        rating: 4.6,
        availableDays: ['Mon', 'Wed', 'Fri'],
        slotDuration: 25,
        startTime: '11:00',
        endTime: '17:00',
        avatar: 'SN',
      },
    ],
  },
  {
    id: 'hosp-004',
    name: 'AIIMS New Delhi',
    location: 'Ansari Nagar, New Delhi',
    city: 'Delhi NCR',
    rating: 4.9,
    beds: 2000,
    established: 1956,
    specialties: ['General Medicine', 'Surgery', 'Psychiatry', 'Radiology', 'Cardiology'],
    image: 'from-slate-800 to-slate-600',
    doctors: [
      {
        id: 'd-008',
        name: 'Dr. Ramesh Patel',
        specialty: 'General Medicine',
        qualification: 'MBBS, MD (Medicine)',
        experience: 25,
        rating: 4.9,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        slotDuration: 20,
        startTime: '09:00',
        endTime: '13:00',
        avatar: 'RP',
      },
      {
        id: 'd-009',
        name: 'Dr. Ananya Singh',
        specialty: 'Psychiatry',
        qualification: 'MBBS, MD (Psychiatry)',
        experience: 14,
        rating: 4.8,
        availableDays: ['Mon', 'Wed', 'Thu'],
        slotDuration: 45,
        startTime: '14:00',
        endTime: '18:00',
        avatar: 'AS',
      },
    ],
  },
  {
    id: 'hosp-005',
    name: 'Kokilaben Dhirubhai Hospital',
    location: 'Andheri West, Mumbai',
    city: 'Mumbai',
    rating: 4.7,
    beds: 750,
    established: 2009,
    specialties: ['Robotic Surgery', 'Neurosciences', 'Orthopedics', 'IVF'],
    image: 'from-purple-900 to-purple-700',
    doctors: [
      {
        id: 'd-010',
        name: 'Dr. Vikram Malhotra',
        specialty: 'Robotic Surgery',
        qualification: 'MBBS, MS, FACS',
        experience: 20,
        rating: 4.9,
        availableDays: ['Tue', 'Thu'],
        slotDuration: 30,
        startTime: '10:00',
        endTime: '16:00',
        avatar: 'VM',
      },
    ],
  },
  {
    id: 'hosp-006',
    name: 'Narayana Health City',
    location: 'Bommasandra, Bangalore',
    city: 'Bangalore',
    rating: 4.6,
    beds: 1400,
    established: 2000,
    specialties: ['Cardiac Surgery', 'Pediatric Cardiology', 'Bone Marrow Transplant'],
    image: 'from-cyan-900 to-cyan-700',
    doctors: [
      {
        id: 'd-011',
        name: 'Dr. Devi Shetty',
        specialty: 'Cardiac Surgery',
        qualification: 'MBBS, FRCS (Cardiothoracic)',
        experience: 35,
        rating: 5.0,
        availableDays: ['Mon', 'Fri'],
        slotDuration: 30,
        startTime: '09:00',
        endTime: '12:00',
        avatar: 'DS',
      },
      {
        id: 'd-012',
        name: 'Dr. Leena Chandra',
        specialty: 'Pediatric Cardiology',
        qualification: 'MBBS, MD, DM (Ped Cardiology)',
        experience: 17,
        rating: 4.8,
        availableDays: ['Tue', 'Wed', 'Thu', 'Sat'],
        slotDuration: 25,
        startTime: '10:00',
        endTime: '17:00',
        avatar: 'LC',
      },
    ],
  },
]

export function getHospitalById(id: string): Hospital | undefined {
  return HOSPITALS.find((h) => h.id === id)
}

export function getDoctorById(doctorId: string): { hospital: Hospital; doctor: Doctor } | undefined {
  for (const hospital of HOSPITALS) {
    const doctor = hospital.doctors.find((d) => d.id === doctorId)
    if (doctor) return { hospital, doctor }
  }
  return undefined
}
