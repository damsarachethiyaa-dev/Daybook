import type { DayStats } from '@renderer/types'
import type { NewsEvent } from '@renderer/services/newsService'
import { formatCurrency } from '@renderer/utils/calendar'
import { colorForTag } from '@renderer/utils/tagColors'

interface DayCellProps {
  day: number
  inCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  isPast: boolean
  stats?: DayStats
  news?: NewsEvent[]
  onClick: () => void
}

function LockIcon(): JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  )
}

export default function DayCell({
  day,
  inCurrentMonth,
  isToday,
  isFuture,
  isPast,
  stats,
  news,
  onClick
}: DayCellProps): JSX.Element {
  const hasTrades = !!stats && stats.tradeCount > 0
  const isProfit = hasTrades && stats!.pnl > 0
  const isLoss = hasTrades && stats!.pnl < 0
  const isLocked = isFuture || isPast
  const highNews = news?.filter((e) => e.impact === 'High').length ?? 0
  const medNews = news?.filter((e) => e.impact === 'Medium').length ?? 0

  const bgClass = isFuture
    ? 'bg-gray-50 dark:bg-gray-900/40'
    : isProfit
      ? 'bg-profit-bg hover:brightness-95 dark:bg-profit-bgDark dark:hover:brightness-125'
      : isLoss
        ? 'bg-loss-bg hover:brightness-95 dark:bg-loss-bgDark dark:hover:brightness-125'
        : inCurrentMonth
          ? 'bg-white hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800'
          : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900/70'

  const borderClass = isToday
    ? 'ring-2 ring-inset ring-accent-500 today-glow'
    : isPast
      ? 'border-2 border-red-300 dark:border-red-900/70'
      : 'border border-gray-200 dark:border-gray-700/70'

  const lockTitle = isFuture
    ? "This day hasn't happened yet"
    : isPast
      ? 'This date has already passed and is locked'
      : undefined

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      title={lockTitle}
      className={`group flex h-full min-h-[110px] w-full flex-col items-stretch gap-1 rounded-lg p-2 text-left shadow-card transition-transform duration-150 ${bgClass} ${borderClass} ${
        !inCurrentMonth ? 'opacity-50' : ''
      } ${isFuture ? 'cursor-not-allowed opacity-60' : isPast ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${
            isToday
              ? 'flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-white'
              : inCurrentMonth
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-400 dark:text-gray-600'
          }`}
        >
          {day}
        </span>
        <div className="flex items-center gap-1">
          {highNews > 0 && (
            <span
              title={`${highNews} high-impact news event${highNews === 1 ? '' : 's'}`}
              className="relative flex h-4 min-w-[16px] items-center justify-center"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60"></span>
              <span className="relative inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                {highNews}
              </span>
            </span>
          )}
          {highNews === 0 && medNews > 0 && (
            <span
              title={`${medNews} medium-impact news event${medNews === 1 ? '' : 's'}`}
              className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-400 px-0.5 text-[9px] font-bold leading-none text-white"
            >
              {medNews}
            </span>
          )}
          {stats?.hasNote && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-500"
            >
              <path d="M4 4h16v12H8l-4 4V4z" />
            </svg>
          )}
          {isFuture && (
            <span className="text-gray-300 dark:text-gray-600">
              <LockIcon />
            </span>
          )}
          {isPast && (
            <span className="text-red-400 dark:text-red-600">
              <LockIcon />
            </span>
          )}
        </div>
      </div>

      {hasTrades ? (
        <>
          <div
            className={`text-sm font-semibold ${
              isProfit ? 'text-profit-strong dark:text-profit-strongDark' : 'text-loss-strong dark:text-loss-strongDark'
            }`}
          >
            {formatCurrency(stats!.pnl)}
          </div>
          <div className="text-[11px] leading-tight text-gray-600 dark:text-gray-400">
            Vol: {stats!.volume} Trades: {stats!.tradeCount}
          </div>
          <div className="text-[11px] leading-tight text-gray-600 dark:text-gray-400">
            Win: {stats!.wins} Loss: {stats!.losses}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center text-[11px] text-gray-300 dark:text-gray-600">
          {isFuture ? '' : '—'}
        </div>
      )}

      {stats && stats.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {stats.tags.slice(0, 3).map((tag) => {
            const c = colorForTag(tag)
            return (
              <span
                key={tag}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}
    </button>
  )
}
