import React from 'react'
import { useState } from 'react'

function Search() {

    const [text, setText] = useState("")
    const [isFocused, setIsFocused] = useState(false)


    return <>
        <input
            placeholder="Search..."
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        />
        {isFocused && <div>Searching for: {text}</div>}
    </>
}

export default Search