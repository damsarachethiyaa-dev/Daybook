import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
export type AccentKey = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'violet'

export interface AccentOption {
  key: AccentKey
  label: string
  swatch: string
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { key: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { key: 'blue', label: 'Blue', swatch: '#2563eb' },
  { key: 'emerald', label: 'Emerald', swatch: '#059669' },
  { key: 'rose', label: 'Rose', swatch: '#e11d48' },
  { key: 'amber', label: 'Amber', swatch: '#d97706' },
  { key: 'violet', label: 'Violet', swatch: '#7c3aed' }
]

interface ThemeState {
  mode: ThemeMode
  accent: AccentKey
}

interface ThemeContextValue extends ThemeState {
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentKey) => void
  toggleMode: () => void
}

const STORAGE_KEY = 'daybook:theme'

function loadInitial(): ThemeState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ThemeState>
      return {
        mode: parsed.mode === 'dark' ? 'dark' : 'light',
        accent: ACCENT_OPTIONS.some((a) => a.key === parsed.accent) ? (parsed.accent as AccentKey) : 'indigo'
      }
    } catch {
      // fall through to defaults
    }
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return { mode: prefersDark ? 'dark' : 'light', accent: 'indigo' }
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<ThemeState>(loadInitial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.mode === 'dark')
    document.documentElement.dataset.accent = state.accent
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setMode: (mode) => setState((s) => ({ ...s, mode })),
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
      toggleMode: () => setState((s) => ({ ...s, mode: s.mode === 'dark' ? 'light' : 'dark' }))
    }),
    [state]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
