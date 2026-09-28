import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Header() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const onSearch = (e) => {
    e.preventDefault()
    navigate(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>🚢 Worldwide shipping · FOB / CIF / DAP · Reefer & dry containers</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <select defaultValue="en" aria-label="Language">
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="de">Deutsch</option>
              <option value="ar">العربية</option>
            </select>
            <select defaultValue="USD" aria-label="Currency">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </span>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <span className="logo-mark">GF</span> Global Foods
          </Link>
          <form className="search" onSubmit={onSearch}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, SKU, brand, origin…" />
            <button className="btn" type="submit">Search</button>
          </form>
          <nav className="nav">
            <NavLink to="/products" className="hide-sm">Catalog</NavLink>
            {user ? (
              <>
                <NavLink to="/account">{user.company}</NavLink>
                <button className="btn-link btn" onClick={logout}>Sign out</button>
              </>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
            <NavLink to="/cart" className="cart-link">
              Cart{count > 0 && <span className="badge">{count}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <h4>Global Foods Trading Ltd.</h4>
          <p>Wholesale supplier of international food products to importers, distributors, retailers and food-service companies in 40+ countries.</p>
        </div>
        <div>
          <h4>Catalog</h4>
          <Link to="/products?category=dried-fruits">Dried Fruits & Nuts</Link>
          <Link to="/products?category=olive-oil">Olive Oil</Link>
          <Link to="/products?category=grains">Grains & Pulses</Link>
          <Link to="/products?category=spices">Spices</Link>
        </div>
        <div>
          <h4>Buyers</h4>
          <Link to="/register">Open trade account</Link>
          <Link to="/account">My orders</Link>
          <Link to="/cart">Request a quote</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="mailto:sales@example.com">sales@example.com</a>
          <a href="tel:+000000000">+00 000 000 00 00</a>
          <span>Mon–Fri, 09:00–18:00 (GMT+3)</span>
        </div>
      </div>
      <div className="copy">© {new Date().getFullYear()} Global Foods Trading Ltd. All rights reserved.</div>
    </footer>
  )
}

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
