import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'
import Products from './Products'

vi.mock('../api', () => ({
  getCategories: vi.fn(),
  getFacets: vi.fn(),
  getProducts: vi.fn(),
}))

// ProductCard depends on AuthContext; the page only needs to render one card per product.
vi.mock('../components/ProductCard', () => ({
  default: ({ product }) => <div data-testid="product-card">{product.name}</div>,
}))

const categories = [
  { id: 'oils', name: 'Oils & Vinegars' },
  { id: 'pasta', name: 'Pasta & Grains' },
]
const facets = { origins: ['Italy', 'Spain'], certifications: ['Halal', 'Organic'] }
const products = {
  items: [
    { id: 'p1', name: 'Extra Virgin Olive Oil' },
    { id: 'p2', name: 'Spaghetti No.5' },
  ],
  total: 2,
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.search}</div>
}

function renderPage(url = '/products') {
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
  )
}

const search = () => new URLSearchParams(screen.getByTestId('location').textContent)

beforeEach(() => {
  vi.clearAllMocks()
  api.getCategories.mockResolvedValue(categories)
  api.getFacets.mockResolvedValue(facets)
  api.getProducts.mockResolvedValue(products)
})

describe('Products page', () => {
  describe('initial render', () => {
    it('shows the default heading and breadcrumb', async () => {
      renderPage()
      expect(screen.getByRole('heading', { level: 1, name: 'Product catalog' })).toBeInTheDocument()
      expect(screen.getByText('Home / Catalog')).toBeInTheDocument()
      await screen.findAllByTestId('product-card')
    })

    it('shows a loading indicator until products arrive', async () => {
      renderPage()
      expect(screen.getByText('Loading products…')).toBeInTheDocument()
      await screen.findAllByTestId('product-card')
      expect(screen.queryByText('Loading products…')).not.toBeInTheDocument()
    })

    it('renders a card per product and the total count', async () => {
      renderPage()
      const cards = await screen.findAllByTestId('product-card')
      expect(cards).toHaveLength(2)
      expect(cards[0]).toHaveTextContent('Extra Virgin Olive Oil')
      expect(screen.getByText('2 products')).toBeInTheDocument()
    })

    it('loads categories and facets into the filters', async () => {
      renderPage()
      expect(await screen.findByRole('radio', { name: 'Oils & Vinegars' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Pasta & Grains' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'All' })).toBeChecked()

      const [originSelect, certSelect] = screen.getAllByRole('combobox')
      expect(await within(originSelect).findByRole('option', { name: 'Italy' })).toBeInTheDocument()
      expect(within(originSelect).getByRole('option', { name: 'Spain' })).toBeInTheDocument()
      expect(within(certSelect).getByRole('option', { name: 'Organic' })).toBeInTheDocument()
    })

    it('requests products with empty filters when the URL has no params', async () => {
      renderPage()
      await screen.findAllByTestId('product-card')
      expect(api.getProducts).toHaveBeenCalledWith({ q: '', category: '', origin: '', cert: '', sort: '' })
    })

    it('does not show "Clear filters" without active filters', async () => {
      renderPage()
      await screen.findAllByTestId('product-card')
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    })
  })

  describe('states', () => {
    it('shows the empty message when no products match', async () => {
      api.getProducts.mockResolvedValue({ items: [], total: 0 })
      renderPage()
      expect(await screen.findByText('No products match your filters.')).toBeInTheDocument()
      expect(screen.getByText('0 products')).toBeInTheDocument()
    })

    it('shows the error message when loading products fails', async () => {
      api.getProducts.mockRejectedValue(new Error('Server unavailable'))
      renderPage()
      expect(await screen.findByText('Server unavailable')).toHaveClass('alert-error')
      expect(screen.queryByTestId('product-card')).not.toBeInTheDocument()
    })
  })

  describe('filters from the URL', () => {
    it('passes URL params to the products request', async () => {
      renderPage('/products?q=oil&category=oils&origin=Italy&cert=Organic&sort=name')
      await screen.findAllByTestId('product-card')
      expect(api.getProducts).toHaveBeenCalledWith({
        q: 'oil',
        category: 'oils',
        origin: 'Italy',
        cert: 'Organic',
        sort: 'name',
      })
    })

    it('uses the active category name in heading and breadcrumb', async () => {
      renderPage('/products?category=oils')
      expect(await screen.findByRole('heading', { level: 1, name: 'Oils & Vinegars' })).toBeInTheDocument()
      expect(screen.getByText('Home / Catalog / Oils & Vinegars')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Oils & Vinegars' })).toBeChecked()
    })

    it('shows a search results heading when q is set', async () => {
      renderPage('/products?q=olive')
      expect(screen.getByRole('heading', { level: 1, name: 'Results for “olive”' })).toBeInTheDocument()
      await screen.findAllByTestId('product-card')
    })

    it('reflects origin, cert and sort params in the selects', async () => {
      renderPage('/products?origin=Spain&cert=Halal&sort=price-desc')
      await screen.findAllByTestId('product-card')
      await screen.findByRole('option', { name: 'Spain' })
      const [originSelect, certSelect, sortSelect] = screen.getAllByRole('combobox')
      expect(originSelect).toHaveValue('Spain')
      expect(certSelect).toHaveValue('Halal')
      expect(sortSelect).toHaveValue('price-desc')
    })
  })

  describe('interactions', () => {
    it('selecting a category updates the URL and refetches', async () => {
      const user = userEvent.setup()
      renderPage()
      await user.click(await screen.findByRole('radio', { name: 'Pasta & Grains' }))

      expect(search().get('category')).toBe('pasta')
      expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'pasta' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'Pasta & Grains' })).toBeInTheDocument()
    })

    it('selecting "All" removes the category param', async () => {
      const user = userEvent.setup()
      renderPage('/products?category=oils')
      await screen.findByRole('radio', { name: 'Oils & Vinegars' })
      await user.click(screen.getByRole('radio', { name: 'All' }))
      expect(search().has('category')).toBe(false)
    })

    it('changing origin and certification sets their params', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByRole('option', { name: 'Italy' })
      const [originSelect, certSelect] = screen.getAllByRole('combobox')

      await user.selectOptions(originSelect, 'Italy')
      expect(search().get('origin')).toBe('Italy')

      await user.selectOptions(certSelect, 'Organic')
      expect(search().get('cert')).toBe('Organic')
      expect(search().get('origin')).toBe('Italy')
      expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ origin: 'Italy', cert: 'Organic' }))
    })

    it('resetting a select to its empty option removes the param', async () => {
      const user = userEvent.setup()
      renderPage('/products?origin=Italy')
      await screen.findByRole('option', { name: 'Italy' })
      await user.selectOptions(screen.getAllByRole('combobox')[0], 'All countries')
      expect(search().has('origin')).toBe(false)
    })

    it('changing sort sets the sort param', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findAllByTestId('product-card')
      await user.selectOptions(screen.getAllByRole('combobox')[2], 'price-asc')
      expect(search().get('sort')).toBe('price-asc')
    })

    it('"Clear filters" removes every param', async () => {
      const user = userEvent.setup()
      renderPage('/products?q=oil&category=oils&sort=name')
      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(screen.getByTestId('location')).toBeEmptyDOMElement()
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
      expect(await screen.findByRole('heading', { level: 1, name: 'Product catalog' })).toBeInTheDocument()
    })

    it('fetches categories and facets only once while filters change', async () => {
      const user = userEvent.setup()
      renderPage()
      await user.click(await screen.findByRole('radio', { name: 'Pasta & Grains' }))
      await user.selectOptions(screen.getAllByRole('combobox')[2], 'name')
      await screen.findAllByTestId('product-card')

      expect(api.getCategories).toHaveBeenCalledTimes(1)
      expect(api.getFacets).toHaveBeenCalledTimes(1)
      expect(api.getProducts).toHaveBeenCalledTimes(3)
    })
  })
})
