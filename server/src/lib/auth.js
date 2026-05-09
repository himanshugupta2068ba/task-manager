const jwt = require('jsonwebtoken')

function getJwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('Missing JWT_SECRET')
  return s
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret())
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  })
}

module.exports = { signToken, verifyToken, setAuthCookie, clearAuthCookie }

