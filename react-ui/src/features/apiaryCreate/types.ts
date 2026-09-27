export type ApiaryCreateViewState =
  | 'normal'
  | 'submitting'
  | 'submit-error'
  | 'offline'
  | 'geolocation-denied'
  | 'map-error'

export interface SelectedLocation {
  address: string
  lat: number
  lng: number
}

export interface GeocodingResult {
  address: string
  lat: number
  lng: number
}
