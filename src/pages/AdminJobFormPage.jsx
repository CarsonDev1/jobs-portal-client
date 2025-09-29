import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, setAuthToken } from '../lib/api'
import { Form, Input, InputNumber, Select, Button, Card, Row, Col, Typography, message } from 'antd'
import ReactQuill from 'react-quill'

const { Title } = Typography

function ensureTokenOrRedirect(navigate) {
  const token = localStorage.getItem('token')
  if (!token) {
    navigate('/admin/login')
    return null
  }
  setAuthToken(token)
  return token
}

export default function AdminJobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = useMemo(() => Boolean(id), [id])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!ensureTokenOrRedirect(navigate)) return
  }, [navigate])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api.get(`/api/admin/jobs/${id}`)
      .then((res) => {
        const data = res.data
        form.setFieldsValue({
          title: data.title,
          company: data.company,
          location: data.location,
          salary_min: data.salary_min ?? undefined,
          salary_max: data.salary_max ?? undefined,
          salary_currency: data.salary_currency || 'VND',
          job_type: data.job_type || 'Full-time',
          description: data.description,
          requirements: data.requirements || undefined,
          benefits: data.benefits || undefined,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || undefined,
          is_active: data.is_active,
        })
      })
      .catch(() => message.error('Không tải được job'))
      .finally(() => setLoading(false))
  }, [id, isEdit, form])

  async function onFinish(values) {
    if (!ensureTokenOrRedirect(navigate)) return
    setLoading(true)
    const payload = {
      ...values,
      salary_min: values.salary_min ?? null,
      salary_max: values.salary_max ?? null,
      requirements: values.requirements ?? null,
      benefits: values.benefits ?? null,
      contact_phone: values.contact_phone ?? null,
    }
    if (payload.salary_min !== null && payload.salary_max !== null) {
      if (Number(payload.salary_min) > Number(payload.salary_max)) {
        message.error('Lương tối thiểu không được lớn hơn lương tối đa')
        setLoading(false)
        return
      }
    }
    try {
      if (isEdit) {
        await api.put(`/api/admin/jobs/${id}`, payload)
        message.success('Cập nhật công việc thành công')
      } else {
        await api.post('/api/admin/jobs', payload)
        message.success('Tạo công việc thành công')
      }
      navigate('/admin')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Title level={3} style={{ margin: 0 }}>{isEdit ? 'Sửa công việc' : 'Tạo công việc'}</Title>
          <Button onClick={() => navigate('/admin')}>Quay lại</Button>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          initialValues={{ salary_currency: 'VND', job_type: 'Full-time', is_active: true }}
        >
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="VD: Frontend Developer" />
          </Form.Item>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item name="company" label="Công ty" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="location" label="Địa điểm" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="salary_min"
                label="Lương tối thiểu"
                dependencies={["salary_max"]}
                rules={[
                  { type: 'number', transform: (v) => (v === '' ? undefined : v), min: 0, message: '>= 0' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = value ?? null;
                      const max = getFieldValue('salary_max') ?? null;
                      if (min !== null && max !== null && Number(min) > Number(max)) {
                        return Promise.reject(new Error('Không lớn hơn lương tối đa'));
                      }
                      return Promise.resolve();
                    }
                  })
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 15000000" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="salary_max"
                label="Lương tối đa"
                dependencies={["salary_min"]}
                rules={[
                  { type: 'number', transform: (v) => (v === '' ? undefined : v), min: 0, message: '>= 0' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const max = value ?? null;
                      const min = getFieldValue('salary_min') ?? null;
                      if (min !== null && max !== null && Number(min) > Number(max)) {
                        return Promise.reject(new Error('Phải ≥ lương tối thiểu'));
                      }
                      return Promise.resolve();
                    }
                  })
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 30000000" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="salary_currency" label="Tiền tệ">
                <Select
                  options={[
                    { value: 'VND', label: 'VND' },
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item name="job_type" label="Loại công việc">
                <Select
                  options={[
                    { value: 'Full-time', label: 'Full-time' },
                    { value: 'Part-time', label: 'Part-time' },
                    { value: 'Contract', label: 'Contract' },
                    { value: 'Internship', label: 'Internship' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contact_email" label="Email liên hệ" rules={[{ required: true, type: 'email', message: 'Email hợp lệ' }]}>
                <Input placeholder="hr@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item name="contact_phone" label="SĐT liên hệ">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <ReactQuill theme="snow" />
          </Form.Item>

          <Form.Item name="requirements" label="Yêu cầu">
            <ReactQuill theme="snow" />
          </Form.Item>
          <Form.Item name="benefits" label="Quyền lợi">
            <ReactQuill theme="snow" />
          </Form.Item>

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={() => navigate('/admin')}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? 'Cập nhật' : 'Tạo mới'}</Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}
