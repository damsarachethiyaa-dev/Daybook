import { useEffect, useMemo, useState } from 'react'
import Sidebar, { type ViewKey } from '@renderer/components/Sidebar'
import TopBar from '@renderer/components/TopBar'
import CalendarMonthView from '@renderer/components/CalendarMonthView'
import DayDetailModal from '@renderer/components/DayDetailModal'
import TradeLogView from '@renderer/components/TradeLogView'
import NewsView from '@renderer/components/NewsView'
import { tradeStore } from '@renderer/storage/tradeStore'
import { loadNews, groupByDate, type NewsEvent } from '@renderer/services/newsService'
import { toDateKey } from '@renderer/utils/calendar'

export default function App(): JSX.Element {
  const today = new Date()
  const [view, setView] = useState<ViewKey>('calendar')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()))

  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)

  function refreshNews(force = false): void {
    setNewsLoading(true)
    setNewsError(null)
    loadNews(force)
      .then(setNewsEvents)
      .catch((err: unknown) => {
        setNewsError(err instanceof Error ? err.message : 'unknown error')
      })
      .finally(() => setNewsLoading(false))
  }

  // Initial fetch + hourly re-check so news stays current while the app stays open
  // (loadNews itself only hits the network once its cache expires).
  useEffect(() => {
    refreshNews()
    const newsTimer = setInterval(() => refreshNews(), 60 * 60 * 1000)
    return () => clearInterval(newsTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Watch for the calendar day rolling over at midnight: unlocks the new "today",
  // locks yesterday, and force-refreshes news for the new day — without a restart.
  useEffect(() => {
    const rolloverTimer = setInterval(() => {
      const nowKey = toDateKey(new Date())
      setTodayKey((prev) => {
        if (prev !== nowKey) refreshNews(true)
        return nowKey
      })
    }, 30 * 1000)
    return () => clearInterval(rolloverTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newsByDate = useMemo(() => groupByDate(newsEvents), [newsEvents])
  const todaysHighImpact = useMemo(
    () => (newsByDate.get(todayKey) ?? []).filter((e) => e.impact === 'High').length,
    [newsByDate, todayKey]
  )

  const monthSummary = useMemo(() => {
    const stats = tradeStore.getMonthStats(year, month)
    let pnl = 0
    let tradeCount = 0
    let wins = 0
    let losses = 0
    for (const day of stats.values()) {
      pnl += day.pnl
      tradeCount += day.tradeCount
      wins += day.wins
      losses += day.losses
    }
    const decided = wins + losses
    return { pnl, tradeCount, winRate: decided > 0 ? wins / decided : null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, version])

  // Consecutive green days, counting back from the most recent traded day.
  const winStreak = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const t of tradeStore.listTrades()) {
      byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.pnl)
    }
    const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    let streak = 0
    for (const [, pnl] of days) {
      if (pnl > 0) streak++
      else break
    }
    return streak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  function goToday(): void {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  function prevMonth(): void {
    const d = new Date(year, month - 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function nextMonth(): void {
    if (isCurrentOrFutureMonth) return
    const d = new Date(year, month + 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function bump(): void {
    setVersion((v) => v + 1)
  }

  const isCurrentOrFutureMonth =
    year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth())

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar active={view} onSelect={setView} newsBadge={todaysHighImpact} />

      <div className="flex min-w-0 flex-1 flex-col">
        {view === 'calendar' && (
          <>
            <TopBar
              year={year}
              month={month}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onToday={goToday}
              canGoNext={!isCurrentOrFutureMonth}
              monthPnl={monthSummary.pnl}
              monthTrades={monthSummary.tradeCount}
              monthWinRate={monthSummary.winRate}
              winStreak={winStreak}
            />
            <CalendarMonthView
              year={year}
              month={month}
              version={version}
              todayKey={todayKey}
              newsByDate={newsByDate}
              onSelectDay={setSelectedDate}
            />
          </>
        )}
        {view === 'log' && <TradeLogView version={version} onChange={bump} />}
        {view === 'news' && (
          <NewsView
            events={newsEvents}
            loading={newsLoading}
            error={newsError}
            onRefresh={() => refreshNews(true)}
          />
        )}
      </div>

      {selectedDate && (
        <DayDetailModal
          dateKey={selectedDate}
          newsEvents={newsByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
          onChange={bump}
        />
      )}
    </div>
  )
}
