import { Navigate } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../context/AuthContext'
import { formatMoney } from '../utils/format'
import { useAsync } from '../utils/useAsync'

export default function Account() {
  const { user, ready } = useAuth()
  const orders = useAsync(() => (user ? api.getOrders() : Promise.resolve([])), [user])

  if (!ready) return <div className="loading">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  return (
    <div className="container">
      <div className="page-head">
        <h1>{user.company}</h1>
        <p className="muted">{user.name} · {user.email} · {user.country}</p>
      </div>

      <div className="cart-layout">
        <div className="card table-wrap">
          <div className="card-body" style={{ paddingBottom: 0 }}><h3>Orders & quotations</h3></div>
          {orders.loading ? (
            <div className="loading">Loading…</div>
          ) : orders.data?.length ? (
            <table className="table">
              <thead>
                <tr><th>Reference</th><th>Date</th><th>Incoterm</th><th>Items</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {orders.data.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>{o.date}</td>
                    <td>{o.incoterm}</td>
                    <td>{o.items}</td>
                    <td>{formatMoney(o.total)}</td>
                    <td><span className={`status status-${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No orders yet.</div>
          )}
        </div>

        <div className="card">
          <div className="card-body">
            <h3>Company details</h3>
            <table className="spec-table">
              <tbody>
                <tr><th>Company</th><td>{user.company}</td></tr>
                <tr><th>Country</th><td>{user.country}</td></tr>
                <tr><th>VAT / Tax ID</th><td>{user.vatNumber || '—'}</td></tr>
                <tr><th>Currency</th><td>{user.currency}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
