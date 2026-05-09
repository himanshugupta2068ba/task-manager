const User = require('../models/User')
const { verifyToken } = require('../lib/auth')
const { unauthorized } = require('../lib/http')

async function authOptional(req, _res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null)
    if (!token) {
      req.user = null
      return next()
    }
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.sub).select('_id name email').lean()
    req.user = user ? { id: String(user._id), name: user.name, email: user.email } : null
    return next()
  } catch {
    req.user = null
    return next()
  }
}

function authRequired(req, res, next) {
  if (!req.user) return unauthorized(res)
  return next()
}

module.exports = { authOptional, authRequired }

