import { Link } from 'react-router-dom'
import * as api from '../api'
import ProductCard from '../components/ProductCard'
import { useAsync } from '../utils/useAsync'

const FEATURES = [
  { icon: '📦', title: 'Tiered wholesale pricing', text: 'Lower unit prices as your volume grows — from single pallets to full containers.' },
  { icon: '🌍', title: 'Global logistics', text: 'EXW, FOB, CIF and DAP terms with dry and reefer container options.' },
  { icon: '✅', title: 'Certified suppliers', text: 'Halal, Kosher, Organic, BRC, IFS and ISO 22000 certified producers.' },
  { icon: '📄', title: 'Full export documents', text: 'Certificate of origin, phytosanitary, health certificates and COA with every shipment.' },
]

export default function Home() {
  const categories = useAsync(() => api.getCategories())
  const featured = useAsync(() => api.getProducts({ sort: 'name' }))

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Wholesale international food, direct from origin</h1>
          <p>Source dried fruits, olive oil, grains, spices and more from verified producers in 20+ countries. Built for importers, distributors and food-service buyers.</p>
          <div className="actions">
            <Link to="/products" className="btn btn-accent">Browse catalog</Link>
            <Link to="/register" className="btn btn-outline">Open a trade account</Link>
          </div>
          <div className="stats">
            <div><strong>1,200+</strong><span>Products</span></div>
            <div><strong>40+</strong><span>Export countries</span></div>
            <div><strong>350</strong><span>Containers / year</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Shop by category</h2>
            <Link to="/products">View all →</Link>
          </div>
          {categories.loading ? (
            <div className="loading">Loading…</div>
          ) : (
            <div className="cat-grid">
              {categories.data?.map((c) => (
                <Link key={c.id} to={`/products?category=${c.id}`} className="cat-card">
                  <div className="icon">{c.icon}</div>
                  <strong>{c.name}</strong>
                  <span>{c.productCount} products</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-title">
            <h2>Featured products</h2>
            <Link to="/products">See full catalog →</Link>
          </div>
          {featured.loading ? (
            <div className="loading">Loading…</div>
          ) : (
            <div className="product-grid">
              {featured.data?.items.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature">
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta">
            <div>
              <h2>Need a custom quote or private label?</h2>
              <p className="muted" style={{ margin: 0 }}>Add products to your cart and send a Request for Quotation — our export team replies within 24 hours.</p>
            </div>
            <Link to="/products" className="btn">Start a quote</Link>
          </div>
        </div>
      </section>
    </>
  )
}
