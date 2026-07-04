import crypto from 'crypto'
import type {
  IyzicoPaymentInitRequest,
  IyzicoPaymentInitResponse,
  IyzicoRetrieveResponse,
} from './types'

const SANDBOX_BASE = 'https://sandbox-api.iyzipay.com'
const PRODUCTION_BASE = 'https://api.iyzipay.com'

function generateRandomString(): string {
  return crypto.randomBytes(12).toString('hex')
}

function generateSignature(
  apiKey: string,
  secretKey: string,
  randomString: string,
  body: string
): string {
  const message = apiKey + randomString + secretKey + body
  return crypto.createHmac('SHA256', secretKey).update(message).digest('base64')
}

export async function initializePayment(
  request: IyzicoPaymentInitRequest,
  clientIp: string
): Promise<IyzicoPaymentInitResponse> {
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY

  const isConfigured =
    apiKey &&
    secretKey &&
    apiKey !== 'your_iyzico_api_key' &&
    secretKey !== 'your_iyzico_secret_key'

  if (!isConfigured) {
    return {
      status: 'success',
      locale: 'tr',
      systemTime: Date.now(),
      conversationId: request.conversationId,
      token: `sandbox_${request.conversationId}`,
      isSandbox: true,
    }
  }

  const baseUrl = process.env.IYZICO_BASE_URL ?? SANDBOX_BASE
  const isProduction = baseUrl.startsWith(PRODUCTION_BASE)

  const payload: IyzicoPaymentInitRequest = {
    ...request,
    buyer: { ...request.buyer, ip: isProduction ? clientIp : '85.34.78.112' },
  }

  const body = JSON.stringify(payload)
  const randomString = generateRandomString()
  const signature = generateSignature(apiKey!, secretKey!, randomString, body)

  const res = await fetch(`${baseUrl}/payment/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'dalindankapiya-1.0.0',
      Authorization: `IYZICO ${apiKey}:${signature}`,
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`Iyzico API ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

export async function retrievePayment(
  token: string,
  conversationId: string
): Promise<IyzicoRetrieveResponse> {
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY

  const isConfigured =
    apiKey &&
    secretKey &&
    apiKey !== 'your_iyzico_api_key' &&
    secretKey !== 'your_iyzico_secret_key'

  if (!isConfigured) {
    return {
      status: 'success',
      paymentStatus: 'SUCCESS',
      conversationId,
      isSandbox: true,
    }
  }

  const baseUrl = process.env.IYZICO_BASE_URL ?? SANDBOX_BASE
  const payload = JSON.stringify({ locale: 'tr', conversationId, token })
  const randomString = generateRandomString()
  const signature = generateSignature(apiKey!, secretKey!, randomString, payload)

  const res = await fetch(`${baseUrl}/payment/initialize/retrieve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'dalindankapiya-1.0.0',
      Authorization: `IYZICO ${apiKey}:${signature}`,
    },
    body: payload,
  })

  if (!res.ok) {
    throw new Error(`Iyzico retrieve ${res.status}: ${await res.text()}`)
  }

  return res.json()
}
