/**
 * Regression tests for task visibility after save.
 * Verifies that tasks with any dueDate appear in the correct section,
 * and that the save→navigate→loadTasks flow works correctly (mock-based).
 *
 * WorkListScreen has two sections:
 *   - 今日 section: overdue + today tasks
 *   - 今週 section: tomorrow + upcoming tasks (includes ALL future dates)
 * There is no "全て" tab — all incomplete tasks are always visible.
 */
import { describe, it, expect, vi } from 'vitest'

// Mirror toTaskStatus from WorkListScreen.tsx
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

// Helper: today + N days as YYYY-MM-DD
function dateOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// WorkListScreen's section classifier (mirrors component)
function inTodaySection(t: WorkTask) { return t.status === 'overdue' || t.status === 'today' }
function inWeekSection(t: WorkTask)  { return t.status === 'tomorrow' || t.status === 'upcoming' }

// ── Task visibility by dueDate ────────────────────────────────────────────────

describe('task visibility after save', () => {
  it('今日期限のタスク → 今日セクションに表示される', () => {
    const t = mapTask({ id: '1', title: '今日のタスク', due_date: dateOffset(0), isCompleted: false })
    expect(inTodaySection(t)).toBe(true)
    expect(t.status).toBe('today')
  })

  it('明日期限のタスク → 今週セクションに表示される', () => {
    const t = mapTask({ id: '2', title: '明日のタスク', due_date: dateOffset(1), isCompleted: false })
    expect(inWeekSection(t)).toBe(true)
    expect(t.status).toBe('tomorrow')
  })

  it('来週以降のタスク → 今週セクションに表示される（upcoming は今週セクションに含まれる）', () => {
    const t = mapTask({ id: '3', title: '来週のタスク', due_date: dateOffset(7), isCompleted: false })
    expect(inWeekSection(t)).toBe(true)
    expect(t.status).toBe('upcoming')
  })

  it('期限なしのタスク → 今週セクションに表示される（upcoming扱い）', () => {
    const t = mapTask({ id: '4', title: '期限なし', isCompleted: false })
    expect(inWeekSection(t)).toBe(true)
    expect(t.status).toBe('upcoming')
  })

  it('期限切れのタスク → 今日セクションに表示される', () => {
    const t = mapTask({ id: '5', title: '期限切れ', due_date: '2020-01-01', isCompleted: false })
    expect(inTodaySection(t)).toBe(true)
    expect(t.status).toBe('overdue')
  })

  it('すべての未完了タスクはどちらかのセクションに表示される（表示漏れなし）', () => {
    const tasks = [
      mapTask({ id: '1', due_date: '2020-01-01', isCompleted: false }),
      mapTask({ id: '2', due_date: dateOffset(0), isCompleted: false }),
      mapTask({ id: '3', due_date: dateOffset(1), isCompleted: false }),
      mapTask({ id: '4', due_date: dateOffset(7), isCompleted: false }),
      mapTask({ id: '5', isCompleted: false }),
    ]
    for (const t of tasks) {
      expect(inTodaySection(t) || inWeekSection(t)).toBe(true)
    }
  })
})

// ── save → loadTasks → display integration (mock) ────────────────────────────

describe('save to loadTasks integration (mock)', () => {
  it('保存成功後 loadTasks に新規タスクが含まれる', async () => {
    const savedTasks: Record<string, unknown>[] = []
    const saveTask = vi.fn().mockImplementation(async (task: Record<string, unknown>) => {
      const id = 'task-new-1'
      savedTasks.push({ ...task, id, isCompleted: false })
      return id
    })
    const loadTasks = vi.fn().mockImplementation(async () => savedTasks.slice())
    const onSuccess = vi.fn()

    const id = await saveTask({ title: '新規タスク', due_date: dateOffset(0) })
    if (id) onSuccess()
    expect(onSuccess).toHaveBeenCalledTimes(1)

    const raw = await loadTasks()
    const tasks = (raw as Record<string, unknown>[]).map(mapTask)
    expect(tasks.some(t => t.id === 'task-new-1')).toBe(true)
    expect(tasks[0].title).toBe('新規タスク')
  })

  it('再読み込み後も新規タスクが表示される（isCompleted=false）', async () => {
    const savedTasks: Record<string, unknown>[] = [
      { id: 'task-42', title: '登録済みタスク', due_date: dateOffset(3), isCompleted: false },
    ]
    const loadTasks = vi.fn().mockResolvedValue(savedTasks)
    const raw = await loadTasks()
    const tasks = (raw as Record<string, unknown>[]).map(mapTask)
    expect(tasks.some(t => t.id === 'task-42')).toBe(true)
    expect(tasks[0].isCompleted).toBe(false)
    expect(inWeekSection(tasks[0])).toBe(true)
  })

  it('再読み込み後 isCompleted=true のタスクは完了表示', async () => {
    const savedTasks: Record<string, unknown>[] = [
      { id: 'task-done', title: '完了タスク', due_date: dateOffset(0), isCompleted: true },
    ]
    const loadTasks = vi.fn().mockResolvedValue(savedTasks)
    const raw = await loadTasks()
    const tasks = (raw as Record<string, unknown>[]).map(mapTask)
    expect(tasks[0].isCompleted).toBe(true)
    expect(tasks[0].status).toBe('completed')
  })

  it('DB保存失敗（reject）ではonSuccessが呼ばれない', async () => {
    const saveTask = vi.fn().mockRejectedValue(new Error('DB error'))
    const onSuccess = vi.fn()
    try {
      const id = await saveTask({})
      if (id) onSuccess()
    } catch {
      // expected
    }
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('saveTask null戻りではonSuccessが呼ばれない', async () => {
    const saveTask = vi.fn().mockResolvedValue(null)
    const onSuccess = vi.fn()
    const id = await saveTask({})
    if (id) onSuccess()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
