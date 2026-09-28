# Products sayfası testleri

Kaynak: [Products.test.jsx](./Products.test.jsx) — `Products` sayfası için Vitest + React Testing Library testleri.

## Test ortamı

- **API mock'u:** `../api` modülündeki `getCategories`, `getFacets`, `getProducts` fonksiyonları `vi.fn()` ile mock'lanır.
- **ProductCard mock'u:** Gerçek bileşen `AuthContext`'e bağlı olduğu için, yerine ürün adını gösteren basit bir `<div data-testid="product-card">` kullanılır.
- **Router:** Sayfa `MemoryRouter` içinde `/products` rotasında render edilir. `LocationDisplay` bileşeni güncel `location.search` değerini gösterir; `search()` yardımcı fonksiyonu bunu `URLSearchParams` olarak okur.
- **Varsayılan veriler** (her testten önce `beforeEach` ile atanır):
  - Kategoriler: `Oils & Vinegars` (`oils`), `Pasta & Grains` (`pasta`)
  - Facet'ler: menşe `Italy`, `Spain`; sertifika `Halal`, `Organic`
  - Ürünler: `Extra Virgin Olive Oil`, `Spaghetti No.5` (toplam 2)

## 1. İlk render (`initial render`)

| Test | Doğrulanan davranış |
|---|---|
| shows the default heading and breadcrumb | H1 başlığı `Product catalog`, breadcrumb `Home / Catalog`. |
| shows a loading indicator until products arrive | Ürünler gelene kadar `Loading products…` görünür, geldikten sonra kaybolur. |
| renders a card per product and the total count | Her ürün için bir kart (2 adet) render edilir; ilk kart `Extra Virgin Olive Oil`; `2 products` sayısı gösterilir. |
| loads categories and facets into the filters | Kategoriler radio buton olarak listelenir, `All` varsayılan seçili; menşe ve sertifika select'leri facet seçeneklerini içerir. |
| requests products with empty filters when the URL has no params | URL parametresi yokken `getProducts` tüm alanlar boş (`q`, `category`, `origin`, `cert`, `sort`) olarak çağrılır. |
| does not show "Clear filters" without active filters | Aktif filtre yokken `Clear filters` butonu görünmez. |

## 2. Durumlar (`states`)

| Test | Doğrulanan davranış |
|---|---|
| shows the empty message when no products match | Boş sonuçta `No products match your filters.` ve `0 products` gösterilir. |
| shows the error message when loading products fails | `getProducts` hata verirse hata mesajı `alert-error` sınıfıyla gösterilir, hiç ürün kartı render edilmez. |

## 3. URL'den gelen filtreler (`filters from the URL`)

| Test | Doğrulanan davranış |
|---|---|
| passes URL params to the products request | URL'deki `q`, `category`, `origin`, `cert`, `sort` parametreleri `getProducts` çağrısına aynen aktarılır. |
| uses the active category name in heading and breadcrumb | `category=oils` iken H1 `Oils & Vinegars`, breadcrumb `Home / Catalog / Oils & Vinegars`, ilgili radio seçili. |
| shows a search results heading when q is set | `q=olive` iken H1 `Results for “olive”` olur. |
| reflects origin, cert and sort params in the selects | Menşe, sertifika ve sıralama select'leri URL'deki değerleri (`Spain`, `Halal`, `price-desc`) gösterir. |

## 4. Etkileşimler (`interactions`)

| Test | Doğrulanan davranış |
|---|---|
| selecting a category updates the URL and refetches | Kategori seçilince URL'de `category=pasta` olur, ürünler bu kategoriyle yeniden çekilir, başlık güncellenir. |
| selecting "All" removes the category param | `All` seçilince URL'den `category` parametresi kaldırılır. |
| changing origin and certification sets their params | Menşe ve sertifika seçimleri URL'ye eklenir, birbirini ezmez; ürünler iki filtreyle birlikte çekilir. |
| resetting a select to its empty option removes the param | Select boş seçeneğe (`All countries`) alınınca ilgili parametre URL'den silinir. |
| changing sort sets the sort param | Sıralama değişince URL'de `sort=price-asc` olur. |
| "Clear filters" removes every param | `Clear filters` tüm parametreleri temizler, buton kaybolur, başlık `Product catalog`'a döner. |
| fetches categories and facets only once while filters change | Filtreler değişse de kategoriler ve facet'ler yalnızca 1 kez çekilir; ürünler her filtre değişiminde yeniden çekilir (toplam 3 çağrı). |

## Özet

Toplam **19 test**, 4 grupta: ilk render (6), durumlar (2), URL filtreleri (4), etkileşimler (7).
