import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

export default function DangKyNhaPhanPhoi() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    ten_don_vi: '',
    ma_so_thue: '',
    dia_chi: '',
    sdt: '',
    email_cong_ty: '',
    nguoi_dai_dien: '',
    ghi_chu: '',
  })

  const [errors, setErrors] = useState({})
  const [currentNpp, setCurrentNpp] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (v) => {
    const e = {}
    const ten = (v.ten_don_vi || '').trim()
    const mstRaw = (v.ma_so_thue || '').trim()
    const dc = (v.dia_chi || '').trim()
    const sdt = (v.sdt || '').trim()
    const email = (v.email_cong_ty || '').trim()
    const nd = (v.nguoi_dai_dien || '').trim()
    const gc = (v.ghi_chu || '').trim()

    if (!ten) e.ten_don_vi = 'Tên đơn vị là bắt buộc'
    else if (ten.length < 2 || ten.length > 100) e.ten_don_vi = 'Tên đơn vị 2–100 ký tự'

    if (mstRaw) {
      const mst = mstRaw.replace(/-/g, '')
      if (!/^\d+$/.test(mst)) e.ma_so_thue = 'Mã số thuế chỉ gồm chữ số'
      else if (![10, 13].includes(mst.length)) e.ma_so_thue = 'MST phải 10 hoặc 13 số'
    }

    if (!dc) e.dia_chi = 'Địa chỉ là bắt buộc'
    else if (dc.length < 5 || dc.length > 200) e.dia_chi = 'Địa chỉ 5–200 ký tự'

    if (!sdt) e.sdt = 'Số điện thoại là bắt buộc'
    else if (!/^0\d{9,10}$/.test(sdt)) e.sdt = 'SĐT không hợp lệ (VD: 0912345678)'

    if (!email) e.email_cong_ty = 'Email công ty là bắt buộc'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email_cong_ty = 'Email không hợp lệ'

    if (!nd) e.nguoi_dai_dien = 'Người đại diện là bắt buộc'
    else if (nd.length < 2 || nd.length > 60) e.nguoi_dai_dien = 'Người đại diện 2–60 ký tự'

    if (gc.length > 500) e.ghi_chu = 'Ghi chú tối đa 500 ký tự'

    return e
  }

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/dang-nhap')
        return
      }

      try {
        const res = await api.get('/nha-phan-phoi/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const npp = res.data?.npp
        if (npp) {
          setCurrentNpp(npp)
          setForm((f) => ({
            ...f,
            ten_don_vi: npp.ten_don_vi || '',
            ma_so_thue: npp.ma_so_thue || '',
            dia_chi: npp.dia_chi || '',
            sdt: npp.sdt || '',
            email_cong_ty: npp.email_cong_ty || '',
            nguoi_dai_dien: npp.nguoi_dai_dien || '',
            ghi_chu: npp.ghi_chu || '',
          }))
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error('Lỗi load NPP của tôi:', err)
        }
      }
    }
    load()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' })) 
  }

  const renderTrangThai = () => {
    if (!currentNpp) return 'Chưa đăng ký'
    if (currentNpp.trang_thai_dang_ky === 'CHO_DUYET') return 'Đang chờ Admin duyệt'
    if (currentNpp.trang_thai_dang_ky === 'DA_DUYET') return 'Đã được duyệt, bạn là Nhà phân phối'
    if (currentNpp.trang_thai_dang_ky === 'TU_CHOI') {
      return `Bị từ chối${currentNpp.ly_do_tu_choi ? `: ${currentNpp.ly_do_tu_choi}` : ''}`
    }
    return currentNpp.trang_thai_dang_ky
  }

  const isLocked =
    currentNpp?.trang_thai_dang_ky === 'CHO_DUYET' ||
    currentNpp?.trang_thai_dang_ky === 'DA_DUYET'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')

    const e2 = validate(form)
    setErrors(e2)
    if (Object.keys(e2).length) return

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/dang-nhap')
      return
    }

    try {
      setLoading(true)
      const res = await api.post('/nha-phan-phoi/dang-ky', form, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const message = res.data?.message || 'Đã gửi yêu cầu đăng ký Nhà phân phối.'
      setMsg(message)

      alert(message)
      navigate('/trang-chu')
    } catch (err) {
      console.error('Lỗi gửi yêu cầu NPP:', err)

      const backendErrors = err?.response?.data?.errors
      if (backendErrors && typeof backendErrors === 'object') {
        setErrors((prev) => ({ ...prev, ...backendErrors }))
      }

      setError(err?.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">Đăng ký trở thành Nhà phân phối</h2>
        <p className="profile-note">
          Điền đầy đủ thông tin bên dưới. Yêu cầu của bạn sẽ được gửi tới Admin để duyệt.
        </p>

        {currentNpp && (
          <div className="profile-msg">
            <strong>Trạng thái hiện tại:</strong> {renderTrangThai()}
          </div>
        )}

        {error && (
          <div className="profile-msg" style={{ color: '#c62828' }}>
            {error}
          </div>
        )}
        {msg && (
          <div className="profile-msg" style={{ color: '#2e7d32' }}>
            {msg}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <label>Tên đơn vị *</label>
            <input
              type="text"
              name="ten_don_vi"
              value={form.ten_don_vi}
              onChange={handleChange}
              placeholder="VD: Công ty TNHH Nông sản X"
              disabled={isLocked || loading}
            />
            {errors.ten_don_vi && <div className="field-error">{errors.ten_don_vi}</div>}
          </div>

          <div className="profile-field">
            <label>Mã số thuế</label>
            <input
              type="text"
              name="ma_so_thue"
              value={form.ma_so_thue}
              onChange={handleChange}
              disabled={isLocked || loading}
            />
            {errors.ma_so_thue && <div className="field-error">{errors.ma_so_thue}</div>}
          </div>

          <div className="profile-field">
            <label>Địa chỉ *</label>
            <input
              type="text"
              name="dia_chi"
              value={form.dia_chi}
              onChange={handleChange}
              disabled={isLocked || loading}
            />
            {errors.dia_chi && <div className="field-error">{errors.dia_chi}</div>}
          </div>

          <div className="profile-field">
            <label>Số điện thoại *</label>
            <input
              type="text"
              name="sdt"
              value={form.sdt}
              onChange={handleChange}
              disabled={isLocked || loading}
            />
            {errors.sdt && <div className="field-error">{errors.sdt}</div>}
          </div>

          <div className="profile-field">
            <label>Email công ty *</label>
            <input
              type="email"
              name="email_cong_ty"
              value={form.email_cong_ty}
              onChange={handleChange}
              disabled={isLocked || loading}
            />
            {errors.email_cong_ty && <div className="field-error">{errors.email_cong_ty}</div>}
          </div>

          <div className="profile-field">
            <label>Người đại diện *</label>
            <input
              type="text"
              name="nguoi_dai_dien"
              value={form.nguoi_dai_dien}
              onChange={handleChange}
              disabled={isLocked || loading}
            />
            {errors.nguoi_dai_dien && <div className="field-error">{errors.nguoi_dai_dien}</div>}
          </div>

          <div className="profile-field">
            <label>Ghi chú thêm</label>
            <textarea
              name="ghi_chu"
              value={form.ghi_chu}
              onChange={handleChange}
              rows={3}
              disabled={isLocked || loading}
            />
            {errors.ghi_chu && <div className="field-error">{errors.ghi_chu}</div>}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid #cfd8dc',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              Quay lại
            </button>

            <button
              type="submit"
              className="profile-submit-btn"
              disabled={loading || isLocked}
              title={isLocked ? 'Yêu cầu đang được xử lý hoặc đã duyệt' : ''}
            >
              {loading ? 'Đang gửi...' : isLocked ? 'Đã gửi/Đã duyệt' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
