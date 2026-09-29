import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Modal } from './Modal'


describe('queryBy hiles', () => {

    it("isOpen false olduğunda modal DOM üzerinde bulunmamalıdır", () => {
        //Burada getBy kullanırsak test fail olur çünkü modal DOM üzerinde bulunmaz. Bu yüzden queryBy kullanıyoruz.
        render(<Modal isOpen={false} />)
        const modal = screen.queryByRole('dialog')
        expect(modal).toBeNull()

        //yanlış örnek
        // const modal = screen.getByRole('dialog')
        // expect(modal).toBeInTheDocument()
    })

})