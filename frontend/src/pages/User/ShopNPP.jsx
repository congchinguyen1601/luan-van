import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

const API_ROOT = 'http://localhost:4000'

export default function ShopNPP() {
  const { nppId } = useParams()
  const navigate = useNavigate()

  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')


  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const role = (user.ten_vai_tro || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  const isDistributor = role.includes('phan') && role.includes('phoi')

  const handleAddToCart = (sp, soLuong = 1) => {
    // Không cho NPP đặt hàng
    if (isDistributor) {
      alert('Tài khoản Nhà phân phối không thể đặt hàng trên hệ thống.')
      return
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const index = cart.findIndex((i) => i.san_pham_id === sp.san_pham_id)

    if (index >= 0) {
      cart[index].so_luong += soLuong
    } else {
      cart.push({
        san_pham_id: sp.san_pham_id,
        ten_san_pham: sp.ten_san_pham,
        gia: Number(sp.gia),
        so_luong: soLuong,
        hinh_anh: sp.hinh_anh,
        nha_phan_phoi_id: sp.nha_phan_phoi_id || nppId,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Đã thêm sản phẩm vào giỏ hàng!')
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setMsg('')
        const res = await api.get(`/san-pham/shop/${nppId}`)
        setShop(res.data?.shop || null)
        setProducts(res.data?.products || [])
      } catch (err) {
        console.error(err)
        setMsg(err.response?.data?.message || 'Không tải được sản phẩm.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [nppId])

  // Lấy danh sách danh mục từ sản phẩm
  const categories = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      if (p.loai_san_pham_id && p.ten_loai) {
        map.set(p.loai_san_pham_id, p.ten_loai)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({
      loai_san_pham_id: id,
      ten_loai: name,
    }))
  }, [products])

  const filteredProducts =
    selectedCat === 'all'
      ? products
      : products.filter((p) => p.loai_san_pham_id === selectedCat)

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo" onClick={() => navigate('/trang-chu')}>
          <div className="home-logo-icon">NS</div>
          <div className="home-logo-text">
            <div className="home-logo-title">Nông sản sạch</div>
            <div className="home-logo-sub">Ăn sạch – Sống khỏe</div>
          </div>
        </div>

        <h2 style={{ marginLeft: 40, fontWeight: 600 }}>
          {shop?.ten_don_vi || 'Cửa hàng'}
        </h2>

        <button
          type="button"
          className="home-section-link"
          style={{ marginLeft: 'auto', marginRight: 40 }}
          onClick={() => navigate('/cua-hang')}
        >
          &lt; Quay lại danh sách cửa hàng
        </button>
      </header>

      <main className="home-main">
        <div className="home-container">
          {shop && (
            <div className="shop-info-box">
              <div className="shop-info-left">
                {shop.logo ? (
                  <img
                    src={`${API_ROOT}/uploads/${shop.logo}`}
                    alt={shop.ten_don_vi}
                  />
                ) : (
                  <div className="shop-logo-placeholder shop-logo-lg">
                    {shop.ten_don_vi?.[0] || 'S'}
                  </div>
                )}
                <div>
                  <h2
                    className="home-section-title"
                    style={{ marginBottom: 4 }}
                  >
                    {shop.ten_don_vi}
                  </h2>
                  <p className="home-section-sub" style={{ marginBottom: 4 }}>
                    {shop.mo_ta_shop || 'Nhà phân phối nông sản sạch.'}
                  </p>
                  <p className="shop-info-line">
                    📍 <strong>Địa chỉ:</strong> {shop.dia_chi || 'Đang cập nhật'}
                  </p>
                  <p className="shop-info-line">
                    ☎ <strong>Điện thoại:</strong>{' '}
                    {shop.sdt || 'Đang cập nhật'}
                  </p>
                </div>
              </div>

              <div className="shop-info-right">
                <span>Đem sản phẩm chất lượng đến bà con người tiêu dùng</span>
              </div>
            </div>
          )}

          <div className="shop-layout">
            <aside className="shop-sidebar">
              <h3 className="shop-sidebar-title">Danh mục</h3>

              <button
                className={
                  selectedCat === 'all'
                    ? 'shop-cat-item shop-cat-item-active'
                    : 'shop-cat-item'
                }
                onClick={() => setSelectedCat('all')}
              >
                ▸ Tất cả danh mục
              </button>

              {categories.map((c) => (
                <button
                  key={c.loai_san_pham_id}
                  className={
                    selectedCat === c.loai_san_pham_id
                      ? 'shop-cat-item shop-cat-item-active'
                      : 'shop-cat-item'
                  }
                  onClick={() => setSelectedCat(c.loai_san_pham_id)}
                >
                  ▸ {c.ten_loai}
                </button>
              ))}
            </aside>

            <section className="shop-products">
              {msg && <div className="home-alert">{msg}</div>}
              {loading && <p>Đang tải sản phẩm...</p>}

              <div className="home-product-grid">
                {filteredProducts.map((sp) => (
                  <div
                    key={sp.san_pham_id}
                    className="product-card"
                    onClick={() => navigate(`/san-pham/${sp.san_pham_id}`)}
                  >
                    <div className="product-sale-badge">-10%</div>

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
                      <div className="product-desc">
                        {sp.mo_ta || 'Chưa có mô tả.'}
                      </div>
                      <div className="product-meta">
                        <span className="product-price">
                          {Number(sp.gia || 0).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="product-price-old">
                          {(Number(sp.gia || 0) * 1.1).toLocaleString('vi-VN')} đ
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
                ))}

                {!loading && !msg && filteredProducts.length === 0 && (
                  <p>Shop chưa có sản phẩm nào.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
