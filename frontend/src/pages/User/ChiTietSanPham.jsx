import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'
import DanhGiaSanPham from './DanhGiaSanPham'
import TrangFooter from './TrangFooter'

const API_ROOT = 'http://localhost:4000'

export default function ChiTietSanPham() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sp, setSp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [qty, setQty] = useState(1)

  const [selectedImg, setSelectedImg] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        setMsg('')
        const res = await api.get(`/san-pham/${id}/public`)
        setSp(res.data)
        const imgs = res.data?.images || []
        setSelectedImg(imgs[0] || res.data?.hinh_anh || '')
      } catch (err) {
        console.error('Lỗi tải chi tiết sản phẩm:', err)
        setMsg('Không tải được thông tin sản phẩm.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchDetail()
  }, [id])

  // Thêm vào giỏ
  const handleAddToCart = () => {
    if (!sp) return
    const soLuong = Math.max(1, qty || 1)

    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = cart.findIndex((i) => i.san_pham_id === sp.san_pham_id)

    if (idx >= 0) {
      cart[idx].so_luong += soLuong
    } else {
      cart.push({
        san_pham_id: sp.san_pham_id,
        ten_san_pham: sp.ten_san_pham,
        gia: Number(sp.gia),
        so_luong: soLuong,
        hinh_anh: sp.hinh_anh,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Đã thêm vào giỏ hàng!')
  }

  // Mua ngay
  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/gio-hang')
  }

  const formatMoney = (v) =>
    v == null ? '' : Number(v).toLocaleString('vi-VN') + ' đ'

  const changeQty = (delta) => {
    setQty((old) => {
      const next = (old || 1) + delta
      return next < 1 ? 1 : next
    })
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (msg && !sp) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <p>{msg}</p>
          <button
            className="product-detail-back-btn"
            onClick={() => navigate('/')}
          >
            ⬅ Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (!sp) return null

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        

        <div className="product-detail-card">
          <div className="product-detail-img-box">
            {Array.isArray(sp.images) && sp.images.length > 0 ? (
              <div className="pd-gallery">
                <div className="pd-thumbs">
                  {sp.images.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pd-thumb ${
                        selectedImg === file ? 'active' : ''
                      }`}
                      onClick={() => setSelectedImg(file)}
                    >
                      <img src={`${API_ROOT}/uploads/${file}`} alt="" />
                    </button>
                  ))}
                </div>

                <div className="pd-main">
                  {selectedImg ? (
                    <img
                      src={`${API_ROOT}/uploads/${selectedImg}`}
                      alt={sp.ten_san_pham}
                    />
                  ) : (
                    <div className="product-no-img">Không có ảnh</div>
                  )}
                </div>
              </div>
            ) : sp.hinh_anh ? (
              <img
                src={`${API_ROOT}/uploads/${sp.hinh_anh}`}
                alt={sp.ten_san_pham}
              />
            ) : (
              <div className="product-no-img">Không có ảnh</div>
            )}
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-name">{sp.ten_san_pham}</h1>

            <p className="product-detail-price">{formatMoney(sp.gia)}</p>

            <p className="product-detail-desc">
              {sp.mo_ta || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </p>

            <div className="product-detail-meta">
              <div>
                <span className="meta-label">Danh mục: </span>
                <span className="meta-value">{sp.ten_loai || 'Chưa rõ'}</span>
              </div>
                <div>
                <span className="meta-label">Xuất xứ: </span>
                <span className="meta-value">{sp.xuat_xu || 'Chưa rõ'}</span>
              </div>
              <div>
                <span className="meta-label">Số lượng còn: </span>
                <span className="meta-value">{sp.so_luong ?? 'Không rõ'}</span>
              </div>
            </div>

            <div className="product-detail-qty-row">
              <span className="meta-label">Số lượng:</span>
              <div className="qty-control">
                <button onClick={() => changeQty(-1)}>-</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value) || 1))
                  }
                />
                <button onClick={() => changeQty(1)}>+</button>
              </div>
            </div>

            <div className="product-detail-actions">
              <button
                className="product-detail-btn product-detail-btn-primary"
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
              <button
                className="product-detail-btn product-detail-btn-outline"
                onClick={handleAddToCart}
              >
                Thêm vào giỏ
              </button>
            </div>

            {msg && (
              <div className="home-alert" style={{ marginTop: 12 }}>
                {msg}
              </div>
            )}
          </div>
        </div>

        <div className="product-detail-review-wrap">
          <DanhGiaSanPham productId={sp.san_pham_id} />
        </div>
      </div>

      <TrangFooter />
    </div>
  )
}
