import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../Admin/AdminLayout.css'  
import '../Admin/Admin.css'        

export default function NppLayout({ title, children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (!window.confirm('Bạn chắc chắn muốn đăng xuất NPP?')) return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/dang-nhap')
  }

  const menu = [
    { path: '/npp', label: 'Tổng quan' },
    { path: '/npp/danh-muc', label: 'Quản lý danh mục' },
    { path: '/npp/san-pham', label: 'Quản lý sản phẩm' },
    { path: '/npp/don-hang', label: 'Quản lý đơn hàng' },
    { path: '/npp/danh-gia', label: 'Quản lý đánh giá' },
    { path: '/npp/thong-ke', label: 'Quản lý thống kê' },
  ]

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-logo">NPP – Nông Sản Sạch</div>

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

      <main className="adm-main">
        <header className="adm-header">
          <div className="adm-breadcrumb">
            Trang chủ / Nhà phân phối /{' '}
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
