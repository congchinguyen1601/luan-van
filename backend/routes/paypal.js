import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createPayPalOrder,
  capturePayPalOrder,
} from '../controller/paypalController.js'

const router = express.Router()

// user đã đăng nhập tạo order PayPal
router.post('/create-order', requireAuth, createPayPalOrder)
// capture sau khi user approve bên PayPal
router.post('/capture-order', requireAuth, capturePayPalOrder)

export default router
