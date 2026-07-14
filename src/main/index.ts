import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

const isDev = !app.isPackaged

const NEWS_FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

// Fetched in the main process (no CORS restrictions) and handed to the renderer over IPC.
ipcMain.handle('daybook:fetch-news', async () => {
  const res = await fetch(NEWS_FEED_URL)
  if (!res.ok) throw new Error(`News feed responded with ${res.status}`)
  return res.json()
})

// Durable journal storage: a JSON file in userData that survives force-kills and
// reinstalls, unlike renderer localStorage whose writes flush asynchronously.
const dataFilePath = (): string => join(app.getPath('userData'), 'daybook-data.json')

ipcMain.handle('daybook:load-data', async () => {
  try {
    const raw = await fs.readFile(dataFilePath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null // first run, or unreadable file — renderer falls back to localStorage
  }
})

ipcMain.handle('daybook:save-data', async (_event, data: unknown) => {
  const file = dataFilePath()
  const tmp = `${file}.tmp`
  // Atomic write: a crash mid-write leaves the previous file intact.
  await fs.writeFile(tmp, JSON.stringify(data), 'utf-8')
  await fs.rename(tmp, file)
  return true
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Daybook',
    // In dev the exe is a generic Electron binary, so point the window at our icon file.
    // Packaged builds take the icon from the exe resource embedded by electron-builder.
    ...(isDev ? { icon: join(__dirname, '../../build/icon.ico') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
