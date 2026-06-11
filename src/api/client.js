const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = `API ${method} ${path} failed: ${res.status}`
    try { const d = await res.json(); if (d.error) msg = d.error } catch {}
    throw new Error(msg)
  }
  return res.json()
}

const api = {
  getAll: (entity) => request('GET', `/${entity}`),
  post:   (entity, body) => request('POST', `/${entity}`, body),
  put:    (entity, id, body) => request('PUT', `/${entity}/${id}`, body),
  del:    (entity, id) => request('DELETE', `/${entity}/${id}`),
}

export default api
