import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { tierFor } from '../utils/format'

const CartContext = createContext(null)
const STORAGE_KEY = 'b2b_cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

// Cart line: { product, quantity }. The product snapshot is kept so the cart renders
// without refetching; the server should re-price on submit.
export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable */
    }
  }, [items])

  const add = (product, quantity) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      return [...prev, { product, quantity }]
    })

  const update = (productId, quantity) =>
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)))

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.product.id !== productId))
  const clear = () => setItems([])

  const totals = useMemo(() => {
    const lines = items.map((i) => {
      const unitPrice = tierFor(i.product, i.quantity).price
      return { ...i, unitPrice, lineTotal: unitPrice * i.quantity }
    })
    return {
      lines,
      subtotal: lines.reduce((s, l) => s + l.lineTotal, 0),
      count: items.length,
      pallets: items.reduce((s, i) => s + i.quantity / (i.product.unitsPerPallet || Infinity), 0),
    }
  }, [items])

  return <CartContext.Provider value={{ items, add, update, remove, clear, ...totals }}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
