import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Props = {
  /** Pre-fill the input, e.g. with the query from the URL. */
  initialQuery?: string
  size?: 'large' | 'small'
}

/**
 * Search input + Search (primary) + Browse (secondary), on one line. Search
 * submits the typed query; Browse jumps straight to all listings.
 */
export default function SearchBar({ initialQuery = '', size = 'small' }: Props) {
  const [value, setValue] = useState(initialQuery)
  const navigate = useNavigate()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const query = value.trim()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <div className={`search-bar search-bar--${size}`}>
      <form className="search-bar__form" onSubmit={handleSubmit} role="search">
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search listings..."
          aria-label="Search listings"
        />
        <button type="submit" className="primary-button">
          Search
        </button>
      </form>
      <Link to="/search" className="secondary-button">
        Browse
      </Link>
    </div>
  )
}
