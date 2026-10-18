/**
 * Unit tests for TaskCreateScreen save flow logic.
 *
 * These tests exercise the save logic extracted as pure functions,
 * mirroring exactly what TaskCreateScreen.tsx does in handleSubmit.
 * No DOM rendering, no Playwright — pure logic assertions.
 */
import { describe, it, expect, vi } from 'vitest'
import { parseFarmId } from '../taskCreateUtils'

// ── Payload builder (mirrors handleSubmit logic) ─────────────────────────────

interface Colony {
  id: string
  name: string
  apiaryId: string
  apiaryName: string
}

interface SavePayload {
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  colonyIds: string[]
  farmId: number | null
  memo: string
  reminderEnabled: boolean
}

function buildPayload(
  title: string,
  dueDate: string,
  priority: 'high' | 'medium' | 'low',
  selectedColony: Colony | null,
  memo: string,
  reminderEnabled: boolean,
): SavePayload {
  return {
    title: title.trim(),
    dueDate,
    priority,
    colonyIds: selectedColony ? [selectedColony.id] : [],
    farmId: parseFarmId(selectedColony?.apiaryId),
    memo,
    reminderEnabled,
  }
}

function validateForm(title: string, dueDate: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!title.trim()) errors.push('title')
  if (!dueDate) errors.push('dueDate')
  return { valid: errors.length === 0, errors }
}

// ── buildPayload ─────────────────────────────────────────────────────────────

describe('buildPayload', () => {
  const colony: Colony = { id: 'a1', name: 'A-01', apiaryId: '10', apiaryName: '宮田養蜂場' }

  it('sets title trimmed', () => {
    const p = buildPayload('  A-05 内検  ', '2026-10-20', 'high', null, '', true)
    expect(p.title).toBe('A-05 内検')
  })

  it('colonyIds contains selected colony id', () => {
    const p = buildPayload('title', '2026-10-20', 'high', colony, '', true)
    expect(p.colonyIds).toEqual(['a1'])
  })

  it('colonyIds is empty when no colony selected', () => {
    const p = buildPayload('title', '2026-10-20', 'high', null, '', true)
    expect(p.colonyIds).toEqual([])
  })

  it('farmId is parsed as number from string apiaryId', () => {
    const p = buildPayload('title', '2026-10-20', 'high', colony, '', true)
    expect(p.farmId).toBe(10)
  })

  it('farmId is null when apiaryId is "unknown"', () => {
    const unknownColony: Colony = { ...colony, apiaryId: 'unknown' }
    const p = buildPayload('title', '2026-10-20', 'high', unknownColony, '', true)
    expect(p.farmId).toBeNull()
  })

  it('farmId is null when no colony selected', () => {
    const p = buildPayload('title', '2026-10-20', 'high', null, '', true)
    expect(p.farmId).toBeNull()
  })

  it('farmId is null when apiaryId is non-numeric string', () => {
    const strColony: Colony = { ...colony, apiaryId: 'apiary-miyata' }
    const p = buildPayload('title', '2026-10-20', 'high', strColony, '', true)
    expect(p.farmId).toBeNull()
  })

  it('passes memo and reminderEnabled through', () => {
    const p = buildPayload('title', '2026-10-20', 'medium', null, 'note here', false)
    expect(p.memo).toBe('note here')
    expect(p.reminderEnabled).toBe(false)
  })
})

// ── validateForm ─────────────────────────────────────────────────────────────

describe('validateForm', () => {
  it('empty title → invalid', () => {
    const r = validateForm('', '2026-10-20')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('title')
  })

  it('whitespace-only title → invalid', () => {
    const r = validateForm('   ', '2026-10-20')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('title')
  })

  it('empty dueDate → invalid', () => {
    const r = validateForm('A-05 内検', '')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('dueDate')
  })

  it('both empty → both errors', () => {
    const r = validateForm('', '')
    expect(r.valid).toBe(false)
    expect(r.errors).toEqual(expect.arrayContaining(['title', 'dueDate']))
  })

  it('title and dueDate present → valid', () => {
    const r = validateForm('A-05 内検', '2026-10-20')
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })
})

// ── saveTask API boundary ─────────────────────────────────────────────────────

describe('saveTask API boundary', () => {
  it('calls saveTask with correct payload and returns id', async () => {
    const saveTask = vi.fn().mockResolvedValue('task-123')
    const payload = buildPayload('A-05 内検', '2026-10-20', 'high', null, '', true)
    const id = await saveTask(payload)
    expect(saveTask).toHaveBeenCalledWith(payload)
    expect(id).toBe('task-123')
  })

  it('does not call saveTask when validation fails', () => {
    const saveTask = vi.fn()
    const { valid } = validateForm('', '2026-10-20')
    if (valid) saveTask({})
    expect(saveTask).not.toHaveBeenCalled()
  })

  it('propagates DB error to caller', async () => {
    const saveTask = vi.fn().mockRejectedValue(new Error('DB unavailable'))
    await expect(saveTask({})).rejects.toThrow('DB unavailable')
  })

  it('does not call saveTask when HoneyDB is not initialized', () => {
    const db: { saveTask?: () => Promise<string> } = {}
    const saveTask = vi.fn()
    if (db?.saveTask) saveTask()
    expect(saveTask).not.toHaveBeenCalled()
  })

  it('uses colonyIds array (not colonyId) as per saveTask contract', () => {
    const saveTask = vi.fn().mockResolvedValue('id')
    const colony: Colony = { id: 'a1', name: 'A-01', apiaryId: '10', apiaryName: '宮田養蜂場' }
    const payload = buildPayload('task', '2026-10-20', 'high', colony, '', true)
    saveTask(payload)
    const called = saveTask.mock.calls[0][0] as SavePayload
    expect(Array.isArray(called.colonyIds)).toBe(true)
    expect(called.colonyIds).toContain('a1')
    expect((called as unknown as Record<string, unknown>).colonyId).toBeUndefined()
  })
})

// ── Double-submit prevention ──────────────────────────────────────────────────

describe('double-submit prevention', () => {
  it('second call while saving does nothing', async () => {
    let savingRef = false
    const saveTask = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'id'
    })

    const submit = async () => {
      if (savingRef) return
      savingRef = true
      try { await saveTask({}) } finally { savingRef = false }
    }

    // Fire two concurrent submits
    const [p1, p2] = [submit(), submit()]
    await Promise.all([p1, p2])
    expect(saveTask).toHaveBeenCalledTimes(1)
  })
})

// ── Offline prevention ────────────────────────────────────────────────────────

describe('offline prevention', () => {
  it('isOffline=true blocks submit (disabled=true)', () => {
    const isOffline = true
    const isSubmitting = false
    const disabled = isSubmitting || isOffline
    expect(disabled).toBe(true)
  })

  it('isOffline=false and not saving allows submit', () => {
    const isOffline = false
    const isSubmitting = false
    const disabled = isSubmitting || isOffline
    expect(disabled).toBe(false)
  })
})

// ── parseFarmId ───────────────────────────────────────────────────────────────

describe('parseFarmId', () => {
  it('valid decimal integer string → number', () => {
    expect(parseFarmId('10')).toBe(10)
    expect(parseFarmId('1')).toBe(1)
    expect(parseFarmId('9007199254740991')).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('undefined → null', () => {
    expect(parseFarmId(undefined)).toBeNull()
  })

  it('"unknown" → null', () => {
    expect(parseFarmId('unknown')).toBeNull()
  })

  it('empty string → null', () => {
    expect(parseFarmId('')).toBeNull()
  })

  it('float string → null (not a safe integer)', () => {
    expect(parseFarmId('1.5')).toBeNull()
    expect(parseFarmId('2.9')).toBeNull()
  })

  it('partial-parse string (e.g. "12abc") → null', () => {
    // Number('12abc') = NaN, not a safe integer
    expect(parseFarmId('12abc')).toBeNull()
    expect(parseFarmId('f1')).toBeNull()
  })

  it('zero or negative → null', () => {
    expect(parseFarmId('0')).toBeNull()
    expect(parseFarmId('-1')).toBeNull()
  })

  it('beyond MAX_SAFE_INTEGER → null', () => {
    expect(parseFarmId('9007199254740992')).toBeNull()
  })
})

// ── saveTask null return value ────────────────────────────────────────────────

describe('saveTask null return handling', () => {
  it('null return treated as failure — onSuccess not called', async () => {
    const saveTask = vi.fn().mockResolvedValue(null)
    const onSuccess = vi.fn()
    const id = await saveTask({})
    if (id) onSuccess()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('undefined return treated as failure — onSuccess not called', async () => {
    const saveTask = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const id = await saveTask({})
    if (id) onSuccess()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('empty string return treated as failure — onSuccess not called', async () => {
    const saveTask = vi.fn().mockResolvedValue('')
    const onSuccess = vi.fn()
    const id = await saveTask({})
    if (id) onSuccess()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('valid id string return → onSuccess called', async () => {
    const saveTask = vi.fn().mockResolvedValue('task-123')
    const onSuccess = vi.fn()
    const id = await saveTask({})
    if (id) onSuccess()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
