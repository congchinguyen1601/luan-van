import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import '../Admin/Admin.css'
import NppLayout from './NPPLayout'

const API_ROOT = 'http://localhost:4000'

const parseJsonArray = (val) => {
  if (!val) return []
  try {
    const arr = JSON.parse(val)
    return Array.isArray(arr) ? arr.filter(Boolean) : []
  } catch {
    return []
  }
}

const XUAT_XU_SUGGEST = [
  'Chưa rõ',
  'Việt Nam',
  'Thái Lan',
  'Nhật Bản',
  'Hàn Quốc',
  'Trung Quốc',
  'Mỹ',
  'Úc',
  'New Zealand',
  'EU',
]

export default function QuanLySanPhamNPP() {
  const [dsSanPham, setDsSanPham] = useState([])
  const [dsLoaiForSP, setDsLoaiForSP] = useState([])

  const [formSP, setFormSP] = useState({
    san_pham_id: null,
    loai_san_pham_id: '',
    ten_san_pham: '',
    mo_ta: '',
    xuat_xu: '', 
    gia: '',
    so_luong: '',
    hinh_anh: '', 
    hinh_anh_chi_tiet: '',
    trang_thai: 1,
  })

  const [fileMain, setFileMain] = useState(null)
  const [previewMain, setPreviewMain] = useState('')

  const [filesDetail, setFilesDetail] = useState([])
  const [previewDetails, setPreviewDetails] = useState([]) 

  const [msgSP, setMsgSP] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  const loadDanhMuc = useCallback(async () => {
    try {
      const res = await api.get('/danh-muc/npp', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDsLoaiForSP(res.data || [])
    } catch (err) {
      console.error('Lỗi load danh mục NPP:', err)
    }
  }, [token])

  const loadSanPham = useCallback(async () => {
    try {
      const res = await api.get('/san-pham/npp', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDsSanPham(res.data || [])
    } catch (err) {
      console.error('Lỗi load sản phẩm NPP:', err)
      setMsgSP('Không tải được danh sách sản phẩm (NPP)')
    }
  }, [token])

  useEffect(() => {
    loadDanhMuc()
    loadSanPham()
  }, [loadDanhMuc, loadSanPham])

  const onChangeSP = (e) => {
    const { name, value } = e.target
    setFormSP((prev) => ({
      ...prev, 
      [name]:
        name === 'gia' ||
        name === 'so_luong' ||
        name === 'loai_san_pham_id' ||
        name === 'trang_thai'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }))
  }

 
  const onFileChangeMain = (e) => {
    const f = e.target.files?.[0]
    setFileMain(f || null)
    if (f) setPreviewMain(URL.createObjectURL(f))
    else setPreviewMain('')
  }

  const onFileChangeDetails = (e) => {
    const list = Array.from(e.target.files || [])
    setFilesDetail(list)

    const urls = list.map((f) => URL.createObjectURL(f))
    setPreviewDetails(urls)
  }

  const resetFormSP = () => {
    setFormSP({
      san_pham_id: null,
      loai_san_pham_id: '',
      ten_san_pham: '',
      mo_ta: '',
      xuat_xu: '', 
      gia: '',
      so_luong: '',
      hinh_anh: '',
      hinh_anh_chi_tiet: '',
      trang_thai: 1,
    })

    setFileMain(null)
    setPreviewMain('')

    setFilesDetail([])
    setPreviewDetails([])
  }

  const onSubmitSP = async (e) => {
    e.preventDefault()
    setMsgSP('')

    if (!formSP.ten_san_pham.trim()) {
      setMsgSP('Vui lòng nhập tên sản phẩm')
      return
    }

    try {
      setLoading(true)

      const fd = new FormData()
      fd.append('ten_san_pham', formSP.ten_san_pham)
      fd.append('loai_san_pham_id', formSP.loai_san_pham_id || '')
      fd.append('mo_ta', formSP.mo_ta || '')
      fd.append('xuat_xu', formSP.xuat_xu || '') 
      fd.append('gia', formSP.gia === '' ? 0 : formSP.gia)
      fd.append('so_luong', formSP.so_luong === '' ? 0 : formSP.so_luong)
      fd.append(
        'trang_thai',
        formSP.trang_thai === '' || formSP.trang_thai == null ? 1 : formSP.trang_thai,
      )

      if (formSP.san_pham_id && formSP.hinh_anh) {
        fd.append('hinh_anh_cu', formSP.hinh_anh)
      }

      if (fileMain) {
        fd.append('hinh_anh', fileMain)
      }

      if (filesDetail.length) {
        filesDetail.forEach((f) => fd.append('hinh_anh_chi_tiet', f))
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }

      if (formSP.san_pham_id) {
        await api.put(`/san-pham/npp/${formSP.san_pham_id}`, fd, config)
        setMsgSP('Cập nhật sản phẩm thành công')
      } else {
        await api.post('/san-pham/npp', fd, config)
        setMsgSP(
          'Thêm sản phẩm thành công. Sản phẩm sẽ hiển thị cho khách sau khi Admin duyệt và bạn bật trạng thái bán "Đang bán".',
        )
      }

      resetFormSP()
      loadSanPham()
    } catch (err) {
      console.error('Lỗi lưu sản phẩm NPP:', err)
      if (err.response?.data?.message) setMsgSP(`Lỗi: ${err.response.data.message}`)
      else if (err.message) setMsgSP(`Lỗi: ${err.message}`)
      else setMsgSP('Lỗi lưu sản phẩm (NPP)')
    } finally {
      setLoading(false)
    }
  }

  const renderTrangThaiAdmin = (sp) => {
    switch (sp.trang_thai_admin) {
      case 'Da_duyet':
        return 'Đã duyệt'
      case 'Tu_choi':
        return 'Bị từ chối'
      case 'Cho_duyet':
      default:
        return 'Chờ duyệt'
    }
  }

  const renderTrangThaiBan = (sp) => (Number(sp.trang_thai) === 1 ? 'Đang bán' : 'Tạm tắt')

  const onEditSP = (sp) => {
    setFormSP({
      san_pham_id: sp.san_pham_id,
      loai_san_pham_id: sp.loai_san_pham_id || '',
      ten_san_pham: sp.ten_san_pham || '',
      mo_ta: sp.mo_ta || '',
      xuat_xu: sp.xuat_xu || '', 
      gia: Number(sp.gia) || 0,
      so_luong: sp.so_luong || 0,
      hinh_anh: sp.hinh_anh || '',
      hinh_anh_chi_tiet: sp.hinh_anh_chi_tiet || '',
      trang_thai: sp.trang_thai === undefined || sp.trang_thai === null ? 1 : Number(sp.trang_thai),
    })

    // reset file mới
    setFileMain(null)
    setFilesDetail([])
    setPreviewDetails([])

    // preview ảnh chính từ DB
    if (sp.hinh_anh) setPreviewMain(`${API_ROOT}/uploads/${sp.hinh_anh}`)
    else setPreviewMain('')

    setMsgSP('')
  }

  const onDeleteSP = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
    try {
      setLoading(true)
      await api.delete(`/san-pham/npp/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsgSP('Xóa sản phẩm thành công (NPP)')
      loadSanPham()
    } catch (err) {
      console.error('Lỗi xóa sản phẩm NPP:', err)
      setMsgSP(err.response?.data?.message || 'Lỗi xóa sản phẩm (NPP)')
    } finally {
      setLoading(false)
    }
  }

  const getTenLoai = (loaiId) => {
    if (loaiId == null || loaiId === '') return '-'
    const found = dsLoaiForSP.find((l) => Number(l.loai_san_pham_id) === Number(loaiId))
    return found ? found.ten_loai : loaiId
  }

  const isSuccess = msgSP.toLowerCase().includes('thành công')

  const oldDetailImgs = parseJsonArray(formSP.hinh_anh_chi_tiet)

  return (
    <NppLayout title="Quản lý sản phẩm (Nhà phân phối)">
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(135deg, #f1f8ff, #e5f5ec)',
          padding: '30px 40px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          }}
        >
          <p style={{ fontSize: 14, color: '#52635c', marginBottom: 16 }}>
            Thêm / sửa sản phẩm cho shop của bạn. Admin duyệt <b>nội dung sản phẩm</b>, còn trạng thái bán (
            <i>Đang bán / Tạm tắt</i>) là do Nhà phân phối tự bật/tắt.
          </p>

          {msgSP && (
            <p
              style={{
                marginBottom: 12,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                backgroundColor: isSuccess ? '#e2f6eb' : '#fdeeee',
                color: isSuccess ? '#0f7049' : '#b3261e',
              }}
            >
              {msgSP}
            </p>
          )}

          <form
            onSubmit={onSubmitSP}
            style={{
              marginBottom: 24,
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.5fr',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Tên sản phẩm</label>
                <input
                  type="text"
                  name="ten_san_pham"
                  value={formSP.ten_san_pham}
                  onChange={onChangeSP}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Danh mục</label>
                <select
                  name="loai_san_pham_id"
                  value={formSP.loai_san_pham_id}
                  onChange={onChangeSP}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {dsLoaiForSP.map((dm) => (
                    <option key={dm.loai_san_pham_id} value={dm.loai_san_pham_id}>
                      {dm.ten_loai} ({Number(dm.trang_thai) === 1 ? 'Đã duyệt' : 'Chờ duyệt'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Mô tả</label>
                <textarea
                  name="mo_ta"
                  value={formSP.mo_ta}
                  onChange={onChangeSP}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Xuất xứ</label>
                <input
                  type="text"
                  name="xuat_xu"
                  value={formSP.xuat_xu}
                  onChange={onChangeSP}
                  list="xuatxu-list"
                  placeholder="Chọn / nhập xuất xứ"
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                />
                <datalist id="xuatxu-list">
                  {XUAT_XU_SUGGEST.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Giá</label>
                <input
                  type="number"
                  name="gia"
                  value={formSP.gia}
                  onChange={onChangeSP}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Số lượng</label>
                <input
                  type="number"
                  name="so_luong"
                  value={formSP.so_luong}
                  onChange={onChangeSP}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Trạng thái bán</label>
                <select
                  name="trang_thai"
                  value={formSP.trang_thai}
                  onChange={onChangeSP}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #bad7cd',
                    marginTop: 4,
                  }}
                >
                  <option value={1}>Đang bán</option>
                  <option value={0}>Tạm tắt</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Ảnh chính</label>
                <input type="file" accept="image/*" onChange={onFileChangeMain} style={{ marginTop: 4 }} />
                {previewMain && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={previewMain}
                      alt="preview"
                      style={{
                        maxWidth: 180,
                        maxHeight: 120,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e0e0e0',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Ảnh chi tiết (tối đa 10)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChangeDetails}
                  style={{ marginTop: 4 }}
                />

                {previewDetails.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {previewDetails.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`detail-${idx}`}
                        style={{
                          width: 70,
                          height: 55,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                        }}
                      />
                    ))}
                  </div>
                )}

                {formSP.san_pham_id && previewDetails.length === 0 && oldDetailImgs.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Ảnh chi tiết hiện tại:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {oldDetailImgs.map((fn, idx) => (
                        <img
                          key={idx}
                          src={`${API_ROOT}/uploads/${fn}`}
                          alt={`old-detail-${idx}`}
                          style={{
                            width: 70,
                            height: 55,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #e0e0e0',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                Sản phẩm sẽ hiển thị cho khách khi <b>Admin đã duyệt</b> và trạng thái bán là <b>Đang bán</b>. Việc
                bật/tắt trạng thái bán là do Nhà phân phối tự quyết, <b>không cần Admin duyệt lại</b>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#1E6F5C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {formSP.san_pham_id ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
              </button>

              {formSP.san_pham_id && (
                <button
                  type="button"
                  onClick={resetFormSP}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#e5e5e5',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#e3f2ea', textAlign: 'left' }}>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>ID</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Tên sản phẩm</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Danh mục</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Xuất xứ</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Giá</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>SL</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Ảnh</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Trạng thái bán</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Trạng thái (Admin)</th>
                  <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {dsSanPham.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 10, textAlign: 'center' }}>
                      Chưa có sản phẩm nào.
                    </td>
                  </tr>
                )}

                {dsSanPham.map((sp) => (
                  <tr key={sp.san_pham_id}>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{sp.san_pham_id}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{sp.ten_san_pham}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{getTenLoai(sp.loai_san_pham_id)}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{sp.xuat_xu || '-'}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{sp.gia}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{sp.so_luong}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                      {sp.hinh_anh ? (
                        <img
                          src={`${API_ROOT}/uploads/${sp.hinh_anh}`}
                          alt={sp.ten_san_pham}
                          style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{renderTrangThaiBan(sp)}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>{renderTrangThaiAdmin(sp)}</td>
                    <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                      <button
                        onClick={() => onEditSP(sp)}
                        style={{
                          marginRight: 6,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#e1f0ff',
                          cursor: 'pointer',
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => onDeleteSP(sp.san_pham_id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#ffe3e3',
                          cursor: 'pointer',
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </NppLayout>
  )
}
