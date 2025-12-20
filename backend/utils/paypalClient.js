// backend/utils/paypalClient.js
import paypal from '@paypal/checkout-server-sdk'

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Thiếu PAYPAL_CLIENT_ID hoặc PAYPAL_CLIENT_SECRET trong .env')
  }

  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  }

  // mặc định sandbox
  return new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

export function getPayPalClient() {
  const env = environment()
  return new paypal.core.PayPalHttpClient(env)
}
