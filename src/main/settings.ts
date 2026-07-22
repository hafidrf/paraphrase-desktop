import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { LlmProvider } from './types'

const SETTINGS_FILE = 'settings.json'

interface SettingsFile {
  provider?: LlmProvider
  apiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  groqApiKey?: string
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

function settingsPath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return join(dir, SETTINGS_FILE)
}

function maskKey(key: string): string {
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}

function migrateSettings(raw: SettingsFile): SettingsFile {
  if (raw.apiKey && !raw.geminiApiKey) {
    return {
      ...raw,
      geminiApiKey: raw.apiKey,
      apiKey: undefined
    }
  }
  return raw
}

function readSettings(): SettingsFile {
  const path = settingsPath()
  if (!existsSync(path)) {
    return { provider: 'gemini' }
  }
  try {
    return migrateSettings(JSON.parse(readFileSync(path, 'utf-8')) as SettingsFile)
  } catch {
    return { provider: 'gemini' }
  }
}

function writeSettings(settings: SettingsFile): void {
  writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

function envKey(provider: LlmProvider): string | null {
  if (provider === 'gemini') {
    return import.meta.env.MAIN_VITE_GEMINI_API_KEY?.trim() || null
  }
  if (provider === 'deepseek') {
    return import.meta.env.MAIN_VITE_DEEPSEEK_API_KEY?.trim() || null
  }
  return import.meta.env.MAIN_VITE_GROQ_API_KEY?.trim() || null
}

function savedKey(settings: SettingsFile, provider: LlmProvider): string | null {
  if (provider === 'gemini') {
    return settings.geminiApiKey?.trim() || null
  }
  if (provider === 'deepseek') {
    return settings.deepseekApiKey?.trim() || null
  }
  return settings.groqApiKey?.trim() || null
}

function keyStatusFor(settings: SettingsFile, provider: LlmProvider): ProviderKeyStatus {
  const saved = savedKey(settings, provider)
  if (saved) {
    return { configured: true, source: 'saved', masked: maskKey(saved) }
  }

  const fromEnv = envKey(provider)
  if (fromEnv) {
    return { configured: true, source: 'env', masked: maskKey(fromEnv) }
  }

  return { configured: false, source: 'none', masked: null }
}

export function getProvider(): LlmProvider {
  return readSettings().provider ?? 'gemini'
}

export function saveProvider(provider: LlmProvider): void {
  const settings = readSettings()
  writeSettings({ ...settings, provider })
}

export function getApiKey(provider?: LlmProvider): string | null {
  const active = provider ?? getProvider()
  const settings = readSettings()
  return savedKey(settings, active) ?? envKey(active)
}

export function saveApiKey(provider: LlmProvider, key: string): void {
  const settings = readSettings()
  const trimmed = key.trim()
  if (provider === 'gemini') {
    writeSettings({ ...settings, geminiApiKey: trimmed })
  } else if (provider === 'deepseek') {
    writeSettings({ ...settings, deepseekApiKey: trimmed })
  } else {
    writeSettings({ ...settings, groqApiKey: trimmed })
  }
}

export function clearApiKey(provider: LlmProvider): void {
  const settings = readSettings()
  if (provider === 'gemini') {
    writeSettings({ ...settings, geminiApiKey: undefined })
  } else if (provider === 'deepseek') {
    writeSettings({ ...settings, deepseekApiKey: undefined })
  } else {
    writeSettings({ ...settings, groqApiKey: undefined })
  }
}

export function hasApiKey(provider?: LlmProvider): boolean {
  return Boolean(getApiKey(provider))
}

export function getAppSettings(): AppSettingsView {
  const settings = readSettings()
  const provider = settings.provider ?? 'gemini'
  return {
    provider,
    active: keyStatusFor(settings, provider),
    gemini: keyStatusFor(settings, 'gemini'),
    deepseek: keyStatusFor(settings, 'deepseek'),
    groq: keyStatusFor(settings, 'groq')
  }
}
