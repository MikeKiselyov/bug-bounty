import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useBugTrigger } from '../../lib/bugTrigger'
import './registration.css'

// Planted bugs are marked with "BUG REG-xx". Keep them when refactoring:
// the catalog in bugs.json depends on them. trigger('REG-xx') fires when a bug becomes observable.

interface FormValues {
  name: string
  email: string
  phone: string
  password: string
  birthdate: string
  terms: boolean
}

type FieldName = 'name' | 'email' | 'phone' | 'password' | 'birthdate'
type FormErrors = Partial<Record<FieldName, string>>

interface Account {
  number: number
  email: string
}

const EMPTY_FORM: FormValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  birthdate: '',
  terms: false,
}

const REQUIRED = 'This field is required'
const NAME_LETTERS_ERROR = 'Name can only contain letters'
const PASSWORD_LENGTH_ERROR = 'Password must be at least 8 characters'

function isRealCalendarDate(value: string): boolean {
  const parts = value.split('/')
  const day = Number(parts[0])
  const month = Number(parts[1])
  const year = Number(parts[2])
  const date = new Date(year, month - 1, day)
  return date.getDate() === day && date.getMonth() === month - 1
}

// A Belarusian mobile number: +375, a 2-digit operator code, 7 digits.
function isBelarusianPhone(value: string): boolean {
  if (/[^\d\s+()-]/.test(value)) {
    return false
  }
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('375') && value.trim().startsWith('+')
}

function validateBirthdate(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return 'Use the format DD/MM/YYYY'
  }
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  // BUG REG-10: the day is checked against 31 for every month.
  if (day < 1 || day > 31) {
    return 'Invalid day'
  }
  if (month < 1 || month > 12) {
    return 'Invalid month'
  }
  if (year < 1900) {
    return 'Invalid year'
  }
  const birthday = new Date(year, month - 1, day)
  if (birthday.getTime() > Date.now()) {
    return 'Date cannot be in the future'
  }
  return null
}

function validate(values: FormValues, accounts: Account[]): FormErrors {
  const errors: FormErrors = {}

  if (values.name.trim() === '') {
    errors.name = REQUIRED
  } else if (!/^[A-Za-z\s-]+$/.test(values.name.trim())) {
    // BUG REG-12: only A-Z letters are allowed, no accents or apostrophes.
    errors.name = NAME_LETTERS_ERROR
  }

  if (values.email.trim() === '') {
    errors.email = REQUIRED
  } else if (!/^[^\s@]+@[^\s@]+$/.test(values.email.trim())) {
    // BUG REG-02: no check for a dot in the domain part.
    errors.email = 'Enter a valid email'
  } else {
    for (const account of accounts) {
      if (account.email === values.email.trim()) {
        errors.email = 'This email is already registered'
      }
    }
  }

  // BUG REG-09: phone is only checked for being non-empty, the +375 format is ignored.
  if (values.phone.trim() === '') {
    errors.phone = REQUIRED
  }

  if (values.password === '') {
    errors.password = REQUIRED
  } else if (values.password.length < 3) {
    // BUG REG-04: the limit is 3 instead of 8.
    // BUG REG-03: the message says 8, the hint under the field says 6.
    errors.password = PASSWORD_LENGTH_ERROR
  }

  if (values.birthdate.trim() === '') {
    errors.birthdate = REQUIRED
  } else {
    const birthdateError = validateBirthdate(values.birthdate.trim())
    if (birthdateError) {
      errors.birthdate = birthdateError
    }
  }

  // BUG REG-11: values.terms is never checked.
  return errors
}

export function RegistrationApp() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [accounts, setAccounts] = useState<Account[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const createdEmails = useRef<string[]>([])
  const trigger = useBugTrigger()

  function updateField(field: keyof FormValues, value: string | boolean) {
    setValues({ ...values, [field]: value })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values, accounts)
    setErrors(nextErrors)

    if (nextErrors.password === PASSWORD_LENGTH_ERROR) {
      trigger('REG-03')
    }
    if (nextErrors.name === NAME_LETTERS_ERROR && /^[\p{L}\s'-]+$/u.test(values.name.trim())) {
      trigger('REG-12')
    }
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password,
      birthdate: values.birthdate.trim(),
    }
    // BUG REG-05: the whole payload, password included, goes to the console.
    console.log('[register] POST /api/users', payload)
    trigger('REG-05')

    const emailDomain = payload.email.split('@')[1]
    if (!emailDomain.includes('.')) {
      trigger('REG-02')
    }
    if (payload.password.length < 8) {
      trigger('REG-04')
    }
    if (!isBelarusianPhone(payload.phone)) {
      trigger('REG-09')
    }
    if (!isRealCalendarDate(payload.birthdate)) {
      trigger('REG-10')
    }
    if (!values.terms) {
      trigger('REG-11')
    }

    // BUG REG-07: the button is not disabled while the request is pending,
    // and the duplicate check above ran against the old list of accounts.
    setPendingCount((count) => count + 1)
    window.setTimeout(() => {
      if (createdEmails.current.includes(payload.email)) {
        trigger('REG-07')
      }
      createdEmails.current = [...createdEmails.current, payload.email]
      setAccounts((current) => [...current, { number: current.length + 1, email: payload.email }])
      setPendingCount((count) => count - 1)
    }, 900)
  }

  function describedBy(field: FieldName, hintId?: string): string | undefined {
    const ids: string[] = []
    if (hintId) {
      ids.push(hintId)
    }
    if (errors[field]) {
      ids.push('reg-' + field + '-error')
    }
    if (ids.length === 0) {
      return undefined
    }
    return ids.join(' ')
  }

  function renderError(field: FieldName) {
    const message = errors[field]
    if (!message) {
      return null
    }
    return (
      <span id={'reg-' + field + '-error'} className="reg-error">
        {message}
      </span>
    )
  }

  const isPending = pendingCount > 0

  return (
    <div className="reg-page" data-bh="other">
      <form className="reg-card" onSubmit={handleSubmit} noValidate>
        <div className="reg-head">
          <span className="reg-brand">QUICKBITE</span>
          <h2 className="reg-title">Create your account</h2>
          <p className="reg-subtitle">Your first delivery is on us.</p>
        </div>

        <div className="reg-field" data-bh="name">
          <label htmlFor="reg-name">Name</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="given-name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
          />
          {renderError('name')}
        </div>

        <div className="reg-field" data-bh="email">
          {/* BUG REG-01: typo in the label. */}
          <label htmlFor="reg-email">Email adress</label>
          <input
            id="reg-email"
            type="text"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy('email')}
          />
          {renderError('email')}
        </div>

        <div className="reg-field" data-bh="phone">
          {/* BUG REG-08: "for" points to an id that does not exist. */}
          <label htmlFor="reg-phone-input">Phone</label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+375 29 123-45-67"
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy('phone')}
          />
          {renderError('phone')}
        </div>

        <div className="reg-field" data-bh="password">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy('password', 'reg-password-hint')}
          />
          <span id="reg-password-hint" className="reg-hint">
            At least 6 characters
          </span>
          {renderError('password')}
        </div>

        <div className="reg-field" data-bh="birthdate">
          <label htmlFor="reg-birthdate">Date of birth</label>
          <input
            id="reg-birthdate"
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={values.birthdate}
            onChange={(event) => updateField('birthdate', event.target.value)}
            aria-invalid={errors.birthdate ? true : undefined}
            aria-describedby={describedBy('birthdate')}
          />
          {renderError('birthdate')}
        </div>

        <div className="reg-check" data-bh="terms">
          <input
            id="reg-terms"
            type="checkbox"
            checked={values.terms}
            onChange={(event) => updateField('terms', event.target.checked)}
          />
          <label htmlFor="reg-terms">I agree to the terms of service</label>
        </div>

        {/* BUG REG-06: the button has an extra margin-left in registration.css. */}
        <button type="submit" className="reg-submit" data-bh="submit">
          {isPending ? 'Creating account...' : 'Create account'}
        </button>

        {accounts.length > 0 ? (
          <div className="reg-success" role="status" data-bh="submit">
            <strong>Account created. Check your inbox!</strong>
            <ul>
              {accounts.map((account) => (
                <li key={account.number}>
                  Account #{account.number}: {account.email}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  )
}
