import { useEffect, useState } from 'react'

let push = () => {}
export const toast = (msg) => push(msg)

export default function Toast() {
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let t
    push = (m) => {
      setMsg(m)
      clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2500)
    }
    return () => clearTimeout(t)
  }, [])

  return <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>
}
