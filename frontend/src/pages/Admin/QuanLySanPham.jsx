import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import './Admin.css'
import AdminLayout from './AdminLayout'

const API_ROOT = 'http://localhost:4000'

export default function QuanLySanPham() {
  const [dsSanPham, setDsSanPham] = useState([])
  const [dsLoai, setDsLoai] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // form trong modal Sửa/Duyệt
  const [form, setForm] = useState({
    san_pham_id: null,
    loai_san_pham_id: '',
    ten_san_pham: '',
    mo_ta: '',
    gia: '',
    so_luong: '',
    trang_thai_admin: 'Cho_duyet',
    hinh_anh: '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  // modal xem chi tiết
  const [detailProduct, setDetailProduct] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const token = localStorage.getItem('token')

  const renderNPPInfo = sp => {
    if (sp.ten_don_vi_npp) return `${sp.ten_don_vi_npp} (ID: ${sp.nha_phan_phoi_id})`
    if (sp.ten_don_vi) return `${sp.ten_don_vi} (ID: ${sp.nha_phan_phoi_id})`
    if (sp.nha_phan_phoi_id) return `NPP #${sp.nha_phan_phoi_id}`
    return '—'
  }

  const renderTrangThaiAdmin = sp => {
    switch (sp.trang_thai_admin) {
      case 'Da_duyet':
        return 'Đã duyệt'
      case 'Tu_choi':
        return 'Từ chối'
      default:
        return 'Chờ duyệt'
    }
  }

  const renderTrangThaiBan = sp =>
    Number(sp.trang_thai) === 1 ? 'Đang bán (do NPP bật)' : 'Đang tắt (do NPP tắt)'

  const loadSanPham = useCallback(async () => {
  try {
    const res = await api.get('/san-pham', {
      headers: { Authorization: `Bearer ${token}` },
    })

    setDsSanPham(res.data || [])
  } catch (err) {
    console.error('Lỗi load sản phẩm admin:', err)
    setMsg('Không tải được danh sách sản phẩm')
  }
}, [token])


  const loadLoai = useCallback(async () => {
    try {
      const res = await api.get('/danh-muc/public')
      setDsLoai(res.data || [])
    } catch (err) {
      console.error('Lỗi load danh mục:', err)
    }
  }, [])

  useEffect(() => {
    loadSanPham()
    loadLoai()
  }, [loadSanPham, loadLoai])

  const getTenLoai = loaiId => {
    if (loaiId == null || loaiId === '') return '-'
    const found = dsLoai.find(
      l => Number(l.loai_san_pham_id) === Number(loaiId)
    )
    return found ? found.ten_loai : loaiId
  }

  const onFileChange = e => {
    const f = e.target.files[0]
    setFile(f || null)
    if (f) setPreview(URL.createObjectURL(f))
    else setPreview('')
  }

  const onChangeForm = e => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'gia' || name === 'so_luong'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }))
  }

  const openEditModal = sp => {
    setForm({
      san_pham_id: sp.san_pham_id,
      loai_san_pham_id: sp.loai_san_pham_id || '',
      ten_san_pham: sp.ten_san_pham || '',
      mo_ta: sp.mo_ta || '',
      gia: Number(sp.gia) || 0,
      so_luong: sp.so_luong || 0,
      trang_thai_admin: sp.trang_thai_admin || 'Cho_duyet',
      hinh_anh: sp.hinh_anh || '',
    })
    setFile(null)
    if (sp.hinh_anh) {
      setPreview(`${API_ROOT}/uploads/${sp.hinh_anh}`)
    } else setPreview('')
    setMsg('')
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setFile(null)
    setPreview('')
    setForm({
      san_pham_id: null,
      loai_san_pham_id: '',
      ten_san_pham: '',
      mo_ta: '',
      gia: '',
      so_luong: '',
      trang_thai_admin: 'Cho_duyet',
      hinh_anh: '',
    })
  }

  const openDetailModal = sp => {
    setDetailProduct(sp)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setDetailProduct(null)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.san_pham_id) return
    if (!form.ten_san_pham.trim()) {
      setMsg('Vui lòng nhập tên sản phẩm')
      return
    }

    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('ten_san_pham', form.ten_san_pham)
      fd.append('loai_san_pham_id', form.loai_san_pham_id || '')
      fd.append('mo_ta', form.mo_ta || '')
      fd.append('gia', form.gia === '' ? 0 : form.gia)
      fd.append('so_luong', form.so_luong === '' ? 0 : form.so_luong)
      fd.append('trang_thai_admin', form.trang_thai_admin || 'Cho_duyet')

      if (form.hinh_anh) {
        fd.append('hinh_anh_cu', form.hinh_anh)
      }
      if (file) {
        fd.append('hinh_anh', file)
      }

      await api.put(`/san-pham/${form.san_pham_id}`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      setMsg('Cập nhật trạng thái duyệt sản phẩm thành công')
      closeEditModal()
      loadSanPham()
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err)
      if (err.response?.data?.message) {
        setMsg(`Lỗi máy chủ: ${err.response.data.message}`)
      } else if (err.message) {
        setMsg(`Lỗi: ${err.message}`)
      } else {
        setMsg('Lỗi lưu sản phẩm (không rõ nguyên nhân)')
      }
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async id => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
    try {
      setLoading(true)
      await api.delete(`/san-pham/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Xóa sản phẩm thành công')
      loadSanPham()
    } catch (err) {
      console.error(err)
      setMsg(err.response?.data?.message || 'Lỗi xóa sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = msg && msg.toLowerCase().includes('thành công')

  return (
    <AdminLayout title="Duyệt sản phẩm Nhà phân phối">
    <div className="admin-bg-wide">
      <div className="admin-card-lg">
        <p className="admin-subtext">
          Admin chỉ phê duyệt sản phẩm (Chờ duyệt / Đã duyệt / Từ chối).
          Việc bật/tắt <b>trạng thái bán</b> do Nhà phân phối tự quản lý.
        </p>

        {msg && (
          <p
            className={
              'admin-alert ' +
              (isSuccess ? 'admin-alert-success' : 'admin-alert-error')
            }
          >
            {msg}
          </p>
        )}

        {/* BẢNG SẢN PHẨM NPP */}
        <table className="admin-table admin-table-sm">
          <thead>
            <tr className="admin-thead-row-light">
              <th className="admin-th-sm">ID</th>
              <th className="admin-th-sm">Nhà phân phối</th>
              <th className="admin-th-sm">Hình</th>
              <th className="admin-th-sm">Danh mục</th>
              <th className="admin-th-sm">Tên sản phẩm</th>
              <th className="admin-th-sm">Giá</th>
              <th className="admin-th-sm">Số lượng</th>
              <th className="admin-th-sm">Trạng thái duyệt</th>
              <th className="admin-th-sm">Trạng thái bán (NPP)</th>
              <th className="admin-th-sm">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {dsSanPham.length === 0 && (
              <tr>
                <td colSpan={10} className="admin-table-empty">
                  Chưa có sản phẩm nào từ Nhà phân phối.
                </td>
              </tr>
            )}

            {dsSanPham.map(sp => (
              <tr key={sp.san_pham_id}>
                <td className="admin-td-sm">{sp.san_pham_id}</td>
                <td className="admin-td-sm">{renderNPPInfo(sp)}</td>
                <td className="admin-td-sm">
                  {sp.hinh_anh ? (
                    <img
                      src={`${API_ROOT}/uploads/${sp.hinh_anh}`}
                      alt={sp.ten_san_pham}
                      className="admin-img-thumb"
                    />
                  ) : (
                    <span className="admin-help-text">Không có ảnh</span>
                  )}
                </td>
                <td className="admin-td-sm">
                  {getTenLoai(sp.loai_san_pham_id)}
                </td>
                <td className="admin-td-sm">{sp.ten_san_pham}</td>
                <td className="admin-td-sm">
                  {Number(sp.gia).toLocaleString('vi-VN')} đ
                </td>
                <td className="admin-td-sm">{sp.so_luong}</td>
                <td className="admin-td-sm">{renderTrangThaiAdmin(sp)}</td>
                <td className="admin-td-sm">{renderTrangThaiBan(sp)}</td>
                <td className="admin-td-sm">
                  <button
                    onClick={() => openDetailModal(sp)}
                    className="admin-btn-small admin-btn-small-neutral"
                  >
                    Chi tiết
                  </button>
                  <button
                    onClick={() => openEditModal(sp)}
                    className="admin-btn-small admin-btn-small-primary"
                  >
                    Sửa / Duyệt
                  </button>
                  <button
                    onClick={() => onDelete(sp.san_pham_id)}
                    className="admin-btn-small admin-btn-small-danger"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL SỬA / DUYỆT */}
        {showEditModal && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal">
              <h3 className="admin-modal-title">
                Sửa / Duyệt sản phẩm
              </h3>
              <p className="admin-help-text" style={{ marginBottom: 12 }}>
                SP ID {form.san_pham_id} –{' '}
                {renderNPPInfo(
                  dsSanPham.find(sp => sp.san_pham_id === form.san_pham_id) ||
                    {}
                )}
              </p>

              <form onSubmit={handleSave}>
                <div className="admin-form-row">
                  <div className="admin-flex-2">
                    <label className="admin-label">Tên sản phẩm</label>
                    <input
                      name="ten_san_pham"
                      value={form.ten_san_pham}
                      onChange={onChangeForm}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-flex-1">
                    <label className="admin-label">Danh mục</label>
                    <select
                      name="loai_san_pham_id"
                      value={form.loai_san_pham_id}
                      onChange={onChangeForm}
                      className="admin-select"
                    >
                      <option value="">-- Không chọn --</option>
                      {dsLoai.map(loai => (
                        <option
                          key={loai.loai_san_pham_id}
                          value={loai.loai_san_pham_id}
                        >
                          {loai.ten_loai}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-flex-1">
                    <label className="admin-label">Giá (VNĐ)</label>
                    <input
                      type="number"
                      name="gia"
                      min={0}
                      value={form.gia}
                      onChange={onChangeForm}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-flex-1">
                    <label className="admin-label">Số lượng</label>
                    <input
                      type="number"
                      name="so_luong"
                      min={0}
                      value={form.so_luong}
                      onChange={onChangeForm}
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-flex-1">
                    <label className="admin-label">Trạng thái Admin</label>
                    <select
                      name="trang_thai_admin"
                      value={form.trang_thai_admin}
                      onChange={onChangeForm}
                      className="admin-select"
                    >
                      <option value="Cho_duyet">Chờ duyệt</option>
                      <option value="Da_duyet">Đã duyệt</option>
                      <option value="Tu_choi">Từ chối</option>
                    </select>
                    <p className="admin-help-text">
                      Trạng thái bán hiện tại (NPP):{' '}
                      {renderTrangThaiBan(
                        dsSanPham.find(
                          sp => sp.san_pham_id === form.san_pham_id
                        ) || {}
                      )}
                    </p>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-flex-2">
                    <label className="admin-label">
                      Hình ảnh sản phẩm
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="admin-input"
                    />
                    <p className="admin-help-text">
                      Có thể để trống nếu giữ nguyên ảnh cũ.
                    </p>
                  </div>
                  <div
                    className="admin-flex-1"
                    style={{ display: 'flex', alignItems: 'flex-end' }}
                  >
                    {preview && (
                      <img
                        src={preview}
                        alt="Xem trước"
                        className="admin-img-preview"
                      />
                    )}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Mô tả</label>
                  <textarea
                    name="mo_ta"
                    value={form.mo_ta}
                    onChange={onChangeForm}
                    rows={3}
                    className="admin-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="admin-btn admin-btn-primary"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu / Duyệt'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="admin-btn admin-btn-secondary"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && detailProduct && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal admin-modal-detail">
              <h3 className="admin-modal-title">Chi tiết sản phẩm</h3>
              <p className="admin-help-text">
                SP ID {detailProduct.san_pham_id} – {renderNPPInfo(detailProduct)}
              </p>

              <div className="admin-detail-grid">
                <div>
                  <p><b>Tên sản phẩm:</b> {detailProduct.ten_san_pham}</p>
                  <p>
                    <b>Danh mục:</b> {getTenLoai(detailProduct.loai_san_pham_id)}
                  </p>
                  <p>
                    <b>Giá:</b>{' '}
                    {Number(detailProduct.gia).toLocaleString('vi-VN')} đ
                  </p>
                  <p>
                    <b>Số lượng:</b> {detailProduct.so_luong}
                  </p>
                  <p>
                    <b>Trạng thái duyệt:</b> {renderTrangThaiAdmin(detailProduct)}
                  </p>
                  <p>
                    <b>Trạng thái bán (NPP):</b>{' '}
                    {renderTrangThaiBan(detailProduct)}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {detailProduct.hinh_anh && (
                    <img
                      src={`${API_ROOT}/uploads/${detailProduct.hinh_anh}`}
                      alt={detailProduct.ten_san_pham}
                      className="admin-img-detail"
                    />
                  )}
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <b>Mô tả:</b>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {detailProduct.mo_ta || '(Không có mô tả)'}
                </p>
              </div>

              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="admin-btn admin-btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  )
}
