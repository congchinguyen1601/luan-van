import pool from '../db.js'
import nodemailer from 'nodemailer'

const getUserId = (req) => {
  return req.user?.tai_khoan_id ?? req.user?.id
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendReturnMail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    console.warn('SMTP_USER chưa cấu hình, bỏ qua gửi mail.')
    return
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  })
}

//tạo đơn hàng
export const createDonHang = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Không xác định được tài khoản người dùng' })
    }

    const {
      phuong_thuc_thanh_toan,
      ma_giam_gia_id = null,
      so_tien_giam = 0,
      ghi_chu = '',
      items = [],
    } = req.body

    if (!phuong_thuc_thanh_toan) {
      return res
        .status(400)
        .json({ message: 'Thiếu phương thức thanh toán' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: 'Thiếu chi tiết đơn hàng (items)' })
    }

    // Không cho NPP đặt hàng chính shop mình
    try {
      const [nppRows] = await pool.query(
        `SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?`,
        [userId]
      )

      if (nppRows.length > 0) {
        const nppId = nppRows[0].nha_phan_phoi_id

        const coSanPhamCuaChinhMinh = items.some((item) => {
          if (!item) return false
          const spNppId = item.nha_phan_phoi_id
          return spNppId != null && Number(spNppId) === Number(nppId)
        })

        if (coSanPhamCuaChinhMinh) {
          return res.status(400).json({
            message:
              'Nhà phân phối không thể đặt hàng sản phẩm của chính shop mình. Vui lòng bỏ các sản phẩm này khỏi giỏ hàng.',
          })
        }
      }
    } catch (errCheck) {
      console.error('Lỗi khi kiểm tra NPP trong createDonHang:', errCheck)
    }

    // Tạo đơn hàng
    const [result] = await pool.query(
      `
      INSERT INTO don_hang (
        tai_khoan_id,
        ngay_dat,
        tong_tien,
        phuong_thuc_thanh_toan,
        trang_thai_don_hang,
        ghi_chu
      )
      VALUES (?, NOW(), 0, ?, 'Chờ xác nhận', ?)
      `,
      [userId, phuong_thuc_thanh_toan, ghi_chu]
    )

    const donHangId = result.insertId

    for (const rawItem of items) {
      if (!rawItem) continue
      const san_pham_id = rawItem.san_pham_id
      const so_luong = rawItem.so_luong
      const gia = rawItem.gia

      if (!san_pham_id || !so_luong) continue

      const soLuongNum = Number(so_luong) || 0
      const donGia = Number(gia) || 0
      const thanhTien = soLuongNum * donGia

      let nppId = rawItem.nha_phan_phoi_id ?? null
      if (!nppId) {
        const [spRows] = await pool.query(
          'SELECT nha_phan_phoi_id FROM san_pham WHERE san_pham_id = ?',
          [san_pham_id]
        )
        nppId = spRows[0]?.nha_phan_phoi_id ?? null
      }

      await pool.query(
        `
        INSERT INTO chi_tiet_don_hang (
          don_hang_id,
          san_pham_id,
          nha_phan_phoi_id,
          so_luong,
          don_gia,
          thanh_tien
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [donHangId, san_pham_id, nppId, soLuongNum, donGia, thanhTien]
      )
    }

    const [sumRows] = await pool.query(
      `
      SELECT SUM(thanh_tien) AS tong_thuc_te
      FROM chi_tiet_don_hang
      WHERE don_hang_id = ?
      `,
      [donHangId]
    )
    const tongThucTe = Number(sumRows[0]?.tong_thuc_te || 0)

    let soTienGiamThucTe = Number(so_tien_giam || 0)
    if (ma_giam_gia_id && soTienGiamThucTe > 0) {
      if (soTienGiamThucTe > tongThucTe) {
        soTienGiamThucTe = tongThucTe
      }

      await pool.query(
        `
        INSERT INTO ma_giam_gia_su_dung (
          ma_giam_gia_id,
          tai_khoan_id,
          don_hang_id,
          so_tien_giam
        )
        VALUES (?, ?, ?, ?)
        `,
        [ma_giam_gia_id, userId, donHangId, soTienGiamThucTe]
      )

      await pool.query(
        `
        UPDATE ma_giam_gia
        SET so_luong_da_dung = so_luong_da_dung + 1
        WHERE ma_giam_gia_id = ?
        `,
        [ma_giam_gia_id]
      )
    }

    const tongSauGiam = tongThucTe - soTienGiamThucTe

    await pool.query(
      `UPDATE don_hang SET tong_tien = ? WHERE don_hang_id = ?`,
      [tongSauGiam, donHangId]
    )

    return res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      don_hang_id: donHangId,
      tong_tien_truoc_giam: tongThucTe,
      tong_tien_sau_giam: tongSauGiam,
      so_tien_giam: soTienGiamThucTe,
    })
  } catch (err) {
    console.error('Lỗi tạo đơn hàng:', err)
    return res.status(500).json({ message: 'Lỗi tạo đơn hàng' })
  }
}

//trạng thái đơn hàng
export const updateTrangThaiUser = async (req, res) => {
  try {
    const userId = getUserId(req)
    const { id } = req.params
    const { action } = req.body // 'Huy' hoặc 'Tra_hang'

    if (!['Huy', 'Tra_hang'].includes(action)) {
      return res.status(400).json({ message: 'Hành động không hợp lệ' })
    }

    const [rows] = await pool.query(
      `SELECT don_hang_id, tai_khoan_id, trang_thai_don_hang
       FROM don_hang
       WHERE don_hang_id = ?`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    }

    const order = rows[0]
    if (Number(order.tai_khoan_id) !== Number(userId)) {
      return res
        .status(403)
        .json({ message: 'Bạn không có quyền thao tác trên đơn hàng này' })
    }

    let newStatus = order.trang_thai_don_hang

    if (action === 'Huy') {
      if (!['Chờ xác nhận', 'Đang chuẩn bị'].includes(order.trang_thai_don_hang)) {
        return res
          .status(400)
          .json({ message: 'Không thể hủy ở trạng thái hiện tại' })
      }

      newStatus = 'Đã hủy'

      await pool.query(
        `UPDATE chi_tiet_don_hang
         SET trang_thai_npp = 'Da_huy'
         WHERE don_hang_id = ?`,
        [id]
      )
    }

    if (action === 'Tra_hang') {
      if (!['Đang giao', 'Hoàn thành'].includes(order.trang_thai_don_hang)) {
        return res
          .status(400)
          .json({ message: 'Không thể yêu cầu trả hàng ở trạng thái hiện tại' })
      }

      newStatus = 'Yêu cầu trả hàng'

      await pool.query(
        `UPDATE chi_tiet_don_hang
         SET trang_thai_npp = 'Yeu_cau_tra'
         WHERE don_hang_id = ?`,
        [id]
      )
    }

    await pool.query(
      `UPDATE don_hang
       SET trang_thai_don_hang = ?
       WHERE don_hang_id = ?`,
      [newStatus, id]
    )

    return res.json({
      message: 'Đã cập nhật trạng thái đơn hàng',
      trang_thai_don_hang: newStatus,
    })
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái đơn hàng (user):', err)
    return res
      .status(500)
      .json({ message: 'Lỗi cập nhật trạng thái đơn hàng' })
  }
}

//npp lấy đon hàng
export const getDonHangNPP = async (req, res) => {
  try {
    const taiKhoanId = getUserId(req)
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const [nppRows] = await pool.query(
      `
      SELECT nha_phan_phoi_id, ten_don_vi
      FROM nha_phan_phoi
      WHERE tai_khoan_id = ?
      `,
      [taiKhoanId]
    )

    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }

    const nppId = nppRows[0].nha_phan_phoi_id

    const [rows] = await pool.query(
      `
      SELECT
        ctdh.chi_tiet_don_hang_id,
        ctdh.don_hang_id,
        ctdh.san_pham_id,
        ctdh.so_luong,
        ctdh.don_gia,
        ctdh.thanh_tien,
        ctdh.trang_thai_npp,
        dh.ngay_dat,
        dh.trang_thai_don_hang,
        tk.ho_ten AS ten_khach,
        tk.email AS email_khach,
        sp.ten_san_pham
      FROM chi_tiet_don_hang ctdh
      JOIN don_hang dh 
        ON ctdh.don_hang_id = dh.don_hang_id
      LEFT JOIN tai_khoan tk
        ON dh.tai_khoan_id = tk.tai_khoan_id
      LEFT JOIN san_pham sp
        ON ctdh.san_pham_id = sp.san_pham_id
      WHERE ctdh.nha_phan_phoi_id = ?
      ORDER BY dh.don_hang_id DESC, ctdh.chi_tiet_don_hang_id DESC
      `,
      [nppId]
    )

    return res.json({
      npp: nppRows[0],
      orders: rows,
    })
  } catch (err) {
    console.error('Lỗi lấy đơn hàng NPP:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi lấy đơn hàng của Nhà phân phối' })
  }
}

//npp cập nhật trạng thái đơn hàng
export const capNhatTrangThaiDonHangNPP = async (req, res) => {
  try {
    const taiKhoanId = getUserId(req)
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const { id } = req.params // chi_tiet_don_hang_id
    const { trang_thai_npp } = req.body

    if (!trang_thai_npp) {
      return res
        .status(400)
        .json({ message: 'Thiếu trạng thái NPP cần cập nhật' })
    }

    const [nppRows] = await pool.query(
      `SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?`,
      [taiKhoanId]
    )
    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }
    const nppId = nppRows[0].nha_phan_phoi_id

    const [detailRows] = await pool.query(
      `
      SELECT don_hang_id
      FROM chi_tiet_don_hang
      WHERE chi_tiet_don_hang_id = ?
        AND nha_phan_phoi_id = ?
      `,
      [id, nppId]
    )

    if (!detailRows.length) {
      return res.status(404).json({
        message: 'Không tìm thấy chi tiết đơn hàng thuộc nhà phân phối này',
      })
    }

    const donHangId = detailRows[0].don_hang_id

    await pool.query(
      `
      UPDATE chi_tiet_don_hang
      SET trang_thai_npp = ?
      WHERE chi_tiet_don_hang_id = ?
        AND nha_phan_phoi_id = ?
      `,
      [trang_thai_npp, id, nppId]
    )

    // Tính lại trạng thái tổng của đơn
    const [statusRows] = await pool.query(
      `
      SELECT trang_thai_npp
      FROM chi_tiet_don_hang
      WHERE don_hang_id = ?
      `,
      [donHangId]
    )

    const statuses = statusRows.map((r) => r.trang_thai_npp || 'Cho_xac_nhan')
    const set = new Set(statuses)

    let trangThaiDonHang = 'Chờ xác nhận'

    if (set.size === 1 && set.has('Da_huy')) {
      trangThaiDonHang = 'Đã hủy'
    } else if (set.size === 1 && set.has('Hoan_thanh')) {
      trangThaiDonHang = 'Hoàn thành'
    } else if (set.has('Dang_giao')) {
      trangThaiDonHang = 'Đang giao'
    } else if (set.has('Dang_chuan_bi')) {
      trangThaiDonHang = 'Đang chuẩn bị'
    } else if (set.has('Yeu_cau_tra')) {
      trangThaiDonHang = 'Yêu cầu trả hàng'
    } else if (set.size === 1 && set.has('Da_chap_nhan_tra')) {
      trangThaiDonHang = 'Đã trả hàng'
    } else if (set.size === 1 && set.has('Tu_choi_tra')) {
      trangThaiDonHang = 'Trả hàng bị từ chối'
    }

    await pool.query(
      `
      UPDATE don_hang
      SET trang_thai_don_hang = ?
      WHERE don_hang_id = ?
      `,
      [trangThaiDonHang, donHangId]
    )

    return res.json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      chi_tiet_don_hang_id: id,
      don_hang_id: donHangId,
      trang_thai_npp,
      trang_thai_don_hang: trangThaiDonHang,
    })
  } catch (err) {
    console.error('Lỗi NPP cập nhật trạng thái đơn hàng:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi khi NPP cập nhật trạng thái đơn hàng' })
  }
}

//lịch sử đơn hàng
export const getDonHangUser = async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const [rows] = await pool.query(
      `
      SELECT
        dh.don_hang_id,
        dh.ngay_dat,
        dh.tong_tien,
        dh.phuong_thuc_thanh_toan,
        dh.trang_thai_don_hang,
        ctdh.chi_tiet_don_hang_id,
        ctdh.san_pham_id,
        ctdh.so_luong,
        ctdh.don_gia,
        ctdh.thanh_tien,
        sp.ten_san_pham,
        sp.hinh_anh AS hinh_anh
      FROM don_hang dh
      LEFT JOIN chi_tiet_don_hang ctdh
        ON dh.don_hang_id = ctdh.don_hang_id
      LEFT JOIN san_pham sp
        ON ctdh.san_pham_id = sp.san_pham_id
      WHERE dh.tai_khoan_id = ?
      ORDER BY dh.don_hang_id DESC, ctdh.chi_tiet_don_hang_id ASC
      `,
      [userId]
    )

    return res.json({ orders: rows })
  } catch (err) {
    console.error('Lỗi lấy lịch sử đơn hàng user:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi lấy lịch sử đơn hàng của người dùng' })
  }
}


export const yeuCauTraHangUser = async (req, res) => {
  const userId = getUserId(req)
  if (!userId) {
    return res.status(401).json({ message: 'Không xác định tài khoản' })
  }

  const { don_hang_id, ly_do, ghi_chu, items } = req.body

  if (!don_hang_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Thiếu dữ liệu yêu cầu trả hàng' })
  }

  try {
    const [dhRows] = await pool.query(
      `
      SELECT don_hang_id, tai_khoan_id, trang_thai_don_hang
      FROM don_hang
      WHERE don_hang_id = ?
      `,
      [don_hang_id]
    )

    if (!dhRows.length) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    }

    const order = dhRows[0]
    if (Number(order.tai_khoan_id) !== Number(userId)) {
      return res
        .status(403)
        .json({ message: 'Bạn không có quyền yêu cầu trả hàng đơn này' })
    }

    if (!['Đang giao', 'Hoàn thành'].includes(order.trang_thai_don_hang)) {
      return res.status(400).json({
        message:
          'Chỉ có thể yêu cầu trả hàng khi đơn đang giao hoặc đã hoàn thành',
      })
    }

    const [ycResult] = await pool.query(
      `
      INSERT INTO yeu_cau_tra_hang (
        don_hang_id,
        tai_khoan_id,
        ly_do_chung,
        ghi_chu,
        trang_thai,
        ngay_tao,
        ngay_cap_nhat
      )
      VALUES (?, ?, ?, ?, 'Cho_duyet', NOW(), NOW())
      `,
      [don_hang_id, userId, ly_do || null, ghi_chu || null]
    )

    const yeuCauId = ycResult.insertId

    for (const it of items) {
      if (!it) continue
      const { chi_tiet_don_hang_id, san_pham_id, so_luong_tra } = it
      if (!chi_tiet_don_hang_id || !so_luong_tra) continue

      await pool.query(
        `
        INSERT INTO yeu_cau_tra_hang_ct (
          yeu_cau_id,
          chi_tiet_don_hang_id,
          san_pham_id,
          so_luong_tra,
          ly_do,
          ghi_chu
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          yeuCauId,
          chi_tiet_don_hang_id,
          san_pham_id || null,
          Number(so_luong_tra) || 0,
          ly_do || null,
          ghi_chu || null,
        ]
      )
    }

    await pool.query(
      `
      UPDATE don_hang
      SET trang_thai_don_hang = 'Yêu cầu trả hàng'
      WHERE don_hang_id = ?
      `,
      [don_hang_id]
    )

    return res.json({
      message: 'Đã gửi yêu cầu trả hàng, vui lòng chờ Nhà phân phối xử lý.',
      yeu_cau_id: yeuCauId,
    })
  } catch (err) {
    console.error('yeuCauTraHangUser error:', err)
    return res.status(500).json({ message: 'Lỗi khi gửi yêu cầu trả hàng' })
  }
}

//npp xem danh sách yêu cầu trả hàng
export const getYeuCauTraHangNPP = async (req, res) => {
  try {
    const taiKhoanId = getUserId(req)
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [taiKhoanId]
    )

    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }

    const nppId = nppRows[0].nha_phan_phoi_id

    const [rows] = await pool.query(
      `
      SELECT 
        y.yeu_cau_id,
        y.don_hang_id,
        y.tai_khoan_id,
        y.trang_thai AS trang_thai_yeu_cau,
        y.ly_do_chung,
        y.ghi_chu AS ghi_chu_chung,
        y.ngay_tao,
        y.ngay_cap_nhat,

        dh.trang_thai_don_hang,

        tk.ho_ten AS ten_khach,
        tk.email,
        tk.sdt,

        ct.yeu_cau_ct_id,
        ct.chi_tiet_don_hang_id,
        ct.san_pham_id,
        ct.so_luong_tra,
        ct.ly_do,
        ct.ghi_chu AS ghi_chu_ct,

        sp.ten_san_pham,
        sp.hinh_anh,
        ctdh.nha_phan_phoi_id
      FROM yeu_cau_tra_hang y
      JOIN yeu_cau_tra_hang_ct ct
        ON y.yeu_cau_id = ct.yeu_cau_id
      JOIN chi_tiet_don_hang ctdh
        ON ct.chi_tiet_don_hang_id = ctdh.chi_tiet_don_hang_id
      JOIN san_pham sp
        ON ctdh.san_pham_id = sp.san_pham_id
      JOIN don_hang dh
        ON y.don_hang_id = dh.don_hang_id
      JOIN tai_khoan tk
        ON y.tai_khoan_id = tk.tai_khoan_id
      WHERE ctdh.nha_phan_phoi_id = ?
      ORDER BY y.ngay_tao DESC, y.yeu_cau_id DESC
      `,
      [nppId]
    )

    const map = new Map()
    rows.forEach((r) => {
      if (!map.has(r.yeu_cau_id)) {
        map.set(r.yeu_cau_id, {
          yeu_cau_id: r.yeu_cau_id,
          don_hang_id: r.don_hang_id,
          trang_thai_yeu_cau: r.trang_thai_yeu_cau,
          ly_do_chung: r.ly_do_chung,
          ghi_chu_chung: r.ghi_chu_chung,
          trang_thai_don_hang: r.trang_thai_don_hang,
          ngay_tao: r.ngay_tao,
          ngay_cap_nhat: r.ngay_cap_nhat,
          ten_khach: r.ten_khach,
          email: r.email,
          sdt: r.sdt,
          items: [],
        })
      }
      map.get(r.yeu_cau_id).items.push({
        yeu_cau_ct_id: r.yeu_cau_ct_id,
        chi_tiet_don_hang_id: r.chi_tiet_don_hang_id,
        san_pham_id: r.san_pham_id,
        ten_san_pham: r.ten_san_pham,
        hinh_anh: r.hinh_anh,
        so_luong_tra: r.so_luong_tra,
        ly_do: r.ly_do,
        ghi_chu: r.ghi_chu_ct,
      })
    })

    return res.json({ requests: Array.from(map.values()) })
  } catch (err) {
    console.error('getYeuCauTraHangNPP error:', err)
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy yêu cầu trả hàng cho NPP' })
  }
}

//npp xử lý yêu cầu trả hàng
export const xuLyYeuCauTraHangNPP = async (req, res) => {
  try {
    const taiKhoanId = getUserId(req)
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định được tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [taiKhoanId]
    )
    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }
    const nppId = nppRows[0].nha_phan_phoi_id

    const { id } = req.params // yeu_cau_id
    const { action, ghi_chu_npp } = req.body

    if (!['Duyet', 'Tu_choi'].includes(action)) {
      return res.status(400).json({ message: 'Hành động không hợp lệ' })
    }

    const [rows] = await pool.query(
      `
      SELECT 
        y.*,
        dh.trang_thai_don_hang,
        tk.email,
        tk.ho_ten AS ten_khach
      FROM yeu_cau_tra_hang y
      JOIN don_hang dh
        ON y.don_hang_id = dh.don_hang_id
      JOIN tai_khoan tk
        ON y.tai_khoan_id = tk.tai_khoan_id
      WHERE y.yeu_cau_id = ?
      `,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu trả hàng' })
    }

    const yc = rows[0]

    const [checkRows] = await pool.query(
      `
      SELECT 1
      FROM yeu_cau_tra_hang_ct ct
      JOIN chi_tiet_don_hang ctdh
        ON ct.chi_tiet_don_hang_id = ctdh.chi_tiet_don_hang_id
      WHERE ct.yeu_cau_id = ?
        AND ctdh.nha_phan_phoi_id = ?
      LIMIT 1
      `,
      [id, nppId]
    )

    if (!checkRows.length) {
      return res
        .status(403)
        .json({ message: 'Yêu cầu này không thuộc sản phẩm của NPP hiện tại' })
    }

    const newTrangThai = action === 'Duyet' ? 'Da_duyet' : 'Tu_choi'

    
    await pool.query(
      `
      UPDATE yeu_cau_tra_hang
      SET trang_thai = ?, ghi_chu_npp = ?, ngay_cap_nhat = NOW()
      WHERE yeu_cau_id = ?
      `,
      [newTrangThai, ghi_chu_npp || null, id]
    )

    
    let newTrangThaiDonHang = yc.trang_thai_don_hang

    if (action === 'Duyet') {
      newTrangThaiDonHang = 'Đã trả hàng'
    } else if (action === 'Tu_choi') {
      newTrangThaiDonHang = 'Yêu cầu trả hàng của bạn không được duyệt'
    }

    await pool.query(
      `
      UPDATE don_hang
      SET trang_thai_don_hang = ?
      WHERE don_hang_id = ?
      `,
      [newTrangThaiDonHang, yc.don_hang_id]
    )

    try {
      const subject =
        action === 'Duyet'
          ? `Yêu cầu trả hàng đơn #${yc.don_hang_id} đã được chấp nhận`
          : `Yêu cầu trả hàng đơn #${yc.don_hang_id} đã bị từ chối`

      const html = `
        <p>Chào ${yc.ten_khach || ''},</p>
        <p>Yêu cầu trả hàng của bạn cho đơn hàng <strong>#${yc.don_hang_id}</strong> đã được xử lý.</p>
        <p>Kết quả: <strong>${
          action === 'Duyet' ? 'ĐÃ CHẤP NHẬN TRẢ HÀNG' : 'BỊ TỪ CHỐI'
        }</strong></p>
        ${
          ghi_chu_npp
            ? `<p>Ghi chú từ Nhà phân phối: ${ghi_chu_npp}</p>`
            : ''
        }
        <p>Trân trọng.</p>
      `

      if (yc.email) {
        await sendReturnMail({
          to: yc.email,
          subject,
          html,
        })
      }
    } catch (mailErr) {
      console.error('Gửi email kết quả trả hàng lỗi:', mailErr)
    }

    return res.json({
      message: 'Đã cập nhật yêu cầu trả hàng',
      yeu_cau_id: id,
      trang_thai: newTrangThai,
    })
  } catch (err) {
    console.error('xuLyYeuCauTraHangNPP error:', err)
    res
      .status(500)
      .json({ message: 'Lỗi khi NPP xử lý yêu cầu trả hàng' })
  }
}
