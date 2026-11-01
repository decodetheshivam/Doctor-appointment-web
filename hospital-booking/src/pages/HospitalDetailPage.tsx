import { useApp } from '../context/AppContext'
import { getHospitalById } from '../data/hospitals'

export default function HospitalDetailPage() {
  const { selectedHospitalId, navigate } = useApp()
  const hospital = getHospitalById(selectedHospitalId ?? '')

  if (!hospital) {
    return (
      <div className="min-h-screen bg-[#030d18] flex items-center justify-center">
        <p className="text-white/50 font-inter">Hospital not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('hospitals')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Hospitals
        </button>

        {/* Hero banner */}
        <div className={`w-full h-48 rounded-2xl bg-gradient-to-br ${hospital.image} flex items-end p-8 mb-8`}>
          <div>
            <h1 className="font-instrument text-white text-3xl md:text-5xl">{hospital.name}</h1>
            <p className="text-white/70 font-inter text-sm mt-1 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 11S2 7.7 2 5a4 4 0 018 0c0 2.7-4 6-4 6z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="5" r="1.2" fill="currentColor" />
              </svg>
              {hospital.location}
            </p>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Rating', value: `⭐ ${hospital.rating}` },
            { label: 'Beds', value: hospital.beds.toString() },
            { label: 'Established', value: hospital.established.toString() },
            { label: 'Doctors', value: hospital.doctors.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center">
              <p className="text-white font-inter font-semibold text-lg">{value}</p>
              <p className="text-white/40 font-inter text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Specialties */}
        <div className="mb-10">
          <h2 className="text-white/50 font-inter text-xs tracking-[0.15em] uppercase mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.specialties.map((s) => (
              <span key={s} className="bg-white/6 border border-white/10 text-white/70 text-sm font-inter px-4 py-1.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Doctors */}
        <div>
          <h2 className="text-white font-instrument text-2xl md:text-3xl mb-6">
            Available <span className="italic">Doctors</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hospital.doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/20 rounded-2xl p-6 transition-all duration-300"
              >
                {/* Doctor header */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${hospital.image} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-inter font-semibold text-base">{doctor.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-inter font-semibold text-base">{doctor.name}</h3>
                    <p className="text-white/50 text-sm font-inter">{doctor.specialty}</p>
                    <p className="text-white/30 text-xs font-inter mt-0.5">{doctor.qualification}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#fbbf24">
                      <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 9l.5-2.9-2.1-2 2.9-.4L6 1z" />
                    </svg>
                    <span className="text-yellow-400 text-xs font-inter">{doctor.rating}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-white/4 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] font-inter uppercase tracking-wide">Experience</p>
                    <p className="text-white font-inter text-sm font-medium mt-0.5">{doctor.experience} years</p>
                  </div>
                  <div className="bg-white/4 rounded-xl p-3">
                    <p className="text-white/40 text-[10px] font-inter uppercase tracking-wide">Slot</p>
                    <p className="text-white font-inter text-sm font-medium mt-0.5">{doctor.slotDuration} min</p>
                  </div>
                </div>

                {/* Available days */}
                <div className="flex gap-1.5 mt-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <span
                      key={day}
                      className={`text-[10px] font-inter px-2 py-1 rounded-md ${
                        doctor.availableDays.includes(day)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/4 text-white/20 border border-white/6'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>

                {/* Book button */}
                <button
                  onClick={() =>
                    navigate('book', {
                      selectedHospitalId: hospital.id,
                      selectedDoctorId: doctor.id,
                    })
                  }
                  className="w-full mt-5 bg-white text-[#030d18] py-3 rounded-xl font-inter font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-200 button-glow"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
