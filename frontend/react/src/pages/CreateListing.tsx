import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzePhoto, createListing } from '../api/listings'
import { API_BASE_URL } from '../api/client'
import { useAuth } from '../auth/AuthContext'

/** Simple form for POST /api/upload - only name and email are required. */
export default function CreateListing() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Runs for either "Choose File" or "Take Photo" - both just feed a File
  // into the same pipeline: upload it for AI analysis, which saves it
  // server-side (real storage now, not just a local blob: preview) and
  // returns a suggested category to fill in automatically.
  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setAnalyzeError(null)
    setAnalyzing(true)
    try {
      const result = await analyzePhoto(file)
      setImageUrl(`${API_BASE_URL}${result.image_url}`)
      setCategory(result.category)
    } catch (err) {
      setImageUrl(null)
      setAnalyzeError(err instanceof Error ? err.message : 'Could not analyze that photo.')
    } finally {
      setAnalyzing(false)
      event.target.value = ''
    }
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
        image: imageUrl ?? undefined,
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
        {/* Photo comes first - it's what feeds the category auto-fill below,
            so seeing/taking it before the rest of the fields follows the
            order you'd actually use them in. */}
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

            {/* Same accept/handler, but `capture` opens the camera directly
                on phones instead of the file library. */}
            <input
              id="listing-photo-capture"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
            />
            <label
              htmlFor="listing-photo-capture"
              className="secondary-button file-input__button"
            >
              Take Photo
            </label>

            {imageUrl ? (
              <img src={imageUrl} alt="" className="file-input__preview" />
            ) : (
              <span className="file-input__hint">
                {analyzing ? 'Analyzing photo...' : 'No photo selected'}
              </span>
            )}
          </div>
          {analyzeError && (
            <p className="form-error" role="alert">
              {analyzeError}
            </p>
          )}
        </div>

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

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={submitting || analyzing}>
          {submitting ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </section>
  )
}
