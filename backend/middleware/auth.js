import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_tam_thoi'

const normalizeRole = (raw = '') =>
  raw
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const getRoleFromUser = (user = {}) => {
  return normalizeRole(
    user.ten_vai_tro ||
      user.vai_tro ||
      user.role ||
      user.loai_tai_khoan ||
      ''
  )
}

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Thiếu token',
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Thiếu token',
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded

    console.log('AUTH -> USER DECODED:', decoded)

    next()
  } catch (err) {
    console.error('AUTH -> Lỗi verify token:', err)
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const role = getRoleFromUser(req.user)
  console.log('AUTH -> requireAdmin, role =', role, 'raw =', req.user.ten_vai_tro)

  if (!role) {
    return res.status(403).json({ message: 'Không có quyền truy cập' })
  }

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' })
  }

  next()
}

export const requireDistributor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'UNAUTHORIZED' })
  }

  const rawRole = req.user.ten_vai_tro || ''
  const role = rawRole
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (!role.includes('nha phan phoi')) {
    return res
      .status(403)
      .json({ message: 'FORBIDDEN: Bạn không phải Nhà phân phối.' })
  }

  next()
}


// ========== ADMIN HOẶC NHÀ PHÂN PHỐI ==========
export const requireAdminOrDistributor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa đăng nhập' })
  }

  const role = getRoleFromUser(req.user)
  console.log('AUTH -> requireAdminOrDistributor, role =', role, 'raw =', req.user.ten_vai_tro)

  const isAdmin = role === 'admin'
  const isDistributor =
    role === 'nha phan phoi' || role.includes('nha phan phoi')

  if (!isAdmin && !isDistributor) {
    return res.status(403).json({ message: 'Không có quyền truy cập' })
  }

  next()
}
