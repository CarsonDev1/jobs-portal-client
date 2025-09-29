import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { username, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      setAuthToken(token)
      navigate('/admin')
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Đăng nhập Admin</h2>
      <form onSubmit={onSubmit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        <button className="button" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  )
}
