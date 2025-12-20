import pool from '../db.js'
export const getDanhMucPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        loai_san_pham_id,
        ten_loai,
        mo_ta,
        CAST(trang_thai AS UNSIGNED) AS trang_thai
      FROM loai_san_pham
      WHERE trang_thai = b'1'
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /danh-muc/public error:', err)
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' })
  }
}

//nhà phân phối
export const getDanhMucNPP = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT loai_san_pham_id, ten_loai, mo_ta, CAST(trang_thai AS UNSIGNED) AS trang_thai
      FROM loai_san_pham
      ORDER BY loai_san_pham_id ASC
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /danh-muc/npp error:', err)
    res.status(500).json({ message: 'Lỗi server khi NPP lấy danh mục' })
  }
}

export const createDanhMucNPP = async (req, res) => {
  try {
    const { ten_loai, mo_ta } = req.body
    if (!ten_loai || !ten_loai.trim()) {
      return res.status(400).json({ message: 'Tên loại là bắt buộc' })
    }

    await pool.query(
      `INSERT INTO loai_san_pham (ten_loai, mo_ta, trang_thai)
       VALUES (?, ?, b'0')`,
      [ten_loai.trim(), mo_ta || '']
    )

    res.json({
      message: 'Đã tạo danh mục (CHỜ ADMIN DUYỆT)',
    })
  } catch (err) {
    console.error('POST /danh-muc/npp error:', err)
    res.status(500).json({ message: 'Lỗi khi NPP thêm danh mục' })
  }
}

//admin
export const getDanhMucAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT loai_san_pham_id, ten_loai, mo_ta, CAST(trang_thai AS UNSIGNED) AS trang_thai
      FROM loai_san_pham
      ORDER BY loai_san_pham_id DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /danh-muc error:', err)
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' })
  }
}



export const updateDanhMucAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { ten_loai, mo_ta, trang_thai } = req.body

    if (!ten_loai || !ten_loai.trim()) {
      return res.status(400).json({ message: 'Tên loại là bắt buộc' })
    }

    const tt =
      typeof trang_thai === 'number'
        ? trang_thai
        : Number(trang_thai) === 0
        ? 0
        : 1

    await pool.query(
      `UPDATE loai_san_pham
       SET ten_loai = ?, mo_ta = ?, trang_thai = ?
       WHERE loai_san_pham_id = ?`,
      [ten_loai.trim(), mo_ta || '', tt, id]
    )

    res.json({ message: 'Cập nhật danh mục thành công' })
  } catch (err) {
    console.error('PUT /danh-muc/:id error:', err)
    res.status(500).json({ message: 'Lỗi server khi cập nhật danh mục' })
  }
}

export const duyetDanhMucAdmin = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE loai_san_pham SET trang_thai = b'1' WHERE loai_san_pham_id = ?`,
      [id]
    )
    res.json({ message: 'Đã duyệt danh mục' })
  } catch (err) {
    console.error('PATCH /danh-muc/:id/duyet:', err)
    res.status(500).json({ message: 'Lỗi khi duyệt danh mục' })
  }
}

export const huyDuyetDanhMucAdmin = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE loai_san_pham SET trang_thai = b'0' WHERE loai_san_pham_id = ?`,
      [id]
    )
    res.json({ message: 'Đã chuyển về trạng thái CHỜ DUYỆT' })
  } catch (err) {
    console.error('PATCH /huy-duyet error:', err)
    res.status(500).json({ message: 'Lỗi khi hủy duyệt danh mục' })
  }
}

export const deleteDanhMucAdmin = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      `DELETE FROM loai_san_pham WHERE loai_san_pham_id = ?`,
      [id]
    )
    res.json({ message: 'Xóa danh mục thành công' })
  } catch (err) {
    console.error('DELETE /danh-muc error:', err)
    res.status(500).json({ message: 'Lỗi server khi xóa danh mục' })
  }
}
