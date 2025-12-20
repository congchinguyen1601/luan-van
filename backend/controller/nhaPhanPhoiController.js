import pool from '../db.js'

export const dangKyNhaPhanPhoi = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      ten_don_vi,
      ma_so_thue,
      dia_chi,
      sdt,
      email_cong_ty,
      nguoi_dai_dien,
      ghi_chu,
    } = req.body

    const errors = {}

    const ten = String(ten_don_vi || '').trim()
    const mstRaw = String(ma_so_thue || '').trim()
    const dc = String(dia_chi || '').trim()
    const phone = String(sdt || '').trim()
    const email = String(email_cong_ty || '').trim()
    const nd = String(nguoi_dai_dien || '').trim()
    const gc = String(ghi_chu || '').trim()

    if (!ten) errors.ten_don_vi = 'Tên đơn vị bắt buộc'
    else if (ten.length < 2 || ten.length > 100) errors.ten_don_vi = 'Tên đơn vị 2–100 ký tự'

    if (mstRaw) {
      const mst = mstRaw.replace(/-/g, '')
      if (!/^\d+$/.test(mst)) errors.ma_so_thue = 'Mã số thuế chỉ gồm chữ số'
      else if (![10, 13].includes(mst.length)) errors.ma_so_thue = 'MST phải 10 hoặc 13 số'
    }

    if (!dc) errors.dia_chi = 'Địa chỉ bắt buộc'
    else if (dc.length < 5 || dc.length > 200) errors.dia_chi = 'Địa chỉ 5–200 ký tự'

    if (!phone) errors.sdt = 'Số điện thoại bắt buộc'
    else if (!/^0\d{9,10}$/.test(phone)) errors.sdt = 'SĐT không hợp lệ'

    if (!email) errors.email_cong_ty = 'Email công ty bắt buộc'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email_cong_ty = 'Email không hợp lệ'

    if (!nd) errors.nguoi_dai_dien = 'Người đại diện bắt buộc'
    else if (nd.length < 2 || nd.length > 60) errors.nguoi_dai_dien = 'Người đại diện 2–60 ký tự'

    if (gc.length > 500) errors.ghi_chu = 'Ghi chú tối đa 500 ký tự'

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors })
    }

    const [rows] = await pool.query(
      'SELECT * FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [userId]
    )

    if (rows.length) {
      const npp = rows[0]

      if (npp.trang_thai_dang_ky === 'DA_DUYET') {
        return res.status(400).json({ message: 'Bạn đã được duyệt trở thành Nhà phân phối' })
      }

      if (npp.trang_thai_dang_ky === 'CHO_DUYET') {
        return res.status(400).json({ message: 'Bạn đã gửi yêu cầu, vui lòng chờ Admin duyệt' })
      }

      //  từ chối update và gửi lại
      await pool.query(
        `
        UPDATE nha_phan_phoi
        SET ten_don_vi = ?,
            ma_so_thue = ?,
            dia_chi = ?,
            sdt = ?,
            email_cong_ty = ?,
            nguoi_dai_dien = ?,
            ghi_chu = ?,
            trang_thai = b'1',
            trang_thai_dang_ky = 'CHO_DUYET',
            ly_do_tu_choi = NULL
        WHERE nha_phan_phoi_id = ?
        `,
        [
          ten,
          mstRaw,
          dc,
          phone,
          email,
          nd,
          gc,
          npp.nha_phan_phoi_id,
        ]
      )

      return res.json({
        message: 'Đã cập nhật lại thông tin và gửi lại yêu cầu đăng ký Nhà phân phối',
      })
    }


    await pool.query(
      `
      INSERT INTO nha_phan_phoi (
        tai_khoan_id,
        ten_don_vi,
        ma_so_thue,
        dia_chi,
        sdt,
        email_cong_ty,
        nguoi_dai_dien,
        ghi_chu,
        trang_thai,
        trang_thai_dang_ky
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, b'1', 'CHO_DUYET')
      `,
      [userId, ten, mstRaw, dc, phone, email, nd, gc]
    )

    return res.status(201).json({ message: 'Đã gửi yêu cầu đăng ký Nhà phân phối' })
  } catch (err) {
    console.error('Lỗi đăng ký NPP:', err)
    return res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu đăng ký NPP' })
  }
}


export const getNppCuaToi = async (req, res) => {
  try {
    const userId = req.user.id
    const [rows] = await pool.query(
      `
      SELECT 
        nha_phan_phoi_id,
        tai_khoan_id,
        ten_don_vi,
        ma_so_thue,
        dia_chi,
        sdt,
        email_cong_ty,
        nguoi_dai_dien,
        ghi_chu,
        trang_thai,
        trang_thai_dang_ky,
        ly_do_tu_choi
      FROM nha_phan_phoi
      WHERE tai_khoan_id = ?
      `,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Bạn chưa đăng ký Nhà phân phối' })
    }

    return res.json({ npp: rows[0] })
  } catch (err) {
    console.error('Lỗi lấy NPP của tôi:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi lấy thông tin Nhà phân phối' })
  }
}


export const getAllNppAdmin = async (req, res) => {
  try {
    const { trang_thai_dang_ky } = req.query

    let sql = `
      SELECT 
        npp.*,
        tk.ho_ten,
        tk.email AS email_tai_khoan,
        tk.ten_vai_tro
      FROM nha_phan_phoi npp
      JOIN tai_khoan tk 
        ON npp.tai_khoan_id = tk.tai_khoan_id
    `
    const params = []

    if (trang_thai_dang_ky) {
      sql += ' WHERE npp.trang_thai_dang_ky = ?'
      params.push(trang_thai_dang_ky)
    }

    sql += ' ORDER BY npp.nha_phan_phoi_id DESC'

    const [rows] = await pool.query(sql, params)

    return res.json({ list: rows })
  } catch (err) {
    console.error('Lỗi Admin lấy ds NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách Nhà phân phối' })
  }
}

export const duyetNpp = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.query(
      `
      SELECT npp.*, tk.ten_vai_tro
      FROM nha_phan_phoi npp
      JOIN tai_khoan tk ON npp.tai_khoan_id = tk.tai_khoan_id
      WHERE npp.nha_phan_phoi_id = ?
      `,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy Nhà phân phối' })
    }

    const npp = rows[0]

    await pool.query(
      `
      UPDATE nha_phan_phoi
      SET trang_thai = b'1',
          trang_thai_dang_ky = 'DA_DUYET',
          ly_do_tu_choi = NULL
      WHERE nha_phan_phoi_id = ?
      `,
      [id]
    )

    await pool.query(
      `
      UPDATE tai_khoan
      SET ten_vai_tro = 'Nhà phân phối'
      WHERE tai_khoan_id = ?
      `,
      [npp.tai_khoan_id]
    )

    return res.json({ message: 'Đã duyệt Nhà phân phối thành công' })
  } catch (err) {
    console.error('Lỗi Admin duyệt NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi duyệt Nhà phân phối' })
  }
}

export const tuChoiNpp = async (req, res) => {
  try {
    const { id } = req.params
    const { ly_do_tu_choi } = req.body

    await pool.query(
      `
      UPDATE nha_phan_phoi
      SET trang_thai_dang_ky = 'TU_CHOI',
          ly_do_tu_choi = ?,
          trang_thai = b'0'
      WHERE nha_phan_phoi_id = ?
      `,
      [ly_do_tu_choi || null, id]
    )

    return res.json({ message: 'Đã từ chối yêu cầu Nhà phân phối' })
  } catch (err) {
    console.error('Lỗi Admin từ chối NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi từ chối Nhà phân phối' })
  }
}
export const getShopsPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        nha_phan_phoi_id,
        ten_don_vi,
        dia_chi,
        sdt,
        email_cong_ty,
        nguoi_dai_dien
      FROM nha_phan_phoi
      WHERE trang_thai = b'1'
        AND trang_thai_dang_ky = 'DA_DUYET'
      ORDER BY ten_don_vi ASC
      `
    )

    return res.json(rows)
  } catch (err) {
    console.error('Lỗi lấy danh sách shop NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi lấy danh sách nhà phân phối (public)' })
  }
}