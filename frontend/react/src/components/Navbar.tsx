import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

/**
 * Top navigation. Sign in / sign up are placeholders - there is no auth yet
 * and none is planned for this MVP.
 */
export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <img src={logo} alt="byproduct." className="logo-mark" />
        <span className="logo-period">.</span>
      </Link>

      <nav className="nav-links">
        <Link to="/about">About Us</Link>
        <button type="button" className="link-button" disabled title="Coming soon">
          Sign In
        </button>
        <button type="button" className="primary-button" disabled title="Coming soon">
          Sign Up
        </button>
      </nav>
    </header>
  )
}
