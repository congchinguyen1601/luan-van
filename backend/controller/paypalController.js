import paypal from '@paypal/checkout-server-sdk'
import pool from '../db.js'
import { getPayPalClient } from '../utils/paypalClient.js'

const VND_TO_USD_RATE = 24000


export const createPayPalOrder = async (req, res) => {
  try {
    const { don_hang_id } = req.body

    if (!don_hang_id) {
      return res.status(400).json({ message: 'Thiếu don_hang_id' })
    }

    const [rows] = await pool.query(
      `
      SELECT don_hang_id, tong_tien, trang_thai_thanh_toan, paypal_order_id
      FROM don_hang
      WHERE don_hang_id = ?
      LIMIT 1
      `,
      [don_hang_id]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    }

    const order = rows[0]

    if (order.trang_thai_thanh_toan === 'THANH_CONG') {
      return res.status(400).json({ message: 'Đơn này đã thanh toán rồi' })
    }

    const tongTienVND = Number(order.tong_tien || 0)
    if (!tongTienVND || tongTienVND <= 0) {
      return res.status(400).json({ message: 'Tổng tiền không hợp lệ' })
    }

    const amountUSD = (tongTienVND / VND_TO_USD_RATE).toFixed(2)

    const client = getPayPalClient()

    const request = new paypal.orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(order.don_hang_id),
          amount: {
            currency_code: 'USD',
            value: amountUSD,
          },
        },
      ],
    })

    const response = await client.execute(request)
    const paypalOrderId = response.result.id

    await pool.query(
      `
      UPDATE don_hang
      SET paypal_order_id = ?,
          trang_thai_thanh_toan = 'CHO_THANH_TOAN'
      WHERE don_hang_id = ?
      `,
      [paypalOrderId, don_hang_id]
    )

    return res.json({
      id: paypalOrderId,
      status: response.result.status,
    })
  } catch (err) {
    console.error('createPayPalOrder error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi tạo đơn thanh toán PayPal' })
  }
}

export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID } = req.body

    if (!orderID) {
      return res.status(400).json({ message: 'Thiếu orderID' })
    }

    const client = getPayPalClient()
    const request = new paypal.orders.OrdersCaptureRequest(orderID)
    request.requestBody({})

    const capture = await client.execute(request)
    const status = capture.result.status 

    const [rows] = await pool.query(
      `
      SELECT don_hang_id
      FROM don_hang
      WHERE paypal_order_id = ?
      LIMIT 1
      `,
      [orderID]
    )

    if (rows.length) {
      const donHangId = rows[0].don_hang_id
      const newStatus =
        status === 'COMPLETED' ? 'THANH_CONG' : 'THAT_BAI'

      await pool.query(
        `
        UPDATE don_hang
        SET trang_thai_thanh_toan = ?
        WHERE don_hang_id = ?
        `,
        [newStatus, donHangId]
      )
    }

    return res.json({
      status,
      raw: capture.result,
    })
  } catch (err) {
    console.error('capturePayPalOrder error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi xác nhận thanh toán PayPal' })
  }
}
