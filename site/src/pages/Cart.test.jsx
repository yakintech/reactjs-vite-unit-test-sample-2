import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'
import { useAuth } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import Cart from './Cart'

vi.mock('../api', () => ({
  submitOrder: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const STORAGE_KEY = 'b2b_cart'
const user = { id: 'u1', email: 'buyer@example.com', company: 'Nordic Imports AB' }

const oliveOil = {
  id: 'p1',
  name: 'Extra Virgin Olive Oil',
  sku: 'OIL-001',
  packSize: '12 x 1L',
  unit: 'case',
  unitsPerPallet: 200,
  priceTiers: [
    { minQty: 100, price: 5 },
    { minQty: 500, price: 4 },
  ],
}
const spaghetti = {
  id: 'p2',
  name: 'Spaghetti No.5',
  sku: 'PAS-005',
  packSize: '20 x 500g',
  unit: 'carton',
  unitsPerPallet: 100,
  priceTiers: [{ minQty: 50, price: 10 }],
}

// olive oil: 200 x $5 = $1,000 · spaghetti: 50 x $10 = $500 · pallets: 1.0 + 0.5
const defaultCart = [
  { product: oliveOil, quantity: 200 },
  { product: spaghetti, quantity: 50 },
]

const seedCart = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
const storedCart = () => JSON.parse(localStorage.getItem(STORAGE_KEY))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/cart']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
        <Cart />
      </CartProvider>
    </MemoryRouter>,
  )
}

const rowFor = (name) => screen.getByRole('link', { name }).closest('tr')
const summaryValue = (label) => screen.getByText(label).nextElementSibling
const selectByLabel = (label) => screen.getByText(label).parentElement.querySelector('select')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  seedCart(defaultCart)
  useAuth.mockReturnValue({ user })
})

afterEach(() => {
  localStorage.clear()
})

describe('Cart page', () => {
  describe('empty cart', () => {
    it('shows the empty state when b2b_cart is missing', () => {
      localStorage.removeItem(STORAGE_KEY)
      renderPage()
      expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Browse catalog' })).toHaveAttribute('href', '/products')
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('falls back to an empty cart when b2b_cart is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, '{not json')
      renderPage()
      expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    })
  })

  describe('cart lines from b2b_cart', () => {
    it('renders a row per stored item with product details', () => {
      renderPage()
      expect(screen.getByRole('heading', { level: 1, name: 'Cart & quotation' })).toBeInTheDocument()

      const row = rowFor('Extra Virgin Olive Oil')
      expect(within(row).getByRole('link')).toHaveAttribute('href', '/products/p1')
      expect(within(row).getByText('OIL-001 · 12 x 1L')).toBeInTheDocument()
      expect(within(row).getByText('$5.00')).toBeInTheDocument()
      expect(within(row).getByText('/ case')).toBeInTheDocument()
      expect(within(row).getByRole('spinbutton')).toHaveValue(200)
      expect(within(row).getByText('$1,000.00')).toBeInTheDocument()

      expect(within(rowFor('Spaghetti No.5')).getByText('$500.00')).toBeInTheDocument()
    })

    it('shows the summary totals', () => {
      renderPage()
      expect(summaryValue('Line items')).toHaveTextContent('2')
      expect(summaryValue('Est. pallets')).toHaveTextContent('1.5')
      expect(summaryValue('Subtotal')).toHaveTextContent('$1,500.00')
    })
  })

  describe('editing the cart', () => {
    it('applies the matching price tier when the quantity changes', () => {
      renderPage()
      const row = rowFor('Extra Virgin Olive Oil')
      fireEvent.change(within(row).getByRole('spinbutton'), { target: { value: '500' } })

      expect(within(row).getByText('$4.00')).toBeInTheDocument()
      expect(within(row).getByText('$2,000.00')).toBeInTheDocument()
      expect(summaryValue('Subtotal')).toHaveTextContent('$2,500.00')
      expect(storedCart()[0].quantity).toBe(500)
    })

    it('treats invalid quantity input as 0', () => {
      renderPage()
      const input = within(rowFor('Spaghetti No.5')).getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '' } })
      expect(storedCart()[1].quantity).toBe(0)
    })

    it('warns and disables submit when a line is below MOQ', () => {
      renderPage()
      const row = rowFor('Spaghetti No.5')
      fireEvent.change(within(row).getByRole('spinbutton'), { target: { value: '10' } })

      expect(within(row).getByText('MOQ is 50')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send quote request' })).toBeDisabled()
    })

    it('removes a line and persists the change to b2b_cart', async () => {
      const u = userEvent.setup()
      renderPage()
      await u.click(within(rowFor('Spaghetti No.5')).getByRole('button', { name: 'Remove' }))

      expect(screen.queryByText('Spaghetti No.5')).not.toBeInTheDocument()
      expect(summaryValue('Line items')).toHaveTextContent('1')
      expect(summaryValue('Subtotal')).toHaveTextContent('$1,000.00')
      expect(storedCart()).toHaveLength(1)
      expect(storedCart()[0].product.id).toBe('p1')
    })

    it('shows the empty state after removing the last line', async () => {
      const u = userEvent.setup()
      seedCart([{ product: oliveOil, quantity: 200 }])
      renderPage()
      await u.click(screen.getByRole('button', { name: 'Remove' }))
      expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
      expect(storedCart()).toEqual([])
    })
  })

  describe('request form', () => {
    it('defaults to an RFQ with CIF incoterm', () => {
      renderPage()
      expect(selectByLabel('Request type')).toHaveValue('rfq')
      expect(selectByLabel('Incoterm')).toHaveValue('CIF')
      expect(screen.getByRole('button', { name: 'Send quote request' })).toBeEnabled()
    })

    it('switches the button label when placing an order', async () => {
      const u = userEvent.setup()
      renderPage()
      await u.selectOptions(selectByLabel('Request type'), 'order')
      expect(screen.getByRole('button', { name: 'Place order' })).toBeInTheDocument()
    })

    it('does not submit without a destination', async () => {
      const u = userEvent.setup()
      renderPage()
      await u.click(screen.getByRole('button', { name: 'Send quote request' }))
      expect(api.submitOrder).not.toHaveBeenCalled()
    })

    it('submits an RFQ, shows the confirmation and clears b2b_cart', async () => {
      const u = userEvent.setup()
      api.submitOrder.mockResolvedValue({ id: 'RFQ-1001' })
      renderPage()

      await u.selectOptions(selectByLabel('Incoterm'), 'FOB')
      await u.type(screen.getByPlaceholderText('e.g. Gothenburg, SE'), 'Gothenburg, SE')
      await u.type(screen.getByPlaceholderText(/Private label/), 'Swedish labels')
      await u.click(screen.getByRole('button', { name: 'Send quote request' }))

      expect(api.submitOrder).toHaveBeenCalledWith({
        type: 'rfq',
        incoterm: 'FOB',
        destination: 'Gothenburg, SE',
        notes: 'Swedish labels',
        items: [
          { productId: 'p1', quantity: 200 },
          { productId: 'p2', quantity: 50 },
        ],
      })
      expect(await screen.findByRole('heading', { name: 'Quote request sent' })).toBeInTheDocument()
      expect(screen.getByText('RFQ-1001')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View my orders' })).toHaveAttribute('href', '/account')
      expect(storedCart()).toEqual([])
    })

    it('shows "Order placed" after submitting an order', async () => {
      const u = userEvent.setup()
      api.submitOrder.mockResolvedValue({ id: 'ORD-2002' })
      renderPage()

      await u.selectOptions(selectByLabel('Request type'), 'order')
      await u.type(screen.getByPlaceholderText('e.g. Gothenburg, SE'), 'Rotterdam, NL')
      await u.click(screen.getByRole('button', { name: 'Place order' }))

      expect(api.submitOrder).toHaveBeenCalledWith(expect.objectContaining({ type: 'order' }))
      expect(await screen.findByRole('heading', { name: 'Order placed' })).toBeInTheDocument()
    })

    it('disables the button while the request is in flight', async () => {
      const u = userEvent.setup()
      let resolve
      api.submitOrder.mockReturnValue(new Promise((r) => (resolve = r)))
      renderPage()

      await u.type(screen.getByPlaceholderText('e.g. Gothenburg, SE'), 'Hamburg, DE')
      await u.click(screen.getByRole('button', { name: 'Send quote request' }))
      expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()

      resolve({ id: 'RFQ-3003' })
      expect(await screen.findByText('RFQ-3003')).toBeInTheDocument()
    })

    it('shows the API error and keeps the cart when submission fails', async () => {
      const u = userEvent.setup()
      api.submitOrder.mockRejectedValue(new Error('Destination not served'))
      renderPage()

      await u.type(screen.getByPlaceholderText('e.g. Gothenburg, SE'), 'Nowhere')
      await u.click(screen.getByRole('button', { name: 'Send quote request' }))

      expect(await screen.findByText('Destination not served')).toHaveClass('alert-error')
      expect(screen.getByRole('button', { name: 'Send quote request' })).toBeEnabled()
      expect(storedCart()).toHaveLength(2)
    })
  })

  describe('when signed out', () => {
    it('shows a sign-in link instead of the submit button', () => {
      useAuth.mockReturnValue({ user: null })
      renderPage()
      expect(screen.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute('href', '/login')
      expect(screen.queryByRole('button', { name: 'Send quote request' })).not.toBeInTheDocument()

    })
  })


})
