import express from 'express'
import { upload } from '../middleware/upload.js'
import {
  requireAuth,
  requireAdmin,
  requireDistributor,
} from '../middleware/auth.js'

import {
  getSanPhamPublic,
  getSanPhamChiTietPublic,
  getSanPhamNPP,
  taoSanPhamNPP,
  capNhatSanPhamNPP,
  xoaSanPhamNPP,
  getSanPhamAdmin,
  getSanPhamByNPPPublic,
  capNhatSanPhamAdmin,
  xoaSanPhamAdmin,
} from '../controller/sanPhamController.js'

const router = express.Router()


router.get('/public', getSanPhamPublic)
router.get('/:id/public', getSanPhamChiTietPublic)
router.get('/shop/:nppId', getSanPhamByNPPPublic)

//npp
router.get('/npp', requireAuth, requireDistributor, getSanPhamNPP)

router.post(
  '/npp',
  requireAuth,
  requireDistributor,
  upload.fields([
    { name: 'hinh_anh', maxCount: 1 }, // ảnh chính
    { name: 'hinh_anh_chi_tiet', maxCount: 10 }, // ảnh chi tiết
  ]),
  taoSanPhamNPP
)

router.put(
  '/npp/:id',
  requireAuth,
  requireDistributor,
  upload.fields([
    { name: 'hinh_anh', maxCount: 1 },
    { name: 'hinh_anh_chi_tiet', maxCount: 10 },
  ]),
  capNhatSanPhamNPP
)

router.delete('/npp/:id', requireAuth, requireDistributor, xoaSanPhamNPP)

//adminn
router.use(requireAuth, requireAdmin)
router.get('/', getSanPhamAdmin)

// admin update được cả ảnh chi tiết
router.put(
  '/:id',
  upload.fields([
    { name: 'hinh_anh', maxCount: 1 },
    { name: 'hinh_anh_chi_tiet', maxCount: 10 },
  ]),
  capNhatSanPhamAdmin
)

router.delete('/:id', xoaSanPhamAdmin)

export default router
