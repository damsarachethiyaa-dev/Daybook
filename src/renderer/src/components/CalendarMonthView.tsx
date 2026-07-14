import { useMemo } from 'react'
import { tradeStore } from '@renderer/storage/tradeStore'
import { buildMonthGrid, WEEKDAY_NAMES } from '@renderer/utils/calendar'
import type { NewsEvent } from '@renderer/services/newsService'
import DayCell from './DayCell'

interface CalendarMonthViewProps {
  year: number
  month: number
  version: number
  todayKey: string
  newsByDate: Map<string, NewsEvent[]>
  onSelectDay: (dateKey: string) => void
}

export default function CalendarMonthView({
  year,
  month,
  version,
  todayKey,
  newsByDate,
  onSelectDay
}: CalendarMonthViewProps): JSX.Element {
  // todayKey is a dependency so the grid recomputes today/locked flags at midnight.
  const cells = useMemo(
    () => buildMonthGrid(year, month),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, todayKey]
  )
  const statsByDate = useMemo(
    () => tradeStore.getMonthStats(year, month),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, version]
  )

  const weeks: (typeof cells)[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4">
      <div className="grid grid-cols-7 gap-2 pb-2">
        {WEEKDAY_NAMES.map((w) => (
          <div
            key={w}
            className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-2">
        {weeks.map((week, wi) =>
          week.map((cell) => (
            <DayCell
              key={`${wi}-${cell.dateKey}`}
              day={cell.date.getDate()}
              inCurrentMonth={cell.inCurrentMonth}
              isToday={cell.isToday}
              isFuture={cell.isFuture}
              isPast={cell.isPast}
              stats={statsByDate.get(cell.dateKey)}
              news={newsByDate.get(cell.dateKey)}
              onClick={() => onSelectDay(cell.dateKey)}
            />
          ))
        )}
      </div>
    </div>
  )
}
