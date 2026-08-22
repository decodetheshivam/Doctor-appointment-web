import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getChatResponse, getSuggestionResponse, getWelcomeMessage,
  isEmergency, LANGUAGES, detectLanguage,
  type Language,
} from '../data/chatbotEngine'
import { getPatientSession } from '../data/patientAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'bot' | 'user'
  text: string
  time: string
  suggestions?: string[]
  action?: string
  actionTarget?: string
  isEmergency?: boolean
}

interface Props {
  onNavigate: (page: string) => void
  onEmergency: (autoDispatch?: boolean) => void
}

// ─── Speech API types ─────────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: { 0: { 0: { transcript: string } }; length: number }
}
interface SpeechRecognitionAPI extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
declare const SpeechRecognition: new () => SpeechRecognitionAPI
declare const webkitSpeechRecognition: new () => SpeechRecognitionAPI
const SpeechAPI = typeof SpeechRecognition !== 'undefined' ? SpeechRecognition
               : typeof webkitSpeechRecognition !== 'undefined' ? webkitSpeechRecognition
               : null

const LANG_LOCALE: Record<Language, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msgId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

// Speak text; returns a promise that resolves ONLY when speech ends
function speakAsync(text: string, lang: Language): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    window.speechSynthesis.cancel()
    // Short pause to let cancel() take effect
    setTimeout(() => {
      const clean = text.replace(/\*\*/g, '').replace(/\n/g, '। ').slice(0, 250)
      const utt = new SpeechSynthesisUtterance(clean)
      utt.lang = LANG_LOCALE[lang]
      utt.rate = 0.90
      utt.pitch = 1.0
      let resolved = false
      const done = () => { if (!resolved) { resolved = true; resolve() } }
      utt.onend   = done
      utt.onerror = done
      // Safety fallback — 150ms per character max
      const fallback = setTimeout(done, Math.max(clean.length * 100, 2500))
      utt.onend = () => { clearTimeout(fallback); done() }
      window.speechSynthesis.speak(utt)
    }, 80)
  })
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i} className="block leading-relaxed">
        {parts.map((p, j) => j % 2 === 1
          ? <strong key={j} className="text-white font-semibold">{p}</strong>
          : p
        )}
      </span>
    )
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChatbot({ onNavigate, onEmergency }: Props) {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [lang, setLang]             = useState<Language>('hi')
  const [listening, setListening]   = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [typing, setTyping]         = useState(false)
  const [pulse, setPulse]           = useState(false)
  const [navigating, setNavigating] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null)
  const patient        = getPatientSession()

  useEffect(() => {
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1200) }, 9000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      const w = getWelcomeMessage(lang)
      setMessages([{ id: msgId(), role: 'bot', text: w.text, time: now(), suggestions: w.suggestions }])
      if (voiceEnabled) speakAsync(w.text, lang)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (!open) { window.speechSynthesis?.cancel(); recognitionRef.current?.stop() }
  }, [open])

  // ── Core send logic ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || navigating) return

    // Auto-detect language from user input — ALWAYS use detected lang for both reply AND speech
    const activeLang = detectLanguage(text)
    if (activeLang !== lang) setLang(activeLang)

    setMessages(prev => [...prev, { id: msgId(), role: 'user', text: text.trim(), time: now() }])
    setInput('')
    setTyping(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 300))
    setTyping(false)

    // ── Emergency — speak SHORT phrase only, then trigger immediately ──
    if (isEmergency(text)) {
      const shortPhrase = activeLang === 'hi' ? 'इमरजेंसी डिटेक्ट हुई!' : 'Emergency detected!'
      const botMsg: Message = {
        id: msgId(), role: 'bot', isEmergency: true, time: now(),
        text: activeLang === 'hi'
          ? `🚨 **इमरजेंसी डिटेक्ट हुई!**\n\nएम्बुलेंस भेजी जा रही है...`
          : `🚨 **Emergency detected!**\n\nDispatching ambulance...`,
        suggestions: [],
        action: 'emergency',
      }
      setMessages(prev => [...prev, botMsg])
      if (voiceEnabled) await speakAsync(shortPhrase, activeLang)
      onEmergency(true)
      setOpen(false)
      return
    }

    const resp = getChatResponse(text, activeLang)
    const botMsg: Message = {
      id: msgId(), role: 'bot', text: resp.text, time: now(),
      suggestions: resp.suggestions, action: resp.action, actionTarget: resp.actionTarget,
    }
    setMessages(prev => [...prev, botMsg])

    // Speak FULLY in detected language FIRST — then navigate
    if (voiceEnabled && resp.action === 'navigate' && resp.actionTarget) {
      setNavigating(true)
      await speakAsync(resp.text, activeLang)
      setNavigating(false)
      onNavigate(resp.actionTarget)
      setOpen(false)
    } else if (voiceEnabled) {
      speakAsync(resp.text, activeLang)
    } else if (resp.action === 'navigate' && resp.actionTarget) {
      setTimeout(() => { onNavigate(resp.actionTarget!); setOpen(false) }, 2200)
    }

    if (resp.action === 'emergency') {
      if (voiceEnabled) {
        await speakAsync(activeLang === 'hi' ? 'इमरजेंसी SOS' : 'Emergency SOS', activeLang)
      }
      onEmergency()
    }
  }, [lang, voiceEnabled, onNavigate, onEmergency, navigating])

  function handleSuggestion(s: string) {
    if (s.includes('🚨') || s === 'Call 112' || s === 'Call 108'
        || s.includes('Emergency SOS') || s.includes('इमरजेंसी')
        || s.includes('அவசர') || s.includes('అత్యవసర')) {
      setMessages(prev => [...prev, { id: msgId(), role: 'user', text: s, time: now() }])
      setTimeout(() => { onEmergency(); setOpen(false) }, 300)
      return
    }
    sendMessage(s)
  }

  function changeLang(l: Language) {
    setLang(l); setShowLangMenu(false)
    const w = getWelcomeMessage(l)
    setMessages([{ id: msgId(), role: 'bot', text: w.text, time: now(), suggestions: w.suggestions }])
    if (voiceEnabled) speakAsync(w.text, l)
  }

  function startVoice() {
    if (!SpeechAPI) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SpeechAPI()
    // Use both English and Hindi detection
    rec.lang = 'hi-IN,en-IN'
    rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend   = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript
      setInput(t)
      setTimeout(() => sendMessage(t), 150)
    }
    recognitionRef.current = rec
    rec.start()
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const chatWindow = open ? (
    <div
      className="fixed bottom-[88px] right-4 md:right-6 z-[400] flex flex-col
                 w-[93vw] max-w-[390px] h-[600px] max-h-[82vh] overflow-hidden rounded-2xl"
      style={{
        animation: 'chatbot-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        background: 'linear-gradient(145deg, #040f1e 0%, #071828 100%)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07), 0 0 40px rgba(10,66,103,0.3)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #0A3255 0%, #0d4a7a 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          {/* Animated avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-400/10
                            border border-white/15 flex items-center justify-center text-xl">
              🤖
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full
                             border-2 border-[#0A3255] flex items-center justify-center">
              <span className="w-1 h-1 bg-white rounded-full"/>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-inter font-bold text-sm tracking-wide">MediBot</p>
              <span className="bg-emerald-400/20 text-emerald-400 text-[9px] font-inter px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                AI
              </span>
            </div>
            <p className="text-white/45 font-inter text-[10px]">
              {patient ? `${patient.name} · ` : ''}{LANGUAGES[lang]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* TTS toggle */}
          <button onClick={() => { window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v) }}
            title={voiceEnabled ? 'Mute' : 'Unmute'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all text-xs
                       ${voiceEnabled ? 'bg-white/12 text-white' : 'text-white/30 hover:text-white hover:bg-white/8'}`}>
            {voiceEnabled ? '🔊' : '🔇'}
          </button>

          {/* Language picker */}
          <div className="relative">
            <button onClick={() => setShowLangMenu(v => !v)}
              className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-white flex items-center
                         justify-center transition-all text-xs font-bold">
              🌐
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-1 w-44 rounded-xl overflow-hidden z-10 shadow-2xl"
                   style={{ background: '#071828', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(Object.entries(LANGUAGES) as [Language, string][]).map(([l, label]) => (
                  <button key={l} onClick={() => changeLang(l)}
                    className={`w-full text-left px-3.5 py-2.5 font-inter text-xs transition-all flex items-center gap-2
                               ${lang === l ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/6 hover:text-white'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${lang === l ? 'bg-emerald-400' : 'bg-white/20'}`}/>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close */}
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Emergency strip ── */}
      <button onClick={() => { onEmergency(); setOpen(false) }}
        className="shrink-0 w-full flex items-center justify-center gap-2 py-2.5 text-[11px]
                   font-inter font-bold tracking-widest uppercase transition-all group"
        style={{ background: 'linear-gradient(90deg, #7f0000 0%, #b91c1c 50%, #7f0000 100%)', backgroundSize: '200% 100%', animation: 'shimmer-bg 2s linear infinite', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"/>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"/>
        </span>
        <span className="text-white drop-shadow">🚨 Emergency SOS — One Tap</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"/>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"/>
        </span>
      </button>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Bot avatar on left */}
            {msg.role === 'bot' && (
              <div className={`w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-sm
                              ${msg.isEmergency ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/8 border border-white/10'}`}>
                {msg.isEmergency ? '🚨' : '🤖'}
              </div>
            )}

            <div className="flex flex-col gap-1.5 max-w-[82%]">
              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-inter
                           ${msg.role === 'user'
                             ? 'text-white rounded-tr-sm'
                             : msg.isEmergency
                             ? 'text-white rounded-tl-sm'
                             : 'text-white/90 rounded-tl-sm'}`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #0A4267 0%, #1a6ca0 100%)', boxShadow: '0 2px 12px rgba(10,66,103,0.4)' }
                  : msg.isEmergency
                  ? { background: 'rgba(127,0,0,0.35)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }
                  : { background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {renderText(msg.text)}
                <p className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-white/35 text-right' : 'text-white/25'}`}>
                  {msg.time}
                </p>
              </div>

              {/* Suggestions */}
              {msg.role === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestions.map((s) => (
                    <button key={s} onClick={() => handleSuggestion(s)}
                      className={`text-[11px] font-inter px-3 py-1.5 rounded-full border transition-all duration-150
                                 ${s.includes('🚨') || s.toLowerCase().includes('sos') || s.toLowerCase().includes('emergency') || s.toLowerCase().includes('इमरजेंसी')
                                   ? 'text-red-300 hover:bg-red-500/20'
                                   : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                      style={s.includes('🚨') || s.toLowerCase().includes('emergency') || s.toLowerCase().includes('इमरजेंसी')
                        ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User avatar on right */}
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs
                              font-inter font-bold"
                   style={{ background: 'linear-gradient(135deg, #0A4267, #20658E)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {patient ? patient.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-sm shrink-0">
              🤖
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
                 style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}/>
              ))}
            </div>
          </div>
        )}

        {/* Navigating indicator */}
        {navigating && (
          <div className="flex justify-center">
            <span className="text-white/30 font-inter text-[10px] flex items-center gap-1.5">
              <svg className="animate-spin" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="16" strokeDashoffset="6"/>
              </svg>
              Speaking... then navigating
            </span>
          </div>
        )}

        <div ref={messagesEndRef}/>
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 px-3 py-3 flex items-center gap-2"
           style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(4,15,30,0.8)' }}>
        {/* Mic */}
        <button onClick={startVoice}
          title={listening ? 'Stop' : 'Speak'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 relative
                     ${listening ? 'bg-red-500 text-white' : 'bg-white/6 text-white/50 hover:bg-white/12 hover:text-white'}`}
          style={listening ? { boxShadow: '0 0 12px rgba(239,68,68,0.5)' } : {}}>
          {listening && <span className="absolute inset-0 rounded-xl bg-red-400/20 animate-ping"/>}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M2 8a6 6 0 0012 0M8 14v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={listening ? '🎤 सुन रहा हूँ...' : lang === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) sendMessage(input) }}
          className="flex-1 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none rounded-xl px-4 py-2.5 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />

        {/* Send */}
        <button onClick={() => { if (input.trim()) sendMessage(input) }}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-25"
          style={{ background: 'linear-gradient(135deg, #0A4267 0%, #1a6ca0 100%)', boxShadow: '0 2px 8px rgba(10,66,103,0.4)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {!SpeechAPI && (
        <p className="text-white/18 font-inter text-[9px] text-center pb-2 shrink-0">
          Voice: Chrome / Edge only
        </p>
      )}
    </div>
  ) : null

  // ── Floating bubble ──
  const bubble = (
    <button
      onClick={() => setOpen(v => !v)}
      title="MediBot"
      className={`fixed bottom-5 right-4 md:right-6 z-[400] w-[58px] h-[58px] rounded-2xl
                  flex items-center justify-center transition-all duration-300
                  hover:scale-110 active:scale-95 ${pulse ? 'scale-[1.08]' : ''}`}
      style={{
        background: open
          ? 'linear-gradient(135deg, #0A3255, #0d4a7a)'
          : 'linear-gradient(135deg, #0A4267 0%, #1e7ab8 100%)',
        boxShadow: open
          ? '0 4px 20px rgba(10,66,103,0.5)'
          : '0 6px 24px rgba(10,66,103,0.6), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(30,122,184,0.2)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {open ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <span className="text-2xl" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>🤖</span>
      )}

      {/* Notification badge */}
      {!open && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#dc2626', border: '2px solid #030d18', boxShadow: '0 0 8px rgba(220,38,38,0.6)' }}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>
        </span>
      )}

      {/* Tooltip */}
      {!open && (
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#071828] text-white text-[11px]
                         font-inter px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 hover:opacity-0
                         pointer-events-none border border-white/10 shadow-xl"
              style={{ transition: 'opacity 0.2s' }}>
          MediBot — AI Health Assistant
        </span>
      )}
    </button>
  )

  return createPortal(<>{chatWindow}{bubble}</>, document.body)
}
