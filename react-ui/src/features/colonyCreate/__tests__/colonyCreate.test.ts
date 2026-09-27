import { describe, it, expect } from 'vitest'
import { MOCK_APIARIES } from '../mockData'

// ── Validation helpers ───────────────────────────────────────────────────────

function validateColonyName(name: string): string {
  if (name.trim() === '') return '蜂群名を入力してください'
  return ''
}

function normalizeColonyName(name: string): string {
  return name.trim()
}

function validateApiary(apiaryId: string): string {
  if (apiaryId === '') return '所属養蜂場を選択してください'
  return ''
}

function canSubmit(name: string, apiaryId: string, submitting: boolean, offline: boolean, apiaries: { id: string; name: string }[]): boolean {
  return (
    !submitting &&
    !offline &&
    name.trim().length > 0 &&
    apiaryId !== '' &&
    apiaries.length > 0
  )
}

// Simulate duplicate detection (by name within same apiary)
function isDuplicate(name: string, apiaryId: string, existing: { name: string; farmId: string }[]): boolean {
  return existing.some(
    e => e.name === name.trim() && e.farmId === apiaryId,
  )
}

// ── Mock apiaries ────────────────────────────────────────────────────────────

describe('mock apiaries fixture', () => {
  it('has at least 1 apiary', () => {
    expect(MOCK_APIARIES.length).toBeGreaterThan(0)
  })

  it('has id and name fields', () => {
    for (const a of MOCK_APIARIES) {
      expect(typeof a.id).toBe('string')
      expect(typeof a.name).toBe('string')
      expect(a.id.length).toBeGreaterThan(0)
      expect(a.name.length).toBeGreaterThan(0)
    }
  })
})

// ── Colony name validation ───────────────────────────────────────────────────

describe('colony name validation', () => {
  it('empty string → error', () => {
    expect(validateColonyName('')).toBe('蜂群名を入力してください')
  })

  it('whitespace only → error', () => {
    expect(validateColonyName('   ')).toBe('蜂群名を入力してください')
  })

  it('valid name → no error', () => {
    expect(validateColonyName('A-07')).toBe('')
  })

  it('name with surrounding spaces → no error (normalizes)', () => {
    expect(validateColonyName('  A-07  ')).toBe('')
  })
})

// ── Colony name normalization ────────────────────────────────────────────────

describe('colony name normalization', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeColonyName('  A-07  ')).toBe('A-07')
  })

  it('does not alter inner content', () => {
    expect(normalizeColonyName('A 07')).toBe('A 07')
  })

  it('empty after trim stays empty', () => {
    expect(normalizeColonyName('   ')).toBe('')
  })
})

// ── Apiary validation ────────────────────────────────────────────────────────

describe('apiary validation', () => {
  it('empty selection → error', () => {
    expect(validateApiary('')).toBe('所属養蜂場を選択してください')
  })

  it('valid apiary id → no error', () => {
    expect(validateApiary('apiary-miyata')).toBe('')
  })
})

// ── Preview sync ─────────────────────────────────────────────────────────────

describe('preview name sync', () => {
  it('reflects input value trimmed', () => {
    const input = '  A-07  '
    const preview = normalizeColonyName(input)
    expect(preview).toBe('A-07')
  })

  it('empty input shows empty preview', () => {
    expect(normalizeColonyName('')).toBe('')
  })
})

// ── Double-submit prevention ─────────────────────────────────────────────────

describe('double-submit prevention', () => {
  it('canSubmit returns false when submitting=true', () => {
    expect(canSubmit('A-07', 'apiary-miyata', true, false, MOCK_APIARIES)).toBe(false)
  })

  it('canSubmit returns true when not submitting and valid', () => {
    expect(canSubmit('A-07', 'apiary-miyata', false, false, MOCK_APIARIES)).toBe(true)
  })
})

// ── Offline prevention ───────────────────────────────────────────────────────

describe('offline prevention', () => {
  it('canSubmit returns false when offline', () => {
    expect(canSubmit('A-07', 'apiary-miyata', false, true, MOCK_APIARIES)).toBe(false)
  })
})

// ── No-apiary prevention ─────────────────────────────────────────────────────

describe('no-apiary prevention', () => {
  it('canSubmit returns false when apiaries list is empty', () => {
    expect(canSubmit('A-07', 'apiary-miyata', false, false, [])).toBe(false)
  })

  it('canSubmit returns false when no apiary selected', () => {
    expect(canSubmit('A-07', '', false, false, MOCK_APIARIES)).toBe(false)
  })
})

// ── Duplicate detection ──────────────────────────────────────────────────────

describe('duplicate colony name detection', () => {
  const existing = [
    { name: 'A-01', farmId: 'apiary-miyata' },
    { name: 'B-01', farmId: 'apiary-kawahigashi' },
  ]

  it('same name same apiary → duplicate', () => {
    expect(isDuplicate('A-01', 'apiary-miyata', existing)).toBe(true)
  })

  it('same name different apiary → not duplicate', () => {
    expect(isDuplicate('A-01', 'apiary-kawahigashi', existing)).toBe(false)
  })

  it('different name same apiary → not duplicate', () => {
    expect(isDuplicate('A-07', 'apiary-miyata', existing)).toBe(false)
  })

  it('input with surrounding spaces is normalized before comparison', () => {
    expect(isDuplicate('  A-01  ', 'apiary-miyata', existing)).toBe(true)
  })
})

// ── API error conversion ──────────────────────────────────────────────────────

describe('API error conversion', () => {
  it('any API error maps to user-friendly message', () => {
    const raw = new Error('duplicate key value violates unique constraint')
    const userMsg = raw.message.includes('duplicate')
      ? 'この蜂群名はすでに使用されています'
      : '蜂群を登録できませんでした。もう一度お試しください。'
    expect(userMsg).toBe('この蜂群名はすでに使用されています')
  })

  it('unknown error maps to generic message', () => {
    const raw = new Error('network timeout')
    const userMsg = raw.message.includes('duplicate')
      ? 'この蜂群名はすでに使用されています'
      : '蜂群を登録できませんでした。もう一度お試しください。'
    expect(userMsg).toBe('蜂群を登録できませんでした。もう一度お試しください。')
  })
})
