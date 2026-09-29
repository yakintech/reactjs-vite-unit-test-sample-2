import React from 'react'
import { useState, useEffect } from 'react'

function AutoDismissAlert() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div>AutoDismissAlert</div>
  )
}

export default AutoDismissAlert