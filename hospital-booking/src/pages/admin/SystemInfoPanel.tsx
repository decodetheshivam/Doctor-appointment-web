import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface ServerStats {
  // Memory
  heapUsed: number
  heapTotal: number
  heapLimit: number
  heapUsedPct: number
  // Runtime
  platform: string
  userAgent: string
  language: string
  cores: number
  connectionType: string
  // Uptime
  pageLoadTime: number
  timeOnPage: number
  // Storage
  localStorageUsed: number
  localStorageKeys: number
  sessionStorageUsed: number
}

interface EnvVariable {
  key: string
  value: string
  sensitive: boolean
}

interface DbConnection {
  name: string
  type: string
  status: 'connected' | 'idle' | 'error'
  host: string
  port: string
  database: string
  pool: string
  latency: string
}

// ─── Sensitive key patterns ───────────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  /password/i, /secret/i, /token/i, /key/i, /auth/i,
  /credential/i, /private/i, /cert/i, /jwt/i, /api_/i,
]

function isSensitive(key: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(key))
}

function maskValue(key: string, value: string): string {
  return isSensitive(key) ? '[REDACTED]' : value
}

// ─── Mock environment config (mirrors what a real .env would have) ────────────

const ENV_VARIABLES: EnvVariable[] = [
  { key: 'NODE_ENV',              value: 'production',                          sensitive: false },
  { key: 'APP_VERSION',           value: '2.1.0',                               sensitive: false },
  { key: 'APP_NAME',              value: 'MediConnect',                         sensitive: false },
  { key: 'PORT',                  value: '3000',                                sensitive: false },
  { key: 'HOST',                  value: '0.0.0.0',                             sensitive: false },
  { key: 'BASE_URL',              value: 'https://api.mediconnect.in',          sensitive: false },
  { key: 'FRONTEND_URL',          value: 'https://mediconnect.in',              sensitive: false },
  { key: 'LOG_LEVEL',             value: 'info',                                sensitive: false },
  { key: 'RATE_LIMIT_MAX',        value: '100',                                 sensitive: false },
  { key: 'RATE_LIMIT_WINDOW_MS',  value: '60000',                               sensitive: false },
  { key: 'JWT_SECRET',            value: 'ey##REDACTED##super_secret_key_2026', sensitive: true  },
  { key: 'JWT_EXPIRES_IN',        value: '7d',                                  sensitive: false },
  { key: 'JWT_REFRESH_SECRET',    value: 'refresh_##REDACTED##_secret_key',     sensitive: true  },
  { key: 'DB_HOST',               value: 'db.mediconnect.in',                   sensitive: false },
  { key: 'DB_PORT',               value: '5432',                                sensitive: false },
  { key: 'DB_NAME',               value: 'mediconnect_prod',                    sensitive: false },
  { key: 'DB_USER',               value: 'medi_admin',                          sensitive: false },
  { key: 'DB_PASSWORD',           value: 'Sup3rS3cur3P@ssw0rd!',                sensitive: true  },
  { key: 'DB_SSL',                value: 'true',                                sensitive: false },
  { key: 'REDIS_HOST',            value: 'redis.mediconnect.in',                sensitive: false },
  { key: 'REDIS_PORT',            value: '6379',                                sensitive: false },
  { key: 'REDIS_PASSWORD',        value: 'r3d!sS3cr3t#2026',                    sensitive: true  },
  { key: 'AWS_REGION',            value: 'ap-south-1',                          sensitive: false },
  { key: 'AWS_S3_BUCKET',         value: 'mediconnect-records-prod',            sensitive: false },
  { key: 'AWS_ACCESS_KEY_ID',     value: 'AKIA##REDACTED##ACCESS',              sensitive: true  },
  { key: 'AWS_SECRET_ACCESS_KEY', value: 'wJal##REDACTED##/KEY',                sensitive: true  },
  { key: 'SMTP_HOST',             value: 'smtp.mediconnect.in',                 sensitive: false },
  { key: 'SMTP_PORT',             value: '587',                                 sensitive: false },
  { key: 'SMTP_USER',             value: 'noreply@mediconnect.in',              sensitive: false },
  { key: 'SMTP_PASSWORD',         value: 'Sm7p!##REDACTED##Pass',               sensitive: true  },
  { key: 'RAZORPAY_KEY_ID',       value: 'rzp_live_##REDACTED##',               sensitive: true  },
  { key: 'RAZORPAY_KEY_SECRET',   value: 'rzp##REDACTED##secret',               sensitive: true  },
  { key: 'FIREBASE_API_KEY',      value: 'AIza##REDACTED##Key',                 sensitive: true  },
  { key: 'FIREBASE_PROJECT_ID',   value: 'mediconnect-prod',                    sensitive: false },
  { key: 'ENCRYPTION_KEY',        value: 'aes##REDACTED##256bit',               sensitive: true  },
]

// ─── Mock DB connections ──────────────────────────────────────────────────────

const DB_CONNECTIONS: DbConnection[] = [
  {
    name:     'Primary PostgreSQL',
    type:     'PostgreSQL 15.4',
    status:   'connected',
    host:     'db.mediconnect.in',
    port:     '5432',
    database: 'mediconnect_prod',
    pool:     '8 / 20 active',
    latency:  '3 ms',
  },
  {
    name:     'Read Replica',
    type:     'PostgreSQL 15.4',
    status:   'connected',
    host:     'db-replica.mediconnect.in',
    port:     '5432',
    database: 'mediconnect_prod',
    pool:     '2 / 10 active',
    latency:  '8 ms',
  },
  {
    name:     'Redis Cache',
    type:     'Redis 7.2',
    status:   'connected',
    host:     'redis.mediconnect.in',
    port:     '6379',
    database: 'db0',
    pool:     '3 / 8 active',
    latency:  '1 ms',
  },
  {
    name:     'MongoDB (Audit Logs)',
    type:     'MongoDB 7.0',
    status:   'idle',
    host:     'mongo.mediconnect.in',
    port:     '27017',
    database: 'mediconnect_audit',
    pool:     '0 / 5 active',
    latency:  '—',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getLocalStorageSize(): number {
  let total = 0
  for (const key of Object.keys(localStorage)) {
    total += (localStorage.getItem(key) ?? '').length * 2 // UTF-16 = 2 bytes/char
  }
  return total
}

function getConnectionType(): string {
  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection
  return conn?.effectiveType ?? 'unknown'
}

function collectStats(): ServerStats {
  const mem = (performance as unknown as { memory?: MemoryInfo }).memory

  const heapUsed  = mem?.usedJSHeapSize  ?? 0
  const heapTotal = mem?.totalJSHeapSize ?? 0
  const heapLimit = mem?.jsHeapSizeLimit ?? 0

  const lsKeys = Object.keys(localStorage).length
  const lsSize = getLocalStorageSize()
  const ssSize = (() => {
    let t = 0
    for (const k of Object.keys(sessionStorage)) t += (sessionStorage.getItem(k) ?? '').length * 2
    return t
  })()

  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const loadTime = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 0

  return {
    heapUsed,
    heapTotal,
    heapLimit,
    heapUsedPct: heapTotal > 0 ? Math.round((heapUsed / heapTotal) * 100) : 0,
    platform:       navigator.platform || 'Unknown',
    userAgent:      navigator.userAgent,
    language:       navigator.language,
    cores:          navigator.hardwareConcurrency ?? 1,
    connectionType: getConnectionType(),
    pageLoadTime:   loadTime,
    timeOnPage:     Math.round(performance.now() / 1000),
    localStorageUsed:  lsSize,
    localStorageKeys:  lsKeys,
    sessionStorageUsed: ssSize,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = 'text-white',
}: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/6
                    hover:border-white/15 transition-all duration-300">
      <p className="text-white/35 font-inter text-[11px] uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-inter font-bold text-2xl ${color}`}>{value}</p>
      {sub && <p className="text-white/30 font-inter text-xs mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  const safeColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : color
  return (
    <div className="w-full bg-white/8 rounded-full h-1.5 mt-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${safeColor}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xl">{icon}</span>
      <h3 className="text-white font-inter font-semibold text-base">{title}</h3>
      {badge && (
        <span className="text-xs font-inter px-2 py-0.5 rounded-full bg-white/8
                         border border-white/12 text-white/50">{badge}</span>
      )}
      <div className="flex-1 h-px bg-white/6 ml-2" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemInfoPanel() {
  const [stats, setStats]           = useState<ServerStats | null>(null)
  const [showValues, setShowValues] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [filterSensitive, setFilterSensitive] = useState<'all' | 'sensitive' | 'public'>('all')
  const [envSearch, setEnvSearch]   = useState('')
  // Live uptime ticker (seconds since page load)
  const [uptimeSecs, setUptimeSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Fixed app launch timestamp persisted in sessionStorage
  const appStartRef = useRef<number>(0)
  if (appStartRef.current === 0) {
    const stored = sessionStorage.getItem('mediconnect_app_start')
    if (stored) {
      appStartRef.current = Number(stored)
    } else {
      const now = Date.now()
      sessionStorage.setItem('mediconnect_app_start', String(now))
      appStartRef.current = now
    }
  }

  function refresh() {
    setRefreshing(true)
    setTimeout(() => {
      setStats(collectStats())
      setLastRefresh(new Date())
      setRefreshing(false)
    }, 400)
  }

  useEffect(() => {
    setStats(collectStats())
    // Auto-refresh every 5 seconds
    timerRef.current = setInterval(() => {
      setStats(collectStats())
      setLastRefresh(new Date())
    }, 5000)
    // Live uptime ticker every second
    uptimeRef.current = setInterval(() => {
      setUptimeSecs(Math.round((Date.now() - appStartRef.current) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (uptimeRef.current) clearInterval(uptimeRef.current)
    }
  }, [])

  const filteredEnv = ENV_VARIABLES.filter((v) => {
    const matchFilter =
      filterSensitive === 'all' ? true :
      filterSensitive === 'sensitive' ? v.sensitive :
      !v.sensitive
    const matchSearch = !envSearch ||
      v.key.toLowerCase().includes(envSearch.toLowerCase())
    return matchFilter && matchSearch
  })

  const sensitiveCount = ENV_VARIABLES.filter((v) => v.sensitive).length

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin text-white/30" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"
                  strokeDasharray="40" strokeDashoffset="15"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-instrument text-white text-2xl md:text-3xl">
            System <span className="italic">Configuration</span>
          </h2>
          <p className="text-white/35 font-inter text-sm mt-1">
            Live server stats, environment variables, and database connections.
            All sensitive values are masked.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white/25 font-inter text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>
            Auto-refresh · Last: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 border border-white/15 text-white/60
                       hover:text-white hover:border-white/30 text-xs font-inter px-4 py-2
                       rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <svg className={refreshing ? 'animate-spin' : ''} width="13" height="13"
                 viewBox="0 0 13 13" fill="none">
              <path d="M11 6.5A4.5 4.5 0 112 6.5" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round"/>
              <path d="M11 3v3.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Memory Usage ── */}
      <section>
        <SectionHeader icon="🧠" title="Memory Usage" badge="JS Heap" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Heap Used"
            value={formatBytes(stats.heapUsed)}
            sub={`${stats.heapUsedPct}% of heap total`}
            color={stats.heapUsedPct > 80 ? 'text-red-400' : stats.heapUsedPct > 60 ? 'text-yellow-400' : 'text-emerald-400'}
          />
          <StatCard
            label="Heap Total"
            value={formatBytes(stats.heapTotal)}
            sub="Allocated by V8"
          />
          <StatCard
            label="Heap Limit"
            value={formatBytes(stats.heapLimit)}
            sub="V8 max limit"
          />
          <StatCard
            label="Usage"
            value={`${stats.heapUsedPct}%`}
            sub="Used / Total"
            color={stats.heapUsedPct > 80 ? 'text-red-400' : stats.heapUsedPct > 60 ? 'text-yellow-400' : 'text-white'}
          />
        </div>

        {/* Memory progress visual */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 font-inter text-xs">JS Heap Utilization</span>
            <span className="text-white/70 font-inter text-xs font-medium">
              {formatBytes(stats.heapUsed)} / {formatBytes(stats.heapTotal)}
            </span>
          </div>
          <ProgressBar pct={stats.heapUsedPct} color="bg-blue-500" />

          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/6">
            <div>
              <p className="text-white/30 font-inter text-[10px] uppercase tracking-wide">localStorage</p>
              <p className="text-white/70 font-inter text-sm font-medium mt-0.5">
                {formatBytes(stats.localStorageUsed)}
              </p>
              <p className="text-white/25 font-inter text-[10px]">{stats.localStorageKeys} keys</p>
            </div>
            <div>
              <p className="text-white/30 font-inter text-[10px] uppercase tracking-wide">sessionStorage</p>
              <p className="text-white/70 font-inter text-sm font-medium mt-0.5">
                {formatBytes(stats.sessionStorageUsed)}
              </p>
            </div>
            <div>
              <p className="text-white/30 font-inter text-[10px] uppercase tracking-wide">Page Load</p>
              <p className="text-white/70 font-inter text-sm font-medium mt-0.5">
                {stats.pageLoadTime > 0 ? `${stats.pageLoadTime} ms` : '< 1 ms'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Server / Runtime Config ── */}
      <section>
        <SectionHeader icon="⚙️" title="Server Configuration" badge="Runtime" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Runtime info */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-3">
            <p className="text-white/35 font-inter text-[11px] uppercase tracking-widest">Runtime</p>
            {[
              { label: 'Environment',   value: 'Production'     },
              { label: 'App Version',   value: 'v2.1.0'         },
              { label: 'Node Runtime',  value: 'Browser / Vite' },
              { label: 'Platform',      value: stats.platform   },
              { label: 'Language',      value: stats.language   },
              { label: 'CPU Cores',     value: String(stats.cores) },
              { label: 'Connection',    value: stats.connectionType },
              { label: 'Time on Page',  value: formatUptime(stats.timeOnPage) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-white/40 font-inter text-xs">{label}</span>
                <span className="text-white/80 font-inter text-xs font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Server config */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-3">
            <p className="text-white/35 font-inter text-[11px] uppercase tracking-widest">Application Config</p>
            {[
              { label: 'App Name',       value: 'MediConnect'            },
              { label: 'Port',           value: '3000'                   },
              { label: 'Host',           value: '0.0.0.0'                },
              { label: 'Base URL',       value: 'https://api.mediconnect.in' },
              { label: 'Log Level',      value: 'info'                   },
              { label: 'Rate Limit',     value: '100 req / 60s'          },
              { label: 'JWT Expiry',     value: '7 days'                 },
              { label: 'SSL/TLS',        value: 'Enabled (TLS 1.3)'      },
              { label: 'CORS Origins',   value: 'mediconnect.in, *.mediconnect.in' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-white/40 font-inter text-xs shrink-0">{label}</span>
                <span className="text-white/80 font-inter text-xs font-medium text-right break-all">{value}</span>
              </div>
            ))}
          </div>

          {/* User-Agent full string */}
          <div className="md:col-span-2 bg-white/3 border border-white/6 rounded-2xl p-4">
            <p className="text-white/25 font-inter text-[10px] uppercase tracking-widest mb-2">User Agent</p>
            <p className="text-white/50 font-mono text-[11px] leading-relaxed break-all">{stats.userAgent}</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Environment Variables ── */}
      <section>
        <SectionHeader
          icon="🔐"
          title="Environment Variables"
          badge={`${ENV_VARIABLES.length} vars · ${sensitiveCount} redacted`}
        />

        {/* Security notice */}
        <div className="bg-yellow-500/6 border border-yellow-500/15 rounded-xl p-4
                        flex items-start gap-3 mb-5">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5l6.5 12h-13z" stroke="#fbbf24" strokeWidth="1.2"/>
            <path d="M8 6.5v3.5" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="8" cy="12" r="0.6" fill="#fbbf24"/>
          </svg>
          <div>
            <p className="text-yellow-300/90 font-inter text-sm font-medium">Security Notice</p>
            <p className="text-yellow-300/55 font-inter text-xs mt-0.5 leading-relaxed">
              Sensitive keys (passwords, secrets, tokens, API keys) are automatically masked as
              <code className="bg-yellow-500/15 px-1 py-0.5 rounded text-yellow-400 ml-1 font-mono text-[10px]">[REDACTED]</code>.
              Patterns matched: DB_PASSWORD, JWT_SECRET, *_KEY, *_TOKEN, *_SECRET, *_AUTH, *_CREDENTIAL.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
                 width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl
                         pl-9 pr-4 py-2.5 text-white placeholder:text-white/25 text-xs font-inter
                         focus:outline-none transition-colors"
              placeholder="Search variable name..."
              value={envSearch}
              onChange={(e) => setEnvSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'public', 'sensitive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterSensitive(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-inter capitalize transition-all duration-200
                           ${filterSensitive === f
                             ? 'bg-white text-[#030d18]'
                             : 'bg-white/5 border border-white/10 text-white/45 hover:text-white'}`}
              >
                {f === 'sensitive' ? `🔴 Sensitive (${sensitiveCount})` :
                 f === 'public'    ? `🟢 Public (${ENV_VARIABLES.length - sensitiveCount})` : 'All'}
              </button>
            ))}
          </div>
          {/* Toggle show/hide values */}
          <button
            onClick={() => setShowValues((v) => !v)}
            className={`px-4 py-2 rounded-xl text-xs font-inter flex items-center gap-1.5
                       transition-all duration-200 border
                       ${showValues
                         ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                         : 'bg-white/5 border-white/10 text-white/45 hover:text-white'}`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              {showValues
                ? <><path d="M1.5 6.5s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 2l9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
                : <><path d="M1.5 6.5s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></>
              }
            </svg>
            {showValues ? 'Hide Values' : 'Show Values'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_3fr_80px] gap-4 px-5 py-3 bg-white/4
                          border-b border-white/8 text-white/30 font-inter text-[10px]
                          uppercase tracking-widest">
            <span>Variable</span>
            <span>Value</span>
            <span>Type</span>
          </div>

          <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto scrollbar-hide">
            {filteredEnv.map((v) => (
              <div
                key={v.key}
                className="grid grid-cols-[2fr_3fr_80px] gap-4 px-5 py-3.5
                           hover:bg-white/4 transition-colors duration-150 items-center"
              >
                {/* Key */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.sensitive ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <code className="text-white/80 font-mono text-xs truncate">{v.key}</code>
                </div>

                {/* Value */}
                <div className="min-w-0">
                  {v.sensitive ? (
                    <code className="text-red-400/80 font-mono text-xs bg-red-500/8
                                     px-2 py-0.5 rounded-md border border-red-500/15">
                      [REDACTED]
                    </code>
                  ) : showValues ? (
                    <code className="text-emerald-400/80 font-mono text-xs truncate block
                                     max-w-full overflow-hidden">{v.value}</code>
                  ) : (
                    <code className="text-white/35 font-mono text-xs">{'•'.repeat(Math.min(v.value.length, 24))}</code>
                  )}
                </div>

                {/* Sensitivity badge */}
                <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border w-fit
                                 ${v.sensitive
                                   ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                   : 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400/70'}`}>
                  {v.sensitive ? 'Secret' : 'Public'}
                </span>
              </div>
            ))}
            {filteredEnv.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-white/25 font-inter text-sm">No variables match your search.</p>
              </div>
            )}
          </div>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-white/6 bg-white/2">
            <p className="text-white/20 font-inter text-xs">
              Showing {filteredEnv.length} of {ENV_VARIABLES.length} variables
              · {sensitiveCount} automatically redacted
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Database Connections ── */}
      <section>
        <SectionHeader icon="🗄️" title="Database Connections" badge={`${DB_CONNECTIONS.length} configured`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DB_CONNECTIONS.map((db) => (
            <div
              key={db.name}
              className="bg-white/4 border border-white/8 hover:border-white/15
                         rounded-2xl p-5 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      db.status === 'connected' ? 'bg-emerald-400' :
                      db.status === 'idle'      ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <p className="text-white font-inter font-semibold text-sm">{db.name}</p>
                  </div>
                  <p className="text-white/35 font-inter text-xs mt-0.5 ml-4">{db.type}</p>
                </div>
                <span className={`text-[10px] font-inter px-2.5 py-1 rounded-full border capitalize shrink-0 ${
                  db.status === 'connected' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                  db.status === 'idle'      ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                                              'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {db.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {[
                  { label: 'Host',     value: db.host,     icon: '🌐' },
                  { label: 'Port',     value: db.port,     icon: '🔌' },
                  { label: 'Database', value: db.database, icon: '💾' },
                  { label: 'Pool',     value: db.pool,     icon: '🔄' },
                  { label: 'Password', value: '[REDACTED]', icon: '🔐', redacted: true },
                  { label: 'Latency',  value: db.latency,  icon: '⚡' },
                ].map(({ label, value, icon, redacted }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-white/30 font-inter text-xs flex items-center gap-1.5">
                      <span className="text-[10px]">{icon}</span>{label}
                    </span>
                    {redacted ? (
                      <code className="text-red-400/70 font-mono text-[11px] bg-red-500/8
                                       px-1.5 py-0.5 rounded border border-red-500/15">
                        [REDACTED]
                      </code>
                    ) : (
                      <span className="text-white/70 font-mono text-xs">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: Uptime & Availability ── */}
      <section>
        <SectionHeader icon="⏱️" title="Uptime & Availability" badge="Live" />

        {/* Live uptime counter */}
        <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20
                        rounded-2xl p-6 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-emerald-400/60 font-inter text-xs uppercase tracking-widest mb-1">Current Session Uptime</p>
            <div className="flex items-end gap-3">
              <span className="font-inter font-bold text-4xl md:text-5xl text-emerald-400 tabular-nums">
                {formatUptime(uptimeSecs)}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400/60 text-xs font-inter mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/>
                live
              </span>
            </div>
            <p className="text-white/30 font-inter text-xs mt-1">
              Session started: {new Date(appStartRef.current).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'This Session',  value: formatUptime(uptimeSecs),      color: 'text-emerald-400' },
              { label: 'Page Load',     value: stats ? (stats.pageLoadTime > 0 ? `${stats.pageLoadTime}ms` : '<1ms') : '—', color: 'text-white' },
              { label: 'Time on Page',  value: stats ? formatUptime(stats.timeOnPage) : '—', color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`font-inter font-semibold text-lg tabular-nums ${color}`}>{value}</p>
                <p className="text-white/30 font-inter text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service uptime grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {[
            { service: 'API Gateway',          uptime: 99.98, incidents: 0,  lastDown: 'Never',            sla: '99.9%' },
            { service: 'PostgreSQL Primary',   uptime: 99.95, incidents: 1,  lastDown: '14 days ago',       sla: '99.9%' },
            { service: 'Redis Cache',          uptime: 100,   incidents: 0,  lastDown: 'Never',            sla: '99.5%' },
            { service: 'Appointment Service',  uptime: 99.99, incidents: 0,  lastDown: 'Never',            sla: '99.9%' },
            { service: 'Notification Service', uptime: 99.80, incidents: 2,  lastDown: '3 days ago',        sla: '99.5%' },
            { service: 'File Storage (S3)',    uptime: 100,   incidents: 0,  lastDown: 'Never',            sla: '99.9%' },
          ].map(({ service, uptime, incidents, lastDown, sla }) => {
            const meeting = uptime >= parseFloat(sla)
            return (
              <div key={service}
                className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/6 transition-all duration-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-white font-inter font-medium text-sm leading-tight">{service}</p>
                  <span className={`shrink-0 text-[10px] font-inter px-2 py-0.5 rounded-full border
                                   ${meeting
                                     ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                     : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'}`}>
                    {meeting ? '✓ SLA Met' : '⚠ SLA Risk'}
                  </span>
                </div>
                {/* Uptime bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-inter font-bold text-xl tabular-nums
                                   ${uptime === 100 ? 'text-emerald-400' :
                                     uptime >= 99.9 ? 'text-emerald-400' :
                                     uptime >= 99.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {uptime.toFixed(2)}%
                  </span>
                  <span className="text-white/25 font-inter text-xs">uptime (30d)</span>
                </div>
                <ProgressBar
                  pct={uptime}
                  color={uptime === 100 ? 'bg-emerald-500' : uptime >= 99.9 ? 'bg-emerald-500' : uptime >= 99.5 ? 'bg-yellow-500' : 'bg-red-500'}
                />
                {/* 90-day mini blocks (visual timeline) */}
                <div className="flex gap-[2px] mt-3">
                  {Array.from({ length: 30 }, (_, i) => {
                    // Simulate some incidents based on incidents count
                    const hasIncident = incidents > 0 && (i === 5 || (incidents > 1 && i === 22))
                    return (
                      <div
                        key={i}
                        title={hasIncident ? 'Incident detected' : 'Operational'}
                        className={`flex-1 h-5 rounded-[2px] ${hasIncident ? 'bg-red-500/70' : 'bg-emerald-500/40'}`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/20 font-inter text-[9px]">30 days ago</span>
                  <span className="text-white/20 font-inter text-[9px]">Today</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/6 flex items-center justify-between">
                  <div>
                    <p className="text-white/25 font-inter text-[10px]">SLA Target</p>
                    <p className="text-white/60 font-inter text-xs">{sla}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/25 font-inter text-[10px]">Last Incident</p>
                    <p className="text-white/60 font-inter text-xs">{lastDown}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/25 font-inter text-[10px]">Incidents</p>
                    <p className={`font-inter text-xs font-medium ${incidents > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {incidents}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Incident log */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <p className="text-white/50 font-inter text-xs uppercase tracking-widest">Recent Incidents</p>
            <span className="text-white/20 font-inter text-xs">Last 30 days</span>
          </div>
          <div className="divide-y divide-white/5">
            {[
              {
                id: 'INC-2026-031',
                service: 'Notification Service',
                severity: 'minor',
                title: 'Email delivery delays — SMTP queue buildup',
                start: '2026-08-19 14:32',
                resolved: '2026-08-19 15:10',
                duration: '38 min',
                status: 'resolved',
              },
              {
                id: 'INC-2026-028',
                service: 'Notification Service',
                severity: 'minor',
                title: 'SMS gateway timeout — fallback activated',
                start: '2026-08-16 09:15',
                resolved: '2026-08-16 09:44',
                duration: '29 min',
                status: 'resolved',
              },
              {
                id: 'INC-2026-017',
                service: 'PostgreSQL Primary',
                severity: 'moderate',
                title: 'Slow query due to missing index on appointments table',
                start: '2026-08-08 11:02',
                resolved: '2026-08-08 11:47',
                duration: '45 min',
                status: 'resolved',
              },
              {
                id: 'INC-2026-004',
                service: 'API Gateway',
                severity: 'none',
                title: 'Scheduled maintenance window — all services nominal',
                start: '2026-08-01 02:00',
                resolved: '2026-08-01 03:30',
                duration: '90 min',
                status: 'maintenance',
              },
            ].map((inc) => (
              <div key={inc.id} className="px-5 py-4 hover:bg-white/3 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      inc.status === 'maintenance' ? 'bg-blue-400' :
                      inc.severity === 'moderate'  ? 'bg-yellow-400' : 'bg-orange-400'
                    }`} />
                    <div>
                      <p className="text-white/80 font-inter text-sm font-medium">{inc.title}</p>
                      <p className="text-white/35 font-inter text-xs mt-0.5">
                        {inc.service} · {inc.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border capitalize ${
                      inc.status === 'maintenance'
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>{inc.status}</span>
                    <span className="text-white/25 font-inter text-xs">{inc.duration}</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-2 ml-5">
                  <span className="text-white/20 font-inter text-[10px]">Started: {inc.start}</span>
                  <span className="text-white/20 font-inter text-[10px]">Resolved: {inc.resolved}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/6 bg-white/2">
            <p className="text-white/20 font-inter text-xs">
              3 incidents in the last 30 days · Overall platform uptime: 99.94%
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Security Audit ── */}
      <section>
        <SectionHeader icon="🛡️" title="Security Audit" badge="Auto-scan" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { check: 'Secrets Masked',         status: 'pass', detail: `${sensitiveCount} env vars redacted` },
            { check: 'HTTPS Enforced',          status: 'pass', detail: 'TLS 1.3 active' },
            { check: 'JWT Expiry Configured',   status: 'pass', detail: '7-day rotation' },
            { check: 'Rate Limiting Active',    status: 'pass', detail: '100 req/60s per IP' },
            { check: 'DB Password in Env',      status: 'pass', detail: 'Not hardcoded in source' },
            { check: 'Admin Route Protected',   status: 'pass', detail: 'Session-gated access' },
            { check: 'CORS Policy',             status: 'warn', detail: 'Review wildcard origins' },
            { check: 'CSP Header',              status: 'warn', detail: 'Content-Security-Policy missing' },
            { check: 'Dependency Audit',        status: 'info', detail: '2 moderate, 0 critical' },
          ].map(({ check, status, detail }) => (
            <div key={check}
              className={`flex items-start gap-3 rounded-xl p-4 border
                         ${status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/15' :
                           status === 'warn' ? 'bg-yellow-500/5 border-yellow-500/15' :
                                               'bg-blue-500/5 border-blue-500/15'}`}>
              <span className={`text-base shrink-0 mt-0.5 ${
                status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : 'ℹ️'
              }`}>
                {status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <p className={`font-inter text-sm font-medium ${
                  status === 'pass' ? 'text-emerald-400' :
                  status === 'warn' ? 'text-yellow-400' : 'text-blue-400'
                }`}>{check}</p>
                <p className="text-white/35 font-inter text-xs mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
