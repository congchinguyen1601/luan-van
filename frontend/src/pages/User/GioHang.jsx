import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './User.css'

const API_ROOT = 'http://localhost:4000'

export default function GioHang() {
  const [cart, setCart] = useState([])
  const [tongTien, setTongTien] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(stored)
  }, [])

  useEffect(() => {
    const total = cart.reduce(
      (sum, item) => sum + Number(item.gia || 0) * Number(item.so_luong || 0),
      0
    )
    setTongTien(total)
  }, [cart])

  const changeQty = (id, delta) => {
    setCart((prev) => {
      const next = prev
        .map((item) =>
          item.san_pham_id === id
            ? { ...item, so_luong: Math.max(1, Number(item.so_luong || 0) + delta) }
            : item
        )
        .filter((i) => i.so_luong > 0)
      localStorage.setItem('cart', JSON.stringify(next))
      return next
    })
  }

  const removeItem = (id) => {
    const next = cart.filter((i) => i.san_pham_id !== id)
    setCart(next)
    localStorage.setItem('cart', JSON.stringify(next))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('cart')
  }

  const goCheckout = () => {
    if (!cart.length) return
    navigate('/thanh-toan')
  }

  const goContinue = () => {
    navigate('/')
  }

  const getImg = (item) => {
    const img = item?.hinh_anh || item?.image || ''
    if (!img) return ''
    if (String(img).startsWith('http')) return img
    return `${API_ROOT}/uploads/${img}`
  }

  const phiVanChuyen = 0
  const tongCong = tongTien + phiVanChuyen

  return (
    <div className="cart-page">
      <div className="cart-wrapper">
        <h2 className="cart-title">Giỏ hàng của bạn</h2>

        {cart.length === 0 && (
          <p className="cart-empty">
            Giỏ hàng đang trống. Hãy quay lại trang chủ để thêm sản phẩm.
          </p>
        )}

        {cart.length > 0 && (
          <div className="cart2-layout">
            <div className="cart2-left">
              {cart.map((item) => (
                <div key={item.san_pham_id} className="cart2-item">
                  <div className="cart2-imgWrap">
                    {getImg(item) ? (
                      <img className="cart2-img" src={getImg(item)} alt={item.ten_san_pham} />
                    ) : (
                      <div className="cart2-imgFallback" />
                    )}
                  </div>

                  <div className="cart2-info">
                    <div className="cart2-name">{item.ten_san_pham}</div>
                    <div className="cart2-price">
                      {Number(item.gia || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div className="cart2-actions">
                    <div className="cart2-qty">
                      <button
                        type="button"
                        className="cart2-qtyBtn"
                        onClick={() => changeQty(item.san_pham_id, -1)}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>

                      <div className="cart2-qtyVal">{item.so_luong}</div>

                      <button
                        type="button"
                        className="cart2-qtyBtn"
                        onClick={() => changeQty(item.san_pham_id, 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart2-trash"
                      onClick={() => removeItem(item.san_pham_id)}
                      title="Xóa sản phẩm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}

              <div className="cart2-bottomActions">
                <button type="button" className="cart-clear-btn" onClick={clearCart}>
                  Xóa giỏ hàng
                </button>
              </div>
            </div>

            <div className="cart2-right">
              <div className="cart2-summary">
                <div className="cart2-summaryTitle">Tổng giỏ hàng</div>

                <div className="cart2-row">
                  <span>Tạm tính</span>
                  <b>{tongTien.toLocaleString('vi-VN')} đ</b>
                </div>

                <div className="cart2-row">
                  <span>Phí vận chuyển</span>
                  <b>{phiVanChuyen === 0 ? 'Miễn phí' : phiVanChuyen.toLocaleString('vi-VN') + ' đ'}</b>
                </div>

                <div className="cart2-divider" />

                <div className="cart2-row cart2-total">
                  <span>Tổng cộng</span>
                  <b>{tongCong.toLocaleString('vi-VN')} đ</b>
                </div>

                <button type="button" className="cart-checkout-btn cart2-payBtn" onClick={goCheckout}>
                  Thanh toán ngay
                </button>

                <button type="button" className="cart2-continue" onClick={goContinue}>
                  ← Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
