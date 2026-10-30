/**
 * Unit tests for P1-C: colonyStatus / calcComposition via buildColonyListData
 *
 * ケースA〜Eと「有効値0」「実測ゼロ」の区別を検証する。
 * productionロジックのコピーは行わず、エクスポートされた関数を直接importする。
 */
import { describe, it, expect } from 'vitest'
import { buildColonyListData, calcComposition, colonyStatus } from '../colonyListData'

const FARM = [{ id: '1', name: '山田養蜂場' }]
const BASE_COLONY = { id: 'c1', name: 'テスト群', farmId: '1' }

// ─── calcComposition 単体テスト ────────────────────────────────────────────

describe('calcComposition', () => {
  it('frames=[] → null（未取得）', () => {
    expect(calcComposition([])).toBeNull()
  })

  it('frames=[null相当] → null（無効フレームのみ）', () => {
    expect(calcComposition([null as unknown as { bee: number; brood: number; honey: number }])).toBeNull()
  })

  it('frames=[{bee:null, brood:undefined, honey:NaN}] → null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calcComposition([{ bee: null as any, brood: undefined as any, honey: NaN }])).toBeNull()
  })

  it('frames=[{bee:-1, brood:20, honey:10}] → null（負数は無効）', () => {
    expect(calcComposition([{ bee: -1, brood: 20, honey: 10 }])).toBeNull()
  })

  it('frames=[{bee:"abc", brood:20, honey:10}] → null（文字列は無効）', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(calcComposition([{ bee: 'abc' as any, brood: 20, honey: 10 }])).toBeNull()
  })

  it('frames=[{bee:0, brood:0, honey:0}] → null（合計0のフレームは計測なし）', () => {
    expect(calcComposition([{ bee: 0, brood: 0, honey: 0 }])).toBeNull()
  })

  it('frames=[{bee:0, brood:20, honey:10}] → 非null（bee=0は有効、合計>0）', () => {
    const comp = calcComposition([{ bee: 0, brood: 20, honey: 10 }])
    expect(comp).not.toBeNull()
    expect(comp!.bee).toBe(0)
  })

  // 部分フィールド欠損: danger誤検知の回帰防止
  it('honeyのみ有効・bee/brood欠損(undefined) → null（部分フィールドは無効）', () => {
    expect(calcComposition([{ honey: 30 } as unknown as { bee: number; brood: number; honey: number }])).toBeNull()
  })

  it('beeのみ有効・brood欠損(undefined) → null', () => {
    expect(calcComposition([{ bee: 30 } as unknown as { bee: number; brood: number; honey: number }])).toBeNull()
  })

  it('broodのみ有効・bee欠損(undefined) → null', () => {
    expect(calcComposition([{ brood: 20 } as unknown as { bee: number; brood: number; honey: number }])).toBeNull()
  })

  it('bee/brood有効・honey欠損(undefined) → null', () => {
    expect(calcComposition([{ bee: 30, brood: 20 } as unknown as { bee: number; brood: number; honey: number }])).toBeNull()
  })

  it('bee=0, brood=0, honey>0 → 非null → danger（実測ゼロはdanger）', () => {
    const comp = calcComposition([{ bee: 0, brood: 0, honey: 40 }])
    expect(comp).not.toBeNull()
    // bee<25 → danger
    expect(colonyStatus(comp)).toBe('danger')
  })

  it('frames=[{bee:40, brood:25, honey:15}] → 正常な構成比', () => {
    const comp = calcComposition([{ bee: 40, brood: 25, honey: 15 }])
    expect(comp).not.toBeNull()
    expect(comp!.bee).toBe(40)
    expect(comp!.brood).toBe(25)
    expect(comp!.honey).toBe(15)
  })
})

// ─── colonyStatus 単体テスト ───────────────────────────────────────────────

describe('colonyStatus', () => {
  it('comp=null → unknown', () => {
    expect(colonyStatus(null)).toBe('unknown')
  })

  it('bee<25 → danger', () => {
    expect(colonyStatus({ bee: 20, brood: 15, honey: 10, empty: 55 })).toBe('danger')
  })

  it('brood<10 → danger', () => {
    expect(colonyStatus({ bee: 30, brood: 8, honey: 10, empty: 52 })).toBe('danger')
  })

  it('bee=0（実測ゼロ）→ danger（有効値0はdanger）', () => {
    expect(colonyStatus({ bee: 0, brood: 20, honey: 10, empty: 70 })).toBe('danger')
  })

  it('bee<35 → warn', () => {
    expect(colonyStatus({ bee: 30, brood: 20, honey: 15, empty: 35 })).toBe('warn')
  })

  it('正常値 → good', () => {
    expect(colonyStatus({ bee: 40, brood: 25, honey: 15, empty: 20 })).toBe('good')
  })
})

// ─── buildColonyListData 統合テスト（ケースA〜E） ─────────────────────────

function getStatus(farms: unknown[], colonies: unknown[], insp: unknown[]): string {
  const result = buildColonyListData(farms, colonies, insp)
  return result.apiaries[0]?.colonies[0]?.status ?? '(none)'
}

describe('buildColonyListData — status判定', () => {
  // ケースA: 内検記録なし
  it('ケースA: 内検記録なし → unknown', () => {
    expect(getStatus(FARM, [BASE_COLONY], [])).toBe('unknown')
  })

  // ケースB: 内検記録あり・frames=[]
  it('ケースB: 内検あり・frames=[] → unknown（未測定と危険を区別）', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  // ケースB: 内検記録あり・framesキーなし
  it('ケースB: 内検あり・framesキーなし → unknown', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01' }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  // ケースC: framesあり・有効値なし（null/undefined/NaN/負数/文字列）
  it('ケースC: framesあり・bee=null → unknown', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: null as any, brood: 20, honey: 10 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  it('ケースC: framesあり・bee=NaN → unknown', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: NaN, brood: 20, honey: 10 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  it('ケースC: framesあり・bee=負数 → unknown', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: -5, brood: 20, honey: 10 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  it('ケースC: framesあり・bee=文字列 → unknown', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: '30' as any, brood: 20, honey: 10 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  it('ケースC: framesあり・全値=0（合計0は計測なし）→ unknown', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: 0, brood: 0, honey: 0 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })

  // ケースD: 有効な低値 → danger
  it('ケースD: 内検あり・bee=10（低値）→ danger', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: 10, brood: 5, honey: 5 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('danger')
  })

  it('ケースD: bee=0（有効実測値）→ danger（「有効値0」はdangerになり得る）', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: 0, brood: 20, honey: 10 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('danger')
  })

  // ケースE: 正常値
  it('ケースE: 正常値 → good', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: 40, brood: 25, honey: 15 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('good')
  })

  it('ケースE: 注意値 → warn', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01', frames: [{ bee: 30, brood: 20, honey: 15 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('warn')
  })

  // 日付なし・有効framesあり
  it('日付なし・有効frames → danger or good（日付はstatusに影響しない）', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '', frames: [{ bee: 10, brood: 5, honey: 5 }] }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('danger')
  })

  // 日付あり・framesなし
  it('日付あり・framesなし（キーなし）→ unknown', () => {
    const insp = [{ id: 'r1', colony: 'c1', date: '2026-10-01' }]
    expect(getStatus(FARM, [BASE_COLONY], insp)).toBe('unknown')
  })
})
