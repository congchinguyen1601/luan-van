import express from 'express'
import {
  requireAuth,
  requireAdmin,
  requireDistributor,
} from '../middleware/auth.js'
import {
  thongKeAdminTheoNPP,
  thongKeAdminTheoSanPham,
  thongKeNPPTongQuan,
  thongKeNPPTheoSanPham,
  exportThongKeAdminPDF,
  exportThongKeNPPPDF,
} from '../controller/thongKeController.js'

const router = express.Router()

//admin 
router.get(
  '/admin/theo-npp',
  requireAuth,
  requireAdmin,
  thongKeAdminTheoNPP
)

router.get(
  '/admin/theo-san-pham',
  requireAuth,
  requireAdmin,
  thongKeAdminTheoSanPham
)

router.get(
  '/admin/export-pdf',
  requireAuth,
  requireAdmin,
  exportThongKeAdminPDF
)

//npp
router.get(
  '/npp/tong-quan',
  requireAuth,
  requireDistributor,
  thongKeNPPTongQuan
)

router.get(
  '/npp/theo-san-pham',
  requireAuth,
  requireDistributor,
  thongKeNPPTheoSanPham
)

router.get(
  '/npp/export-pdf',
  requireAuth,
  requireDistributor,
  exportThongKeNPPPDF
)

export default router
