import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatMoney, fromPrice, moq } from '../utils/format'

export default function ProductCard({ product }) {
  const { user } = useAuth()

  return (
    <div className="card product-card">
      <Link to={`/products/${product.id}`} className="thumb">
        {product.image ? <img src={product.image} alt={product.name} /> : product.icon}
        <span className="flag">{product.originFlag} {product.origin}</span>
      </Link>
      <div className="body">
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <div className="meta">{product.brand} · {product.packSize}</div>
        <div className="tags">
          {product.certifications.slice(0, 3).map((c) => <span key={c} className="tag">{c}</span>)}
        </div>
        <div className="meta">MOQ: {moq(product)} {product.unit}s</div>
        <div className="price">
          {user ? (
            <>from {formatMoney(fromPrice(product))} <small>/ {product.unit}</small></>
          ) : (
            <Link to="/login" className="small">Sign in to see prices</Link>
          )}
        </div>
      </div>
    </div>
  )
}
