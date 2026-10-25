import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE, onMockApiEvent, startMockApi } from './mockApi'
import { useBugTrigger } from '../../lib/bugTrigger'
import { useMediaQuery } from '../../lib/mediaQuery'
import './api.css'

// Planted bugs are marked with "BUG API-xx", most of them live in the mock backend: public/mock-api-sw.js.
// Keep them when refactoring: the catalog in bugs.json depends on them.
// trigger('API-xx') fires when a bug becomes observable.

const SESSION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwNDIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxOTI0OTkxOTk5fQ.Xq3v8dK2mR7pL0sT4wY9nB6cF1hJ5uE8aZ2gN7kV3oM'

interface Profile {
  id: number
  name: string
  email: string
  bio: string
  role: string
  avatarUrl: string | null
  createdAt: number
}

interface Order {
  id: string
  title: string
  total: number
  status: string
}

interface OrdersResponse {
  userId: number
  orders: Order[]
}

interface SaveResponse {
  ok: boolean
  user?: Profile
  error?: string
}

type Phase = 'starting' | 'ready' | 'failed'
type StatusTone = 'pending' | 'success' | 'error'

interface StatusMessage {
  tone: StatusTone
  text: string
}

const CURRENT_USER_ID = 1042
const BIO_MAX_LENGTH = 160

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  let initials = ''
  for (const word of words) {
    if (word !== '' && initials.length < 2) {
      initials = initials + word[0].toUpperCase()
    }
  }
  if (initials === '') {
    return '?'
  }
  return initials
}

function formatMemberSince(createdAt: number): string {
  // BUG API-02: createdAt comes in seconds, but Date expects milliseconds.
  const date = new Date(createdAt)
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatOrderTotal(total: number): string {
  // BUG API-05: totals come in cents but are shown as euros.
  return total + ' €'
}

export function ApiApp() {
  const [phase, setPhase] = useState<Phase>('starting')
  const [startError, setStartError] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const responseCacheRef = useRef(new Map<string, unknown>())
  const isProfileChangedRef = useRef(false)
  const trigger = useBugTrigger()
  // Same query as in api.css.
  const isPhone = useMediaQuery('(max-width: 600px)')

  useEffect(() => {
    if (isPhone && orders.length > 0) {
      // BUG API-14: on phones the Status column is hidden, see .api-orders.
      trigger('API-14')
    }
  }, [isPhone, orders, trigger])

  async function getCachedJson<T>(path: string): Promise<T> {
    const cache = responseCacheRef.current
    // BUG API-09: GET responses are cached forever and never invalidated after a save.
    if (cache.has(path)) {
      return cache.get(path) as T
    }
    const response = await fetch(API_BASE + path)
    const body = await response.json()
    cache.set(path, body)
    return body as T
  }

  function showProfile(loadedProfile: Profile) {
    // BUG API-01: the response carries passwordHash and resetToken, the UI just ignores them.
    setProfile(loadedProfile)
    setName(loadedProfile.name)
    setEmail(loadedProfile.email)
    setBio(loadedProfile.bio)
    setIsAvatarRemoved(false)
  }

  useEffect(() => {
    let isCancelled = false
    async function start() {
      try {
        await startMockApi()
        const loadedProfile = await getCachedJson<Profile>('me')
        const loadedOrders = await getCachedJson<OrdersResponse>('users/' + CURRENT_USER_ID + '/orders')
        if (isCancelled) {
          return
        }
        showProfile(loadedProfile)
        setOrders(loadedOrders.orders)
        setPhase('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }
        let message = 'The mock API could not start.'
        if (error instanceof Error) {
          message = error.message
        }
        setStartError(message)
        setPhase('failed')
      }
    }
    start()
    return () => {
      isCancelled = true
    }
    // Runs once per mount: getCachedJson and showProfile only touch refs and state setters.
  }, [])

  // The worker reports requests the page itself never sends: BUG API-03 (role in PUT /me)
  // and BUG API-04 (another user's id in GET /users/{id}/orders).
  useEffect(() => {
    return onMockApiEvent((type) => {
      if (type === 'role-changed') {
        trigger('API-03')
      }
      if (type === 'foreign-orders') {
        trigger('API-04')
      }
    })
  }, [trigger])

  async function sendProfile() {
    if (!profile) {
      return
    }
    setStatus({ tone: 'pending', text: 'Saving...' })
    // BUG API-03: the client sends the role, and the server trusts it.
    const payload = { name: name, email: email, bio: bio, role: profile.role }
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + SESSION_TOKEN }
    // BUG API-13: the request is logged with its headers, the session token included.
    console.log('[pulse] PUT /me', { headers: headers, body: payload })
    trigger('API-13')
    try {
      const response = await fetch(API_BASE + 'me', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as SaveResponse
      if (response.status === 400) {
        // BUG API-06: the 400 response contains the SQL query and a stack trace.
        trigger('API-06')
        setStatus({ tone: 'error', text: 'Something went wrong. Please try again later.' })
        return
      }
      if (!response.ok) {
        setStatus({ tone: 'error', text: 'Something went wrong. Please try again later.' })
        return
      }
      // BUG API-07: only the HTTP status is checked, { ok: false } in a 200 response is shown as success.
      if (body.ok === false) {
        trigger('API-07')
      }
      if (body.user) {
        if (body.user.name.trim() === '') {
          // BUG API-12: an empty name is saved by the server.
          trigger('API-12')
        }
        setProfile(body.user)
        isProfileChangedRef.current = true
      }
      setStatus({ tone: 'success', text: 'Profile saved' })
    } catch {
      setStatus({ tone: 'error', text: 'Network error' })
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendProfile()
  }

  function onSaveClick() {
    // BUG API-08: the click handler sends the request, and the submit event of the form sends it again.
    trigger('API-08')
    sendProfile()
  }

  async function refresh() {
    if (isProfileChangedRef.current && responseCacheRef.current.has('me')) {
      trigger('API-09')
    }
    setStatus(null)
    const loadedProfile = await getCachedJson<Profile>('me')
    showProfile(loadedProfile)
  }

  async function removeAvatar() {
    const response = await fetch(API_BASE + 'me/avatar', { method: 'DELETE' })
    // BUG API-10: the response status is ignored, the photo disappears even when the server fails.
    if (!response.ok) {
      trigger('API-10')
    }
    setIsAvatarRemoved(true)
    setStatus({ tone: 'success', text: 'Photo removed' })
  }

  if (phase === 'starting') {
    return (
      <div className="api-page api-center" data-bh="other">
        <p className="api-muted">Connecting to pulse-api...</p>
      </div>
    )
  }

  if (phase === 'failed' || !profile) {
    return (
      <div className="api-page api-center" data-bh="other">
        <div className="api-card">
          <h2 className="api-card-title">The mock API is not available</h2>
          <p className="api-muted">{startError}</p>
          <p className="api-muted">
            This case runs its backend in a service worker. Use a recent Chrome, Edge, Firefox or Safari outside of
            private mode and reload the page.
          </p>
        </div>
      </div>
    )
  }

  const hasAvatar = profile.avatarUrl !== null && !isAvatarRemoved

  return (
    <div className="api-page" data-bh="other">
      <header className="api-topbar">
        <span className="api-logo">pulse</span>
        <nav className="api-nav" aria-label="Main">
          <span>Feed</span>
          <span>Messages</span>
          <span className="api-nav-active">Settings</span>
        </nav>
      </header>

      <main className="api-layout">
        <section className="api-card api-profile-head" data-bh="header">
          <div className="api-avatar-block" data-bh="avatar">
            {hasAvatar ? (
              <span className="api-avatar">{initialsOf(profile.name)}</span>
            ) : (
              <span className="api-avatar api-avatar-empty" aria-hidden="true" />
            )}
            {hasAvatar ? (
              <button type="button" className="api-link" onClick={removeAvatar}>
                Remove photo
              </button>
            ) : null}
          </div>
          <div className="api-profile-text">
            <h1 className="api-name">{profile.name}</h1>
            <span className="api-muted">Member since {formatMemberSince(profile.createdAt)}</span>
            <span className="api-role" data-bh="role">
              {profile.role}
            </span>
          </div>
          <button type="button" className="api-button-ghost" data-bh="refresh" onClick={refresh}>
            Refresh
          </button>
        </section>

        <form className="api-card api-form" onSubmit={onSubmit}>
          <h2 className="api-card-title">Public profile</h2>
          <div className="api-field" data-bh="name">
            <label htmlFor="api-name">Display name</label>
            <input id="api-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="api-field" data-bh="email">
            <label htmlFor="api-email">Email</label>
            <input id="api-email" type="text" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="api-field" data-bh="bio">
            {/* BUG API-11: the textarea has only a placeholder, no label. */}
            <textarea
              rows={3}
              placeholder="Tell people about yourself"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <span className="api-hint">
              {bio.length} / {BIO_MAX_LENGTH}
            </span>
          </div>
          <div className="api-actions">
            <button type="submit" className="api-button" data-bh="save" onClick={onSaveClick}>
              Save changes
            </button>
            {status ? (
              <span className={'api-status api-status-' + status.tone} role="status" data-bh="status">
                {status.text}
              </span>
            ) : null}
          </div>
        </form>

        <section className="api-card" data-bh="orders">
          <h2 className="api-card-title">Billing history</h2>
          <table className="api-orders">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Item</th>
                <th scope="col">Status</th>
                <th scope="col" className="api-number">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="api-mono">{order.id}</td>
                  <td>{order.title}</td>
                  <td>{order.status}</td>
                  <td className="api-number">{formatOrderTotal(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
