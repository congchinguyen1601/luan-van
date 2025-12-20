import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

export default function DangKy() {
  const [form, setForm] = useState({
    ho_ten: '',
    email: '',
    mat_khau: '',
    xac_nhan_mk: ''
  })

  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    if (form.mat_khau !== form.xac_nhan_mk) {
      setMsg('Mật khẩu xác nhận không khớp')
      setLoading(false)
      return
    }

    try {
      await api.post('/xac-thuc/dang-ky', {
      ho_ten: form.ho_ten,
      email: form.email,
      mat_khau: form.mat_khau
      })

      setMsg('Đăng ký thành công! Đang chuyển hướng...')
      setTimeout(() => navigate('/dang-nhap'), 1200)
    } catch (err) {
      console.error('Lỗi đăng ký:', err)
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng ký thất bại. Vui lòng thử lại.'
      setMsg(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng ký</h1>
        <form onSubmit={onSubmit}>
          <div className="auth-input-group">
            <label>Họ tên</label>
            <input
              type="text"
              name="ho_ten"
              value={form.ho_ten}
              onChange={onChange}
              required
              className="auth-input"
              placeholder="Nguyen Van A"
            />
          </div>

          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              className="auth-input"
              placeholder="email@vidu.com"
            />
          </div>
          <div className="auth-input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="mat_khau"
              value={form.mat_khau}
              onChange={onChange}
              required
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          <div className="auth-input-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="xac_nhan_mk"
              value={form.xac_nhan_mk}
              onChange={onChange}
              required
              className="auth-input"
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        {msg && (
          <p
            className={
              msg.toLowerCase().includes('thành công')
                ? 'auth-msg auth-msg-success'
                : 'auth-msg auth-msg-error'
            }
          >
            {msg}
          </p>
        )}

        <p className="auth-bottom-text">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className="auth-link">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
