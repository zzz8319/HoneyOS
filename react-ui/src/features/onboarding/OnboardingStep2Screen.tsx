import { useState, useRef, useCallback, useId } from 'react'
import { ChevronLeft, MapPin, X, Plus, Minus, Crosshair } from 'lucide-react'
import type { OnboardingStep2ViewState } from './types'
import styles from './OnboardingStep2Screen.module.css'

interface GeoResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  viewState?: OnboardingStep2ViewState
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

// Preset location used in pre-filled view states
const PRESET_LOCATION: GeoResult = {
  address: '静岡県磐田市宮田',
  lat: 34.7156,
  lng: 137.852,
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function OnboardingStep2Screen({ viewState = 'normal', onBack, onNext, onSkip }: Props) {
  const farmNameId = useId()
  const locationId = useId()
  const farmNameErrorId = useId()
  const submitStatusId = useId()

  const isPrefilled =
    viewState === 'filled' ||
    viewState === 'location-selected' ||
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'

  const [farmName, setFarmName] = useState(() => (isPrefilled ? '宮田養蜂場' : ''))
  const [locationQuery, setLocationQuery] = useState(() =>
    viewState === 'location-selected' ||
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'
      ? PRESET_LOCATION.address
      : '',
  )
  const [location, setLocation] = useState<GeoResult | null>(() =>
    viewState === 'location-selected' ||
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'
      ? PRESET_LOCATION
      : null,
  )
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [colonyCount, setColonyCount] = useState(() =>
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'
      ? 3
      : 0,
  )
  const [hiveCount, setHiveCount] = useState(() =>
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'
      ? 5
      : 0,
  )
  const [showColonyNames, setShowColonyNames] = useState(
    viewState === 'colony-names-expanded',
  )
  const [colonyNames, setColonyNames] = useState<string[]>(() =>
    Array.from({ length: viewState === 'colony-names-expanded' ? 3 : 0 }, () => ''),
  )

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(() =>
    viewState === 'error'
      ? '保存できませんでした。もう一度お試しください。'
      : '',
  )
  const [farmNameError, setFarmNameError] = useState('')

  const isOffline    = viewState === 'offline'
  const isSubmitting = viewState === 'submitting' || submitting

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Location search ───────────────────────────────────────────
  const searchLocation = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return }
    setSearching(true)
    try {
      let results: GeoResult[]
      if (window.HoneyDB?.searchAddress) {
        results = await window.HoneyDB.searchAddress(q)
      } else {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=ja&countrycodes=jp`
        const res = await fetch(url, { headers: { 'Accept-Language': 'ja' } })
        const data = await res.json() as Array<{ display_name: string; lat: string; lon: string }>
        results = data.map(d => ({ address: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
      }
      setSearchResults(results)
      setShowResults(results.length > 0)
    } catch {
      setSearchResults([])
      setShowResults(false)
    } finally {
      setSearching(false)
    }
  }, [])

  function handleLocationInput(val: string) {
    setLocationQuery(val)
    setLocation(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchLocation(val), 500)
  }

  function selectLocation(r: GeoResult) {
    setLocation(r)
    setLocationQuery(r.address)
    setShowResults(false)
    setSearchResults([])
  }

  function clearLocation() {
    setLocation(null)
    setLocationQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // ── Colony names sync ─────────────────────────────────────────
  function handleShowColonyNames() {
    setShowColonyNames(true)
    setColonyNames(prev => {
      const next = Array.from({ length: colonyCount }, (_, i) => prev[i] ?? '')
      return next
    })
  }

  function handleColonyCountChange(delta: number) {
    const next = Math.max(0, colonyCount + delta)
    setColonyCount(next)
    if (showColonyNames) {
      setColonyNames(prev => Array.from({ length: next }, (_, i) => prev[i] ?? ''))
    }
    // Clear error if count drops to 0
    if (next === 0) setFarmNameError('')
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSave() {
    if (isSubmitting || isOffline) return
    setSubmitError('')

    // Validate: colonies without farm name
    if (colonyCount > 0 && !farmName.trim()) {
      setFarmNameError('蜂群を登録するには養蜂場名を入力してください')
      return
    }
    setFarmNameError('')

    const hasData = farmName.trim() || location || colonyCount > 0 || hiveCount > 0
    if (!hasData) {
      // Nothing to save — treat same as skip
      onNext()
      return
    }

    if (!navigator.onLine) {
      setSubmitError('オフラインのため保存できません。接続を確認してください。')
      return
    }

    setSubmitting(true)
    try {
      if (farmName.trim() || location) {
        await window.HoneyDB?.saveFarm?.({
          name: farmName.trim() || '養蜂場',
          address: location?.address ?? '',
          lat: location?.lat ?? 0,
          lng: location?.lng ?? 0,
        })
      }

      if (colonyCount > 0) {
        for (let i = 0; i < colonyCount; i++) {
          const name = colonyNames[i]?.trim() || `群 ${i + 1}`
          await window.HoneyDB?.saveColony?.(genId(), name, i)
        }
      }

      onNext()
    } catch {
      setSubmitError('保存できませんでした。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <span className={styles.stepLabel}>2 / 3</span>
        <button className={styles.skipBtn} onClick={onSkip}>スキップ</button>
      </header>

      {/* ── 進行インジケーター ── */}
      <div className={styles.progress} aria-hidden>
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
        <div className={styles.progressBar} />
      </div>

      {/* ── 本文 (スクロール) ── */}
      <div className={styles.body}>
        {/* 見出し */}
        <h1 className={styles.heading}>養蜂場を設定</h1>
        <p className={styles.subheading}>すべて後から設定できます。</p>

        {/* ── 養蜂場名 ── */}
        <div className={styles.fieldGroup}>
          <label htmlFor={farmNameId} className={styles.label}>
            養蜂場名
            <span className={styles.optionalBadge}>任意</span>
          </label>
          <div className={styles.inputWrap}>
            <input
              id={farmNameId}
              type="text"
              className={`${styles.input} ${farmNameError ? styles.inputError : ''}`}
              placeholder="宮田養蜂場"
              value={farmName}
              onChange={e => { setFarmName(e.target.value); if (farmNameError) setFarmNameError('') }}
              aria-describedby={farmNameError ? farmNameErrorId : undefined}
              disabled={isSubmitting}
            />
            {farmName && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => { setFarmName(''); setFarmNameError('') }}
                aria-label="養蜂場名をクリア"
                tabIndex={-1}
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>
          {farmNameError && (
            <p id={farmNameErrorId} className={styles.fieldError} role="alert">
              {farmNameError}
            </p>
          )}
        </div>

        {/* ── 所在地 ── */}
        <div className={styles.fieldGroup}>
          <label htmlFor={locationId} className={styles.label}>
            所在地
            <span className={styles.optionalBadge}>任意</span>
          </label>
          <div className={styles.locationWrap}>
            <div className={styles.inputWrap}>
              <MapPin size={18} className={styles.locationPin} aria-hidden />
              <input
                id={locationId}
                type="text"
                className={`${styles.input} ${styles.inputWithPin}`}
                placeholder="静岡県磐田市宮田"
                value={locationQuery}
                onChange={e => handleLocationInput(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {locationQuery && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clearLocation}
                  aria-label="所在地をクリア"
                  tabIndex={-1}
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </div>

            {/* 検索結果ドロップダウン */}
            {showResults && searchResults.length > 0 && (
              <ul className={styles.resultsList} role="listbox" aria-label="所在地候補">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.resultItem}
                      role="option"
                      aria-selected={false}
                      onClick={() => selectLocation(r)}
                    >
                      <MapPin size={14} className={styles.resultPin} aria-hidden />
                      <span className={styles.resultText}>{r.address}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searching && <p className={styles.searching}>検索中…</p>}
          </div>

          {/* 地図プレビュー (所在地選択済みのみ表示) */}
          {location && (
            <div className={styles.mapPreview} aria-hidden>
              <MapPreviewSvg />
              <button
                type="button"
                className={styles.mapRecenterBtn}
                tabIndex={-1}
                aria-hidden
              >
                <Crosshair size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── 蜂群ステッパー ── */}
        <div className={styles.fieldGroup}>
          <p className={styles.label}>
            蜂群を初期登録
            <span className={styles.optionalBadge}>任意</span>
          </p>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleColonyCountChange(-1)}
              disabled={colonyCount === 0 || isSubmitting}
              aria-label="蜂群数を減らす"
            >
              <Minus size={18} aria-hidden />
            </button>
            <span className={styles.stepperCount}>{colonyCount}</span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleColonyCountChange(1)}
              disabled={isSubmitting}
              aria-label="蜂群数を増やす"
            >
              <Plus size={18} aria-hidden />
            </button>
            <span className={styles.stepperUnit}>群</span>
          </div>
        </div>

        {/* ── 巣箱ステッパー ── */}
        <div className={styles.fieldGroup}>
          <p className={styles.label}>
            巣箱数
            <span className={styles.optionalBadge}>任意</span>
          </p>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setHiveCount(c => Math.max(0, c - 1))}
              disabled={hiveCount === 0 || isSubmitting}
              aria-label="巣箱数を減らす"
            >
              <Minus size={18} aria-hidden />
            </button>
            <span className={styles.stepperCount}>{hiveCount}</span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setHiveCount(c => c + 1)}
              disabled={isSubmitting}
              aria-label="巣箱数を増やす"
            >
              <Plus size={18} aria-hidden />
            </button>
            <span className={styles.stepperUnit}>箱</span>
          </div>
        </div>

        {/* ── 蜂群名設定ボタン ── */}
        {!showColonyNames ? (
          <button
            type="button"
            className={styles.colonyNamesBtn}
            onClick={handleShowColonyNames}
            disabled={isSubmitting}
          >
            <Plus size={16} aria-hidden />
            蜂群名を設定（任意）
          </button>
        ) : (
          <div className={styles.colonyNamesExpanded}>
            <p className={styles.colonyNamesTitle}>蜂群名（任意）</p>
            {colonyCount === 0 && (
              <p className={styles.colonyNamesHint}>蜂群数を1以上に設定してください</p>
            )}
            {Array.from({ length: colonyCount }, (_, i) => (
              <div key={i} className={styles.colonyNameRow}>
                <label className={styles.colonyNameLabel}>群 {i + 1}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={`群 ${i + 1}`}
                  value={colonyNames[i] ?? ''}
                  onChange={e => {
                    const next = [...colonyNames]
                    next[i] = e.target.value
                    setColonyNames(next)
                  }}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── エラー ── */}
        {submitError && (
          <p id={submitStatusId} className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}
        {isOffline && (
          <p className={styles.submitError} role="alert">
            オフライン中です。接続を確認してから再度お試しください。
          </p>
        )}

        {/* ── フッター ── */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={isSubmitting || isOffline}
            aria-describedby={submitError ? submitStatusId : undefined}
          >
            {isSubmitting ? (
              <span className={styles.spinner} aria-hidden />
            ) : null}
            設定して次へ
          </button>
          <button
            type="button"
            className={styles.skipLink}
            onClick={onSkip}
            disabled={isSubmitting}
          >
            今は設定しない
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 地図プレビュー SVG ────────────────────────────────────────────
function MapPreviewSvg() {
  return (
    <svg
      viewBox="0 0 350 160"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.mapSvg}
      aria-hidden
    >
      {/* 背景 */}
      <rect width="350" height="160" fill="#E8EAED" />

      {/* 公園・緑地 */}
      <rect x="10" y="20" width="60" height="40" rx="4" fill="#C8DFC8" />
      <rect x="240" y="90" width="50" height="45" rx="4" fill="#C8DFC8" />

      {/* 区画 (建物ブロック) */}
      <rect x="10" y="72" width="55" height="24" rx="2" fill="#D4D6D8" />
      <rect x="10" y="100" width="35" height="22" rx="2" fill="#D4D6D8" />
      <rect x="50" y="100" width="30" height="22" rx="2" fill="#D4D6D8" />
      <rect x="90" y="20" width="40" height="28" rx="2" fill="#D4D6D8" />
      <rect x="136" y="20" width="50" height="28" rx="2" fill="#D4D6D8" />
      <rect x="90" y="55" width="32" height="20" rx="2" fill="#D4D6D8" />
      <rect x="200" y="20" width="45" height="28" rx="2" fill="#D4D6D8" />
      <rect x="255" y="20" width="40" height="28" rx="2" fill="#D4D6D8" />
      <rect x="300" y="55" width="40" height="24" rx="2" fill="#D4D6D8" />
      <rect x="300" y="84" width="40" height="20" rx="2" fill="#D4D6D8" />
      <rect x="200" y="55" width="35" height="28" rx="2" fill="#D4D6D8" />
      <rect x="136" y="90" width="50" height="26" rx="2" fill="#D4D6D8" />
      <rect x="90" y="112" width="40" height="24" rx="2" fill="#D4D6D8" />
      <rect x="136" y="122" width="35" height="22" rx="2" fill="#D4D6D8" />
      <rect x="10" y="128" width="70" height="22" rx="2" fill="#D4D6D8" />

      {/* 道路 (横) */}
      <rect x="0" y="10" width="350" height="8" fill="#F8F8F8" />
      <rect x="0" y="66" width="350" height="7" fill="#F8F8F8" />
      <rect x="0" y="106" width="350" height="7" fill="#F8F8F8" />
      <rect x="0" y="146" width="350" height="8" fill="#F8F8F8" />

      {/* 道路 (縦) */}
      <rect x="0" y="0" width="8" height="160" fill="#F8F8F8" />
      <rect x="80" y="0" width="8" height="160" fill="#F8F8F8" />
      <rect x="128" y="0" width="7" height="160" fill="#F8F8F8" />
      <rect x="190" y="0" width="8" height="160" fill="#F8F8F8" />
      <rect x="250" y="0" width="7" height="160" fill="#F8F8F8" />
      <rect x="298" y="0" width="7" height="160" fill="#F8F8F8" />
      <rect x="342" y="0" width="8" height="160" fill="#F8F8F8" />

      {/* 青いクラスタマーカー (左上) */}
      <circle cx="36" cy="36" r="12" fill="#2563EB" />
      <text x="36" y="40" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">2</text>

      {/* アンバーのピン (中央) */}
      <g transform="translate(175, 62)">
        <path
          d="M0-22C-8-22-14-16-14-8c0 11 14 30 14 30S14 3 14-8C14-16 8-22 0-22z"
          fill="#E39A16"
          stroke="#C07800"
          strokeWidth="1"
        />
        <circle cx="0" cy="-8" r="5" fill="#fff" />
      </g>
    </svg>
  )
}
