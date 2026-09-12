/**
 * Thin fetch wrapper. Every backend call in the app goes through here so the
 * base URL, error handling and JSON parsing live in exactly one place.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
).replace(/\/$/, '')

/** An HTTP or network failure, carrying the status code when we have one. */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** FastAPI's HTTPException body is `{ "detail": "..." }` - surface that when present. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && typeof (body as { detail?: unknown }).detail === 'string') {
      return (body as { detail: string }).detail
    }
  } catch {
    // Body wasn't JSON - fall through to the generic message below.
  }
  return response.status === 404
    ? 'Not found.'
    : `The API returned ${response.status} ${response.statusText}.`
}

/**
 * GET `path` and parse the JSON body.
 *
 * @param path   Path relative to API_BASE_URL, e.g. `/api/listings`.
 * @param params Query params. Null/undefined/empty values are dropped.
 * @param signal Abort signal, so stale requests can be cancelled.
 */
export async function getJSON<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  let response: Response
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    // AbortError means we cancelled on purpose - let callers ignore it.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      `Could not reach the API at ${API_BASE_URL}. Is the backend running?`,
    )
  }

  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('The API returned a response that was not valid JSON.')
  }
}

/**
 * POST `path` with a JSON body and parse the JSON response.
 *
 * @param path Path relative to API_BASE_URL, e.g. `/api/login`.
 * @param body Request body, sent as JSON.
 */
export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      `Could not reach the API at ${API_BASE_URL}. Is the backend running?`,
    )
  }

  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('The API returned a response that was not valid JSON.')
  }
}
