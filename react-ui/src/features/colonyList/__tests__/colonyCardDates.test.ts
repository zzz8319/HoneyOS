import { describe, it, expect } from 'vitest'
import { relativeDate, shortDate } from '../../../lib/dateUtils'

describe('relativeDate', () => {
  it('valid ISO date returns N日前 (not NaN)', () => {
    const d = new Date(Date.now() - 3 * 86400000).toISOString()
    const result = relativeDate(d)
    expect(result).toBe('3日前')
    expect(result).not.toContain('NaN')
  })

  it('YYYY-MM-DD format returns N日前', () => {
    const past = new Date(Date.now() - 7 * 86400000)
    const str = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
    const result = relativeDate(str)
    expect(result).not.toContain('NaN')
    expect(result).toMatch(/\d+日前|今日|昨日/)
  })

  it('null returns 未実施', () => {
    expect(relativeDate(null)).toBe('未実施')
  })

  it('undefined returns 未実施', () => {
    expect(relativeDate(undefined)).toBe('未実施')
  })

  it('empty string returns 未実施', () => {
    expect(relativeDate('')).toBe('未実施')
  })

  it('invalid date string returns 未取得 (not NaN)', () => {
    expect(relativeDate('not-a-date')).toBe('未取得')
    expect(relativeDate('NaN')).toBe('未取得')
    expect(relativeDate('undefined')).toBe('未取得')
  })

  it('future date returns 未来', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString()
    expect(relativeDate(future)).toBe('未来')
  })

  it('today returns 今日', () => {
    const now = new Date().toISOString()
    expect(relativeDate(now)).toBe('今日')
  })
})

describe('shortDate', () => {
  it('valid ISO date returns M/D', () => {
    const d = new Date('2024-06-15T00:00:00Z')
    const result = shortDate(d.toISOString())
    expect(result).toMatch(/^\d+\/\d+$/)
    expect(result).not.toContain('NaN')
  })

  it('null returns empty string', () => {
    expect(shortDate(null)).toBe('')
  })

  it('undefined returns empty string', () => {
    expect(shortDate(undefined)).toBe('')
  })

  it('invalid date string returns empty string (not NaN)', () => {
    expect(shortDate('invalid')).toBe('')
    expect(shortDate('NaN/NaN')).toBe('')
  })
})

describe('no NaN in output (regression)', () => {
  const cases: Array<string | null | undefined> = [null, undefined, '', 'invalid', 'NaN', 'undefined']
  for (const c of cases) {
    it(`relativeDate(${JSON.stringify(c)}) never contains NaN`, () => {
      expect(relativeDate(c)).not.toContain('NaN')
    })
    it(`shortDate(${JSON.stringify(c)}) never contains NaN`, () => {
      expect(shortDate(c)).not.toContain('NaN')
    })
  }
})
