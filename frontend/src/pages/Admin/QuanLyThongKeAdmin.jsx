import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import './Admin.css'
import AdminLayout from './AdminLayout'

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

export default function QuanLyThongKeAdmin() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null) // tổng quan
  const [byNPP, setByNPP] = useState([]) // theo nhà phân phối
  const [byProduct, setByProduct] = useState([]) // theo sản phẩm

  // ✅ chart controls
  const [nppMetric, setNppMetric] = useState('doanh_thu') // doanh_thu | so_don | hoa_hong_san | hoa_hong_npp
  const [nppTopN, setNppTopN] = useState(10)

  const [productMetric, setProductMetric] = useState('tong_doanh_thu') // tong_doanh_thu | tong_so_luong | hoa_hong_san | hoa_hong_npp
  const [productTopN, setProductTopN] = useState(10)

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

  // =========================
  // ✅ CHART: Top NPP
  // =========================
  const topNppList = useMemo(() => {
    const arr = Array.isArray(byNPP) ? [...byNPP] : []
    const key = nppMetric

    arr.sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))
    const n = Math.max(3, Math.min(30, Number(nppTopN) || 10))
    return arr.slice(0, n)
  }, [byNPP, nppMetric, nppTopN])

  const nppBarData = useMemo(() => {
    const labels = topNppList.map((x) => x.ten_npp || x.ten_don_vi || '---')
    const data = topNppList.map((x) => Number(x[nppMetric] || 0))

    const labelMap = {
      doanh_thu: 'Doanh thu',
      so_don: 'Số đơn',
      hoa_hong_san: 'Hoa hồng sàn',
      hoa_hong_npp: 'Hoa hồng NPP',
    }

    return {
      labels,
      datasets: [
        {
          label: labelMap[nppMetric] || 'Chỉ số',
          data,
          borderWidth: 1,
        },
      ],
    }
  }, [topNppList, nppMetric])

  const nppBarOptions = useMemo(() => {
    const moneyMetrics = ['doanh_thu', 'hoa_hong_san', 'hoa_hong_npp']
    const isMoney = moneyMetrics.includes(nppMetric)

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: `Top ${topNppList.length} NPP theo ${
            nppMetric === 'doanh_thu'
              ? 'DOANH THU'
              : nppMetric === 'so_don'
              ? 'SỐ ĐƠN'
              : nppMetric === 'hoa_hong_san'
              ? 'HOA HỒNG SÀN'
              : 'HOA HỒNG NPP'
          }`,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              if (!isMoney) return ` ${v} đơn`
              return ` ${fmtMoney(v)} đ`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 },
        },
        y: {
          ticks: {
            callback: (value) => (isMoney ? fmtMoney(value) : value),
          },
        },
      },
    }
  }, [nppMetric, topNppList.length])

  const nppDoughnutData = useMemo(() => {
    const arr = Array.isArray(byNPP) ? [...byNPP] : []
    arr.sort((a, b) => Number(b.doanh_thu || 0) - Number(a.doanh_thu || 0))

    const top = arr.slice(0, 6)
    const rest = arr.slice(6)

    const labels = top.map((x) => x.ten_npp || x.ten_don_vi || '---')
    const values = top.map((x) => Number(x.doanh_thu || 0))

    const restSum = rest.reduce((s, x) => s + Number(x.doanh_thu || 0), 0)
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
  }, [byNPP])

  const doughnutOptionsMoney = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${fmtMoney(ctx.parsed)} đ`,
          },
        },
      },
    }
  }, [])

  // =========================
  // ✅ CHART: Top Product
  // =========================
  const topProductList = useMemo(() => {
    const arr = Array.isArray(byProduct) ? [...byProduct] : []
    const key = productMetric
    arr.sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))
    const n = Math.max(3, Math.min(30, Number(productTopN) || 10))
    return arr.slice(0, n)
  }, [byProduct, productMetric, productTopN])

  const productBarData = useMemo(() => {
    const labels = topProductList.map((x) => x.ten_san_pham || '---')
    const data = topProductList.map((x) => Number(x[productMetric] || 0))

    const labelMap = {
      tong_doanh_thu: 'Doanh thu',
      tong_so_luong: 'Số lượng bán',
      hoa_hong_san: 'Hoa hồng sàn',
      hoa_hong_npp: 'Hoa hồng NPP',
    }

    return {
      labels,
      datasets: [
        {
          label: labelMap[productMetric] || 'Chỉ số',
          data,
          borderWidth: 1,
        },
      ],
    }
  }, [topProductList, productMetric])

  const productBarOptions = useMemo(() => {
    const isMoney = ['tong_doanh_thu', 'hoa_hong_san', 'hoa_hong_npp'].includes(
      productMetric
    )

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: `Top ${topProductList.length} sản phẩm theo ${
            productMetric === 'tong_doanh_thu'
              ? 'DOANH THU'
              : productMetric === 'tong_so_luong'
              ? 'SỐ LƯỢNG'
              : productMetric === 'hoa_hong_san'
              ? 'HOA HỒNG SÀN'
              : 'HOA HỒNG NPP'
          }`,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              if (!isMoney) return ` ${v} sản phẩm`
              return ` ${fmtMoney(v)} đ`
            },
          },
        },
      },
      scales: {
        x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } },
        y: {
          ticks: {
            callback: (value) => (isMoney ? fmtMoney(value) : value),
          },
        },
      },
    }
  }, [productMetric, topProductList.length])

  const productDoughnutData = useMemo(() => {
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

          {/* ✅ BIỂU ĐỒ: THEO NPP */}
          <div className="admin-card" style={{ padding: 14, marginBottom: 18 }}>
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
                Biểu đồ theo Nhà phân phối
              </h2>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <label className="admin-label">Chỉ số</label>
                  <select
                    className="admin-input"
                    value={nppMetric}
                    onChange={(e) => setNppMetric(e.target.value)}
                  >
                    <option value="doanh_thu">Doanh thu</option>
                    <option value="so_don">Số đơn</option>
                    <option value="hoa_hong_san">Hoa hồng sàn</option>
                    <option value="hoa_hong_npp">Hoa hồng NPP</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Top</label>
                  <select
                    className="admin-input"
                    value={nppTopN}
                    onChange={(e) => setNppTopN(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>

            {(!byNPP || byNPP.length === 0) ? (
              <div className="admin-table-empty">Chưa có dữ liệu để vẽ biểu đồ.</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: 14,
                }}
              >
                <div style={{ height: 360 }}>
                  <Bar data={nppBarData} options={nppBarOptions} />
                </div>

                <div style={{ height: 360 }}>
                  <Doughnut
                    data={nppDoughnutData}
                    options={{
                      ...doughnutOptionsMoney,
                      plugins: {
                        ...doughnutOptionsMoney.plugins,
                        title: {
                          display: true,
                          text: 'Tỉ trọng DOANH THU theo NPP (Top 6)',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

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

          {/* ✅ BIỂU ĐỒ: THEO SẢN PHẨM */}
          <div className="admin-card" style={{ padding: 14, margin: '18px 0' }}>
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
                Biểu đồ theo Sản phẩm
              </h2>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <label className="admin-label">Chỉ số</label>
                  <select
                    className="admin-input"
                    value={productMetric}
                    onChange={(e) => setProductMetric(e.target.value)}
                  >
                    <option value="tong_doanh_thu">Doanh thu</option>
                    <option value="tong_so_luong">Số lượng bán</option>
                    <option value="hoa_hong_san">Hoa hồng sàn</option>
                    <option value="hoa_hong_npp">Hoa hồng NPP</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Top</label>
                  <select
                    className="admin-input"
                    value={productTopN}
                    onChange={(e) => setProductTopN(Number(e.target.value))}
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
              <div className="admin-table-empty">Chưa có dữ liệu để vẽ biểu đồ.</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: 14,
                }}
              >
                <div style={{ height: 360 }}>
                  <Bar data={productBarData} options={productBarOptions} />
                </div>

                <div style={{ height: 360 }}>
                  <Doughnut
                    data={productDoughnutData}
                    options={{
                      ...doughnutOptionsMoney,
                      plugins: {
                        ...doughnutOptionsMoney.plugins,
                        title: {
                          display: true,
                          text: 'Tỉ trọng DOANH THU theo Sản phẩm (Top 6)',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

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
