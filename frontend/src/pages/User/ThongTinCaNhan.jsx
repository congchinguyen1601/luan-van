import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

export default function ThongTinCaNhan() {
  const [form, setForm] = useState({
    ho_ten: '',
    email: '',
    dia_chi: '',
    sdt: '',
    so_cmnd: '',
    ngay_sinh: '',
    gioi_tinh: '',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('info')

  const navigate = useNavigate()

  const loadUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/dang-nhap')
      return
    }

    try {
      const res = await api.get('/xac-thuc/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const u = res.data || {}

      setForm({
        ho_ten: u.ho_ten || '',
        email: u.email || '',
        dia_chi: u.dia_chi || '',
        sdt: u.sdt || '',
        so_cmnd: u.so_cmnd || '',
        ngay_sinh: u.ngay_sinh ? String(u.ngay_sinh).slice(0, 10) : '',
        gioi_tinh: u.gioi_tinh || '',
      })
    } catch (err) {
      console.error(err)
      setMsg('Không lấy được thông tin tài khoản.')
    }
  }

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      await api.put(
        '/xac-thuc/me',
        {
          ho_ten: form.ho_ten,
          dia_chi: form.dia_chi,
          sdt: form.sdt,
          so_cmnd: form.so_cmnd,
          ngay_sinh: form.ngay_sinh || null,
          gioi_tinh: form.gioi_tinh,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      await loadUser()
      setMsg('Cập nhật thông tin thành công.')
    } catch (err) {
      console.error(err)
      setMsg('Cập nhật thất bại, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const doiMatKhau = async (e) => {
    e.preventDefault()
    setPwdMsg('')

    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      setPwdMsg('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.')
      return
    }

    if (pwdForm.newPassword.length < 6) {
      setPwdMsg('Mật khẩu mới phải tối thiểu 6 ký tự.')
      return
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg('Xác nhận mật khẩu mới không khớp.')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/dang-nhap')
      return
    }

    try {
      setPwdLoading(true)
      const res = await api.post(
        '/xac-thuc/doi-mat-khau',
        {
          mat_khau_cu: pwdForm.currentPassword,
          mat_khau_moi: pwdForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setPwdMsg(res.data?.message || 'Đổi mật khẩu thành công.')
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      console.error(err)
      const msg =
        err?.response?.data?.message ||
        'Đổi mật khẩu thất bại, vui lòng thử lại.'
      setPwdMsg(msg)
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">Thông tin tài khoản</h2>

        <div className="profile-tabs">
          <button
            type="button"
            className={
              activeTab === 'info'
                ? 'profile-tab profile-tab-active'
                : 'profile-tab'
            }
            onClick={() => setActiveTab('info')}
          >
            Thông tin cá nhân
          </button>

          <button
            type="button"
            className={
              activeTab === 'password'
                ? 'profile-tab profile-tab-active'
                : 'profile-tab'
            }
            onClick={() => setActiveTab('password')}
          >
            Đổi mật khẩu
          </button>
        </div>

        {activeTab === 'info' && msg && (
          <div className="profile-msg">{msg}</div>
        )}
        {activeTab === 'password' && pwdMsg && (
          <div className="profile-msg">{pwdMsg}</div>
        )}

        {activeTab === 'info' && (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label>Họ và tên</label>
              <input
                type="text"
                name="ho_ten"
                value={form.ho_ten}
                onChange={handleChange}
              />
            </div>

            <div className="profile-field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} disabled />
              <small className="profile-note">Email không thể thay đổi</small>
            </div>

            <div className="profile-field">
              <label>Số CMND / CCCD</label>
              <input
                type="text"
                name="so_cmnd"
                value={form.so_cmnd}
                onChange={handleChange}
              />
            </div>

            <div className="profile-field">
              <label>Ngày sinh</label>
              <input
                type="date"
                name="ngay_sinh"
                value={form.ngay_sinh}
                onChange={handleChange}
              />
            </div>

            <div className="profile-field">
              <label>Giới tính</label>
              <select
                name="gioi_tinh"
                value={form.gioi_tinh}
                onChange={handleChange}
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="profile-field">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="dia_chi"
                value={form.dia_chi}
                onChange={handleChange}
              />
            </div>

            <div className="profile-field">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="sdt"
                value={form.sdt}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="profile-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form className="profile-form" onSubmit={doiMatKhau}>
            <div className="profile-field">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                name="currentPassword"
                value={pwdForm.currentPassword}
                onChange={handlePwdChange}
              />
            </div>

            <div className="profile-field">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="newPassword"
                value={pwdForm.newPassword}
                onChange={handlePwdChange}
              />
            </div>

            <div className="profile-field">
              <label>Nhập lại mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={pwdForm.confirmPassword}
                onChange={handlePwdChange}
              />
            </div>

            <button
              type="submit"
              className="profile-submit-btn"
              disabled={pwdLoading}
            >
              {pwdLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
