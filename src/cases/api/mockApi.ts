// Starts the mock backend of the case: a service worker from public/mock-api-sw.js.
// Requests to API_BASE go through it, so they are visible in the DevTools Network tab.

export const API_BASE = 'pulse-api/'

const START_TIMEOUT_MS = 8000

export interface MockApiEvent {
  source: string
  type: string
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), START_TIMEOUT_MS)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function waitForController(registration: ServiceWorkerRegistration): Promise<void> {
  if (navigator.serviceWorker.controller) {
    return
  }
  // After a hard reload the page is not controlled, the worker has to claim it again.
  const controllerChanged = new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
  })
  if (registration.active) {
    registration.active.postMessage({ type: 'claim' })
  }
  await controllerChanged
}

function resetState(controller: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    controller.postMessage({ type: 'reset' }, [channel.port2])
  })
}

export async function startMockApi(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not available in this browser.')
  }
  const workerUrl = import.meta.env.BASE_URL + 'mock-api-sw.js'
  await navigator.serviceWorker.register(workerUrl)
  const registration = await withTimeout(navigator.serviceWorker.ready, 'The mock API did not start in time.')
  await withTimeout(waitForController(registration), 'The mock API could not take control of the page.')
  const controller = navigator.serviceWorker.controller
  if (!controller) {
    throw new Error('The mock API could not take control of the page.')
  }
  await withTimeout(resetState(controller), 'The mock API did not reset its data.')
}

export function onMockApiEvent(listener: (type: string) => void): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {}
  }
  function handleMessage(event: MessageEvent<MockApiEvent>) {
    if (event.data && event.data.source === 'pulse-api') {
      listener(event.data.type)
    }
  }
  navigator.serviceWorker.addEventListener('message', handleMessage)
  // Messages from the worker are queued until the page opts in.
  navigator.serviceWorker.startMessages()
  return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
}
