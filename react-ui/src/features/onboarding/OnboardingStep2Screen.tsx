import { useState, useRef, useCallback, useId } from 'react'
import { ChevronLeft, MapPin, X, Plus, Minus, Crosshair, AlertTriangle, WifiOff } from 'lucide-react'
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

const PRESET_LOCATION: GeoResult = {
  address: '静岡県磐田市宮田',
  lat: 34.7156,
  lng: 137.852,
}

const COLONY_MAX = 20
const HIVE_MAX = 100

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function OnboardingStep2Screen({ viewState = 'normal', onBack, onNext, onSkip }: Props) {
  const farmNameId    = useId()
  const locationId    = useId()
  const farmErrId     = useId()
  const submitStatusId = useId()

  const isPrefilled =
    viewState === 'filled' ||
    viewState === 'location-selected' ||
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'

  const hasLocation =
    viewState === 'location-selected' ||
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'

  const hasQuantity =
    viewState === 'quantity-adjusted' ||
    viewState === 'colony-names-expanded' ||
    viewState === 'submitting' ||
    viewState === 'error'

  const [farmName, setFarmName]           = useState(() => isPrefilled ? '宮田養蜂場' : '')
  const [locationQuery, setLocationQuery] = useState(() => hasLocation ? PRESET_LOCATION.address : '')
  const [location, setLocation]           = useState<GeoResult | null>(() => hasLocation ? PRESET_LOCATION : null)
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searching, setSearching]         = useState(false)
  const [showResults, setShowResults]     = useState(false)

  const [colonyCount, setColonyCount] = useState(() => hasQuantity ? 3 : 0)
  const [hiveCount, setHiveCount]     = useState(() => hasQuantity ? 5 : 0)
  const [showColonyNames, setShowColonyNames] = useState(viewState === 'colony-names-expanded')
  const [colonyNames, setColonyNames] = useState<string[]>(() =>
    Array.from({ length: viewState === 'colony-names-expanded' ? 3 : 0 }, () => ''),
  )

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState(() =>
    viewState === 'error' ? '保存できませんでした。もう一度お試しください。' : '',
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
        const res  = await fetch(url, { headers: { 'Accept-Language': 'ja' } })
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

  function handleColonyCountChange(delta: number) {
    const next = Math.max(0, Math.min(COLONY_MAX, colonyCount + delta))
    setColonyCount(next)
    if (showColonyNames) {
      setColonyNames(prev => Array.from({ length: next }, (_, i) => prev[i] ?? ''))
    }
    if (next === 0) setFarmNameError('')
  }

  function handleShowColonyNames() {
    setShowColonyNames(true)
    setColonyNames(prev => Array.from({ length: colonyCount }, (_, i) => prev[i] ?? ''))
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSave() {
    if (isSubmitting || isOffline) return
    setSubmitError('')

    if (colonyCount > 0 && !farmName.trim()) {
      setFarmNameError('蜂群を登録するには養蜂場名を入力してください')
      return
    }
    setFarmNameError('')

    const hasData = farmName.trim() || location || colonyCount > 0 || hiveCount > 0
    if (!hasData) { onNext(); return }

    if (!navigator.onLine) {
      setSubmitError('オフラインのため保存できません。接続を確認してください。')
      return
    }

    setSubmitting(true)
    try {
      if (farmName.trim() || location) {
        await window.HoneyDB?.saveFarm?.({
          name:    farmName.trim() || '養蜂場',
          address: location?.address ?? '',
          lat:     location?.lat ?? 0,
          lng:     location?.lng ?? 0,
        })
      }
      if (colonyCount > 0) {
        for (let i = 0; i < colonyCount; i++) {
          await window.HoneyDB?.saveColony?.(genId(), colonyNames[i]?.trim() || `群 ${i + 1}`, i)
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

      {/* ── オフライン / エラーバナー (ヘッダー直下) ── */}
      {isOffline && (
        <div className={`${styles.banner} ${styles.bannerOffline}`} role="alert">
          <WifiOff size={16} className={styles.bannerIcon} aria-hidden />
          <span>オフライン中です。接続を確認してから再度お試しください。</span>
        </div>
      )}
      {submitError && !isOffline && (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert" id={submitStatusId}>
          <AlertTriangle size={16} className={styles.bannerIcon} aria-hidden />
          <span>{submitError}</span>
        </div>
      )}

      {/* ── 本文 (スクロール) ── */}
      <div className={styles.body}>
        {/* 見出し */}
        <h1 className={styles.heading}>養蜂場を設定</h1>
        <p className={styles.subheading}>すべて後から設定できます。</p>

        {/* ── 養蜂場名 ── */}
        <div className={styles.fieldBlock}>
          <label htmlFor={farmNameId} className={styles.fieldLabel}>
            養蜂場名<span className={styles.optionalText}>（任意）</span>
          </label>
          <div className={styles.inputWrap}>
            <input
              id={farmNameId}
              type="text"
              className={`${styles.input} ${farmNameError ? styles.inputError : ''}`}
              placeholder="宮田養蜂場"
              value={farmName}
              onChange={e => { setFarmName(e.target.value); if (farmNameError) setFarmNameError('') }}
              aria-describedby={farmNameError ? farmErrId : undefined}
              disabled={isSubmitting}
            />
            {farmName && (
              <button type="button" className={styles.clearBtn} onClick={() => { setFarmName(''); setFarmNameError('') }} aria-label="養蜂場名をクリア" tabIndex={-1}>
                <X size={16} aria-hidden />
              </button>
            )}
          </div>
          {farmNameError && (
            <p id={farmErrId} className={styles.fieldError} role="alert">{farmNameError}</p>
          )}
        </div>

        {/* ── 所在地 ── */}
        <div className={styles.fieldBlock}>
          <label htmlFor={locationId} className={styles.fieldLabel}>
            所在地<span className={styles.optionalText}>（任意）</span>
          </label>
          <div className={styles.inputWrap}>
            <MapPin size={16} className={styles.inputPrefixIcon} aria-hidden />
            <input
              id={locationId}
              type="text"
              className={`${styles.input} ${styles.inputWithIcon}`}
              placeholder="静岡県磐田市宮田"
              value={locationQuery}
              onChange={e => handleLocationInput(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {locationQuery && (
              <button type="button" className={styles.clearBtn} onClick={clearLocation} aria-label="所在地をクリア" tabIndex={-1}>
                <X size={16} aria-hidden />
              </button>
            )}
          </div>

          {/* 検索候補 */}
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
                    <MapPin size={14} className={styles.resultIcon} aria-hidden />
                    <span>{r.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searching && <p className={styles.searchingText}>検索中…</p>}

          {/* 地図プレビュー */}
          {location && (
            <div className={styles.mapWrap} aria-hidden>
              <MapPreviewSvg />
              <button
                type="button"
                className={styles.mapRecenterBtn}
                tabIndex={-1}
                aria-hidden
              >
                <Crosshair size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ── ステッパー行: 蜂群 ── */}
        <div className={styles.stepperRow}>
          <span className={styles.stepperLabel}>
            蜂群を初期登録<span className={styles.optionalText}>（任意）</span>
          </span>
          <div className={styles.stepperControls}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleColonyCountChange(-1)}
              disabled={colonyCount === 0 || isSubmitting}
              aria-label="蜂群数を減らす"
            >
              <Minus size={16} aria-hidden />
            </button>
            <span className={styles.stepperValue}>{colonyCount}</span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleColonyCountChange(1)}
              disabled={colonyCount >= COLONY_MAX || isSubmitting}
              aria-label="蜂群数を増やす"
            >
              <Plus size={16} aria-hidden />
            </button>
            <span className={styles.stepperUnit}>群</span>
          </div>
        </div>

        {/* ── ステッパー行: 巣箱 ── */}
        <div className={styles.stepperRow}>
          <span className={styles.stepperLabel}>
            巣箱数<span className={styles.optionalText}>（任意）</span>
          </span>
          <div className={styles.stepperControls}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setHiveCount(c => Math.max(0, c - 1))}
              disabled={hiveCount === 0 || isSubmitting}
              aria-label="巣箱数を減らす"
            >
              <Minus size={16} aria-hidden />
            </button>
            <span className={styles.stepperValue}>{hiveCount}</span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setHiveCount(c => Math.min(HIVE_MAX, c + 1))}
              disabled={hiveCount >= HIVE_MAX || isSubmitting}
              aria-label="巣箱数を増やす"
            >
              <Plus size={16} aria-hidden />
            </button>
            <span className={styles.stepperUnit}>箱</span>
          </div>
        </div>

        {/* ── 蜂群名設定 ── */}
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
          <div className={styles.colonyNamesBlock}>
            <p className={styles.colonyNamesTitle}>蜂群名（任意）</p>
            {colonyCount === 0 && (
              <p className={styles.colonyNamesHint}>蜂群数を1以上に設定してください</p>
            )}
            {Array.from({ length: colonyCount }, (_, i) => (
              <div key={i} className={styles.colonyNameRow}>
                <label className={styles.colonyNameIndex}>群 {i + 1}</label>
                <div className={styles.inputWrap} style={{ flex: 1 }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`群 ${i + 1}`}
                    value={colonyNames[i] ?? ''}
                    onChange={e => {
                      const next = [...colonyNames]; next[i] = e.target.value; setColonyNames(next)
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
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
            {isSubmitting
              ? <span className={styles.spinner} aria-hidden />
              : null}
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
      viewBox="0 0 350 140"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.mapSvg}
      aria-hidden
    >
      {/* 背景 */}
      <rect width="350" height="140" fill="#E8EAED" />

      {/* 緑地 */}
      <rect x="10" y="15" width="55" height="36" rx="4" fill="#C8DFC8" />
      <rect x="245" y="80" width="48" height="38" rx="4" fill="#C8DFC8" />

      {/* 建物ブロック */}
      <rect x="10" y="60" width="52" height="22" rx="2" fill="#D4D6D8" />
      <rect x="10" y="87" width="32" height="20" rx="2" fill="#D4D6D8" />
      <rect x="47" y="87" width="28" height="20" rx="2" fill="#D4D6D8" />
      <rect x="88" y="15" width="38" height="24" rx="2" fill="#D4D6D8" />
      <rect x="132" y="15" width="48" height="24" rx="2" fill="#D4D6D8" />
      <rect x="88" y="46" width="30" height="18" rx="2" fill="#D4D6D8" />
      <rect x="196" y="15" width="42" height="24" rx="2" fill="#D4D6D8" />
      <rect x="248" y="15" width="38" height="24" rx="2" fill="#D4D6D8" />
      <rect x="298" y="46" width="38" height="22" rx="2" fill="#D4D6D8" />
      <rect x="298" y="73" width="38" height="18" rx="2" fill="#D4D6D8" />
      <rect x="196" y="46" width="33" height="26" rx="2" fill="#D4D6D8" />
      <rect x="134" y="80" width="48" height="24" rx="2" fill="#D4D6D8" />
      <rect x="88" y="100" width="38" height="22" rx="2" fill="#D4D6D8" />
      <rect x="10" y="113" width="66" height="20" rx="2" fill="#D4D6D8" />

      {/* 道路 横 */}
      <rect x="0" y="6" width="350" height="7" fill="#F5F5F5" />
      <rect x="0" y="56" width="350" height="7" fill="#F5F5F5" />
      <rect x="0" y="94" width="350" height="7" fill="#F5F5F5" />
      <rect x="0" y="130" width="350" height="7" fill="#F5F5F5" />

      {/* 道路 縦 */}
      <rect x="0"   y="0" width="7"  height="140" fill="#F5F5F5" />
      <rect x="78"  y="0" width="7"  height="140" fill="#F5F5F5" />
      <rect x="126" y="0" width="6"  height="140" fill="#F5F5F5" />
      <rect x="186" y="0" width="7"  height="140" fill="#F5F5F5" />
      <rect x="244" y="0" width="6"  height="140" fill="#F5F5F5" />
      <rect x="294" y="0" width="6"  height="140" fill="#F5F5F5" />
      <rect x="344" y="0" width="6"  height="140" fill="#F5F5F5" />

      {/* 青クラスタ (左上) */}
      <circle cx="34" cy="32" r="12" fill="#2563EB" />
      <text x="34" y="36" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">2</text>

      {/* アンバーピン (中央やや右) */}
      <g transform="translate(175, 55)">
        <path d="M0-20C-7-20-13-14-13-7c0 10 13 27 13 27S13 3 13-7C13-14 7-20 0-20z" fill="#E39A16" stroke="#C07800" strokeWidth="1" />
        <circle cx="0" cy="-7" r="5" fill="#fff" />
      </g>
    </svg>
  )
}
