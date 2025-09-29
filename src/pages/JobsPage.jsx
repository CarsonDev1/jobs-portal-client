import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton, Input, Select, Button, Tag, Divider, Space } from 'antd'
import { EnvironmentOutlined, SearchOutlined, DollarOutlined, FieldTimeOutlined, HomeOutlined, MailOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons'
import { api } from '../lib/api'
import { formatMoney } from '../lib/format'

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalJobs: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const page = useMemo(() => Number(searchParams.get('page') || '1'), [searchParams])
  const limit = useMemo(() => Number(searchParams.get('limit') || '10'), [searchParams])
  const search = useMemo(() => searchParams.get('search') || '', [searchParams])
  const location = useMemo(() => searchParams.get('location') || '', [searchParams])
  const job_type = useMemo(() => searchParams.get('job_type') || '', [searchParams])

  // Debounce inputs to avoid request thrashing while typing
  const [debounced, setDebounced] = useState({ search, location, job_type, limit })
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced({ search, location, job_type, limit })
    }, 400)
    return () => clearTimeout(t)
  }, [search, location, job_type, limit])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setPending(true)
    setError('')
    const start = Date.now()
    api.get('/api/jobs', {
      params: {
        page,
        limit: debounced.limit,
        search: debounced.search || undefined,
        location: debounced.location || undefined,
        job_type: debounced.job_type || undefined,
      },
      signal: controller.signal,
    })
      .then((res) => {
        setJobs(res.data.jobs)
        setPagination(res.data.pagination)
        // Auto select first item for preview on desktop
        if (!isMobile) {
          const items = res.data.jobs || []
          const hasSelected = selectedId && items.some((j) => j.id === selectedId)
          if (!hasSelected && items.length > 0) {
            selectJob(items[0].id)
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'CanceledError') setError('Không tải được danh sách công việc')
      })
      .finally(() => {
        const elapsed = Date.now() - start
        const minDelay = 500
        const remaining = Math.max(0, minDelay - elapsed)
        setTimeout(() => {
          setLoading(false)
          setPending(false)
        }, remaining)
      })

    return () => controller.abort()
  }, [page, debounced])

  // track viewport to disable preview on mobile
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  function selectJob(jobId) {
    if (!jobId) return
    if (isMobile) {
      navigate(`/jobs/${jobId}`)
      return
    }
    setSelectedId(jobId)
    setPreviewLoading(true)
    setSelectedJob(null)
    api.get(`/api/jobs/${jobId}`)
      .then((res) => setSelectedJob(res.data))
      .catch(() => setSelectedJob(null))
      .finally(() => setPreviewLoading(false))
  }

  return (
    <div>
      <div className="header">
        <div className="container">
          <div className="searchbar">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Chức danh, từ khóa hoặc công ty"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
            />
            <Input
              allowClear
              prefix={<EnvironmentOutlined />}
              placeholder="Địa điểm"
              value={location}
              onChange={(e) => updateParam('location', e.target.value)}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => updateParam('page', String(1))}>Tìm việc</Button>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Select
              style={{ minWidth: 220 }}
              value={job_type || ''}
              onChange={(v) => updateParam('job_type', v)}
              options={[
                { value: '', label: 'Loại công việc' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Internship', label: 'Internship' },
              ]}
            />
            <Select
              style={{ minWidth: 160 }}
              value={String(limit)}
              onChange={(v) => updateParam('limit', v)}
              options={[
                { value: '10', label: '10/trang' },
                { value: '20', label: '20/trang' },
                { value: '50', label: '50/trang' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 16 }}>
        <main>
          {error && <div className="card" style={{ color: 'crimson' }}>{error}</div>}
          {isMobile ? (
            <div className="results listpane">
              {pending ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div className="jobcard" key={idx}>
                    <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                  </div>
                ))
              ) : (
                jobs.map((job) => (
                  <div
                    className={`jobcard ${selectedId === job.id ? 'active' : ''}`}
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectJob(job.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectJob(job.id) } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="job-title">{job.title}</div>
                        <div className="job-meta"><BankOutlined /> {job.company}</div>
                        <div className="job-meta" style={{ marginTop: 4 }}><EnvironmentOutlined /> {job.location} • <FieldTimeOutlined /> {job.job_type}</div>
                        <div className="job-meta" style={{ marginTop: 6 }}>
                          <DollarOutlined /> {job.salary_min || job.salary_max ? `${job.salary_min ? formatMoney(job.salary_min) : ''}${job.salary_min && job.salary_max ? ' - ' : ''}${job.salary_max ? formatMoney(job.salary_max) : ''} ${job.salary_currency || ''}` : 'Thoả thuận'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="split">
              {pending ? (
                <div className="results listpane">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div className="jobcard" key={idx}>
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="results listpane">
                  {jobs.map((job) => (
                    <div
                      className={`jobcard ${selectedId === job.id ? 'active' : ''}`}
                      key={job.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectJob(job.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectJob(job.id) } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px' }}>{job.title}</h3>
                          <div className="job-meta">{job.company} • {job.location} • {job.job_type}</div>
                          <div className="job-meta" style={{ marginTop: 6 }}>
                            <strong>Lương:</strong> {job.salary_min || job.salary_max ? `${job.salary_min ? formatMoney(job.salary_min) : ''}${job.salary_min && job.salary_max ? ' - ' : ''}${job.salary_max ? formatMoney(job.salary_max) : ''} ${job.salary_currency || ''}` : 'Thoả thuận'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="preview">
                {previewLoading && (
                  <div className="card">
                    <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 6 }} />
                  </div>
                )}
                {!previewLoading && selectedId && !selectedJob && (
                  <div className="card">Không tải được chi tiết công việc</div>
                )}
                {!previewLoading && !selectedId && (
                  <div className="card">Chọn một công việc để xem nhanh</div>
                )}
                {!previewLoading && selectedJob && (
                  <div className="card">
                    <div className="preview-head">
                      <h3 style={{ margin: 0, fontSize: 24, marginBottom: 12 }}>{selectedJob.title}</h3>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <div className="job-meta"><BankOutlined /> {selectedJob.company}</div>
                        <div className="job-meta"><EnvironmentOutlined /> {selectedJob.location}</div>
                        <div className="job-meta"><FieldTimeOutlined /> {selectedJob.job_type}</div>
                        <div className="job-meta">
                          <DollarOutlined /> {selectedJob.salary_min || selectedJob.salary_max ? `${selectedJob.salary_min ? formatMoney(selectedJob.salary_min) : ''}${selectedJob.salary_min && selectedJob.salary_max ? ' - ' : ''}${selectedJob.salary_max ? formatMoney(selectedJob.salary_max) : ''} ${selectedJob.salary_currency || ''}` : 'Thoả thuận'}
                        </div>
                        <div className="row" style={{ marginTop: 4, gap: 8, justifyContent: 'space-between' }}>
                          <div>
                            <Tag color="blue">{selectedJob.job_type}</Tag>
                            {selectedJob.is_active ? <Tag color="green">Đang tuyển</Tag> : <Tag color="red">Tạm dừng</Tag>}
                          </div>
                          <div className="row" style={{ justifyContent: 'flex-end' }}>
                            <Link className="button" to={`/jobs/${selectedJob.id}`}>Xem chi tiết</Link>
                          </div>
                        </div>
                      </Space>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <div className="muted section-title">Chi tiết công việc</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16 }}>
                        <div><DollarOutlined /> <strong>Mức lương:</strong> {selectedJob.salary_min || selectedJob.salary_max ? `${selectedJob.salary_min ? formatMoney(selectedJob.salary_min) : ''}${selectedJob.salary_min && selectedJob.salary_max ? ' - ' : ''}${selectedJob.salary_max ? formatMoney(selectedJob.salary_max) : ''} ${selectedJob.salary_currency || ''}` : 'Thoả thuận'}</div>
                        <div><FieldTimeOutlined /> <strong>Loại việc làm:</strong> {selectedJob.job_type}</div>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <div className="muted section-title">Địa điểm</div>
                      <div style={{ marginBottom: 12 }}><EnvironmentOutlined /> {selectedJob.location}</div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <div className="muted section-title">Mô tả công việc đầy đủ</div>
                      <div dangerouslySetInnerHTML={{ __html: selectedJob.description || '' }} />
                    </div>
                    {selectedJob.requirements && (
                      <>
                        <div className="muted section-title">Yêu cầu</div>
                        <div dangerouslySetInnerHTML={{ __html: selectedJob.requirements || '' }} />
                      </>
                    )}
                    {selectedJob.benefits && (
                      <>
                        <div className="muted section-title">Quyền lợi</div>
                        <div dangerouslySetInnerHTML={{ __html: selectedJob.benefits || '' }} />
                      </>
                    )}
                    <div className="muted section-title">Liên hệ</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 16, alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div><MailOutlined /> {selectedJob.contact_email}</div>
                      </div>
                      <div> {selectedJob.contact_phone && <div><PhoneOutlined /> {selectedJob.contact_phone}</div>}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pagination" style={{ marginTop: 16 }}>
            <button className="button" disabled={pagination.currentPage <= 1} onClick={() => goToPage(pagination.currentPage - 1)}>Trước</button>
            <div className="muted">Trang {pagination.currentPage}/{pagination.totalPages} • Tổng {pagination.totalJobs}</div>
            <button className="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => goToPage(pagination.currentPage + 1)}>Sau</button>
          </div>
        </main>
      </div >
    </div >
  )
}

