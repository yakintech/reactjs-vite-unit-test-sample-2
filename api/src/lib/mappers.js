// Convert DB rows (snake_case) into the JSON shapes the frontend expects (camelCase).

const parseJson = (v, fallback) => {
  try {
    return JSON.parse(v)
  } catch {
    return fallback
  }
}

// Prices are only revealed to signed-in buyers; anonymous visitors still get MOQ (minQty).
export function toProduct(row, tiers = [], { showPrices = false } = {}) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category_id,
    description: row.description,
    icon: row.icon,
    image: row.image,
    origin: row.origin,
    originFlag: row.origin_flag,
    brand: row.brand,
    unit: row.unit,
    packSize: row.pack_size,
    unitsPerPallet: row.units_per_pallet,
    hsCode: row.hs_code,
    shelfLife: row.shelf_life,
    storage: row.storage,
    certifications: parseJson(row.certifications, []),
    incoterms: parseJson(row.incoterms, []),
    leadTimeDays: row.lead_time_days,
    stock: row.stock,
    priceTiers: tiers.map((t) => ({ minQty: t.min_qty, price: showPrices ? t.price : null })),
  }
}

export function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    company: row.company,
    businessType: row.business_type,
    phone: row.phone,
    country: row.country,
    vatNumber: row.vat_number,
    currency: row.currency,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function toOrderSummary(row) {
  return {
    id: row.ref,
    type: row.type,
    date: row.created_at.slice(0, 10),
    status: row.status,
    incoterm: row.incoterm,
    destination: row.destination,
    currency: row.currency,
    total: row.total,
    items: row.item_count,
  }
}

export function toOrderItem(row) {
  return {
    productId: row.product_id,
    name: row.product_name,
    sku: row.sku,
    unit: row.unit,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total,
  }
}
