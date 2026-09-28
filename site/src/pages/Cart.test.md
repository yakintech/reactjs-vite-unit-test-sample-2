# Cart sayfası testleri

Kaynak: [Cart.test.jsx](./Cart.test.jsx) — `Cart` sayfası için Vitest + React Testing Library testleri.

## Test ortamı

- **API mock'u:** `../api` modülündeki `submitOrder` fonksiyonu `vi.fn()` ile mock'lanır.
- **Auth mock'u:** `useAuth` mock'lanır; varsayılan olarak giriş yapmış kullanıcı (`Nordic Imports AB`) döner.
- **Gerçek CartProvider:** Sepet mock'lanmaz; `CartProvider` gerçek haliyle kullanılır ve veriyi `localStorage`'daki `b2b_cart` anahtarından okur/yazar. Testler hem ekranı hem de `storedCart()` ile saklanan veriyi doğrular.
- **Router:** Sayfa `MemoryRouter` içinde `/cart` rotasında render edilir.
- **Yardımcı fonksiyonlar:**
  - `rowFor(name)` — ürün linkinden tablo satırını (`tr`) bulur.
  - `summaryValue(label)` — özet kutusunda etiketin yanındaki değeri döner.
  - `selectByLabel(label)` — etiketi verilen `select` elementini bulur.
- **Varsayılan sepet** (her testten önce `beforeEach` ile `b2b_cart`'a yazılır):

  | Ürün | Birim | Fiyat basamakları | Miktar | Satır toplamı | Palet |
  |---|---|---|---|---|---|
  | `Extra Virgin Olive Oil` (`OIL-001`) | case | 100+ → $5, 500+ → $4 | 200 | $1,000 | 1.0 |
  | `Spaghetti No.5` (`PAS-005`) | carton | 50+ → $10 | 50 | $500 | 0.5 |

  Ara toplam **$1,500**, tahmini palet **1.5**.

## 1. Boş sepet (`empty cart`)

| Test | Doğrulanan davranış |
|---|---|
| shows the empty state when b2b_cart is missing | `b2b_cart` yokken `Your cart is empty.` mesajı ve `/products`'a giden `Browse catalog` linki görünür; tablo render edilmez. |
| falls back to an empty cart when b2b_cart is corrupted | `b2b_cart` bozuk JSON içeriyorsa sayfa çökmez, boş sepet gösterilir. |

## 2. Sepet satırları (`cart lines from b2b_cart`)

| Test | Doğrulanan davranış |
|---|---|
| renders a row per stored item with product details | H1 `Cart & quotation`. Her ürün için bir satır: ürün linki (`/products/p1`), `SKU · paket` bilgisi, birim fiyat (`$5.00`, `/ case`), miktar input'u (200) ve satır toplamı (`$1,000.00`). |
| shows the summary totals | Özette satır sayısı `2`, tahmini palet `1.5`, ara toplam `$1,500.00`. |

## 3. Sepeti düzenleme (`editing the cart`)

| Test | Doğrulanan davranış |
|---|---|
| applies the matching price tier when the quantity changes | Zeytinyağı miktarı 500'e çıkınca $4 basamağı uygulanır; satır `$2,000.00`, ara toplam `$2,500.00` olur; yeni miktar `b2b_cart`'a yazılır. |
| treats invalid quantity input as 0 | Miktar alanı boşaltılınca miktar `0` olarak saklanır. |
| warns and disables submit when a line is below MOQ | Spagetti miktarı 10'a düşünce satırda `MOQ is 50` uyarısı çıkar ve gönder butonu pasif olur. |
| removes a line and persists the change to b2b_cart | `Remove` ile satır silinir; özet `1` satır / `$1,000.00` olur; `b2b_cart`'ta yalnızca `p1` kalır. |
| shows the empty state after removing the last line | Son satır silinince boş sepet mesajı görünür, `b2b_cart` `[]` olur. |

## 4. Talep formu (`request form`)

| Test | Doğrulanan davranış |
|---|---|
| defaults to an RFQ with CIF incoterm | Varsayılan talep tipi `rfq`, incoterm `CIF`; `Send quote request` butonu aktif. |
| switches the button label when placing an order | Talep tipi `order` seçilince buton metni `Place order` olur. |
| does not submit without a destination | Varış noktası boşken form gönderilmez, `submitOrder` çağrılmaz. |
| submits an RFQ, shows the confirmation and clears b2b_cart | `submitOrder` doğru payload ile çağrılır (`type`, `incoterm: FOB`, `destination`, `notes`, `items: [{ productId, quantity }]`); `Quote request sent` başlığı, referans no (`RFQ-1001`) ve `/account` linki görünür; sepet temizlenir. |
| shows "Order placed" after submitting an order | `order` tipiyle gönderimde payload'da `type: 'order'` olur ve `Order placed` başlığı görünür. |
| disables the button while the request is in flight | İstek sürerken buton `Sending…` olur ve pasifleşir; cevap gelince onay ekranı açılır. |
| shows the API error and keeps the cart when submission fails | API hatası `alert-error` ile gösterilir, buton tekrar aktif olur, sepet (2 satır) korunur. |

## 5. Giriş yapılmamışken (`when signed out`)

| Test | Doğrulanan davranış |
|---|---|
| shows a sign-in link instead of the submit button | Kullanıcı yokken gönder butonu yerine `/login`'e giden `Sign in to continue` linki görünür. |

## Çalıştırma

```bash
npx vitest run src/pages/Cart.test.jsx
```

## Özet

Toplam **17 test**, 5 grupta: boş sepet (2), sepet satırları (2), sepeti düzenleme (5), talep formu (7), giriş yapılmamışken (1). Hepsi geçiyor.
