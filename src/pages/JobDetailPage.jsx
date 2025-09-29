import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney } from '../lib/format'
import { ArrowLeftOutlined } from '@ant-design/icons'

export default function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/api/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => setError('Không tải được chi tiết công việc'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container"><div className="card">Đang tải...</div></div>
  if (error) return <div className="container"><div className="card" style={{ color: 'crimson' }}>{error}</div></div>
  if (!job) return <div className="container"><div className="card">Không tìm thấy công việc</div></div>

  return (
    <div className="container">
      <Link className="button" to="/" style={{ marginBottom: 24 }}>
        <ArrowLeftOutlined /> Danh sách việc làm
      </Link>
      <br />
      <br />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{job.title}</h2>
        <div>{job.company} • {job.location} • {job.job_type}</div>
        <div style={{ marginTop: 8 }}>
          <strong>Lương:</strong> {job.salary_min || job.salary_max ? `${job.salary_min ? formatMoney(job.salary_min) : ''}${job.salary_min && job.salary_max ? ' - ' : ''}${job.salary_max ? formatMoney(job.salary_max) : ''} ${job.salary_currency || ''}` : 'Thoả thuận'}
        </div>
        <hr />
        <h3>Mô tả</h3>
        <div dangerouslySetInnerHTML={{ __html: job.description || '' }} />
        {job.requirements && (<>
          <h3>Yêu cầu</h3>
          <div dangerouslySetInnerHTML={{ __html: job.requirements || '' }} />
        </>)}
        {job.benefits && (<>
          <h3>Quyền lợi</h3>
          <div dangerouslySetInnerHTML={{ __html: job.benefits || '' }} />
        </>)}
        <h3>Liên hệ</h3>
        <div>Email: {job.contact_email}</div>
        {job.contact_phone && <div>Phone: {job.contact_phone}</div>}
      </div>
    </div>
  )
}
