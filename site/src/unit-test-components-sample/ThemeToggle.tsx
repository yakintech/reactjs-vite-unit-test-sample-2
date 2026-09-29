

import React, { useState } from 'react'

function ThemeToggle() {

    const [theme, settheme] = useState(() => {
        return localStorage.getItem('theme') || 'light'
    })

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        settheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    return <button onClick={toggleTheme}>
        Active Theme: {theme}
    </button>

}

export default ThemeToggle