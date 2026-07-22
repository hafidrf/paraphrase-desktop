import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export type ParaphraseDirection = 'id-to-en' | 'en-to-id'
export type LlmProvider = 'gemini' | 'deepseek' | 'groq'

export interface HistoryEntry {
  id: string
  direction: ParaphraseDirection
  input: string
  output: string
  createdAt: string
}

export interface ParaphraseResult {
  output: string
  entry: HistoryEntry
}

export interface ProviderKeyStatus {
  configured: boolean
  source: 'saved' | 'env' | 'none'
  masked: string | null
}

export interface AppSettingsView {
  provider: LlmProvider
  active: ProviderKeyStatus
  gemini: ProviderKeyStatus
  deepseek: ProviderKeyStatus
  groq: ProviderKeyStatus
}

const api = {
  paraphrase: (text: string, direction: ParaphraseDirection): Promise<ParaphraseResult> =>
    ipcRenderer.invoke('paraphrase', text, direction),
  getHistory: (): Promise<HistoryEntry[]> => ipcRenderer.invoke('get-history'),
  clearHistory: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('clear-history'),
  getSettings: (): Promise<AppSettingsView> => ipcRenderer.invoke('get-settings'),
  saveProvider: (provider: LlmProvider): Promise<AppSettingsView> =>
    ipcRenderer.invoke('save-provider', provider),
  saveApiKey: (provider: LlmProvider, key: string): Promise<AppSettingsView> =>
    ipcRenderer.invoke('save-api-key', provider, key),
  clearApiKey: (provider: LlmProvider): Promise<AppSettingsView> =>
    ipcRenderer.invoke('clear-api-key', provider),
  createNewWindow: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('create-new-window')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
