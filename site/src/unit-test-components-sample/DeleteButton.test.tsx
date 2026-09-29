import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it, vi } from 'vitest'
import { DeleteButton } from './DeleteButton'


describe('DeleteButton Component', () => {
    it('onConfirm fonksiyonunu doğru şekilde çağırmalıdır', () => {
        const mockOnConfirm = vi.fn()
        const itemId = '123'
        render(<DeleteButton onConfirm={mockOnConfirm} itemId={itemId} />)

        const button = screen.getByText('Delete')
        fireEvent.click(button)

        expect(mockOnConfirm).toHaveBeenCalledWith(itemId)
    })
})