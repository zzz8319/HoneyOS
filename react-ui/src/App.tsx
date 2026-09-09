import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import {
  AppHeader,
  BottomNav,
  PrimaryButton,
  StatusBadge,
  EmptyState,
  ErrorBanner,
} from './components'
import type { TabId } from './components'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const simulateLoad = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="app-shell">
      <AppHeader
        farmName="宮田養蜂場"
        notifCount={3}
        onNotifClick={() => setActiveTab('home')}
      />

      {error && (
        <ErrorBanner
          message={error}
          severity="critical"
          onClose={() => setError(null)}
        />
      )}

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ステータスバッジ</h2>
          <div className={styles.row}>
            <StatusBadge status="good" showEmoji />
            <StatusBadge status="warn" showEmoji />
            <StatusBadge status="danger" showEmoji />
            <StatusBadge status="unknown" showEmoji />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ボタン</h2>
          <div className={styles.stack}>
            <PrimaryButton fullWidth loading={loading} onClick={simulateLoad}>
              {loading ? '読み込み中...' : '内検を始める'}
            </PrimaryButton>
            <PrimaryButton variant="outline" fullWidth>
              作業記録を追加
            </PrimaryButton>
            <PrimaryButton variant="ghost" size="sm">
              キャンセル
            </PrimaryButton>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>エラーバナー（minor）</h2>
          <ErrorBanner
            message="オフラインです。ネットワーク接続を確認してください。"
            severity="minor"
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>空状態</h2>
          <EmptyState
            emoji="🐝"
            title="蜂群がまだありません"
            description="最初の蜂群を追加して、内検記録を始めましょう。"
            actionLabel="＋ 蜂群を追加"
            onAction={() => setError('HoneyDB が未初期化です（開発用メッセージ）')}
          />
        </section>
      </main>

      <button className={styles.fab} aria-label="内検を始める">
        <ClipboardCheck size={20} aria-hidden />
        内検を始める
      </button>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
