/** 内検日付を人間が読める相対表現に変換する純粋関数。
 *  null / undefined / 不正日付文字列を安全に処理し、NaN を絶対に返さない。
 */
export function relativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '未実施'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '未取得'
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (isNaN(diff)) return '未取得'
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  if (diff < 0) return '未来'
  return `${diff}日前`
}

/** M/D 形式の短縮日付。不正入力は空文字を返す。 */
export function shortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}
