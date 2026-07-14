import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from '@renderer/theme/ThemeContext'
import { initStore } from '@renderer/storage/tradeStore'
import './index.css'

// Hydrate the journal from the on-disk file (Electron) before first render so
// every component sees the durable data from the start.
initStore().finally(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
})
