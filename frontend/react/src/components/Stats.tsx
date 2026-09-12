import { ErrorState, Loading } from './States'
import type { Listing } from '../types'

type Props = {
  listings: Listing[] | null
  loading: boolean
  error: string | null
}

/**
 * Small aggregate numbers computed from the full listings set - replaces the
 * home page's old always-visible listings grid (browsing now happens via the
 * Browse button, at /search).
 */
export default function Stats({ listings, loading, error }: Props) {
  if (loading) return <Loading label="Loading stats..." />
  if (error) return <ErrorState message={error} />

  const rows = listings ?? []
  const available = rows.filter((row) => row.status === 'available').length
  const categories = new Set(rows.map((row) => row.category).filter(Boolean)).size

  return (
    <section className="stats-panel">
      <h2>Marketplace Stats</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total listings</td>
            <td>{rows.length}</td>
          </tr>
          <tr>
            <td>Available now</td>
            <td>{available}</td>
          </tr>
          <tr>
            <td>Categories</td>
            <td>{categories}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
