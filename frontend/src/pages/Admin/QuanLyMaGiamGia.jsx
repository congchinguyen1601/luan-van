import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'
import AdminLayout from './AdminLayout'

export default function QuanLyMaGiamGia() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    ma_giam_gia_id: null,
    ma_code: '',
    ten_chuong_trinh: '',
    mo_ta: '',
    loai: 'PERCENT',
    gia_tri: '',
    gia_tri_toi_da: '',
    don_toi_thieu: '',
    so_luong: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    trang_thai: 1,
  })

  const loadData = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setMsg('Bạn cần đăng nhập bằng tài khoản Admin để xem danh sách mã khuyến mãi.')
      setList([])
      return
    }

    try {
      setLoading(true)
      setMsg('')
      const res = await api.get('/ma-giam-gia', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setList(res.data || [])
    } catch (err) {
      console.error('Lỗi load mã giảm giá:', err)
      const serverMsg = err.response?.data?.message
      setMsg(serverMsg || 'Lỗi khi tải danh sách mã khuyến mãi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      ma_giam_gia_id: null,
      ma_code: '',
      ten_chuong_trinh: '',
      mo_ta: '',
      loai: 'PERCENT',
      gia_tri: '',
      gia_tri_toi_da: '',
      don_toi_thieu: '',
      so_luong: '',
      ngay_bat_dau: '',
      ngay_ket_thuc: '',
      trang_thai: 1,
    })
  }

  const toMySqlDatetime = (val) => {
    if (!val) return null
    return val.replace('T', ' ') + ':00'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!form.ma_code || !form.ten_chuong_trinh || !form.loai || !form.gia_tri) {
      setMsg('Vui lòng nhập đầy đủ Mã, Tên chương trình, Loại, Giá trị.')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setMsg('Bạn cần đăng nhập bằng tài khoản Admin trước khi lưu mã khuyến mãi.')
      return
    }

    const body = {
      ma_code: form.ma_code.trim(),
      ten_chuong_trinh: form.ten_chuong_trinh,
      mo_ta: form.mo_ta || null,
      loai: form.loai,
      gia_tri: Number(form.gia_tri),
      gia_tri_toi_da: form.gia_tri_toi_da ? Number(form.gia_tri_toi_da) : null,
      don_toi_thieu: form.don_toi_thieu ? Number(form.don_toi_thieu) : 0,
      so_luong: form.so_luong ? Number(form.so_luong) : 0,
      ngay_bat_dau: toMySqlDatetime(form.ngay_bat_dau),
      ngay_ket_thuc: toMySqlDatetime(form.ngay_ket_thuc),
      trang_thai: Number(form.trang_thai),
    }

    try {
      setLoading(true)
      let res
      if (form.ma_giam_gia_id) {
        res = await api.put(`/ma-giam-gia/${form.ma_giam_gia_id}`, body, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setMsg('Cập nhật mã khuyến mãi thành công')
      } else {
        res = await api.post('/ma-giam-gia', body, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setMsg('Thêm mã khuyến mãi thành công')
      }

      await loadData()
      setForm((prev) => ({
        ...prev,
        ma_giam_gia_id: res.data.ma_giam_gia_id || prev.ma_giam_gia_id,
      }))
    } catch (err) {
      console.error(err)
      setMsg(
        err.response?.data?.message ||
          'Có lỗi khi lưu mã khuyến mãi (có thể trùng mã code)'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setMsg('')
    const toInputDatetime = (val) => {
      if (!val) return ''
      let s = String(val).replace('Z', '').trim()
      s = s.replace('T', ' ')
      const [d, t] = s.split(' ')
      const [h, m] = (t || '00:00:00').split(':')
      return `${d}T${h}:${m}`
    }

    setForm({
      ma_giam_gia_id: item.ma_giam_gia_id,
      ma_code: item.ma_code,
      ten_chuong_trinh: item.ten_chuong_trinh,
      mo_ta: item.mo_ta || '',
      loai: item.loai,
      gia_tri: item.gia_tri,
      gia_tri_toi_da: item.gia_tri_toi_da || '',
      don_toi_thieu: item.don_toi_thieu || '',
      so_luong: item.so_luong || '',
      ngay_bat_dau: toInputDatetime(item.ngay_bat_dau),
      ngay_ket_thuc: toInputDatetime(item.ngay_ket_thuc),
      trang_thai: item.trang_thai,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa mã "${item.ma_code}"?`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setMsg('Bạn cần đăng nhập bằng tài khoản Admin trước khi xóa mã khuyến mãi.')
      return
    }

    try {
      setLoading(true)
      await api.delete(`/ma-giam-gia/${item.ma_giam_gia_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Đã vô hiệu hóa mã khuyến mãi')
      await loadData()
      if (form.ma_giam_gia_id === item.ma_giam_gia_id) {
        resetForm()
      }
    } catch (err) {
      console.error(err)
      setMsg(
        err.response?.data?.message ||
          'Lỗi khi xóa/vô hiệu hóa mã khuyến mãi'
      )
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <AdminLayout title="Quản lý mã khuyến mãi">
    <div className="admin-page">
  
      <p className="admin-subtitle">
        Admin có thể tạo, chỉnh sửa và tắt/bật các mã khuyến mãi. Mỗi mã có số lượng
        sử dụng giới hạn và thời gian hiệu lực cụ thể.
      </p>

      {msg && <div className="admin-msg">{msg}</div>}

      <div className="admin-layout">
        {/* FORM */}
        <div className="admin-card admin-card-form">
          <h3 className="admin-card-title">
            {form.ma_giam_gia_id ? 'Sửa mã khuyến mãi' : 'Thêm mã khuyến mãi mới'}
          </h3>

          <form onSubmit={handleSubmit} className="voucher-form">
            <div className="form-row">
              <label>
                Mã code <span className="required">*</span>
              </label>
              <input
                name="ma_code"
                value={form.ma_code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ma_code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="TET2025"
              />
            </div>

            <div className="form-row">
              <label>
                Tên chương trình <span className="required">*</span>
              </label>
              <input
                name="ten_chuong_trinh"
                value={form.ten_chuong_trinh}
                onChange={handleChange}
                placeholder="Khuyến mãi Tết 2025"
              />
            </div>

            <div className="form-row">
              <label>Mô tả</label>
              <textarea
                name="mo_ta"
                value={form.mo_ta}
                onChange={handleChange}
                rows={3}
                placeholder="Mô tả ngắn về điều kiện, đối tượng áp dụng..."
              />
            </div>

            <div className="form-row two-cols">
              <div>
                <label>
                  Loại giảm giá <span className="required">*</span>
                </label>
                <select
                  name="loai"
                  value={form.loai}
                  onChange={handleChange}
                >
                  <option value="PERCENT">Theo % (gia_tri = %)</option>
                  <option value="FIXED">Theo số tiền cố định</option>
                </select>
              </div>
              <div>
                <label>
                  Giá trị <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="gia_tri"
                  value={form.gia_tri}
                  onChange={handleChange}
                  placeholder="10 (10%) hoặc 50000"
                />
              </div>
            </div>

            <div className="form-row two-cols">
              <div>
                <label>Giảm tối đa (nếu là %)</label>
                <input
                  type="number"
                  name="gia_tri_toi_da"
                  value={form.gia_tri_toi_da}
                  onChange={handleChange}
                  placeholder="50000"
                />
              </div>
              <div>
                <label>Đơn tối thiểu</label>
                <input
                  type="number"
                  name="don_toi_thieu"
                  value={form.don_toi_thieu}
                  onChange={handleChange}
                  placeholder="200000"
                />
              </div>
            </div>

            <div className="form-row two-cols">
              <div>
                <label>Số lượng mã (tổng lượt dùng)</label>
                <input
                  type="number"
                  name="so_luong"
                  value={form.so_luong}
                  onChange={handleChange}
                  placeholder="100"
                />
              </div>
              <div>
                <label>Trạng thái</label>
                <select
                  name="trang_thai"
                  value={form.trang_thai}
                  onChange={handleChange}
                >
                  <option value={1}>Đang kích hoạt</option>
                  <option value={0}>Tạm tắt</option>
                </select>
              </div>
            </div>

            <div className="form-row two-cols">
              <div>
                <label>Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  name="ngay_bat_dau"
                  value={form.ngay_bat_dau}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Ngày kết thúc</label>
                <input
                  type="datetime-local"
                  name="ngay_ket_thuc"
                  value={form.ngay_ket_thuc}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {form.ma_giam_gia_id
                  ? loading
                    ? 'Đang lưu...'
                    : 'Cập nhật'
                  : loading
                  ? 'Đang thêm...'
                  : 'Thêm mới'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        {/* TABLE */}
        <div className="admin-card admin-card-table">
          <h3 className="admin-card-title">Danh sách mã khuyến mãi</h3>

          {loading && <p>Đang tải...</p>}
          {!loading && list.length === 0 && (
            <p>Chưa có mã khuyến mãi nào.</p>
          )}

          {!loading && list.length > 0 && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mã</th>
                    <th>Tên chương trình</th>
                    <th>Loại</th>
                    <th>Giá trị</th>
                    <th>Số lượng / Đã dùng</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.ma_giam_gia_id}>
                      <td>{item.ma_giam_gia_id}</td>
                      <td>
                        <strong>{item.ma_code}</strong>
                      </td>
                      <td>{item.ten_chuong_trinh}</td>
                      <td>{item.loai === 'PERCENT' ? 'Giảm %' : 'Giảm tiền'}</td>
                      <td>
                        {item.loai === 'PERCENT'
                          ? `${item.gia_tri}%` +
                            (item.gia_tri_toi_da
                              ? ` (tối đa ${Number(
                                  item.gia_tri_toi_da
                                ).toLocaleString('vi-VN')} đ)`
                              : '')
                          : `${Number(item.gia_tri).toLocaleString('vi-VN')} đ`}
                      </td>
                      <td>
                        {item.so_luong_da_dung ?? 0} / {item.so_luong}
                      </td>
                      <td>
                        <div>
                          <small>
                            Từ:{' '}
                            {item.ngay_bat_dau
                              ? String(item.ngay_bat_dau)
                              : '—'}
                          </small>
                        </div>
                        <div>
                          <small>
                            Đến:{' '}
                            {item.ngay_ket_thuc
                              ? String(item.ngay_ket_thuc)
                              : '—'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            item.trang_thai
                              ? 'badge badge-success'
                              : 'badge badge-muted'
                          }
                        >
                          {item.trang_thai ? 'Đang bật' : 'Đã tắt'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="btn-outline"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="btn-danger"
                          >
                            Xóa / Tắt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  </AdminLayout>
  )
}
