import pool from '../db.js'

const getUserId = (req) => {
  return req.user?.tai_khoan_id ?? req.user?.id
}

const parseJsonArray = (val) => {
  if (!val) return []
  try {
    const arr = JSON.parse(val)
    return Array.isArray(arr) ? arr.filter(Boolean) : []
  } catch {
    return []
  }
}

const uniq = (arr) => [...new Set((arr || []).filter(Boolean))]

const hasOrderDetail = async (sanPhamId) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS c FROM chi_tiet_don_hang WHERE san_pham_id = ?',
    [sanPhamId]
  )
  return Number(rows?.[0]?.c || 0) > 0
}


// DS sản phẩm đang bán 
export const getSanPhamPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.san_pham_id,
        s.loai_san_pham_id,
        s.nha_phan_phoi_id,
        s.ten_san_pham,
        s.mo_ta,
        s.giam_gia,
        s.gia,
        s.so_luong,
        s.hinh_anh,
        s.xuat_xu,
        CAST(s.trang_thai AS UNSIGNED) AS trang_thai,
        s.trang_thai_admin,
        l.ten_loai AS ten_loai
      FROM san_pham s
      LEFT JOIN loai_san_pham l
        ON s.loai_san_pham_id = l.loai_san_pham_id
      WHERE s.trang_thai_admin = 'Da_duyet'
        AND s.trang_thai = b'1'
        AND IFNULL(s.da_xoa, 0) = 0
      ORDER BY s.san_pham_id DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /san-pham/public error:', err)
    res.status(500).json({
      message: err.message || 'Lỗi server khi lấy sản phẩm public',
    })
  }
}

// Chi tiết 1 sản phẩm public
export const getSanPhamChiTietPublic = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query(
      `
      SELECT 
        s.san_pham_id,
        s.loai_san_pham_id,
        s.nha_phan_phoi_id,
        s.ten_san_pham,
        s.mo_ta,
        s.giam_gia,
        s.gia,
        s.so_luong,
        s.hinh_anh,
        s.hinh_anh_chi_tiet,
        s.xuat_xu,
        CAST(s.trang_thai AS UNSIGNED) AS trang_thai,
        s.trang_thai_admin,
        l.ten_loai AS ten_loai
      FROM san_pham s
      LEFT JOIN loai_san_pham l
        ON s.loai_san_pham_id = l.loai_san_pham_id
      WHERE s.san_pham_id = ?
        AND s.trang_thai_admin = 'Da_duyet'
        AND s.trang_thai = b'1'
        AND IFNULL(s.da_xoa, 0) = 0
      LIMIT 1
      `,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' })
    }

    const sp = rows[0]
    const detail = parseJsonArray(sp.hinh_anh_chi_tiet)
    const images = uniq([sp.hinh_anh, ...detail])

    res.json({
      ...sp,
      images,
    })
  } catch (err) {
    console.error('Lỗi /san-pham/:id/public:', err)
    res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm' })
  }
}

// Lấy danh sách sản phẩm npp
export const getSanPhamNPP = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id, ten_don_vi FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [userId]
    )

    if (!nppRows.length) {
      return res
        .status(403)
        .json({ message: 'Tài khoản hiện tại không phải Nhà phân phối' })
    }

    const nhaPhanPhoiId = nppRows[0].nha_phan_phoi_id
    const [dbRows] = await pool.query('SELECT DATABASE() AS db')
    console.log('DB đang dùng:', dbRows[0].db)

    const [rows] = await pool.query(
      `
      SELECT
        san_pham_id,
        loai_san_pham_id,
        nha_phan_phoi_id,
        ten_san_pham,
        mo_ta,
        xuat_xu,
        giam_gia,
        gia,
        so_luong,
        hinh_anh,
        hinh_anh_chi_tiet,
        CAST(trang_thai AS UNSIGNED) AS trang_thai,
        trang_thai_admin
      FROM san_pham
      WHERE nha_phan_phoi_id = ?
        AND IFNULL(da_xoa, 0) = 0
      ORDER BY san_pham_id DESC
      `,
      [nhaPhanPhoiId]
    )

    res.json(rows)
  } catch (err) {
    console.error('GET /san-pham/npp error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi server khi NPP lấy sản phẩm',
    })
  }
}

// npp thêm sản phẩm
export const taoSanPhamNPP = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Không xác định được tài khoản Nhà phân phối' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [userId]
    )

    if (!nppRows.length) {
      return res
        .status(403)
        .json({ message: 'Tài khoản hiện tại không phải Nhà phân phối' })
    }

    const nhaPhanPhoiId = nppRows[0].nha_phan_phoi_id

    let {
      loai_san_pham_id,
      ten_san_pham,
      mo_ta,
      xuat_xu,
      gia,
      so_luong,
      trang_thai,
    } = req.body

    if (!ten_san_pham || !ten_san_pham.trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })
    }

    const mainImg = req.files?.hinh_anh?.[0]?.filename || null
    const detailImgs = (req.files?.hinh_anh_chi_tiet || []).map((f) => f.filename)
    const detailJson = detailImgs.length ? JSON.stringify(uniq(detailImgs)) : null

    const ttBan = Number(trang_thai) === 0 ? 0 : 1
    const giaNum = Number(gia) || 0
    const soLuongNum = Number(so_luong) || 0

    const [result] = await pool.query(
      `
      INSERT INTO san_pham
        (loai_san_pham_id, nha_phan_phoi_id, ten_san_pham, mo_ta, xuat_xu,
         giam_gia, gia, so_luong, hinh_anh, hinh_anh_chi_tiet, trang_thai, trang_thai_admin, da_xoa)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'Cho_duyet', 0)
      `,
      [
        loai_san_pham_id || null,
        nhaPhanPhoiId,
        ten_san_pham.trim(),
        mo_ta || '',
        xuat_xu || null,
        giaNum,
        soLuongNum,
        mainImg,
        detailJson,
        ttBan,
      ]
    )

    return res.status(201).json({
      message: 'Thêm sản phẩm thành công, đang CHỜ ADMIN DUYỆT',
      san_pham_id: result.insertId,
    })
  } catch (err) {
    console.error('POST /san-pham/npp error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi khi NPP thêm sản phẩm',
    })
  }
}

// npp cập nhật sản phẩm 
export const capNhatSanPhamNPP = async (req, res) => {
  try {
    const { id } = req.params

    let {
      loai_san_pham_id,
      ten_san_pham,
      mo_ta,
      xuat_xu,
      gia,
      so_luong,
      trang_thai,
      hinh_anh_cu,
    } = req.body

    if (!ten_san_pham || !ten_san_pham.trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })
    }

    const [oldRows] = await pool.query(
      'SELECT hinh_anh_chi_tiet FROM san_pham WHERE san_pham_id = ? LIMIT 1',
      [id]
    )
    const oldDetailJson = oldRows?.[0]?.hinh_anh_chi_tiet || null
    const oldDetailArr = parseJsonArray(oldDetailJson)

    const newMainImg = req.files?.hinh_anh?.[0]?.filename
    const newDetailImgs = (req.files?.hinh_anh_chi_tiet || []).map((f) => f.filename)

    const hinh_anh = newMainImg || hinh_anh_cu || null

    const mergedDetail = uniq([...oldDetailArr, ...newDetailImgs])
    const hinh_anh_chi_tiet = mergedDetail.length ? JSON.stringify(mergedDetail) : null

    const ttBan = Number(trang_thai) === 0 ? 0 : 1
    const giaNum = Number(gia) || 0
    const soLuongNum = Number(so_luong) || 0

    await pool.query(
      `
      UPDATE san_pham
      SET 
        loai_san_pham_id   = ?,
        ten_san_pham       = ?,
        mo_ta              = ?,
        xuat_xu            = ?,
        gia                = ?,
        so_luong           = ?,
        hinh_anh           = ?,
        hinh_anh_chi_tiet  = ?,
        trang_thai         = ?
      WHERE san_pham_id = ?
      `,
      [
        loai_san_pham_id || null,
        ten_san_pham.trim(),
        mo_ta || '',
        xuat_xu || null,
        giaNum,
        soLuongNum,
        hinh_anh,
        hinh_anh_chi_tiet,
        ttBan,
        id,
      ]
    )

    res.json({ message: 'Cập nhật sản phẩm thành công' })
  } catch (err) {
    console.error('PUT /san-pham/npp/:id error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi khi NPP cập nhật sản phẩm',
    })
  }
}

//npp xóa sản phẩm
export const xoaSanPhamNPP = async (req, res) => {
  try {
    const { id } = req.params

    const userId = getUserId(req)
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Không xác định được tài khoản Nhà phân phối' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [userId]
    )
    if (!nppRows.length) {
      return res
        .status(403)
        .json({ message: 'Tài khoản hiện tại không phải Nhà phân phối' })
    }
    const nhaPhanPhoiId = nppRows[0].nha_phan_phoi_id

    const [spRows] = await pool.query(
      'SELECT san_pham_id FROM san_pham WHERE san_pham_id = ? AND nha_phan_phoi_id = ? LIMIT 1',
      [id, nhaPhanPhoiId]
    )
    if (!spRows.length) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm của NPP này' })
    }

    const used = await hasOrderDetail(id)

    if (used) {
      await pool.query(
        'UPDATE san_pham SET da_xoa = 1, trang_thai = b\'0\' WHERE san_pham_id = ? AND nha_phan_phoi_id = ?',
        [id, nhaPhanPhoiId]
      )
      return res.json({
        message: 'Sản phẩm đã phát sinh đơn hàng nên được ẩn (xóa mềm) và tắt bán.',
        softDeleted: true,
      })
    }

    const [del] = await pool.query(
      'DELETE FROM san_pham WHERE san_pham_id = ? AND nha_phan_phoi_id = ?',
      [id, nhaPhanPhoiId]
    )

    if (!del.affectedRows) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' })
    }

    return res.json({
      message: 'Nhà phân phối đã xóa sản phẩm thành công',
      softDeleted: false,
    })
  } catch (err) {
    console.error('DELETE /san-pham/npp/:id error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi khi NPP xóa sản phẩm',
    })
  }
}


export const getSanPhamAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.san_pham_id,
        s.loai_san_pham_id,
        s.nha_phan_phoi_id,
        s.ten_san_pham,
        s.mo_ta,
        s.xuat_xu,
        s.gia,
        s.so_luong,
        s.hinh_anh,
        s.hinh_anh_chi_tiet,
        CAST(s.trang_thai AS UNSIGNED) AS trang_thai,
        s.trang_thai_admin,
        l.ten_loai,
        n.ten_don_vi AS ten_don_vi_npp
      FROM san_pham s
      LEFT JOIN loai_san_pham l 
        ON s.loai_san_pham_id = l.loai_san_pham_id
      LEFT JOIN nha_phan_phoi n
        ON s.nha_phan_phoi_id = n.nha_phan_phoi_id
      WHERE IFNULL(s.da_xoa, 0) = 0
      ORDER BY s.san_pham_id DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('GET /san-pham error:', err)
    res.status(500).json({
      message: err.code || 'Lỗi server khi lấy sản phẩm',
    })
  }
}

// admin thêm sản phẩm
export const taoSanPhamAdmin = async (req, res) => {
  try {
    const {
      loai_san_pham_id,
      ten_san_pham,
      mo_ta,
      xuat_xu,
      gia,
      so_luong,
      trang_thai,
      trang_thai_admin,
      nha_phan_phoi_id,
    } = req.body

    if (!ten_san_pham || !ten_san_pham.trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })
    }

    const mainImg = req.files?.hinh_anh?.[0]?.filename || null
    const detailImgs = (req.files?.hinh_anh_chi_tiet || []).map((f) => f.filename)
    const detailJson = detailImgs.length ? JSON.stringify(uniq(detailImgs)) : null

    const ttBan = Number(trang_thai) === 0 ? 0 : 1
    const giaNum = Number(gia) || 0
    const soLuongNum = Number(so_luong) || 0
    const ttAdmin = trang_thai_admin || 'Da_duyet'

    await pool.query(
      `
      INSERT INTO san_pham 
        (loai_san_pham_id, nha_phan_phoi_id, ten_san_pham, mo_ta, xuat_xu,
         gia, so_luong, hinh_anh, hinh_anh_chi_tiet, trang_thai, trang_thai_admin, da_xoa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
      [
        loai_san_pham_id || null,
        nha_phan_phoi_id || null,
        ten_san_pham.trim(),
        mo_ta || '',
        xuat_xu || null,
        giaNum,
        soLuongNum,
        mainImg,
        detailJson,
        ttBan,
        ttAdmin,
      ]
    )

    res.json({ message: 'Thêm sản phẩm thành công' })
  } catch (err) {
    console.error('POST /san-pham error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi máy chủ khi thêm sản phẩm',
    })
  }
}

// Admin cập nhật sản phẩm 
export const capNhatSanPhamAdmin = async (req, res) => {
  try {
    const id = req.params.id
    const {
      loai_san_pham_id,
      ten_san_pham,
      mo_ta,
      xuat_xu,
      gia,
      so_luong,
      trang_thai,
      trang_thai_admin,
      hinh_anh_cu,
      nha_phan_phoi_id,
    } = req.body

    if (!ten_san_pham || !ten_san_pham.trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })
    }

    const [oldRows] = await pool.query(
      'SELECT hinh_anh_chi_tiet FROM san_pham WHERE san_pham_id = ? LIMIT 1',
      [id]
    )
    const oldDetailJson = oldRows?.[0]?.hinh_anh_chi_tiet || null
    const oldDetailArr = parseJsonArray(oldDetailJson)

    const newMainImg = req.files?.hinh_anh?.[0]?.filename
    const newDetailImgs = (req.files?.hinh_anh_chi_tiet || []).map((f) => f.filename)

    const hinh_anh = newMainImg || hinh_anh_cu || null

    const mergedDetail = uniq([...oldDetailArr, ...newDetailImgs])
    const hinh_anh_chi_tiet = mergedDetail.length ? JSON.stringify(mergedDetail) : null

    const fields = []
    const params = []

    fields.push('loai_san_pham_id = ?')
    params.push(loai_san_pham_id || null)

    fields.push('ten_san_pham = ?')
    params.push(ten_san_pham.trim())

    fields.push('mo_ta = ?')
    params.push(mo_ta || '')

    fields.push('xuat_xu = ?')
    params.push(xuat_xu || null)

    fields.push('gia = ?')
    params.push(Number(gia) || 0)

    fields.push('so_luong = ?')
    params.push(Number(so_luong) || 0)

    fields.push('hinh_anh = ?')
    params.push(hinh_anh)

    fields.push('hinh_anh_chi_tiet = ?')
    params.push(hinh_anh_chi_tiet)

    if (trang_thai !== undefined) {
      fields.push('trang_thai = ?')
      params.push(Number(trang_thai) === 0 ? 0 : 1)
    }

    if (trang_thai_admin) {
      fields.push('trang_thai_admin = ?')
      params.push(trang_thai_admin)
    }

    if (nha_phan_phoi_id !== undefined) {
      fields.push('nha_phan_phoi_id = ?')
      params.push(nha_phan_phoi_id || null)
    }

    const sql = `
      UPDATE san_pham
      SET ${fields.join(', ')}
      WHERE san_pham_id = ?
    `
    params.push(id)

    await pool.query(sql, params)

    res.json({ message: 'Cập nhật sản phẩm thành công' })
  } catch (err) {
    console.error('PUT /san-pham/:id error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi máy chủ khi cập nhật sản phẩm',
    })
  }
}

// =======================
// Xóa sản phẩm (Admin) (xóa cứng nếu chưa có đơn, có đơn => xóa mềm)
// =======================
export const xoaSanPhamAdmin = async (req, res) => {
  try {
    const id = req.params.id

    // Check tồn tại
    const [spRows] = await pool.query(
      'SELECT san_pham_id FROM san_pham WHERE san_pham_id = ? LIMIT 1',
      [id]
    )
    if (!spRows.length) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' })
    }

    const used = await hasOrderDetail(id)

    if (used) {
      // Có đơn -> xóa mềm + tắt bán
      await pool.query(
        'UPDATE san_pham SET da_xoa = 1, trang_thai = b\'0\' WHERE san_pham_id = ?',
        [id]
      )
      return res.json({
        message: 'Sản phẩm đã phát sinh đơn hàng nên được ẩn (xóa mềm) và tắt bán.',
        softDeleted: true,
      })
    }

    // Chưa có đơn -> xóa cứng
    await pool.query('DELETE FROM san_pham WHERE san_pham_id = ?', [id])
    res.json({ message: 'Xóa sản phẩm thành công', softDeleted: false })
  } catch (err) {
    console.error('DELETE /san-pham/:id error:', err)
    res.status(500).json({
      message: err.code || err.message || 'Lỗi máy chủ khi xóa sản phẩm',
    })
  }
}

export const getSanPhamByNPPPublic = async (req, res) => {
  try {
    const { nppId } = req.params

    const [shopRows] = await pool.query(
      `
      SELECT 
        nha_phan_phoi_id,
        ten_don_vi,
        dia_chi,
        sdt,
        email_cong_ty AS email,
        NULL AS mo_ta_shop,
        NULL AS logo
      FROM nha_phan_phoi
      WHERE nha_phan_phoi_id = ?
        AND trang_thai = b'1'
        AND trang_thai_dang_ky = 'DA_DUYET'
      `,
      [nppId]
    )

    if (!shopRows.length) {
      return res.status(404).json({ message: 'Không tìm thấy nhà phân phối' })
    }

    const [spRows] = await pool.query(
      `
      SELECT 
        sp.san_pham_id,
        sp.loai_san_pham_id,
        sp.nha_phan_phoi_id,
        sp.ten_san_pham,
        sp.mo_ta,
        sp.xuat_xu,
        sp.gia,
        sp.so_luong,
        sp.hinh_anh,
        sp.trang_thai,
        sp.trang_thai_admin,
        dm.ten_loai
      FROM san_pham sp
      LEFT JOIN loai_san_pham dm
        ON sp.loai_san_pham_id = dm.loai_san_pham_id
      WHERE sp.nha_phan_phoi_id = ?
        AND sp.trang_thai_admin = 'Da_duyet'
        AND sp.trang_thai = b'1'
        AND IFNULL(sp.da_xoa, 0) = 0
      ORDER BY sp.san_pham_id DESC
      `,
      [nppId]
    )

    return res.json({
      shop: shopRows[0],
      products: spRows,
    })
  } catch (err) {
    console.error('Lỗi lấy sản phẩm theo NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi lấy sản phẩm theo Nhà phân phối' })
  }
}
