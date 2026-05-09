function ok(res, data) {
  res.json(data)
}

function badRequest(res, message, details) {
  res.status(400).json({ message, details })
}

function unauthorized(res, message = 'Unauthorized') {
  res.status(401).json({ message })
}

function forbidden(res, message = 'Forbidden') {
  res.status(403).json({ message })
}

function notFound(res, message = 'Not found') {
  res.status(404).json({ message })
}

module.exports = { ok, badRequest, unauthorized, forbidden, notFound }

