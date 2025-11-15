import crypto from 'crypto'

const IP_SALT = process.env.RATING_IP_SALT || 'default-salt-change-in-production'

export function getClientIp(request: Request): string | null {
  const headers = request.headers
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()

  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  return null
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  return crypto.createHash('sha256').update(ip + IP_SALT).digest('hex')
}
