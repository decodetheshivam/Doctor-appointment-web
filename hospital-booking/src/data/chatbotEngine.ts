import { getPatientSession } from './patientAuth'
import { HOSPITALS } from './hospitals'

// ─── Language support ─────────────────────────────────────────────────────────

export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn'

export const LANGUAGES: Record<Language, string> = {
  en: '🇮🇳 English',
  hi: '🇮🇳 हिंदी',
  mr: '🇮🇳 मराठी',
  ta: '🇮🇳 தமிழ்',
  te: '🇮🇳 తెలుగు',
  bn: '🇮🇳 বাংলা',
}

// ─── Emergency trigger phrases (multi-language) ───────────────────────────────

export const EMERGENCY_TRIGGERS: string[] = [
  // English
  'emergency', 'help me', 'sos', 'ambulance', 'urgent', 'critical',
  'heart attack', 'accident', 'unconscious', 'bleeding', 'not breathing',
  // Hindi
  'madad', 'bachao', 'mujhe madad chahiye', 'ambulance bulao',
  'मदद', 'बचाओ', 'इमरजेंसी', 'एम्बुलेंस',
  // Marathi
  'madad kara', 'врятуйте', 'मदत करा', 'रुग्णवाहिका',
  // Tamil
  'உதவி', 'உதவுங்கள்', 'அவசரநிலை',
  // Telugu
  'సహాయం', 'అత్యవసరం',
  // Bengali
  'সাহায্য', 'জরুরি',
]

export function isEmergency(text: string): boolean {
  const lower = text.toLowerCase()
  return EMERGENCY_TRIGGERS.some(t => lower.includes(t.toLowerCase()))
}

// ─── Intent types ─────────────────────────────────────────────────────────────

export type Intent =
  | 'greeting'
  | 'find_hospital'
  | 'book_appointment'
  | 'my_appointments'
  | 'medical_records'
  | 'doctors'
  | 'specialties'
  | 'emergency'
  | 'patient_login'
  | 'working_hours'
  | 'about'
  | 'language_change'
  | 'voice_help'
  | 'unknown'

// ─── Intent detection ─────────────────────────────────────────────────────────

export function detectIntent(text: string, lang: Language): Intent {
  const t = text.toLowerCase()

  if (isEmergency(t)) return 'emergency'

  // Greetings
  if (/\b(hello|hi|hey|namaste|namaskar|नमस्ते|হ্যালো|வணக்கம்|నమస్కారం)\b/.test(t)) return 'greeting'

  // Hospital finding
  if (/hospital|clinic|centre|center|अस्पताल|रुग्णालय|हॉस्पिटल|ಆಸ್ಪತ್ರೆ/.test(t)) return 'find_hospital'

  // Booking
  if (/book|appointment|schedule|slot|appoint|बुक|अपॉइंटमेंट|बुकिंग/.test(t)) return 'book_appointment'

  // My appointments
  if (/my appointment|my booking|meri appointment|मेरी अपॉइंटमेंट/.test(t)) return 'my_appointments'

  // Medical records
  if (/record|prescription|medicine|report|lab|history|रिकॉर्ड|दवा|रिपोर्ट/.test(t)) return 'medical_records'

  // Doctors
  if (/doctor|specialist|physician|डॉक्टर|विशेषज्ञ/.test(t)) return 'doctors'

  // Specialties
  if (/special|cardio|neuro|ortho|derma|pediatr|स्पेशल|विशेषता/.test(t)) return 'specialties'

  // Login
  if (/login|sign in|register|account|profile|लॉगिन|अकाउंट/.test(t)) return 'patient_login'

  // Working hours
  if (/hours|time|open|close|timing|समय|कितने बजे/.test(t)) return 'working_hours'

  // About
  if (/about|what is|who are|mediconnect|platform|के बारे में/.test(t)) return 'about'

  // Language
  if (/language|hindi|english|marathi|tamil|telugu|bengali|भाषा|हिंदी/.test(t)) return 'language_change'

  // Voice
  if (/voice|speak|listen|microphone|माइक|आवाज/.test(t)) return 'voice_help'

  return 'unknown'
}

// ─── Response templates ───────────────────────────────────────────────────────

interface ChatResponse {
  text: string
  suggestions: string[]
  action?: 'navigate' | 'emergency' | 'language'
  actionTarget?: string
}

type ResponseMap = Record<Intent, (lang: Language) => ChatResponse>

const RESPONSES: ResponseMap = {
  greeting: (lang) => ({
    text: {
      en: `👋 Hello! I'm **MediBot**, your health assistant. I can help you book appointments, find hospitals, access medical records, or handle emergencies.\n\nHow can I help you today?`,
      hi: `👋 नमस्ते! मैं **MediBot** हूँ, आपका स्वास्थ्य सहायक। मैं अपॉइंटमेंट बुक करने, अस्पताल खोजने, मेडिकल रिकॉर्ड देखने या इमरजेंसी में मदद कर सकता हूँ।\n\nआज मैं आपकी कैसे मदद कर सकता हूँ?`,
      mr: `👋 नमस्कार! मी **MediBot** आहे, तुमचा आरोग्य सहाय्यक. मी अपॉइंटमेंट बुक करण्यात, रुग्णालय शोधण्यात मदत करू शकतो.\n\nआज मी तुमची कशी मदत करू?`,
      ta: `👋 வணக்கம்! நான் **MediBot**, உங்கள் சுகாதார உதவியாளர். நான் சந்திப்புகளை பதிவு செய்ய, மருத்துவமனைகளை கண்டுபிடிக்க உதவ முடியும்.\n\nநான் உங்களுக்கு எப்படி உதவ முடியும்?`,
      te: `👋 నమస్కారం! నేను **MediBot**, మీ ఆరోగ్య సహాయకుడు. అపాయింట్‌మెంట్ బుక్ చేయడానికి, ఆస్పత్రులు వెతకడానికి సహాయం చేయగలను.\n\nనేను మీకు ఎలా సహాయం చేయగలను?`,
      bn: `👋 হ্যালো! আমি **MediBot**, আপনার স্বাস্থ্য সহকারী। আমি অ্যাপয়েন্টমেন্ট বুক করতে, হাসপাতাল খুঁজে পেতে সাহায্য করতে পারি।\n\nআজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?`,
    }[lang],
    suggestions: {
      en: ['Find a hospital', 'Book appointment', 'My appointments', '🚨 Emergency SOS'],
      hi: ['अस्पताल खोजें', 'अपॉइंटमेंट बुक करें', 'मेरी अपॉइंटमेंट', '🚨 इमरजेंसी SOS'],
      mr: ['रुग्णालय शोधा', 'अपॉइंटमेंट बुक करा', 'माझी अपॉइंटमेंट', '🚨 इमर्जन्सी SOS'],
      ta: ['மருத்துவமனை கண்டுபிடி', 'சந்திப்பு பதிவு', 'என் சந்திப்புகள்', '🚨 அவசர SOS'],
      te: ['ఆస్పత్రి వెతకండి', 'అపాయింట్‌మెంట్ బుక్', 'నా అపాయింట్‌మెంట్లు', '🚨 అత్యవసర SOS'],
      bn: ['হাসপাতাল খুঁজুন', 'অ্যাপয়েন্টমেন্ট বুক', 'আমার অ্যাপয়েন্টমেন্ট', '🚨 জরুরি SOS'],
    }[lang],
  }),

  find_hospital: (lang) => {
    const cities = [...new Set(HOSPITALS.map(h => h.city))]
    const text = lang === 'hi'
      ? `🏥 हमारे पास **${cities.length} शहरों** में **${HOSPITALS.length} पार्टनर अस्पताल** हैं — ${cities.join(', ')}।\n\nआप शहर, विशेषता या डॉक्टर के नाम से फ़िल्टर कर सकते हैं। क्या मैं आपको अस्पताल पेज पर ले जाऊं?`
      : `🏥 We have **${HOSPITALS.length} partner hospitals** across **${cities.length} cities** — ${cities.join(', ')}.\n\nYou can filter by city, specialty, or doctor name. Shall I take you to the hospitals page?`
    return {
      text,
      suggestions: lang === 'hi'
        ? ['सभी अस्पताल देखें', 'शहर से फ़िल्टर करें', 'विशेषता से खोजें', 'अपॉइंटमेंट बुक करें']
        : ['Show all hospitals', 'Filter by city', 'Filter by specialty', 'Book appointment'],
      action: 'navigate' as const,
      actionTarget: 'hospitals',
    }
  },

  book_appointment: (lang) => ({
    text: lang === 'hi'
      ? `📅 अपॉइंटमेंट बुक करने के लिए:\n\n1. **अस्पताल** चुनें\n2. **डॉक्टर** चुनें\n3. उपलब्ध **तारीख और समय** चुनें\n4. मरीज की जानकारी भरें\n5. तुरंत **टोकन नंबर के साथ पुष्टि** पाएं\n\nक्या मैं आपको शुरुआत के लिए अस्पताल पेज पर ले जाऊं?`
      : `📅 To book an appointment:\n\n1. Select a **hospital**\n2. Choose a **doctor**\n3. Pick an available **date & time slot**\n4. Fill in patient details\n5. Get instant **confirmation with token number**\n\nShall I take you to the hospitals page?`,
    suggestions: lang === 'hi'
      ? ['अस्पताल पर जाएं', 'डॉक्टर खोजें', 'मेरी अपॉइंटमेंट']
      : ['Go to hospitals', 'Find a doctor', 'My appointments'],
    action: 'navigate',
    actionTarget: 'hospitals',
  }),

  my_appointments: (lang) => {
    const patient = getPatientSession()
    return {
      text: patient
        ? (lang === 'hi'
            ? `📋 नमस्ते **${patient.name}**! आप अपनी सभी पुष्टि और पिछली अपॉइंटमेंट देख सकते हैं, आगामी रद्द कर सकते हैं या दोबारा बुक कर सकते हैं।\n\nक्या मैं आपको वहाँ ले जाऊं?`
            : `📋 Hi **${patient.name}**! You can view all your confirmed and past appointments, cancel upcoming ones, or rebook.\n\nShall I take you there?`)
        : (lang === 'hi'
            ? `📋 अपनी अपॉइंटमेंट देखने के लिए **लॉगिन** करना होगा। सिर्फ आपका मोबाइल नंबर चाहिए।\n\nक्या मैं लॉगिन पेज पर ले जाऊं?`
            : `📋 To view your appointments, you need to be **signed in**. Your mobile number is all you need.`),
      suggestions: patient
        ? (lang === 'hi' ? ['अपॉइंटमेंट देखें', 'नई बुकिंग'] : ['View my appointments', 'Book new appointment'])
        : (lang === 'hi' ? ['साइन इन करें', 'रजिस्टर करें'] : ['Sign in', 'Register']),
      action: 'navigate',
      actionTarget: patient ? 'my-appointments' : 'patient-login',
    }
  },

  medical_records: (lang) => {
    const patient = getPatientSession()
    return {
      text: lang === 'hi'
        ? `📋 मेडिकल रिकॉर्ड में आप देख सकते हैं:\n\n• **विज़िट रिकॉर्ड** — निदान, डॉक्टर नोट्स\n• **चालू दवाइयां** — वर्तमान नुस्खे\n• **पिछली दवाइयां** — विज़िट के अनुसार\n• **लैब रिपोर्ट** — सामान्य/असामान्य स्थिति के साथ\n\n${patient ? `**${patient.name}** के रिकॉर्ड मोबाइल **+91 ${patient.phone}** से देखे जा सकते हैं।` : 'रिकॉर्ड देखने के लिए अपना रजिस्टर मोबाइल नंबर डालें।'}`
        : `📋 Medical Records shows your complete health history.\n\n• **Visit records** — diagnosis, doctor notes\n• **Active medicines** — current prescriptions\n• **Lab reports** — with status`,
      suggestions: lang === 'hi'
        ? ['मेडिकल रिकॉर्ड देखें', 'चालू दवाइयां', 'लैब रिपोर्ट']
        : ['Go to medical records', 'View medicines', 'View lab reports'],
      action: 'navigate',
      actionTarget: 'medical-records',
    }
  },

  doctors: (lang) => {
    // This returns a generic response — specialty-specific is handled in getChatResponse
    return {
      text: lang === 'hi'
        ? `👨‍⚕️ हमारे पास **40+ विशेषताओं** में **${HOSPITALS.flatMap(h => h.doctors).length}+ सत्यापित डॉक्टर** हैं।\n\nआप:\n• नाम या विशेषता से खोज सकते हैं\n• योग्यता और अनुभव देख सकते हैं\n• उपलब्ध दिन जांच सकते हैं\n• सीधे प्रोफाइल से बुक कर सकते हैं`
        : `👨‍⚕️ We have **${HOSPITALS.flatMap(h => h.doctors).length}+ verified doctors** across **40+ specialties**.\n\nSearch by name or specialty, view qualifications, check available days, book directly.`,
      suggestions: lang === 'hi'
        ? ['सभी डॉक्टर देखें', 'कार्डियोलॉजिस्ट', 'न्यूरोलॉजिस्ट', 'हड्डी विशेषज्ञ']
        : ['Browse all doctors', 'Cardiologist', 'Neurologist', 'Orthopedic'],
      action: 'navigate',
      actionTarget: 'doctors',
    }
  },

  specialties: (lang) => ({
    text: lang === 'hi'
      ? `🔬 MediConnect में **20+ मेडिकल विशेषताएं** हैं:\n\nकार्डियोलॉजी ❤️ · न्यूरोलॉजी 🧠 · ऑर्थोपेडिक्स 🦴 · ऑन्कोलॉजी 🔬 · बाल रोग 👶 · त्वचा रोग 🧴 · मनोचिकित्सा 🧘 · गैस्ट्रोएंटरोलॉजी · स्त्री रोग · ENT · और अधिक।\n\nआप कौन सी विशेषता ढूंढ रहे हैं?`
      : `🔬 MediConnect covers **20+ medical specialties** including Cardiology, Neurology, Orthopedics, Oncology, Pediatrics, Dermatology, Psychiatry and more.\n\nWhich specialty are you looking for?`,
    suggestions: lang === 'hi'
      ? ['कार्डियोलॉजी', 'न्यूरोलॉजी', 'ऑर्थोपेडिक्स', 'सभी विशेषताएं']
      : ['Cardiology', 'Neurology', 'Orthopedics', 'See all specialties'],
    action: 'navigate',
    actionTarget: 'specialties',
  }),

  emergency: (_lang) => ({
    text: `🚨 **EMERGENCY DETECTED!**\n\nPress the red SOS button below to immediately dispatch an ambulance to your live location.\n\nIf you are signed in, ambulance will be dispatched and your emergency contacts will be notified **automatically** with your GPS location.`,
    suggestions: ['🚨 Dispatch Ambulance NOW', 'Call 112', 'Call 108 (Ambulance)'],
    action: 'emergency',
  }),

  patient_login: (_lang) => ({
    text: `🔐 Sign in to unlock all features:\n\n✅ One-tap Emergency SOS\n✅ Auto-fill your details in bookings\n✅ Access your medical records\n✅ View appointment history\n\nYour **mobile number** is your login — no password needed.`,
    suggestions: ['Sign in / Register', 'Continue without login'],
    action: 'navigate',
    actionTarget: 'patient-login',
  }),

  working_hours: () => ({
    text: `🕐 **MediConnect is available 24/7** for online bookings.\n\nHospital timings vary by facility:\n• Most hospitals: 8 AM – 9 PM\n• Emergency services: 24/7\n• Doctor consultations: As per doctor schedule\n\nCheck individual hospital pages for exact timings.`,
    suggestions: ['Find hospitals', 'Book appointment', 'Emergency SOS'],
  }),

  about: () => ({
    text: `ℹ️ **MediConnect** is India's smart hospital appointment platform.\n\n🏥 **200+ partner hospitals**\n👨‍⚕️ **1,800+ verified doctors**\n📅 **50,000+ appointments booked**\n🌆 **25+ cities covered**\n\nBook any doctor, at any hospital, in under 2 minutes — no calls, no queues.`,
    suggestions: ['Find hospitals', 'Book appointment', 'Learn how it works'],
  }),

  language_change: (lang) => ({
    text: {
      en: `🌐 I currently support **6 languages**: English, हिंदी, मराठी, தமிழ், తెలుగు, বাংলা.\n\nUse the language selector (🌐) above to switch. I'll respond in your chosen language.`,
      hi: `🌐 मैं अभी **6 भाषाओं** में उत्तर दे सकता हूँ: English, हिंदी, मराठी, தமிழ், తెలుగు, বাংলা.\n\nऊपर 🌐 बटन से भाषा बदलें।`,
      mr: `🌐 मी सध्या **6 भाषांमध्ये** उत्तर देऊ शकतो.\n\nवरील 🌐 बटणाने भाषा बदला.`,
      ta: `🌐 நான் தற்போது **6 மொழிகளில்** பதிலளிக்கிறேன்.\n\nமேலே உள்ள 🌐 பொத்தானைப் பயன்படுத்தவும்.`,
      te: `🌐 నేను ప్రస్తుతం **6 భాషలలో** సమాధానం ఇవ్వగలను.\n\nపైన 🌐 బటన్ ఉపయోగించండి.`,
      bn: `🌐 আমি এখন **৬টি ভাষায়** উত্তর দিতে পারি.\n\nউপরে 🌐 বোতাম ব্যবহার করুন।`,
    }[lang],
    suggestions: ['English', 'हिंदी', 'मराठी', 'தமிழ்'],
    action: 'language',
  }),

  voice_help: () => ({
    text: `🎤 **Voice Commands** are enabled!\n\nYou can say:\n• **"Find hospital"** — search hospitals\n• **"Book appointment"** — start booking\n• **"My appointments"** — view bookings\n• **"Emergency"** / **"बचाओ"** / **"மदद"** — trigger SOS\n• **"Doctors"** — browse doctors\n\nPress the 🎤 mic button and speak clearly.`,
    suggestions: ['Try voice now', 'Find hospital', '🚨 Emergency SOS'],
  }),

  unknown: (lang) => ({
    text: {
      en: `🤔 I'm not sure about that. I can help you with:\n\n• 🏥 Finding hospitals\n• 📅 Booking appointments\n• 📋 Medical records\n• 🚨 Emergency SOS\n• 👨‍⚕️ Finding doctors\n\nWhat would you like to do?`,
      hi: `🤔 मुझे समझ नहीं आया। मैं इनमें मदद कर सकता हूँ:\n\n• 🏥 अस्पताल खोजना\n• 📅 अपॉइंटमेंट बुक करना\n• 🚨 इमरजेंसी SOS\n\nआप क्या करना चाहते हैं?`,
      mr: `🤔 मला समजले नाही. मी या गोष्टींमध्ये मदत करू शकतो.\n\nतुम्हाला काय करायचे आहे?`,
      ta: `🤔 எனக்கு புரியவில்லை. நான் இவற்றில் உதவ முடியும்.\n\nநீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?`,
      te: `🤔 నాకు అర్థం కాలేదు. నేను ఇవి చేయడంలో సహాయపడగలను.\n\nమీరు ఏమి చేయాలనుకుంటున్నారు?`,
      bn: `🤔 আমি বুঝতে পারিনি। আমি এইগুলিতে সাহায্য করতে পারি.\n\nআপনি কী করতে চান?`,
    }[lang],
    suggestions: {
      en: ['Find hospital', 'Book appointment', '🚨 Emergency SOS', 'Medical records'],
      hi: ['अस्पताल खोजें', 'अपॉइंटमेंट बुक', '🚨 इमरजेंसी', 'मेडिकल रिकॉर्ड'],
      mr: ['रुग्णालय शोधा', 'अपॉइंटमेंट', '🚨 इमर्जन्सी', 'रेकॉर्ड'],
      ta: ['மருத்துவமனை', 'சந்திப்பு', '🚨 அவசரம்', 'பதிவுகள்'],
      te: ['ఆస్పత్రి', 'అపాయింట్‌మెంట్', '🚨 అత్యవసరం', 'రికార్డులు'],
      bn: ['হাসপাতাল', 'অ্যাপয়েন্টমেন্ট', '🚨 জরুরি', 'রেকর্ড'],
    }[lang],
  }),
}

// ─── Main engine function ─────────────────────────────────────────────────────

export function getChatResponse(userText: string, lang: Language): ChatResponse {
  const intent = detectIntent(userText, lang)

  // ── Specialty-specific doctor search ──
  if (intent === 'doctors' || intent === 'specialties' || /doctor|डॉक्टर|specialist|specialist/i.test(userText)) {
    const specialty = extractSpecialty(userText)
    if (specialty) {
      const matched = HOSPITALS.flatMap(h =>
        h.doctors
          .filter(d => d.specialty === specialty)
          .map(d => ({ ...d, hospitalName: h.name, hospitalCity: h.city }))
      )
      if (matched.length > 0) {
        const doctorList = matched
          .slice(0, 5)
          .map(d => `• **${d.name}** (${d.experience}y exp · ⭐${d.rating}) — ${d.hospitalName}, ${d.hospitalCity}`)
          .join('\n')

        const text = lang === 'hi'
          ? `👨‍⚕️ **${specialty}** के लिए **${matched.length} डॉक्टर** मिले:\n\n${doctorList}\n\nक्या मैं आपको डॉक्टर पेज पर ले जाऊं जहाँ आप सीधे बुक कर सकते हैं?`
          : `👨‍⚕️ Found **${matched.length} doctors** for **${specialty}**:\n\n${doctorList}\n\nShall I take you to the doctors page to book directly?`

        return {
          text,
          suggestions: lang === 'hi'
            ? ['डॉक्टर पेज खोलें', 'अपॉइंटमेंट बुक करें', 'दूसरी विशेषता']
            : ['Open doctors page', 'Book appointment', 'Other specialty'],
          action: 'navigate',
          actionTarget: 'doctors',
        }
      } else {
        return {
          text: lang === 'hi'
            ? `😔 फिलहाल **${specialty}** के लिए कोई डॉक्टर उपलब्ध नहीं है। हमारे सभी डॉक्टर देखें।`
            : `😔 No doctors found for **${specialty}** currently. Browse all available doctors.`,
          suggestions: lang === 'hi' ? ['सभी डॉक्टर देखें'] : ['Browse all doctors'],
          action: 'navigate',
          actionTarget: 'doctors',
        }
      }
    }
  }

  return RESPONSES[intent](lang)
}

export function getSuggestionResponse(suggestion: string, lang: Language): ChatResponse {
  if (suggestion.includes('Emergency') || suggestion.includes('SOS') || suggestion.includes('इमरजेंसी') ||
      suggestion.includes('அவசர') || suggestion.includes('అత్యవసర') || suggestion.includes('জরুরি')) {
    return RESPONSES.emergency(lang)
  }
  return getChatResponse(suggestion, lang)
}

// ─── Extract specialty from text ─────────────────────────────────────────────

const SPECIALTY_MAP: Record<string, string[]> = {
  'Cardiology':        ['cardio', 'heart', 'cardiac', 'cardiologist', 'दिल', 'हृदय', 'कार्डियो'],
  'Neurology':         ['neuro', 'brain', 'neurology', 'neurologist', 'दिमाग', 'मस्तिष्क', 'न्यूरो'],
  'Orthopedics':       ['ortho', 'bone', 'joint', 'knee', 'spine', 'orthopedic', 'हड्डी', 'जोड़'],
  'Oncology':          ['cancer', 'oncology', 'oncologist', 'tumor', 'कैंसर'],
  'Pediatrics':        ['child', 'baby', 'pediatric', 'kids', 'paed', 'बच्चा', 'बच्चे', 'शिशु'],
  'Dermatology':       ['skin', 'derma', 'dermatologist', 'rash', 'त्वचा', 'स्किन'],
  'Psychiatry':        ['mental', 'psychiatry', 'psychiatrist', 'anxiety', 'depression', 'मानसिक', 'मनोचिकित्सक'],
  'Gastroenterology':  ['gastro', 'stomach', 'liver', 'digestion', 'gut', 'पेट', 'लिवर'],
  'Gynecology':        ['gynae', 'gynecology', 'womens', 'women', 'pregnancy', 'महिला', 'स्त्री रोग'],
  'Ophthalmology':     ['eye', 'eyes', 'ophthalmology', 'vision', 'आंख', 'नेत्र'],
  'ENT':               ['ear', 'nose', 'throat', 'ent', 'कान', 'नाक', 'गला'],
  'General Medicine':  ['general', 'fever', 'common', 'physician', 'general doctor', 'बुखार', 'सामान्य'],
  'Radiology':         ['xray', 'x-ray', 'scan', 'mri', 'ct scan', 'radiology'],
  'Nephrology':        ['kidney', 'renal', 'nephro', 'गुर्दा'],
  'Robotic Surgery':   ['robotic', 'surgery', 'सर्जरी'],
  'Cardiac Surgery':   ['cardiac surgery', 'bypass', 'heart surgery', 'ओपन हार्ट'],
}

export function extractSpecialty(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [specialty, keywords] of Object.entries(SPECIALTY_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return specialty
  }
  return null
}

export function detectLanguage(text: string): Language {
  // Hindi Unicode range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  // Marathi shares Devanagari but common Marathi words
  if (/[\u0900-\u097F]/.test(text) && /आहे|करा|माझ/.test(text)) return 'mr'
  // Tamil: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  // Telugu: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  // Bengali: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  // Hinglish detection (Roman Hindi words)
  if (/\b(kya|hai|nahi|hoga|karo|chahiye|doctor|avail|batao|kaise|mujhe|aapka|bhai|yaar|kal|abhi)\b/i.test(text)) return 'hi'
  return 'en'
}

// ─── Greeting message ─────────────────────────────────────────────────────────

export function getWelcomeMessage(lang: Language): ChatResponse {
  return RESPONSES.greeting(lang)
}
