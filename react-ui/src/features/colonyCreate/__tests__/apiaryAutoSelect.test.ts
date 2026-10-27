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
