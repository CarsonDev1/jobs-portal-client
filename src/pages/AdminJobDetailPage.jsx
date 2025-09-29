import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'

function ensureTokenOrRedirect(navigate) {
  const token = localStorage.getItem('token')
  if (!token) {
    navigate('/admin/login')
    return null
  }
  setAuthToken(token)
  return token
}

export default function AdminJobDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ensureTokenOrRedirect(navigate)) return
  }, [navigate])

  function load() {
    setLoading(true)
    setError('')
    api.get(`/api/admin/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => setError('Không tải được công việc'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function onToggle() {
    try {
      await api.patch(`/api/admin/jobs/${id}/toggle`)
      load()
    } catch {
      alert('Không thể đổi trạng thái')
    }
  }

  async function onDelete() {
    if (!confirm('Xóa công việc này?')) return
    try {
      await api.delete(`/api/admin/jobs/${id}`)
      navigate('/admin')
    } catch {
      alert('Xóa thất bại')
    }
  }

  if (loading) return <div className="container"><div className="card">Đang tải...</div></div>
  if (error) return <div className="container"><div className="card" style={{ color: 'crimson' }}>{error}</div></div>
  if (!job) return null

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{job.title}</h2>
          <div className="row">
            <Link className="button" to={`/admin/job/${id}/edit`}>Sửa</Link>
            <button className="button" onClick={onToggle}>{job.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>
            <button className="button" onClick={onDelete}>Xóa</button>
          </div>
        </div>
        <div className="muted">{job.company} • {job.location} • {job.job_type}</div>
        <hr />
        <h3>Mô tả</h3>
        <div dangerouslySetInnerHTML={{ __html: job.description || '' }} />
        {job.requirements && <><h3>Yêu cầu</h3><div dangerouslySetInnerHTML={{ __html: job.requirements || '' }} /></>}
        {job.benefits && <><h3>Quyền lợi</h3><div dangerouslySetInnerHTML={{ __html: job.benefits || '' }} /></>}
        <h3>Liên hệ</h3>
        <div>Email: {job.contact_email}</div>
        {job.contact_phone && <div>Phone: {job.contact_phone}</div>}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Link className="button" to="/admin">Quay lại</Link>
      </div>
    </div>
  )
}
