import express from 'express'
import {
  requireAuth,
  requireAdmin,
  requireDistributor,
} from '../middleware/auth.js'
import {
  createDonHang,
  getDonHangNPP,
  getDonHangUser,
  capNhatTrangThaiDonHangNPP,
  updateTrangThaiUser,
  yeuCauTraHangUser,
  getYeuCauTraHangNPP,
  xuLyYeuCauTraHangNPP,
} from '../controller/donHangController.js'

const router = express.Router()

//user
router.post('/', requireAuth, createDonHang)
router.get('/user', requireAuth, getDonHangUser)

router.patch(
  '/user/trang-thai/:id',
  requireAuth,
  updateTrangThaiUser
)

router.post(
  '/user/yeu-cau-tra-hang',
  requireAuth,
  yeuCauTraHangUser
)

//npp
router.get(
  '/npp',
  requireAuth,
  requireDistributor,
  getDonHangNPP
)

// cập nhật trạng thái
router.patch(
  '/npp/:id/trang-thai',
  requireAuth,
  requireDistributor,
  capNhatTrangThaiDonHangNPP
)

// npp xem danh sách yêu cầu trả hàng
router.get(
  '/npp/yeu-cau-tra-hang',
  requireAuth,
  requireDistributor,
  getYeuCauTraHangNPP
)

// npp duyệt / từ chối yêu cầu trả hàng
router.patch(
  '/npp/yeu-cau-tra-hang/:id',
  requireAuth,
  requireDistributor,
  xuLyYeuCauTraHangNPP
)


export default router
