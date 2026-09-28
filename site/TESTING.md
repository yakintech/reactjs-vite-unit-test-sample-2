# React Testing Guidelines & Rules for AI

Bu proje **Vitest** ve **React Testing Library (RTL)** kullanmaktadır. 
Yapay zeka asistanı olarak test üretirken AŞAĞIDAKİ KURALLARA KESİNLİKLE UYMALISIN:

## 1. Temel Felsefe
- Bileşenin iç durumunu (state) değil, kullanıcının ekranda gördüğü ve etkileşime girdiği davranışları test et.
- Testler kullanıcı gözünden yazılmalıdır (Accessibility First).
- Testlerde mobil uyum için de test yazılmalıdır

## 2. Query Hiyerarşisi (Sırasıyla Kullan)
1. `getByRole` / `findByRole` (HER ZAMAN İLK TERCİH)
2. `getByLabelText` (Form elemanları için)
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (SADECE ve SADECE yukarıdakiler imkansızsa kullan!)

## 3. Etkileşimler
- `fireEvent` KULLANMA. Her zaman `@testing-library/user-event` tercih et.
- Async etkileşimlerde `await user.click(...)` yapısını kullan.

## 4. Mocking Kuralları
- Vitest mock araçlarını kullan: `vi.fn()`, `vi.spyOn()`, `vi.mock()`. `jest.fn()` KULLANMA.
- API isteklerini mock'lamak için sadece **MSW (Mock Service Worker)** kullan. `axios` veya `fetch`'i elle monkey-patch etme.

## 5. Test Yapısı (AAA Pattern)
- Testleri Arrange - Act - Assert yapısına göre yaz.
- Test isimleri neyin test edildiğini açıkça belirtmelidir: `it('should display error message when email is invalid', ...)`
