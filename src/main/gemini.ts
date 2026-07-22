import { emptyInputMessage, getSystemPrompt, normalizeInput } from './prompt'
import { addHistoryEntry } from './history'
import { getApiKey, getProvider } from './settings'
import type { ParaphraseDirection, ParaphraseResult } from './types'
import { paraphraseWithDeepSeek } from './deepseek'
import { paraphraseWithGroq } from './groq'

const MODEL = 'gemini-2.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: {
    message?: string
    status?: string
  }
}

export async function paraphraseWithGemini(
  text: string,
  direction: ParaphraseDirection
): Promise<string> {
  const apiKey = getApiKey('gemini')
  if (!apiKey) {
    throw new Error('Gemini API key belum diset. Buka Settings → Gemini → paste key.')
  }

  const userText = normalizeInput(text)
  if (!userText) {
    throw new Error(emptyInputMessage(direction))
  }

  const response = await fetch(`${API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: getSystemPrompt(direction) }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    })
  })

  const data = (await response.json()) as GeminiResponse

  if (!response.ok) {
    const message = data.error?.message ?? `Gemini API error (${response.status})`
    throw new Error(message)
  }

  const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!output) {
    throw new Error('Gemini tidak mengembalikan teks. Coba lagi atau periksa quota.')
  }

  return output
}

export async function paraphrase(text: string, direction: ParaphraseDirection): Promise<ParaphraseResult> {
  const provider = getProvider()
  let output: string

  if (provider === 'deepseek') {
    output = await paraphraseWithDeepSeek(text, direction)
  } else if (provider === 'groq') {
    output = await paraphraseWithGroq(text, direction)
  } else {
    output = await paraphraseWithGemini(text, direction)
  }

  const userText = normalizeInput(text)
  const entry = addHistoryEntry(direction, userText, output)
  return { output, entry }
}
