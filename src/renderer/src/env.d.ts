interface DaybookBridge {
  platform: string
  fetchNews: () => Promise<unknown>
  loadData: () => Promise<unknown>
  saveData: (data: unknown) => Promise<boolean>
}

declare global {
  interface Window {
    daybook?: DaybookBridge
  }
}

export {}
