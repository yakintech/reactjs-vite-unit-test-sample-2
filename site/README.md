# Global Foods B2B — Frontend (React + Vite)

Wholesale international food B2B storefront template.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Mock login: any email/password (pre-filled: `buyer@demo.com` / `demo`).

## Pages

| Route | Page |
|---|---|
| `/` | Home — hero, categories, featured products |
| `/products` | Catalog — category / origin / certification filters, search, sort |
| `/products/:id` | Product detail — tiered pricing, MOQ, pallet calc, specs (HS code, Incoterms…) |
| `/cart` | Cart + RFQ / order submit (Incoterm, destination port) |
| `/login`, `/register` | Buyer sign in / trade account application |
| `/account` | Orders & quotations, company details |

Prices are hidden until the buyer signs in.

## Connecting the API

All data access is in [`src/api/index.js`](src/api/index.js). Each function has a mock branch and a real `request()` call.

1. Set in `.env`:
   ```
   VITE_USE_MOCK=false
   VITE_API_URL=/api            # or https://api.example.com
   ```
2. In development, `/api` is proxied to `http://localhost:4000` (override with `API_PROXY_TARGET`).
3. Adjust endpoint paths in `src/api/index.js` if yours differ.

Auth uses a Bearer token stored in `localStorage` (`src/api/client.js`).

### Expected endpoints

| Method | Path | Response |
|---|---|---|
| GET | `/categories` | `Category[]` |
| GET | `/products?q&category&origin&cert&sort` | `{ items: Product[], total }` |
| GET | `/products/:id` | `Product` |
| GET | `/products/facets` | `{ origins: string[], certifications: string[] }` |
| POST | `/auth/login` `{ email, password }` | `{ token, user }` |
| POST | `/auth/register` | `{ message }` |
| GET | `/auth/me` | `User` |
| POST | `/orders` `{ type: 'rfq'\|'order', incoterm, destination, notes, items: [{ productId, quantity }] }` | `{ id, status }` |
| GET | `/orders` | `Order[]` |

See [`src/api/mockData.js`](src/api/mockData.js) for the exact `Product`, `Category`, `User` and `Order` shapes.
Key product fields: `priceTiers: [{ minQty, price }]` (first tier = MOQ), `unit`, `unitsPerPallet`, `incoterms`, `certifications`, optional `image` (falls back to `icon`).
