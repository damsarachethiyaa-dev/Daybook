import { contextBridge, ipcRenderer } from 'electron'

const api = {
  platform: process.platform,
  fetchNews: (): Promise<unknown> => ipcRenderer.invoke('daybook:fetch-news'),
  loadData: (): Promise<unknown> => ipcRenderer.invoke('daybook:load-data'),
  saveData: (data: unknown): Promise<boolean> => ipcRenderer.invoke('daybook:save-data', data)
}

contextBridge.exposeInMainWorld('daybook', api)
