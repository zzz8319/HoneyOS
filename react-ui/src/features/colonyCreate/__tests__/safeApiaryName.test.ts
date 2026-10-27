import { describe, it, expect } from 'vitest'
import { safeApiaryName } from '../../../lib/farmName'

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
