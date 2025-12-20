import { useEffect, useState } from 'react'
import api from '../../services/api'
import './User.css' 

export default function DanhGiaSanPham({ productId }) {
  const [data, setData] = useState({ reviews: [], stats: null })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [starFilter, setStarFilter] = useState(0) // 0 = tất cả
  const [onlyContent, setOnlyContent] = useState(false)

  // form gửi đánh giá
  const [myStar, setMyStar] = useState(5)
  const [myTitle, setMyTitle] = useState('')
  const [myContent, setMyContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postMsg, setPostMsg] = useState('')

  const isLogin = !!localStorage.getItem('token')

  const loadReviews = async () => {
    if (!productId) return
    try {
      setLoading(true)
      setMsg('')

      const res = await api.get(`/danh-gia/san-pham/${productId}`, {
        params: {
          star: starFilter || undefined,
          has_content: onlyContent ? 1 : undefined,
        },
      })

      setData({
        reviews: res.data?.reviews || [],
        stats: res.data?.stats || null,
      })
    } catch (err) {
      console.error('Lỗi load đánh giá:', err)
      setMsg(
        err.response?.data?.message ||
          'Không tải được danh sách đánh giá sản phẩm.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, starFilter, onlyContent])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setPostMsg('')

    if (!isLogin) {
      setPostMsg('Bạn cần đăng nhập để đánh giá sản phẩm.')
      return
    }

    if (!myStar) {
      setPostMsg('Vui lòng chọn số sao.')
      return
    }

    try {
      setPosting(true)
      const body = {
        san_pham_id: productId,
        so_sao: myStar,
        tieu_de: myTitle || null,
        noi_dung: myContent || null,
      }

      const res = await api.post('/danh-gia', body)
      setPostMsg(res.data?.message || 'Gửi đánh giá thành công.')
      setMyTitle('')
      setMyContent('')

      loadReviews()
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err)
      setPostMsg(
        err.response?.data?.message ||
          'Không gửi được đánh giá. Có thể bạn chưa mua sản phẩm này.'
      )
    } finally {
      setPosting(false)
    }
  }

  const stats = data.stats || {}
  const total = Number(stats.total || 0)

const avg = (() => {
  const n = Number(stats.avg_star)
  if (!Number.isFinite(n) || n <= 0) return '0.0'
  return n.toFixed(1)
})()


  return (
    <section className="pr-section">
      <h2 className="pr-title">Đánh giá sản phẩm</h2>

      <div className="pr-summary-row">
        <div className="pr-summary-left">
          <div className="pr-summary-score">
            <span className="big">{avg}</span>
            <span className="slash">/5</span>
          </div>
          <div className="pr-summary-stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  i <= Math.round(stats.avg_star || 0)
                    ? 'pr-star pr-star-active'
                    : 'pr-star'
                }
              >
                ★
              </span>
            ))}
          </div>
          <div className="pr-summary-total">{total} đánh giá</div>
        </div>

        <div className="pr-summary-right">
          {[5, 4, 3, 2, 1].map((s) => {
            const count = stats[`star${s}`] || 0
            const percent = total ? Math.round((count / total) * 100) : 0
            return (
              <button
                key={s}
                type="button"
                className={
                  'pr-filter-chip ' + (starFilter === s ? 'pr-filter-active' : '')
                }
                onClick={() => setStarFilter(starFilter === s ? 0 : s)}
              >
                <span>{s} Sao</span>
                <div className="pr-filter-bar">
                  <div
                    className="pr-filter-bar-inner"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="pr-filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pr-tabs">
        <button
          type="button"
          className={
            'pr-tab ' + (starFilter === 0 && !onlyContent ? 'pr-tab-active' : '')
          }
          onClick={() => {
            setStarFilter(0)
            setOnlyContent(false)
          }}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            type="button"
            className={'pr-tab ' + (starFilter === s ? 'pr-tab-active' : '')}
            onClick={() => setStarFilter(starFilter === s ? 0 : s)}
          >
            {s} Sao ({stats[`star${s}`] || 0})
          </button>
        ))}
        <button
          type="button"
          className={'pr-tab ' + (onlyContent ? 'pr-tab-active' : '')}
          onClick={() => setOnlyContent(!onlyContent)}
        >
          Có bình luận ({stats.with_content || 0})
        </button>
      </div>

      {loading && <p>Đang tải đánh giá...</p>}
      {msg && <p className="pr-error">{msg}</p>}

      {!loading && !msg && data.reviews.length === 0 && (
        <p className="pr-empty">Chưa có đánh giá nào.</p>
      )}

      <div className="pr-list">
        {data.reviews.map((r) => (
          <div key={r.danh_gia_id} className="pr-item">
            <div className="pr-item-header">
              <div className="pr-avatar">
                {r.ten_khach ? r.ten_khach[0].toUpperCase() : 'U'}
              </div>
              <div className="pr-item-info">
                <div className="pr-name">
                  {r.ten_khach || 'Khách ẩn danh'}
                </div>
                <div className="pr-stars-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={
                        i <= r.so_sao ? 'pr-star pr-star-active' : 'pr-star'
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="pr-time">
                  {r.ngay_danh_gia
                    ? new Date(r.ngay_danh_gia).toLocaleString('vi-VN')
                    : ''}
                </div>
              </div>
            </div>

            {r.tieu_de && <div className="pr-title-text">{r.tieu_de}</div>}
            {r.noi_dung && <div className="pr-content-text">{r.noi_dung}</div>}
          </div>
        ))}
      </div>

      <div className="pr-form-wrapper">
        <h3>Viết đánh giá của bạn</h3>
        {!isLogin && (
          <p className="pr-error">
            Bạn cần đăng nhập (tài khoản khách hàng) và đã mua sản phẩm để
            được đánh giá.
          </p>
        )}

        <form onSubmit={handleSubmitReview} className="pr-form">
          <div className="pr-form-row">
            <span>Chọn số sao:</span>
            <div className="pr-stars-row pr-stars-select">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={
                    i <= myStar
                      ? 'pr-star pr-star-active clickable'
                      : 'pr-star clickable'
                  }
                  onClick={() => setMyStar(i)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="pr-form-row">
            <input
              type="text"
              placeholder="Tiêu đề (tùy chọn)"
              value={myTitle}
              onChange={(e) => setMyTitle(e.target.value)}
              className="pr-input"
            />
          </div>

          <div className="pr-form-row">
            <textarea
              rows={3}
              placeholder="Chia sẻ thêm cảm nhận của bạn về sản phẩm..."
              value={myContent}
              onChange={(e) => setMyContent(e.target.value)}
              className="pr-textarea"
            />
          </div>

          <button
            type="submit"
            className="pr-submit-btn"
            disabled={posting || !isLogin}
          >
            {posting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>

          {postMsg && <p className="pr-post-msg">{postMsg}</p>}
        </form>
      </div>
    </section>
  )
}
