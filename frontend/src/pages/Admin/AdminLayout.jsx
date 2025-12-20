import { Link, useLocation, useNavigate } from 'react-router-dom'
import './AdminLayout.css' 
import './Admin.css'

export default function AdminLayout({ title, children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (!window.confirm('Bạn chắc chắn muốn đăng xuất admin?')) return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/admin/dang-nhap')
  }

  const menu = [
    { path: '/admin', label: 'Trang Quản Lý' },
    { path: '/admin/tai-khoan', label: 'Quản lý tài khoản' },
    { path: '/admin/san-pham', label: 'Duyêt sản phẩm Nhà Phân Phối' },
    { path: '/admin/danh-muc', label: 'Quản lý danh mục sản phẩm' },
    { path: '/admin/nha-phan-phoi', label: 'Quản lý Nhà Phân Phối' },
    { path: '/admin/ma-giam-gia', label: 'Quản lý khuyến mãi' },
    { path: '/admin/thong-ke', label: 'Quản lý thống kê' },
  ]

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-logo">NÔNG SẢN SẠCH</div>

        <nav className="adm-nav">
          {menu.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  'adm-nav-item ' + (active ? 'adm-nav-item-active' : '')
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="adm-main">
        <header className="adm-header">
          <div className="adm-breadcrumb">
            Trang chủ / Quản trị /{' '}
            <span className="adm-breadcrumb-current">{title}</span>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </header>

        <section className="adm-content-card">
          <h2 className="adm-page-title">{title}</h2>
          {children}
        </section>
      </main>
    </div>
  )
}
