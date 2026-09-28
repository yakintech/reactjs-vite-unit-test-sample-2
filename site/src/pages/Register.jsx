import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

const BUSINESS_TYPES = ['Importer', 'Distributor', 'Wholesaler', 'Retail chain', 'Food service / HoReCa', 'Food manufacturer']

export default function Register() {
  const [form, setForm] = useState({
    company: '', name: '', email: '', phone: '', country: '', vatNumber: '', businessType: BUSINESS_TYPES[0], password: '',
  })
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.register(form)
      setDone(res.message || 'Application received.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form className="auth-wrap card" style={{ maxWidth: 640 }} onSubmit={submit}>
        <div className="card-body">
          <h1>Open a trade account</h1>
          <p className="muted">Trade accounts are for registered businesses only. We verify every application.</p>

          {done ? (
            <>
              <div className="alert alert-success">{done}</div>
              <Link to="/login" className="btn">Go to sign in</Link>
            </>
          ) : (
            <>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-grid">
                <div className="form-row"><label>Company name</label><input required value={form.company} onChange={set('company')} /></div>
                <div className="form-row">
                  <label>Business type</label>
                  <select value={form.businessType} onChange={set('businessType')}>
                    {BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-row"><label>Contact name</label><input required value={form.name} onChange={set('name')} /></div>
                <div className="form-row"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
                <div className="form-row"><label>Business email</label><input type="email" required value={form.email} onChange={set('email')} /></div>
                <div className="form-row"><label>Password</label><input type="password" required minLength={8} value={form.password} onChange={set('password')} /></div>
                <div className="form-row"><label>Country</label><input required value={form.country} onChange={set('country')} /></div>
                <div className="form-row"><label>VAT / Tax ID</label><input value={form.vatNumber} onChange={set('vatNumber')} /></div>
              </div>
              <button className="btn btn-block" disabled={loading}>{loading ? 'Submitting…' : 'Submit application'}</button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
