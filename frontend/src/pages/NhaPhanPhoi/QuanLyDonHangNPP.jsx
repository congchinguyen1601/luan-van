import { useEffect, useState } from 'react'
import api from '../../services/api'
import '../Admin/Admin.css' 
import NppLayout from './NPPLayout'

const mapReturnStatus = (s) => {
  switch (s) {
    case 'Cho_duyet':
      return 'Chờ duyệt'
    case 'Da_duyet':
      return 'Đã duyệt'
    case 'Tu_choi':
      return 'Từ chối'
    default:
      return s || ''
  }
}

export default function QuanLyDonHangNPP() {
  const [orders, setOrders] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // yêu cầu trả hàng
  const [returnRequests, setReturnRequests] = useState([])
  const [loadingReturn, setLoadingReturn] = useState(false)
  const [returnMsg, setReturnMsg] = useState('')

  // modal chi tiết trả hàng
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [processingReturn, setProcessingReturn] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setMsg('')

      const token = localStorage.getItem('token')
      if (!token) {
        setMsg('Chưa đăng nhập')
        return
      }

      const res = await api.get('/don-hang/npp', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setOrders(res.data?.orders || [])
    } catch (err) {
      console.error('Lỗi load đơn hàng (NPP):', err)
      setMsg(err.response?.data?.message || 'Không tải được đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchReturnRequests = async () => {
    try {
      setLoadingReturn(true)
      setReturnMsg('')

      const token = localStorage.getItem('token')
      if (!token) {
        setReturnMsg('Chưa đăng nhập')
        return
      }

      const res = await api.get('/don-hang/npp/yeu-cau-tra-hang', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReturnRequests(res.data?.requests || res.data?.list || res.data || [])
    } catch (err) {
      console.error('Lỗi load yêu cầu trả hàng (NPP):', err)
      setReturnMsg(
        err.response?.data?.message || 'Không tải được danh sách yêu cầu trả hàng'
      )
    } finally {
      setLoadingReturn(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchReturnRequests()
  }, [])

  // Các trạng thái mà NPP có thể set
  const statusOptions = [
    { value: 'Cho_xac_nhan', label: 'Chờ xác nhận' },
    { value: 'Dang_chuan_bi', label: 'Đang chuẩn bị' },
    { value: 'Dang_giao', label: 'Đang giao' },
    { value: 'Hoan_thanh', label: 'Hoàn thành' },
    { value: 'Da_huy', label: 'Đã hủy' },
  ]

  const handleChangeStatus = async (chiTietId, newStatus) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setMsg('Chưa đăng nhập')
      return
    }

    try {
      setLoading(true)
      setMsg('')

      await api.patch(
        `/don-hang/npp/${chiTietId}/trang-thai`,
        { trang_thai_npp: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setMsg('Cập nhật trạng thái đơn hàng thành công')
      await fetchOrders()
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái NPP:', err)
      setMsg(
        err.response?.data?.message || 'Không cập nhật được trạng thái đơn hàng'
      )
    } finally {
      setLoading(false)
    }
  }

  const openReturnModal = (row) => {
    setSelectedReturn(row)
  }

  const closeReturnModal = () => {
    if (processingReturn) return
    setSelectedReturn(null)
  }

  const handleProcessReturn = async (row, action) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setReturnMsg('Chưa đăng nhập')
      return
    }

    const confirmText =
      action === 'Duyet'
        ? 'Xác nhận DUYỆT yêu cầu trả hàng này?'
        : 'Xác nhận TỪ CHỐI yêu cầu trả hàng này?'

    if (!window.confirm(confirmText)) return

    try {
      setProcessingReturn(true)
      setReturnMsg('')

      await api.patch(
        `/don-hang/npp/yeu-cau-tra-hang/${row.yeu_cau_id}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setReturnMsg('Xử lý yêu cầu trả hàng thành công.')
      setSelectedReturn(null)

      await fetchReturnRequests()
      await fetchOrders()
    } catch (err) {
      console.error('Lỗi xử lý yêu cầu trả hàng:', err)
      setReturnMsg(
        err.response?.data?.message || 'Không xử lý được yêu cầu trả hàng.'
      )
    } finally {
      setProcessingReturn(false)
    }
  }

  const isError = msg.toLowerCase().includes('lỗi')
  const isReturnError = returnMsg.toLowerCase().includes('lỗi')

  return (
        <NppLayout title="Đơn hàng của shop">
    
    <div className="admin-bg-main">
      <div className="admin-card-lg">
        {msg && (
          <div
            className={
              isError
                ? 'admin-alert admin-alert-error'
                : 'admin-alert admin-alert-success'
            }
          >
            {msg}
          </div>
        )}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr className="admin-thead-row">
                <th className="admin-th">Mã chi tiết</th>
                <th className="admin-th">Mã đơn</th>
                <th className="admin-th">Sản phẩm</th>
                <th className="admin-th">SL</th>
                <th className="admin-th">Đơn giá</th>
                <th className="admin-th">Thành tiền</th>
                <th className="admin-th">Ngày đặt</th>
                <th className="admin-th">Trạng thái (NPP)</th>
                <th className="admin-th">Trạng thái đơn</th>
                <th className="admin-th">Khách hàng</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="admin-table-empty">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}

              {orders.map((o) => (
                <tr key={o.chi_tiet_don_hang_id}>
                  <td className="admin-td">{o.chi_tiet_don_hang_id}</td>
                  <td className="admin-td">{o.don_hang_id}</td>
                  <td className="admin-td">{o.ten_san_pham}</td>
                  <td className="admin-td">{o.so_luong}</td>
                  <td className="admin-td">
                    {Number(o.don_gia).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="admin-td">
                    {Number(o.thanh_tien).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="admin-td">
                    {o.ngay_dat
                      ? new Date(o.ngay_dat).toLocaleString('vi-VN')
                      : ''}
                  </td>

                  <td className="admin-td">
                    <select
                      value={o.trang_thai_npp || 'Cho_xac_nhan'}
                      onChange={(e) =>
                        handleChangeStatus(
                          o.chi_tiet_don_hang_id,
                          e.target.value
                        )
                      }
                      style={{
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        fontSize: 13,
                      }}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="admin-td">
                    {o.trang_thai_don_hang || 'Chờ xác nhận'}
                  </td>

                  <td className="admin-td">
                    {o.ten_khach} <br />
                    <small>{o.email_khach}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h2 className="admin-title-h1" style={{ marginTop: 32 }}>
          Yêu cầu trả hàng
        </h2>

        {returnMsg && (
          <div
            className={
              isReturnError
                ? 'admin-alert admin-alert-error'
                : 'admin-alert admin-alert-success'
            }
          >
            {returnMsg}
          </div>
        )}

        {loadingReturn ? (
          <p>Đang tải yêu cầu trả hàng...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr className="admin-thead-row">
                <th className="admin-th">Mã YC</th>
                <th className="admin-th">Mã đơn</th>
                <th className="admin-th">Khách hàng</th>
                <th className="admin-th">Lý do chung</th>
                <th className="admin-th">Trạng thái</th>
                <th className="admin-th">Ngày yêu cầu</th>
                <th className="admin-th">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {returnRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    Chưa có yêu cầu trả hàng nào.
                  </td>
                </tr>
              )}

              {returnRequests.map((r) => (
                <tr key={r.yeu_cau_id}>
                  <td className="admin-td">{r.yeu_cau_id}</td>
                  <td className="admin-td">{r.don_hang_id}</td>
                  <td className="admin-td">
                    {r.ten_khach}
                    <br />
                    <small>{r.email}</small>
                  </td>
                  <td className="admin-td">
                    {r.ly_do_chung?.length > 40
                      ? r.ly_do_chung.slice(0, 40) + '...'
                      : r.ly_do_chung}
                  </td>
                  <td className="admin-td">
                    {mapReturnStatus(r.trang_thai_yeu_cau)}
                  </td>
                  <td className="admin-td">
                    {r.ngay_tao
                      ? new Date(r.ngay_tao).toLocaleString('vi-VN')
                      : ''}
                  </td>
                  <td className="admin-td">
                    <button
                      type="button"
                      className="admin-btn-primary"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={() => openReturnModal(r)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedReturn && (
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
          onClick={closeReturnModal}
        >
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 12,
              width: '95%',
              maxWidth: 650,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>
              Chi tiết yêu cầu trả hàng
            </h3>

            <p>
              <strong>Mã yêu cầu:</strong> {selectedReturn.yeu_cau_id}
            </p>
            <p>
              <strong>Đơn hàng:</strong> {selectedReturn.don_hang_id}
            </p>
            <p>
              <strong>Khách hàng:</strong> {selectedReturn.ten_khach}{' '}
              {selectedReturn.email && `(${selectedReturn.email})`}
            </p>
            <p>
              <strong>Lý do chung:</strong> {selectedReturn.ly_do_chung || '—'}
            </p>
            {selectedReturn.ghi_chu_chung && (
              <p>
                <strong>Ghi chú chung:</strong>{' '}
                {selectedReturn.ghi_chu_chung}
              </p>
            )}
            <p>
              <strong>Trạng thái yêu cầu:</strong>{' '}
              {mapReturnStatus(selectedReturn.trang_thai_yeu_cau)}
            </p>
            <p>
              <strong>Ngày yêu cầu:</strong>{' '}
              {selectedReturn.ngay_tao
                ? new Date(selectedReturn.ngay_tao).toLocaleString('vi-VN')
                : ''}
            </p>

            <div style={{ marginTop: 12 }}>
              <strong>Sản phẩm yêu cầu trả:</strong>
              {(!selectedReturn.items || selectedReturn.items.length === 0) && (
                <p>Không có dữ liệu sản phẩm.</p>
              )}

              {selectedReturn.items &&
                selectedReturn.items.map((it) => (
                  <div
                    key={it.yeu_cau_ct_id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 8,
                      display: 'flex',
                      gap: 10,
                    }}
                  >
                    {it.hinh_anh && (
                      <div style={{ width: 80, flexShrink: 0 }}>
                        <img
                          src={`http://localhost:4000/uploads/${it.hinh_anh}`}
                          alt={it.ten_san_pham}
                          style={{
                            maxWidth: '100%',
                            borderRadius: 6,
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: '0 0 4px' }}>
                        <strong>{it.ten_san_pham}</strong>
                      </p>
                      <p style={{ margin: '0 0 2px' }}>
                        <strong>Mã chi tiết:</strong>{' '}
                        {it.chi_tiet_don_hang_id}
                      </p>
                      <p style={{ margin: '0 0 2px' }}>
                        <strong>Số lượng trả:</strong> {it.so_luong_tra}
                      </p>
                      {it.ly_do && (
                        <p style={{ margin: '0 0 2px' }}>
                          <strong>Lý do:</strong> {it.ly_do}
                        </p>
                      )}
                      {it.ghi_chu && (
                        <p style={{ margin: 0 }}>
                          <strong>Ghi chú:</strong> {it.ghi_chu}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={closeReturnModal}
                disabled={processingReturn}
              >
                Đóng
              </button>

              {selectedReturn.trang_thai_yeu_cau === 'Cho_duyet' && (
                <>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() =>
                      handleProcessReturn(selectedReturn, 'Tu_choi')
                    }
                    disabled={processingReturn}
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() =>
                      handleProcessReturn(selectedReturn, 'Duyet')
                    }
                    disabled={processingReturn}
                  >
                    Duyệt hoàn hàng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </NppLayout>
  )
}
