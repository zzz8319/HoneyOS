export type ApiaryMapViewState =
  | 'normal'
  | 'other-apiary'
  | 'nectar'
  | 'alert'
  | 'no-results'
  | 'loading'
  | 'error'
  | 'offline'
  | 'no-location'

export type LayerType = 'apiary' | 'nectar' | 'alert'

export interface Apiary {
  id: string
  name: string
  prefecture: string
  city: string
  colonyCount: number
  alertCount: number
  pinColor: string
  x: number  // 0–100 percentage within map
  y: number
  distanceKm: number
}

export interface NectarSource {
  id: string
  name: string
  x: number
  y: number
}
