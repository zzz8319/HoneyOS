/**
 * 内検記録方式の優先順位解決ロジック
 *
 * 優先順位:
 *   1. previousMode  — 対象蜂群の直近内検で使用した記録方式
 *   2. userDefaultMode — user_preferences.default_inspection_mode
 *   3. 'frame'       — システムデフォルト
 *
 * preferredMode と effectiveMode を区別する:
 *   - preferredMode : ユーザーが希望する方式（設定値を消さない）
 *   - effectiveMode : 実際に画面で使用する方式（ratio が準備中なら frame にフォールバック）
 */

export type InspectionMode = 'frame' | 'ratio'

export interface ResolveInspectionModeParams {
  /** 対象蜂群の直近確定済み内検で使用した記録方式（下書き除く）。不明な場合は undefined */
  previousMode?: string | null
  /** user_preferences.default_inspection_mode。未取得の場合は undefined */
  userDefaultMode?: string | null
  /** 現在利用可能なモード一覧。省略時は ['frame'] のみ利用可能とみなす */
  supportedModes?: InspectionMode[]
}

export interface ResolvedInspectionMode {
  /** ユーザーが希望する方式（DB 設定を消さない） */
  preferredMode: InspectionMode
  /** 現在の画面で実際に使用する方式（未実装モードはフォールバック） */
  effectiveMode: InspectionMode
  /** ratio が準備中でフォールバックが発生している場合 true */
  ratioFallbackActive: boolean
}

const VALID_MODES: InspectionMode[] = ['frame', 'ratio']

function isValidMode(v: string | null | undefined): v is InspectionMode {
  return typeof v === 'string' && (VALID_MODES as string[]).includes(v)
}

/**
 * SCR-012 の初期記録方式を決定する純粋関数。
 * 非同期処理なし・副作用なし・テスト容易。
 */
export function resolveInitialInspectionMode({
  previousMode,
  userDefaultMode,
  supportedModes = ['frame'],
}: ResolveInspectionModeParams): ResolvedInspectionMode {
  // 1. 前回方式（有効値のみ採用、不正値は無視）
  const validPrevious = isValidMode(previousMode) ? previousMode : null

  // 2. ユーザーデフォルト（有効値のみ採用）
  const validUserDefault = isValidMode(userDefaultMode) ? userDefaultMode : null

  // preferredMode: 優先順位に従って選択
  const preferredMode: InspectionMode =
    validPrevious ?? validUserDefault ?? 'frame'

  // effectiveMode: supportedModes に含まれない場合は 'frame' にフォールバック
  const effectiveMode: InspectionMode = supportedModes.includes(preferredMode)
    ? preferredMode
    : 'frame'

  const ratioFallbackActive =
    preferredMode === 'ratio' && effectiveMode === 'frame'

  return { preferredMode, effectiveMode, ratioFallbackActive }
}

/**
 * localStorage から同一ユーザーのキャッシュ済み default_inspection_mode を取得する。
 * 別ユーザーのキャッシュは使用しない。
 */
export function getCachedDefaultInspectionMode(
  currentUserId: string | null | undefined,
): InspectionMode | null {
  if (!currentUserId) return null
  try {
    const cachedUserId = localStorage.getItem('honeyos_prefs_user_id')
    if (cachedUserId !== currentUserId) return null
    const raw = localStorage.getItem('honeyos_user_prefs')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { default_inspection_mode?: string }
    return isValidMode(parsed.default_inspection_mode)
      ? parsed.default_inspection_mode
      : null
  } catch {
    return null
  }
}
