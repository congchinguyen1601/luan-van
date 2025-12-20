import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import '../Admin/Admin.css'
import NppLayout from './NPPLayout'

export default function QuanLyDanhMucNPP() {
  const [dsDanhMuc, setDsDanhMuc] = useState([])
  const [formDM, setFormDM] = useState({ ten_loai: '', mo_ta: '' })
  const [msg, setMsg] = useState('')
  const token = localStorage.getItem('token')

  const loadDanhMuc = useCallback(async () => {
    try {
      const res = await api.get('/danh-muc/npp', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDsDanhMuc(res.data || [])
    } catch (err) {
      console.error('Lỗi load danh mục NPP:', err)
      setMsg('Không tải được danh mục (NPP)')
    }
  }, [token])

  useEffect(() => {
    loadDanhMuc()
  }, [loadDanhMuc])

  const onChangeDM = (e) => {
    const { name, value } = e.target
    setFormDM((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmitDM = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!formDM.ten_loai.trim()) {
      setMsg('Vui lòng nhập tên danh mục')
      return
    }

    try {
      await api.post('/danh-muc/npp', formDM, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMsg('Tạo danh mục thành công, đang chờ Admin duyệt')
      setFormDM({ ten_loai: '', mo_ta: '' })
      loadDanhMuc()
    } catch (err) {
      console.error('Lỗi thêm danh mục NPP:', err)
      setMsg(err.response?.data?.message || 'Lỗi khi thêm danh mục (NPP)')
    }
  }

  const isSuccess = msg.toLowerCase().includes('thành công')

  return (
    <NppLayout title="Quản lý danh mục (Nhà phân phối)">
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
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
          Bạn có thể đề xuất danh mục cho shop của mình. Admin sẽ duyệt trước khi dùng được.
        </p>

        {msg && (
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
            {msg}
          </p>
        )}

        <form
          onSubmit={onSubmitDM}
          style={{ marginBottom: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Tên danh mục</label>
            <input
              type="text"
              name="ten_loai"
              value={formDM.ten_loai}
              onChange={onChangeDM}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #bad7cd',
                marginTop: 4,
              }}
            />
          </div>

          <div style={{ flex: 2, minWidth: 260 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Mô tả</label>
            <textarea
              name="mo_ta"
              value={formDM.mo_ta}
              onChange={onChangeDM}
              rows={2}
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

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              paddingBottom: 2,
            }}
          >
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#1E6F5C',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Thêm danh mục
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#e3f2ea',
                  textAlign: 'left',
                }}
              >
                <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>ID</th>
                <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Tên danh mục</th>
                <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>Mô tả</th>
                <th style={{ border: '1px solid #d7e5dd', padding: 6 }}>
                  Trạng thái (Admin)
                </th>
              </tr>
            </thead>
            <tbody>
              {dsDanhMuc.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 10, textAlign: 'center' }}>
                    Chưa có danh mục nào.
                  </td>
                </tr>
              )}

              {dsDanhMuc.map((dm) => (
                <tr key={dm.loai_san_pham_id}>
                  <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                    {dm.loai_san_pham_id}
                  </td>
                  <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                    {dm.ten_loai}
                  </td>
                  <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                    {dm.mo_ta}
                  </td>
                  <td style={{ border: '1px solid #e0eee7', padding: 6 }}>
                    {Number(dm.trang_thai) === 1 ? 'Đã duyệt' : 'Chờ duyệt / Tắt'}
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
