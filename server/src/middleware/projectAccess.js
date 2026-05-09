const mongoose = require('mongoose')
const Membership = require('../models/Membership')
const { forbidden, notFound } = require('../lib/http')

function getProjectIdFromReq(req) {
  return req.params.projectId || req.params.id
}

async function requireMembership(req, res, next) {
  const projectId = getProjectIdFromReq(req)
  if (!mongoose.isValidObjectId(projectId)) return notFound(res, 'Project not found')
  const membership = await Membership.findOne({ projectId, userId: req.user.id }).lean()
  if (!membership) return forbidden(res, 'Not a member of this project')
  req.membership = { role: membership.role, projectId: String(membership.projectId) }
  return next()
}

function requireAdmin(req, res, next) {
  if (!req.membership || req.membership.role !== 'ADMIN') return forbidden(res, 'Admin role required')
  return next()
}

module.exports = { requireMembership, requireAdmin }

