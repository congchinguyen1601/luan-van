import express from 'express'
import {
  requireAuth,
  requireAdmin,
  requireDistributor,
} from '../middleware/auth.js'

import {
  getDanhMucPublic,
  getDanhMucNPP,
  createDanhMucNPP,
  getDanhMucAdmin,

  updateDanhMucAdmin,
  duyetDanhMucAdmin,
  huyDuyetDanhMucAdmin,
  deleteDanhMucAdmin,
} from '../controller/danhMucController.js'

const router = express.Router()

router.get('/public', getDanhMucPublic)

//npp
router.get('/npp', requireAuth, requireDistributor, getDanhMucNPP)
router.post('/npp', requireAuth, requireDistributor, createDanhMucNPP)

//admin
router.use(requireAuth, requireAdmin)

router.get('/', getDanhMucAdmin)
router.put('/:id', updateDanhMucAdmin)
router.patch('/:id/duyet', duyetDanhMucAdmin)
router.patch('/:id/huy-duyet', huyDuyetDanhMucAdmin)
router.delete('/:id', deleteDanhMucAdmin)

export default router
