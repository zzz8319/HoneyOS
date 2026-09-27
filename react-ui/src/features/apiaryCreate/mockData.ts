import type { GeocodingResult } from './types'

export const MOCK_SEARCH_RESULTS: GeocodingResult[] = [
  { address: '静岡県磐田市宮田', lat: 34.7156, lng: 137.8520 },
  { address: '静岡県磐田市中泉', lat: 34.7181, lng: 137.8571 },
  { address: '静岡県浜松市中区宮竹町', lat: 34.6975, lng: 137.7456 },
]

export const DEFAULT_CENTER = { lat: 34.7156, lng: 137.8520 }
export const DEFAULT_ZOOM = 14
