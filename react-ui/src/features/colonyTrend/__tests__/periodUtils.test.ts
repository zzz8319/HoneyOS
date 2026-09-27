import { describe, it, expect } from 'vitest'
import { get1yStartDate, get1yMonths, filterByPeriod } from '../mockData'

const END = new Date('2026-09-20')

describe('get1yStartDate', () => {
  it('returns Oct 1 of previous year when end is Sep 2026', () => {
    const start = get1yStartDate(END)
    expect(start.getFullYear()).toBe(2025)
    expect(start.getMonth()).toBe(9)  // 0-indexed: 9 = October
    expect(start.getDate()).toBe(1)
  })

  it('does not return Sep 2025 (would cause 13 months)', () => {
    const start = get1yStartDate(END)
    expect(start.getMonth()).not.toBe(8)  // not September
  })
})

describe('get1yMonths', () => {
  it('returns exactly 12 months', () => {
    expect(get1yMonths(END)).toHaveLength(12)
  })

  it('starts with 2025-10', () => {
    expect(get1yMonths(END)[0]).toBe('2025-10')
  })

  it('ends with 2026-09', () => {
    const months = get1yMonths(END)
    expect(months[months.length - 1]).toBe('2026-09')
  })

  it('does not include 2025-09', () => {
    expect(get1yMonths(END)).not.toContain('2025-09')
  })

  it('includes 2025-10', () => {
    expect(get1yMonths(END)).toContain('2025-10')
  })

  it('includes 2026-09', () => {
    expect(get1yMonths(END)).toContain('2026-09')
  })

  it('returns months in correct order Oct→Sep', () => {
    expect(get1yMonths(END)).toEqual([
      '2025-10', '2025-11', '2025-12',
      '2026-01', '2026-02', '2026-03', '2026-04',
      '2026-05', '2026-06', '2026-07', '2026-08', '2026-09',
    ])
  })
})

describe('filterByPeriod', () => {
  const pts = [
    { date: '2025-09-15', value: 50 },
    { date: '2025-09-30', value: 55 },
    { date: '2025-10-01', value: 60 },
    { date: '2025-10-15', value: 62 },
    { date: '2026-06-10', value: 65 },
    { date: '2026-09-07', value: 90 },
  ]

  it('1y: does not include 2025-09 data', () => {
    const result = filterByPeriod(pts, '1y')
    expect(result.some(p => p.date.startsWith('2025-09'))).toBe(false)
  })

  it('1y: includes 2025-10 data', () => {
    const result = filterByPeriod(pts, '1y')
    expect(result.some(p => p.date === '2025-10-01')).toBe(true)
  })

  it('1y: includes 2026-09 data', () => {
    const result = filterByPeriod(pts, '1y')
    expect(result.some(p => p.date === '2026-09-07')).toBe(true)
  })

  it('3m: 2026-09-07 は含まれる (90日以内)', () => {
    const result = filterByPeriod(pts, '3m')
    expect(result.some(p => p.date === '2026-09-07')).toBe(true)
  })

  it('3m: 2025-09 は含まない', () => {
    const result = filterByPeriod(pts, '3m')
    expect(result.some(p => p.date.startsWith('2025-09'))).toBe(false)
  })

  it('3m: 2026-06-10 は90日外なので含まない', () => {
    const result = filterByPeriod(pts, '3m')
    // cutoff = Sep20 - 90days = Jun21, so Jun10 is excluded
    expect(result.some(p => p.date === '2026-06-10')).toBe(false)
  })

  it('all: 全点を返す', () => {
    expect(filterByPeriod(pts, 'all')).toHaveLength(pts.length)
  })
})
