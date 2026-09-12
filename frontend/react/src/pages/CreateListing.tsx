import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing } from '../api/listings'
import { useAuth } from '../auth/AuthContext'

/** Simple form for POST /api/upload - only name and email are required. */
export default function CreateListing() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // No backend file storage yet - this local preview URL only resolves in
  // this browser tab, but it's the closest thing to a real photo for now.
  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const listing = await createListing({
        name,
        category: category.trim() || undefined,
        location: location.trim() || undefined,
        quantity: quantity.trim() || undefined,
        email: email.trim() || undefined,
        image: imagePreview ?? undefined,
        owner: user?.name,
        mailtolink: email.trim()
          ? `mailto:${email.trim()}?subject=${encodeURIComponent(name)}`
          : undefined,
      })
      navigate(`/listings/${listing.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-panel">
      <h1>Create Listing</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="listing-name">Item name</label>
          <input
            id="listing-name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="listing-category">Category</label>
          <input
            id="listing-category"
            type="text"
            placeholder="e.g. wood, metal, paper"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="listing-location">Location</label>
          <input
            id="listing-location"
            type="text"
            placeholder="City, State"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="listing-quantity">Quantity</label>
          <input
            id="listing-quantity"
            type="text"
            placeholder="e.g. 50 units"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="listing-email">Contact email</label>
          <input
            id="listing-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="listing-image">Photo</label>
          <div className="file-input">
            <input
              id="listing-image"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            <label htmlFor="listing-image" className="secondary-button file-input__button">
              Choose File
            </label>
            {imagePreview ? (
              <img src={imagePreview} alt="" className="file-input__preview" />
            ) : (
              <span className="file-input__hint">No photo selected</span>
            )}
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </section>
  )
}
