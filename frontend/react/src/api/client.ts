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

  if (!response.ok) {
    throw new ApiError(
      response.status === 404
        ? 'Not found.'
        : `The API returned ${response.status} ${response.statusText}.`,
      response.status,
    )
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('The API returned a response that was not valid JSON.')
  }
}
