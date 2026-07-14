import type { DayNote, DayStats, DayTags, NewTrade, Trade } from '@renderer/types'

const KEYS = {
  trades: 'daybook:trades',
  notes: 'daybook:notes',
  tags: 'daybook:tags'
} as const

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

interface DiskData {
  version?: number
  trades?: Trade[]
  notes?: DayNote[]
  tags?: DayTags[]
}

// In Electron, every change is also written to a real file via the main process.
// localStorage alone can lose its most recent (asynchronously flushed) writes if the
// app is force-closed; the file is written atomically and survives that.
function persistToDisk(): void {
  if (!window.daybook?.saveData) return
  void window.daybook
    .saveData({
      version: 1,
      trades: read<Trade[]>(KEYS.trades, []),
      notes: read<DayNote[]>(KEYS.notes, []),
      tags: read<DayTags[]>(KEYS.tags, [])
    })
    .catch(() => {
      // localStorage still has the data; the next successful save catches up.
    })
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
  persistToDisk()
}

// Called once before the app renders: hydrate localStorage from the on-disk file,
// or migrate existing localStorage data into the file on first run.
export async function initStore(): Promise<void> {
  if (!window.daybook?.loadData) return
  try {
    const data = (await window.daybook.loadData()) as DiskData | null
    // An all-empty file must NOT count as data: hydrating from it would wipe any
    // trades still living only in localStorage (pre-file-storage versions).
    const fileHasData =
      !!data &&
      ((data.trades?.length ?? 0) > 0 || (data.notes?.length ?? 0) > 0 || (data.tags?.length ?? 0) > 0)
    const localHasData =
      read<Trade[]>(KEYS.trades, []).length > 0 ||
      read<DayNote[]>(KEYS.notes, []).length > 0 ||
      read<DayTags[]>(KEYS.tags, []).length > 0

    if (fileHasData) {
      localStorage.setItem(KEYS.trades, JSON.stringify(data.trades ?? []))
      localStorage.setItem(KEYS.notes, JSON.stringify(data.notes ?? []))
      localStorage.setItem(KEYS.tags, JSON.stringify(data.tags ?? []))
    } else if (localHasData) {
      persistToDisk() // migrate localStorage-era data into the file
    }
  } catch {
    // If the file can't be read, keep whatever localStorage has.
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function computePnl(t: Pick<Trade, 'side' | 'quantity' | 'entryPrice' | 'exitPrice' | 'fees'>): number {
  const direction = t.side === 'long' ? 1 : -1
  const gross = direction * (t.exitPrice - t.entryPrice) * t.quantity
  return Math.round((gross - t.fees) * 100) / 100
}

export const tradeStore = {
  listTrades(): Trade[] {
    return read<Trade[]>(KEYS.trades, []).sort((a, b) => a.date.localeCompare(b.date))
  },

  listTradesForMonth(year: number, month: number): Trade[] {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return this.listTrades().filter((t) => t.date.startsWith(prefix))
  },

  listTradesForDay(date: string): Trade[] {
    return this.listTrades().filter((t) => t.date === date)
  },

  addTrade(input: NewTrade): Trade {
    const trades = read<Trade[]>(KEYS.trades, [])
    const pnl = input.pnl ?? computePnl(input)
    const trade: Trade = {
      ...input,
      pnl,
      id: uid(),
      createdAt: new Date().toISOString()
    }
    trades.push(trade)
    write(KEYS.trades, trades)
    return trade
  },

  updateTrade(id: string, patch: Partial<NewTrade>): Trade | null {
    const trades = read<Trade[]>(KEYS.trades, [])
    const idx = trades.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const merged = { ...trades[idx], ...patch }
    merged.pnl = patch.pnl ?? computePnl(merged)
    trades[idx] = merged
    write(KEYS.trades, trades)
    return merged
  },

  deleteTrade(id: string): void {
    const trades = read<Trade[]>(KEYS.trades, [])
    write(
      KEYS.trades,
      trades.filter((t) => t.id !== id)
    )
  },

  getNote(date: string): DayNote | null {
    const notes = read<DayNote[]>(KEYS.notes, [])
    return notes.find((n) => n.date === date) ?? null
  },

  setNote(date: string, note: string): void {
    const notes = read<DayNote[]>(KEYS.notes, [])
    const idx = notes.findIndex((n) => n.date === date)
    const entry: DayNote = { date, note, updatedAt: new Date().toISOString() }
    if (note.trim() === '') {
      if (idx !== -1) notes.splice(idx, 1)
    } else if (idx === -1) {
      notes.push(entry)
    } else {
      notes[idx] = entry
    }
    write(KEYS.notes, notes)
  },

  getTags(date: string): string[] {
    const tags = read<DayTags[]>(KEYS.tags, [])
    return tags.find((t) => t.date === date)?.tags ?? []
  },

  setTags(date: string, tags: string[]): void {
    const all = read<DayTags[]>(KEYS.tags, [])
    const idx = all.findIndex((t) => t.date === date)
    const cleaned = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
    if (cleaned.length === 0) {
      if (idx !== -1) all.splice(idx, 1)
    } else if (idx === -1) {
      all.push({ date, tags: cleaned })
    } else {
      all[idx] = { date, tags: cleaned }
    }
    write(KEYS.tags, all)
  },

  getMonthStats(year: number, month: number): Map<string, DayStats> {
    const trades = this.listTradesForMonth(year, month)
    const notes = read<DayNote[]>(KEYS.notes, [])
    const tags = read<DayTags[]>(KEYS.tags, [])
    const byDate = new Map<string, DayStats>()

    for (const t of trades) {
      const existing = byDate.get(t.date)
      const base: DayStats = existing ?? {
        date: t.date,
        pnl: 0,
        volume: 0,
        tradeCount: 0,
        wins: 0,
        losses: 0,
        tags: [],
        hasNote: false
      }
      base.pnl += t.pnl
      base.volume += t.quantity
      base.tradeCount += 1
      if (t.pnl > 0) base.wins += 1
      if (t.pnl < 0) base.losses += 1
      byDate.set(t.date, base)
    }

    for (const n of notes) {
      if (!n.note) continue
      const existing = byDate.get(n.date)
      if (existing) {
        existing.hasNote = true
      } else if (n.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        byDate.set(n.date, {
          date: n.date,
          pnl: 0,
          volume: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0,
          tags: [],
          hasNote: true
        })
      }
    }

    for (const t of tags) {
      if (t.tags.length === 0) continue
      const existing = byDate.get(t.date)
      if (existing) {
        existing.tags = t.tags
      } else if (t.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        byDate.set(t.date, {
          date: t.date,
          pnl: 0,
          volume: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0,
          tags: t.tags,
          hasNote: false
        })
      }
    }

    return byDate
  },

  computePnl
}
