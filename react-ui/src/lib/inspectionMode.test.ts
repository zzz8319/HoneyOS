import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  resolveInitialInspectionMode,
  getCachedDefaultInspectionMode,
} from './inspectionMode'

// ── resolveInitialInspectionMode ─────────────────────────────────────────────

describe('resolveInitialInspectionMode', () => {
  // 1. previousMode が 'frame' → preferredMode='frame', effectiveMode='frame'
  it('prioritizes previousMode over userDefaultMode', () => {
    const r = resolveInitialInspectionMode({ previousMode: 'frame', userDefaultMode: 'ratio' })
    expect(r.preferredMode).toBe('frame')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 2. previousMode が 'ratio', supportedModes=['frame','ratio'] → effectiveMode='ratio'
  it('uses previousMode ratio when ratio is supported', () => {
    const r = resolveInitialInspectionMode({
      previousMode: 'ratio',
      userDefaultMode: 'frame',
      supportedModes: ['frame', 'ratio'],
    })
    expect(r.preferredMode).toBe('ratio')
    expect(r.effectiveMode).toBe('ratio')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 3. previousMode が 'ratio', supportedModes=['frame'] → フォールバック
  it('falls back to frame when ratio is not supported', () => {
    const r = resolveInitialInspectionMode({
      previousMode: 'ratio',
      userDefaultMode: 'frame',
      supportedModes: ['frame'],
    })
    expect(r.preferredMode).toBe('ratio')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(true)
  })

  // 4. previousMode=undefined → userDefaultMode にフォールバック
  it('falls back to userDefaultMode when previousMode is undefined', () => {
    const r = resolveInitialInspectionMode({
      previousMode: undefined,
      userDefaultMode: 'ratio',
      supportedModes: ['frame', 'ratio'],
    })
    expect(r.preferredMode).toBe('ratio')
    expect(r.effectiveMode).toBe('ratio')
  })

  // 5. previousMode=null → userDefaultMode にフォールバック
  it('treats null previousMode as absent', () => {
    const r = resolveInitialInspectionMode({
      previousMode: null,
      userDefaultMode: 'frame',
    })
    expect(r.preferredMode).toBe('frame')
    expect(r.effectiveMode).toBe('frame')
  })

  // 6. 両方 undefined → システムデフォルト 'frame'
  it('defaults to frame when both modes are absent', () => {
    const r = resolveInitialInspectionMode({})
    expect(r.preferredMode).toBe('frame')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 7. userDefaultMode='ratio', supportedModes=['frame'] → フォールバック
  it('falls back to frame when userDefault is ratio and ratio unsupported', () => {
    const r = resolveInitialInspectionMode({
      userDefaultMode: 'ratio',
      supportedModes: ['frame'],
    })
    expect(r.preferredMode).toBe('ratio')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(true)
  })

  // 8. userDefaultMode='frame', supportedModes=['frame'] → 正常
  it('uses userDefaultMode frame when frame is supported', () => {
    const r = resolveInitialInspectionMode({
      userDefaultMode: 'frame',
      supportedModes: ['frame'],
    })
    expect(r.preferredMode).toBe('frame')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 9. 不正な previousMode 文字列は無視
  it('ignores invalid previousMode string', () => {
    const r = resolveInitialInspectionMode({
      previousMode: 'invalid-mode',
      userDefaultMode: 'ratio',
      supportedModes: ['frame', 'ratio'],
    })
    expect(r.preferredMode).toBe('ratio')
  })

  // 10. 不正な userDefaultMode 文字列は無視
  it('ignores invalid userDefaultMode string', () => {
    const r = resolveInitialInspectionMode({
      previousMode: undefined,
      userDefaultMode: 'unknown',
    })
    expect(r.preferredMode).toBe('frame')
  })

  // 11. supportedModes 省略時は ['frame'] のみ
  it('assumes only frame is supported when supportedModes is omitted', () => {
    const r = resolveInitialInspectionMode({ previousMode: 'ratio' })
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(true)
  })

  // 12. supportedModes=[] → 空配列でもフォールバック
  it('falls back to frame when supportedModes is empty', () => {
    const r = resolveInitialInspectionMode({
      previousMode: 'frame',
      supportedModes: [],
    })
    expect(r.preferredMode).toBe('frame')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 13. supportedModes=['ratio'] のみ、previousMode='frame' → フォールバックなし（frame自体未サポート）
  it('falls back to frame even when frame is not in supportedModes', () => {
    // frame は常にフォールバック先なので effectiveMode は 'frame'
    const r = resolveInitialInspectionMode({
      previousMode: 'frame',
      supportedModes: ['ratio'],
    })
    // preferredMode='frame' だが supportedModes に frame がないため effectiveMode='frame'
    // (フォールバック先は常に 'frame')
    expect(r.effectiveMode).toBe('frame')
    expect(r.ratioFallbackActive).toBe(false)
  })

  // 14. 返り値は preferredMode, effectiveMode, ratioFallbackActive の3つ
  it('returns all three fields', () => {
    const r = resolveInitialInspectionMode({})
    expect(r).toHaveProperty('preferredMode')
    expect(r).toHaveProperty('effectiveMode')
    expect(r).toHaveProperty('ratioFallbackActive')
  })

  // 15. ratioFallbackActive は preferredMode='ratio' かつ effectiveMode='frame' のときのみ true
  it('ratioFallbackActive is only true for ratio→frame fallback', () => {
    const r1 = resolveInitialInspectionMode({
      previousMode: 'frame',
      supportedModes: ['frame'],
    })
    expect(r1.ratioFallbackActive).toBe(false)

    const r2 = resolveInitialInspectionMode({
      previousMode: 'ratio',
      supportedModes: ['frame', 'ratio'],
    })
    expect(r2.ratioFallbackActive).toBe(false)

    const r3 = resolveInitialInspectionMode({
      previousMode: 'ratio',
      supportedModes: ['frame'],
    })
    expect(r3.ratioFallbackActive).toBe(true)
  })
})

// ── getCachedDefaultInspectionMode ───────────────────────────────────────────

// node 環境では localStorage がないので、簡易モックで動作確認
const store: Record<string, string> = {}
const mockLocalStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

describe('getCachedDefaultInspectionMode', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k])
    ;(globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage
  })
  afterEach(() => {
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage
  })

  // 16. userId=null → null
  it('returns null when currentUserId is null', () => {
    expect(getCachedDefaultInspectionMode(null)).toBeNull()
  })

  // 17. userId=undefined → null
  it('returns null when currentUserId is undefined', () => {
    expect(getCachedDefaultInspectionMode(undefined)).toBeNull()
  })

  // 18. キャッシュなし → null
  it('returns null when no cache exists', () => {
    expect(getCachedDefaultInspectionMode('user-1')).toBeNull()
  })

  // 19. 別ユーザーのキャッシュは使用しない
  it('ignores cache from a different user', () => {
    mockLocalStorage.setItem('honeyos_prefs_user_id', 'user-other')
    mockLocalStorage.setItem('honeyos_user_prefs', JSON.stringify({ default_inspection_mode: 'ratio' }))
    expect(getCachedDefaultInspectionMode('user-1')).toBeNull()
  })

  // 20. 同一ユーザーのキャッシュは使用する
  it('returns cached mode for the same user', () => {
    mockLocalStorage.setItem('honeyos_prefs_user_id', 'user-1')
    mockLocalStorage.setItem('honeyos_user_prefs', JSON.stringify({ default_inspection_mode: 'ratio' }))
    expect(getCachedDefaultInspectionMode('user-1')).toBe('ratio')
  })

  // 21. キャッシュ内の不正な値は null を返す
  it('returns null for invalid cached mode value', () => {
    mockLocalStorage.setItem('honeyos_prefs_user_id', 'user-1')
    mockLocalStorage.setItem('honeyos_user_prefs', JSON.stringify({ default_inspection_mode: 'invalid' }))
    expect(getCachedDefaultInspectionMode('user-1')).toBeNull()
  })

  // 22. JSON パース失敗時は null
  it('returns null when cache JSON is malformed', () => {
    mockLocalStorage.setItem('honeyos_prefs_user_id', 'user-1')
    mockLocalStorage.setItem('honeyos_user_prefs', 'not-json{')
    expect(getCachedDefaultInspectionMode('user-1')).toBeNull()
  })
})
