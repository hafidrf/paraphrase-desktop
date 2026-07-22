import { app } from 'electron'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { HistoryEntry, ParaphraseDirection } from './types'

const HISTORY_FILE = 'history.json'
const MAX_ENTRIES = 200

function historyPath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return join(dir, HISTORY_FILE)
}

function readHistory(): HistoryEntry[] {
  const path = historyPath()
  if (!existsSync(path)) {
    return []
  }
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8')) as HistoryEntry[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  writeFileSync(historyPath(), JSON.stringify(entries, null, 2), 'utf-8')
}

export function getHistory(): HistoryEntry[] {
  return readHistory().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function addHistoryEntry(
  direction: ParaphraseDirection,
  input: string,
  output: string
): HistoryEntry {
  const entry: HistoryEntry = {
    id: randomUUID(),
    direction,
    input,
    output,
    createdAt: new Date().toISOString()
  }

  const entries = [entry, ...readHistory()].slice(0, MAX_ENTRIES)
  writeHistory(entries)
  return entry
}

export function clearHistory(): void {
  writeHistory([])
}
