export type TradeSide = 'long' | 'short'

export interface Trade {
  id: string
  date: string // YYYY-MM-DD
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  exitPrice: number
  fees: number
  pnl: number
  createdAt: string
}

export type NewTrade = Omit<Trade, 'id' | 'createdAt' | 'pnl'> & { pnl?: number }

export interface DayNote {
  date: string // YYYY-MM-DD
  note: string
  updatedAt: string
}

export interface DayTags {
  date: string // YYYY-MM-DD
  tags: string[]
}

export interface DayStats {
  date: string
  pnl: number
  volume: number
  tradeCount: number
  wins: number
  losses: number
  tags: string[]
  hasNote: boolean
}
