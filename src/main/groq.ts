import { emptyInputMessage, getSystemPrompt, normalizeInput } from './prompt'
import { getApiKey } from './settings'
import type { ParaphraseDirection } from './types'

const MODEL = 'llama-3.3-70b-versatile'
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

export async function paraphraseWithGroq(
  text: string,
  direction: ParaphraseDirection
): Promise<string> {
  const apiKey = getApiKey('groq')
  if (!apiKey) {
    throw new Error('Groq API key belum diset. Buka Settings → Groq → paste key.')
  }

  const userText = normalizeInput(text)
  if (!userText) {
    throw new Error(emptyInputMessage(direction))
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: getSystemPrompt(direction) },
        { role: 'user', content: userText }
      ],
      temperature: 0.4,
      max_tokens: 2048,
      stream: false
    })
  })

  const data = (await response.json()) as GroqResponse

  if (!response.ok) {
    const message = data.error?.message ?? `Groq API error (${response.status})`
    throw new Error(message)
  }

  const output = data.choices?.[0]?.message?.content?.trim()
  if (!output) {
    throw new Error('Groq tidak mengembalikan teks. Coba lagi.')
  }

  return output
}
