import { toDateKey } from '@renderer/utils/calendar'

export type NewsImpact = 'High' | 'Medium' | 'Low' | 'Holiday'

export interface NewsEvent {
  id: string
  title: string
  country: string
  dateKey: string // YYYY-MM-DD in the user's local timezone
  time: string // localized HH:MM
  timestamp: number
  impact: NewsImpact
  forecast: string
  previous: string
}

interface RawEvent {
  title?: string
  country?: string
  date?: string
  impact?: string
  forecast?: string
  previous?: string
}

const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
const CACHE_KEY = 'daybook:news'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheShape {
  fetchedAt: number
  events: NewsEvent[]
}

function normalizeImpact(raw: string | undefined): NewsImpact {
  if (raw === 'High' || raw === 'Medium' || raw === 'Low' || raw === 'Holiday') return raw
  return 'Low'
}

function parseEvents(raw: unknown): NewsEvent[] {
  if (!Array.isArray(raw)) return []
  const events: NewsEvent[] = []
  for (let i = 0; i < raw.length; i++) {
    const e = raw[i] as RawEvent
    if (!e || !e.date || !e.title) continue
    const when = new Date(e.date)
    if (isNaN(when.getTime())) continue
    events.push({
      id: `${e.date}-${i}`,
      title: e.title,
      country: e.country ?? '',
      dateKey: toDateKey(when),
      time: when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: when.getTime(),
      impact: normalizeImpact(e.impact),
      forecast: e.forecast ?? '',
      previous: e.previous ?? ''
    })
  }
  events.sort((a, b) => a.timestamp - b.timestamp)
  return events
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CacheShape
  } catch {
    return null
  }
}

async function fetchRaw(): Promise<unknown> {
  // Electron: main-process fetch over IPC (no CORS). Plain browser (dev): the Vite proxy,
  // falling back to a direct fetch as a last resort.
  if (window.daybook?.fetchNews) {
    return window.daybook.fetchNews()
  }
  for (const url of ['/api/news', FEED_URL]) {
    try {
      const res = await fetch(url)
      if (res.ok) return await res.json()
    } catch {
      // try next source
    }
  }
  throw new Error('news feed unreachable')
}

export async function loadNews(forceRefresh = false): Promise<NewsEvent[]> {
  const cached = readCache()
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.events
  }
  try {
    const raw = await fetchRaw()
    const events = parseEvents(raw)
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), events } satisfies CacheShape))
    return events
  } catch (err) {
    // Offline or feed unavailable: fall back to stale cache rather than nothing.
    if (cached) return cached.events
    throw err
  }
}

export function groupByDate(events: NewsEvent[]): Map<string, NewsEvent[]> {
  const map = new Map<string, NewsEvent[]>()
  for (const e of events) {
    const list = map.get(e.dateKey)
    if (list) list.push(e)
    else map.set(e.dateKey, [e])
  }
  return map
}

export const IMPACT_STYLES: Record<NewsImpact, { chip: string; label: string }> = {
  High: { chip: 'bg-red-500 text-white', label: 'High' },
  Medium: { chip: 'bg-orange-400 text-white', label: 'Med' },
  Low: { chip: 'bg-yellow-300 text-yellow-900 dark:bg-yellow-500/80 dark:text-yellow-950', label: 'Low' },
  Holiday: { chip: 'bg-sky-400 text-white', label: 'Hol' }
}
