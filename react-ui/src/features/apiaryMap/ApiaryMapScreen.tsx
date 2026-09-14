import { useState, useCallback } from 'react'
import {
  ArrowLeft, Search, MapPin, Flower2,
  AlertTriangle, Car, Navigation, X, AlignJustify,
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
      viewBox="0 0 390 560"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* ── Land base ── */}
      <rect width="390" height="560" fill="#EDE8D8" />

      {/* ── Terrain: forests / hills ── */}
      <path d="M0,0 L0,245 Q18,228 42,214 Q68,198 94,180 Q118,163 140,147 Q146,100 142,52 Q130,15 100,0 Z" fill="#C8D9A4" />
      <path d="M278,0 L390,0 L390,195 Q370,183 352,170 Q332,157 314,143 Q296,130 282,114 Q276,72 278,36 Z" fill="#C8D9A4" />
      <path d="M0,260 Q12,250 30,246 Q50,242 62,252 Q65,272 50,282 Q28,288 5,275 Z" fill="#C8D9A4" opacity="0.75" />
      <path d="M0,308 Q10,300 26,298 Q40,296 44,308 Q42,320 24,324 Q8,322 0,314 Z" fill="#C8D9A4" opacity="0.6" />
      <path d="M322,52 Q350,46 366,58 Q374,78 360,88 Q340,92 326,80 Z" fill="#C8D9A4" opacity="0.7" />
      <path d="M356,122 Q377,118 390,126 L390,148 Q380,155 362,152 Q350,144 356,122 Z" fill="#C8D9A4" opacity="0.65" />
      <path d="M218,0 L238,0 Q245,30 242,62 Q238,88 228,102 Q218,90 214,62 Q210,34 218,0 Z" fill="#C8D9A4" opacity="0.55" />

      {/* ── City block areas ── */}
      {/* Kakegawa urban area (lower-left) */}
      <rect x="8" y="332" width="58" height="48" rx="2" fill="#E0D8C4" opacity="0.8" />
      <line x1="24" y1="332" x2="24" y2="380" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="42" y1="332" x2="42" y2="380" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="8" y1="349" x2="66" y2="349" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="8" y1="363" x2="66" y2="363" stroke="#CDC8B8" strokeWidth="0.7" />
      {/* Fukuroi-Iwata urban (center) */}
      <rect x="162" y="302" width="78" height="58" rx="2" fill="#E0D8C4" opacity="0.7" />
      <line x1="180" y1="302" x2="180" y2="360" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="200" y1="302" x2="200" y2="360" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="220" y1="302" x2="220" y2="360" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="162" y1="320" x2="240" y2="320" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="162" y1="338" x2="240" y2="338" stroke="#CDC8B8" strokeWidth="0.7" />
      {/* Iwata district */}
      <rect x="228" y="282" width="52" height="44" rx="2" fill="#E0D8C4" opacity="0.65" />
      <line x1="244" y1="282" x2="244" y2="326" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="262" y1="282" x2="262" y2="326" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="228" y1="300" x2="280" y2="300" stroke="#CDC8B8" strokeWidth="0.7" />
      {/* Hamamatsu urban (right) */}
      <rect x="310" y="248" width="80" height="75" rx="2" fill="#E0D8C4" opacity="0.65" />
      <line x1="328" y1="248" x2="328" y2="323" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="348" y1="248" x2="348" y2="323" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="368" y1="248" x2="368" y2="323" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="310" y1="265" x2="390" y2="265" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="310" y1="284" x2="390" y2="284" stroke="#CDC8B8" strokeWidth="0.7" />
      <line x1="310" y1="304" x2="390" y2="304" stroke="#CDC8B8" strokeWidth="0.7" />

      {/* ── Tenryu River — center, flowing south ── */}
      <path d="M150,0 Q153,55 151,110 Q149,168 146,222 Q143,272 141,318 Q139,358 138,398 Q137,432 136,472 Q135,508 134,544" stroke="#8EC0D8" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M134,544 Q132,558 130,575" stroke="#8EC0D8" strokeWidth="16" fill="none" strokeLinecap="round" />
      {/* S-curve meander */}
      <path d="M146,222 Q155,248 158,272 Q156,300 148,318" stroke="#8EC0D8" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Reservoir */}
      <ellipse cx="320" cy="212" rx="13" ry="7" fill="#8EC0D8" />
      {/* Western tributary */}
      <path d="M0,198 Q32,190 66,188 Q92,186 118,190 Q135,194 144,208" stroke="#A8CCD8" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Northern stream */}
      <path d="M102,0 Q107,38 112,76 Q120,112 130,150 Q138,174 143,198" stroke="#A8CCD8" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── Ocean ── */}
      <path d="M0,460 Q52,450 106,454 Q158,458 205,452 Q252,447 282,450 Q322,453 390,447 L390,560 L0,560 Z" fill="#8EC0D8" />
      <path d="M18,480 Q55,475 86,480" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M108,495 Q148,490 186,495" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M198,478 Q242,473 280,478" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M296,493 Q330,488 364,493" stroke="#7BACC8" strokeWidth="1.5" fill="none" />
      <path d="M14,512 Q62,507 98,512" stroke="#7BACC8" strokeWidth="1.2" fill="none" />
      <path d="M218,512 Q265,507 308,512" stroke="#7BACC8" strokeWidth="1.2" fill="none" />

      {/* ── E1 Tomei Expressway ── */}
      <path d="M0,292 Q46,286 97,284 Q152,282 202,284 Q252,286 296,288 Q342,290 390,286" stroke="#A8A898" strokeWidth="4.5" fill="none" />
      <path d="M0,292 Q46,286 97,284 Q152,282 202,284 Q252,286 296,288 Q342,290 390,286" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="14,9" />

      {/* ── National Route 1 ── */}
      <path d="M0,322 Q50,316 102,314 Q156,312 202,314 Q256,316 296,318 Q344,321 390,317" stroke="#C4C4B8" strokeWidth="2.5" fill="none" />

      {/* ── Route 150 coastal ── */}
      <path d="M0,430 Q62,420 118,426 Q178,432 238,426 Q296,420 362,426 L390,428" stroke="#C8C8C0" strokeWidth="2" fill="none" />

      {/* ── Prefectural routes N-S ── */}
      <path d="M70,207 Q72,262 74,314 Q75,358 76,402 Q77,436 77,458" stroke="#D0CCC4" strokeWidth="1.8" fill="none" />
      <path d="M176,172 Q178,232 180,292 Q181,347 182,402 Q183,436 184,456" stroke="#D0CCC4" strokeWidth="1.8" fill="none" />
      <path d="M250,168 Q252,228 254,292 Q256,347 257,402" stroke="#D0CCC4" strokeWidth="1.8" fill="none" />
      <path d="M358,170 Q360,232 361,297 Q362,347 362,400" stroke="#D0CCC4" strokeWidth="1.8" fill="none" />

      {/* ── E-W local roads ── */}
      <path d="M0,250 Q46,246 96,244 Q126,243 152,245" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M158,241 Q200,238 250,239 Q292,240 332,241" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M256,218 Q296,215 340,217 Q368,219 390,220" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M0,362 Q42,358 76,360 Q112,361 152,362" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M182,360 Q216,357 254,358 Q280,359 295,361" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M256,332 Q296,330 358,332 L390,333" stroke="#D0CCC4" strokeWidth="1.5" fill="none" />
      <path d="M0,402 Q42,399 76,400" stroke="#D0CCC4" strokeWidth="1.2" fill="none" />
      <path d="M182,402 Q216,399 254,400 Q280,401 295,403" stroke="#D0CCC4" strokeWidth="1.2" fill="none" />

      {/* ── Fine local streets ── */}
      <path d="M74,362 Q112,360 156,362" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M74,315 Q112,313 153,315" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M28,250 Q28,292 30,322 Q31,358 32,398" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M48,250 Q48,292 50,322 Q51,358 52,398" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M196,284 Q196,332 197,362 Q198,392 199,422" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M214,284 Q214,332 215,362 Q216,392 217,422" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M162,318 Q162,338 162,358" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M328,250 Q328,282 329,318" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M348,250 Q348,282 349,318" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M310,266 Q348,266 390,267" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M310,284" stroke="#D8D4CC" strokeWidth="1" fill="none" />
      <path d="M310,305 Q348,305 390,306" stroke="#D8D4CC" strokeWidth="1" fill="none" />

      {/* ── Route badges ── */}
      <rect x="170" y="278" width="16" height="10" rx="2" fill="#6A8CC0" />
      <text x="178" y="287" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">1</text>
      <rect x="194" y="421" width="22" height="11" rx="2" fill="#6A8CC0" />
      <text x="205" y="430" fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">150</text>

      {/* ── City labels (placed away from markers and their labels) ── */}
      {/* 掛川市: upper-right, away from yamate at (46%,26%) */}
      <text x="334" y="163" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">掛川市</text>
      {/* 袋井市: right side */}
      <text x="336" y="256" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">袋井市</text>
      {/* 磐田市: center-lower, well below miyata at (63%,54%) */}
      <text x="204" y="384" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">磐田市</text>
      {/* 浜松市: right */}
      <text x="338" y="228" fontSize="11" fill="#7A8590" fontFamily="sans-serif" fontWeight="500">浜松市</text>

      {/* ── Ocean / river labels ── */}
      <text x="38" y="516" fontSize="11" fill="#5A90A8" fontFamily="sans-serif">遠州灘</text>
      <text x="153" y="356" fontSize="10" fill="#5A90A8" fontFamily="sans-serif" transform="rotate(-88 153 356)">天竜川</text>
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
      <svg width="28" height="36" viewBox="0 0 36 46" fill="none" aria-hidden="true" className={styles.markerPin}>
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
      {/* Two-line label: name / colony count — displayed to the right of pin */}
      <span className={`${styles.markerLabel} ${selected ? styles.markerLabelSelected : ''}`}>
        <span className={styles.markerLabelName}>{apiary.name}</span>
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
      <span className={styles.alertMarkerLabel}>{apiary.name}</span>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.hiveIcon}>
                  {/* 3-stack Langstroth hive boxes */}
                  <rect x="2" y="1.5" width="12" height="3.5" rx="0.5" fill="#1F2937" />
                  <rect x="2" y="5.5" width="12" height="3.5" rx="0.5" fill="#1F2937" opacity="0.82" />
                  <rect x="2" y="9.5" width="12" height="3.5" rx="0.5" fill="#1F2937" opacity="0.65" />
                  {/* Bottom board */}
                  <rect x="1" y="13.5" width="14" height="1.5" rx="0.4" fill="#1F2937" opacity="0.45" />
                </svg>
                <span className={styles.sheetColonyCount}>{apiary.colonyCount}群</span>
                {apiary.alertCount > 0 && (
                  <span className={styles.sheetAlertCount}>・注意 {apiary.alertCount}群</span>
                )}
              </div>
              <div className={styles.sheetDistance}>
                <Car size={13} className={styles.carIcon} aria-hidden />
                <span>現在地から {apiary.distanceKm}km</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sheetBtns}>
          <button className={styles.listBtn} type="button" onClick={onViewList}>
            一覧を見る
          </button>
          <button className={styles.routeBtn} type="button" onClick={onRoute}>
            <Navigation size={15} aria-hidden />
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
