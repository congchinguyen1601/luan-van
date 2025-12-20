import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import '../Admin/Admin.css'
import NppLayout from './NPPLayout'

export default function QuanLyDanhGiaNPP() {
  const [data, setData] = useState({ npp: null, reviews: [] })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // UI state (không đổi logic backend)
  const [q, setQ] = useState('')
  const [starFilter, setStarFilter] = useState('ALL') 
  const [sortBy, setSortBy] = useState('newest') 

  useEffect(() => {
    const token = localStorage.getItem('token')
    setLoading(true)
    setMsg('')
    api
      .get('/danh-gia/npp', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) =>
        setMsg(err.response?.data?.message || 'Lỗi tải đánh giá')
      )
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const list = Array.isArray(data.reviews) ? data.reviews : []
    const total = list.length
    const avg =
      total === 0
        ? 0
        : list.reduce((s, r) => s + Number(r.so_sao || 0), 0) / total

    const byStar = [1, 2, 3, 4, 5].reduce((acc, s) => {
      acc[s] = list.filter((r) => Number(r.so_sao) === s).length
      return acc
    }, {})

    return { total, avg, byStar }
  }, [data.reviews])

  const filtered = useMemo(() => {
    const list = Array.isArray(data.reviews) ? [...data.reviews] : []

    const keyword = (q || '').trim().toLowerCase()
    let out = list

    if (keyword) {
      out = out.filter((r) => {
        const sp = String(r.ten_san_pham || '').toLowerCase()
        const kh = String(r.ten_khach || '').toLowerCase()
        const nd = String(r.noi_dung || '').toLowerCase()
        return sp.includes(keyword) || kh.includes(keyword) || nd.includes(keyword)
      })
    }

    if (starFilter !== 'ALL') {
      const sf = Number(starFilter)
      out = out.filter((r) => Number(r.so_sao) === sf)
    }

    out.sort((a, b) => {
      const da = new Date(a.ngay_danh_gia || 0).getTime()
      const db = new Date(b.ngay_danh_gia || 0).getTime()
      const sa = Number(a.so_sao || 0)
      const sb = Number(b.so_sao || 0)

      if (sortBy === 'newest') return db - da
      if (sortBy === 'oldest') return da - db
      if (sortBy === 'stars_desc') return sb - sa || db - da
      if (sortBy === 'stars_asc') return sa - sb || db - da
      return 0
    })

    return out
  }, [data.reviews, q, starFilter, sortBy])

  const renderStars = (n) => {
    const s = Number(n || 0)
    return (
      <span className="rv-stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < s ? 'rv-star on' : 'rv-star'}>
            ★
          </span>
        ))}
        <span className="rv-star-num">{s}/5</span>
      </span>
    )
  }

  return (
    <NppLayout title="Quản lý đánh giá">
      <div className="rv-page">
        <div className="rv-header">
          <div>
            <h2 className="rv-title">Đánh giá sản phẩm</h2>
            <p className="rv-sub">
              {data.npp ? (
                <>
                  Nhà phân phối: <b>{data.npp.ten_don_vi}</b>
                </>
              ) : (
                'Xem tổng hợp đánh giá từ khách hàng'
              )}
            </p>
          </div>

          <div className="rv-badges">
            <div className="rv-badge">
              <div className="rv-badge-label">Tổng đánh giá</div>
              <div className="rv-badge-val">{stats.total}</div>
            </div>
            <div className="rv-badge">
              <div className="rv-badge-label">Điểm trung bình</div>
              <div className="rv-badge-val">
                {stats.avg.toFixed(1)}
                <span className="rv-badge-suffix">/5</span>
              </div>
            </div>
          </div>
        </div>

        {msg && <div className="rv-alert">{msg}</div>}

        <div className="rv-toolbar">
          <div className="rv-search">
            <span className="rv-search-icon">🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo sản phẩm / khách hàng / nội dung..."
            />
            {q && (
              <button className="rv-chip" onClick={() => setQ('')} type="button">
                Xoá
              </button>
            )}
          </div>

          <div className="rv-filters">
            <select
              className="rv-select"
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
            >
              <option value="ALL">Tất cả sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>

            <select
              className="rv-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="stars_desc">Sao giảm dần</option>
              <option value="stars_asc">Sao tăng dần</option>
            </select>
          </div>
        </div>

        <div className="rv-summary">
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              className={`rv-summary-item ${String(starFilter) === String(s) ? 'active' : ''}`}
              onClick={() => setStarFilter(String(s))}
              title={`Lọc ${s} sao`}
            >
              <span className="rv-summary-star">{s}★</span>
              <span className="rv-summary-count">{stats.byStar?.[s] ?? 0}</span>
            </button>
          ))}
          <button
            type="button"
            className={`rv-summary-item ${starFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStarFilter('ALL')}
            title="Bỏ lọc"
          >
            <span className="rv-summary-star">Tất cả</span>
            <span className="rv-summary-count">{stats.total}</span>
          </button>
        </div>

        <div className="rv-table-wrap">
          <table className="rv-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Sản phẩm</th>
                <th>Khách hàng</th>
                <th style={{ width: 160 }}>Số sao</th>
                <th>Nội dung</th>
                <th style={{ width: 170 }}>Ngày</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 18 }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 18 }}>
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => (
                  <tr key={r.danh_gia_id}>
                    <td>
                      <span className="rv-id">#{r.danh_gia_id}</span>
                    </td>
                    <td>
                      <div className="rv-cell-title">{r.ten_san_pham}</div>
                    </td>
                    <td>
                      <div className="rv-cell-sub">{r.ten_khach}</div>
                    </td>
                    <td>{renderStars(r.so_sao)}</td>
                    <td>
                      <div className="rv-content">{r.noi_dung || '—'}</div>
                    </td>
                    <td>
                      {r.ngay_danh_gia
                        ? new Date(r.ngay_danh_gia).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </NppLayout>
  )
}
