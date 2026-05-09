const path = require('path')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const { connectDb } = require('./lib/db')
const { apiRouter } = require('./routes')

require('dotenv').config()

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', apiRouter)

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../../client/dist')
  app.use(express.static(dist))
  // Express v5 (path-to-regexp v6): prefer regex for SPA fallback.
  // This serves the React app for any non-API route.
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = Number(process.env.PORT || 3001)

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on :${port}`)
    })
  })
  .catch((err) => {
    console.error('DB connection failed', err)
    process.exit(1)
  })

