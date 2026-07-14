import { useMemo, useState } from 'react'
import type { NewTrade, Trade } from '@renderer/types'
import { tradeStore } from '@renderer/storage/tradeStore'
import { formatCurrency } from '@renderer/utils/calendar'
import { fireConfetti } from '@renderer/utils/confetti'
import TradeForm from './TradeForm'

type SortKey = 'date' | 'symbol' | 'pnl'

interface TradeLogViewProps {
  version: number
  onChange: () => void
}

export default function TradeLogView({ version, onChange }: TradeLogViewProps): JSX.Element {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const trades = useMemo(
    () => tradeStore.listTrades(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  )

  const sorted = useMemo(() => {
    const copy = [...trades]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortKey === 'symbol') cmp = a.symbol.localeCompare(b.symbol)
      else cmp = a.pnl - b.pnl
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [trades, sortKey, sortDir])

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)

  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function handleAdd(input: NewTrade): void {
    const trade = tradeStore.addTrade(input)
    setShowAddForm(false)
    if (trade.pnl > 0) fireConfetti()
    onChange()
  }

  function handleUpdate(input: NewTrade): void {
    if (!editingTrade) return
    tradeStore.updateTrade(editingTrade.id, input)
    setEditingTrade(null)
    onChange()
  }

  function handleDelete(id: string): void {
    tradeStore.deleteTrade(id)
    onChange()
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">All Trades</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {trades.length} trade{trades.length === 1 ? '' : 's'} · Total{' '}
            <span
              className={totalPnl >= 0 ? 'text-profit-strong dark:text-profit-textDark' : 'text-loss-strong dark:text-loss-textDark'}
            >
              {formatCurrency(totalPnl)}
            </span>
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
          >
            + Add trade
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4">
          <TradeForm dateEditable onCancel={() => setShowAddForm(false)} onSave={handleAdd} />
        </div>
      )}

      {trades.length === 0 && !showAddForm ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-10 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
          No trades logged yet. Add your first trade to start building your journal.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-card dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="cursor-pointer select-none px-3 py-2 text-left" onClick={() => toggleSort('date')}>
                  Date{sortIndicator('date')}
                </th>
                <th className="cursor-pointer select-none px-3 py-2 text-left" onClick={() => toggleSort('symbol')}>
                  Symbol{sortIndicator('symbol')}
                </th>
                <th className="px-3 py-2 text-left">Side</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Entry</th>
                <th className="px-3 py-2 text-right">Exit</th>
                <th className="px-3 py-2 text-right">Fees</th>
                <th className="cursor-pointer select-none px-3 py-2 text-right" onClick={() => toggleSort('pnl')}>
                  P&amp;L{sortIndicator('pnl')}
                </th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {sorted.map((t) =>
                editingTrade?.id === t.id ? (
                  <tr key={t.id}>
                    <td colSpan={9} className="p-2">
                      <TradeForm
                        initial={t}
                        dateEditable
                        onCancel={() => setEditingTrade(null)}
                        onSave={handleUpdate}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={t.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{t.date}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                          t.side === 'long'
                            ? 'bg-profit-bg text-profit-text dark:bg-profit-bgDark dark:text-profit-textDark'
                            : 'bg-loss-bg text-loss-text dark:bg-loss-bgDark dark:text-loss-textDark'
                        }`}
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.quantity}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.entryPrice}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.exitPrice}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(t.fees)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        t.pnl >= 0 ? 'text-profit-strong dark:text-profit-textDark' : 'text-loss-strong dark:text-loss-textDark'
                      }`}
                    >
                      {formatCurrency(t.pnl)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setEditingTrade(t)}
                        className="mr-3 text-xs font-medium text-gray-500 hover:text-accent-600 dark:text-gray-400 dark:hover:text-accent-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs font-medium text-gray-500 hover:text-loss-strong dark:text-gray-400 dark:hover:text-loss-textDark"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
