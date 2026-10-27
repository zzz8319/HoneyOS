/**
 * Pure mapping functions for WorkList tasks.
 *
 * Completion state rules:
 *   - Determined ONLY by boolean fields: isCompleted > is_completed > completed > false
 *   - completed_at is a completion TIMESTAMP, NOT a completion flag.
 *     A non-null completed_at does NOT mean the task is complete; only the boolean fields do.
 *     Rationale: date strings are truthy values and must never be used as booleans.
 */
import type { WorkTask, TaskIconType, TaskStatus } from './types'

export function toTaskStatus(due: string | undefined, completed: boolean): TaskStatus {
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

export function mapTask(raw: Record<string, unknown>): WorkTask {
  // Priority: isCompleted > is_completed > completed > false
  // completed_at is excluded — date strings are truthy and MUST NOT be used as boolean
  const completed = Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed ?? false)
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? ''),
    tag: String(raw.colony_name ?? raw.apiary_name ?? raw.tag ?? ''),
    note: raw.note ? String(raw.note) : undefined,
    dueDate: String(raw.due_date ?? raw.dueDate ?? ''),
    status: toTaskStatus(
      (raw.due_date ?? raw.dueDate) as string | undefined,
      completed,
    ),
    iconType: (raw.icon_type ?? raw.iconType ?? 'inspection') as TaskIconType,
    completedAt: (raw.completedAt ?? raw.completed_at) ? String(raw.completedAt ?? raw.completed_at) : undefined,
  }
}
