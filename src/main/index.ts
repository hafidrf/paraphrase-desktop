import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { paraphrase } from './gemini'
import { clearHistory, getHistory } from './history'
import {
  clearApiKey,
  getAppSettings,
  saveApiKey,
  saveProvider
} from './settings'
import type { LlmProvider, ParaphraseDirection } from './types'

let isQuitInProgress = false

function resolveAppIcon(): string | undefined {
  const buildPng = join(__dirname, '../../build/icon.png')
  const buildIco = join(__dirname, '../../build/icon.ico')
  const resourcePng = join(process.resourcesPath, 'icon.png')
  const resourceIco = join(process.resourcesPath, 'icon.ico')
  // Prefer PNG on macOS; ICO is the Windows packaging icon.
  const candidates =
    process.platform === 'darwin'
      ? [buildPng, resourcePng, buildIco, resourceIco]
      : [buildIco, buildPng, resourceIco, resourcePng]
  return candidates.find((p) => existsSync(p))
}

function registerIpcHandlers(): void {
  ipcMain.handle('paraphrase', async (_event, text: string, direction: ParaphraseDirection) => {
    return paraphrase(text, direction)
  })

  ipcMain.handle('get-history', () => getHistory())

  ipcMain.handle('clear-history', () => {
    clearHistory()
    return { ok: true }
  })

  ipcMain.handle('get-settings', () => getAppSettings())

  ipcMain.handle('save-provider', (_event, provider: LlmProvider) => {
    saveProvider(provider)
    return getAppSettings()
  })

  ipcMain.handle('save-api-key', (_event, provider: LlmProvider, key: string) => {
    saveApiKey(provider, key)
    return getAppSettings()
  })

  ipcMain.handle('clear-api-key', (_event, provider: LlmProvider) => {
    clearApiKey(provider)
    return getAppSettings()
  })

  ipcMain.handle('create-new-window', () => {
    createWindow()
    return { ok: true }
  })
}

function createWindow(): BrowserWindow {
  const icon = resolveAppIcon()
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Paraphrase & Translate',
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: true
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    // window removed automatically
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function focusLatestWindow(): void {
  const windows = BrowserWindow.getAllWindows()
  const win = windows[windows.length - 1]
  if (!win) return
  if (win.isMinimized()) {
    win.restore()
  }
  win.show()
  win.focus()
}

function quitApp(): void {
  if (isQuitInProgress) return
  isQuitInProgress = true

  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) {
      window.destroy()
    }
  })

  app.exit(0)
  process.exit(0)
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    createWindow()
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.paraphrase.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      focusLatestWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    quitApp()
  }
})
