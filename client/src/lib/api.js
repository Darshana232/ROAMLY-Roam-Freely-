import axios from 'axios'

// In production the API lives on a different host (Render), set via VITE_API_URL.
// In dev, Vite proxies /api to the Express server.
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  withCredentials: true,
})

// Pull the server's { error: { message } } shape into a plain message string.
export function errorMessage(err) {
  if (!err) return null
  if (err.response?.data?.error?.message) return err.response.data.error.message
  if (err.code === 'ERR_NETWORK') return 'Can’t reach the server. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}
