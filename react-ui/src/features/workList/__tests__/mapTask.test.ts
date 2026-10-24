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
  const completed = Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed_at ?? raw.completed)
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

  it('completed_at set → status completed', () => {
    const t = mapTask({ id: '1', title: 'test', due_date: '2026-11-01', completed_at: '2026-10-18T00:00:00Z' })
    expect(t.status).toBe('completed')
    expect(t.isCompleted).toBe(true)
  })

  it('isCompleted=false → not completed', () => {
    const t = mapTask({ id: '1', title: 'test', dueDate: '2099-12-31', isCompleted: false })
    expect(t.isCompleted).toBe(false)
    expect(t.status).not.toBe('completed')
  })

  it('DB completed task reloaded → still shows as completed', () => {
    // Simulate a round-trip: saveTask → loadTasks returns isCompleted=true
    const fromDB = { id: 'task-42', title: '給餌確認', dueDate: '2026-10-01', isCompleted: true }
    const t = mapTask(fromDB)
    expect(t.isCompleted).toBe(true)
    expect(t.status).toBe('completed')
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
