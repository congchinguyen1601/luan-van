import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Hàm gửi OTP
export async function sendOTPEmail(to, otp) {
  const mailOptions = {
    from: `"Nông sản sạch" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Mã OTP đặt lại mật khẩu',
    text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `<p>Mã OTP của bạn là: <b>${otp}</b></p><p>Mã có hiệu lực trong 10 phút.</p>`,
  }

  await transporter.sendMail(mailOptions)
}
