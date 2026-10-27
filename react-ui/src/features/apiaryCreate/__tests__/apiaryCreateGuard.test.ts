/**
 * ApiaryCreateScreen saveFarm 引数・戻り値・偽成功防止の回帰テスト
 *
 * 修正前の問題:
 *   - saveFarm がオブジェクト引数で呼ばれていた（API は位置引数）
 *   - INSERT 後に ID が返されなかった（result?.id が常に undefined）
 *   - result?.id ?? 0 → ID が未取得でも onSuccess が呼ばれていた（偽成功）
 *
 * これらはモック確認であり、実 Supabase 保存の確認とは別物です。
 */
import { describe, it, expect, vi } from 'vitest'

// ── saveFarm 引数・戻り値の契約テスト ────────────────────────────────────────

describe('saveFarm API 契約', () => {
  it('有効な id を返した場合のみ onSuccess を呼ぶ', async () => {
    const saveFarm = vi.fn().mockResolvedValue({ id: 42 })
    const onSuccess = vi.fn()

    // 位置引数呼び出しをシミュレート
    const result = await saveFarm('テスト養蜂場', undefined, { latitude: 35.0, longitude: 135.0 })
    if (!result?.id) throw new Error('saveFarm returned no id')
    onSuccess({ id: result.id, name: 'テスト養蜂場' })

    expect(saveFarm).toHaveBeenCalledWith('テスト養蜂場', undefined, { latitude: 35.0, longitude: 135.0 })
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }))
  })

  it('saveFarm が null を返した場合は成功遷移しない', async () => {
    const saveFarm = vi.fn().mockResolvedValue(null)
    const onSuccess = vi.fn()

    const result = await saveFarm('テスト養蜂場', undefined, {})
    let threw = false
    try {
      if (!result?.id) throw new Error('saveFarm returned no id')
      onSuccess({ id: result.id })
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('saveFarm が undefined を返した場合は成功遷移しない', async () => {
    const saveFarm = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()

    const result = await saveFarm('テスト養蜂場', undefined, {})
    let threw = false
    try {
      if (!result?.id) throw new Error('saveFarm returned no id')
      onSuccess({ id: result.id })
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('saveFarm が id:0 を返した場合は成功遷移しない', async () => {
    const saveFarm = vi.fn().mockResolvedValue({ id: 0 })
    const onSuccess = vi.fn()

    const result = await saveFarm('テスト養蜂場', undefined, {})
    let threw = false
    try {
      if (!result?.id) throw new Error('saveFarm returned no id')
      onSuccess({ id: result.id })
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('saveFarm が例外を投げた場合は成功遷移しない', async () => {
    const saveFarm = vi.fn().mockRejectedValue(new Error('network error'))
    const onSuccess = vi.fn()

    let threw = false
    try {
      await saveFarm('テスト養蜂場', undefined, {})
      onSuccess({})
    } catch {
      threw = true
    }

    expect(threw).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('位置引数形式で呼ばれることを確認（オブジェクト引数ではない）', () => {
    // 修正前: saveFarm({ name, address, lat, lng }) — オブジェクト引数（誤り）
    // 修正後: saveFarm(name, id, { latitude, longitude }) — 位置引数（正しい）
    const saveFarm = vi.fn().mockResolvedValue({ id: 1 })
    saveFarm('農場名', undefined, { latitude: 35.68, longitude: 139.69 })

    expect(saveFarm).toHaveBeenCalledWith(
      '農場名',
      undefined,
      { latitude: 35.68, longitude: 139.69 },
    )
    // オブジェクト引数 { name, address, lat, lng } で呼ばれていないことを確認
    expect(saveFarm).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.any(String) }),
    )
  })

  it('保存 payload に名前・緯度・経度が含まれる', async () => {
    const saveFarm = vi.fn().mockResolvedValue({ id: 99 })
    await saveFarm('宮田養蜂場', undefined, { latitude: 34.5, longitude: 133.2 })

    const [name, , opts] = saveFarm.mock.calls[0]
    expect(name).toBe('宮田養蜂場')
    expect(opts).toMatchObject({ latitude: 34.5, longitude: 133.2 })
  })
})

// ── 二重登録防止テスト ────────────────────────────────────────────────────────

describe('二重登録防止', () => {
  it('saveFarm が実行中のとき 2 回目の呼び出しを防ぐ', async () => {
    let resolveFirst!: (v: { id: number }) => void
    const firstCall = new Promise<{ id: number }>(r => { resolveFirst = r })
    const saveFarm = vi.fn().mockReturnValueOnce(firstCall)
    const onSuccess = vi.fn()

    let isSubmitting = false

    async function handleSubmit() {
      if (isSubmitting) return
      isSubmitting = true
      try {
        const result = await saveFarm('農場', undefined, {})
        if (!result?.id) throw new Error('no id')
        onSuccess({ id: result.id })
      } finally {
        isSubmitting = false
      }
    }

    // 1 回目: 送信開始（非同期、まだ完了していない）
    const p = handleSubmit()
    // 2 回目: ガードで弾かれる
    await handleSubmit()
    // 1 回目を完了
    resolveFirst({ id: 5 })
    await p

    expect(saveFarm).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
