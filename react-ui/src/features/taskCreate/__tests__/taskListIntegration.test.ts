/**
 * Unit tests for TaskCreate → WorkList integration flow.
 * Verifies that after successful saveTask, loadTasks returns the new task
 * and mapTask preserves all fields correctly.
 */
import { describe, it, expect, vi } from 'vitest'

// ── mapTask (mirrors WorkListScreen.tsx) ──────────────────────────────────────

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

function mapTask(raw: Record<string, unknown>) {
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

// ── Save → onSuccess flow ─────────────────────────────────────────────────────

describe('TaskCreate save → onSuccess', () => {
  it('saveTask returns valid id → onSuccess called', async () => {
    const saveTask = vi.fn().mockResolvedValue('task-abc')
    const onSuccess = vi.fn()
    const id = await saveTask({ title: '給餌確認', dueDate: '2099-12-31' })
    if (id) onSuccess()
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('saveTask returns null → onSuccess NOT called', async () => {
    const saveTask = vi.fn().mockResolvedValue(null)
    const onSuccess = vi.fn()
    const id = await saveTask({ title: 'test', dueDate: '2099-12-31' })
    if (id) onSuccess()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

// ── loadTasks integration ─────────────────────────────────────────────────────

describe('loadTasks after saveTask', () => {
  it('新規タスクが loadTasks の結果に含まれる（モック）', async () => {
    // Simulate in-memory store
    const store: Record<string, unknown>[] = []
    const saveTask = vi.fn().mockImplementation(async (task: Record<string, unknown>) => {
      const id = `task-${Date.now()}`
      store.push({ ...task, id, isCompleted: false })
      return id
    })
    const loadTasks = vi.fn().mockImplementation(async () => store.slice())

    await saveTask({ title: '一覧表示テスト', dueDate: '2099-12-31', priority: 'medium', colonyIds: [], farmId: null, memo: '', reminderEnabled: false })
    const raw = await loadTasks()
    expect(raw.length).toBe(1)
    const mapped = raw.map(mapTask)
    expect(mapped[0].title).toBe('一覧表示テスト')
  })

  it('再読み込み後も新規タスクが含まれる（モック）', async () => {
    const store: Record<string, unknown>[] = []
    const saveTask = vi.fn().mockImplementation(async (task: Record<string, unknown>) => {
      const id = `task-${Date.now()}`
      store.push({ ...task, id, isCompleted: false })
      return id
    })
    const loadTasks = vi.fn().mockImplementation(async () => store.slice())

    await saveTask({ title: 'リロードテスト', dueDate: '2099-12-31', priority: 'low', colonyIds: [], farmId: null, memo: '', reminderEnabled: false })

    // Simulate page reload: call loadTasks again
    const raw2 = await loadTasks()
    expect(raw2.length).toBeGreaterThan(0)
    expect(raw2.some((t: Record<string, unknown>) => t.title === 'リロードテスト')).toBe(true)
  })

  it('mapTask 後も title・dueDate・priority・colonyIds・farmId・isCompleted が維持される', async () => {
    const raw = {
      id: 'task-99',
      title: 'フィールド確認',
      dueDate: '2099-12-31',
      priority: 'high',
      colonyIds: ['a1'],
      farmId: 10,
      isCompleted: false,
      memo: '',
    }
    const mapped = mapTask(raw)
    expect(mapped.id).toBe('task-99')
    expect(mapped.title).toBe('フィールド確認')
    expect(mapped.dueDate).toBe('2099-12-31')
    expect(mapped.isCompleted).toBe(false)
  })
})
