import ThemeToggle from "./ThemeToggle";
import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'



describe("LocalStorage Mocking", () => {

    beforeEach(() => {
        localStorage.clear()
    })

    it("tema değiştirildiğinde localStorage güncellenmelidir", () => {
        render(<ThemeToggle />)

        const button = screen.getByText(/Active Theme:/i)
        expect(button).toHaveTextContent("Active Theme: light")

        // Butona tıkla ve temayı değiştir
        button.click()
        expect(button).toHaveTextContent("Active Theme: dark")
        expect(localStorage.getItem('theme')).toBe('dark')
        
        // Tekrar tıkla ve temayı değiştir
        button.click()
        expect(button).toHaveTextContent("Active Theme: light")
        expect(localStorage.getItem('theme')).toBe('light')
    })
})


//beforeeach fonksiyonu ile her testten önce yapılacak işlemleri belirtebilirsiniz. Bu örnekte, her testten önce localStorage temizleniyor.

//afterEach fonksiyonu ile her testten sonra yapılacak işlemleri belirtebilirsiniz. Bu örnekte, her testten sonra localStorage temizleniyor.

