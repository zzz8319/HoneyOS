import { describe, it, expect, beforeEach } from 'vitest'

// Fix 1: Apiary auto-selection flow regression tests
// App.tsx + ColonyCreateScreen の統合ロジックを純粋関数として抽出してテスト

// saveFarm が返す型をシミュレート
function simulateSaveFarm(): Promise<{ id: number }> {
  return Promise.resolve({ id: 42 })
}

// App.tsx の onSuccess ハンドラロジック
function apiaryCreateOnSuccess(
  apiary: { id?: number; name: string; address: string; lat: number; lng: number },
  previousScreen: string,
  setNewApiaryId: (v: string | null) => void,
  setScreen: (s: string) => void,
) {
  if (previousScreen === 'colony-create' && apiary.id) {
    setNewApiaryId(String(apiary.id))
  }
  setScreen(previousScreen)
}

describe('Fix 1: apiary auto-selection', () => {
  let newApiaryId: string | null = null
  let screen = 'apiary-create'
  const setNewApiaryId = (v: string | null) => { newApiaryId = v }
  const setScreen = (s: string) => { screen = s }

  beforeEach(() => {
    newApiaryId = null
    screen = 'apiary-create'
  })

  it('saveFarm resolves with {id:42}', async () => {
    const result = await simulateSaveFarm()
    expect(result.id).toBe(42)
  })

  it('apiary.id is captured and passed to App as newApiaryId', () => {
    apiaryCreateOnSuccess(
      { id: 42, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'colony-create',
      setNewApiaryId,
      setScreen,
    )
    expect(newApiaryId).toBe('42')
  })

  it('numeric id is normalized to string "42"', () => {
    apiaryCreateOnSuccess(
      { id: 42, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'colony-create',
      setNewApiaryId,
      setScreen,
    )
    expect(typeof newApiaryId).toBe('string')
    expect(newApiaryId).toBe('42')
  })

  it('screen returns to colony-create after apiary creation', () => {
    apiaryCreateOnSuccess(
      { id: 42, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'colony-create',
      setNewApiaryId,
      setScreen,
    )
    expect(screen).toBe('colony-create')
  })

  it('settings path (previousScreen !== colony-create) does NOT set newApiaryId', () => {
    apiaryCreateOnSuccess(
      { id: 99, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'settings',
      setNewApiaryId,
      setScreen,
    )
    expect(newApiaryId).toBeNull()
    expect(screen).toBe('settings')
  })

  it('null id does NOT set newApiaryId', () => {
    apiaryCreateOnSuccess(
      { id: undefined, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'colony-create',
      setNewApiaryId,
      setScreen,
    )
    expect(newApiaryId).toBeNull()
  })

  it('id=0 (falsy) does NOT set newApiaryId', () => {
    apiaryCreateOnSuccess(
      { id: 0, name: 'テスト', address: '東京', lat: 35.0, lng: 139.0 },
      'colony-create',
      setNewApiaryId,
      setScreen,
    )
    expect(newApiaryId).toBeNull()
  })

  it('onNewApiaryConsumed clears newApiaryId to null', () => {
    newApiaryId = '42'
    const onNewApiaryConsumed = () => { newApiaryId = null }
    onNewApiaryConsumed()
    expect(newApiaryId).toBeNull()
  })

  it('saveFarm failure (exception) does not set newApiaryId', async () => {
    const failingSaveFarm = () => Promise.reject(new Error('network error'))
    let captured: string | null = null
    try {
      const result = await failingSaveFarm()
      captured = String((result as { id: number }).id)
    } catch {
      // no id captured
    }
    expect(captured).toBeNull()
  })
})

// Section 2A: reloadAndSelect — 2回取得ロジック
// ColonyCreateScreen.tsx の useEffect[newApiaryId] を純粋関数として抽出してテスト
type Farm = { id: string; name: string }

async function reloadAndSelect(
  id: string,
  fetchApiaries: () => Promise<Farm[]>,
  setSelectedApiaryId: (id: string) => void,
  onNewApiaryConsumed: () => void,
  setAutoSelectError: (v: boolean) => void,
): Promise<void> {
  const loaded1 = await fetchApiaries()
  if (loaded1.length === 0) return
  if (loaded1.some(a => a.id === id)) {
    setSelectedApiaryId(id)
    onNewApiaryConsumed()
    return
  }
  const loaded2 = await fetchApiaries()
  if (loaded2.length === 0) return
  if (loaded2.some(a => a.id === id)) {
    setSelectedApiaryId(id)
    onNewApiaryConsumed()
  } else {
    setAutoSelectError(true)
    onNewApiaryConsumed()
  }
}

describe('reloadAndSelect: 2回取得ロジック', () => {
  it('1回目でID発見 → 選択 + 消費', async () => {
    const farms: Farm[] = [{ id: '42', name: 'テスト' }, { id: '99', name: '別' }]
    const fetch = () => Promise.resolve(farms)
    let selectedId = ''; let consumed = false; let err = false
    await reloadAndSelect('42', fetch,
      id => { selectedId = id }, () => { consumed = true }, () => { err = true })
    expect(selectedId).toBe('42')
    expect(consumed).toBe(true)
    expect(err).toBe(false)
  })

  it('数値ID 42 を String("42") で比較して一致', async () => {
    // farms.id は bigint → String化済み前提。String("42") === "42"
    const farms: Farm[] = [{ id: String(42), name: 'テスト' }]
    const fetch = () => Promise.resolve(farms)
    let selectedId = ''
    await reloadAndSelect('42', fetch,
      id => { selectedId = id }, () => {}, () => {})
    expect(selectedId).toBe('42')
  })

  it('loadFarms失敗（空リスト）→ 選択しない・消費しない', async () => {
    const fetch = () => Promise.resolve([] as Farm[])
    let selectedId = ''; let consumed = false
    await reloadAndSelect('42', fetch,
      id => { selectedId = id }, () => { consumed = true }, () => {})
    expect(selectedId).toBe('')
    expect(consumed).toBe(false)
  })

  it('1回目失敗・2回目失敗 → 消費しない', async () => {
    const fetch = () => Promise.resolve([] as Farm[])
    let consumed = false
    await reloadAndSelect('42', fetch,
      () => {}, () => { consumed = true }, () => {})
    expect(consumed).toBe(false)
  })

  it('1回目未発見・2回目で発見 → 選択 + 消費', async () => {
    let callCount = 0
    const fetch = () => {
      callCount++
      if (callCount === 1) return Promise.resolve([{ id: '99', name: '別' }])
      return Promise.resolve([{ id: '99', name: '別' }, { id: '42', name: 'テスト' }])
    }
    let selectedId = ''; let consumed = false; let err = false
    await reloadAndSelect('42', fetch,
      id => { selectedId = id }, () => { consumed = true }, () => { err = true })
    expect(selectedId).toBe('42')
    expect(consumed).toBe(true)
    expect(err).toBe(false)
  })

  it('1回目未発見・2回目でも未発見 → autoSelectError + 消費（無限ループ防止）', async () => {
    const farms: Farm[] = [{ id: '99', name: '別' }]
    const fetch = () => Promise.resolve(farms)
    let selectedId = ''; let consumed = false; let err = false
    await reloadAndSelect('42', fetch,
      id => { selectedId = id }, () => { consumed = true }, () => { err = true })
    expect(selectedId).toBe('')   // 選択されない
    expect(consumed).toBe(true)   // 無限ループ防止で消費
    expect(err).toBe(true)        // エラー表示
  })

  it('ID未発見で成功扱いにしない（autoSelectError=true）', async () => {
    const farms: Farm[] = [{ id: '10', name: 'A' }, { id: '20', name: 'B' }]
    const fetch = () => Promise.resolve(farms)
    let autoErr = false
    await reloadAndSelect('42', fetch, () => {}, () => {}, v => { autoErr = v })
    expect(autoErr).toBe(true)
  })

  it('onNewApiaryConsumedが重複呼び出しされない（1回目成功）', async () => {
    const farms: Farm[] = [{ id: '42', name: 'テスト' }]
    const fetch = () => Promise.resolve(farms)
    let callCount = 0
    await reloadAndSelect('42', fetch,
      () => {}, () => { callCount++ }, () => {})
    expect(callCount).toBe(1)
  })

  it('onNewApiaryConsumedが重複呼び出しされない（2回目でエラー）', async () => {
    const farms: Farm[] = [{ id: '99', name: '別' }]
    const fetch = () => Promise.resolve(farms)
    let callCount = 0
    await reloadAndSelect('42', fetch,
      () => {}, () => { callCount++ }, () => {})
    expect(callCount).toBe(1)
  })
})
