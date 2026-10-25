/**
 * Unit tests for WorkListScreen mapTask logic and overdueCount banner.
 * Mirrors exactly what WorkListScreen.tsx does for mapTask / toTaskStatus.
 */
import { describe, it, expect } from 'vitest'

// ── toTaskStatus (mirrors WorkListScreen.tsx) ─────────────────────────────────

type TaskStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed'

function toTaskStatus(due: string | undefined, completed: boolean): TaskStatus {
  if (completed) return 'completed'
  if (!due) return 'upcoming'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(due); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return 'upcoming'
}

// ── mapTask (mirrors WorkListScreen.tsx) ──────────────────────────────────────

interface WorkTask {
  id: string
  title: string
  dueDate: string
  status: TaskStatus
  isCompleted: boolean
}

function mapTask(raw: Record<string, unknown>): WorkTask {
  // Priority: isCompleted > is_completed > completed > false
  // completed_at is excluded — date strings are truthy and must NOT be used as boolean
  const completed = Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed ?? false)
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? ''),
    dueDate: String(raw.due_date ?? raw.dueDate ?? ''),
    status: toTaskStatus(
      (raw.due_date ?? raw.dueDate) as string | undefined,
      completed,
    ),
    isCompleted: completed,
  }
}

// ── mapTask isCompleted ───────────────────────────────────────────────────────

describe('mapTask isCompleted', () => {
  it('isCompleted=true (camelCase from loadTasks) → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2026-11-01', isCompleted: true })
    expect(t.status).toBe('completed')
    expect(t.isCompleted).toBe(true)
  })

  it('is_completed=true (snake_case) → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2026-11-01', is_completed: true })
    expect(t.status).toBe('completed')
    expect(t.isCompleted).toBe(true)
  })

  it('completed_at only → NOT completed (date string must not be used as boolean)', () => {
    // completed_at is a datetime string which is truthy — must NOT be used as boolean.
    // Only explicit boolean fields (isCompleted / is_completed / completed) determine completion.
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completed_at: '2026-10-18T00:00:00Z' })
    expect(t.isCompleted).toBe(false)
    expect(t.status).not.toBe('completed')
  })

  it('completed_at null → NOT completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completed_at: null })
    expect(t.isCompleted).toBe(false)
  })

  it('isCompleted=false → not completed (false is not null/undefined so ?? short-circuits)', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', isCompleted: false })
    expect(t.isCompleted).toBe(false)
    expect(t.status).not.toBe('completed')
  })

  it('is_completed=false → not completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', is_completed: false })
    expect(t.isCompleted).toBe(false)
    expect(t.status).not.toBe('completed')
  })

  it('completed=true → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', completed: true })
    expect(t.isCompleted).toBe(true)
    expect(t.status).toBe('completed')
  })

  it('isCompleted=true wins over completed_at (boolean takes priority)', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2099-11-01', isCompleted: true, completed_at: '2026-01-01T00:00:00Z' })
    expect(t.isCompleted).toBe(true)
    expect(t.status).toBe('completed')
  })

  it('all undefined → false (default)', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2020-01-01' })
    expect(t.isCompleted).toBe(false)
  })

  it('DB completed task reloaded → still shows as completed', () => {
    // Simulate a round-trip: saveTask → loadTasks returns isCompleted=true
    const fromDB = { id: 'task-42', title: '給餌確認', dueDate: '2026-10-01', isCompleted: true }
    const t = mapTask(fromDB)
    expect(t.isCompleted).toBe(true)
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
    // new Date('invalid-date').getTime() = NaN; diff = NaN; NaN < 0 is false → not overdue
    expect(t.status).not.toBe('overdue')
  })

  it('今日が期限のタスクは overdue に含まれない (today)', () => {
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
  function countOverdue(tasks: WorkTask[]): number {
    return tasks.filter(t => t.status === 'overdue').length
  }

  function bannerText(count: number): string | null {
    if (count === 0) return null
    return `期限切れ ${count}件`
  }

  it('0件 → バナーなし (null)', () => {
    const tasks = [mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', isCompleted: false })]
    expect(bannerText(countOverdue(tasks))).toBeNull()
  })

  it('1件 → 「期限切れ 1件」', () => {
    const tasks = [mapTask({ id: '1', title: 'test', due_date: '2020-01-01', isCompleted: false })]
    expect(bannerText(countOverdue(tasks))).toBe('期限切れ 1件')
  })

  it('複数件 → 「期限切れ N件」', () => {
    const tasks = [
      mapTask({ id: '1', title: 'a', due_date: '2020-01-01', isCompleted: false }),
      mapTask({ id: '2', title: 'b', due_date: '2020-02-01', isCompleted: false }),
      mapTask({ id: '3', title: 'c', due_date: '2020-03-01', isCompleted: false }),
    ]
    expect(bannerText(countOverdue(tasks))).toBe('期限切れ 3件')
  })

  it('完了済みは期限超過に含まれない', () => {
    const tasks = [
      mapTask({ id: '1', title: 'done', due_date: '2020-01-01', isCompleted: true }),
    ]
    expect(countOverdue(tasks)).toBe(0)
    expect(bannerText(countOverdue(tasks))).toBeNull()
  })
})
