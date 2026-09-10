import type { Composition, CompositionDelta } from './mockData'

export const COMP_SEGMENTS: {
  key: keyof Composition & keyof CompositionDelta
  label: string
  color: string
}[] = [
  { key: 'bee',   label: '蜂',   color: '#16A34A' },
  { key: 'brood', label: '育児', color: '#EAB308' },
  { key: 'honey', label: '貯蜜', color: '#E39A16' },
  { key: 'empty', label: '空間', color: '#D1D5DB' },
]
