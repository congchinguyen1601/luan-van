import mysql2 from 'mysql2/promise'
import 'dotenv/config'   

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luanvan1',
  charset: 'utf8mb4_general_ci',
})

export default pool
