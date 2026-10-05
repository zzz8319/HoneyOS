/**
 * HoneyOS 正式画面台帳
 *
 * 画面番号・正式名称・実装状態の唯一の基準。
 * 仕様書: DESIGN_SPEC.md / docs/HoneyOS_UI_Implementation_Spec.md
 *
 * 番号運用ルール:
 * - SCR-016/016b/019/020 は永久欠番。別機能に再利用しない。
 * - SCR-009 は「蜂群詳細（巣箱詳細）」のみを指す。
 * - SCR-018 は温度・湿度・重量・音響を種別パラメータで切り替える統合センサーグラフ。
 * - サブビュー・ボトムシート・ポップアップには新しい SCR 番号を付けない。
 */

export type ScreenStatus =
  | 'active'          // 有効な現行画面
  | 'retired'         // 廃止（永久欠番）
  | 'merged'          // 別画面へ統合済み（永久欠番）
  | 'legacy-only'     // 旧版 index.html にのみ実装済み
  | 'migration-pending' // React 移植待ち（旧版実装あり）

export type ImplementationLayer =
  | 'react'           // react-ui に実装済み
  | 'legacy'          // ルート index.html にのみ実装
  | 'both'            // 両方に実装あり
  | 'none'            // 未実装

export interface ScreenEntry {
  /** SCR-001 形式の正式番号 */
  id: string
  /** 正式名称（仕様書・コード・テスト名で統一する） */
  canonicalName: string
  /** 実装状態 */
  status: ScreenStatus
  /**
   * App.tsx の VALID_SCREENS に登録された route キー。
   * retired/merged の場合は null（有効ルートとして登録しない）。
   */
  route: string | null
  /** 実装層 */
  implementation: ImplementationLayer
  /** merged の場合、統合先画面番号 */
  mergedInto?: string
  /** 正規化前の旧称・別称（履歴管理のみ。表示文言には使わない） */
  legacyNames?: string[]
  /** 補足事項 */
  notes?: string
}

export const SCREEN_REGISTRY: ScreenEntry[] = [
  {
    id: 'SCR-001',
    canonicalName: 'ログイン',
    status: 'active',
    route: 'login',
    implementation: 'react',
  },
  {
    id: 'SCR-002',
    canonicalName: '新規登録',
    status: 'active',
    route: 'signup',
    implementation: 'react',
  },
  {
    id: 'SCR-003',
    canonicalName: 'オンボーディング① ようこそ',
    status: 'active',
    route: 'onboarding-1',
    implementation: 'react',
  },
  {
    id: 'SCR-004',
    canonicalName: 'オンボーディング② 養蜂場設定',
    status: 'active',
    route: 'onboarding-2',
    implementation: 'react',
  },
  {
    id: 'SCR-005',
    canonicalName: 'オンボーディング③ 準備完了',
    status: 'active',
    route: 'onboarding-3',
    implementation: 'react',
  },
  {
    id: 'SCR-006',
    canonicalName: 'ダッシュボード',
    status: 'active',
    route: 'home',
    implementation: 'react',
    notes: 'ホームタブの既定画面',
  },
  {
    id: 'SCR-007',
    canonicalName: '通知センター',
    status: 'active',
    route: 'notification-center',
    implementation: 'react',
  },
  {
    id: 'SCR-008',
    canonicalName: '蜂群一覧',
    status: 'active',
    route: 'farms',
    implementation: 'react',
    legacyNames: ['蜂群サマリー'],
    notes: '旧称「蜂群サマリー」は使用しない',
  },
  {
    id: 'SCR-009',
    canonicalName: '蜂群詳細（巣箱詳細）',
    status: 'active',
    route: 'colony-detail',
    implementation: 'react',
    legacyNames: ['養蜂場詳細', '巣箱サマリー', 'SCR-009b'],
    notes: '旧SCR-009「養蜂場詳細」は廃止。旧SCR-009b「巣箱サマリー」を統合済み',
  },
  {
    id: 'SCR-010',
    canonicalName: '養蜂場マップ',
    status: 'active',
    route: 'apiary-map',
    implementation: 'react',
  },
  {
    id: 'SCR-011',
    canonicalName: '内検開始',
    status: 'active',
    route: 'inspection-start',
    implementation: 'react',
  },
  {
    id: 'SCR-012',
    canonicalName: '内検記録',
    status: 'active',
    route: 'inspection-record',
    implementation: 'react',
  },
  {
    id: 'SCR-013',
    canonicalName: '枠ビューア',
    status: 'active',
    route: 'frame-viewer',
    implementation: 'react',
    notes: '段追加等はサブビュー（SCR-013/S01等）。新しいSCR番号を付けない',
  },
  {
    id: 'SCR-014',
    canonicalName: 'AI解析入力',
    status: 'active',
    route: 'ai-analysis',
    implementation: 'react',
  },
  {
    id: 'SCR-015',
    canonicalName: '内検完了（内検サマリー）',
    status: 'active',
    route: 'inspection-complete',
    implementation: 'react',
    legacyNames: ['内検サマリー', 'InspectionComplete'],
    notes: '「内検サマリー」「InspectionComplete」はこの正式名称に統一',
  },
  {
    id: 'SCR-016',
    canonicalName: '内検履歴ダッシュボード',
    status: 'retired',
    route: null,
    implementation: 'none',
    mergedInto: 'SCR-009',
    notes: '永久欠番。SCR-009のポップアップとSCR-013へ統合済み',
  },
  {
    id: 'SCR-016b',
    canonicalName: '内検詳細',
    status: 'retired',
    route: null,
    implementation: 'none',
    mergedInto: 'SCR-013',
    notes: '永久欠番。SCR-013へ統合済み',
  },
  {
    id: 'SCR-017',
    canonicalName: 'センサー詳細',
    status: 'active',
    route: 'sensor-detail',
    implementation: 'react',
  },
  {
    id: 'SCR-018',
    canonicalName: 'センサーグラフ',
    status: 'active',
    route: 'sensor-graph',
    implementation: 'react',
    legacyNames: ['SCR-018-020'],
    notes: '温度・湿度・重量・音響を種別パラメータで切り替える統合センサーグラフ。旧018〜020を統合',
  },
  {
    id: 'SCR-019',
    canonicalName: '旧・湿度グラフ',
    status: 'merged',
    route: null,
    implementation: 'none',
    mergedInto: 'SCR-018',
    notes: '永久欠番。SCR-018へ統合済み',
  },
  {
    id: 'SCR-020',
    canonicalName: '旧・重量等グラフ',
    status: 'merged',
    route: null,
    implementation: 'none',
    mergedInto: 'SCR-018',
    notes: '永久欠番。SCR-018へ統合済み',
  },
  {
    id: 'SCR-021',
    canonicalName: 'カメラ画像',
    status: 'active',
    route: 'camera-images',
    implementation: 'react',
  },
  {
    id: 'SCR-022',
    canonicalName: 'AI診断結果',
    status: 'active',
    route: 'ai-diagnosis',
    implementation: 'react',
  },
  {
    id: 'SCR-023',
    canonicalName: 'AI推奨作業',
    status: 'active',
    route: 'recommended-work',
    implementation: 'react',
    notes: 'SCR-025/026への遷移未接続',
  },
  {
    id: 'SCR-024',
    canonicalName: '作業',
    status: 'active',
    route: 'work',
    implementation: 'react',
    notes: '作業タブ既定画面。BottomNavからの遷移未接続',
  },
  {
    id: 'SCR-025',
    canonicalName: 'タスク作成',
    status: 'active',
    route: 'task-create',
    implementation: 'react',
  },
  {
    id: 'SCR-026',
    canonicalName: '作業記録入力',
    status: 'active',
    route: 'work-record',
    implementation: 'react',
  },
  {
    id: 'SCR-027',
    canonicalName: '作業履歴',
    status: 'active',
    route: 'work-history',
    implementation: 'react',
    notes: 'SCR-028への遷移未接続',
  },
  {
    id: 'SCR-028',
    canonicalName: 'レポート',
    status: 'active',
    route: 'report',
    implementation: 'react',
    notes: '分析タブ既定画面。SCR-027との相互接続未完',
  },
  {
    id: 'SCR-029',
    canonicalName: '蜂群トレンド',
    status: 'active',
    route: 'colony-trend',
    implementation: 'react',
  },
  {
    id: 'SCR-030',
    canonicalName: '蜂群比較',
    status: 'active',
    route: 'colony-comparison',
    implementation: 'react',
  },
  {
    id: 'SCR-031',
    canonicalName: '設定',
    status: 'active',
    route: 'settings',
    implementation: 'react',
    notes: 'React移植完了。旧実装: ルートindex.html (migration-pending → active 2026-10-04)',
  },
  {
    id: 'SCR-032',
    canonicalName: '蜂群追加',
    status: 'active',
    route: 'colony-create',
    implementation: 'react',
    legacyNames: ['蜂群新規追加'],
    notes: '旧称「蜂群新規追加」は使用しない',
  },
  {
    id: 'SCR-033',
    canonicalName: '養蜂場追加',
    status: 'active',
    route: 'apiary-create',
    implementation: 'react',
    legacyNames: ['養蜂場新規追加'],
    notes: '旧称「養蜂場新規追加」は使用しない',
  },
  {
    id: 'SCR-034',
    canonicalName: 'パスワード再設定',
    status: 'active',
    route: 'password-reset',
    implementation: 'react',
    legacyNames: ['パスワードリセット'],
    notes: '旧称「パスワードリセット」は表示文言として使用しない',
  },
]

/** status: 'active' の画面だけを返す */
export const ACTIVE_SCREENS = SCREEN_REGISTRY.filter(s => s.status === 'active')

/** route キー一覧（VALID_SCREENS と照合用） */
export const ACTIVE_ROUTES = ACTIVE_SCREENS
  .map(s => s.route)
  .filter((r): r is string => r !== null)

/** SCR 番号で引く */
export function findScreen(id: string): ScreenEntry | undefined {
  return SCREEN_REGISTRY.find(s => s.id === id)
}
