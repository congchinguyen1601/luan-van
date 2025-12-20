import { useEffect } from 'react'
import api from '../../services/api'

export default function ThanhToanPaypal({ donHangId }) {
  useEffect(() => {
    if (!window.paypal || !donHangId) return

    window.paypal
      .Buttons({
        createOrder: async () => {
          const res = await api.post('/paypal/create-order', {
            don_hang_id: donHangId,
          })
          return res.data.id 
        },
        onApprove: async (data) => {
          try {
            await api.post('/paypal/capture-order', {
              orderID: data.orderID,
            })
            alert('Thanh toán PayPal thành công!')
          } catch (err) {
            console.error(err)
            alert('Lỗi xác nhận thanh toán')
          }
        },
        onError: (err) => {
          console.error(err)
          alert('Có lỗi khi thanh toán PayPal')
        },
      })
      .render('#paypal-button-container')
  }, [donHangId])

  return (
    <div>
      <h3>Thanh toán qua PayPal</h3>
      <div id="paypal-button-container"></div>
    </div>
  )
}
