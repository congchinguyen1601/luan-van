import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../services/api'
import './User.css'
import TrangFooter from './TrangFooter'

const API_ROOT = 'http://localhost:4000'

const normalize = (str = '') =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function CuaHang() {
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const catFromUrl = searchParams.get('cat') 

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setMsg('')
        if (catFromUrl) {
          const res = await api.get('/san-pham/public')
          const all = res.data || []

          const filtered = all.filter(
            (sp) =>
              normalize(sp.ten_loai_san_pham || sp.ten_loai || '') ===
              normalize(catFromUrl)
          )

          setProducts(filtered)
          setShops([]) 
        } else {
          const res = await api.get('/nha-phan-phoi/public-shops')
          setShops(res.data || [])
          setProducts([]) 
        }
      } catch (err) {
        console.error('Lỗi load dữ liệu cửa hàng / sản phẩm:', err)
        setMsg('Không tải được dữ liệu, vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [catFromUrl])

  return (
    <div className="home-page">
      <main className="supplier-main">
        <div className="home-container">
          {catFromUrl ? (
            <>
              <h2
                className="home-section-title"
                style={{ marginBottom: 8, textTransform: 'uppercase' }}
              >
                {catFromUrl}
              </h2>
              <p className="home-section-sub" style={{ marginBottom: 16 }}>
                Hiển thị tất cả sản phẩm thuộc danh mục này trên sàn.
              </p>

              {msg && <div className="home-alert">{msg}</div>}
              {loading && <p>Đang tải sản phẩm...</p>}

              {!loading && !msg && products.length === 0 && (
                <p>Không tìm thấy sản phẩm nào trong danh mục này.</p>
              )}

              <div className="home-product-grid">
                {products.map((sp) => (
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
                      <div className="product-desc">
                        {sp.mo_ta || 'Chưa có mô tả.'}
                      </div>

                      <div className="product-meta">
                        <span className="product-price">
                          {Number(sp.gia).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="product-price-old">
                          {(Number(sp.gia) * 1.1).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (            <>
              <h2 className="supplier-title">NHÀ CUNG CẤP TIÊU BIỂU</h2>

              {msg && <div className="home-alert">{msg}</div>}
              {loading && <p>Đang tải...</p>}

              {!loading && !msg && shops.length === 0 && <p>Chưa có cửa hàng nào.</p>}

              <div className="supplier-row">
                {shops.map((shop) => (
                  <div
                    key={shop.nha_phan_phoi_id}
                    className="supplier-card"
                    onClick={() => navigate(`/shop/${shop.nha_phan_phoi_id}`)}
                  >
                    <div className="supplier-avatar">
                      {shop.logo ? (
                        <img
                          src={`${API_ROOT}/uploads/${shop.logo}`}
                          alt={shop.ten_don_vi}
                        />
                      ) : (
                        <span className="supplier-avatar-placeholder">
                          {shop.ten_don_vi?.[0] || 'S'}
                        </span>
                      )}
                    </div>

                    <div className="supplier-info">
                      <h3 className="supplier-name">{shop.ten_don_vi}</h3>
                      <p className="supplier-desc">
                        {shop.mo_ta_shop || shop.dia_chi || 'Nhà phân phối nông sản sạch.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <TrangFooter />
    </div>
  )
}
