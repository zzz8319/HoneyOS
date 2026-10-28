/** farms.name は旧コードで object を JSON 文字列として保存した可能性がある。
 *  あらゆる型の入力から人間が読める養蜂場名を返す純粋関数。
 */
export function safeApiaryName(raw: unknown): string {
  if (raw === null || raw === undefined) return '（名称不明）'
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.name === 'string' && obj.name) return obj.name
    return '（名称不明）'
  }
  const str = String(raw)
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str) as unknown
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const p = parsed as Record<string, unknown>
        if (typeof p.name === 'string' && p.name) return p.name
        return '（名称不明）'
      }
    } catch { /* 不正JSON: 元文字列をそのまま使う */ }
  }
  return str || '（名称不明）'
}
