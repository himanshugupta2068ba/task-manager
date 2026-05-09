const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')

const Project = require('../models/Project')
const Membership = require('../models/Membership')
const User = require('../models/User')
const Task = require('../models/Task')
const { authRequired } = require('../middleware/auth')
const { requireMembership, requireAdmin } = require('../middleware/projectAccess')
const { badRequest, ok, notFound } = require('../lib/http')

const router = express.Router()
router.use(authRequired)

router.get('/', async (req, res) => {
  const memberships = await Membership.find({ userId: req.user.id }).lean()
  const projectIds = memberships.map((m) => m.projectId)
  const projects = await Project.find({ _id: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .lean()

  const roleByProject = new Map(memberships.map((m) => [String(m.projectId), m.role]))
  return ok(res, {
    projects: projects.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      role: roleByProject.get(String(p._id)) || 'MEMBER',
    })),
  })
})

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(''),
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())

  const project = await Project.create({
    name: parsed.data.name,
    description: parsed.data.description || '',
    createdBy: req.user.id,
  })
  await Membership.create({ projectId: project._id, userId: req.user.id, role: 'ADMIN' })
  return ok(res, { project: { id: String(project._id), name: project.name, description: project.description } })
})

router.get('/:projectId', requireMembership, async (req, res) => {
  const { projectId } = req.params
  const project = await Project.findById(projectId).lean()
  if (!project) return notFound(res, 'Project not found')

  const members = await Membership.find({ projectId }).lean()
  const users = await User.find({ _id: { $in: members.map((m) => m.userId) } })
    .select('_id name email')
    .lean()
  const userById = new Map(users.map((u) => [String(u._id), u]))

  // quick stats
  const counts = await Task.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]))

  return ok(res, {
    project: { id: String(project._id), name: project.name, description: project.description },
    membership: req.membership,
    members: members.map((m) => ({
      id: String(m._id),
      role: m.role,
      user: (() => {
        const u = userById.get(String(m.userId))
        return u ? { id: String(u._id), name: u.name, email: u.email } : { id: String(m.userId), name: 'Unknown', email: '' }
      })(),
    })),
    stats: { TODO: byStatus.TODO || 0, IN_PROGRESS: byStatus.IN_PROGRESS || 0, DONE: byStatus.DONE || 0 },
  })
})

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
})

router.post('/:projectId/members', requireMembership, requireAdmin, async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('_id name email').lean()
  if (!user) return badRequest(res, 'No user found with that email')

  try {
    const membership = await Membership.create({
      projectId: req.params.projectId,
      userId: user._id,
      role: parsed.data.role,
    })
    return ok(res, {
      member: { id: String(membership._id), role: membership.role, user: { id: String(user._id), name: user.name, email: user.email } },
    })
  } catch (e) {
    return badRequest(res, 'User is already a member of this project')
  }
})

const updateRoleSchema = z.object({ role: z.enum(['ADMIN', 'MEMBER']) })

router.patch('/:projectId/members/:membershipId', requireMembership, requireAdmin, async (req, res) => {
  const parsed = updateRoleSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())
  const updated = await Membership.findOneAndUpdate(
    { _id: req.params.membershipId, projectId: req.params.projectId },
    { $set: { role: parsed.data.role } },
    { new: true },
  ).lean()
  if (!updated) return notFound(res, 'Member not found')
  return ok(res, { member: { id: String(updated._id), role: updated.role, userId: String(updated.userId) } })
})

module.exports = router

