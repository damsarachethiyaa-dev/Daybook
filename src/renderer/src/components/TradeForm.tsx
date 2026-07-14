import { useState } from 'react'
import type { NewTrade, Trade, TradeSide } from '@renderer/types'
import { tradeStore } from '@renderer/storage/tradeStore'
import { formatCurrency, toDateKey } from '@renderer/utils/calendar'

interface TradeFormProps {
  date?: string
  dateEditable?: boolean
  initial?: Trade
  onCancel: () => void
  onSave: (trade: NewTrade) => void
}

interface FormState {
  date: string
  symbol: string
  side: TradeSide
  quantity: string
  entryPrice: string
  exitPrice: string
  fees: string
  profit: string
}

const inputClass =
  'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
const labelClass = 'flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-400'

function toFormState(t: Trade | undefined, fallbackDate: string): FormState {
  if (!t)
    return {
      date: fallbackDate,
      symbol: '',
      side: 'long',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      fees: '0',
      profit: ''
    }
  // If the stored P&L differs from what the price fields compute, it was entered manually —
  // prefill the Profit field so editing keeps the override.
  const computed = tradeStore.computePnl(t)
  const wasManual = Math.abs(t.pnl - computed) > 0.005
  return {
    date: t.date,
    symbol: t.symbol,
    side: t.side,
    quantity: String(t.quantity),
    entryPrice: String(t.entryPrice),
    exitPrice: String(t.exitPrice),
    fees: String(t.fees),
    profit: wasManual ? String(t.pnl) : ''
  }
}

export default function TradeForm({ date, dateEditable, initial, onCancel, onSave }: TradeFormProps): JSX.Element {
  const todayKey = toDateKey(new Date())
  const [form, setForm] = useState<FormState>(toFormState(initial, date ?? todayKey))
  const [error, setError] = useState<string | null>(null)

  const quantity = parseFloat(form.quantity) || 0
  const entryPrice = parseFloat(form.entryPrice) || 0
  const exitPrice = parseFloat(form.exitPrice) || 0
  const fees = parseFloat(form.fees) || 0
  const manualProfit = form.profit.trim() === '' ? null : parseFloat(form.profit)
  const hasManualProfit = manualProfit !== null && !isNaN(manualProfit)
  const previewPnl = hasManualProfit
    ? manualProfit
    : tradeStore.computePnl({ side: form.side, quantity, entryPrice, exitPrice, fees })

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (form.date > todayKey) {
      setError("Can't log a trade for a future date")
      return
    }
    if (!form.symbol.trim()) {
      setError('Symbol is required')
      return
    }
    if (form.profit.trim() !== '' && !hasManualProfit) {
      setError('Profit must be a number (use a minus sign for a loss, e.g. -120)')
      return
    }
    if (!hasManualProfit && quantity <= 0) {
      setError('Enter either a Profit amount or a Quantity with prices')
      return
    }
    setError(null)
    onSave({
      date: form.date,
      symbol: form.symbol.trim().toUpperCase(),
      side: form.side,
      quantity,
      entryPrice,
      exitPrice,
      fees,
      ...(hasManualProfit ? { pnl: Math.round(manualProfit * 100) / 100 } : {})
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dateEditable && (
          <label className={labelClass}>
            Date
            <input
              type="date"
              value={form.date}
              max={todayKey}
              onChange={(e) => update('date', e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className={labelClass}>
          Symbol
          <input
            autoFocus
            value={form.symbol}
            onChange={(e) => update('symbol', e.target.value)}
            placeholder="AAPL"
            className={`${inputClass} uppercase`}
          />
        </label>

        <label className={labelClass}>
          Side
          <select
            value={form.side}
            onChange={(e) => update('side', e.target.value as TradeSide)}
            className={inputClass}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>

        <label className={labelClass}>
          Quantity
          <input
            type="number"
            min="0"
            step="any"
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
            placeholder="100"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Entry price
          <input
            type="number"
            min="0"
            step="any"
            value={form.entryPrice}
            onChange={(e) => update('entryPrice', e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Exit price
          <input
            type="number"
            min="0"
            step="any"
            value={form.exitPrice}
            onChange={(e) => update('exitPrice', e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Fees
          <input
            type="number"
            min="0"
            step="any"
            value={form.fees}
            onChange={(e) => update('fees', e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className={`${labelClass} text-accent-700 dark:text-accent-400`}>
          Profit (optional)
          <input
            type="number"
            step="any"
            value={form.profit}
            onChange={(e) => update('profit', e.target.value)}
            placeholder="e.g. 250 or -120"
            title="Enter your profit or loss directly — this overrides the calculated P&L. Leave empty to calculate from prices."
            className={`${inputClass} border-accent-400 dark:border-accent-600`}
          />
        </label>
      </div>

      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        Fill <span className="font-semibold text-accent-600 dark:text-accent-400">Profit</span> to log your P&amp;L
        directly (negative = loss) — prices are then optional. Leave it empty to calculate from entry/exit.
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {hasManualProfit ? 'P&L (manual):' : 'Est. P&L:'}{' '}
          <span
            className={`font-semibold ${previewPnl >= 0 ? 'text-profit-strong dark:text-profit-textDark' : 'text-loss-strong dark:text-loss-textDark'}`}
          >
            {formatCurrency(previewPnl)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
          >
            {initial ? 'Save changes' : 'Add trade'}
          </button>
        </div>
      </div>
      {error && <div className="mt-2 text-xs font-medium text-loss-strong dark:text-loss-textDark">{error}</div>}
    </form>
  )
}
