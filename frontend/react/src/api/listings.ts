import type { Listing } from '../types'
import { getJSON, postJSON } from './client'

/**
 * Backend routes (see backend/main.py):
 *
 *   GET  /api/search?query=<q>   full-text-ish search over name/category/location
 *   GET  /api/listings           every listing
 *   GET  /api/listings?id=<id>   a single listing (404 if missing)
 *   POST /api/upload             create a listing - only `name` is required
 *
 * Note the search param is `query`, not `q`, and a single listing is fetched
 * with an `id` query param rather than a path segment.
 */
const SEARCH_PATH = '/api/search'
const LISTINGS_PATH = '/api/listings'
const UPLOAD_PATH = '/api/upload'

/**
 * FastAPI returns bare arrays here, but we also accept a `{ results: [...] }`
 * style envelope so a future change on the backend doesn't break the UI.
 */
function toListingArray(payload: unknown): Listing[] {
  if (Array.isArray(payload)) return payload as Listing[]

  if (payload && typeof payload === 'object') {
    for (const key of ['results', 'listings', 'items', 'data']) {
      const value = (payload as Record<string, unknown>)[key]
      if (Array.isArray(value)) return value as Listing[]
    }
  }

  return []
}

/**
 * Search listings, or return everything when `query` is empty.
 *
 * The empty case deliberately hits /api/listings rather than /api/search with
 * a blank term - it is the endpoint that means "all listings".
 */
export async function searchListings(
  query: string,
  signal?: AbortSignal,
): Promise<Listing[]> {
  const trimmed = query.trim()

  const payload = trimmed
    ? await getJSON<unknown>(SEARCH_PATH, { query: trimmed }, signal)
    : await getJSON<unknown>(LISTINGS_PATH, undefined, signal)

  return toListingArray(payload)
}

/** Fetch a single listing by id. Throws ApiError with status 404 if missing. */
export async function getListing(
  id: string,
  signal?: AbortSignal,
): Promise<Listing> {
  const payload = await getJSON<unknown>(LISTINGS_PATH, { id }, signal)

  // The route is typed `list[ListingOut] | ListingOut` on the backend, so
  // tolerate an array wrapping the single row.
  if (Array.isArray(payload)) {
    const [first] = payload as Listing[]
    return first
  }

  return payload as Listing
}

/** Fields for a new listing. Only `name` is required by the backend. */
export type NewListing = {
  name: string
  category?: string
  location?: string
  quantity?: string
  email?: string
  image?: string
  owner?: string
  mailtolink?: string
}

/** Create a listing. Returns the saved row, including its new id. */
export function createListing(listing: NewListing): Promise<Listing> {
  return postJSON<Listing>(UPLOAD_PATH, listing)
}
