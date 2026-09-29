import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import UserProfile from './UserProfile'
import { describe, expect, it } from 'vitest'


describe('UserProfile Component', () => {

    it('kullanıcı adını ve çevrimiçi durumunu doğru şekilde render etmelidir', () => {
      render(<UserProfile username="John Doe" isOnline={true} />)

      //başlık ve durum metinlerini kontrol et
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Status: Online')).toBeInTheDocument()
    })

    it('çevrimdışı durumunu doğru şekilde render etmelidir', () => {
      render(<UserProfile username="Jane Doe" isOnline={false} />)

      //başlık ve durum metinlerini kontrol et
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
        expect(screen.getByText('Status: Offline')).toBeInTheDocument()
    })

})

//expect kelimesi vitest kütüphanesinden gelir ve test senaryolarında beklenen sonuçları doğrulamak için kullanılır. Bu sayede testlerimizde belirli bir koşulun doğru olup olmadığını kontrol edebiliriz.


//describe kelimesi vitest kütüphanesinden gelir ve test senaryolarını gruplamak için kullanılır. Bu sayede birden fazla test case'i tek bir başlık altında organize edebiliriz.

//it kelimesi test case tanımlamak için kullanılır. Her it bloğu, belirli bir işlevselliği test eden bir senaryoyu temsil eder

//render kelimesi componenti test ortamında render etmek için kullanılır. Bu sayede componentin DOM'da nasıl göründüğünü ve davrandığını test edebiliriz.