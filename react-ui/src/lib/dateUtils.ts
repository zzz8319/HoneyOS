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

/**
 * Date を Asia/Tokyo 基準の「YYYY年M月D日（曜）」形式に変換する。
 * 無効な Date（NaN）は空文字を返す。
 */
export function formatJstDate(date: Date): string {
  if (isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const weekday = get('weekday')
  if (!year || !month || !day) return ''
  return `${year}年${month}月${day}日（${weekday}）`
}

/**
 * 現在時刻を Asia/Tokyo 基準の「YYYY年M月D日（曜）」文字列で返す。
 * 長時間開きっぱなしの画面でも、呼び出し時点の日付を返す。
 */
export function nowJstDateLabel(): string {
  return formatJstDate(new Date())
}

/**
 * 現在時刻の UTC ISO 文字列を返す（DB 保存用）。
 */
export function nowUtcIso(): string {
  return new Date().toISOString()
}
