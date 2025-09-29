import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminJobsPage from './pages/AdminJobsPage'
import AdminJobFormPage from './pages/AdminJobFormPage'
import AdminJobDetailPage from './pages/AdminJobDetailPage'

export default function App() {
  const { Header, Content, Footer } = Layout
  return (
    <Layout style={{ minHeight: '100vh', background: 'white' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%', display: 'flex', alignItems: 'center', gap: 16, background: 'white' }}>
        <div style={{ color: 'rgb(31, 53, 126)', fontWeight: 700, fontSize: 18 }}>JobPortal</div>
        <Menu theme="light" mode="horizontal" selectable={false} style={{ flex: 1 }} items={[
          { key: 'jobs', label: <Link to="/">Việc làm</Link> },
          { key: 'admin', label: <Link to="/admin">Admin</Link> },
        ]} />
      </Header>
      <Content>
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminJobsPage />} />
          <Route path="/admin/job/new" element={<AdminJobFormPage />} />
          <Route path="/admin/job/:id" element={<AdminJobDetailPage />} />
          <Route path="/admin/job/:id/edit" element={<AdminJobFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>JobPortal</div>
          <div style={{ color: '#6b7280', marginBottom: 8 }}>Kết nối ứng viên và nhà tuyển dụng nhanh chóng, hiệu quả.</div>
          <div style={{ color: '#9ca3af' }}>© {new Date().getFullYear()} JobPortal. All rights reserved.</div>
        </div>
      </Footer>
    </Layout>
  )
}
