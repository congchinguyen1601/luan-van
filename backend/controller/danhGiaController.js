import pool from '../db.js'
const getUserId = (req) => {
  return req.user?.tai_khoan_id ?? req.user?.id
}


  // USER TẠO ĐÁNH GIÁ
export const createDanhGia = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Không xác định được tài khoản người dùng' })
    }

    const { san_pham_id, so_sao, tieu_de = '', noi_dung = '' } = req.body

    if (!san_pham_id || !so_sao) {
      return res
        .status(400)
        .json({ message: 'Thiếu sản phẩm hoặc số sao đánh giá' })
    }

  
    const [rowsCheck] = await pool.query(
      `
      SELECT 1
      FROM chi_tiet_don_hang ctdh
      JOIN don_hang dh ON ctdh.don_hang_id = dh.don_hang_id
      WHERE dh.tai_khoan_id = ?
        AND ctdh.san_pham_id = ?
        AND dh.trang_thai_don_hang = 'Hoàn thành'
      LIMIT 1
      `,
      [userId, san_pham_id]
    )

    if (!rowsCheck.length) {
      return res.status(400).json({
        message:
          'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn thành.',
      })
    }

    const [rowsExist] = await pool.query(
      `
      SELECT 1
      FROM danh_gia
      WHERE san_pham_id = ?
        AND tai_khoan_id = ?
      LIMIT 1
      `,
      [san_pham_id, userId]
    )

    if (rowsExist.length) {
      return res
        .status(400)
        .json({ message: 'Bạn đã đánh giá sản phẩm này rồi.' })
    }

    const [result] = await pool.query(
      `
      INSERT INTO danh_gia (
        san_pham_id,
        tai_khoan_id,
        so_sao,
        tieu_de,
        noi_dung,
        ngay_danh_gia,
        trang_thai
      )
      VALUES (?, ?, ?, ?, ?, NOW(), 1)
      `,
      [san_pham_id, userId, so_sao, tieu_de, noi_dung]
    )

    const [rows] = await pool.query(
      `SELECT * FROM danh_gia WHERE danh_gia_id = ?`,
      [result.insertId]
    )

    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('createDanhGia error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi tạo đánh giá sản phẩm' })
  }
}

export const getDanhGiaSanPham = async (req, res) => {
  const { id } = req.params         // san_pham_id
  const { star, has_content } = req.query 

  try {
    let where = `WHERE dg.san_pham_id = ? AND dg.trang_thai = b'1'`
    const params = [id]

    if (star) {
      where += ' AND dg.so_sao = ?'
      params.push(Number(star))
    }

    if (has_content === '1') {
      where += ` AND dg.noi_dung IS NOT NULL AND dg.noi_dung <> ''`
    }

    const [reviews] = await pool.query(
      `
      SELECT
        dg.danh_gia_id,
        dg.san_pham_id,
        dg.tai_khoan_id,
        dg.so_sao,
        dg.tieu_de,
        dg.noi_dung,
        dg.ngay_danh_gia,
        tk.ho_ten AS ten_khach
      FROM danh_gia dg
      LEFT JOIN tai_khoan tk
        ON dg.tai_khoan_id = tk.tai_khoan_id
      ${where}
      ORDER BY dg.ngay_danh_gia DESC
      `,
      params
    )

    // thống kê tổng quan 
    const [statRows] = await pool.query(
      `
      SELECT
        COUNT(*)                                           AS total,
        AVG(so_sao)                                        AS avg_star,
        SUM(CASE WHEN so_sao = 5 THEN 1 ELSE 0 END)        AS star5,
        SUM(CASE WHEN so_sao = 4 THEN 1 ELSE 0 END)        AS star4,
        SUM(CASE WHEN so_sao = 3 THEN 1 ELSE 0 END)        AS star3,
        SUM(CASE WHEN so_sao = 2 THEN 1 ELSE 0 END)        AS star2,
        SUM(CASE WHEN so_sao = 1 THEN 1 ELSE 0 END)        AS star1,
        SUM(
          CASE
            WHEN noi_dung IS NOT NULL AND noi_dung <> '' THEN 1
            ELSE 0
          END
        )                                                 AS with_content
      FROM danh_gia
      WHERE san_pham_id = ? AND trang_thai = b'1'
      `,
      [id]
    )

    const stats =
      statRows[0] || {
        total: 0,
        avg_star: 0,
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0,
        with_content: 0,
      }

    return res.json({ reviews, stats })
  } catch (err) {
    console.error('Lỗi getDanhGiaSanPham:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi lấy đánh giá sản phẩm' })
  }
}


   // NPP – XEM ĐÁNH GIÁ CÁC SẢN PHẨM CỦA MÌNH
export const getDanhGiaNPP = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    // Lấy thông tin NPP từ tài khoản
    const [nppRows] = await pool.query(
      `
      SELECT nha_phan_phoi_id, ten_don_vi
      FROM nha_phan_phoi
      WHERE tai_khoan_id = ?
      `,
      [userId]
    )

    if (!nppRows.length) {
      return res
        .status(403)
        .json({ message: 'Tài khoản này không phải Nhà phân phối' })
    }

    const npp = nppRows[0]
    const nppId = npp.nha_phan_phoi_id

    // Lấy tất cả đánh giá của các sản phẩm thuộc NPP này
    const [rows] = await pool.query(
      `
      SELECT
        dg.danh_gia_id,
        dg.san_pham_id,
        sp.ten_san_pham,
        dg.so_sao,
        dg.tieu_de,
        dg.noi_dung,
        dg.ngay_danh_gia,
        tk.ho_ten AS ten_khach
      FROM danh_gia dg
      JOIN san_pham sp
        ON dg.san_pham_id = sp.san_pham_id
      LEFT JOIN tai_khoan tk
        ON dg.tai_khoan_id = tk.tai_khoan_id
      WHERE sp.nha_phan_phoi_id = ?
      ORDER BY dg.ngay_danh_gia DESC
      `,
      [nppId]
    )

    return res.json({
      npp,
      reviews: rows,
    })
  } catch (err) {
    console.error('getDanhGiaNPP error:', err)
    return res.status(500).json({
      message: 'Lỗi server khi lấy đánh giá cho Nhà phân phối',
    })
  }
}

export const getDanhGiaAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        dg.danh_gia_id,
        dg.san_pham_id,
        sp.ten_san_pham,
        dg.so_sao,
        dg.tieu_de,
        dg.noi_dung,
        dg.ngay_danh_gia,
        dg.trang_thai,
        tk.ho_ten AS ten_khach,
        npp.ten_don_vi AS ten_npp
      FROM danh_gia dg
      JOIN san_pham sp
        ON dg.san_pham_id = sp.san_pham_id
      LEFT JOIN tai_khoan tk
        ON dg.tai_khoan_id = tk.tai_khoan_id
      LEFT JOIN nha_phan_phoi npp
        ON sp.nha_phan_phoi_id = npp.nha_phan_phoi_id
      ORDER BY dg.ngay_danh_gia DESC
      `
    )

    return res.json({ reviews: rows })
  } catch (err) {
    console.error('getDanhGiaAdmin error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách đánh giá (Admin)' })
  }
}


export const updateTrangThaiDanhGia = async (req, res) => {
  try {
    const { id } = req.params
    let { trang_thai } = req.body

    trang_thai = Number(trang_thai) === 1 ? 1 : 0

    await pool.query(
      `
      UPDATE danh_gia
      SET trang_thai = ?
      WHERE danh_gia_id = ?
      `,
      [trang_thai, id]
    )

    const [rows] = await pool.query(
      `SELECT * FROM danh_gia WHERE danh_gia_id = ?`,
      [id]
    )

    return res.json({
      message: 'Cập nhật trạng thái đánh giá thành công',
      review: rows[0],
    })
  } catch (err) {
    console.error('updateTrangThaiDanhGia error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi cập nhật trạng thái đánh giá' })
  }
}
