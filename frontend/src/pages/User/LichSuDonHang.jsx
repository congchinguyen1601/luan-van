import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

const API_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:4000'

const buildImgUrl = (p) => {
  if (!p) return ''
  const s = String(p)

  if (s.startsWith('http')) return s

  const clean = s.replace(/^\/+/, '') 
  if (clean.startsWith('uploads/')) return `${API_ROOT}/${clean}`

  return `${API_ROOT}/uploads/${clean}`
}

const pickFirstImage = (val) => {
  if (!val) return null
  if (Array.isArray(val)) return val.find(Boolean) || null

  const s = String(val).trim()
  if (!s) return null

  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.find(Boolean) || null
      return parsed?.url || parsed?.path || null
    } catch {
      // ignore
    }
  }

  return s
}

export default function LichSuDonHang() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // đánh giá
  const [showRating, setShowRating] = useState(false)
  const [ratingItem, setRatingItem] = useState(null)
  const [ratingStars, setRatingStars] = useState(5)
  const [ratingTitle, setRatingTitle] = useState('')
  const [ratingContent, setRatingContent] = useState('')
  const [ratingMsg, setRatingMsg] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)

  // trả hàng
  const [returnOrder, setReturnOrder] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [returnMsg, setReturnMsg] = useState('')

  // chi tiết
  const [openDetails, setOpenDetails] = useState({})
  const toggleDetail = (donHangId) => {
    setOpenDetails((prev) => ({ ...prev, [donHangId]: !prev[donHangId] }))
  }

  // hủy đơn
  const handleCancelOrder = async (donHangId) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return
    try {
      const res = await api.patch(
        `/don-hang/user/trang-thai/${donHangId}`,
        { action: 'Huy' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const newStatus = res.data?.trang_thai_don_hang || 'Đã hủy'
      setOrders((prev) =>
        prev.map((o) => (o.don_hang_id === donHangId ? { ...o, trang_thai_don_hang: newStatus } : o))
      )
    } catch (err) {
      console.error('Hủy đơn lỗi:', err)
      alert(err.response?.data?.message || 'Không thể hủy đơn, vui lòng thử lại.')
    }
  }

  const handleReturnOrder = (order) => {
    if (!['Đang giao', 'Hoàn thành'].includes(order.trang_thai_don_hang)) {
      alert('Chỉ có thể yêu cầu trả hàng khi đơn đang giao hoặc đã hoàn thành.')
      return
    }
    setReturnOrder(order)
    setReturnReason('')
    setReturnNote('')
    setReturnMsg('')
    setShowReturnModal(true)
  }

  const submitReturnRequest = async (e) => {
    e.preventDefault()
    if (!returnOrder) return

    if (!token) {
      setReturnMsg('Bạn cần đăng nhập để yêu cầu trả hàng.')
      return
    }
    if (!returnReason.trim()) {
      setReturnMsg('Vui lòng chọn lý do trả hàng.')
      return
    }

    try {
      setReturnSubmitting(true)
      setReturnMsg('')

      const itemsPayload = (returnOrder.items || []).map((it) => ({
        chi_tiet_don_hang_id: it.chi_tiet_don_hang_id,
        san_pham_id: it.san_pham_id,
        so_luong_tra: it.so_luong,
      }))

      const res = await api.post('/don-hang/user/yeu-cau-tra-hang', {
        don_hang_id: returnOrder.don_hang_id,
        ly_do: returnReason,
        ghi_chu: returnNote || null,
        items: itemsPayload,
      })

      setReturnMsg(res.data?.message || 'Đã gửi yêu cầu trả hàng.')

      setOrders((prev) =>
        prev.map((o) =>
          o.don_hang_id === returnOrder.don_hang_id ? { ...o, trang_thai_don_hang: 'Yêu cầu trả hàng' } : o
        )
      )

      setTimeout(() => {
        setShowReturnModal(false)
        setReturnOrder(null)
      }, 800)
    } catch (err) {
      console.error('Lỗi gửi yêu cầu trả hàng:', err)
      setReturnMsg(err.response?.data?.message || 'Không gửi được yêu cầu trả hàng, vui lòng thử lại.')
    } finally {
      setReturnSubmitting(false)
    }
  }

  const openRating = (order, item) => {
    if (order.trang_thai_don_hang !== 'Hoàn thành') {
      alert('Chỉ đánh giá được khi đơn hàng đã Hoàn thành.')
      return
    }
    setRatingItem({
      don_hang_id: order.don_hang_id,
      chi_tiet_don_hang_id: item.chi_tiet_don_hang_id,
      san_pham_id: item.san_pham_id,
      ten_san_pham: item.ten_san_pham,
    })
    setRatingStars(5)
    setRatingTitle('')
    setRatingContent('')
    setRatingMsg('')
    setShowRating(true)
  }

  const closeRating = () => {
    if (ratingLoading) return
    setShowRating(false)
  }

  const submitRating = async (e) => {
    e.preventDefault()
    if (!ratingItem) return

    if (!token) {
      setRatingMsg('Bạn cần đăng nhập để đánh giá sản phẩm.')
      return
    }
    if (!ratingStars || ratingStars < 1 || ratingStars > 5) {
      setRatingMsg('Số sao phải từ 1 đến 5.')
      return
    }

    try {
      setRatingLoading(true)
      setRatingMsg('')

      await api.post(
        '/danh-gia',
        {
          san_pham_id: ratingItem.san_pham_id,
          chi_tiet_don_hang_id: ratingItem.chi_tiet_don_hang_id,
          so_sao: ratingStars,
          tieu_de: ratingTitle,
          noi_dung: ratingContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setRatingMsg('Đã gửi đánh giá, cảm ơn bạn!')
      setTimeout(() => setShowRating(false), 800)
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err)
      setRatingMsg(err.response?.data?.message || 'Không gửi được đánh giá. Có thể bạn đã đánh giá sản phẩm này rồi.')
    } finally {
      setRatingLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setMsg('Bạn cần đăng nhập để xem lịch sử đơn hàng.')
        return
      }

      try {
        setLoading(true)
        setMsg('')

        const res = await api.get('/don-hang/user', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const rows = res.data?.orders || []
        console.log('ORDER ROW SAMPLE:', rows?.[0]) 

        const map = new Map()

        rows.forEach((r) => {
          if (!map.has(r.don_hang_id)) {
            map.set(r.don_hang_id, {
              don_hang_id: r.don_hang_id,
              ngay_dat: r.ngay_dat,
              tong_tien: r.tong_tien,
              trang_thai_don_hang: r.trang_thai_don_hang,
              phuong_thuc_thanh_toan: r.phuong_thuc_thanh_toan,
              items: [],
            })
          }

          if (r.chi_tiet_don_hang_id) {
            const rawImg =
              r.hinh_anh ??
              r.hinhAnh ??
              r.anh ??
              r.hinh_san_pham ??
              r.sp_hinh_anh ??
              r.hinh_anh_san_pham ??
              r.image ??
              null

            map.get(r.don_hang_id).items.push({
              chi_tiet_don_hang_id: r.chi_tiet_don_hang_id,
              san_pham_id: r.san_pham_id,
              ten_san_pham: r.ten_san_pham,
              hinh_anh: pickFirstImage(rawImg),
              so_luong: r.so_luong,
              don_gia: r.don_gia,
              thanh_tien: r.thanh_tien,
            })
          }
        })

        const arrOrders = Array.from(map.values())
        setOrders(arrOrders)

        // mặc định mở chi tiết đơn đầu
        if (arrOrders.length) {
          setOpenDetails((prev) => ({ ...prev, [arrOrders[0].don_hang_id]: true }))
        }
      } catch (err) {
        console.error('Lỗi load lịch sử đơn hàng:', err)
        setMsg(err.response?.data?.message || 'Không tải được lịch sử đơn hàng.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  return (
    <div className="cart-page">
      <div className="cart-wrapper">
        <h2 className="cart-title">Lịch sử đơn hàng</h2>
        <p className="cart-subtitle">Xem lại các đơn hàng bạn đã đặt trên hệ thống.</p>

        {msg && <div className="home-alert">{msg}</div>}
        {loading && <p>Đang tải...</p>}

        {!loading && !msg && orders.length === 0 && (
          <p className="cart-empty">Bạn chưa có đơn hàng nào. Hãy đặt đơn đầu tiên ngay nhé!</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order.don_hang_id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                padding: 12,
                background: '#fff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong>Mã đơn:</strong> {order.don_hang_id}
                  <br />
                  <strong>Ngày đặt:</strong>{' '}
                  {order.ngay_dat ? new Date(order.ngay_dat).toLocaleString('vi-VN') : ''}
                </div>

                <div style={{ textAlign: 'right', minWidth: 220 }}>
                  <div>
                    <strong>Trạng thái:</strong> {order.trang_thai_don_hang || 'Chờ xác nhận'}
                  </div>
                  <div>
                    <strong>Tổng tiền:</strong> {Number(order.tong_tien || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div>
                    <strong>Thanh toán:</strong> {order.phuong_thuc_thanh_toan}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button type="button" className="cart-clear-btn" onClick={() => toggleDetail(order.don_hang_id)}>
                      {openDetails[order.don_hang_id] ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>

                    {['Chờ xác nhận', 'Đang chuẩn bị'].includes(order.trang_thai_don_hang) && (
                      <button
                        type="button"
                        className="cart-clear-btn"
                        style={{ backgroundColor: '#fff0f0', color: '#d32f2f' }}
                        onClick={() => handleCancelOrder(order.don_hang_id)}
                      >
                        Hủy đơn
                      </button>
                    )}

                    {['Đang giao', 'Hoàn thành'].includes(order.trang_thai_don_hang) && (
                      <button
                        type="button"
                        className="cart-checkout-btn"
                        style={{ backgroundColor: '#fff7e0', color: '#ff9800' }}
                        onClick={() => handleReturnOrder(order)}
                      >
                        Yêu cầu trả hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {openDetails[order.don_hang_id] && order.items.length > 0 && (
                <table className="cart-table">
                  <thead>
                    <tr className="cart-table-header-row">
                      <th style={{ width: 70 }}>Hình</th>
                      <th className="cart-col-name">Sản phẩm</th>
                      <th className="cart-col-qty">SL</th>
                      <th className="cart-col-price">Đơn giá</th>
                      <th className="cart-col-subtotal">Thành tiền</th>
                      <th className="cart-col-actions">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.chi_tiet_don_hang_id} className="cart-row">
                        <td>
                          {it.hinh_anh ? (
                            <img
                              className="order-thumb"
                              src={buildImgUrl(it.hinh_anh)}
                              alt={it.ten_san_pham}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/no-image.png'
                              }}
                            />
                          ) : (
                            <span style={{ color: '#999', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td>{it.ten_san_pham}</td>
                        <td>{it.so_luong}</td>
                        <td>{Number(it.don_gia || 0).toLocaleString('vi-VN')} đ</td>
                        <td>{Number(it.thanh_tien || 0).toLocaleString('vi-VN')} đ</td>
                        <td>
                          {order.trang_thai_don_hang === 'Hoàn thành' && (
                            <button
                              type="button"
                              className="cart-clear-btn"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                              onClick={() => openRating(order, it)}
                            >
                              Đánh giá
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="button" onClick={() => navigate('/trang-chu')} className="cart-clear-btn">
            Quay lại trang chủ
          </button>
        </div>
      </div>

      {showReturnModal && returnOrder && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!returnSubmitting) {
              setShowReturnModal(false)
              setReturnOrder(null)
            }
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Yêu cầu trả hàng – Đơn #{returnOrder.don_hang_id}</h3>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Trạng thái hiện tại: {returnOrder.trang_thai_don_hang}</p>

            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 8,
                marginBottom: 12,
              }}
            >
              {(returnOrder.items || []).map((it) => (
                <div
                  key={it.chi_tiet_don_hang_id}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                >
                  <span>{it.ten_san_pham}</span>
                  <span>
                    SL: {it.so_luong} – {Number(it.thanh_tien || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={submitReturnRequest}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Lý do trả hàng</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                  }}
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Không đúng mô tả">Không đúng mô tả</option>
                  <option value="Hàng lỗi / hư hỏng">Hàng lỗi / hư hỏng</option>
                  <option value="Thiếu hàng">Thiếu hàng</option>
                  <option value="Đổi ý / không còn nhu cầu">Đổi ý / không còn nhu cầu</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Ghi chú thêm (tuỳ chọn)</label>
                <textarea
                  rows={3}
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                  }}
                  placeholder="Mô tả tình trạng hàng hoá, hình ảnh, video..."
                />
              </div>

              {returnMsg && (
                <p style={{ fontSize: 13, color: returnMsg.includes('Đã gửi') ? 'green' : 'red', marginBottom: 8 }}>
                  {returnMsg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="cart-clear-btn"
                  onClick={() => {
                    if (!returnSubmitting) {
                      setShowReturnModal(false)
                      setReturnOrder(null)
                    }
                  }}
                  disabled={returnSubmitting}
                >
                  Đóng
                </button>
                <button type="submit" className="cart-checkout-btn" disabled={returnSubmitting}>
                  {returnSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu trả hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRating && ratingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={closeRating}
        >
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              width: '95%',
              maxWidth: 480,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Đánh giá sản phẩm</h3>
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              <strong>{ratingItem.ten_san_pham}</strong>
            </p>

            <form onSubmit={submitRating}>
              <div style={{ marginBottom: 10 }}>
                <label>
                  Số sao (1–5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={ratingStars}
                    onChange={(e) => setRatingStars(Number(e.target.value) || 1)}
                    style={{ width: 60, marginLeft: 8 }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Tiêu đề</label>
                <input
                  type="text"
                  value={ratingTitle}
                  onChange={(e) => setRatingTitle(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px' }}
                  placeholder="Ví dụ: Sản phẩm rất tốt"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Nội dung</label>
                <textarea
                  value={ratingContent}
                  onChange={(e) => setRatingContent(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '6px 8px' }}
                  placeholder="Chia sẻ cảm nhận của bạn..."
                />
              </div>

              {ratingMsg && (
                <p
                  style={{
                    fontSize: 13,
                    marginTop: 0,
                    marginBottom: 10,
                    color: ratingMsg.includes('Đã gửi') ? '#2e7d32' : '#d32f2f',
                  }}
                >
                  {ratingMsg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="cart-clear-btn" onClick={closeRating} disabled={ratingLoading}>
                  Đóng
                </button>
                <button type="submit" className="cart-checkout-btn" disabled={ratingLoading}>
                  {ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
