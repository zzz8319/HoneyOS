/**
 * Unit tests for mapTask and toTaskStatus — imports the PRODUCTION functions from taskMapper.ts.
 *
 * These tests exercise the exact same code that WorkListScreen uses at runtime.
 * No local copy of mapTask is maintained here; a discrepancy between this file
 * and WorkListScreen.tsx will cause a compilation error (missing export), not a
 * silent false-positive.
 *
 * Completion state spec (documented in docs/HoneyOS_Functional_Audit.md):
 *   - Boolean fields only: isCompleted > is_completed > completed > false
 *   - completed_at is a completion TIMESTAMP; it MUST NOT be used as a boolean flag.
 */
import { describe, it, expect } from 'vitest'
import { mapTask, toTaskStatus } from '../taskMapper'

// ── toTaskStatus ──────────────────────────────────────────────────────────────

describe('toTaskStatus', () => {
  it('completed=true → always "completed" regardless of due date', () => {
    expect(toTaskStatus('2020-01-01', true)).toBe('completed')
    expect(toTaskStatus(undefined, true)).toBe('completed')
  })

  it('no due date + not completed → "upcoming"', () => {
    expect(toTaskStatus(undefined, false)).toBe('upcoming')
    expect(toTaskStatus('', false)).toBe('upcoming')
  })

  it('invalid date → not "overdue" (NaN diff)', () => {
    const s = toTaskStatus('invalid-date', false)
    expect(s).not.toBe('overdue')
  })
})

// ── mapTask isCompleted ───────────────────────────────────────────────────────

describe('mapTask isCompleted — production function from taskMapper.ts', () => {
  it('isCompleted=true (camelCase from loadTasks) → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2026-11-01', isCompleted: true })
    expect(t.status).toBe('completed')
    // WorkTask has no isCompleted field; status is the source of truth
  })

  it('isCompleted=false → not completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', isCompleted: false })
    expect(t.status).not.toBe('completed')
  })

  it('is_completed=true (snake_case) → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2026-11-01', is_completed: true })
    expect(t.status).toBe('completed')
  })

  it('is_completed=false → not completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', is_completed: false })
    expect(t.status).not.toBe('completed')
  })

  it('completedAt (camelCase) only → NOT completed (date string must not be used as boolean)', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completedAt: '2026-10-18T00:00:00Z' })
    expect(t.status).not.toBe('completed')
    // completedAt is stored as metadata but does not drive completion state
    expect(t.completedAt).toBe('2026-10-18T00:00:00Z')
  })

  it('completed_at (snake_case) only → NOT completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completed_at: '2026-10-18T00:00:00Z' })
    expect(t.status).not.toBe('completed')
    expect(t.completedAt).toBe('2026-10-18T00:00:00Z')
  })

  it('boolean false + completed_at present → not completed (boolean wins)', () => {
    // boolean field present and false → false, completed_at is ignored
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', isCompleted: false, completed_at: '2026-10-18T00:00:00Z' })
    expect(t.status).not.toBe('completed')
  })

  it('isCompleted=true wins over completed_at (boolean takes priority)', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', isCompleted: true, completed_at: '2026-01-01T00:00:00Z' })
    expect(t.status).toBe('completed')
  })

  it('completed=true → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completed: true })
    expect(t.status).toBe('completed')
  })

  it('all undefined → false (default)', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2020-01-01' })
    expect(t.status).not.toBe('completed')
  })

  it('return value has boolean-typed status, never a raw truthy', () => {
    const t = mapTask({ id: '1', title: 'test', completed_at: '2026-01-01T00:00:00Z' })
    // status must be one of the TaskStatus union literals
    const validStatuses = ['overdue', 'today', 'tomorrow', 'upcoming', 'completed']
    expect(validStatuses).toContain(t.status)
    expect(t.status).not.toBe('completed') // completed_at alone doesn't make it completed
  })

  it('DB completed task reloaded → still shows as completed', () => {
    const fromDB = { id: 'task-42', title: '給餌確認', dueDate: '2026-10-01', isCompleted: true }
    const t = mapTask(fromDB)
    expect(t.status).toBe('completed')
  })
})

// ── mapTask overdue exclusion rules ──────────────────────────────────────────

describe('mapTask overdue exclusion', () => {
  it('完了済みタスクは overdue に含まれない', () => {
    const t = mapTask({ id: '1', title: 'done', due_date: '2020-01-01', isCompleted: true })
    expect(t.status).not.toBe('overdue')
    expect(t.status).toBe('completed')
  })

  it('期限なしタスクは overdue に含まれない', () => {
    const t = mapTask({ id: '1', title: 'no-due', isCompleted: false })
    expect(t.status).not.toBe('overdue')
    expect(t.status).toBe('upcoming')
  })

  it('無効な日付文字列は overdue に含まれない (NaN diff)', () => {
    const t = mapTask({ id: '1', title: 'bad-date', due_date: 'invalid-date', isCompleted: false })
    expect(t.status).not.toBe('overdue')
  })

  it('今日が期限のタスクは overdue に含まれない', () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const t = mapTask({ id: '1', title: 'today', due_date: `${yyyy}-${mm}-${dd}`, isCompleted: false })
    expect(t.status).toBe('today')
    expect(t.status).not.toBe('overdue')
  })
})

// ── overdueCount banner ───────────────────────────────────────────────────────

describe('overdueCount banner', () => {
  function countOverdue(raws: Record<string, unknown>[]): number {
    return raws.map(mapTask).filter(t => t.status === 'overdue').length
  }

  function bannerText(count: number): string | null {
    if (count === 0) return null
    return `期限切れ ${count}件`
  }

  it('0件 → バナーなし (null)', () => {
    expect(bannerText(countOverdue([{ id: '1', title: 'test', dueDate: '2099-12-31', isCompleted: false }]))).toBeNull()
  })

  it('1件 → 「期限切れ 1件」', () => {
    expect(bannerText(countOverdue([{ id: '1', title: 'test', due_date: '2020-01-01', isCompleted: false }]))).toBe('期限切れ 1件')
  })

  it('複数件 → 「期限切れ N件」', () => {
    const raws = [
      { id: '1', title: 'a', due_date: '2020-01-01', isCompleted: false },
      { id: '2', title: 'b', due_date: '2020-02-01', isCompleted: false },
      { id: '3', title: 'c', due_date: '2020-03-01', isCompleted: false },
    ]
    expect(bannerText(countOverdue(raws))).toBe('期限切れ 3件')
  })

  it('完了済みは期限超過に含まれない', () => {
    expect(countOverdue([{ id: '1', title: 'done', due_date: '2020-01-01', isCompleted: true }])).toBe(0)
  })
})
