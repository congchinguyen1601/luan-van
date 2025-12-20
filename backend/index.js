import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import pool from './db.js'
import xacThucRoutes from './routes/xacthuc.js'
import sanPhamRoutes from './routes/sanpham.js'
import { requireAuth, requireAdmin } from './middleware/auth.js'
import danhMucRoutes from './routes/danhmuc.js'
import donHangRoutes from './routes/donhang.js'
import nhaPhanPhoiRoutes from './routes/nhaPhanPhoi.js'
import paypalRouter from './routes/paypal.js'
import maGiamGiaRouter from './routes/maGiamGia.js'
import danhGiaRoutes from './routes/danhGia.js'
import thongKeRoutes from './routes/thongke.js' 

dotenv.config()

const PORT = process.env.PORT || 4000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/xac-thuc', xacThucRoutes)   
app.use('/api/san-pham', sanPhamRoutes)
app.use('/api/danh-muc', danhMucRoutes)
app.use('/api/don-hang', donHangRoutes)
app.use('/api/nha-phan-phoi', nhaPhanPhoiRoutes)
app.use('/api/paypal', paypalRouter)
app.use('/api/ma-giam-gia', maGiamGiaRouter)
app.use('/api/danh-gia', danhGiaRoutes)
app.use('/api/thong-ke', thongKeRoutes)


app.get('/', (req, res) => {
  res.json({ message: 'Backend nông sản sạch đang chạy!' })
})

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS kq')
    res.json({ message: 'Kết nối DB OK', result: rows[0].kq })
  } catch (err) {
    console.error('Lỗi test DB:', err)
    res.status(500).json({ message: 'DB lỗi', error: err.code || err.message })
  }
})

// 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Không tìm thấy route' })
})

// Lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi Express:', err)
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Lỗi máy chủ', error: err.code })
})

app.listen(PORT, () => {
  console.log(`Backend đang chạy tại: http://localhost:${PORT}`)
  console.log(`Cho phép frontend: ${CLIENT_URL}`)
})
