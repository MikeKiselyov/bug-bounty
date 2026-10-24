import type { Bug, CaseDefinition } from '../../lib/types'
import bugs from './bugs.json'
import { RegistrationApp } from './RegistrationApp'

export const registrationCase: CaseDefinition = {
  id: 'registration',
  code: 'CASE-01',
  title: 'Sign-up form',
  description: 'A food delivery service asks you to create an account. Validation, copy, accessibility.',
  briefing:
    'QuickBite food delivery is launching sign-up. Requirements: every field is required, the password is at least 8 characters, the email must be real, the phone is a Belarusian number (+375), and the terms must be accepted. Find where the form breaks the requirements or common sense.',
  level: 'junior',
  tags: ['forms', 'validation', 'a11y'],
  url: 'quickbite.local/signup',
  elements: [
    { id: 'name', label: 'Field "Name"' },
    { id: 'email', label: 'Field "Email"' },
    { id: 'phone', label: 'Field "Phone"' },
    { id: 'password', label: 'Field "Password"' },
    { id: 'birthdate', label: 'Field "Date of birth"' },
    { id: 'terms', label: 'Terms checkbox' },
    { id: 'submit', label: '"Create account" button' },
    { id: 'other', label: 'Other / whole page' },
  ],
  bugs: bugs as Bug[],
  App: RegistrationApp,
}
