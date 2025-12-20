import { useNavigate } from 'react-router-dom'
import './Admin.css'

export default function DashboardAdmin() {
  const navigate = useNavigate()

  return (
    <div className="admin-bg-main">
      <div className="admin-card-lg">
        <h1 className="admin-title-h1">Trang chủ quản lý</h1>
        <p className="admin-subtext-muted">
          Chọn chức năng bạn muốn thao tác trong hệ thống quản trị.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginTop: 8,
          }}
        >

          <button
            className="admin-nav-btn"
            onClick={() => navigate('/admin/tai-khoan')}
          >
            Quản lý tài khoản
          </button>

          <button
            className="admin-nav-btn"
            onClick={() => navigate('/admin/nha-phan-phoi')}
          >
            Quản lý Nhà phân phối
          </button>
          <button
          className="admin-nav-btn"
          onClick={() => navigate('/admin/san-pham')}
        >
          Duyệt sản phẩm NPP
        </button>
        <button
          className="admin-nav-btn"
          onClick={() => navigate('/admin/danh-muc')}
        >
          Duyệt danh mục
        </button>
          <button onClick={() => navigate('/admin/ma-giam-gia')}>
          Quản lý mã khuyến mãi
        </button>
        <button onClick={() => navigate('/admin/thong-ke')}>
          Quản lý thống kê
        </button>
        </div>
      </div>
    </div>
  )
}
