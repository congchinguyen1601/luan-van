import express from 'express'
import {
  getAllMaGiamGia,
  getMaGiamGiaById,
  createMaGiamGia,
  updateMaGiamGia,
  deleteMaGiamGia,
  applyMaGiamGia,
  getMyVouchers,
  getAvailableVouchers,
} from '../controller/maGiamGiaController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

//
router.get('/available', getAvailableVouchers)
router.get('/my', requireAuth, getMyVouchers)
router.post('/apply', requireAuth, applyMaGiamGia)


router.use(requireAuth, requireAdmin)
router.get('/', getAllMaGiamGia)
router.get('/:id', getMaGiamGiaById)
router.post('/', createMaGiamGia)
router.put('/:id', updateMaGiamGia)
router.delete('/:id', deleteMaGiamGia)

export default router
