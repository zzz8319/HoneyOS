import { useState, useCallback } from 'react'
import {
  ArrowLeft, Search, MapPin, Flower2,
  AlertTriangle, Car, Route as RouteIcon, X, AlignJustify,
} from 'lucide-react'
import { BottomNav } from '../../components'
import { HiveBeeMark } from '../../components/icons'
import type { Apiary, ApiaryMapViewState, LayerType } from './types'
import { MOCK_APIARIES, MOCK_NECTAR_SOURCES } from './mockData'
import styles from './ApiaryMapScreen.module.css'

export type { ApiaryMapViewState }

// ── SVG Map Background ────────────────────────────────────────────────────────
function MapBackground() {
  return (
    <svg
      viewBox="0 0 390 560"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Land base — light beige */}
      <rect width="390" height="560" fill="#EDE8D8" />

      {/* Northern mountain/forest — NW block */}
      <path d="M0,0 L0,200 Q30,185 60,170 Q85,158 110,145 Q140,130 165,118 Q165,80 155,40 Q140,10 100,0 Z" fill="#C8D9A4" />
      {/* NE forest block */}
      <path d="M250,0 L390,0 L390,165 Q370,155 350,142 Q325,128 305,118 Q285,106 268,95 Q258,60 255,30 Z" fill="#C8D9A4" />
      {/* Small mid-west forest patch */}
      <path d="M0,220 Q15,210 35,205 Q60,200 75,210 Q80,230 65,242 Q40,248 10,240 Z" fill="#C8D9A4" opacity="0.7" />

      {/* Tenryu River — main course, curves south */}
      <path
        d="M295,0 Q300,40 299,80 Q298,130 296,180 Q293,235 291,280 Q289,330 287,375 Q285,415 283,455 Q281,490 280,520"
        stroke="#8EC0D8" strokeWidth="10" fill="none" strokeLinecap="round"
      />
      {/* River widens to estuary */}
      <path
        d="M280,520 Q278,540 276,560"
        stroke="#8EC0D8" strokeWidth="16" fill="none" strokeLinecap="round"
      />
      {/* Small reservoir near Hamamatsu */}
      <ellipse cx="315" cy="195" rx="14" ry="8" fill="#8EC0D8" />

      {/* Tributary from NW */}
      <path
        d="M118,0 Q124,50 135,100 Q148,152 168,198 Q180,218 188,230"
        stroke="#A8CCD8" strokeWidth="4" fill="none" strokeLinecap="round"
      />

      {/* Enshu-nada (Pacific) */}
      <path d="M0,465 Q65,450 130,458 Q195,466 260,458 Q325,450 390,462 L390,560 L0,560 Z" fill="#8EC0D8" />
      {/* Ocean wave textures */}
      <path d="M15,488 Q45,483 75,488" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M95,502 Q135,497 175,502" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M195,490 Q235,485 275,490" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M300,505 Q330,500 360,505" stroke="#7BACC8" strokeWidth="1.5" fill="none" />

      {/* E1 Tomei Expressway — main dual carriageway */}
      <path
        d="M0,285 Q50,278 100,276 Q155,274 200,276 Q250,278 300,280 Q345,282 390,278"
        stroke="#B0B0B0" strokeWidth="4" fill="none"
      />
      <path
        d="M0,285 Q50,278 100,276 Q155,274 200,276 Q250,278 300,280 Q345,282 390,278"
        stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="14,9"
      />

      {/* Route 1 — national highway */}
      <path
        d="M0,318 Q50,312 100,310 Q155,308 200,310 Q255,312 300,314 Q345,316 390,312"
        stroke="#C4C4C0" strokeWidth="2.5" fill="none"
      />

      {/* Route 150 along coast */}
      <path
        d="M0,428 Q65,418 130,425 Q195,432 260,425 Q320,418 390,428"
        stroke="#C8C8C4" strokeWidth="2" fill="none"
      />

      {/* N-S local roads */}
      <path d="M75,195 Q76,250 78,310 Q79,360 80,400" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M178,175 Q179,240 180,300 Q181,355 182,410" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M345,160 Q346,225 347,290 Q348,340 348,400" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />

      {/* E-W local roads */}
      <path d="M0,245 Q90,242 178,245" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M200,210 Q240,208 290,210" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M292,255 Q320,253 390,255" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M0,355 Q80,352 175,355" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M200,345 Q245,342 290,345" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />
      <path d="M295,320 Q335,318 390,318" stroke="#D4D0C8" strokeWidth="1.5" fill="none" />

      {/* Crossing connectors */}
      <path d="M75,310 Q125,310 178,310" stroke="#D4D0C8" strokeWidth="1.2" fill="none" />
      <path d="M75,355 Q125,355 178,355" stroke="#D4D0C8" strokeWidth="1.2" fill="none" />

      {/* City labels — positioned to avoid pin overlap */}
      <text x="30"  y="278" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">掛川市</text>
      <text x="145" y="255" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">袋井市</text>
      <text x="208" y="302" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">磐田市</text>
      <text x="332" y="255" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">浜松市</text>

      {/* Ocean label */}
      <text x="40" y="520" fontSize="11" fill="#5A90A8" fontFamily="sans-serif">遠州灘</text>
      {/* River label */}
      <text x="300" y="360" fontSize="10" fill="#5A90A8" fontFamily="sans-serif"
        transform="rotate(-88 300 360)">天竜川</text>
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
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" aria-hidden="true">
        <filter id={`shadow-${apiary.id}`} x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.22" />
        </filter>
        <path
          d="M18 2C9.716 2 3 8.716 3 17C3 28 18 44 18 44C18 44 33 28 33 17C33 8.716 26.284 2 18 2Z"
          fill={pinColor}
          filter={`url(#shadow-${apiary.id})`}
        />
        <circle cx="18" cy="17" r="9.5" fill="white" />
      </svg>
      {/* Two-line label: name + colony count */}
      <span className={`${styles.markerLabel} ${selected ? styles.markerLabelSelected : ''}`}>
        <span className={styles.markerLabelName}>{apiary.name.replace('養蜂場', '')}</span>
        <span className={styles.markerLabelCount} style={{ color: selected ? '#E39A16' : apiary.pinColor }}>
          {apiary.colonyCount}群
        </span>
      </span>
    </button>
  )
}

// ── Flower (Nectar Source) Marker ─────────────────────────────────────────────
function FlowerMarker({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <div className={styles.flowerMarker} style={{ left: `${x}%`, top: `${y}%` }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <ellipse cx="14" cy="6"  rx="3.5" ry="5.5" fill="#2D6A4F" opacity="0.85" />
        <ellipse cx="22" cy="14" rx="5.5" ry="3.5" fill="#2D6A4F" opacity="0.85" />
        <ellipse cx="14" cy="22" rx="3.5" ry="5.5" fill="#2D6A4F" opacity="0.85" />
        <ellipse cx="6"  cy="14" rx="5.5" ry="3.5" fill="#2D6A4F" opacity="0.85" />
        <ellipse cx="20" cy="8"  rx="2.8" ry="4.2" fill="#2D6A4F" opacity="0.72" transform="rotate(45 20 8)" />
        <ellipse cx="20" cy="20" rx="2.8" ry="4.2" fill="#2D6A4F" opacity="0.72" transform="rotate(-45 20 20)" />
        <ellipse cx="8"  cy="20" rx="2.8" ry="4.2" fill="#2D6A4F" opacity="0.72" transform="rotate(45 8 20)" />
        <ellipse cx="8"  cy="8"  rx="2.8" ry="4.2" fill="#2D6A4F" opacity="0.72" transform="rotate(-45 8 8)" />
        <circle cx="14" cy="14" r="5" fill="#E39A16" />
        <circle cx="14" cy="14" r="2.2" fill="#FFF3D8" />
      </svg>
      <span className={styles.flowerLabel}>{name}</span>
    </div>
  )
}

// ── Alert Marker ──────────────────────────────────────────────────────────────
function AlertMarker({ apiary }: { apiary: Apiary }) {
  return (
    <div className={styles.alertMarker} style={{ left: `${apiary.x}%`, top: `${apiary.y}%` }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#DC2626" />
        <rect x="14.5" y="9" width="3" height="9.5" rx="1.5" fill="white" />
        <circle cx="16" cy="23" r="1.8" fill="white" />
      </svg>
      <span className={styles.alertMarkerLabel}>{apiary.name.replace('養蜂場', '')}</span>
    </div>
  )
}

// ── Crosshair SVG (current location icon) ────────────────────────────────────
function CrosshairIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="#1F2937" strokeWidth="1.8" fill="none" />
      <line x1="10" y1="1" x2="10" y2="5.5" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="14.5" x2="10" y2="19" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="1" y1="10" x2="5.5" y2="10" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14.5" y1="10" x2="19" y2="10" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
          {/* Pin icon with soft circle background */}
          <div className={styles.sheetPinWrap} aria-hidden>
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
              <path
                d="M17 1.5C9.268 1.5 3 7.768 3 15.5C3 26 17 42 17 42C17 42 31 26 31 15.5C31 7.768 24.732 1.5 17 1.5Z"
                fill="#E39A16"
              />
              <circle cx="17" cy="15.5" r="8" fill="white" />
            </svg>
          </div>

          <div className={styles.sheetInfo}>
            <h2 className={styles.sheetName}>{apiary.name}</h2>
            <p className={styles.sheetLocation}>{apiary.prefecture}{apiary.city}</p>
            {/* Colony count + distance on same row */}
            <div className={styles.sheetMetaRow}>
              <div className={styles.sheetCounts}>
                <svg width="15" height="15" viewBox="0 0 22 22" fill="none" aria-hidden="true" className={styles.hiveIcon}>
                  <rect x="7.5" y="7" width="7" height="10" rx="3.5" fill="#1F2937" />
                  <rect x="7.5" y="10" width="7" height="1.5" rx="0.3" fill="white" />
                  <rect x="7.5" y="13" width="7" height="1.5" rx="0.3" fill="white" />
                  <rect x="9" y="6.5" width="4" height="2" rx="1" fill="#1F2937" />
                  <circle cx="11" cy="4.5" r="2" fill="#1F2937" />
                </svg>
                <span className={styles.sheetColonyCount}>{apiary.colonyCount}群</span>
                {apiary.alertCount > 0 && (
                  <span className={styles.sheetAlertCount}>注意 {apiary.alertCount}群</span>
                )}
              </div>
              <div className={styles.sheetDistance}>
                <Car size={13} className={styles.carIcon} aria-hidden />
                <span>{apiary.distanceKm}km</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sheetBtns}>
          <button className={styles.listBtn} type="button" onClick={onViewList}>
            一覧を見る
          </button>
          <button className={styles.routeBtn} type="button" onClick={onRoute}>
            <RouteIcon size={15} aria-hidden />
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
        地図アプリが開けませんでした。上記住所を地図アプリに入力してご確認ください。
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
          <AlignJustify size={20} aria-hidden />
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

        {/* Nectar markers — shown in both apiary and nectar layers */}
        {!isLoading && !isError && (layer === 'apiary' || layer === 'nectar') &&
          MOCK_NECTAR_SOURCES.map(src => (
            <FlowerMarker key={src.id} name={src.name} x={src.x} y={src.y} />
          ))
        }

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

        {/* Alert markers */}
        {!isLoading && !isError && layer === 'alert' &&
          MOCK_APIARIES.filter(a => a.alertCount > 0).map(apiary => (
            <AlertMarker key={apiary.id} apiary={apiary} />
          ))
        }

        {/* Current location button — white circle with crosshair */}
        {!isLoading && !isError && (
          <button
            className={`${styles.locationBtn} ${sheetOpen ? styles.locationBtnUp : ''}`}
            type="button"
            aria-label="現在地へ戻る"
            onClick={handleLocationBtn}
          >
            <CrosshairIcon />
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

        {/* Bottom sheet — inside mapWrapper, above BottomNav via shell padding-bottom */}
        {sheetOpen && selectedApiary && (
          <ApiaryBottomSheet
            apiary={selectedApiary}
            onClose={() => setSelectedId(null)}
            onViewList={() => onViewColonyList?.(selectedApiary.id)}
            onRoute={handleRoute}
          />
        )}
      </div>

      {/* Bottom nav — fixed positioned, 72px */}
      <BottomNav activeTab="farms" onTabChange={() => {}} />
    </div>
  )
}
