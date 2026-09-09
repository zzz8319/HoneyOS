// SCR-008 蜂群サマリー一覧用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export type ColonyStatus = 'good' | 'warn' | 'danger'

export interface Composition {
  bee: number      // 蜂 (%)
  brood: number    // 育児 (%)
  honey: number    // 貯蜜 (%)
  empty: number    // 空間 (%)
}

export interface ColonyListItem {
  id: string
  name: string
  apiaryId: string
  apiaryName: string
  status: ColonyStatus
  /** 簡易指標β: 0〜100 */
  score: number
  /** 前回比 */
  delta: number
  lastInspectedAt: string   // 'YYYY-MM-DD'
  composition: Composition
}

export interface ApiaryGroup {
  id: string
  name: string
  colonies: ColonyListItem[]
}

export interface ColonyListData {
  apiaries: ApiaryGroup[]
  fetchedAt: string
}

// 最終内検日が古い順（要注意が上に来やすい）
export const mockColonyList: ColonyListData = {
  fetchedAt: '9:41',
  apiaries: [
    {
      id: 'apiary-a',
      name: '宮田養蜂場',
      colonies: [
        {
          id: 'a4', name: 'A-04', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'danger', score: 42, delta: 8,
          lastInspectedAt: '2026-08-12',
          composition: { bee: 30, brood: 20, honey: 15, empty: 35 },
        },
        {
          id: 'a3', name: 'A-03', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'good', score: 68, delta: -12,
          lastInspectedAt: '2026-08-20',
          composition: { bee: 38, brood: 25, honey: 22, empty: 15 },
        },
        {
          id: 'a2', name: 'A-02', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'good', score: 76, delta: 2,
          lastInspectedAt: '2026-08-28',
          composition: { bee: 42, brood: 28, honey: 20, empty: 10 },
        },
        {
          id: 'a1', name: 'A-01', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'good', score: 82, delta: 5,
          lastInspectedAt: '2026-09-01',
          composition: { bee: 45, brood: 30, honey: 18, empty: 7 },
        },
        {
          id: 'a5', name: 'A-05', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'good', score: 88, delta: 4,
          lastInspectedAt: '2026-09-04',
          composition: { bee: 50, brood: 28, honey: 16, empty: 6 },
        },
        {
          id: 'a6', name: 'A-06', apiaryId: 'apiary-a', apiaryName: '宮田養蜂場',
          status: 'good', score: 79, delta: 1,
          lastInspectedAt: '2026-09-05',
          composition: { bee: 44, brood: 26, honey: 20, empty: 10 },
        },
      ],
    },
    {
      id: 'apiary-b',
      name: '第2養蜂場',
      colonies: [
        {
          id: 'b3', name: 'B-03', apiaryId: 'apiary-b', apiaryName: '第2養蜂場',
          status: 'warn', score: 58, delta: -5,
          lastInspectedAt: '2026-08-15',
          composition: { bee: 32, brood: 22, honey: 18, empty: 28 },
        },
        {
          id: 'b2', name: 'B-02', apiaryId: 'apiary-b', apiaryName: '第2養蜂場',
          status: 'warn', score: 69, delta: 6,
          lastInspectedAt: '2026-08-25',
          composition: { bee: 40, brood: 24, honey: 20, empty: 16 },
        },
        {
          id: 'b1', name: 'B-01', apiaryId: 'apiary-b', apiaryName: '第2養蜂場',
          status: 'good', score: 73, delta: -3,
          lastInspectedAt: '2026-09-02',
          composition: { bee: 42, brood: 25, honey: 22, empty: 11 },
        },
        {
          id: 'b4', name: 'B-04', apiaryId: 'apiary-b', apiaryName: '第2養蜂場',
          status: 'good', score: 91, delta: 3,
          lastInspectedAt: '2026-09-06',
          composition: { bee: 52, brood: 30, honey: 12, empty: 6 },
        },
      ],
    },
  ],
}
