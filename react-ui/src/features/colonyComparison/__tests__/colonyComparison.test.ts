import { describe, it, expect } from 'vitest'
import {
  COMPARISON_ROWS_FIXTURE,
  COMPARISON_APIARIES,
  buildWarnings,
  filterRows,
  sortRows,
} from '../mockData'

// ── Initial data ────────────────────────────────────────────────────────────
describe('initial fixture data', () => {
  it('has 4 colony rows', () => {
    expect(COMPARISON_ROWS_FIXTURE).toHaveLength(4)
  })

  it('A-01 strength is 79', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a1')!
    expect(row.strength).toBe(79)
  })

  it('B-01 strength is 70', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'b1')!
    expect(row.strength).toBe(70)
  })

  it('A-05 strength is 65', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a5')!
    expect(row.strength).toBe(65)
  })

  it('A-03 strength is 35', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a3')!
    expect(row.strength).toBe(35)
  })

  it('A-01 has status good', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a1')!
    expect(row.status).toBe('good')
  })

  it('A-03 has status alert', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a3')!
    expect(row.status).toBe('alert')
  })

  it('A-01 daysSinceInspection is 3', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a1')!
    expect(row.daysSinceInspection).toBe(3)
  })

  it('A-03 daysSinceInspection is 11', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a3')!
    expect(row.daysSinceInspection).toBe(11)
  })

  it('A-01 bee is 85', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a1')!
    expect(row.bee).toBe(85)
  })

  it('A-03 bee is 40', () => {
    const row = COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a3')!
    expect(row.bee).toBe(40)
  })

  it('all 2 apiaries available', () => {
    expect(COMPARISON_APIARIES).toHaveLength(2)
  })
})

// ── Warning generation ──────────────────────────────────────────────────────
describe('buildWarnings', () => {
  it('A-03 warning is present', () => {
    const warns = buildWarnings(COMPARISON_ROWS_FIXTURE)
    expect(warns.some(w => w.colonyId === 'a3')).toBe(true)
  })

  it('A-01 no warning', () => {
    const warns = buildWarnings(COMPARISON_ROWS_FIXTURE)
    expect(warns.some(w => w.colonyId === 'a1')).toBe(false)
  })

  it('warning message contains colony name', () => {
    const warns = buildWarnings(COMPARISON_ROWS_FIXTURE)
    const w = warns.find(w => w.colonyId === 'a3')!
    expect(w.message).toContain('A-03')
  })

  it('no warnings when all good', () => {
    const goodRows = COMPARISON_ROWS_FIXTURE.filter(r => r.status === 'good')
    expect(buildWarnings(goodRows)).toHaveLength(0)
  })
})

// ── Filtering ───────────────────────────────────────────────────────────────
describe('filterRows', () => {
  it('all filter returns all rows', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'all', lastInspection: 'all' })
    expect(result).toHaveLength(4)
  })

  it('status=alert returns only A-03', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'alert', lastInspection: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0].colonyId).toBe('a3')
  })

  it('status=good excludes A-03', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'good', lastInspection: 'all' })
    expect(result.some(r => r.colonyId === 'a3')).toBe(false)
  })

  it('apiaryId filter keeps only miyata', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: 'apiary-miyata', status: 'all', lastInspection: 'all' })
    expect(result.every(r => r.apiaryId === 'apiary-miyata')).toBe(true)
  })

  it('apiaryId filter keeps only kawahigashi', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: 'apiary-kawahigashi', status: 'all', lastInspection: 'all' })
    expect(result).toHaveLength(1)
    expect(result[0].colonyId).toBe('b1')
  })

  it('lastInspection 7d keeps A-01 (3d) and B-01 (5d)', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'all', lastInspection: '7d' })
    const ids = result.map(r => r.colonyId)
    expect(ids).toContain('a1')
    expect(ids).toContain('b1')
    expect(ids).not.toContain('a5')
    expect(ids).not.toContain('a3')
  })

  it('lastInspection 14d includes A-03 (11d)', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'all', lastInspection: '14d' })
    expect(result.some(r => r.colonyId === 'a3')).toBe(true)
  })

  it('lastInspection 14d excludes A-05 (16d)', () => {
    const result = filterRows(COMPARISON_ROWS_FIXTURE, { apiaryId: null, status: 'all', lastInspection: '14d' })
    expect(result.some(r => r.colonyId === 'a5')).toBe(false)
  })

  it('lastInspection 30d+ keeps A-05 (16d)', () => {
    const rows = [{ ...COMPARISON_ROWS_FIXTURE.find(r => r.colonyId === 'a5')!, daysSinceInspection: 35 }]
    const result = filterRows(rows, { apiaryId: null, status: 'all', lastInspection: '30d+' })
    expect(result).toHaveLength(1)
  })
})

// ── Sorting ─────────────────────────────────────────────────────────────────
describe('sortRows', () => {
  it('strength desc: A-01 first', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'strength', 'desc')
    expect(result[0].colonyId).toBe('a1')
  })

  it('strength desc: A-03 last', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'strength', 'desc')
    expect(result[result.length - 1].colonyId).toBe('a3')
  })

  it('strength asc: A-03 first', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'strength', 'asc')
    expect(result[0].colonyId).toBe('a3')
  })

  it('bee desc: A-01 first (85%)', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'bee', 'desc')
    expect(result[0].colonyId).toBe('a1')
  })

  it('lastInspection asc: A-01 first (3d)', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'lastInspection', 'asc')
    expect(result[0].colonyId).toBe('a1')
  })

  it('does not mutate original array', () => {
    const original = [...COMPARISON_ROWS_FIXTURE]
    sortRows(COMPARISON_ROWS_FIXTURE, 'strength', 'asc')
    expect(COMPARISON_ROWS_FIXTURE[0].colonyId).toBe(original[0].colonyId)
  })

  it('ranking order is 79, 70, 65, 35', () => {
    const result = sortRows(COMPARISON_ROWS_FIXTURE, 'strength', 'desc')
    expect(result.map(r => r.strength)).toEqual([79, 70, 65, 35])
  })
})
