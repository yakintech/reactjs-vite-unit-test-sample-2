import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('buyer@demo.com')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate(location.state?.from || '/account', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form className="auth-wrap card" onSubmit={submit}>
        <div className="card-body">
          <h1>Buyer sign in</h1>
          <p className="muted">Sign in to see wholesale prices and place orders.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <label htmlFor="email">Business email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-block" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
            No account yet? <Link to="/register">Apply for a trade account</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
