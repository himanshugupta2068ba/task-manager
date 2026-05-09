export type ApiError = { message: string; details?: unknown }

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return text
  }
}

export async function api<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(opts.headers)
  if (opts.json !== undefined) headers.set('Content-Type', 'application/json')
  const res = await fetch(path, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    credentials: 'include',
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
      `Request failed (${res.status})`
    const err: ApiError = { message: String(msg), details: data }
    throw err
  }
  return data as T
}

