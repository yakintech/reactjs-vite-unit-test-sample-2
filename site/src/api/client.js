// Thin fetch wrapper. All real HTTP calls go through here.

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const API_URL = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'b2b_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(API_URL + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }

  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data)
  }
  return data
}

// Simulates network latency for mock responses.
export const mockDelay = (value, ms = 250) => new Promise((r) => setTimeout(() => r(structuredClone(value)), ms))
