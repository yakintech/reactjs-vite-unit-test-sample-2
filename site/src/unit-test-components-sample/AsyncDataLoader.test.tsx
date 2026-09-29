import AsyncDataLoader from "./AsyncDataLoader";
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'




describe('AsyncDataLoader Component', () => {
    it('veri yükleme işlevini doğru şekilde çağırmalıdır', async () => {
        const mockFetchData = vi.fn().mockResolvedValue('Test Data')
        render(<AsyncDataLoader fetchData={mockFetchData} />)

        const button = screen.getByText('Load Data')
        await button.click()

        expect(mockFetchData).toHaveBeenCalledTimes(1)
    })
})