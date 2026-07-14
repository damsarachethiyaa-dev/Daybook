export interface CalendarCell {
  date: Date
  dateKey: string
  inCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  isPast: boolean
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay() // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startWeekday)

  const today = new Date()
  const cells: CalendarCell[] = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const isToday = isSameDay(date, today)
    cells.push({
      date,
      dateKey: toDateKey(date),
      inCurrentMonth: date.getMonth() === month,
      isToday,
      isFuture: date.getTime() > today.getTime() && !isToday,
      isPast: date.getTime() < today.getTime() && !isToday
    })
  }

  // Trim trailing all-next-month weeks so short months don't show a dangling empty row.
  while (cells.length > 35 && cells.slice(-7).every((c) => !c.inCurrentMonth)) {
    cells.splice(-7, 7)
  }

  return cells
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
