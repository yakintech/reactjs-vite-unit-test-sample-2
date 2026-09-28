import { useSearchParams } from 'react-router-dom'
import * as api from '../api'
import ProductCard from '../components/ProductCard'
import { useAsync } from '../utils/useAsync'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const filters = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    origin: params.get('origin') || '',
    cert: params.get('cert') || '',
    sort: params.get('sort') || '',
  }

  const categories = useAsync(() => api.getCategories())
  const facets = useAsync(() => api.getFacets())
  const products = useAsync(() => api.getProducts(filters), [params.toString()])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const activeCategory = categories.data?.find((c) => c.id === filters.category)

  return (
    <div className="container">
      <div className="page-head">
        <div className="breadcrumb">Home / Catalog{activeCategory && ` / ${activeCategory.name}`}</div>
        <h1>{activeCategory ? activeCategory.name : filters.q ? `Results for “${filters.q}”` : 'Product catalog'}</h1>
      </div>

      <div className="catalog">
        <aside className="card filters">
          <div className="card-body">
            <div>
              <h4>Category</h4>
              <label className="check">
                <input type="radio" name="cat" checked={!filters.category} onChange={() => setFilter('category', '')} /> All
              </label>
              {categories.data?.map((c) => (
                <label key={c.id} className="check">
                  <input type="radio" name="cat" checked={filters.category === c.id} onChange={() => setFilter('category', c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
            <div>
              <h4>Origin</h4>
              <select value={filters.origin} onChange={(e) => setFilter('origin', e.target.value)}>
                <option value="">All countries</option>
                {facets.data?.origins.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <h4>Certification</h4>
              <select value={filters.cert} onChange={(e) => setFilter('cert', e.target.value)}>
                <option value="">Any</option>
                {facets.data?.certifications.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            {params.toString() && (
              <button className="btn btn-outline btn-sm btn-block" onClick={() => setParams({})}>Clear filters</button>
            )}
          </div>
        </aside>

        <section>
          <div className="toolbar">
            <span className="muted">{products.data ? `${products.data.total} products` : ''}</span>
            <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
              <option value="">Sort: Relevance</option>
              <option value="name">Name A–Z</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          {products.loading && <div className="loading">Loading products…</div>}
          {products.error && <div className="alert alert-error">{products.error.message}</div>}
          {products.data && products.data.items.length === 0 && <div className="empty">No products match your filters.</div>}
          {products.data && (
            <div className="product-grid">
              {products.data.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
