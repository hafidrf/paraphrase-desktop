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
