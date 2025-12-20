import { useEffect, useState } from 'react'
import './Admin.css'
import AdminLayout from './AdminLayout'

const API_BASE = 'http://localhost:4000/api'

export default function QuanLyTaiKhoan() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // load danh sách
  const fetchUsers = async () => {
    setLoading(true)
    setMsg('')

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Chưa đăng nhập')
      }

      const res = await fetch(`${API_BASE}/xac-thuc/tai-khoan`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // backend trả 401/403/... kèm message
        throw new Error(data.message || `Lỗi ${res.status}`)
      }

      // API có thể trả dạng [] hoặc { users: [...] }
      const list = Array.isArray(data) ? data : data.users || []

      console.log('USERS:', list)
      setUsers(list)
    } catch (err) {
      console.error('Lỗi load users:', err)
      setUsers([])
      setMsg(err.message || 'Không tải được danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // đổi trạng thái
  const handleToggle = async (u) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMsg('Chưa đăng nhập')
        return
      }

      const path =
        u.trang_thai === 1
          ? `/xac-thuc/tai-khoan/${u.id || u.tai_khoan_id}/khoa`
          : `/xac-thuc/tai-khoan/${u.id || u.tai_khoan_id}/mo-khoa`

      const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || `Lỗi ${res.status}`)
      }

      
      fetchUsers()
    } catch (err) {
      console.error(err)
      setMsg(err.message || 'Lỗi cập nhật trạng thái tài khoản')
    }
  }

  const handleDelete = async (u) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      setMsg('Chưa đăng nhập')
      return
    }

    const id = u.id || u.tai_khoan_id
    const ok = window.confirm(`Xoá VĨNH VIỄN tài khoản "${u.email}"?`)
    if (!ok) return

    const res = await fetch(`${API_BASE}/xac-thuc/tai-khoan/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}`)

    setMsg(data.message || 'Đã xoá tài khoản')
    fetchUsers()
  } catch (err) {
    setMsg(err.message || 'Lỗi xoá tài khoản')
  }
}

  return (
    <AdminLayout title="Quản lý tài khoản">
      <div className="admin-page-padding">
        {msg && <p className="admin-alert admin-alert-error">{msg}</p>}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>SDT</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.tai_khoan_id || u.id}>
                    <td>{u.tai_khoan_id || u.id}</td>
                    <td>{u.ho_ten}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={
                          'badge ' +
                          ((u.ten_vai_tro || u.vai_tro) === 'admin'
                            ? 'badge-role-admin'
                            : 'badge-role-user')
                        }
                      >
                        {u.ten_vai_tro || u.vai_tro}
                      </span>
                    </td>
                    <td>{u.sdt || '---'}</td>
                    <td>
                      <span
                        className={
                          'badge ' +
                          (u.trang_thai === 1
                            ? 'badge-status-active'
                            : 'badge-status-block')
                        }
                      >
                        {u.trang_thai === 1 ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleToggle(u)}
                        className={
                          'admin-btn-small ' +
                          (u.trang_thai === 1
                            ? 'admin-btn-small-danger'
                            : 'admin-btn-small-primary')
                        }
                      >
                        {u.trang_thai === 1 ? 'Khoá' : 'Mở khoá'}
                      </button>

                      <button
                        onClick={() => handleDelete(u)}
                        className="admin-btn-small admin-btn-small-danger"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">
                      Không có tài khoản nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
