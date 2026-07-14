import { useEffect, useRef, useState } from 'react'
import { ACCENT_OPTIONS, useTheme } from '@renderer/theme/ThemeContext'

function SunIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  )
}

function MoonIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  )
}

function PaletteIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3c1.9 0 3.4-1.5 3.4-3.4C20.7 6.6 16.8 2 12 2Z"
      />
      <circle cx="7" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function ThemeSettings(): JSX.Element {
  const { mode, accent, setAccent, toggleMode } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance settings"
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <PaletteIcon />
      </button>

      {open && (
        <div className="animate-popover-in absolute bottom-full left-0 z-20 mb-2 w-60 rounded-xl border border-gray-200 bg-white p-3 shadow-popover dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Appearance
            </div>
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              <button
                onClick={() => mode !== 'light' && toggleMode()}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  mode === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <SunIcon /> Light
              </button>
              <button
                onClick={() => mode !== 'dark' && toggleMode()}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  mode === 'dark'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <MoonIcon /> Dark
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Accent color
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setAccent(opt.key)}
                  aria-label={opt.label}
                  title={opt.label}
                  className={`flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-white transition-all dark:ring-offset-gray-800 ${
                    accent === opt.key ? 'ring-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: opt.swatch }}
                >
                  {accent === opt.key && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
