const express = require('express')
const mongoose = require('mongoose')
const { z } = require('zod')

const Task = require('../models/Task')
const Membership = require('../models/Membership')
const User = require('../models/User')
const { authRequired } = require('../middleware/auth')
const { badRequest, ok, forbidden, notFound } = require('../lib/http')

const router = express.Router()
router.use(authRequired)

async function ensureProjectMember(req, projectId) {
  const membership = await Membership.findOne({ projectId, userId: req.user.id }).lean()
  if (!membership) return null
  return { role: membership.role }
}

router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params
  if (!mongoose.isValidObjectId(projectId)) return notFound(res, 'Project not found')
  const mem = await ensureProjectMember(req, projectId)
  if (!mem) return forbidden(res, 'Not a member of this project')

  const tasks = await Task.find({ projectId })
    .sort({ createdAt: -1 })
    .lean()

  const assigneeIds = [...new Set(tasks.map((t) => (t.assigneeId ? String(t.assigneeId) : null)).filter(Boolean))]
  const users = await User.find({ _id: { $in: assigneeIds } }).select('_id name email').lean()
  const userById = new Map(users.map((u) => [String(u._id), u]))

  return ok(res, {
    tasks: tasks.map((t) => ({
      id: String(t._id),
      projectId: String(t.projectId),
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.dueDate,
      assignee: t.assigneeId
        ? (() => {
            const u = userById.get(String(t.assigneeId))
            return u ? { id: String(u._id), name: u.name, email: u.email } : { id: String(t.assigneeId), name: 'Unknown', email: '' }
          })()
        : null,
      createdAt: t.createdAt,
    })),
  })
})

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().default(''),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())
  const { projectId, title, description, assigneeId, dueDate } = parsed.data
  if (!mongoose.isValidObjectId(projectId)) return notFound(res, 'Project not found')
  const mem = await ensureProjectMember(req, projectId)
  if (!mem) return forbidden(res, 'Not a member of this project')

  if (assigneeId && !mongoose.isValidObjectId(assigneeId)) return badRequest(res, 'Invalid assigneeId')
  if (assigneeId) {
    const assigneeMember = await Membership.findOne({ projectId, userId: assigneeId }).lean()
    if (!assigneeMember) return badRequest(res, 'Assignee must be a project member')
  }

  const task = await Task.create({
    projectId,
    title,
    description: description || '',
    assigneeId: assigneeId || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: req.user.id,
  })
  return ok(res, { task: { id: String(task._id) } })
})

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

router.patch('/:taskId', async (req, res) => {
  const { taskId } = req.params
  if (!mongoose.isValidObjectId(taskId)) return notFound(res, 'Task not found')
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid input', parsed.error.flatten())

  const task = await Task.findById(taskId).lean()
  if (!task) return notFound(res, 'Task not found')

  const mem = await ensureProjectMember(req, String(task.projectId))
  if (!mem) return forbidden(res, 'Not a member of this project')

  if (parsed.data.assigneeId && !mongoose.isValidObjectId(parsed.data.assigneeId)) {
    return badRequest(res, 'Invalid assigneeId')
  }
  if (parsed.data.assigneeId) {
    const assigneeMember = await Membership.findOne({ projectId: task.projectId, userId: parsed.data.assigneeId }).lean()
    if (!assigneeMember) return badRequest(res, 'Assignee must be a project member')
  }

  const update = { ...parsed.data }
  if ('dueDate' in update) update.dueDate = update.dueDate ? new Date(update.dueDate) : null

  const updated = await Task.findByIdAndUpdate(taskId, { $set: update }, { new: true }).lean()
  return ok(res, { task: { id: String(updated._id), status: updated.status } })
})

router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params
  if (!mongoose.isValidObjectId(taskId)) return notFound(res, 'Task not found')
  const task = await Task.findById(taskId).lean()
  if (!task) return notFound(res, 'Task not found')
  const mem = await ensureProjectMember(req, String(task.projectId))
  if (!mem) return forbidden(res, 'Not a member of this project')
  // allow delete only for admins
  if (mem.role !== 'ADMIN') return forbidden(res, 'Admin role required to delete tasks')
  await Task.deleteOne({ _id: taskId })
  return ok(res, { ok: true })
})

module.exports = router

