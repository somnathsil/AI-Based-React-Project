import type { QueryUnderstanding } from './types'

const QUERY_UNDERSTANDING_PROMPT = `You are an AI assistant that helps users find SVG icons. The user will describe what kind of icon they want in natural language.

Your job is to:
1. Understand the user's intent
2. Generate multiple useful search terms that icon libraries might use
3. Consider synonyms, related concepts, and simpler/shorter terms

Return ONLY a valid JSON object with this exact structure:
{
  "originalQuery": "<the original query>",
  "searchTerms": ["term1", "term2", "term3", ...],
  "intent": "<brief description of what icon the user wants>"
}

Rules for searchTerms:
- Include 3-8 search terms
- Start with the most specific, then broader
- Use lowercase
- Use terms that icon libraries actually tag icons with
- Include the core concept as a simple single word
- Consider both American and British spellings if relevant
- Keep terms short (1-3 words max)

Example:
User: "modern analytics dashboard with charts"
Response: {"originalQuery":"modern analytics dashboard with charts","searchTerms":["analytics dashboard","dashboard","data visualization","chart","statistics","admin panel"],"intent":"analytics dashboard icon"}

Do NOT include any text outside the JSON object.`

let abortController: AbortController | null = null

export async function understandQuery(
  userQuery: string,
  apiKey: string,
): Promise<QueryUnderstanding> {
  if (!apiKey) {
    throw new Error('API key is required for AI query understanding.')
  }

  abortController = new AbortController()

  try {
    const response = await fetch('/api/openrouter/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PixelCoders - Icon Search',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: QUERY_UNDERSTANDING_PROMPT },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: abortController.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const msg = errorData?.error?.message || `API error: ${response.status}`
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      }
      throw new Error(msg)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Empty response from AI model')
    }

    return parseUnderstandingResponse(content, userQuery)
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Query understanding cancelled')
    }
    throw error
  } finally {
    abortController = null
  }
}

function parseUnderstandingResponse(
  responseText: string,
  originalQuery: string,
): QueryUnderstanding {
  // Try to extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (
        Array.isArray(parsed.searchTerms) &&
        parsed.searchTerms.length > 0 &&
        typeof parsed.intent === 'string'
      ) {
        // Validate and sanitize
        const searchTerms = parsed.searchTerms
          .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t: string) => t.trim().toLowerCase())
          .slice(0, 8)

        // Always include the original query as a search term
        const originalLower = originalQuery.trim().toLowerCase()
        if (!searchTerms.includes(originalLower)) {
          searchTerms.unshift(originalLower)
        }

        return {
          originalQuery,
          searchTerms,
          intent: String(parsed.intent).slice(0, 200),
        }
      }
    } catch {
      // JSON parsing failed, fall through to fallback
    }
  }

  // Fallback: use the original query as the only search term
  return {
    originalQuery,
    searchTerms: [originalQuery.trim().toLowerCase()],
    intent: originalQuery.trim(),
  }
}

export function cancelQueryUnderstanding(): void {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}
