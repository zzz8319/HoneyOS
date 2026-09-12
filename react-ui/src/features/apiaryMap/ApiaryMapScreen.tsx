import { useState, useCallback } from 'react'
import {
  ArrowLeft, Search, List, MapPin, Flower2,
  AlertTriangle, Navigation, Car, Route as RouteIcon, X,
} from 'lucide-react'
import { BottomNav } from '../../components'
import type { Apiary, ApiaryMapViewState, LayerType } from './types'
import { MOCK_APIARIES, MOCK_NECTAR_SOURCES } from './mockData'
import styles from './ApiaryMapScreen.module.css'

export type { ApiaryMapViewState }

// ── SVG Map Background ────────────────────────────────────────────────────────
function MapBackground() {
  return (
    <svg
      viewBox="0 0 390 500"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Land base */}
      <rect width="390" height="500" fill="#EDE8D8" />

      {/* Mountain/forest north-west */}
      <path d="M0,0 L160,0 L160,130 Q110,155 0,175 Z" fill="#C4D9A8" />
      {/* Mountain/forest north-east */}
      <path d="M250,0 L390,0 L390,150 Q340,130 290,110 Q265,100 250,72 Z" fill="#C4D9A8" />

      {/* Small reservoir / pond */}
      <ellipse cx="308" cy="178" rx="16" ry="9" fill="#8EC0D8" />

      {/* Tenryu River — main */}
      <path d="M296,0 Q302,85 297,165 Q292,245 290,325 Q288,385 286,440"
        stroke="#8EC0D8" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* River widens near ocean */}
      <path d="M286,440 Q284,465 282,492"
        stroke="#8EC0D8" strokeWidth="14" fill="none" strokeLinecap="round" />

      {/* Tributary from NW */}
      <path d="M120,0 Q126,62 142,122 Q158,165 182,198"
        stroke="#A8CCD8" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Enshu-nada (Pacific Ocean) */}
      <path d="M0,418 Q97,398 195,412 Q292,426 390,415 L390,500 L0,500 Z" fill="#8EC0D8" />

      {/* Ocean wave lines */}
      <path d="M18,440 Q48,435 78,440" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M96,452 Q136,447 176,452" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M198,442 Q238,437 278,442" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M306,454 Q336,449 366,454" stroke="#7BACC8" strokeWidth="1.5" fill="none" />

      {/* E1 Expressway */}
      <path d="M0,263 Q98,253 198,258 Q298,263 390,254"
        stroke="#CACACA" strokeWidth="3.5" fill="none" />
      <path d="M0,263 Q98,253 198,258 Q298,263 390,254"
        stroke="white" strokeWidth="1" fill="none" strokeDasharray="12,8" />

      {/* National Route 1 */}
      <path d="M0,298 Q98,290 198,294 Q294,298 390,290"
        stroke="#BCBCBC" strokeWidth="2.5" fill="none" />

      {/* Local roads */}
      <line x1="78"  y1="198" x2="78"  y2="318" stroke="#D0CCC0" strokeWidth="1.5" />
      <line x1="178" y1="178" x2="178" y2="338" stroke="#D0CCC0" strokeWidth="1.5" />
      <line x1="0"   y1="228" x2="200" y2="228" stroke="#D0CCC0" strokeWidth="1.5" />
      <line x1="200" y1="198" x2="290" y2="198" stroke="#D0CCC0" strokeWidth="1.5" />
      <line x1="348" y1="158" x2="348" y2="298" stroke="#D0CCC0" strokeWidth="1.5" />
      <line x1="290" y1="238" x2="390" y2="238" stroke="#D0CCC0" strokeWidth="1.5" />

      {/* City labels */}
      <text x="42"  y="252" fontSize="12" fill="#66707A" fontFamily="sans-serif" fontWeight="500">掛川市</text>
      <text x="146" y="226" fontSize="12" fill="#66707A" fontFamily="sans-serif" fontWeight="500">袋井市</text>
      <text x="212" y="276" fontSize="12" fill="#66707A" fontFamily="sans-serif" fontWeight="500">磐田市</text>
      <text x="328" y="228" fontSize="12" fill="#66707A" fontFamily="sans-serif" fontWeight="500">浜松市</text>

      {/* Ocean label */}
      <text x="44"  y="460" fontSize="11" fill="#5A90A8" fontFamily="sans-serif">遠州灘</text>

      {/* River label */}
      <text x="302" y="322" fontSize="10" fill="#5A90A8" fontFamily="sans-serif"
        transform="rotate(-85 302 322)">天竜川</text>
    </svg>
  )
}

// ── Apiary Pin Marker ─────────────────────────────────────────────────────────
interface ApiaryPinProps {
  apiary: Apiary
  selected: boolean
  onClick: () => void
}
function ApiaryPinMarker({ apiary, selected, onClick }: ApiaryPinProps) {
  const pinColor = selected ? '#E39A16' : apiary.pinColor
  return (
    <button
      className={`${styles.markerBtn} ${selected ? styles.markerBtnSelected : ''}`}
      style={{ left: `${apiary.x}%`, top: `${apiary.y}%` }}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${apiary.name}（${apiary.colonyCount}群）${selected ? '選択中' : ''}`}
      type="button"
    >
      <svg width="38" height="48" viewBox="0 0 38 48" fill="none" aria-hidden="true">
        <filter id={`shadow-${apiary.id}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
        <path
          d="M19 2C10.163 2 3 9.163 3 18C3 30 19 46 19 46C19 46 35 30 35 18C35 9.163 27.837 2 19 2Z"
          fill={pinColor}
          filter={`url(#shadow-${apiary.id})`}
        />
        <circle cx="19" cy="18" r="10.5" fill="white" />
        <text
          x="19" y="21.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill={pinColor}
          fontFamily="sans-serif"
        >
          {apiary.colonyCount}群
        </text>
      </svg>
      <span className={`${styles.markerLabel} ${selected ? styles.markerLabelSelected : ''}`}>
        {apiary.name}
      </span>
    </button>
  )
}

// ── Flower (Nectar Source) Marker ─────────────────────────────────────────────
function FlowerMarker({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <div className={styles.flowerMarker} style={{ left: `${x}%`, top: `${y}%` }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* 8 petals */}
        <ellipse cx="16" cy="7"  rx="4"   ry="6"   fill="#2D6A4F" opacity="0.88" />
        <ellipse cx="25" cy="16" rx="6"   ry="4"   fill="#2D6A4F" opacity="0.88" />
        <ellipse cx="16" cy="25" rx="4"   ry="6"   fill="#2D6A4F" opacity="0.88" />
        <ellipse cx="7"  cy="16" rx="6"   ry="4"   fill="#2D6A4F" opacity="0.88" />
        <ellipse cx="22" cy="10" rx="3.2" ry="4.8" fill="#2D6A4F" opacity="0.78" transform="rotate(45 22 10)" />
        <ellipse cx="22" cy="22" rx="3.2" ry="4.8" fill="#2D6A4F" opacity="0.78" transform="rotate(-45 22 22)" />
        <ellipse cx="10" cy="22" rx="3.2" ry="4.8" fill="#2D6A4F" opacity="0.78" transform="rotate(45 10 22)" />
        <ellipse cx="10" cy="10" rx="3.2" ry="4.8" fill="#2D6A4F" opacity="0.78" transform="rotate(-45 10 10)" />
        {/* Center disc */}
        <circle cx="16" cy="16" r="5.5" fill="#E39A16" />
        <circle cx="16" cy="16" r="2.5" fill="#FFF3D8" />
      </svg>
      <span className={styles.flowerLabel}>{name}</span>
    </div>
  )
}

// ── Alert Marker ──────────────────────────────────────────────────────────────
function AlertMarker({ apiary }: { apiary: Apiary }) {
  return (
    <div className={styles.alertMarker} style={{ left: `${apiary.x}%`, top: `${apiary.y}%` }}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <circle cx="17" cy="17" r="15" fill="#DC2626" />
        <rect x="15.5" y="10" width="3" height="10" rx="1.5" fill="white" />
        <circle cx="17" cy="24.5" r="2" fill="white" />
      </svg>
      <span className={styles.alertMarkerLabel}>{apiary.name}</span>
    </div>
  )
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
interface BottomSheetProps {
  apiary: Apiary
  onClose: () => void
  onViewList: () => void
  onRoute: () => void
}
function ApiaryBottomSheet({ apiary, onClose, onViewList, onRoute }: BottomSheetProps) {
  return (
    <div className={styles.bottomSheet} role="dialog" aria-label={`${apiary.name}の詳細`}>
      <div className={styles.dragHandle} aria-hidden />
      <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="閉じる">
        <X size={16} aria-hidden />
      </button>

      <div className={styles.sheetContent}>
        <div className={styles.sheetTop}>
          {/* Large orange pin */}
          <div className={styles.sheetPinIcon} aria-hidden>
            <svg width="38" height="48" viewBox="0 0 38 48" fill="none">
              <path
                d="M19 2C10.163 2 3 9.163 3 18C3 30 19 46 19 46C19 46 35 30 35 18C35 9.163 27.837 2 19 2Z"
                fill="#E39A16"
              />
              <circle cx="19" cy="18" r="9" fill="white" />
            </svg>
          </div>

          <div className={styles.sheetInfo}>
            <h2 className={styles.sheetName}>{apiary.name}</h2>
            <p className={styles.sheetLocation}>{apiary.prefecture}{apiary.city}</p>
            <div className={styles.sheetCounts}>
              <span className={styles.sheetColonyCount}>{apiary.colonyCount}群</span>
              {apiary.alertCount > 0 && (
                <span className={styles.sheetAlertCount}>注意 {apiary.alertCount}群</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sheetDistance}>
          <Car size={15} className={styles.carIcon} aria-hidden />
          <span>現在地から {apiary.distanceKm}km</span>
        </div>

        <div className={styles.sheetBtns}>
          <button className={styles.listBtn} type="button" onClick={onViewList}>
            一覧を見る
          </button>
          <button className={styles.routeBtn} type="button" onClick={onRoute}>
            <RouteIcon size={16} aria-hidden />
            経路
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Route Fallback Dialog ─────────────────────────────────────────────────────
function RouteFallbackDialog({ apiary, onClose }: { apiary: Apiary; onClose: () => void }) {
  return (
    <div className={styles.routeFallback} role="dialog" aria-label="経路情報">
      <div className={styles.routeFallbackHeader}>
        <span className={styles.routeFallbackTitle}>経路情報</span>
        <button className={styles.routeFallbackClose} onClick={onClose} type="button" aria-label="閉じる">
          <X size={16} aria-hidden />
        </button>
      </div>
      <p className={styles.routeFallbackName}>{apiary.name}</p>
      <p className={styles.routeFallbackAddr}>{apiary.prefecture}{apiary.city}</p>
      <p className={styles.routeFallbackDist}>現在地から {apiary.distanceKm}km</p>
      <p className={styles.routeFallbackNote}>
        地図アプリが利用できない環境です。上記住所を地図アプリに入力してご確認ください。
      </p>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
interface Props {
  viewState?: ApiaryMapViewState
  onBack?: () => void
  onViewColonyList?: (apiaryId: string) => void
}

export function ApiaryMapScreen({ viewState = 'normal', onBack, onViewColonyList }: Props) {
  const [layer, setLayer] = useState<LayerType>(() => {
    if (viewState === 'nectar') return 'nectar'
    if (viewState === 'alert')  return 'alert'
    return 'apiary'
  })
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (viewState === 'normal')       return 'miyata'
    if (viewState === 'other-apiary') return 'kawahigashi'
    return null
  })
  const [searchQuery, setSearchQuery] = useState(() =>
    viewState === 'no-results' ? '存在しない場所' : '',
  )
  const [showLocationMsg, setShowLocationMsg] = useState(viewState === 'no-location')
  const [showRouteFallback, setShowRouteFallback] = useState(false)

  const isLoading = viewState === 'loading'
  const isError   = viewState === 'error'
  const isOffline = viewState === 'offline'

  const selectedApiary = MOCK_APIARIES.find(a => a.id === selectedId) ?? null

  const filteredApiaries = (() => {
    if (!searchQuery) return MOCK_APIARIES
    const q = searchQuery
    return MOCK_APIARIES.filter(a => a.name.includes(q) || a.city.includes(q) || a.prefecture.includes(q))
  })()

  const handleLocationBtn = useCallback(() => {
    if (viewState === 'no-location') {
      setShowLocationMsg(true)
    } else {
      setShowLocationMsg(false)
    }
  }, [viewState])

  const handleRoute = useCallback(() => {
    if (!selectedApiary) return
    const query = encodeURIComponent(`${selectedApiary.prefecture}${selectedApiary.city} ${selectedApiary.name}`)
    const mapsUrl = `https://maps.google.com/maps?q=${query}`
    const ref = window.open(mapsUrl, '_blank', 'noopener,noreferrer')
    if (!ref) {
      setShowRouteFallback(true)
    }
  }, [selectedApiary])

  const sheetOpen = Boolean(selectedApiary && layer === 'apiary')

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.headerBtn} onClick={onBack} type="button" aria-label="戻る">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <h1 className={styles.headerTitle}>養蜂場マップ</h1>
        <button className={styles.headerBtn} type="button" aria-label="リスト表示">
          <List size={20} aria-hidden />
        </button>
      </header>

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          オフラインです。キャッシュ済みの地図・養蜂場を表示しています。
        </div>
      )}

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} aria-hidden />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="養蜂場・場所を検索"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="養蜂場・場所を検索"
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              type="button"
              aria-label="検索をクリア"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Layer switcher */}
      <div className={styles.layerBar} role="group" aria-label="表示レイヤー切替">
        {(
          [
            { id: 'apiary' as LayerType, label: '養蜂場', Icon: MapPin },
            { id: 'nectar' as LayerType, label: '蜜源',   Icon: Flower2 },
            { id: 'alert'  as LayerType, label: '要注意', Icon: AlertTriangle },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`${styles.layerBtn} ${layer === id ? styles.layerBtnActive : ''}`}
            onClick={() => { setLayer(id); setSelectedId(null) }}
            type="button"
            aria-pressed={layer === id}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Map area */}
      <div className={styles.mapWrapper}>

        {/* Map background */}
        {!isLoading && !isError && (
          <div className={styles.mapBg}>
            <MapBackground />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className={styles.mapState}>
            <div className={styles.spinner} aria-label="読み込み中" role="status" />
            <p className={styles.stateText}>地図・養蜂場データを読み込んでいます…</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className={styles.mapState}>
            <AlertTriangle size={40} className={styles.errorIcon} aria-hidden />
            <p className={styles.stateText}>地図データを取得できませんでした</p>
            <button className={styles.retryBtn} type="button" onClick={() => {}}>
              再試行
            </button>
          </div>
        )}

        {/* No results banner */}
        {!isLoading && !isError && filteredApiaries.length === 0 && layer === 'apiary' && (
          <div className={styles.noResultsBanner} role="status">
            「{searchQuery}」に一致する養蜂場が見つかりませんでした
          </div>
        )}

        {/* Apiary markers */}
        {!isLoading && !isError && layer === 'apiary' &&
          filteredApiaries.map(apiary => (
            <ApiaryPinMarker
              key={apiary.id}
              apiary={apiary}
              selected={selectedId === apiary.id}
              onClick={() => setSelectedId(prev => prev === apiary.id ? null : apiary.id)}
            />
          ))
        }

        {/* Nectar source markers */}
        {!isLoading && !isError && layer === 'nectar' &&
          MOCK_NECTAR_SOURCES.map(src => (
            <FlowerMarker key={src.id} name={src.name} x={src.x} y={src.y} />
          ))
        }

        {/* Alert markers */}
        {!isLoading && !isError && layer === 'alert' &&
          MOCK_APIARIES.filter(a => a.alertCount > 0).map(apiary => (
            <AlertMarker key={apiary.id} apiary={apiary} />
          ))
        }

        {/* Current location button */}
        {!isLoading && !isError && (
          <button
            className={`${styles.locationBtn} ${sheetOpen ? styles.locationBtnUp : ''}`}
            type="button"
            aria-label="現在地へ戻る"
            onClick={handleLocationBtn}
          >
            <Navigation size={18} aria-hidden />
          </button>
        )}

        {/* No-location message */}
        {showLocationMsg && (
          <div className={`${styles.locationMsg} ${sheetOpen ? styles.locationMsgUp : ''}`} role="alert">
            <button
              className={styles.locationMsgClose}
              onClick={() => setShowLocationMsg(false)}
              type="button"
              aria-label="閉じる"
            >
              <X size={14} aria-hidden />
            </button>
            位置情報が利用できません。端末の設定から位置情報を許可してください。
          </div>
        )}

        {/* Route fallback overlay */}
        {showRouteFallback && selectedApiary && (
          <RouteFallbackDialog
            apiary={selectedApiary}
            onClose={() => setShowRouteFallback(false)}
          />
        )}

        {/* Bottom sheet */}
        {sheetOpen && selectedApiary && (
          <ApiaryBottomSheet
            apiary={selectedApiary}
            onClose={() => setSelectedId(null)}
            onViewList={() => onViewColonyList?.(selectedApiary.id)}
            onRoute={handleRoute}
          />
        )}
      </div>

      {/* Bottom nav — always visible, not inside mapWrapper */}
      <BottomNav activeTab="farms" onTabChange={() => {}} />
    </div>
  )
}
