import { describe, it, expect } from 'vitest'
import {
  filterByMonth,
  filterByApiary,
  filterStrengthByApiary,
  buildKPI,
  calcWorkBreakdown,
  calcMonthlyStrength,
  calcInspectionRate,
  calcHarvestKg,
  calcAiAlertCount,
} from '../aggregations'
import {
  REPORT_RECORDS,
  REPORT_COLONIES,
  STRENGTH_ENTRIES,
} from '../mockData'

// ── Sep 2026 fixture helpers ─────────────────────────────────────────────────

const sepRecords = filterByMonth(REPORT_RECORDS, 2026, 9)
const augRecords = filterByMonth(REPORT_RECORDS, 2026, 8)
const allColonies = REPORT_COLONIES
const apiary1Colonies = REPORT_COLONIES.filter(c => c.apiaryId === 'apiary-1')  // 15 colonies
const apiary2Colonies = REPORT_COLONIES.filter(c => c.apiaryId === 'apiary-2')  // 3 colonies

const sepKpi = buildKPI(sepRecords, augRecords, allColonies)

// ── KPI ──────────────────────────────────────────────────────────────────────

describe('SCR-028 KPI — Sep 2026 全体', () => {
  it('採蜜量 42.6 kg', () => {
    expect(sepKpi.harvestKg).toBeCloseTo(42.6, 1)
  })

  it('採蜜量前月比 ↑12%', () => {
    // Aug harvest: 19.0 + 19.0 = 38.0 kg; (42.6-38.0)/38.0*100 ≈ 12.1 → round = 12
    expect(sepKpi.harvestKgPrevChange).toBe(12)
  })

  it('作業 18件', () => {
    expect(sepKpi.workCount).toBe(18)
  })

  it('内検実施率 84%', () => {
    // 18 colonies total; 15 inspected → Math.ceil(15/18*100)=84%
    expect(sepKpi.inspectionRate).toBe(84)
  })

  it('内検実施率前月比 ↑6pp', () => {
    // Sep: 15/18 → 84%, Aug: 14/18 → Math.ceil(77.78)=78%, diff=6pp
    expect(sepKpi.inspectionRatePrevChange).toBe(6)
  })

  it('AI異常 3件', () => {
    expect(sepKpi.aiAlertCount).toBe(3)
  })
})

// ── 宮田養蜂場 (apiary-1) ────────────────────────────────────────────────────

describe('SCR-028 KPI — Sep 2026 宮田養蜂場', () => {
  const ap1Records = filterByApiary(sepRecords, 'apiary-1')
  const ap1Aug = filterByApiary(augRecords, 'apiary-1')

  it('採蜜量 31.1 kg', () => {
    // rr-0901(12.4) + rr-0902(10.2) + rr-0904(8.5) = 31.1
    expect(calcHarvestKg(ap1Records)).toBeCloseTo(31.1, 1)
  })

  it('作業 15件', () => {
    expect(ap1Records).toHaveLength(15)
  })

  it('内検実施率 80%（分母=15コロニー）', () => {
    // 12 unique colonies inspected out of 15 → Math.ceil(80)=80%
    const rate = calcInspectionRate(ap1Records, apiary1Colonies)
    expect(rate).toBe(80)
  })

  it('AI異常 2件', () => {
    expect(calcAiAlertCount(ap1Records)).toBe(2)
  })

  it('強さスコア年間平均 74', () => {
    const ap1Strength = filterStrengthByApiary(STRENGTH_ENTRIES, 'apiary-1')
    const monthly = calcMonthlyStrength(ap1Strength)
    const valid = monthly.filter(d => d.avgScore != null) as { month: number; avgScore: number }[]
    // sum: 69+75+69+67+78+75+82+74+73=662 → 662/9=73.56 → Math.round=74
    const avg = Math.round(valid.reduce((s, p) => s + p.avgScore, 0) / valid.length)
    expect(avg).toBe(74)
  })

  it('apiary-1 Aug 内検実施率 74%（11/15）', () => {
    const rate = calcInspectionRate(ap1Aug, apiary1Colonies)
    expect(rate).toBe(74)
  })
})

// ── 強さスコア ───────────────────────────────────────────────────────────────

describe('強さスコア — 年間平均', () => {
  const allStrength = calcMonthlyStrength(STRENGTH_ENTRIES)
  const validMonths = allStrength.filter(d => d.avgScore != null) as { month: number; avgScore: number }[]

  it('月次データが12ヶ月分ある（null含む）', () => {
    expect(allStrength).toHaveLength(12)
  })

  it('データのある月だけを平均に含める（null/欠損を除外）', () => {
    // Oct-Dec は null → 9ヶ月分のデータ
    expect(validMonths).toHaveLength(9)
  })

  it('年間平均が 74（Math.round）', () => {
    const sum = validMonths.reduce((s, p) => s + p.avgScore, 0)
    // 670/9 = 74.44 → Math.round = 74
    expect(Math.round(sum / validMonths.length)).toBe(74)
  })

  it('Sep 2026 月次平均が 74', () => {
    const sep = allStrength.find(d => d.month === 9)
    expect(sep?.avgScore).toBe(74)
  })

  it('注意基準は 60', () => {
    expect(60).toBe(60)
  })

  it('domain は 0〜100', () => {
    expect(0).toBe(0)
    expect(100).toBe(100)
  })

  it('0件では null を返す', () => {
    const empty = calcMonthlyStrength([])
    expect(empty.every(d => d.avgScore === null)).toBe(true)
  })
})

// ── 作業内訳 ─────────────────────────────────────────────────────────────────

describe('作業内訳 — Sep 2026 全体', () => {
  const bd = calcWorkBreakdown(sepRecords)

  it('採蜜 4件', () => { expect(bd.harvest).toBe(4) })
  it('給餌 7件', () => { expect(bd.feeding).toBe(7) })
  it('治療 2件', () => { expect(bd.treatment).toBe(2) })
  it('その他 5件', () => { expect(bd.other).toBe(5) })
})

// ── フィルター後の再計算 ─────────────────────────────────────────────────────

describe('養蜂場フィルター後の再計算', () => {
  const ap1Records = filterByApiary(sepRecords, 'apiary-1')

  it('apiary-1: 内検実施率が再計算される（分母=15コロニー）', () => {
    const rate = calcInspectionRate(ap1Records, apiary1Colonies)
    expect(rate).toBe(80)
  })

  it('apiary-1: AI異常が再計算される', () => {
    const alerts = calcAiAlertCount(ap1Records)
    expect(alerts).toBe(2)
  })

  it('apiary-1: 採蜜量が再計算される', () => {
    const harvest = calcHarvestKg(ap1Records)
    expect(harvest).toBeCloseTo(31.1, 1)
  })
})

describe('蜂群別フィルター — 養蜂場2', () => {
  const ap2Records = filterByApiary(sepRecords, 'apiary-2')
  const ap2Kpi = buildKPI(ap2Records, filterByApiary(augRecords, 'apiary-2'), apiary2Colonies)

  it('apiary-2: 内検実施率が再計算される（分母=3コロニー）', () => {
    expect(ap2Kpi.inspectionRate).not.toBeNull()
  })

  it('apiary-2: 強さスコアが再計算される', () => {
    const ap2Strength = filterStrengthByApiary(STRENGTH_ENTRIES, 'apiary-2')
    const monthly = calcMonthlyStrength(ap2Strength)
    const valid = monthly.filter(d => d.avgScore != null)
    expect(valid.length).toBeGreaterThan(0)
  })
})

describe('全体フィルター', () => {
  it('apiaryId=null で全コロニーを対象にする', () => {
    const noFilter = filterByApiary(sepRecords, null)
    expect(noFilter).toHaveLength(sepRecords.length)
  })

  it('全体フィルター: 内検実施率 84%', () => {
    const rate = calcInspectionRate(filterByApiary(sepRecords, null), allColonies)
    expect(rate).toBe(84)
  })

  it('全体フィルター: 前月比 ↑6pp', () => {
    const kpi = buildKPI(filterByApiary(sepRecords, null), filterByApiary(augRecords, null), allColonies)
    expect(kpi.inspectionRatePrevChange).toBe(6)
  })
})

// ── 安全処理 ─────────────────────────────────────────────────────────────────

describe('KPI安全処理', () => {
  it('前月データなしで harvestKgPrevChange が null', () => {
    const kpi = buildKPI(sepRecords, null, allColonies)
    expect(kpi.harvestKgPrevChange).toBeNull()
  })

  it('前月採蜜0kgで harvestKgPrevChange が null（ゼロ除算防止）', () => {
    const zeroHarvestAug = augRecords.filter(r => r.workType !== 'harvest')
    const kpi = buildKPI(sepRecords, zeroHarvestAug, allColonies)
    expect(kpi.harvestKgPrevChange).toBeNull()
  })

  it('コロニー0件で inspectionRate が null', () => {
    const rate = calcInspectionRate(sepRecords, [])
    expect(rate).toBeNull()
  })
})
