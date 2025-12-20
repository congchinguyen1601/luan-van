import pool from '../db.js'

const getUserId = (req) => {
  return req.user?.tai_khoan_id ?? req.user?.id ?? null
}


function tinhSoTienGiam(ma, tongTien) {
  let giam = 0

  if (ma.loai === 'PERCENT') {
    giam = Math.round((Number(tongTien) * Number(ma.gia_tri)) / 100)
    if (ma.gia_tri_toi_da && giam > Number(ma.gia_tri_toi_da)) {
      giam = Number(ma.gia_tri_toi_da)
    }
  } else {
    giam = Number(ma.gia_tri)
  }

  if (giam > Number(tongTien)) giam = Number(tongTien)
  if (giam < 0) giam = 0
  return giam
}

export const getAllMaGiamGia = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM ma_giam_gia
      ORDER BY ngay_tao DESC
      `
    )
    res.json(rows)
  } catch (err) {
    console.error('getAllMaGiamGia error:', err)
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách mã giảm giá' })
  }
}

export const getMaGiamGiaById = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `
      SELECT *
      FROM ma_giam_gia
      WHERE ma_giam_gia_id = ?
      `,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error('getMaGiamGiaById error:', err)
    res.status(500).json({ message: 'Lỗi server khi lấy mã giảm giá' })
  }
}

//admin tạo mã giảm giá
export const createMaGiamGia = async (req, res) => {
  try {
    const {
      ma_code,
      ten_chuong_trinh,
      mo_ta,
      loai,
      gia_tri,
      gia_tri_toi_da,
      don_toi_thieu,
      so_luong,
      ngay_bat_dau,
      ngay_ket_thuc,
      trang_thai = 1,
    } = req.body

    if (
      !ma_code ||
      !ten_chuong_trinh ||
      !loai ||
      gia_tri == null ||
      !ngay_bat_dau ||
      !ngay_ket_thuc
    ) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' })
    }

    const [result] = await pool.query(
      `
      INSERT INTO ma_giam_gia (
        ma_code,
        ten_chuong_trinh,
        mo_ta,
        loai,
        gia_tri,
        gia_tri_toi_da,
        don_toi_thieu,
        so_luong,
        ngay_bat_dau,
        ngay_ket_thuc,
        trang_thai
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(ma_code).trim().toUpperCase(),
        ten_chuong_trinh,
        mo_ta || null,
        loai,
        gia_tri,
        gia_tri_toi_da || null,
        don_toi_thieu || 0,
        so_luong || 0, 
        ngay_bat_dau,
        ngay_ket_thuc,
        trang_thai,
      ]
    )

    const [rows] = await pool.query(
      `SELECT * FROM ma_giam_gia WHERE ma_giam_gia_id = ?`,
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('createMaGiamGia error:', err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Mã code đã tồn tại' })
    }
    res.status(500).json({ message: 'Lỗi server khi tạo mã giảm giá' })
  }
}

export const updateMaGiamGia = async (req, res) => {
  try {
    const { id } = req.params
    const {
      ma_code,
      ten_chuong_trinh,
      mo_ta,
      loai,
      gia_tri,
      gia_tri_toi_da,
      don_toi_thieu,
      so_luong,
      ngay_bat_dau,
      ngay_ket_thuc,
      trang_thai,
    } = req.body

    const [existRows] = await pool.query(
      `SELECT * FROM ma_giam_gia WHERE ma_giam_gia_id = ?`,
      [id]
    )

    if (!existRows.length) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' })
    }

    await pool.query(
      `
      UPDATE ma_giam_gia
      SET
        ma_code = ?,
        ten_chuong_trinh = ?,
        mo_ta = ?,
        loai = ?,
        gia_tri = ?,
        gia_tri_toi_da = ?,
        don_toi_thieu = ?,
        so_luong = ?,
        ngay_bat_dau = ?,
        ngay_ket_thuc = ?,
        trang_thai = ?
      WHERE ma_giam_gia_id = ?
      `,
      [
        ma_code != null ? String(ma_code).trim().toUpperCase() : existRows[0].ma_code,
        ten_chuong_trinh ?? existRows[0].ten_chuong_trinh,
        mo_ta ?? existRows[0].mo_ta,
        loai ?? existRows[0].loai,
        gia_tri ?? existRows[0].gia_tri,
        gia_tri_toi_da ?? existRows[0].gia_tri_toi_da,
        don_toi_thieu ?? existRows[0].don_toi_thieu,
        so_luong ?? existRows[0].so_luong,
        ngay_bat_dau ?? existRows[0].ngay_bat_dau,
        ngay_ket_thuc ?? existRows[0].ngay_ket_thuc,
        trang_thai ?? existRows[0].trang_thai,
        id,
      ]
    )

    const [rows] = await pool.query(
      `SELECT * FROM ma_giam_gia WHERE ma_giam_gia_id = ?`,
      [id]
    )

    res.json(rows[0])
  } catch (err) {
    console.error('updateMaGiamGia error:', err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Mã code đã tồn tại' })
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật mã giảm giá' })
  }
}


export const deleteMaGiamGia = async (req, res) => {
  try {
    const { id } = req.params

    const [existRows] = await pool.query(
      `SELECT * FROM ma_giam_gia WHERE ma_giam_gia_id = ?`,
      [id]
    )

    if (!existRows.length) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' })
    }

    await pool.query(
      `UPDATE ma_giam_gia SET trang_thai = 0 WHERE ma_giam_gia_id = ?`,
      [id]
    )

    res.json({ message: 'Đã vô hiệu hóa mã giảm giá' })
  } catch (err) {
    console.error('deleteMaGiamGia error:', err)
    res.status(500).json({ message: 'Lỗi server khi xóa mã giảm giá' })
  }
}

export const applyMaGiamGia = async (req, res) => {
  try {
    const { code, tong_tien } = req.body
    const userId = getUserId(req)

    if (!userId) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để dùng mã' })
    }

    const tongTien = Number(tong_tien || 0)
    const maCode = String(code || '').trim().toUpperCase()

    if (!maCode || !tongTien) {
      return res.status(400).json({ message: 'Thiếu mã giảm giá hoặc tổng tiền' })
    }


    const [rows] = await pool.query(
      `
      SELECT *
      FROM ma_giam_gia
      WHERE ma_code = ?
        AND trang_thai = 1
        AND NOW() BETWEEN ngay_bat_dau AND ngay_ket_thuc
      LIMIT 1
      `,
      [maCode]
    )

    if (!rows.length) {
      return res.status(400).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' })
    }
    const ma = rows[0]
    if (Number(ma.so_luong) > 0 && Number(ma.so_luong_da_dung) >= Number(ma.so_luong)) {
      return res.status(400).json({ message: 'Mã giảm giá đã được sử dụng hết' })
    }

    if (tongTien < Number(ma.don_toi_thieu || 0)) {
      return res.status(400).json({
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${Number(
          ma.don_toi_thieu || 0
        ).toLocaleString('vi-VN')} đ để dùng mã này`,
      })
    }
    const [usedRows] = await pool.query(
      `
      SELECT 1
      FROM ma_giam_gia_su_dung
      WHERE ma_giam_gia_id = ?
        AND tai_khoan_id = ?
      LIMIT 1
      `,
      [ma.ma_giam_gia_id, userId]
    )

    if (usedRows.length) {
      return res.status(400).json({ message: 'Bạn đã sử dụng mã giảm giá này rồi' })
    }
    const soTienGiam = tinhSoTienGiam(ma, tongTien)
    const tongSauGiam = tongTien - soTienGiam

    return res.json({
      ok: true,
      ma_giam_gia_id: ma.ma_giam_gia_id,
      ma_code: ma.ma_code,
      so_tien_giam: soTienGiam,
      tong_sau_giam: tongSauGiam,
      message: `Đã áp dụng mã, giảm ${soTienGiam.toLocaleString('vi-VN')} đ`,
    })
  } catch (err) {
    console.error('applyMaGiamGia error:', err)
    res.status(500).json({ message: 'Lỗi server khi áp dụng mã giảm giá' })
  }
}

export const getMyVouchers = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(401).json({ message: 'Không xác định được tài khoản' })

    const tongTien = Number(req.query.tong_tien || 0)

    const [rows] = await pool.query(
      `
      SELECT mg.*
      FROM ma_giam_gia mg
      WHERE (mg.trang_thai IS NULL OR mg.trang_thai = 1)
        AND (mg.ngay_bat_dau IS NULL OR mg.ngay_bat_dau <= NOW())
        AND (mg.ngay_ket_thuc IS NULL OR mg.ngay_ket_thuc >= NOW())
        AND (mg.so_luong IS NULL OR mg.so_luong = 0 OR mg.so_luong_da_dung < mg.so_luong)
        AND NOT EXISTS (
          SELECT 1
          FROM ma_giam_gia_su_dung s
          WHERE s.ma_giam_gia_id = mg.ma_giam_gia_id
            AND s.tai_khoan_id = ?
        )
      ORDER BY mg.ngay_ket_thuc ASC, mg.ma_giam_gia_id DESC
      `,
      [userId]
    )

    let list = rows || []

    if (tongTien > 0) {
      list = list.filter((m) => tongTien >= Number(m.don_toi_thieu || 0))
    }

    list = list.map((m) => ({
      ...m,
      so_tien_giam_du_kien: tongTien > 0 ? tinhSoTienGiam(m, tongTien) : 0,
    }))

    return res.json({ ok: true, list })
  } catch (err) {
    console.error('getMyVouchers error:', err)
    return res.status(500).json({ message: 'Lỗi lấy voucher của tôi' })
  }
}

export const getAvailableVouchers = async (req, res) => {
  try {
    const tongTien = Number(req.query.tong_tien || 0)
    if (!tongTien || tongTien <= 0) return res.json({ ok: true, list: [] })

    const [rows] = await pool.query(
      `
      SELECT *
      FROM ma_giam_gia
      WHERE trang_thai = 1
        AND NOW() BETWEEN ngay_bat_dau AND ngay_ket_thuc
        AND (so_luong = 0 OR so_luong_da_dung < so_luong)
        AND (don_toi_thieu IS NULL OR don_toi_thieu <= ?)
      ORDER BY ngay_ket_thuc ASC
      LIMIT 50
      `,
      [tongTien]
    )

    const list = (rows || []).map((m) => ({
      ma_giam_gia_id: m.ma_giam_gia_id,
      ma_code: m.ma_code,
      ten_chuong_trinh: m.ten_chuong_trinh,
      mo_ta: m.mo_ta,
      loai: m.loai,
      gia_tri: Number(m.gia_tri),
      gia_tri_toi_da: m.gia_tri_toi_da != null ? Number(m.gia_tri_toi_da) : null,
      don_toi_thieu: Number(m.don_toi_thieu || 0),
      ngay_ket_thuc: m.ngay_ket_thuc,
      so_tien_giam_du_kien: tinhSoTienGiam(m, tongTien),
    }))

    return res.json({ ok: true, list })
  } catch (err) {
    console.error('getAvailableVouchers error:', err)
    return res.status(500).json({ ok: false, message: 'Lỗi server khi lấy mã gợi ý' })
  }
}
