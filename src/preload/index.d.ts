import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AppSettingsView,
  HistoryEntry,
  LlmProvider,
  ParaphraseDirection,
  ParaphraseResult
} from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      paraphrase: (text: string, direction: ParaphraseDirection) => Promise<ParaphraseResult>
      getHistory: () => Promise<HistoryEntry[]>
      clearHistory: () => Promise<{ ok: boolean }>
      getSettings: () => Promise<AppSettingsView>
      saveProvider: (provider: LlmProvider) => Promise<AppSettingsView>
      saveApiKey: (provider: LlmProvider, key: string) => Promise<AppSettingsView>
      clearApiKey: (provider: LlmProvider) => Promise<AppSettingsView>
      createNewWindow: () => Promise<{ ok: boolean }>
    }
  }
}

export {}
