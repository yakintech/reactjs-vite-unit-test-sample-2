import {screen, render, waitFor} from '@testing-library/react'
import Accordion from './Accordion'
import { describe, expect, it } from 'vitest'



describe('Accordion Component', () => {

    it('başlık ve içeriği doğru şekilde render etmelidir', () => {
        render(<Accordion title="Başlık" content="İçerik" />)

        //başlık ve içerik metinlerini kontrol et
        expect(screen.getByText('Başlık')).toBeInTheDocument()
        expect(screen.queryByText('İçerik')).not.toBeInTheDocument() // içerik başlangıçta görünmez olmalı
    })

    //butona tıklandığında içeriğin görünür hale gelmesini test et
    it('butona tıklandığında içeriği görünür hale getirmelidir', async () => {
        render(<Accordion title="Başlık" content="İçerik" />)

        const button = screen.getByText('Başlık')
        await button.click()
        expect(screen.getByText('İçerik')).toBeInTheDocument() // içerik görünür olmalı
    })

})