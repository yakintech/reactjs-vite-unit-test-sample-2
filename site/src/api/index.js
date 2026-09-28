// Every data call the UI makes lives here.
// With VITE_USE_MOCK=true the mock branch runs; otherwise the real endpoint is called.
// The endpoint paths below are suggestions — adjust them to match your API.

import { USE_MOCK, request, mockDelay, ApiError, tokenStore } from './client'
import * as mock from './mockData'

/* ---------------- Catalog ---------------- */

// GET /categories -> Category[]
export function getCategories() {
  if (USE_MOCK) return mockDelay(mock.categories)
  return request('/categories')
}

// GET /products?category=&q=&origin=&cert=&sort=&page=&pageSize=
// -> { items: Product[], total: number }
export function getProducts(filters = {}) {
  if (!USE_MOCK) return request('/products', { params: filters })

  const { category, q, origin, cert, sort } = filters
  let items = mock.products.filter((p) => {
    if (category && p.category !== category) return false
    if (origin && p.origin !== origin) return false
    if (cert && !p.certifications.includes(cert)) return false
    if (q) {
      const s = q.toLowerCase()
      if (![p.name, p.sku, p.brand, p.origin].some((f) => f.toLowerCase().includes(s))) return false
    }
    return true
  })
  if (sort === 'price-asc') items.sort((a, b) => a.priceTiers[0].price - b.priceTiers[0].price)
  if (sort === 'price-desc') items.sort((a, b) => b.priceTiers[0].price - a.priceTiers[0].price)
  if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name))
  return mockDelay({ items, total: items.length })
}

// GET /products/:id -> Product
export function getProduct(id) {
  if (!USE_MOCK) return request(`/products/${id}`)
  const p = mock.products.find((x) => x.id === id)
  return p ? mockDelay(p) : Promise.reject(new ApiError('Product not found', 404))
}

// GET /products/facets -> { origins: string[], certifications: string[] }
export function getFacets() {
  if (!USE_MOCK) return request('/products/facets')
  const origins = [...new Set(mock.products.map((p) => p.origin))].sort()
  const certifications = [...new Set(mock.products.flatMap((p) => p.certifications))].sort()
  return mockDelay({ origins, certifications })
}

/* ---------------- Auth ---------------- */

// POST /auth/login { email, password } -> { token, user }
export async function login(email, password) {
  const res = USE_MOCK
    ? await (email && password ? mockDelay({ token: 'mock-token', user: { ...mock.demoUser, email } }) : Promise.reject(new ApiError('Invalid credentials', 401)))
    : await request('/auth/login', { method: 'POST', body: { email, password } })
  tokenStore.set(res.token)
  return res.user
}

// POST /auth/register { company, name, email, password, country, vatNumber, phone }
export function register(payload) {
  if (!USE_MOCK) return request('/auth/register', { method: 'POST', body: payload })
  return mockDelay({ ok: true, message: 'Application received. Your account will be reviewed within 1 business day.' })
}

// GET /auth/me -> User
export function getMe() {
  if (!tokenStore.get()) return Promise.resolve(null)
  if (USE_MOCK) return mockDelay(mock.demoUser, 50)
  return request('/auth/me')
}

export function logout() {
  tokenStore.clear()
}

/* ---------------- Orders / RFQ ---------------- */

// POST /orders { type: 'order' | 'rfq', incoterm, destination, notes, items: [{ productId, quantity }] }
// -> { id, status }
export function submitOrder(payload) {
  if (!USE_MOCK) return request('/orders', { method: 'POST', body: payload })
  const prefix = payload.type === 'rfq' ? 'RFQ' : 'SO'
  return mockDelay({ id: `${prefix}-24-${Math.floor(1000 + Math.random() * 9000)}`, status: 'pending' }, 600)
}

// GET /orders -> Order[]
export function getOrders() {
  if (!USE_MOCK) return request('/orders')
  return mockDelay(mock.orders)
}
