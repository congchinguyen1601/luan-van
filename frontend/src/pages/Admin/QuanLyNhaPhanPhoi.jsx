import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'   
import AdminLayout from './AdminLayout'

export default function QuanLyNhaPhanPhoi() {
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setMsg('')
      const res = await api.get('/nha-phan-phoi/admin', {
        params: filter ? { trang_thai_dang_ky: filter } : {},
      })
      setList(res.data.list || [])
    } catch (err) {
      console.error('Lỗi load NPP admin:', err)
      setMsg(
        err.response?.data?.message || 'Lỗi khi tải danh sách Nhà phân phối'
      )
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  loadData()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [filter])


  const handleDuyet = async (id) => {
    if (!window.confirm('Xác nhận duyệt Nhà phân phối này?')) return
    try {
      setMsg('')
      await api.patch(`/nha-phan-phoi/admin/${id}/duyet`)
      setMsg('Đã duyệt Nhà phân phối')
      loadData()
    } catch (err) {
      console.error('Lỗi duyệt NPP:', err)
      setMsg(err.response?.data?.message || 'Lỗi khi duyệt Nhà phân phối')
    }
  }

  const handleTuChoi = async (id) => {
    const lyDo = window.prompt('Nhập lý do từ chối (có thể bỏ trống):', '')
    if (lyDo === null) return
    try {
      setMsg('')
      await api.patch(`/nha-phan-phoi/admin/${id}/tu-choi`, {
        ly_do_tu_choi: lyDo,
      })
      setMsg('Đã từ chối yêu cầu Nhà phân phối')
      loadData()
    } catch (err) {
      console.error('Lỗi từ chối NPP:', err)
      setMsg(err.response?.data?.message || 'Lỗi khi từ chối Nhà phân phối')
    }
  }

  const renderTrangThaiDK = (s) => {
    if (s === 'CHO_DUYET') return 'Chờ duyệt'
    if (s === 'DA_DUYET') return 'Đã duyệt'
    if (s === 'TU_CHOI') return 'Từ chối'
    return s || ''
  }

  return (
  <AdminLayout title="Quản lý Nhà phân phối">
    <div className="admin-bg-main">
      <div className="admin-card-lg">
        <p className="admin-subtext-muted">
          Xem danh sách Nhà phân phối và duyệt yêu cầu đăng ký.
        </p>

        {msg && (
          <div className="admin-alert admin-alert-error">
            {msg}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <span className="admin-subtext-muted" style={{ marginRight: 8 }}>
            Lọc theo trạng thái đăng ký:
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cfd8dc' }}
          >
            <option value="">Tất cả</option>
            <option value="CHO_DUYET">Chờ duyệt</option>
            <option value="DA_DUYET">Đã duyệt</option>
            <option value="TU_CHOI">Từ chối</option>
          </select>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr className="admin-thead-row">
                  <th className="admin-th">ID</th>
                  <th className="admin-th">Tên đơn vị</th>
                  <th className="admin-th">Người đại diện</th>
                  <th className="admin-th">SĐT</th>
                  <th className="admin-th">Email công ty</th>
                  <th className="admin-th">Địa chỉ</th>
                  <th className="admin-th">Trạng thái đăng ký</th>
                  <th className="admin-th">Tài khoản</th>
                  <th className="admin-th" style={{ textAlign: 'center' }}>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={9} className="admin-table-empty">
                      Không có Nhà phân phối nào.
                    </td>
                  </tr>
                )}

                {list.map((npp) => (
                  <tr key={npp.nha_phan_phoi_id}>
                    <td className="admin-td">{npp.nha_phan_phoi_id}</td>
                    <td className="admin-td">{npp.ten_don_vi}</td>
                    <td className="admin-td">{npp.nguoi_dai_dien}</td>
                    <td className="admin-td">{npp.sdt}</td>
                    <td className="admin-td">{npp.email_cong_ty}</td>
                    <td className="admin-td">{npp.dia_chi}</td>
                    <td className="admin-td">
                      {renderTrangThaiDK(npp.trang_thai_dang_ky)}
                    </td>
                    <td className="admin-td">
                      {npp.ho_ten}
                      <br />
                      <small>{npp.email_tai_khoan}</small>
                    </td>
                    <td className="admin-td admin-td-center admin-td-nowrap">
                      {npp.trang_thai_dang_ky === 'CHO_DUYET' && (
                        <>
                          <button
                            className="admin-btn-small admin-btn-small-primary"
                            onClick={() => handleDuyet(npp.nha_phan_phoi_id)}
                          >
                            Duyệt
                          </button>
                          <button
                            className="admin-btn-small admin-btn-small-danger"
                            onClick={() => handleTuChoi(npp.nha_phan_phoi_id)}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  )
}
