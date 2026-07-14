import { useEffect, useMemo, useState } from 'react'
import type { NewTrade, Trade } from '@renderer/types'
import type { NewsEvent } from '@renderer/services/newsService'
import { IMPACT_STYLES } from '@renderer/services/newsService'
import { tradeStore } from '@renderer/storage/tradeStore'
import { formatCurrency } from '@renderer/utils/calendar'
import { colorForTag } from '@renderer/utils/tagColors'
import { fireConfetti } from '@renderer/utils/confetti'
import TradeForm from './TradeForm'

interface DayDetailModalProps {
  dateKey: string
  newsEvents: NewsEvent[]
  onClose: () => void
  onChange: () => void
}

function formatHeaderDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DayDetailModal({ dateKey, newsEvents, onClose, onChange }: DayDetailModalProps): JSX.Element {
  const [refresh, setRefresh] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')

  const trades = useMemo(
    () => tradeStore.listTradesForDay(dateKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey, refresh]
  )
  const tags = useMemo(
    () => tradeStore.getTags(dateKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey, refresh]
  )
  const dayPnl = trades.reduce((sum, t) => sum + t.pnl, 0)

  useEffect(() => {
    setNoteDraft(tradeStore.getNote(dateKey)?.note ?? '')
  }, [dateKey, refresh])

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function bump(): void {
    setRefresh((r) => r + 1)
    onChange()
  }

  function handleAddTrade(input: NewTrade): void {
    const trade = tradeStore.addTrade(input)
    setShowAddForm(false)
    if (trade.pnl > 0) fireConfetti()
    bump()
  }

  function handleUpdateTrade(input: NewTrade): void {
    if (!editingTrade) return
    tradeStore.updateTrade(editingTrade.id, input)
    setEditingTrade(null)
    bump()
  }

  function handleDeleteTrade(id: string): void {
    tradeStore.deleteTrade(id)
    bump()
  }

  function handleNoteBlur(): void {
    tradeStore.setNote(dateKey, noteDraft)
    onChange()
  }

  function handleAddTag(e?: React.SyntheticEvent): void {
    e?.preventDefault()
    const value = tagDraft.trim()
    if (!value) return
    tradeStore.setTags(dateKey, [...tags, value])
    setTagDraft('')
    bump()
  }

  function handleRemoveTag(tag: string): void {
    tradeStore.setTags(
      dateKey,
      tags.filter((t) => t !== tag)
    )
    bump()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-modal-in flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatHeaderDate(dateKey)}</h2>
            {trades.length > 0 && (
              <span
                className={`text-sm font-medium ${dayPnl >= 0 ? 'text-profit-strong dark:text-profit-textDark' : 'text-loss-strong dark:text-loss-textDark'}`}
              >
                {formatCurrency(dayPnl)} · {trades.length} trade{trades.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trades</h3>
              {!showAddForm && !editingTrade && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-md bg-accent-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
                >
                  + Add trade
                </button>
              )}
            </div>

            {trades.length > 0 && (
              <div className="mb-3 flex flex-col gap-2">
                {trades.map((t) =>
                  editingTrade?.id === t.id ? (
                    <TradeForm
                      key={t.id}
                      date={dateKey}
                      initial={t}
                      onCancel={() => setEditingTrade(null)}
                      onSave={handleUpdateTrade}
                    />
                  ) : (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{t.symbol}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            t.side === 'long'
                              ? 'bg-profit-bg text-profit-text dark:bg-profit-bgDark dark:text-profit-textDark'
                              : 'bg-loss-bg text-loss-text dark:bg-loss-bgDark dark:text-loss-textDark'
                          }`}
                        >
                          {t.side}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t.quantity} @ {t.entryPrice} → {t.exitPrice}
                        </span>
                        {t.fees > 0 && (
                          <span className="text-gray-400 dark:text-gray-500">fees {formatCurrency(t.fees)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${t.pnl >= 0 ? 'text-profit-strong dark:text-profit-textDark' : 'text-loss-strong dark:text-loss-textDark'}`}
                        >
                          {formatCurrency(t.pnl)}
                        </span>
                        <button
                          onClick={() => setEditingTrade(t)}
                          className="text-xs font-medium text-gray-500 hover:text-accent-600 dark:text-gray-400 dark:hover:text-accent-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrade(t.id)}
                          className="text-xs font-medium text-gray-500 hover:text-loss-strong dark:text-gray-400 dark:hover:text-loss-textDark"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {trades.length === 0 && !showAddForm && (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500">
                No trades logged for this day yet.
              </p>
            )}

            {showAddForm && (
              <TradeForm date={dateKey} onCancel={() => setShowAddForm(false)} onSave={handleAddTrade} />
            )}
          </div>

          {newsEvents.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                📰 Economic events
                {newsEvents.some((e) => e.impact === 'High') && (
                  <span className="animate-pulse rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    High impact
                  </span>
                )}
              </h3>
              <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700/70 dark:border-gray-700">
                {newsEvents.map((e) => {
                  const style = IMPACT_STYLES[e.impact]
                  return (
                    <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                      <span className="w-14 shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {e.time}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${style.chip}`}>
                        {style.label}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {e.country}
                      </span>
                      <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{e.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const c = colorForTag(tag)
                return (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="opacity-60 hover:opacity-100">
                      ✕
                    </button>
                  </span>
                )
              })}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag (e.g. ORB-ENTRY) and press Enter"
                className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Add
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Day note</h3>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={handleNoteBlur}
              rows={4}
              placeholder="What happened today? Mental state, mistakes, lessons learned…"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
