import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getChatResponse, getWelcomeMessage,
  isEmergency, LANGUAGES, detectLanguage,
  type Language,
} from '../data/chatbotEngine'
import { getPatientSession, getChatLanguage } from '../data/patientAuth'

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

function speakAsync(text: string, lang: Language): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    window.speechSynthesis.cancel()
    setTimeout(() => {
      const clean = text.replace(/\*\*/g, '').replace(/\n/g, '। ').slice(0, 250)
      const utt = new SpeechSynthesisUtterance(clean)
      utt.lang = LANG_LOCALE[lang]
      utt.rate = 1.05
      utt.pitch = 1.0
      let resolved = false
      const done = () => { if (!resolved) { resolved = true; resolve() } }
      utt.onend   = done
      utt.onerror = done
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
          ? <strong key={j} className="font-semibold text-white">{p}</strong>
          : <span key={j}>{p}</span>
        )}
      </span>
    )
  })
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const iconCls = 'shrink-0'

const BotAvatarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${iconCls}`}>
    <rect x="4" y="7" width="16" height="13" rx="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="9.5" cy="13.5" r="1.3" fill="currentColor"/>
    <circle cx="14.5" cy="13.5" r="1.3" fill="currentColor"/>
    <path d="M12 7V4.5M10 4.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 14H2.5M21.5 14H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ChatIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CloseIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${iconCls}`}>
    <path d="M4 12L20 5l-5.5 15-3-6.5L4 12z"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${iconCls}`}>
    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 11a7 7 0 0014 0M12 18v3"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const VolumeOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${iconCls}`}>
    <path d="M11 5L6 9H3v6h3l5 4V5z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 8.5a5 5 0 010 7M18 6a9 9 0 010 12"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const VolumeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${iconCls}`}>
    <path d="M11 5L6 9H3v6h3l5 4V5z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 9l5 6M21 9l-5 6"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${iconCls}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
      stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
      strokeDasharray="40" strokeDashoffset="20" strokeLinecap="round"/>
  </svg>
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChatbot({ onNavigate, onEmergency }: Props) {
  const [open, setOpen]                 = useState(false)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [lang, setLang]                 = useState<Language>(() => {
    const saved = getChatLanguage()
    if (saved && saved in LANGUAGES) return saved as Language
    return 'en'
  })  // ← reads user's preferred language from registration
  const [listening, setListening]       = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [typing, setTyping]             = useState(false)
  const [navigating, setNavigating]     = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null)
  const patient        = getPatientSession()

  useEffect(() => {
    if (open && messages.length === 0) {
      const w = getWelcomeMessage(lang)
      setMessages([{ id: msgId(), role: 'bot', text: w.text, time: now(), suggestions: w.suggestions }])
      if (voiceEnabled) speakAsync(w.text, lang)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (!open) { window.speechSynthesis?.cancel(); recognitionRef.current?.stop() }
  }, [open])

  // ── Core send logic ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || navigating) return

    const activeLang = detectLanguage(text)
    if (activeLang !== lang) setLang(activeLang)

    setMessages(prev => [...prev, { id: msgId(), role: 'user', text: text.trim(), time: now() }])
    setInput('')
    setTyping(true)

    await new Promise(r => setTimeout(r, 600 + Math.random() * 300))
    setTyping(false)

    // ── Emergency — speak short phrase, then trigger ──
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
    rec.lang = 'en-IN,hi-IN'
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
      className="fixed bottom-[84px] right-4 md:right-6 z-[400] flex flex-col
                 w-[92vw] max-w-[380px] h-[580px] max-h-[80vh] overflow-hidden rounded-3xl"
      style={{
        animation: 'chatbot-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        background: 'linear-gradient(160deg, #0a1628 0%, #0d1f33 100%)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 px-4 py-3.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #0f2942 0%, #143656 100%)' }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                 style={{ background: 'linear-gradient(135deg, #1a6ca0, #2563eb)' }}>
              <BotAvatarIcon />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full
                             border-2 border-[#0f2942]"/>
          </div>
          <div>
            <p className="text-white font-inter font-semibold text-sm leading-tight">MediBot</p>
            <p className="text-emerald-400/80 font-inter text-[10px] flex items-center gap-1 leading-tight mt-0.5">
              {patient ? `${patient.name.split(' ')[0]} · ` : ''}Online now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* TTS toggle */}
          <button
            onClick={() => { window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v) }}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                       ${voiceEnabled ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
          >
            {voiceEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
          </button>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(v => !v)}
              title="Change language"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white
                         flex items-center justify-center transition-all"
            >
              <GlobeIcon />
            </button>
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setShowLangMenu(false)} />
                <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl overflow-hidden z-10 shadow-2xl"
                     style={{ background: '#0d1f33', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {(Object.entries(LANGUAGES) as [Language, string][]).map(([l, label]) => (
                    <button key={l} onClick={() => changeLang(l)}
                      className={`w-full text-left px-3.5 py-2.5 font-inter text-xs transition-all flex items-center gap-2
                                 ${lang === l ? 'bg-white/8 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${lang === l ? 'bg-emerald-400' : 'bg-white/20'}`}/>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Close */}
          <button onClick={() => setOpen(false)}
            title="Close"
            className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10
                       flex items-center justify-center transition-all">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Emergency strip ── */}
      <button
        onClick={() => { onEmergency(); setOpen(false) }}
        className="shrink-0 w-full flex items-center justify-center gap-2 py-2 text-[11px]
                   font-inter font-semibold tracking-wide transition-colors hover:bg-red-500/10"
        style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"/>
        </span>
        <span className="text-red-300">Emergency SOS</span>
        <span className="text-red-400/30">·</span>
        <span className="text-red-300/50">One tap to dispatch</span>
      </button>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`msg-anim flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Bot avatar */}
            {msg.role === 'bot' && (
              <div className={`w-8 h-8 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-white
                              ${msg.isEmergency ? 'bg-red-500/15' : ''}`}
                   style={msg.isEmergency
                     ? { background: 'rgba(239,68,68,0.12)' }
                     : { background: 'linear-gradient(135deg, #1a6ca0, #2563eb)' }}>
                {msg.isEmergency ? '🚨' : <BotAvatarIcon />}
              </div>
            )}

            <div className="flex flex-col gap-1.5 max-w-[80%]">
              {/* Bubble */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm font-inter
                           ${msg.role === 'user' ? 'text-white rounded-tr-md' : 'text-white/90 rounded-tl-md'}`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #0A4267 0%, #1a6ca0 100%)' }
                  : msg.isEmergency
                  ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {renderText(msg.text)}
                <p className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-white/35 text-right' : 'text-white/25'}`}>
                  {msg.time}
                </p>
              </div>

              {/* Suggestions */}
              {msg.role === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {msg.suggestions.map((s) => {
                    const isSOS = s.includes('🚨') || s.toLowerCase().includes('sos') || s.toLowerCase().includes('emergency') || s.includes('इमरजेंसी')
                    return (
                      <button key={s} onClick={() => handleSuggestion(s)}
                        className={`text-[11px] font-inter px-3 py-1.5 rounded-full border transition-all duration-150
                                   ${isSOS
                                     ? 'text-red-300 hover:bg-red-500/15 hover:border-red-400/40'
                                     : 'text-white/55 hover:text-white hover:bg-white/10 hover:border-white/25'}`}
                        style={isSOS
                          ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs
                              font-inter font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, #0A4267, #20658E)' }}>
                {patient ? patient.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                 style={{ background: 'linear-gradient(135deg, #1a6ca0, #2563eb)' }}>
              <BotAvatarIcon />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-md flex gap-1.5 items-center"
                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-blue-300/70 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}/>
              ))}
            </div>
          </div>
        )}

        {/* Navigating indicator */}
        {navigating && (
          <div className="flex justify-center pt-1">
            <span className="text-white/35 font-inter text-[10px] flex items-center gap-1.5">
              <SpinnerIcon />
              Speaking... then navigating
            </span>
          </div>
        )}

        <div ref={messagesEndRef}/>
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 px-3 py-3 flex items-center gap-2"
           style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,22,40,0.6)' }}>
        {/* Mic */}
        <button onClick={startVoice}
          title={listening ? 'Stop listening' : 'Speak'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 relative
                     ${listening ? 'bg-red-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
          style={listening ? { boxShadow: '0 0 12px rgba(239,68,68,0.4)' } : {}}>
          {listening && <span className="absolute inset-0 rounded-xl bg-red-400/20 animate-ping"/>}
          <MicIcon />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={listening ? 'Listening...' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) sendMessage(input) }}
          className="flex-1 text-white placeholder:text-white/30 text-sm font-inter focus:outline-none
                     rounded-xl px-4 py-2.5 transition-all min-w-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />

        {/* Send */}
        <button
          onClick={() => { if (input.trim()) sendMessage(input) }}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0
                     disabled:opacity-25 text-white"
          style={{ background: 'linear-gradient(135deg, #1a6ca0 0%, #2580c4 100%)' }}
        >
          <SendIcon />
        </button>
      </div>

      {!SpeechAPI && (
        <p className="text-white/20 font-inter text-[9px] text-center pb-2 shrink-0">
          Voice input requires Chrome or Edge
        </p>
      )}
    </div>
  ) : null

  // ── Floating bubble ──
  const bubble = (
    <button
      onClick={() => setOpen(v => !v)}
      className="group fixed bottom-5 right-4 md:right-6 z-[400] w-14 h-14 rounded-2xl
                 flex items-center justify-center transition-all duration-300
                 hover:scale-105 active:scale-95"
      style={{
        background: open
          ? 'rgba(255,255,255,0.08)'
          : 'linear-gradient(135deg, #0A4267 0%, #1e7ab8 100%)',
        boxShadow: open
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 8px 30px rgba(10,66,103,0.45), 0 0 0 1px rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {open ? (
        <CloseIcon className="w-5 h-5 text-white" />
      ) : (
        <>
          <ChatIcon className="w-6 h-6 text-white" />

          {/* Online dot */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400
                           border-2 border-[#030d18] flex items-center justify-center">
            <span className="w-1 h-1 bg-white rounded-full"/>
          </span>
        </>
      )}

      {/* Tooltip — visible on hover */}
      {!open && (
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0a1628] text-white
                         text-xs font-inter px-3 py-2 rounded-lg whitespace-nowrap opacity-0
                         pointer-events-none border border-white/10 shadow-xl transition-opacity duration-200
                         group-hover:opacity-100">
          MediBot — AI Health Assistant
        </span>
      )}
    </button>
  )

  return createPortal(<>{chatWindow}{bubble}</>, document.body)
}
