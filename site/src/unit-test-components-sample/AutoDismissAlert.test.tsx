import AutoDismissAlert from "./AutoDismissAlert";
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'






describe("AutoDismissAlert", () => {
  
    //timer mocklama
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("3 saniye sonra otomatik olarak kaybolmalıdır", async () => {
        render(<AutoDismissAlert message="Test Alert" />)

        //alertin görünür olduğunu kontrol et
        expect(screen.getByText("Test Alert")).toBeInTheDocument()

        //3 saniye ileri sar
        vi.advanceTimersByTime(3000)

        //alertin artık görünmediğini kontrol et
        await waitFor(() => {
            expect(screen.queryByText("Test Alert")).not.toBeInTheDocument()
        })
    })
})
