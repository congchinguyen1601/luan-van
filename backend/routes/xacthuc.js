import express from 'express'
import {
  requireAuth,
  requireAdmin,
} from '../middleware/auth.js'
import {
  dangKyKhachHang,
  dangKyNhaPhanPhoi,
  dangNhap,
  troThanhNhaPhanPhoi,
  getDanhSachTaiKhoan,
  khoaTaiKhoan,
  moKhoaTaiKhoan,
  quenMatKhau,
  datMatKhauMoi,
  getCurrentUser, 
  updateCurrentUser,
  doiMatKhau,
  adminXoaTaiKhoan,

} from '../controller/xacThucController.js'

const router = express.Router()
router.post('/dang-ky', dangKyKhachHang)
router.post('/dang-ky-nha-phan-phoi', dangKyNhaPhanPhoi)
router.post('/dang-nhap', dangNhap)

router.post(
  '/tro-thanh-nha-phan-phoi',
  requireAuth,
  troThanhNhaPhanPhoi
)

//admin quản lý tài khoản
router.get(
  '/tai-khoan',
  requireAuth,
  requireAdmin,
  getDanhSachTaiKhoan
)

router.patch(
  '/tai-khoan/:id/khoa',
  requireAuth,
  requireAdmin,
  khoaTaiKhoan
)

router.patch(
  '/tai-khoan/:id/mo-khoa',
  requireAuth,
  requireAdmin,
  moKhoaTaiKhoan
)
router.delete(
  '/tai-khoan/:id',
  requireAuth,
  requireAdmin,
  adminXoaTaiKhoan
)
// quên mật khẩu otp
router.post('/quen-mat-khau', quenMatKhau)
router.post('/dat-mat-khau-moi', datMatKhauMoi)
router.post('/doi-mat-khau', requireAuth, doiMatKhau)


router.get('/me', requireAuth, getCurrentUser)
router.put('/me', requireAuth, updateCurrentUser)
export default router
