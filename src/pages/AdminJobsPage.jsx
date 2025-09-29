import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'
import { Table, Input, Select, Button, Space, Tag, message, Popconfirm } from 'antd'

function ensureTokenOrRedirect(navigate) {
  const token = localStorage.getItem('token')
  if (!token) {
    navigate('/admin/login')
    return null
  }
  setAuthToken(token)
  return token
}

export default function AdminJobsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalJobs: 0 })

  useEffect(() => {
    if (!ensureTokenOrRedirect(navigate)) return
  }, [navigate])

  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''

  useEffect(() => {
    const token = ensureTokenOrRedirect(navigate)
    if (!token) return

    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/api/admin/jobs', {
      params: { page, limit, search: search || undefined },
      signal: controller.signal,
    })
      .then((res) => {
        setJobs(res.data.jobs)
        setPagination(res.data.pagination)
      })
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          localStorage.removeItem('token')
          navigate('/admin/login')
        } else if (err.name !== 'CanceledError') {
          setError('Không tải được danh sách (admin)')
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [page, limit, search, navigate])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns = useMemo(() => ([
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', render: (text, record) => <Link to={`/admin/job/${record.id}`}>{text}</Link> },
    { title: 'Công ty', dataIndex: 'company', key: 'company' },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
    { title: 'Loại', dataIndex: 'job_type', key: 'job_type' },
    { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', render: (v) => v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> },
    {
      title: 'Hành động', key: 'actions', render: (_, record) => (
        <Space>
          <Link to={`/admin/job/${record.id}`}>Xem</Link>
          <Link to={`/admin/job/${record.id}/edit`}>Sửa</Link>
          <Button size="small" onClick={async () => { try { await api.patch(`/api/admin/jobs/${record.id}/toggle`); message.success('Đã đổi trạng thái'); fetchData() } catch { message.error('Không đổi được trạng thái') } }}>{record.is_active ? 'Vô hiệu' : 'Kích hoạt'}</Button>
          <Popconfirm title="Xóa job này?" okText="Xóa" cancelText="Hủy" onConfirm={async () => { try { await api.delete(`/api/admin/jobs/${record.id}`); message.success('Đã xóa'); fetchData() } catch { message.error('Xóa thất bại') } }}>
            <Button danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]), [])

  function fetchData() {
    const token = ensureTokenOrRedirect(navigate)
    if (!token) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/api/admin/jobs', { params: { page, limit, search: search || undefined }, signal: controller.signal })
      .then((res) => { setJobs(res.data.jobs); setPagination(res.data.pagination) })
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          localStorage.removeItem('token'); navigate('/admin/login')
        } else if (err.name !== 'CanceledError') {
          setError('Không tải được danh sách (admin)')
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }

  useEffect(() => { fetchData() }, [page, limit, search])

  return (
    <div className="container-fluid">
      <div className="card" style={{ marginBottom: 12 }}>
        <Space>
          <Input placeholder="Tìm tiêu đề / công ty" value={search} onChange={(e) => updateParam('search', e.target.value)} allowClear />
          <Select value={String(limit)} onChange={(v) => updateParam('limit', v)} options={[{ value: '10', label: '10/trang' }, { value: '20', label: '20/trang' }, { value: '50', label: '50/trang' }]} />
          <Link to="/admin/job/new"><Button type="primary">Tạo mới</Button></Link>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={jobs}
        pagination={{
          current: pagination.currentPage,
          total: pagination.totalJobs,
          pageSize: Number(limit),
          onChange: (p, ps) => {
            updateParam('page', String(p))
            if (ps !== Number(limit)) updateParam('limit', String(ps))
          }
        }}
      />
    </div>
  )
}
