import { describe, it, expect } from 'vitest'

// Fix 2: JSON string as apiary name guard
// safeApiaryName ロジックを複製してテスト
function safeApiaryName(raw: unknown): string {
  if (raw === null || raw === undefined) return '（名称不明）'
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.name === 'string' && obj.name) return obj.name
    return '（名称不明）'
  }
  const str = String(raw)
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str) as unknown
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const p = parsed as Record<string, unknown>
        if (typeof p.name === 'string' && p.name) return p.name
        return '（名称不明）'
      }
    } catch { /* 不正JSON: 元文字列をそのまま使う */ }
  }
  return str || '（名称不明）'
}

describe('safeApiaryName', () => {
  it('normal string returns as-is', () => {
    expect(safeApiaryName('宮田養蜂場')).toBe('宮田養蜂場')
  })

  it('JSON string {"name":"test","address":"..."} extracts name', () => {
    const json = JSON.stringify({ name: 'test', address: '東京都' })
    expect(safeApiaryName(json)).toBe('test')
  })

  it('malformed JSON string returns the raw string', () => {
    expect(safeApiaryName('{broken json')).toBe('{broken json')
  })

  it('object form with name property extracts name', () => {
    expect(safeApiaryName({ name: '山田農場', address: '大阪' })).toBe('山田農場')
  })

  it('null returns （名称不明）', () => {
    expect(safeApiaryName(null)).toBe('（名称不明）')
  })

  it('undefined returns （名称不明）', () => {
    expect(safeApiaryName(undefined)).toBe('（名称不明）')
  })

  it('object without name property returns （名称不明）', () => {
    expect(safeApiaryName({ address: '東京' })).toBe('（名称不明）')
  })

  it('JSON string with empty name returns （名称不明）', () => {
    expect(safeApiaryName(JSON.stringify({ name: '', address: '東京' }))).toBe('（名称不明）')
  })

  it('array JSON string returns raw string', () => {
    const arr = JSON.stringify([1, 2, 3])
    // array parsed but no .name — falls through to str
    expect(safeApiaryName(arr)).toBe(arr)
  })

  it('number input is stringified', () => {
    expect(safeApiaryName(42)).toBe('42')
  })
})
