import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import './User.css'
import TrangFooter from './TrangFooter'

const API_ROOT = 'http://localhost:4000'

export default function TrangChu() {
  const [dsSanPham, setDsSanPham] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''



  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const role = (user.ten_vai_tro || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  const isDistributor = role.includes('phan') && role.includes('phoi')
//giỏ hàng
  const handleAddToCart = (sp, soLuong = 1) => {
    if (isDistributor) {
      alert('Tài khoản Nhà phân phối không thể đặt hàng trên hệ thống.')
      return
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const index = cart.findIndex((i) => i.san_pham_id === sp.san_pham_id)
    if (index >= 0) cart[index].so_luong += soLuong
    else {
      cart.push({
        san_pham_id: sp.san_pham_id,
        ten_san_pham: sp.ten_san_pham,
        gia: Number(sp.gia),
        so_luong: soLuong,
        hinh_anh: sp.hinh_anh,
        nha_phan_phoi_id: sp.nha_phan_phoi_id || null,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Đã thêm sản phẩm vào giỏ hàng!')
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/san-pham/public')
        setDsSanPham(res.data || [])
      } catch {
        setMsg('Không tải được danh sách sản phẩm.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const normalize = (str = '') =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const sanPhamLoc = dsSanPham.filter((sp) => {
    if (!keyword.trim()) return true
    const k = normalize(keyword)
    return (
      normalize(sp.ten_san_pham).includes(k) ||
      normalize(sp.mo_ta || '').includes(k)
    )
  })

  const featuredProducts = sanPhamLoc.slice(0, 4)

  const renderProductCard = (sp) => (
    <div
      key={sp.san_pham_id}
      className="product-card"
      onClick={() => navigate(`/san-pham/${sp.san_pham_id}`)}
    >
      <div className="product-img-wrap">
        {sp.hinh_anh ? (
          <img
            src={`${API_ROOT}/uploads/${sp.hinh_anh}`}
            alt={sp.ten_san_pham}
          />
        ) : (
          <div className="product-no-img">Không có ảnh</div>
        )}
      </div>

      <div className="product-body">
        <div className="product-name">{sp.ten_san_pham}</div>
        <div className="product-desc">{sp.mo_ta || 'Chưa có mô tả.'}</div>

        <div className="product-meta">
          <span className="product-price">
            {Number(sp.gia).toLocaleString('vi-VN')} đ
          </span>
          <span className="product-price-old">
            {(Number(sp.gia) * 1.1).toLocaleString('vi-VN')} đ
          </span>
        </div>

        <button
          className="product-add-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleAddToCart(sp)
          }}
        >
          Chọn mua
        </button>
      </div>
    </div>
  )

  const groupByCategory = (list) => {
    const groups = {}
    list.forEach((sp) => {
      const rawName =
        sp.ten_loai_san_pham ||
        sp.ten_loai ||
        sp.ten_danh_muc ||
        'Sản phẩm khác'
      const catName = rawName || 'Sản phẩm khác'
      if (!groups[catName]) groups[catName] = []
      groups[catName].push(sp)
    })
    return groups
  }

  const sanPhamTheoDanhMuc = groupByCategory(sanPhamLoc)

  const renderProductRowCard = (sp) => (
    <div
      key={`row-${sp.san_pham_id}`}
      className="home-row-card"
      onClick={() => navigate(`/san-pham/${sp.san_pham_id}`)}
    >
      <div className="home-row-card-img">
        {sp.hinh_anh ? (
          <img
            src={`${API_ROOT}/uploads/${sp.hinh_anh}`}
            alt={sp.ten_san_pham}
          />
        ) : (
          <div className="product-no-img">Không có ảnh</div>
        )}
      </div>
      <div className="home-row-card-body">
        <div className="home-row-card-name">{sp.ten_san_pham}</div>
        <div className="home-row-card-price">
          {Number(sp.gia).toLocaleString('vi-VN')} đ
        </div>
      </div>
    </div>
  )

  const categoryBanners = {
    'Gạo và các sản phẩm từ gạo': '/banners/gao.png',
    'Gạo các loại': '/banners/gao.png',
  }

  const goToCategory = (catName) => {
    navigate(`/cua-hang?cat=${encodeURIComponent(catName)}`)
  }

  return (
    <div className="home-page">
      <main className="home-main">
        <section className="hero-banner">
          <div className="hero-overlay">
            <p className="hero-sub">NÔNG SẢN SẠCH</p>
            <h1 className="hero-title">
              ĂN SẠCH – <span>SỐNG KHỎE</span>
            </h1>
            <div className="hero-actions"></div>
          </div>

          
        </section>

        <div className="home-container">
          <section className="home-stat-bar">
            <div className="home-stat-item">
              <span className="home-stat-icon">🚚</span>
              <div>
                <div className="home-stat-title">Giao nhanh 24h</div>
                <div className="home-stat-sub">
                  Nội thành Tp. Hồ Chí Minh & vùng lân cận
                </div>
              </div>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-icon">🥬</span>
              <div>
                <div className="home-stat-title">Hàng tươi mỗi ngày</div>
                <div className="home-stat-sub">
                  Xuất kho trong ngày, có nguồn gốc
                </div>
              </div>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-icon">💬</span>
              <div>
                <div className="home-stat-title">Tư vấn 8h–22h</div>
                <div className="home-stat-sub">Hỗ trợ đặt hàng, CSKH nhanh</div>
              </div>
            </div>
          </section>

          {featuredProducts.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <div>
                  <h2 className="home-section-title">Sản phẩm nổi bật</h2>
                  <p className="home-section-sub">
                    Lựa chọn nhiều nhất trên cửa hàng.
                  </p>
                </div>
                <button
                  type="button"
                  className="home-section-link"
                  onClick={() => {
                    const el = document.getElementById('product-list')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Xem tất cả &gt;
                </button>
              </div>

              <div className="home-product-grid">
                {featuredProducts.map(renderProductCard)}
              </div>
            </section>
          )}

          {Object.entries(sanPhamTheoDanhMuc).map(([catName, list], idx) => {
            const bannerUrl =
              categoryBanners[catName] || '/banners/default-category.png'

            return (
              <section
                key={catName}
                id={idx === 0 ? 'product-list' : undefined}
                className="home-section home-section-horizontal"
              >
                <div className="home-section-header">
                  <div>
                    <h2 className="home-section-title">{catName}</h2>
                    <p className="home-section-sub">
                      Có {list.length} sản phẩm đang bán.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="home-section-link"
                    onClick={() => goToCategory(catName)}
                  >
                    Xem thêm &gt;
                  </button>
                </div>

                {msg && <div className="home-alert">{msg}</div>}
                {loading && <p className="loading-text">Đang tải sản phẩm...</p>}

                <div className="home-row-layout">
                  <div
                    className="home-row-banner"
                    style={{ backgroundImage: `url(${bannerUrl})` }}
                    onClick={() => goToCategory(catName)}
                  >
                    <div className="home-row-banner-text">
                      <div className="home-row-banner-title">{catName}</div>
                      <div className="home-row-banner-sub">
                        Xem tất cả sản phẩm
                      </div>
                    </div>
                  </div>

                  <div className="home-row-scroll">
                    {list.map((sp) => renderProductRowCard(sp))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </main>
      <TrangFooter />
    </div>
  )
}
