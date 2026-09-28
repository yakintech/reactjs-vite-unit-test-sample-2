import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

process.env.DB_FILE = ':memory:'
process.env.AUTO_APPROVE_BUYERS = 'false'

const { createApp } = await import('../src/app.js')
const { migrate } = await import('../src/db/index.js')
const { seed } = await import('../src/db/seed.js')

let server
let base

async function call(method, path, { body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, body: await res.json() }
}

const login = async (email, password) => (await call('POST', '/api/auth/login', { body: { email, password } })).body.token

before(async () => {
  migrate()
  seed()
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://localhost:${server.address().port}`
})

after(() => server.close())

describe('catalog', () => {
  test('lists categories with product counts', async () => {
    const { status, body } = await call('GET', '/api/categories')
    assert.equal(status, 200)
    assert.equal(body.find((c) => c.id === 'grains').productCount, 3)
  })

  test('hides prices from anonymous visitors but keeps MOQ', async () => {
    const { body } = await call('GET', '/api/products/p-1001')
    assert.deepEqual(body.priceTiers[0], { minQty: 20, price: null })
  })

  test('shows prices to signed-in buyers', async () => {
    const token = await login('buyer@demo.com', 'demo')
    const { body } = await call('GET', '/api/products/p-1001', { token })
    assert.equal(body.priceTiers[0].price, 118)
  })

  test('filters by category, certification and search', async () => {
    const byCert = await call('GET', '/api/products?cert=Organic')
    assert.deepEqual(byCert.body.items.map((p) => p.id).sort(), ['p-1002', 'p-2002'])
    const bySearch = await call('GET', '/api/products?q=basmati&category=grains')
    assert.equal(bySearch.body.total, 1)
  })

  test('returns facets', async () => {
    const { body } = await call('GET', '/api/products/facets')
    assert.ok(body.origins.includes('Türkiye'))
    assert.ok(body.certifications.includes('Halal'))
  })

  test('404 for unknown product', async () => {
    assert.equal((await call('GET', '/api/products/nope')).status, 404)
  })
})

describe('auth', () => {
  test('rejects wrong password', async () => {
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'buyer@demo.com', password: 'x' } })).status, 401)
  })

  test('new registrations stay pending until an admin activates them', async () => {
    const reg = await call('POST', '/api/auth/register', {
      body: { company: 'Acme', name: 'Ann', email: 'ann@acme.test', password: 'password1', country: 'DE' },
    })
    assert.equal(reg.status, 201)
    assert.equal(reg.body.status, 'pending')

    const blocked = await call('POST', '/api/auth/login', { body: { email: 'ann@acme.test', password: 'password1' } })
    assert.equal(blocked.status, 403)

    const admin = await login('admin@demo.com', 'admin')
    const pending = await call('GET', '/api/admin/users?status=pending', { token: admin })
    const ann = pending.body.find((u) => u.email === 'ann@acme.test')
    assert.equal((await call('PATCH', `/api/admin/users/${ann.id}`, { token: admin, body: { status: 'active' } })).status, 200)

    const token = await login('ann@acme.test', 'password1')
    const me = await call('GET', '/api/auth/me', { token })
    assert.equal(me.body.company, 'Acme')
  })

  test('rejects duplicate email', async () => {
    const res = await call('POST', '/api/auth/register', {
      body: { company: 'X', name: 'X', email: 'BUYER@demo.com', password: 'password1', country: 'SE' },
    })
    assert.equal(res.status, 409)
  })

  test('buyers cannot use admin endpoints', async () => {
    const token = await login('buyer@demo.com', 'demo')
    assert.equal((await call('GET', '/api/admin/users', { token })).status, 403)
  })
})

describe('orders', () => {
  test('requires authentication', async () => {
    assert.equal((await call('GET', '/api/orders')).status, 401)
  })

  test('prices orders on the server using volume tiers', async () => {
    const token = await login('buyer@demo.com', 'demo')
    const res = await call('POST', '/api/orders', {
      token,
      body: {
        type: 'rfq', incoterm: 'cif', destination: 'Oslo, NO',
        // 80 cartons of p-1001 hits the $112 tier; duplicate lines are merged.
        items: [{ productId: 'p-1001', quantity: 50 }, { productId: 'p-1001', quantity: 30 }],
      },
    })
    assert.equal(res.status, 201)
    assert.match(res.body.id, /^RFQ-\d{2}-\d{4}$/)
    assert.equal(res.body.total, 80 * 112)

    const detail = await call('GET', `/api/orders/${res.body.id}`, { token })
    assert.equal(detail.body.lines.length, 1)
    assert.equal(detail.body.lines[0].unitPrice, 112)
    assert.equal(detail.body.incoterm, 'CIF')

    const list = await call('GET', '/api/orders', { token })
    assert.equal(list.body[0].id, res.body.id)
  })

  test('enforces minimum order quantity', async () => {
    const token = await login('buyer@demo.com', 'demo')
    const res = await call('POST', '/api/orders', {
      token,
      body: { incoterm: 'FOB', destination: 'Oslo', items: [{ productId: 'p-1001', quantity: 5 }] },
    })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /Minimum order quantity/)
  })

  test('buyers cannot read other buyers\' orders', async () => {
    const buyer = await login('buyer@demo.com', 'demo')
    const [order] = (await call('GET', '/api/orders', { token: buyer })).body
    const other = await login('ann@acme.test', 'password1')
    assert.equal((await call('GET', `/api/orders/${order.id}`, { token: other })).status, 404)
  })

  test('admin can update order status', async () => {
    const admin = await login('admin@demo.com', 'admin')
    const [order] = (await call('GET', '/api/admin/orders?status=pending', { token: admin })).body
    const res = await call('PATCH', `/api/admin/orders/${order.id}`, { token: admin, body: { status: 'confirmed' } })
    assert.equal(res.body.status, 'confirmed')
  })
})
