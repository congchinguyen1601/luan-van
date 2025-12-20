import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

export default function DangNhapAdmin() {
  const [form, setForm] = useState({ email: '', mat_khau: '' })
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      const res = await api.post('/xac-thuc/dang-nhap', form)
      const { user, token } = res.data || {}

      if (!user) {
        setMsg('Không lấy được thông tin người dùng.')
        return
      }

      if (user.ten_vai_tro !== 'Admin') {
        setMsg('Tài khoản này không có quyền quản trị hệ thống.')
        return
      }

      if (token) {
        localStorage.setItem('token', token)
      }
      localStorage.setItem('user', JSON.stringify(user))

      setMsg('Đăng nhập admin thành công!')
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error(err)
      const m =
        err.response?.data?.message ||
        'Sai email hoặc mật khẩu, hãy thử lại.'
      setMsg(m)
    }
  }

  const isSuccess = msg && msg.includes('thành công')

  return (
    <div className="admin-bg-login">
      <div className="admin-card-login">
        <h2 className="admin-title-h2 admin-text-center">
          Đăng nhập Admin
        </h2>
        <p className="admin-text-center admin-text-small admin-subtext">
          Chỉ dành cho quản trị viên hệ thống.
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
            <label className="admin-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              className="admin-input admin-input-round"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Mật khẩu</label>
            <input
              type="password"
              name="mat_khau"
              value={form.mat_khau}
              onChange={onChange}
              required
              className="admin-input admin-input-round"
            />
          </div>

          <button type="submit" className="admin-login-btn">
            Đăng nhập Admin
          </button>
        </form>
      </div>
    </div>
  )
}
