import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://222.255.119.33:5010'

export const api = axios.create({
  baseURL: API_BASE,
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}
