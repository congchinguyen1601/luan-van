import express from 'express'
import {
  createDanhGia,
  getDanhGiaSanPham,
  getDanhGiaNPP,
  getDanhGiaAdmin,
  updateTrangThaiDanhGia,
} from '../controller/danhGiaController.js'
import {
  requireAuth,
  requireDistributor,
  requireAdmin,
} from '../middleware/auth.js'

const router = express.Router()

// user tạo đánh giá
router.post('/', requireAuth, createDanhGia)

// lấy đánh giá theo sản phẩm (public)
router.get('/san-pham/:id', getDanhGiaSanPham)

// NPP xem đánh giá sản phẩm của mình
router.get('/npp', requireAuth, getDanhGiaNPP)

// Admin xem + bật/tắt
router.get('/admin', requireAdmin, getDanhGiaAdmin)
router.patch('/:id/trang-thai', requireAdmin, updateTrangThaiDanhGia)

export default router
