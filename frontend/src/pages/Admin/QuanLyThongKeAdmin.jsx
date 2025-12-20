import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'
import AdminLayout from './AdminLayout'

export default function QuanLyThongKeAdmin() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null) // tổng quan
  const [byNPP, setByNPP] = useState([]) // theo nhà phân phối
  const [byProduct, setByProduct] = useState([]) // theo sản phẩm

  const token = localStorage.getItem('token')

  const buildParams = () => {
    const params = {}
    if (fromDate) params.from = fromDate
    if (toDate) params.to = toDate
    return params
  }

  const fetchData = async () => {
    if (!token) {
      setError('Chưa đăng nhập')
      return
    }

    try {
      setLoading(true)
      setError('')

      const params = buildParams()
      const headers = { Authorization: `Bearer ${token}` }

      const [resNPP, resProduct] = await Promise.all([
        api.get('/thong-ke/admin/theo-npp', { params, headers }),
        api.get('/thong-ke/admin/theo-san-pham', { params, headers }),
      ])

      const listNPP = resNPP.data?.list || []
      const listProduct = resProduct.data?.list || []

      setByNPP(listNPP)
      setByProduct(listProduct)

      // Tự tính summary từ 2 bảng
      const tong_doanh_thu = listNPP.reduce(
        (sum, x) => sum + Number(x.doanh_thu || 0),
        0
      )
      const tong_hoa_hong_san = listNPP.reduce(
        (sum, x) => sum + Number(x.hoa_hong_san || 0),
        0
      )
      const tong_hoa_hong_npp = listNPP.reduce(
        (sum, x) => sum + Number(x.hoa_hong_npp || 0),
        0
      )
      const tong_don = listNPP.reduce(
        (sum, x) => sum + Number(x.so_don || 0),
        0
      )
      const tong_so_luong = listProduct.reduce(
        (sum, x) => sum + Number(x.tong_so_luong || 0),
        0
      )

      setSummary({
        tong_doanh_thu,
        tong_hoa_hong_san,
        tong_hoa_hong_npp,
        tong_don,
        tong_so_luong,
      })
    } catch (err) {
      console.error('Lỗi load thống kê admin:', err)
      setError(
        err.response?.data?.message ||
          'Không tải được dữ liệu thống kê. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    fetchData()
  }
    const handleExportPDF = async () => {
    if (!token) {
      alert('Bạn cần đăng nhập')
      return
    }
    try {
      const params = buildParams()
      const query = new URLSearchParams(params).toString()
      const url =
        'http://localhost:4000/api/thong-ke/admin/export-pdf' +
        (query ? `?${query}` : '')

      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('HTTP ' + res.status)

      const blob = await res.blob()
      const fileURL = URL.createObjectURL(blob)
      window.open(fileURL, '_blank')
    } catch (err) {
      console.error('Export Admin PDF error:', err)
      alert('Không xuất được PDF. Vui lòng thử lại.')
    }
  }


  const fmtMoney = (v) =>
    Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })

  return (
    <AdminLayout title="Quản lý thống kê (Admin)">
    <div className="admin-bg-main">
      <div className="admin-card-lg">
        <form
          onSubmit={handleFilter}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <label className="admin-label">Từ ngày</label>
            <input
              type="date"
              className="admin-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="admin-label">Đến ngày</label>
            <input
              type="date"
              className="admin-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="admin-btn-primary"
            style={{ alignSelf: 'flex-end' }}
          >
            Lọc thống kê
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="admin-btn-secondary"
            style={{ alignSelf: 'flex-end' }}
          >
            Xuất PDF
          </button>
        </form>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {loading && <p>Đang tải dữ liệu...</p>}

        {summary && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div className="admin-stat-card">
              <div className="admin-stat-label">Tổng doanh thu</div>
              <div className="admin-stat-value">
                {fmtMoney(summary.tong_doanh_thu)} đ
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Hoa hồng sàn</div>
              <div className="admin-stat-value">
                {fmtMoney(summary.tong_hoa_hong_san)} đ
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Hoa hồng NPP</div>
              <div className="admin-stat-value">
                {fmtMoney(summary.tong_hoa_hong_npp)} đ
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Số đơn hoàn thành</div>
              <div className="admin-stat-value">{summary.tong_don || 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Tổng số lượng bán</div>
              <div className="admin-stat-value">
                {summary.tong_so_luong || 0}
              </div>
            </div>
          </div>
        )}

        <h2 className="admin-title-h2">Doanh thu theo Nhà phân phối</h2>

        <table className="admin-table">
          <thead>
            <tr className="admin-thead-row">
              <th className="admin-th">#</th>
              <th className="admin-th">Nhà phân phối</th>
              <th className="admin-th">Email</th>
              <th className="admin-th">Số đơn</th>
              <th className="admin-th">Doanh thu</th>
              <th className="admin-th">Hoa hồng sàn</th>
              <th className="admin-th">Hoa hồng NPP</th>
            </tr>
          </thead>
          <tbody>
            {byNPP.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  Chưa có dữ liệu trong khoảng thời gian này.
                </td>
              </tr>
            )}

            {byNPP.map((row, idx) => (
              <tr key={row.nha_phan_phoi_id || idx}>
                <td className="admin-td">{idx + 1}</td>
                <td className="admin-td">{row.ten_npp || row.ten_don_vi}</td>
                <td className="admin-td">{row.email}</td>
                <td className="admin-td">{row.so_don || 0}</td>
                <td className="admin-td">{fmtMoney(row.doanh_thu)} đ</td>
                <td className="admin-td">{fmtMoney(row.hoa_hong_san)} đ</td>
                <td className="admin-td">{fmtMoney(row.hoa_hong_npp)} đ</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="admin-title-h2" style={{ marginTop: 32 }}>
          Doanh thu theo sản phẩm
        </h2>

        <table className="admin-table">
          <thead>
            <tr className="admin-thead-row">
              <th className="admin-th">#</th>
              <th className="admin-th">Sản phẩm</th>
              <th className="admin-th">Nhà phân phối</th>
              <th className="admin-th">Số lượng bán</th>
              <th className="admin-th">Doanh thu</th>
              <th className="admin-th">% hoa hồng sàn</th>
              <th className="admin-th">Hoa hồng sàn</th>
              <th className="admin-th">Hoa hồng NPP</th>
            </tr>
          </thead>
          <tbody>
            {byProduct.length === 0 && (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  Chưa có dữ liệu trong khoảng thời gian này.
                </td>
              </tr>
            )}

            {byProduct.map((row, idx) => (
              <tr key={row.san_pham_id || idx}>
                <td className="admin-td">{idx + 1}</td>
                <td className="admin-td">{row.ten_san_pham}</td>
                <td className="admin-td">{row.ten_npp || row.ten_don_vi}</td>
                <td className="admin-td">{row.tong_so_luong || 0}</td>
                <td className="admin-td">{fmtMoney(row.tong_doanh_thu)} đ</td>
                <td className="admin-td">
                  {row.ty_le_hoa_hong_san != null
                    ? `${row.ty_le_hoa_hong_san}%`
                    : '-'}
                </td>
                <td className="admin-td">{fmtMoney(row.hoa_hong_san)} đ</td>
                <td className="admin-td">{fmtMoney(row.hoa_hong_npp)} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </AdminLayout>
  )
}
