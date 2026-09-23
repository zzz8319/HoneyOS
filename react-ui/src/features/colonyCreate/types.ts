export type ColonyCreateViewState =
  | 'normal'
  | 'submitting'
  | 'submit-error'
  | 'offline'
  | 'no-apiary'
  | 'apiary-load-error'

export interface Apiary {
  id: string
  name: string
}

export interface ColonyCreatePayload {
  name: string
  farmId: string
}
