const express = require('express')
const { authOptional } = require('../middleware/auth')

const authRoutes = require('./auth')
const projectRoutes = require('./projects')
const taskRoutes = require('./tasks')
const dashboardRoutes = require('./dashboard')

const apiRouter = express.Router()
apiRouter.use(authOptional)

apiRouter.use('/auth', authRoutes)
apiRouter.use('/projects', projectRoutes)
apiRouter.use('/tasks', taskRoutes)
apiRouter.use('/dashboard', dashboardRoutes)

module.exports = { apiRouter }

