import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, createSearchParams } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

export default function TrangHeader() {
  const navigate = useNavigate()
  const location = useLocation()

  const [openAccount, setOpenAccount] = useState(false)
  const [openCartMenu, setOpenCartMenu] = useState(false)

  const [openVoucherMenu, setOpenVoucherMenu] = useState(false)
  const [myVouchers, setMyVouchers] = useState([])
  const [loadingVoucher, setLoadingVoucher] = useState(false)

  const [keyword, setKeyword] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const role = useMemo(() => {
    return (user.ten_vai_tro || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }, [user.ten_vai_tro])

  const isCustomer = role.includes('khach') && role.includes('hang')
  const isDistributor = role.includes('phan') && role.includes('phoi')

  const handleBecomeDistributor = () => {
    if (!localStorage.getItem('token')) return navigate('/dang-nhap')
    navigate('/dang-ky-nha-phan-phoi')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setKeyword(params.get('q') || '')
    setOpenAccount(false)
    setOpenCartMenu(false)
    setOpenVoucherMenu(false)
  }, [location.pathname, location.search])

  const submitSearch = () => {
    const q = (keyword || '').trim()
    const toPath = location.pathname === '/' || location.pathname === '/trang-chu' ? '/trang-chu' : '/cua-hang'
    if (!q) return navigate(toPath)

    navigate({
      pathname: toPath,
      search: `?${createSearchParams({ q })}`,
    })
  }

  const token = localStorage.getItem('token')
  const isLoginNow = !!token

  useEffect(() => {
    if (!token) {
      setMyVouchers([])
      return
    }

    ;(async () => {
      try {
        setLoadingVoucher(true)

        const res = await api.get('/ma-giam-gia/cua-toi')

        const data = res.data
        const list = Array.isArray(data) ? data : data?.list || []
        setMyVouchers(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('Load voucher lỗi:', e?.response?.data || e)
        setMyVouchers([])
      } finally {
        setLoadingVoucher(false)
      }
    })()
  }, [token])

  const pickVoucherAndGoCheckout = (code) => {
    const c = String(code || '').trim().toUpperCase()
    if (!c) return
    localStorage.setItem('selectedVoucherCode', c)
    setOpenVoucherMenu(false)
    setOpenAccount(false)
    setOpenCartMenu(false)
    navigate('/thanh-toan')
  }

  return (
    <header className="home-header">
      <div className="home-header-left">
        <div className="home-logo" onClick={() => navigate('/trang-chu')}>
          <div className="home-logo-icon">
            <img src="/logo.png" alt="Nông sản sạch" />
          </div>
          <div className="home-logo-text">
            <div className="home-logo-title">Nông sản sạch</div>
            <div className="home-logo-sub">Ăn sạch – Sống khỏe</div>
          </div>
        </div>

        <nav className="home-top-menu">
          <NavLink
            to="/trang-chu"
            className={({ isActive }) => `home-top-menu-item ${isActive ? 'home-top-menu-active' : ''}`}
          >
            TRANG CHỦ
          </NavLink>

          <NavLink
            to="/cua-hang"
            className={({ isActive }) => `home-top-menu-item ${isActive ? 'home-top-menu-active' : ''}`}
          >
            CỬA HÀNG
          </NavLink>
        </nav>
      </div>

      <div className="home-header-center">
        <input
          className="home-search-box"
          placeholder="Tìm kiếm sản phẩm nông sản..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch()
          }}
        />
      </div>

      <div className="home-header-right">
        <div
          className="home-header-link"
          onClick={() => {
            setOpenVoucherMenu(!openVoucherMenu)
            setOpenAccount(false)
            setOpenCartMenu(false)
          }}
        >
          <span className="icon">🎟️</span>
          <span>Voucher</span>
          {isLoginNow && myVouchers.length > 0 && <span style={{ marginLeft: 6, fontWeight: 700 }}>({myVouchers.length})</span>}

          {openVoucherMenu && (
            <div className="account-dropdown" onClick={(e) => e.stopPropagation()}>
              {!isLoginNow ? (
                <div className="dropdown-item" onClick={() => navigate('/dang-nhap')}>
                  Đăng nhập để xem voucher
                </div>
              ) : loadingVoucher ? (
                <div className="dropdown-item">Đang tải voucher...</div>
              ) : !myVouchers.length ? (
                <div className="dropdown-item">Chưa có voucher khả dụng</div>
              ) : (
                <>
                  {myVouchers.slice(0, 5).map((v) => (
                    <div
                      key={v.ma_giam_gia_id}
                      className="dropdown-item"
                      onClick={() => pickVoucherAndGoCheckout(v.ma_code)}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                      title="Bấm để dùng voucher và đi thanh toán"
                    >
                      <span style={{ fontWeight: 700 }}>{v.ma_code}</span>
                      <span style={{ opacity: 0.8, fontSize: 12 }}>Dùng</span>
                    </div>
                  ))}
                  <div className="dropdown-item" onClick={() => navigate('/thanh-toan')} style={{ fontWeight: 700 }}>
                    Đi tới thanh toán
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div
          className="home-header-link"
          onClick={() => {
            setOpenAccount(!openAccount)
            setOpenCartMenu(false)
            setOpenVoucherMenu(false)
          }}
        >
          <span className="icon">👤</span>
          <span>Tài khoản</span>

          {openAccount && (
            <div className="account-dropdown" onClick={(e) => e.stopPropagation()}>
              {!isLoginNow ? (
                <>
                  <div className="dropdown-item" onClick={() => navigate('/dang-nhap')}>
                    Đăng nhập
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/dang-ky')}>
                    Đăng ký
                  </div>
                </>
              ) : (
                <>
                  <div className="dropdown-item">Xin chào, {user.ho_ten}</div>

                  <div className="dropdown-item" onClick={() => navigate('/thong-tin-ca-nhan')}>
                    Thông tin cá nhân
                  </div>

                  {isCustomer && !isDistributor && (
                    <div className="dropdown-item" onClick={handleBecomeDistributor}>
                      Trở thành Nhà phân phối
                    </div>
                  )}

                  {isDistributor && (
                    <div className="dropdown-item" onClick={() => navigate('/npp')}>
                      Vào trang quản lý Nhà phân phối
                    </div>
                  )}

                  <div
                    className="dropdown-item text-danger"
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                  >
                    Đăng xuất
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div
          className="home-header-link"
          onClick={() => {
            setOpenCartMenu(!openCartMenu)
            setOpenAccount(false)
            setOpenVoucherMenu(false)
          }}
        >
          <span className="icon">🛒</span>
          <span>Giỏ hàng</span>

          {openCartMenu && (
            <div className="account-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-item" onClick={() => navigate('/gio-hang')}>
                Xem giỏ hàng
              </div>
              <div className="dropdown-item" onClick={() => navigate('/lich-su-don-hang')}>
                Lịch sử đơn hàng
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
