import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import '../Admin/Admin.css'
import NppLayout from './NPPLayout'

// ✅ Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function QuanLyThongKeNPP() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null)
  const [byProduct, setByProduct] = useState([])

  // ✅ chart controls
  const [metric, setMetric] = useState('doanh_thu') // 'doanh_thu' | 'so_luong'
  const [topN, setTopN] = useState(10)

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

      const [resSummary, resProduct] = await Promise.all([
        api.get('/thong-ke/npp/tong-quan', { params, headers }),
        api.get('/thong-ke/npp/theo-san-pham', { params, headers }),
      ])

      setSummary(resSummary.data || null)
      setByProduct(resProduct.data?.list || [])
    } catch (err) {
      console.error('Lỗi load thống kê NPP:', err)
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
        'http://localhost:4000/api/thong-ke/npp/export-pdf' +
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
      console.error('Export NPP PDF error:', err)
      alert('Không xuất được PDF. Vui lòng thử lại.')
    }
  }

  const fmtMoney = (v) =>
    Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })

  // =========================
  // ✅ Chart Data (Top N)
  // =========================
  const topList = useMemo(() => {
    const arr = Array.isArray(byProduct) ? [...byProduct] : []
    if (metric === 'so_luong') {
      arr.sort(
        (a, b) => Number(b.tong_so_luong || 0) - Number(a.tong_so_luong || 0)
      )
    } else {
      arr.sort(
        (a, b) => Number(b.tong_doanh_thu || 0) - Number(a.tong_doanh_thu || 0)
      )
    }
    return arr.slice(0, Math.max(3, Math.min(30, Number(topN) || 10)))
  }, [byProduct, metric, topN])

  const barChartData = useMemo(() => {
    const labels = topList.map((x) => x.ten_san_pham || '---')
    const data =
      metric === 'so_luong'
        ? topList.map((x) => Number(x.tong_so_luong || 0))
        : topList.map((x) => Number(x.tong_doanh_thu || 0))

    return {
      labels,
      datasets: [
        {
          label: metric === 'so_luong' ? 'Số lượng bán' : 'Doanh thu',
          data,
          borderWidth: 1,
        },
      ],
    }
  }, [topList, metric])

  const barOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text:
            metric === 'so_luong'
              ? `Top ${topList.length} sản phẩm theo SỐ LƯỢNG`
              : `Top ${topList.length} sản phẩm theo DOANH THU`,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              if (metric === 'so_luong') return ` ${v} sản phẩm`
              return ` ${fmtMoney(v)} đ`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          ticks: {
            callback: (value) => {
              if (metric === 'so_luong') return value
              return fmtMoney(value)
            },
          },
        },
      },
    }
  }, [metric, topList.length])

  // Doughnut: phân bổ doanh thu (top 6 + Khác)
  const doughnutData = useMemo(() => {
    const arr = Array.isArray(byProduct) ? [...byProduct] : []
    arr.sort(
      (a, b) => Number(b.tong_doanh_thu || 0) - Number(a.tong_doanh_thu || 0)
    )

    const top = arr.slice(0, 6)
    const rest = arr.slice(6)

    const labels = top.map((x) => x.ten_san_pham || '---')
    const values = top.map((x) => Number(x.tong_doanh_thu || 0))

    const restSum = rest.reduce((s, x) => s + Number(x.tong_doanh_thu || 0), 0)
    if (restSum > 0) {
      labels.push('Khác')
      values.push(restSum)
    }

    return {
      labels,
      datasets: [
        {
          label: 'Doanh thu',
          data: values,
          borderWidth: 1,
        },
      ],
    }
  }, [byProduct])

  const doughnutOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Tỉ trọng doanh thu theo sản phẩm (Top 6)' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed
              return ` ${fmtMoney(v)} đ`
            },
          },
        },
      },
    }
  }, [])

  return (
    <NppLayout title="Quản lý thống kê (Nhà phân phối)">
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
                <div className="admin-stat-label">Doanh thu của shop</div>
                <div className="admin-stat-value">
                  {fmtMoney(summary.tong_doanh_thu)} đ
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Hoa hồng của NPP</div>
                <div className="admin-stat-value">
                  {fmtMoney(summary.tong_hoa_hong_npp)} đ
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Hoa hồng sàn phải trả</div>
                <div className="admin-stat-value">
                  {fmtMoney(summary.tong_hoa_hong_san)} đ
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Số đơn hoàn thành</div>
                <div className="admin-stat-value">{summary.tong_don || 0}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Tổng số lượng bán</div>
                <div className="admin-stat-value">{summary.tong_so_luong || 0}</div>
              </div>
            </div>
          )}

          {/* ✅ BIỂU ĐỒ */}
          <div
            className="admin-card"
            style={{ padding: 14, marginBottom: 18 }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="admin-title-h2" style={{ margin: 0 }}>
                Biểu đồ thống kê
              </h2>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <label className="admin-label">Chỉ số</label>
                  <select
                    className="admin-input"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                  >
                    <option value="doanh_thu">Doanh thu</option>
                    <option value="so_luong">Số lượng bán</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Top</label>
                  <select
                    className="admin-input"
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>

            {(!byProduct || byProduct.length === 0) ? (
              <div className="admin-table-empty">
                Chưa có dữ liệu để vẽ biểu đồ.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: 14,
                }}
              >
                <div style={{ height: 360 }}>
                  <Bar data={barChartData} options={barOptions} />
                </div>

                <div style={{ height: 360 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            )}
          </div>

          <h2 className="admin-title-h2">Doanh thu theo sản phẩm</h2>

          <table className="admin-table">
            <thead>
              <tr className="admin-thead-row">
                <th className="admin-th">#</th>
                <th className="admin-th">Sản phẩm</th>
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
                  <td colSpan={7} className="admin-table-empty">
                    Chưa có dữ liệu trong khoảng thời gian này.
                  </td>
                </tr>
              )}

              {byProduct.map((row, idx) => (
                <tr key={row.san_pham_id || idx}>
                  <td className="admin-td">{idx + 1}</td>
                  <td className="admin-td">{row.ten_san_pham}</td>
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
    </NppLayout>
  )
}
