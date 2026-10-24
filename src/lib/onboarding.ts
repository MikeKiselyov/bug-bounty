const STORAGE_KEY = 'bughunt:onboarding:v1'

export function isOnboardingSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'seen'
  } catch {
    return false
  }
}

export function markOnboardingSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'seen')
  } catch {
    // Without storage the tour will simply show again next time.
  }
}
