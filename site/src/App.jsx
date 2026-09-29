import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Toast from './components/Toast'
import Account from './pages/Account'
import Cart from './pages/Cart'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Register from './pages/Register'
import Search from './unit-test-components-sample/Search'

function NotFound() {
  return (
    <div className="container empty">
      <h1>Page not found</h1>
      <Link to="/" className="btn">Go home</Link>
    </div>
  )
}

export default function App() {

  return <Search />

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toast />
    </>
  )
}
