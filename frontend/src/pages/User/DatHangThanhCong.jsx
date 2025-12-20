import { useLocation, useNavigate, useParams } from 'react-router-dom'
import './User.css'

export default function DatHangThanhCong() {
  const { id } = useParams() // don_hang_id
  const navigate = useNavigate()
  const location = useLocation()
  const { tongTien, phuongThuc } = location.state || {}

  return (
    <div className="checkout-page">
      <div className="checkout-wrapper">
        <h2 className="checkout-title">Đặt hàng thành công </h2>
        <p className="checkout-subtitle">
          Cảm ơn bạn đã mua hàng tại Nông sản sạch.
        </p>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            lineHeight: 1.6,
          }}
        >
          <p>
            <strong>Mã đơn hàng:</strong> {id}
          </p>
          {tongTien != null && (
            <p>
              <strong>Tổng tiền:</strong>{' '}
              {Number(tongTien).toLocaleString('vi-VN')} đ
            </p>
          )}
          {phuongThuc && (
            <p>
              <strong>Phương thức thanh toán:</strong> {phuongThuc}
            </p>
          )}
          <p>
            Bạn có thể theo dõi tình trạng xử lý đơn trong mục{' '}
            <strong>Lịch sử đơn hàng</strong>.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 20,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate('/lich-su-don-hang')}
            className="checkout-submit-btn"
          >
            Xem lịch sử đơn hàng
          </button>
          <button
            onClick={() => navigate('/trang-chu')}
            className="cart-clear-btn"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  )
}
