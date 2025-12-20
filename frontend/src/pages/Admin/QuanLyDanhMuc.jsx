import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'
import AdminLayout from './AdminLayout'

export default function QuanLyDanhMuc() {
  const [list, setList] = useState([])
  const [form, setForm] = useState({
    loai_san_pham_id: null,
    ten_loai: '',
    mo_ta: '',
    trang_thai: 1,
  })
  const [msg, setMsg] = useState('')

  const token = localStorage.getItem('token')

  const loadData = async () => {
    try {
      const res = await api.get('/danh-muc', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setList(res.data || [])
    } catch (err) {
      console.error(err)
      setMsg('Lỗi khi tải danh mục')
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'trang_thai' ? Number(value) : value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!form.loai_san_pham_id) {
        setMsg('Hãy chọn một danh mục bên dưới để chỉnh sửa.')
        return
      }
      if (!form.ten_loai.trim()) {
        setMsg('Tên loại sản phẩm là bắt buộc')
        return
      }

      // CHỈ cập nhật, KHÔNG tạo mới
      await api.put(`/danh-muc/${form.loai_san_pham_id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Cập nhật danh mục thành công')

      setForm({
        loai_san_pham_id: null,
        ten_loai: '',
        mo_ta: '',
        trang_thai: 1,
      })
      loadData()
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Lỗi khi lưu danh mục')
    }
  }

  const onEdit = (item) => {
    setForm({
      loai_san_pham_id: item.loai_san_pham_id,
      ten_loai: item.ten_loai || '',
      mo_ta: item.mo_ta || '',
      trang_thai: Number(item.trang_thai) === 1 ? 1 : 0,
    })
    setMsg('')
  }

  const onDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return
    try {
      await api.delete(`/danh-muc/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Xóa danh mục thành công')
      loadData()
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Lỗi xóa danh mục')
    }
  }

  const approveCategory = async (id) => {
    if (!window.confirm('Duyệt danh mục này?')) return
    try {
      await api.patch(`/danh-muc/${id}/duyet`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Đã duyệt danh mục thành công')
      loadData()
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Lỗi duyệt danh mục')
    }
  }

  const unapproveCategory = async (id) => {
    if (!window.confirm('Tạm tắt / chuyển về CHỜ DUYỆT?')) return
    try {
      await api.patch(`/danh-muc/${id}/huy-duyet`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Đã chuyển danh mục về trạng thái CHỜ DUYỆT')
      loadData()
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Lỗi tạm tắt danh mục')
    }
  }

  const renderTrangThai = (value) =>
    Number(value) === 1 ? 'Đang dùng' : 'Chờ duyệt / Tắt'

  const isSuccess = msg && msg.toLowerCase().includes('thành công')

  const isEditing = !!form.loai_san_pham_id

  return (
    <AdminLayout title="Quản lý danh mục sản phẩm">
    <div className="admin-bg-wide">
      <div className="admin-card-md">
        <p className="admin-subtext">
          Admin chỉ chỉnh sửa, duyệt hoặc tắt các danh mục do Nhà phân phối đề xuất.
        </p>

        {msg && (
          <div
            className={
              'admin-alert ' +
              (isSuccess ? 'admin-alert-success' : 'admin-alert-error')
            }
          >
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="admin-form">
          <div className="admin-form-group">
            <label className="admin-label">
              Tên danh mục{' '}
              {!isEditing && (
                <span style={{ fontWeight: 400, fontSize: 12 }}>
                  (chọn 1 danh mục bên dưới để sửa)
                </span>
              )}
            </label>
            <input
              type="text"
              name="ten_loai"
              value={form.ten_loai}
              onChange={onChange}
              className="admin-input"
              placeholder={
                isEditing
                  ? ''
                  : 'Chọn danh mục ở bảng bên dưới, sau đó sửa tên tại đây'
              }
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Mô tả</label>
            <textarea
              name="mo_ta"
              value={form.mo_ta}
              onChange={onChange}
              rows={3}
              className="admin-textarea"
            />
          </div>

          <div className="admin-form-group" style={{ maxWidth: 260 }}>
            <label className="admin-label">Trạng thái</label>
            <select
              name="trang_thai"
              value={form.trang_thai}
              onChange={onChange}
              className="admin-select"
            >
              <option value={1}>Đang dùng</option>
              <option value={0}>Chờ duyệt / Tắt</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={!isEditing}
              style={{
                opacity: !isEditing ? 0.7 : 1,
                cursor: !isEditing ? 'default' : 'pointer',
              }}
            >
              {isEditing ? 'Lưu thay đổi' : 'Chọn danh mục bên dưới để sửa'}
            </button>

            {isEditing && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() =>
                  setForm({
                    loai_san_pham_id: null,
                    ten_loai: '',
                    mo_ta: '',
                    trang_thai: 1,
                  })
                }
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>

        {/* BẢNG DANH MỤC */}
        <table className="admin-table admin-table-sm">
          <thead>
            <tr className="admin-thead-row-light">
              <th className="admin-th-sm">ID</th>
              <th className="admin-th-sm">Tên danh mục</th>
              <th className="admin-th-sm">Mô tả</th>
              <th className="admin-th-sm">Trạng thái</th>
              <th className="admin-th-sm">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}

            {list.map((item) => {
              const tt = Number(item.trang_thai)
              return (
                <tr key={item.loai_san_pham_id}>
                  <td className="admin-td-sm">{item.loai_san_pham_id}</td>
                  <td className="admin-td-sm">{item.ten_loai}</td>
                  <td className="admin-td-sm">{item.mo_ta}</td>
                  <td className="admin-td-sm">{renderTrangThai(tt)}</td>
                  <td className="admin-td-sm">
                    <button
                      onClick={() => onEdit(item)}
                      className="admin-btn-small admin-btn-small-neutral"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(item.loai_san_pham_id)}
                      className="admin-btn-small admin-btn-small-danger"
                    >
                      Xóa
                    </button>

                    {tt !== 1 && (
                      <button
                        onClick={() => approveCategory(item.loai_san_pham_id)}
                        className="admin-btn-small admin-btn-small-primary"
                      >
                        Duyệt
                      </button>
                    )}

                    {tt === 1 && (
                      <button
                        onClick={() => unapproveCategory(item.loai_san_pham_id)}
                        className="admin-btn-small admin-btn-small-warning"
                      >
                        Tạm tắt
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    </AdminLayout>
  )
}
