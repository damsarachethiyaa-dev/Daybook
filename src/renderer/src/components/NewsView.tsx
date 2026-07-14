import { useMemo, useState } from 'react'
import type { NewsEvent } from '@renderer/services/newsService'
import { IMPACT_STYLES, groupByDate } from '@renderer/services/newsService'
import { toDateKey } from '@renderer/utils/calendar'

interface NewsViewProps {
  events: NewsEvent[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function formatDayHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

const COUNTRY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  CNY: '🇨🇳'
}

export default function NewsView({ events, loading, error, onRefresh }: NewsViewProps): JSX.Element {
  const [impactFilter, setImpactFilter] = useState<'all' | 'high'>('high')
  const todayKey = toDateKey(new Date())

  const grouped = useMemo(() => {
    const filtered = impactFilter === 'high' ? events.filter((e) => e.impact === 'High') : events
    return [...groupByDate(filtered).entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [events, impactFilter])

  const highCount = events.filter((e) => e.impact === 'High').length

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Economic Calendar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This week&apos;s market-moving events ·{' '}
            <span className="font-semibold text-red-500">{highCount} high-impact</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setImpactFilter('high')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                impactFilter === 'high'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              🔥 High only
            </button>
            <button
              onClick={() => setImpactFilter('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                impactFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              All events
            </button>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && events.length === 0 && (
        <div className="mb-4 rounded-lg border border-loss-border bg-loss-bg px-4 py-3 text-sm text-loss-text dark:border-loss-borderDark dark:bg-loss-bgDark dark:text-loss-textDark">
          Couldn&apos;t load the news feed ({error}). Check your internet connection and hit Refresh.
        </div>
      )}
      {error && events.length > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          Latest refresh failed — showing previously loaded events.
        </div>
      )}

      {!error && grouped.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-10 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
          No {impactFilter === 'high' ? 'high-impact ' : ''}events found for this week.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(([dateKey, dayEvents]) => {
          const isToday = dateKey === todayKey
          return (
            <div
              key={dateKey}
              className={`overflow-hidden rounded-xl border shadow-card ${
                isToday
                  ? 'border-accent-400 ring-1 ring-accent-400/50 dark:border-accent-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div
                className={`flex items-center justify-between px-4 py-2 text-sm font-semibold ${
                  isToday
                    ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-400'
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <span>
                  {formatDayHeading(dateKey)}
                  {isToday && <span className="ml-2 rounded bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Today</span>}
                </span>
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                  {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="divide-y divide-gray-100 bg-white dark:divide-gray-700/70 dark:bg-gray-900">
                {dayEvents.map((e) => {
                  const style = IMPACT_STYLES[e.impact]
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-14 shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {e.time}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${style.chip} ${
                          e.impact === 'High' ? 'animate-pulse' : ''
                        }`}
                      >
                        {style.label}
                      </span>
                      <span className="w-14 shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {COUNTRY_FLAGS[e.country] ?? ''} {e.country}
                      </span>
                      <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{e.title}</span>
                      {(e.forecast || e.previous) && (
                        <span className="hidden shrink-0 gap-3 text-xs text-gray-400 dark:text-gray-500 sm:flex">
                          {e.forecast && <span>F: {e.forecast}</span>}
                          {e.previous && <span>P: {e.previous}</span>}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-600">
        Data: ForexFactory weekly calendar feed · times shown in your local timezone
      </p>
    </div>
  )
}
