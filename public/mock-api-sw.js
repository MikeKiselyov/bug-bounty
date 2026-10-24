// Mock backend of the "API: user profile" case (CASE-05).
// It answers requests under <scope>/pulse-api/ so they show up in the DevTools Network tab.
// Everything else passes through untouched. Planted bugs are marked with "BUG API-xx".

const STATE_CACHE = 'pulse-api-state'
const STATE_KEY = 'state'
const CURRENT_USER_ID = 1042
const BIO_MAX_LENGTH = 160

function createDefaultState() {
  return {
    users: {
      1041: {
        id: 1041,
        name: 'Dana Whitfield',
        email: 'dana.w@pulse.app',
        bio: 'Coffee, climbing, CSS.',
        role: 'user',
        avatarUrl: 'https://cdn.pulse.app/u/1041/avatar.jpg',
        createdAt: 1699999200,
        passwordHash: '$2b$10$Q9cJ1m6H0v2z8yKfJr3w8uJmN4sV7dF2pX1qL0tB6eR5aY8cW3iKe',
        resetToken: 'rst_4f1d0b7e93c2a8f6',
      },
      1042: {
        id: 1042,
        name: 'Alex Morgan',
        email: 'alex.morgan@pulse.app',
        bio: 'Product designer. Writing about tiny interfaces and big decisions.',
        role: 'user',
        avatarUrl: 'https://cdn.pulse.app/u/1042/avatar.jpg',
        // Unix time in seconds: 1 May 2024.
        createdAt: 1714521600,
        passwordHash: '$2b$10$7Yc2Vb0nZ1kQ8xR4tP6mUe9hJ3sL5wA0dF8gK2vN1cB4yT7rE6iOa',
        resetToken: 'rst_9a3c71e0b4d25f88',
      },
    },
    orders: {
      1041: [
        { id: 'A-77120', title: 'Pulse Pro, annual', total: 9900, status: 'paid', shippingAddress: '14 Harbour St, Leeds' },
        { id: 'A-77341', title: 'Gift card', total: 5000, status: 'paid', shippingAddress: '14 Harbour St, Leeds' },
      ],
      1042: [
        { id: 'A-77215', title: 'Pulse Pro, monthly', total: 999, status: 'paid' },
        { id: 'A-77298', title: 'Sticker pack', total: 450, status: 'refunded' },
        { id: 'A-77402', title: 'Pulse Pro, monthly', total: 999, status: 'paid' },
      ],
    },
  }
}

let cachedState = null

async function loadState() {
  if (cachedState) {
    return cachedState
  }
  const cache = await caches.open(STATE_CACHE)
  const stored = await cache.match(STATE_KEY)
  if (stored) {
    cachedState = await stored.json()
  } else {
    cachedState = createDefaultState()
  }
  return cachedState
}

async function saveState(state) {
  cachedState = state
  const cache = await caches.open(STATE_CACHE)
  await cache.put(STATE_KEY, new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }))
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'Content-Type': 'application/json', 'X-Powered-By': 'pulse-api/0.9.3' },
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function notifyPage(clientId, type) {
  if (!clientId) {
    return
  }
  const client = await self.clients.get(clientId)
  if (client) {
    client.postMessage({ source: 'pulse-api', type: type })
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function handleGetMe() {
  const state = await loadState()
  // BUG API-01: the whole database row is returned, passwordHash and resetToken included.
  return json(200, state.users[CURRENT_USER_ID])
}

async function handlePutMe(request, clientId) {
  const state = await loadState()
  const user = state.users[CURRENT_USER_ID]
  let body = null
  try {
    body = await request.json()
  } catch (error) {
    return json(400, { error: 'Invalid JSON' })
  }
  if (!body || typeof body !== 'object') {
    return json(400, { error: 'Expected a JSON object' })
  }

  if (typeof body.email === 'string' && !isValidEmail(body.email)) {
    // BUG API-06: the error response exposes the SQL query and a stack trace.
    return json(400, {
      error: 'ER_CHECK_CONSTRAINT_VIOLATED',
      debug: {
        query: "UPDATE users SET email = '" + body.email + "' WHERE id = " + CURRENT_USER_ID,
        stack: [
          'Error: ER_CHECK_CONSTRAINT_VIOLATED: Check constraint users_email_chk is violated.',
          '    at Query.Sequence._packetToError (/srv/pulse-api/node_modules/mysql/lib/protocol/sequences/Sequence.js:47:14)',
          '    at ProfileService.update (/srv/pulse-api/src/services/profile.js:88:21)',
          '    at async /srv/pulse-api/src/routes/me.js:34:5',
        ].join('\n'),
      },
    })
  }

  if (typeof body.bio === 'string' && body.bio.length > BIO_MAX_LENGTH) {
    // BUG API-07: a validation error is sent with status 200.
    return json(200, { ok: false, error: 'Bio must be ' + BIO_MAX_LENGTH + ' characters or less' })
  }

  // BUG API-12: an empty name is accepted.
  if (typeof body.name === 'string') {
    user.name = body.name
  }
  if (typeof body.email === 'string') {
    user.email = body.email
  }
  if (typeof body.bio === 'string') {
    user.bio = body.bio
  }
  // BUG API-03: the role is taken from the request body (mass assignment).
  if (typeof body.role === 'string') {
    if (body.role !== user.role) {
      await notifyPage(clientId, 'role-changed')
    }
    user.role = body.role
  }
  await saveState(state)
  return json(200, { ok: true, user: user })
}

async function handleDeleteAvatar() {
  // BUG API-10: the endpoint always fails with 500 and nothing is deleted.
  return json(500, { error: 'Internal Server Error', requestId: 'req_' + Date.now().toString(16) })
}

async function handleGetOrders(userId, clientId) {
  const state = await loadState()
  const orders = state.orders[userId]
  if (!orders) {
    return json(404, { error: 'User not found' })
  }
  // BUG API-04: no ownership check, any user id returns that user's orders.
  if (userId !== CURRENT_USER_ID) {
    await notifyPage(clientId, 'foreign-orders')
  }
  return json(200, { userId: userId, orders: orders })
}

async function route(request, clientId, apiPath) {
  await wait(250 + Math.floor(Math.random() * 300))
  const method = request.method
  if (apiPath === 'me' && method === 'GET') {
    return handleGetMe()
  }
  if (apiPath === 'me' && method === 'PUT') {
    return handlePutMe(request, clientId)
  }
  if (apiPath === 'me/avatar' && method === 'DELETE') {
    return handleDeleteAvatar()
  }
  const ordersMatch = apiPath.match(/^users\/(\d+)\/orders$/)
  if (ordersMatch && method === 'GET') {
    return handleGetOrders(Number(ordersMatch[1]), clientId)
  }
  return json(404, { error: 'Not found' })
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'claim') {
    event.waitUntil(self.clients.claim())
  }
  if (data.type === 'reset') {
    const replyPort = event.ports[0]
    event.waitUntil(
      saveState(createDefaultState()).then(() => {
        if (replyPort) {
          replyPort.postMessage({ type: 'reset-done' })
        }
      }),
    )
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const apiPrefix = new URL(self.registration.scope).pathname + 'pulse-api/'
  if (url.origin !== self.location.origin || !url.pathname.startsWith(apiPrefix)) {
    return
  }
  const apiPath = url.pathname.slice(apiPrefix.length)
  event.respondWith(route(event.request, event.clientId, apiPath))
})
