import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './User.css'

const API_BASE = 'http://localhost:4000/api'

export default function ThanhToan() {
  const [cart, setCart] = useState([])
  const [tongTien, setTongTien] = useState(0)
  const [phuongThuc, setPhuongThuc] = useState('Tiền mặt')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [donHangId, setDonHangId] = useState(null) // đơn hàng dùng cho PayPal
  const navigate = useNavigate()

  // voucher
  const [maCode, setMaCode] = useState('')
  const [maGiamGiaId, setMaGiamGiaId] = useState(null)
  const [soTienGiam, setSoTienGiam] = useState(0)
  const [tongSauGiam, setTongSauGiam] = useState(0)
  const [voucherMsg, setVoucherMsg] = useState('')
  const [loadingVoucher, setLoadingVoucher] = useState(false)

  // Danh sách voucher gợi ý
  const [voucherList, setVoucherList] = useState([])
  const [loadingVoucherList, setLoadingVoucherList] = useState(false)

  const clearVoucher = () => {
    setMaCode('')
    setMaGiamGiaId(null)
    setSoTienGiam(0)
    setTongSauGiam(tongTien)
    setVoucherMsg('')
  }

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(stored)

    const total = stored.reduce(
      (sum, item) => sum + Number(item.gia || 0) * Number(item.so_luong || 0),
      0
    )
    setTongTien(total)
  }, [])

  useEffect(() => {
    setTongSauGiam(Math.max(0, Number(tongTien) - Number(soTienGiam)))
  }, [tongTien, soTienGiam])

  useEffect(() => {
    const load = async () => {
      if (!tongTien || tongTien <= 0) {
        setVoucherList([])
        return
      }

      try {
        setLoadingVoucherList(true)
        const token = localStorage.getItem('token')

        const res = await fetch(
          `${API_BASE}/ma-giam-gia/available?tong_tien=${encodeURIComponent(tongTien)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )

        const data = await res.json().catch(() => null)
        const list = Array.isArray(data) ? data : data?.list || []
        setVoucherList(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Load voucher list error:', err)
        setVoucherList([])
      } finally {
        setLoadingVoucherList(false)
      }
    }

    load()
  }, [tongTien])
//áp dung voucher
  const handleApplyVoucher = async (codeOverride) => {
    setVoucherMsg('')

    const codeToApply = (codeOverride ?? maCode).trim().toUpperCase()
    if (!codeToApply) {
      setVoucherMsg('Vui lòng nhập mã khuyến mãi.')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setVoucherMsg('Bạn cần đăng nhập để sử dụng mã khuyến mãi.')
      return
    }

    if (!tongTien || tongTien <= 0) {
      setVoucherMsg('Giỏ hàng trống, không thể áp dụng mã.')
      return
    }

    try {
      setLoadingVoucher(true)

      const res = await fetch(`${API_BASE}/ma-giam-gia/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeToApply, tong_tien: tongTien }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'Không áp dụng được mã giảm giá')
      }

      setMaCode(codeToApply)
      setMaGiamGiaId(data.ma_giam_gia_id || null)
      setSoTienGiam(data.so_tien_giam || 0)
      setTongSauGiam(data.tong_sau_giam || tongTien)
      setVoucherMsg(data.message || 'Đã áp dụng mã giảm giá.')
    } catch (err) {
      console.error(err)
      setMaGiamGiaId(null)
      setSoTienGiam(0)
      setTongSauGiam(tongTien)
      setVoucherMsg(err.message || 'Có lỗi khi áp dụng mã giảm giá.')
    } finally {
      setLoadingVoucher(false)
    }
  }

  useEffect(() => {
    if (phuongThuc !== 'PayPal') return
    if (!donHangId) return
    if (typeof window === 'undefined' || !window.paypal) return

    const container = document.getElementById('paypal-button-container')
    if (!container) return
    container.innerHTML = ''

    const token = localStorage.getItem('token')

    window.paypal
      .Buttons({
        createOrder: async () => {
          const res = await fetch(`${API_BASE}/paypal/create-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ don_hang_id: donHangId }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || 'Lỗi tạo đơn PayPal')
          return data.id
        },
        onApprove: async (data) => {
          try {
            const res = await fetch(`${API_BASE}/paypal/capture-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ orderID: data.orderID }),
            })
            const result = await res.json()

            if (!res.ok || result.status !== 'COMPLETED') {
              setMsg('Thanh toán PayPal thất bại, vui lòng thử lại.')
              return
            }

            localStorage.removeItem('cart')
            navigate(`/dat-hang-thanh-cong/${donHangId}`, {
              state: { tongTien: tongSauGiam || tongTien, phuongThuc: 'PayPal' },
            })
          } catch (err) {
            console.error(err)
            setMsg('Có lỗi khi xác nhận thanh toán PayPal.')
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err)
          setMsg('Có lỗi khi thanh toán PayPal.')
        },
      })
      .render('#paypal-button-container')
  }, [phuongThuc, donHangId, tongTien, tongSauGiam, navigate])

  const datHang = async () => {
    setMsg('')
    if (!cart.length) return setMsg('Giỏ hàng đang trống, hãy chọn sản phẩm trước khi đặt.')

    const token = localStorage.getItem('token')
    if (!token) return setMsg('Bạn cần đăng nhập trước khi đặt hàng.')

    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/don-hang`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tong_tien: tongSauGiam || tongTien,
          tong_tien_goc: tongTien,
          ma_giam_gia_id: maGiamGiaId,
          ma_giam_gia_code: maCode.trim().toUpperCase() || null,
          so_tien_giam: soTienGiam,
          phuong_thuc_thanh_toan: phuongThuc,
          items: cart.map((item) => ({
            san_pham_id: item.san_pham_id,
            so_luong: item.so_luong,
            gia: item.gia,
            nha_phan_phoi_id: item.nha_phan_phoi_id || null,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Đặt hàng thất bại')

      if (phuongThuc === 'PayPal') {
        setDonHangId(data.don_hang_id)
        setMsg('Đơn hàng đã tạo, vui lòng thanh toán qua PayPal bên dưới.')
      } else {
        localStorage.removeItem('cart')
        navigate(`/dat-hang-thanh-cong/${data.don_hang_id}`, {
          state: { tongTien: tongSauGiam || tongTien, phuongThuc },
        })
      }
    } catch (err) {
      console.error(err)
      setMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-wrapper">
        <h2 className="checkout-title">Thanh toán</h2>
        <p className="checkout-subtitle">Kiểm tra đơn hàng và chọn phương thức thanh toán phù hợp.</p>

        {msg && (
          <div
            className={
              msg.toLowerCase().includes('thành công')
                ? 'checkout-msg checkout-msg-success'
                : 'checkout-msg checkout-msg-error'
            }
          >
            {msg}
          </div>
        )}

        <div className="checkout2-grid">
          <div className="checkout2-left">
            <div className="checkout2-card">
              <h3 className="checkout2-card-title">Thông tin người nhận</h3>
              <div className="checkout2-row2">
                <div className="checkout2-field">
                  <label>Họ và Tên</label>
                  <input placeholder="Nhập họ tên" />
                </div>
                <div className="checkout2-field">
                  <label>Email</label>
                  <input placeholder="Nhập email" />
                </div>
              </div>
              <div className="checkout2-row2">
                <div className="checkout2-field">
                  <label>Số điện thoại</label>
                  <input placeholder="Nhập số điện thoại" />
                </div>
              </div>

              <h3 className="checkout2-card-title" style={{ marginTop: 14 }}>
                Địa chỉ giao hàng
              </h3>
              <div className="checkout2-field">
                <label>Địa chỉ</label>
                <input placeholder="Số nhà, tên đường..." />
              </div>
              <div className="checkout2-row2">
                <div className="checkout2-field">
                  <label>Quận/Huyện</label>
                  <input placeholder="Quận/Huyện" />
                </div>
                <div className="checkout2-field">
                  <label>Tỉnh/Thành phố</label>
                  <input placeholder="Tỉnh/Thành phố" />
                </div>
              </div>
              <div className="checkout2-field">
                <label>Ghi chú</label>
                <textarea rows={3} placeholder="Ghi chú cho shop (nếu có)..." />
              </div>
            </div>

            <div className="checkout2-card">
              <h3 className="checkout2-card-title">Phương thức thanh toán</h3>

              <label className="checkout2-radio">
                <input
                  type="radio"
                  checked={phuongThuc === 'Tiền mặt'}
                  onChange={() => {
                    setPhuongThuc('Tiền mặt')
                    setDonHangId(null)
                  }}
                />
                <span>Thanh toán khi nhận hàng</span>
              </label>

              <label className="checkout2-radio">
                <input
                  type="radio"
                  checked={phuongThuc === 'PayPal'}
                  onChange={() => {
                    setPhuongThuc('PayPal')
                    setDonHangId(null)
                  }}
                />
                <span>Thanh toán điện tử (PayPal)</span>
              </label>
            </div>

            {phuongThuc === 'PayPal' && (
              <div className="checkout2-card">
                <h3 className="checkout2-card-title">Thanh toán PayPal</h3>
                {donHangId ? (
                  <div id="paypal-button-container" />
                ) : (
                  <p className="checkout2-hint">
                    Bấm “Đặt hàng” để tạo đơn, sau đó nút PayPal sẽ hiển thị tại đây.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="checkout2-right">
            <div className="checkout2-summary">
              <div className="checkout2-summaryTitle">Đơn hàng của bạn</div>

              <div className="checkout2-summaryItems">
                {cart.length === 0 ? (
                  <div className="checkout2-empty">Chưa có sản phẩm trong giỏ.</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.san_pham_id} className="checkout2-item">
                      <div className="checkout2-itemInfo">
                        <div className="checkout2-itemName">{item.ten_san_pham}</div>
                        <div className="checkout2-itemQty">Số lượng: {item.so_luong}</div>
                      </div>
                      <div className="checkout2-itemPrice">
                        {(item.gia * item.so_luong).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="checkout2-voucher">
                <input
                  type="text"
                  value={maCode}
                  onChange={(e) => setMaCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá"
                />
                <button type="button" onClick={() => handleApplyVoucher()} disabled={loadingVoucher}>
                  {loadingVoucher ? '...' : 'Áp dụng'}
                </button>

                {maGiamGiaId && (
                  <button
                    type="button"
                    className="checkout2-voucherClearBtn"
                    onClick={clearVoucher}
                    disabled={loadingVoucher}
                    title="Bỏ mã giảm giá"
                  >
                    Bỏ mã
                  </button>
                )}
              </div>

              {voucherMsg && <div className="checkout2-voucherMsg">{voucherMsg}</div>}

              <div className="checkout2-voucherSuggest">
                <div className="checkout2-voucherSuggestTitle">
                  Mã giảm giá gợi ý{loadingVoucherList ? ' (đang tải...)' : ''}
                </div>

                {!loadingVoucherList && (!voucherList || voucherList.length === 0) && (
                  <div className="checkout2-voucherEmpty">
                    Không có mã phù hợp (hoặc mã hết hạn / chưa đủ điều kiện đơn tối thiểu).
                  </div>
                )}

                {voucherList?.length > 0 &&
                  voucherList.map((v) => {
                    const percentText =
                      v.loai === 'PERCENT'
                        ? `Giảm ${Number(v.gia_tri)}%${
                            v.gia_tri_toi_da
                              ? ` (tối đa ${Number(v.gia_tri_toi_da).toLocaleString('vi-VN')}đ)`
                              : ''
                          }`
                        : `Giảm ${Number(v.gia_tri).toLocaleString('vi-VN')}đ`

                    const minText =
                      Number(v.don_toi_thieu || 0) > 0
                        ? ` • Đơn tối thiểu ${Number(v.don_toi_thieu).toLocaleString('vi-VN')}đ`
                        : ''

                    const estText =
                      Number(v.so_tien_giam_du_kien || 0) > 0
                        ? ` • Dự kiến giảm ${Number(v.so_tien_giam_du_kien).toLocaleString('vi-VN')}đ`
                        : ''

                    return (
                      <div key={v.ma_giam_gia_id} className="checkout2-voucherItem">
                        <div className="checkout2-voucherItemLeft">
                          <div className="checkout2-voucherCode">{v.ma_code}</div>
                          <div className="checkout2-voucherName">{v.ten_chuong_trinh}</div>
                          <div className="checkout2-voucherMeta">
                            {percentText}
                            {minText}
                            {estText}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="checkout2-voucherUseBtn"
                          onClick={() => handleApplyVoucher(v.ma_code)}
                          disabled={loadingVoucher}
                        >
                          Dùng
                        </button>
                      </div>
                    )
                  })}
              </div>

              <div className="checkout2-line" />

              <div className="checkout2-row">
                <span>Tạm tính</span>
                <b>{tongTien.toLocaleString('vi-VN')} đ</b>
              </div>

              <div className="checkout2-row">
                <span>Phí vận chuyển</span>
                <b>Miễn phí</b>
              </div>

              {soTienGiam > 0 && (
                <div className="checkout2-row checkout2-discount">
                  <span>Giảm giá</span>
                  <b>-{soTienGiam.toLocaleString('vi-VN')} đ</b>
                </div>
              )}

              <div className="checkout2-line" />

              <div className="checkout2-row checkout2-total">
                <span>Tổng cộng</span>
                <b>{tongSauGiam.toLocaleString('vi-VN')} đ</b>
              </div>

              <button className="checkout2-orderBtn" onClick={datHang} disabled={loading}>
                {phuongThuc === 'PayPal'
                  ? loading
                    ? 'Đang tạo đơn PayPal...'
                    : 'Đặt hàng (tạo đơn PayPal)'
                  : loading
                  ? 'Đang xử lý...'
                  : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
