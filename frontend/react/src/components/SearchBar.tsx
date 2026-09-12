import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
  /** Pre-fill the input, e.g. with the query from the URL. */
  initialQuery?: string
  size?: 'large' | 'small'
}

/** Search input + button. Submitting navigates to /search?q=... */
export default function SearchBar({ initialQuery = '', size = 'small' }: Props) {
  const [value, setValue] = useState(initialQuery)
  const navigate = useNavigate()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const query = value.trim()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <form className={`search-bar search-bar--${size}`} onSubmit={handleSubmit} role="search">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search listings..."
        aria-label="Search listings"
      />
      <button type="submit">Search</button>
    </form>
  )
}
