import { test, expect } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

const STATES = [
  'normal',
  'calendar-view',
  'empty',
  'loading',
  'error',
  'offline',
  'offline-no-cache',
  'completed-expanded',
  'overdue-filtered',
  'updating-completion',
] as const

// Match old 7-task MOCK_TASKS baseline via HoneyDB-format raw data.
// Due dates are chosen so toTaskStatus() (today = 2026-09-19 UTC) produces
// the same statuses as the original fixture: 1 overdue, 2 today, 1 tomorrow,
// 1 upcoming, 2 completed.
const TASK_OVERRIDE = `
window.HoneyDB.loadTasks = async () => [
  { id: 'task-1', title: 'A-05 内検',           colony_name: 'A-05', note: '前回内検から16日', due_date: '2026-09-07', icon_type: 'inspection' },
  { id: 'task-2', title: 'A-03 高温の原因を確認', colony_name: 'A-03', due_date: '2026-09-19', icon_type: 'thermometer' },
  { id: 'task-3', title: 'B-01 給餌',           colony_name: 'B-01', due_date: '2026-09-19', icon_type: 'feeding' },
  { id: 'task-4', title: 'A-02 分蜂兆候を確認', colony_name: 'A-02', due_date: '2026-09-20', icon_type: 'sprout' },
  { id: 'task-5', title: '器具を消毒',           apiary_name: '宮田養蜂場', due_date: '2026-09-22', icon_type: 'tool' },
  { id: 'task-6', title: 'A-01 採蜜',           colony_name: 'A-01', due_date: '2026-09-10', icon_type: 'inspection', completed_at: '2026-09-10T10:00:00' },
  { id: 'task-7', title: 'B-02 給餌',           colony_name: 'B-02', due_date: '2026-09-11', icon_type: 'feeding',    completed_at: '2026-09-11T10:00:00' },
];
`

test.beforeEach(async ({ page }) => {
  await injectMockHoneyDB(page, TASK_OVERRIDE)
})

for (const state of STATES) {
  test(`SCR-024 work-list ${state}`, async ({ page }) => {
    await page.goto(`/?screen=work&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-024-${state}.png`)
  })
}
