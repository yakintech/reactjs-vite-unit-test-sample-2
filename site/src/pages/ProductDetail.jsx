import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../api'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatMoney, moq, tierFor } from '../utils/format'
import { useAsync } from '../utils/useAsync'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const cart = useCart()
  const { data: product, loading, error } = useAsync(() => api.getProduct(id), [id])
  const [qty, setQty] = useState(0)

  useEffect(() => {
    if (product) setQty(moq(product))
  }, [product])

  if (loading) return <div className="loading">Loading…</div>
  if (error) return <div className="container empty">{error.message}. <Link to="/products">Back to catalog</Link></div>

  const min = moq(product)
  const tier = tierFor(product, qty)
  const valid = qty >= min

  const addToCart = () => {
    cart.add(product, qty)
    toast(`${qty} × ${product.name} added to cart`)
  }

  const specs = [
    ['SKU', product.sku],
    ['Brand', product.brand],
    ['Origin', `${product.originFlag} ${product.origin}`],
    ['Packaging', product.packSize],
    ['Units per pallet', product.unitsPerPallet],
    ['HS code', product.hsCode],
    ['Shelf life', product.shelfLife],
    ['Storage', product.storage],
    ['Incoterms', product.incoterms.join(', ')],
    ['Lead time', `${product.leadTimeDays} days`],
    ['Available stock', `${product.stock} ${product.unit}s`],
  ]

  return (
    <div className="container">
      <div className="page-head">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to={`/products?category=${product.category}`}>Catalog</Link> / {product.name}
        </div>
      </div>

      <div className="pdp">
        <div>
          <div className="gallery">{product.image ? <img src={product.image} alt={product.name} /> : product.icon}</div>
        </div>

        <div className="buy-box">
          <div>
            <h1>{product.name}</h1>
            <div className="tags">{product.certifications.map((c) => <span key={c} className="tag">{c}</span>)}</div>
          </div>
          <p className="muted" style={{ margin: 0 }}>{product.description}</p>

          {user ? (
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: 15 }}>Volume pricing (per {product.unit})</h3>
                <table className="table tier-table">
                  <thead>
                    <tr><th>Quantity</th><th>Unit price</th></tr>
                  </thead>
                  <tbody>
                    {product.priceTiers.map((t, i) => {
                      const next = product.priceTiers[i + 1]
                      return (
                        <tr key={t.minQty} className={t.minQty === tier.minQty && valid ? 'active' : ''}>
                          <td>{t.minQty}{next ? `–${next.minQty - 1}` : '+'} {product.unit}s</td>
                          <td>{formatMoney(t.price)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginTop: 16, flexWrap: 'wrap' }}>
                  <div>
                    <label htmlFor="qty">Quantity ({product.unit}s)</label>
                    <div className="qty">
                      <input id="qty" type="number" min={min} step={1} value={qty} onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                  </div>
                  <button className="btn" disabled={!valid} onClick={addToCart}>Add to cart</button>
                  <button className="btn btn-outline" onClick={() => setQty(product.unitsPerPallet)}>1 pallet</button>
                </div>
                <p className="small muted" style={{ marginBottom: 0 }}>
                  {valid
                    ? <>Estimated total: <strong>{formatMoney(tier.price * qty)}</strong> ({(qty / product.unitsPerPallet).toFixed(2)} pallets)</>
                    : <span style={{ color: 'var(--danger)' }}>Minimum order quantity is {min} {product.unit}s.</span>}
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <strong>Wholesale prices are visible to registered buyers.</strong>
                <p className="muted small">MOQ: {min} {product.unit}s</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/login" state={{ from: `/products/${product.id}` }} className="btn">Sign in</Link>
                  <Link to="/register" className="btn btn-outline">Open trade account</Link>
                </div>
              </div>
            </div>
          )}

          <table className="spec-table">
            <tbody>
              {specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
