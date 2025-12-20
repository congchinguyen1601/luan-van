import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './User.css'

export default function DangNhap() {
  const [form, setForm] = useState({ email: '', mat_khau: '' })
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

    try {
      const res = await api.post('/xac-thuc/dang-nhap', form)
      const { token, user } = res.data || {}

      if (!token || !user) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ')
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      const rawRole = (user.ten_vai_tro || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (rawRole.includes('admin')) {
        navigate('/admin', { replace: true })
      } else if (rawRole.includes('nha phan phoi')) {
        navigate('/nha-phan-phoi', { replace: true })
      } else {
        navigate('/trang-chu', { replace: true })
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err)
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại.'
      setMsg(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtext">
          Đăng nhập để đặt mua nông sản sạch cho gia đình bạn.
        </p>

        <form onSubmit={onSubmit}>
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

          <div className="auth-extra-row">
            <Link to="/quen-mat-khau" className="auth-link">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút submit */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" className="auth-link">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
