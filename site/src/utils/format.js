export function formatMoney(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
}

// Returns the price tier that applies to `qty` (highest minQty <= qty).
export function tierFor(product, qty) {
  const tiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty)
  return tiers.filter((t) => qty >= t.minQty).pop() || tiers[0]
}

export const moq = (product) => Math.min(...product.priceTiers.map((t) => t.minQty))
export const fromPrice = (product) => Math.min(...product.priceTiers.map((t) => t.price))
