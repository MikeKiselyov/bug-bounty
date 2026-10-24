import { createContext, useContext } from 'react'

type TriggerFunction = (bugId: string) => void

function noop() {}

export const BugTriggerContext = createContext<TriggerFunction>(noop)

// Case apps call trigger('REG-04') at the moment a planted bug becomes observable.
export function useBugTrigger(): TriggerFunction {
  return useContext(BugTriggerContext)
}
