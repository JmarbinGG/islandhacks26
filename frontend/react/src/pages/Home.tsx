import SearchBar from '../components/SearchBar'
import ListingGrid from '../components/ListingGrid'
import { useListingSearch } from '../hooks/useListings'

/**
 * Landing page: hero search, then a grid of everything the backend returns
 * for an empty query.
 */
export default function Home() {
  const { data, loading, error } = useListingSearch('')

  return (
    <>
      <section className="hero">
        <h1>Find what you need on the island</h1>
        <p>Search listings shared by people nearby.</p>
        <SearchBar size="large" />
      </section>

      <section>
        <h2>Browse Listings</h2>
        <ListingGrid
          listings={data}
          loading={loading}
          error={error}
          emptyMessage="No listings yet."
          onRetry={() => window.location.reload()}
        />
      </section>
    </>
  )
}
