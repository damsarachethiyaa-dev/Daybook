import ThemeSettings from './ThemeSettings'

export type ViewKey = 'calendar' | 'log' | 'news'

interface NavItem {
  key: ViewKey
  label: string
  icon: JSX.Element
}

function CalendarIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
    </svg>
  )
}

function TableIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" strokeLinecap="round" />
    </svg>
  )
}

function NewsIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2-2V8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="5" width="15" height="15" rx="2" />
      <path d="M6 9h7M6 12.5h7M6 16h4" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { key: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { key: 'log', label: 'Trade Log', icon: <TableIcon /> },
  { key: 'news', label: 'News', icon: <NewsIcon /> }
]

interface SidebarProps {
  active: ViewKey
  onSelect: (key: ViewKey) => void
  newsBadge?: number
}

export default function Sidebar({ active, onSelect, newsBadge }: SidebarProps): JSX.Element {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="animate-logo-float flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-sm">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
            <path d="M8 13l2.5 2.5L16 10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="animate-gradient-x bg-gradient-to-r from-accent-600 via-fuchsia-500 to-accent-600 bg-[length:200%_auto] bg-clip-text text-lg font-bold tracking-tight text-transparent">
          Daybook
        </span>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
              active === item.key
                ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-400'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
          >
            {item.icon}
            {item.label}
            {item.key === 'news' && !!newsBadge && newsBadge > 0 && (
              <span className="relative ml-auto flex h-5 min-w-[20px] items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50"></span>
                <span className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {newsBadge}
                </span>
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between px-5 py-4">
        <span className="text-xs text-gray-400 dark:text-gray-500">Daybook v0.1</span>
        <ThemeSettings />
      </div>
    </aside>
  )
}
