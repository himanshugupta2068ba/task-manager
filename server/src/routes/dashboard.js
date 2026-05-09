const express = require('express')
const Task = require('../models/Task')
const Membership = require('../models/Membership')
const { authRequired } = require('../middleware/auth')
const { ok } = require('../lib/http')

const router = express.Router()
router.use(authRequired)

router.get('/', async (req, res) => {
  const userId = req.user.id
  const memberships = await Membership.find({ userId }).lean()
  const projectIds = memberships.map((m) => m.projectId)

  const tasks = await Task.find({ projectId: { $in: projectIds }, assigneeId: userId })
    .sort({ dueDate: 1, createdAt: -1 })
    .lean()

  const now = new Date()
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'DONE')

  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
  for (const t of tasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1

  return ok(res, {
    summary: { assigned: tasks.length, overdue: overdue.length, byStatus },
    overdue: overdue.slice(0, 20).map((t) => ({
      id: String(t._id),
      projectId: String(t.projectId),
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
    })),
  })
})

module.exports = router

