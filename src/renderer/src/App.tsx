import { useCallback, useEffect, useRef, useState } from 'react'

type ParaphraseDirection = 'id-to-en' | 'en-to-id'
type LlmProvider = 'gemini' | 'deepseek' | 'groq'

interface HistoryEntry {
  id: string
  direction: ParaphraseDirection
  input: string
  output: string
  createdAt: string
}

interface WorkspaceTab {
  id: string
  title: string
  direction: ParaphraseDirection
  input: string
  output: string
  loading: boolean
  error: string | null
  copied: boolean
}

const PREVIEW_LIMIT = 8

const DIRECTION_LABELS: Record<
  ParaphraseDirection,
  { subtitle: string; input: string; output: string; inputPlaceholder: string }
> = {
  'id-to-en': {
    subtitle: 'Indonesia → English (professional, colleague-friendly)',
    input: 'Indonesian',
    output: 'English',
    inputPlaceholder: 'Tempel teks Indonesia di sini...'
  },
  'en-to-id': {
    subtitle: 'English → Indonesia (profesional, ramah kolega)',
    input: 'English',
    output: 'Indonesian',
    inputPlaceholder: 'Paste English text here...'
  }
}

const PROVIDER_LABELS: Record<LlmProvider, { name: string; hint: string; placeholder: string }> = {
  gemini: {
    name: 'Gemini',
    hint: 'Key dari Google AI Studio (aistudio.google.com)',
    placeholder: 'Paste Gemini API key...'
  },
  deepseek: {
    name: 'DeepSeek',
    hint: 'Key dari DeepSeek Platform (platform.deepseek.com/api_keys)',
    placeholder: 'Paste DeepSeek API key (sk-...)...'
  },
  groq: {
    name: 'Groq',
    hint: 'Key dari Groq Console (console.groq.com/keys) — free tier, tanpa kartu kredit',
    placeholder: 'Paste Groq API key (gsk_...)...'
  }
}

function directionBadge(direction: ParaphraseDirection): string {
  return direction === 'id-to-en' ? 'ID → EN' : 'EN → ID'
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} mnt lalu`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function previewText(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max)}…`
}

function tabTitleFromInput(input: string, fallback: string): string {
  const line = input.trim().split('\n')[0]
  if (!line) return fallback
  return line.length > 28 ? `${line.slice(0, 28)}…` : line
}

function createTab(index: number): WorkspaceTab {
  return {
    id: crypto.randomUUID(),
    title: `Tab ${index}`,
    direction: 'id-to-en',
    input: '',
    output: '',
    loading: false,
    error: null,
    copied: false
  }
}

function App(): React.JSX.Element {
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    const first = createTab(1)
    return [first]
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [settingsProvider, setSettingsProvider] = useState<LlmProvider>('gemini')
  const [appSettings, setAppSettings] = useState<{
    provider: LlmProvider
    active: { configured: boolean; source: string; masked: string | null }
    gemini: { configured: boolean }
    deepseek: { configured: boolean }
    groq: { configured: boolean }
  }>({
    provider: 'gemini',
    active: { configured: false, source: 'none', masked: null },
    gemini: { configured: false },
    deepseek: { configured: false },
    groq: { configured: false }
  })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showAllHistory, setShowAllHistory] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const labels = DIRECTION_LABELS[activeTab.direction]
  const visibleHistory = showAllHistory ? history : history.slice(0, PREVIEW_LIMIT)
  const hasMoreHistory = history.length > PREVIEW_LIMIT

  const updateTab = useCallback((tabId: string, patch: Partial<WorkspaceTab>) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab
        const next = { ...tab, ...patch }
        if ('input' in patch) {
          next.title = tabTitleFromInput(patch.input ?? tab.input, tab.title)
        }
        return next
      })
    )
  }, [])

  const refreshSettings = useCallback(async () => {
    const settings = await window.api.getSettings()
    setAppSettings(settings)
    setSettingsProvider(settings.provider)
    if (!settings.active.configured) {
      setShowSettings(true)
    }
  }, [])

  const refreshHistory = useCallback(async () => {
    const entries = await window.api.getHistory()
    setHistory(entries)
  }, [])

  useEffect(() => {
    void refreshSettings()
    void refreshHistory()
  }, [refreshSettings, refreshHistory])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeTabId])

  const addTab = useCallback(() => {
    setTabs((prev) => {
      const next = createTab(prev.length + 1)
      setActiveTabId(next.id)
      return [...prev, next]
    })
  }, [])

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev
        const index = prev.findIndex((t) => t.id === tabId)
        const next = prev.filter((t) => t.id !== tabId)
        if (tabId === activeTabId) {
          const newIndex = Math.min(index, next.length - 1)
          setActiveTabId(next[newIndex].id)
        }
        return next
      })
    },
    [activeTabId]
  )

  const handleNewWindow = useCallback(async () => {
    await window.api.createNewWindow()
  }, [])

  const handleParaphrase = useCallback(async () => {
    if (!activeTab || activeTab.loading || !activeTab.input.trim()) return

    updateTab(activeTab.id, { loading: true, error: null, copied: false })

    try {
      const result = await window.api.paraphrase(activeTab.input, activeTab.direction)
      updateTab(activeTab.id, { output: result.output, loading: false })
      await refreshHistory()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi error. Coba lagi.'
      updateTab(activeTab.id, { error: message, loading: false })
    }
  }, [activeTab, refreshHistory, updateTab])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        void handleParaphrase()
        return
      }
      if (mod && e.key === 't') {
        e.preventDefault()
        addTab()
        return
      }
      if (mod && e.key === 'w') {
        e.preventDefault()
        if (activeTab) closeTab(activeTab.id)
        return
      }
      if (mod && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault()
        void handleNewWindow()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [addTab, activeTab, closeTab, handleNewWindow, handleParaphrase])

  const handleCopy = async (): Promise<void> => {
    if (!activeTab?.output) return
    await navigator.clipboard.writeText(activeTab.output)
    updateTab(activeTab.id, { copied: true })
    setTimeout(() => updateTab(activeTab.id, { copied: false }), 2000)
  }

  const handleClear = (): void => {
    if (!activeTab) return
    const tabIndex = tabs.findIndex((t) => t.id === activeTab.id) + 1
    updateTab(activeTab.id, {
      input: '',
      output: '',
      error: null,
      copied: false,
      title: `Tab ${tabIndex}`
    })
    inputRef.current?.focus()
  }

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) return
    const settings = await window.api.saveApiKey(settingsProvider, apiKeyInput.trim())
    setAppSettings(settings)
    setApiKeyInput('')
  }

  const handleClearKey = async (): Promise<void> => {
    const settings = await window.api.clearApiKey(settingsProvider)
    setAppSettings(settings)
    setApiKeyInput('')
  }

  const handleProviderChange = async (provider: LlmProvider): Promise<void> => {
    setSettingsProvider(provider)
    const settings = await window.api.saveProvider(provider)
    setAppSettings(settings)
    setApiKeyInput('')
  }

  const handleClearHistory = async (): Promise<void> => {
    await window.api.clearHistory()
    setShowAllHistory(false)
    await refreshHistory()
  }

  const handleSelectHistory = (entry: HistoryEntry): void => {
    if (!activeTab) return
    updateTab(activeTab.id, {
      direction: entry.direction,
      input: entry.input,
      output: entry.output,
      error: null,
      copied: false,
      title: tabTitleFromInput(entry.input, 'Dari history')
    })
  }

  const handleDirectionChange = (next: ParaphraseDirection): void => {
    if (!activeTab || next === activeTab.direction) return
    updateTab(activeTab.id, {
      direction: next,
      input: '',
      output: '',
      error: null,
      copied: false
    })
    inputRef.current?.focus()
  }

  const providerMeta = PROVIDER_LABELS[appSettings.provider]

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Paraphrase</h1>
          <p className="subtitle">{labels.subtitle}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={addTab} title="New tab (Ctrl+T)">
            + Tab
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void handleNewWindow()}
            title="New window (Ctrl+Shift+N)"
          >
            + Window
          </button>
          <div className="direction-toggle" role="tablist" aria-label="Paraphrase direction">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab.direction === 'id-to-en'}
              className={`direction-btn ${activeTab.direction === 'id-to-en' ? 'direction-btn--active' : ''}`}
              onClick={() => handleDirectionChange('id-to-en')}
            >
              ID → EN
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab.direction === 'en-to-id'}
              className={`direction-btn ${activeTab.direction === 'en-to-id' ? 'direction-btn--active' : ''}`}
              onClick={() => handleDirectionChange('en-to-id')}
            >
              EN → ID
            </button>
          </div>
          <span
            className={`key-badge ${appSettings.active.configured ? 'key-badge--ok' : 'key-badge--warn'}`}
          >
            {appSettings.active.configured
              ? `${providerMeta.name}: ${appSettings.active.masked} (${appSettings.active.source})`
              : `${providerMeta.name}: API key belum diset`}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => setShowSettings((v) => !v)}>
            Settings
          </button>
        </div>
      </header>

      <div className="workspace-tabs" role="tablist" aria-label="Workspace tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`workspace-tab ${tab.id === activeTabId ? 'workspace-tab--active' : ''}`}
          >
            <button
              type="button"
              className="workspace-tab-label"
              role="tab"
              aria-selected={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.title}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                className="workspace-tab-close"
                aria-label={`Close ${tab.title}`}
                onClick={() => closeTab(tab.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" className="workspace-tab-add" onClick={addTab} aria-label="New tab">
          +
        </button>
      </div>

      {showSettings && (
        <section className="settings">
          <h2>AI Provider & API Key</h2>
          <p className="settings-hint">Pilih provider, lalu paste API key. Disimpan lokal di PC.</p>

          <div className="settings-provider-row">
            <span className="settings-label">Provider aktif</span>
            <div className="direction-toggle" role="tablist" aria-label="LLM provider">
              <button
                type="button"
                role="tab"
                aria-selected={settingsProvider === 'gemini'}
                className={`direction-btn ${settingsProvider === 'gemini' ? 'direction-btn--active' : ''}`}
                onClick={() => void handleProviderChange('gemini')}
              >
                Gemini {appSettings.gemini.configured ? '✓' : ''}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsProvider === 'deepseek'}
                className={`direction-btn ${settingsProvider === 'deepseek' ? 'direction-btn--active' : ''}`}
                onClick={() => void handleProviderChange('deepseek')}
              >
                DeepSeek {appSettings.deepseek.configured ? '✓' : ''}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsProvider === 'groq'}
                className={`direction-btn ${settingsProvider === 'groq' ? 'direction-btn--active' : ''}`}
                onClick={() => void handleProviderChange('groq')}
              >
                Groq {appSettings.groq.configured ? '✓' : ''}
              </button>
            </div>
          </div>

          <p className="settings-hint">{PROVIDER_LABELS[settingsProvider].hint}</p>
          <div className="settings-row">
            <input
              type="password"
              className="settings-input"
              placeholder={PROVIDER_LABELS[settingsProvider].placeholder}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <button type="button" className="btn btn-primary" onClick={() => void handleSaveKey()}>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void handleClearKey()}>
              Clear key
            </button>
          </div>
        </section>
      )}

      <main className="panes">
        <section className="pane">
          <label htmlFor="input-text">{labels.input}</label>
          <textarea
            id="input-text"
            ref={inputRef}
            className="textarea"
            placeholder={labels.inputPlaceholder}
            value={activeTab.input}
            onChange={(e) => updateTab(activeTab.id, { input: e.target.value })}
            spellCheck={false}
          />
        </section>

        <section className="pane">
          <label htmlFor="output-text">{labels.output}</label>
          <textarea
            id="output-text"
            className="textarea textarea--output"
            placeholder="Hasil paraphrase muncul di sini..."
            value={activeTab.output}
            readOnly
            spellCheck={false}
          />
        </section>
      </main>

      {activeTab.error && <div className="error-banner">{activeTab.error}</div>}

      <footer className="toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleParaphrase()}
          disabled={activeTab.loading || !activeTab.input.trim()}
        >
          {activeTab.loading ? 'Paraphrasing...' : 'Paraphrase'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void handleCopy()} disabled={!activeTab.output}>
          {activeTab.copied ? 'Copied!' : 'Copy'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>
          Clear
        </button>
        <span className="hint">Ctrl+Enter · Ctrl+T tab · Ctrl+W tutup tab · Ctrl+Shift+N window</span>
      </footer>

      <section className="history">
        <div className="history-header">
          <h2>History</h2>
          <div className="history-header-actions">
            {history.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleClearHistory()}>
                Clear history
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <p className="history-empty">Belum ada paraphrase tersimpan.</p>
        ) : (
          <>
            <ul className="history-list">
              {visibleHistory.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="history-item"
                    onClick={() => handleSelectHistory(entry)}
                  >
                    <span className="history-item-meta">
                      <span className="history-badge">{directionBadge(entry.direction)}</span>
                      <span className="history-time">{formatTime(entry.createdAt)}</span>
                    </span>
                    <span className="history-preview">{previewText(entry.input)}</span>
                    <span className="history-arrow">→</span>
                    <span className="history-preview history-preview--output">{previewText(entry.output)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {hasMoreHistory && (
              <button
                type="button"
                className="btn btn-ghost btn-sm history-more"
                onClick={() => setShowAllHistory((v) => !v)}
              >
                {showAllHistory ? 'Show less' : `More (${history.length - PREVIEW_LIMIT} lagi)`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default App
