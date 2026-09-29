
import React, { useState } from 'react'


interface Props {
    fetchData: () => Promise<string>
}

const AsyncDataLoader = ({ fetchData }: Props) => {
    const [data, setData] = useState("")
    const [loading, setLoading] = useState(false)

    const loadData = async () => {
        setLoading(true)
        const result = await fetchData()
        setData(result)
        setLoading(false)
    }

    return (
        <div>
            <button onClick={loadData}>Load Data</button>
            {loading && <p>Loading...</p>}
            {data && <p>Data: {data}</p>}
        </div>
    )
}

export default AsyncDataLoader