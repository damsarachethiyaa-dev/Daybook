import { useEffect, useRef, useState } from 'react'
import { MONTH_NAMES, formatCurrency } from '@renderer/utils/calendar'

interface TopBarProps {
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  canGoNext: boolean
  monthPnl: number
  monthTrades: number
  monthWinRate: number | null
  winStreak: number
}

function useCountUp(target: number, duration = 650): number {
  const [display, setDisplay] = useState(target)
  // Tracks the value actually rendered so an interrupted animation (e.g. React
  // StrictMode re-running effects) resumes from where it left off instead of stalling.
  const displayRef = useRef(target)

  useEffect(() => {
    const from = displayRef.current
    if (from === target) return

    const start = performance.now()
    let raf = 0
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = from + (target - from) * eased
      displayRef.current = value
      setDisplay(value)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}

function StatCard({ label, value, valueClass, pop }: { label: string; value: string; valueClass?: string; pop?: boolean }): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-1.5 text-right dark:border-gray-700 dark:bg-gray-800/60">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </div>
      <div className={`text-base font-semibold ${pop ? 'animate-pnl-pop' : ''} ${valueClass ?? 'text-gray-800 dark:text-gray-100'}`}>
        {value}
      </div>
    </div>
  )
}

export default function TopBar({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  canGoNext,
  monthPnl,
  monthTrades,
  monthWinRate,
  winStreak
}: TopBarProps): JSX.Element {
  const animatedPnl = useCountUp(monthPnl)
  const [pop, setPop] = useState(false)
  const prevPnlRef = useRef(monthPnl)

  useEffect(() => {
    if (prevPnlRef.current !== monthPnl) {
      prevPnlRef.current = monthPnl
      setPop(true)
      const t = setTimeout(() => setPop(false), 500)
      return () => clearTimeout(t)
    }
  }, [monthPnl])

  const pnlColor =
    monthPnl > 0
      ? 'text-profit-strong dark:text-profit-textDark'
      : monthPnl < 0
        ? 'text-loss-strong dark:text-loss-textDark'
        : 'text-gray-500 dark:text-gray-400'

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onToday}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Today
        </button>
        <h1 className="min-w-[180px] text-xl font-semibold text-gray-900 dark:text-gray-50">
          {MONTH_NAMES[month]} {year}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ‹
          </button>
          <button
            onClick={onNextMonth}
            disabled={!canGoNext}
            aria-label="Next month"
            title={canGoNext ? 'Next month' : "Future months haven't happened yet"}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ›
          </button>
        </div>
        {winStreak >= 2 && (
          <div
            title={`${winStreak} profitable days in a row`}
            className="animate-gradient-x flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-[length:200%_auto] px-3 py-1 text-xs font-bold text-white shadow-sm"
          >
            🔥 {winStreak}-day streak
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <StatCard label="Month P&L" value={formatCurrency(animatedPnl)} valueClass={pnlColor} pop={pop} />
        <StatCard label="Trades" value={String(monthTrades)} />
        <StatCard label="Win Rate" value={monthWinRate === null ? '—' : `${Math.round(monthWinRate * 100)}%`} />
      </div>
    </div>
  )
}
