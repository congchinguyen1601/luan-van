import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import {
  dangKyNhaPhanPhoi,
  getNppCuaToi,
  getAllNppAdmin,
  duyetNpp,
  tuChoiNpp,
  getShopsPublic,
} from '../controller/nhaPhanPhoiController.js'

const router = express.Router()

// user gửi yêu cầu đăng ký NPP
router.post('/dang-ky', requireAuth, dangKyNhaPhanPhoi)

// user xem thông tin NPP của chính mình
router.get('/me', requireAuth, getNppCuaToi)
router.get('/public-shops', getShopsPublic)

// admin danh sách NPP
router.get('/admin', requireAuth, requireAdmin, getAllNppAdmin)

// admin duyệt NPP
router.patch('/admin/:id/duyet', requireAuth, requireAdmin, duyetNpp)

// admin từ chối NPP
router.patch('/admin/:id/tu-choi', requireAuth, requireAdmin, tuChoiNpp)

export default router
