const express = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const User = require('../models/User')
const { signToken, setAuthCookie, clearAuthCookie } = require('../lib/auth')
const { badRequest, ok, unauthorized } = require('../lib/http')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
})

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())

  const { name, email, password } = parsed.data
  const exists = await User.findOne({ email: email.toLowerCase() }).lean()
  if (exists) return badRequest(res, 'Email already in use')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash })
  const token = signToken({ sub: String(user._id) })
  setAuthCookie(res, token)
  return ok(res, { user: { id: String(user._id), name: user.name, email: user.email } })
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())

  const { email, password } = parsed.data
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return unauthorized(res, 'Invalid credentials')
  const okPass = await bcrypt.compare(password, user.passwordHash)
  if (!okPass) return unauthorized(res, 'Invalid credentials')

  const token = signToken({ sub: String(user._id) })
  setAuthCookie(res, token)
  return ok(res, { user: { id: String(user._id), name: user.name, email: user.email } })
})

router.post('/logout', async (_req, res) => {
  clearAuthCookie(res)
  return ok(res, { ok: true })
})

router.get('/me', async (req, res) => {
  return ok(res, { user: req.user || null })
})

router.get('/require', authRequired, async (req, res) => {
  return ok(res, { user: req.user })
})

module.exports = router

