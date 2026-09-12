import type { StageRecord, QueenStatus } from './types'

interface DraftData {
  stages: StageRecord[]
  queenStatus: QueenStatus | null
  observations: string[]
  savedAt: string
}

const PREFIX = 'honeyos-insp-draft-'

export const DraftStore = {
  save(colonyId: string, data: DraftData): void {
    try {
      localStorage.setItem(PREFIX + colonyId, JSON.stringify(data))
    } catch {
      // localStorage unavailable
    }
  },
  load(colonyId: string): DraftData | null {
    try {
      const raw = localStorage.getItem(PREFIX + colonyId)
      return raw ? (JSON.parse(raw) as DraftData) : null
    } catch {
      return null
    }
  },
  clear(colonyId: string): void {
    try {
      localStorage.removeItem(PREFIX + colonyId)
    } catch {
      // silent
    }
  },
}
