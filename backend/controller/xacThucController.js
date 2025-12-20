import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { isEmail, isGioiTinh } from '../utils/validators.js'
import { sendOTPEmail } from '../utils/mailer.js'

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_tam_thoi'

const getUserIdFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization

  if (!authHeader) return null

  const parts = authHeader.split(' ')
  const token = parts.length === 2 ? parts[1] : parts[0]

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.id || decoded.tai_khoan_id || null
  } catch (err) {
    console.error('JWT verify error in getUserIdFromRequest:', err)
    return null
  }
}

export const dangKyKhachHang = async (req, res) => {
  try {
    const { ho_ten, email, mat_khau } = req.body

    if (!ho_ten || !email || !mat_khau) {
      return res.status(400).json({ message: 'Thiếu trường bắt buộc' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' })
    }

    const [dup] = await pool.query(
      'SELECT tai_khoan_id FROM tai_khoan WHERE email = ? LIMIT 1',
      [email]
    )
    if (dup.length) {
      return res.status(409).json({ message: 'Email đã tồn tại' })
    }

    const hash = await bcrypt.hash(mat_khau, 10)
    await pool.query(
      `INSERT INTO tai_khoan
       (ho_ten, email, mat_khau, ten_vai_tro, ngay_sinh, dia_chi, gioi_tinh, so_cmnd, sdt, trang_thai)
       VALUES (?, ?, ?, 'Khách hàng', NULL, NULL, NULL, NULL, NULL, b'1')`,
      [ho_ten, email, hash]
    )

    return res.status(201).json({ message: 'Đăng ký thành công' })
  } catch (err) {
    console.error('Lỗi đăng ký:', err)
    return res.status(500).json({ message: 'Lỗi máy chủ' })
  }
}

export const dangKyNhaPhanPhoi = async (req, res) => {
  try {
    const { ho_ten, email, mat_khau } = req.body

    if (!ho_ten || !email || !mat_khau) {
      return res.status(400).json({ message: 'Thiếu trường bắt buộc' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' })
    }

    const [dup] = await pool.query(
      'SELECT tai_khoan_id FROM tai_khoan WHERE email = ? LIMIT 1',
      [email]
    )
    if (dup.length) {
      return res.status(409).json({ message: 'Email đã tồn tại' })
    }

    const hash = await bcrypt.hash(mat_khau, 10)
    await pool.query(
      `INSERT INTO tai_khoan
       (ho_ten, email, mat_khau, ten_vai_tro, ngay_sinh, dia_chi, gioi_tinh, so_cmnd, sdt, trang_thai)
       VALUES (?, ?, ?, 'Nhà phân phối', NULL, NULL, NULL, NULL, NULL, b'1')`,
      [ho_ten, email, hash]
    )

    return res
      .status(201)
      .json({ message: 'Đăng ký Nhà phân phối thành công' })
  } catch (err) {
    console.error('Lỗi đăng ký NPP:', err)
    return res.status(500).json({ message: 'Lỗi máy chủ' })
  }
}

export const dangNhap = async (req, res) => {
  try {
    const { email, mat_khau } = req.body

    if (!email || !mat_khau) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' })
    }

    const [rows] = await pool.query(
      'SELECT tai_khoan_id, ho_ten, email, mat_khau, ten_vai_tro, trang_thai FROM tai_khoan WHERE email = ? LIMIT 1',
      [email]
    )

    if (!rows.length) {
      return res.status(401).json({ message: 'Sai thông tin hoặc mật khẩu' })
    }

    const user = rows[0]

    const locked =
      user.trang_thai === 0 ||
      user.trang_thai === false ||
      (user.trang_thai &&
        typeof user.trang_thai.readUInt8 === 'function' &&
        user.trang_thai.readUInt8(0) === 0)

    if (locked) {
      return res.status(403).json({ message: 'Tài khoản đang bị khóa' })
    }

    const ok = await bcrypt.compare(mat_khau, user.mat_khau)
    if (!ok) {
      return res.status(401).json({ message: 'Sai thông tin hoặc mật khẩu' })
    }

    const payload = {
      id: user.tai_khoan_id,
      ho_ten: user.ho_ten,
      email: user.email,
      ten_vai_tro: user.ten_vai_tro,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: payload,
    })
  } catch (err) {
    console.error('Lỗi đăng nhập:', err)
    return res.status(500).json({ message: 'Lỗi máy chủ' })
  }
}

export const troThanhNhaPhanPhoi = async (req, res) => {
  try {
    const userId = req.user.id

    const [rows] = await pool.query(
      'SELECT ten_vai_tro FROM tai_khoan WHERE tai_khoan_id = ? LIMIT 1',
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' })
    }

    const currentRole = rows[0].ten_vai_tro

    if (currentRole === 'Nhà phân phối') {
      return res
        .status(400)
        .json({ message: 'Tài khoản này đã là Nhà phân phối rồi' })
    }

    await pool.query(
      "UPDATE tai_khoan SET ten_vai_tro = 'Nhà phân phối' WHERE tai_khoan_id = ?",
      [userId]
    )

    return res.json({
      message:
        'Cập nhật thành Nhà phân phối thành công, vui lòng đăng nhập lại.',
    })
  } catch (err) {
    console.error('Lỗi đổi sang Nhà phân phối:', err)
    return res.status(500).json({ message: 'Lỗi máy chủ' })
  }
}

export const getDanhSachTaiKhoan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        tai_khoan_id,
        ho_ten,
        email,
        ten_vai_tro,
        sdt,
        CAST(trang_thai AS UNSIGNED) AS trang_thai
      FROM tai_khoan
      ORDER BY tai_khoan_id ASC
    `)

    return res.json({ users: rows })
  } catch (err) {
    console.error('Lỗi lấy danh sách tài khoản:', err)
    return res.status(500).json({ message: 'Lỗi lấy danh sách tài khoản' })
  }
}

export const khoaTaiKhoan = async (req, res) => {
  try {
    await pool.query(
      `UPDATE tai_khoan SET trang_thai = b'0' WHERE tai_khoan_id = ?`,
      [req.params.id]
    )
    return res.json({ message: 'Đã khóa tài khoản' })
  } catch (err) {
    console.error('Lỗi khóa tài khoản:', err)
    return res.status(500).json({ message: 'Lỗi khóa tài khoản' })
  }
}

export const moKhoaTaiKhoan = async (req, res) => {
  try {
    await pool.query(
      `UPDATE tai_khoan SET trang_thai = b'1' WHERE tai_khoan_id = ?`,
      [req.params.id]
    )
    return res.json({ message: 'Đã mở khóa tài khoản' })
  } catch (err) {
    console.error('Lỗi mở khóa tài khoản:', err)
    return res.status(500).json({ message: 'Lỗi mở khóa tài khoản' })
  }
}
export const adminXoaTaiKhoan = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ message: 'Thiếu id' })

    const currentId = req.user?.id ?? req.user?.tai_khoan_id
    if (currentId && Number(currentId) === id) {
      return res.status(400).json({ message: 'Không thể xoá chính mình' })
    }

    const [dh] = await pool.query(
      'SELECT COUNT(*) AS c FROM don_hang WHERE tai_khoan_id=?',
      [id]
    )
    if (dh[0].c > 0) {
      return res.status(400).json({
        message: 'Tài khoản đã có đơn hàng, không thể xoá cứng. Hãy dùng Khoá.'
      })
    }

    const [rs] = await pool.query('DELETE FROM tai_khoan WHERE tai_khoan_id=?', [id])
    if (rs.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản' })

    return res.json({ message: 'Đã xoá tài khoản' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Lỗi server khi xoá tài khoản' })
  }
}

export const quenMatKhau = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Thiếu email' })
    }

    const [rows] = await pool.query(
      'SELECT tai_khoan_id FROM tai_khoan WHERE email = ? LIMIT 1',
      [email]
    )
    if (!rows.length) {
      return res.status(404).json({ message: 'Email không tồn tại' })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // +10 phút

    await pool.query(
      'UPDATE tai_khoan SET ma_otp = ?, thoi_gian_ma = ? WHERE email = ?',
      [otp, expires, email]
    )

    await sendOTPEmail(email, otp)

    console.log('Đã tạo OTP', otp, 'cho', email)
    return res.json({
      message: 'Đã gửi OTP về email, vui lòng kiểm tra hộp thư.',
    })
  } catch (err) {
    console.error('Lỗi quên mật khẩu:', err)
    return res.status(500).json({
      message: 'Lỗi máy chủ: ' + (err.code || err.message || 'unknown'),
    })
  }
}

export const datMatKhauMoi = async (req, res) => {
  try {
    const { email, otp, mat_khau_moi } = req.body

    if (!email || !otp || !mat_khau_moi) {
      return res.status(400).json({ message: 'Thiếu dữ liệu' })
    }

    const [rows] = await pool.query(
      'SELECT ma_otp, thoi_gian_ma FROM tai_khoan WHERE email = ? LIMIT 1',
      [email]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Email không tồn tại' })
    }

    const user = rows[0]

    if (!user.ma_otp || !user.thoi_gian_ma) {
      return res
        .status(400)
        .json({ message: 'Bạn chưa yêu cầu OTP hoặc OTP đã được dùng' })
    }

    if (user.ma_otp !== otp) {
      return res.status(400).json({ message: 'OTP không đúng' })
    }

    if (new Date() > new Date(user.thoi_gian_ma)) {
      return res.status(400).json({ message: 'OTP đã hết hạn' })
    }

    const hash = await bcrypt.hash(mat_khau_moi, 10)

    await pool.query(
      'UPDATE tai_khoan SET mat_khau = ?, ma_otp = NULL, thoi_gian_ma = NULL WHERE email = ?',
      [hash, email]
    )

    return res.json({
      message: 'Đặt lại mật khẩu thành công, hãy đăng nhập lại.',
    })
  } catch (err) {
    console.error('Lỗi đặt mật khẩu mới:', err)
    return res.status(500).json({
      message: 'Lỗi máy chủ: ' + (err.code || err.message || 'unknown'),
    })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req)   // ⬅️ đổi chỗ này

    if (!userId) {
      return res
        .status(400)
        .json({ message: 'Không xác định được tài khoản từ token' })
    }

    const [rows] = await pool.query(
      `SELECT tai_khoan_id, ho_ten, email, ngay_sinh, dia_chi, gioi_tinh, so_cmnd, sdt
       FROM tai_khoan
       WHERE tai_khoan_id = ?`,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' })
    }

    return res.json(rows[0])
  } catch (err) {
    console.error('getCurrentUser error:', err)
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy thông tin người dùng' })
  }
}

export const updateCurrentUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req)
    const { ho_ten, dia_chi, sdt, so_cmnd, ngay_sinh, gioi_tinh } = req.body

    if (!userId) {
      return res
        .status(400)
        .json({ message: 'Không xác định được tài khoản từ token' })
    }

    await pool.query(
      `UPDATE tai_khoan
       SET ho_ten   = ?,
           dia_chi  = ?,
           sdt      = ?,
           so_cmnd  = ?,         
           ngay_sinh = ?,        -
           gioi_tinh = ?
       WHERE tai_khoan_id = ?`,
      [
        ho_ten || '',
        dia_chi || '',
        sdt || '',
        so_cmnd || '',           
        ngay_sinh || null,
        gioi_tinh || '',
        userId,
      ]
    )

    const [rows] = await pool.query(
      `SELECT tai_khoan_id,
              ho_ten,
              email,
              ngay_sinh,
              dia_chi,
              gioi_tinh,
              so_cmnd,
              sdt
       FROM tai_khoan
       WHERE tai_khoan_id = ?`,
      [userId]
    )

    return res.json(rows[0])
  } catch (err) {
    console.error('updateCurrentUser error:', err)
    res
      .status(500)
      .json({ message: 'Lỗi server khi cập nhật thông tin người dùng' })
  }
}
export const doiMatKhau = async (req, res) => {
  try {
    const userFromToken = req.user || {}
    const userId = userFromToken.tai_khoan_id ?? userFromToken.id

    const { mat_khau_cu, mat_khau_moi } = req.body

    if (!userId) {
      return res
        .status(400)
        .json({ message: 'Không xác định được tài khoản từ token' })
    }

    if (!mat_khau_cu || !mat_khau_moi) {
      return res
        .status(400)
        .json({ message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' })
    }

    const [rows] = await pool.query(
      'SELECT mat_khau FROM tai_khoan WHERE tai_khoan_id = ? LIMIT 1',
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' })
    }

    const user = rows[0]

    const ok = await bcrypt.compare(mat_khau_cu, user.mat_khau)
    if (!ok) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' })
    }

    const hash = await bcrypt.hash(mat_khau_moi, 10)
    const [result] = await pool.query(
      'UPDATE tai_khoan SET mat_khau = ? WHERE tai_khoan_id = ?',
      [hash, userId]
    )

    if (result.affectedRows === 0) {
      return res
        .status(500)
        .json({ message: 'Không cập nhật được mật khẩu (affectedRows = 0)' })
    }

    return res.json({ message: 'Đổi mật khẩu thành công' })
  } catch (err) {
    console.error('doiMatKhau error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi server khi đổi mật khẩu' })
  }
}
