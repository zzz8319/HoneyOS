import type { Apiary, NectarSource } from './types'

export const MOCK_APIARIES: Apiary[] = [
  {
    id: 'kawahigashi',
    name: '川東養蜂場',
    prefecture: '静岡県',
    city: '掛川市',
    colonyCount: 4,
    alertCount: 0,
    pinColor: '#16A34A',
    x: 18,
    y: 44,
    distanceKm: 12.1,
  },
  {
    id: 'yamate',
    name: '山手養蜂場',
    prefecture: '静岡県',
    city: '袋井市',
    colonyCount: 0,
    alertCount: 0,
    pinColor: '#4A5568',
    x: 46,
    y: 26,
    distanceKm: 5.2,
  },
  {
    id: 'miyata',
    name: '宮田養蜂場',
    prefecture: '静岡県',
    city: '磐田市',
    colonyCount: 6,
    alertCount: 2,
    pinColor: '#E39A16',
    x: 63,
    y: 54,
    distanceKm: 8.4,
  },
]

export const MOCK_NECTAR_SOURCES: NectarSource[] = [
  { id: 'renge',  name: 'レンゲ',   x: 32, y: 68 },
  { id: 'acacia', name: 'アカシア', x: 74, y: 30 },
]
