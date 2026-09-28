import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatMoney, moq } from '../utils/format'

const INCOTERMS = ['EXW', 'FOB', 'CFR', 'CIF', 'DAP']

export default function Cart() {
  const { user } = useAuth()
  const cart = useCart()
  const [form, setForm] = useState({ type: 'rfq', incoterm: 'CIF', destination: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const belowMoq = cart.lines.some((l) => l.quantity < moq(l.product))

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.submitOrder({
        ...form,
        items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      setResult(res)
      cart.clear()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="container">
        <div className="auth-wrap card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2>{form.type === 'rfq' ? 'Quote request sent' : 'Order placed'}</h2>
            <p className="muted">Reference: <strong>{result.id}</strong>. Our export team will contact you within 24 hours.</p>
            <Link to="/account" className="btn">View my orders</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-head"><h1>Cart & quotation</h1></div>

      {cart.count === 0 ? (
        <div className="card empty">
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn">Browse catalog</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {cart.lines.map(({ product, quantity, unitPrice, lineTotal }) => {
                  const min = moq(product)
                  return (
                    <tr key={product.id} className="cart-item">
                      <td>
                        <Link to={`/products/${product.id}`}><strong>{product.name}</strong></Link>
                        <div className="small muted">{product.sku} · {product.packSize}</div>
                        {quantity < min && <div className="small" style={{ color: 'var(--danger)' }}>MOQ is {min}</div>}
                      </td>
                      <td>{formatMoney(unitPrice)}<div className="small muted">/ {product.unit}</div></td>
                      <td>
                        <div className="qty">
                          <input type="number" min={min} value={quantity} onChange={(e) => cart.update(product.id, Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </td>
                      <td><strong>{formatMoney(lineTotal)}</strong></td>
                      <td><button className="btn btn-link" onClick={() => cart.remove(product.id)}>Remove</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <form className="card" onSubmit={submit}>
            <div className="card-body">
              <h3>Summary</h3>
              <div className="summary-row"><span>Line items</span><span>{cart.count}</span></div>
              <div className="summary-row"><span>Est. pallets</span><span>{cart.pallets.toFixed(1)}</span></div>
              <div className="summary-row total"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>
              <p className="small muted">Excl. freight, insurance and duties. Final price confirmed on pro-forma invoice.</p>

              <div className="form-row">
                <label>Request type</label>
                <select value={form.type} onChange={set('type')}>
                  <option value="rfq">Request for quotation (RFQ)</option>
                  <option value="order">Place order</option>
                </select>
              </div>
              <div className="form-row">
                <label>Incoterm</label>
                <select value={form.incoterm} onChange={set('incoterm')}>
                  {INCOTERMS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Destination port / city</label>
                <input required value={form.destination} onChange={set('destination')} placeholder="e.g. Gothenburg, SE" />
              </div>
              <div className="form-row">
                <label>Notes</label>
                <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Private label, labelling language, delivery window…" />
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {user ? (
                <button className="btn btn-block" disabled={submitting || belowMoq}>
                  {submitting ? 'Sending…' : form.type === 'rfq' ? 'Send quote request' : 'Place order'}
                </button>
              ) : (
                <Link to="/login" state={{ from: '/cart' }} className="btn btn-block">Sign in to continue</Link>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
