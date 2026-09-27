import { useState, useEffect, useRef, useId, useCallback } from 'react'
import {
  ChevronLeft,
  Search,
  Info,
  AlertCircle,
  WifiOff,
  MapPin,
  ChevronRight,
  Crosshair,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import type { ApiaryCreateViewState, SelectedLocation, GeocodingResult } from './types'
import { MOCK_SEARCH_RESULTS, DEFAULT_CENTER, DEFAULT_ZOOM } from './mockData'
import styles from './ApiaryCreateScreen.module.css'

interface Props {
  viewState?: ApiaryCreateViewState
  onBack: () => void
  onSuccess?: (apiary: { id?: number; name: string; address: string; lat: number; lng: number }) => void
}

export function ApiaryCreateScreen({ viewState = 'normal', onBack, onSuccess }: Props) {
  const nameId = useId()
  const searchId = useId()
  const nameErrorId = useId()
  const locationErrorId = useId()
  const submitStatusId = useId()

  const isOffline    = viewState === 'offline'
  const isSubmitting = viewState === 'submitting'
  const isMapError   = viewState === 'map-error'
  const isGeoDenied  = viewState === 'geolocation-denied'

  const [name, setName] = useState(() =>
    viewState === 'submitting' || viewState === 'submit-error' ? '宮田養蜂場' : '',
  )
  const [location, setLocation] = useState<SelectedLocation | null>(() =>
    viewState === 'submitting' || viewState === 'submit-error'
      ? { address: '静岡県磐田市宮田', lat: 34.7156, lng: 137.852 }
      : null,
  )
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [searchError, setSearchError]   = useState<'not-found' | 'error' | null>(null)
  const [searching, setSearching]       = useState(false)
  const [showResults, setShowResults]   = useState(false)

  const [nameError, setNameError]     = useState('')
  const [locationError, setLocationError] = useState('')
  const [submitError, setSubmitError] = useState(() =>
    viewState === 'submit-error' ? '養蜂場を登録できませんでした。もう一度お試しください。' : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [mapLoadError, setMapLoadError] = useState(isMapError)
  const [geoDenied, setGeoDenied]     = useState(isGeoDenied)

  const mapRef      = useRef<HTMLDivElement>(null)
  const leafletMap  = useRef<LeafletMap | null>(null)
  const pinMarker   = useRef<LeafletMarker | null>(null)
  const nameRef     = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initCenter = location ?? DEFAULT_CENTER
  const isActuallySubmitting = isSubmitting || submitting

  // ── Map init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMapError) return
    if (!mapRef.current) return

    let cancelled = false
    ;(async () => {
      try {
        const L = (await import('leaflet')).default
        if (cancelled || !mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [initCenter.lat, initCenter.lng],
          zoom: DEFAULT_ZOOM,
          zoomControl: false,        // zoom buttons hidden per design
          attributionControl: false,
        })

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map)

        const pinIcon = L.divIcon({
          className: '',
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="#E39A16" stroke="#C07800" stroke-width="1"/>
            <circle cx="14" cy="14" r="5.5" fill="#fff"/>
          </svg>`,
          iconSize: [28, 36],
          iconAnchor: [14, 36],
        })

        const m = L.marker([initCenter.lat, initCenter.lng], { icon: pinIcon, draggable: true }).addTo(map)
        pinMarker.current = m

        m.on('dragend', () => {
          const p = m.getLatLng()
          setLocation(prev => prev
            ? { ...prev, lat: p.lat, lng: p.lng }
            : { address: '', lat: p.lat, lng: p.lng },
          )
          setLocationError('')
        })

        map.on('click', (e) => {
          m.setLatLng(e.latlng)
          setLocation(prev => prev
            ? { ...prev, lat: e.latlng.lat, lng: e.latlng.lng }
            : { address: '', lat: e.latlng.lat, lng: e.latlng.lng },
          )
          setLocationError('')
        })

        leafletMap.current = map
      } catch {
        if (!cancelled) setMapLoadError(true)
      }
    })()

    return () => {
      cancelled = true
      leafletMap.current?.remove()
      leafletMap.current = null
      pinMarker.current  = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const panTo = useCallback((loc: SelectedLocation) => {
    if (!leafletMap.current || !pinMarker.current) return
    leafletMap.current.setView([loc.lat, loc.lng], DEFAULT_ZOOM)
    pinMarker.current.setLatLng([loc.lat, loc.lng])
  }, [])

  // ── Geocoding ───────────────────────────────────────────────────────────
  async function runSearch(q: string) {
    if (!q) return
    setSearching(true)
    setSearchError(null)
    setShowResults(false)
    try {
      if (window.HoneyDB?.searchAddress) {
        const results = await window.HoneyDB.searchAddress(q)
        setSearchResults(results ?? [])
        setSearchError(results?.length === 0 ? 'not-found' : null)
      } else {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=ja&countrycodes=jp`
        const res = await fetch(url, { headers: { 'User-Agent': 'HoneyOS/1.0 (beekeeping-app)' } })
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json() as Array<{ display_name: string; lat: string; lon: string }>
        if (data.length === 0) {
          setSearchResults([]); setSearchError('not-found')
        } else {
          setSearchResults(data.map(d => ({ address: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) })))
          setSearchError(null)
        }
      }
    } catch {
      const hits = MOCK_SEARCH_RESULTS.filter(r => r.address.includes(q))
      setSearchResults(hits)
      setSearchError(hits.length === 0 ? 'not-found' : null)
    } finally {
      setSearching(false)
      setShowResults(true)
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setShowResults(false)
    setSearchError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed.length >= 2) {
      debounceRef.current = setTimeout(() => { void runSearch(trimmed) }, 600)
    }
  }

  function handleSelectResult(result: GeocodingResult) {
    const loc: SelectedLocation = { address: result.address, lat: result.lat, lng: result.lng }
    setLocation(loc)
    setLocationError('')
    setShowResults(false)
    setSearchQuery(result.address)
    panTo(loc)
  }

  // ── Geolocation ─────────────────────────────────────────────────────────
  function handleCurrentLocation() {
    if (!navigator.geolocation) { setGeoDenied(true); return }
    setGeoLoading(true)
    setGeoDenied(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: SelectedLocation = { address: '', lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(loc)
        setLocationError('')
        panTo(loc)
        setGeoLoading(false)
      },
      () => { setGeoDenied(true); setGeoLoading(false) },
      { timeout: 10000 },
    )
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newNameError = name.trim() === '' ? '養蜂場名を入力してください' : ''
    const newLocError  = !location ? '所在地を選択してください' : ''
    setNameError(newNameError)
    setLocationError(newLocError)
    if (newNameError) { nameRef.current?.focus(); return false }
    return newLocError === ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isActuallySubmitting) return
    setSubmitError('')
    if (!validate()) return
    if (isOffline || !navigator.onLine) { setSubmitError('オフラインのため養蜂場を登録できません'); return }
    setSubmitting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saveFn = (window.HoneyDB as any)?.saveFarm
      if (typeof saveFn === 'function') {
        const result = await saveFn.call(window.HoneyDB, {
          name: name.trim(), address: location!.address, lat: location!.lat, lng: location!.lng,
        }) as { id: number }
        onSuccess?.({ id: result.id, name: name.trim(), address: location!.address, lat: location!.lat, lng: location!.lng })
      } else {
        throw new Error('window.HoneyDB.saveFarm is not implemented')
      }
    } catch {
      setSubmitError('養蜂場を登録できませんでした。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !isActuallySubmitting && !isOffline

  return (
    <div className={styles.screen}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerSide}>
            <button className={styles.backBtn} onClick={onBack} aria-label="戻る" type="button">
              <ChevronLeft size={22} aria-hidden />
            </button>
          </div>
          <h1 className={styles.headerTitle}>養蜂場を追加</h1>
          <div className={styles.headerSide} />
        </div>
      </header>

      {/* Banners */}
      {submitError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorBannerIcon} aria-hidden />
          <span className={styles.errorBannerText}>{submitError}</span>
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOff size={16} className={styles.offlineBannerIcon} aria-hidden />
          <span className={styles.offlineBannerText}>オフラインのため養蜂場を登録できません</span>
        </div>
      )}

      {/* Body */}
      <form className={styles.body} onSubmit={handleSubmit} noValidate aria-label="養蜂場追加フォーム">

        {/* 養蜂場名 */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={nameId}>養蜂場名</label>
            <span className={styles.required} aria-hidden="true">必須</span>
          </div>
          <input
            ref={nameRef}
            id={nameId}
            className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
            type="text"
            placeholder="例：宮田養蜂場"
            value={name}
            onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
            aria-required="true"
            aria-invalid={nameError ? 'true' : 'false'}
            aria-describedby={nameError ? nameErrorId : undefined}
            autoComplete="off"
          />
          {nameError && (
            <span id={nameErrorId} className={styles.errorText} role="alert">{nameError}</span>
          )}
        </div>

        {/* 所在地 */}
        <div className={styles.field} style={{ marginTop: 20 }}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={searchId}>所在地</label>
            <span className={styles.required} aria-hidden="true">必須</span>
          </div>

          {/* Search — results are overlaid, do NOT push content down */}
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden />
            <input
              id={searchId}
              className={styles.searchInput}
              type="search"
              placeholder="住所・地名を検索"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); if (debounceRef.current) clearTimeout(debounceRef.current); void runSearch(searchQuery.trim()) }
                if (e.key === 'Escape') setShowResults(false)
              }}
              aria-label="住所・地名を検索"
              aria-autocomplete="list"
              aria-expanded={showResults}
              autoComplete="off"
            />
            {searching && <span className={styles.searchingIndicator} aria-label="検索中" />}

            {/* Overlay results — does not affect document flow */}
            {showResults && (
              <div className={styles.resultsOverlay} role="listbox" aria-label="検索結果">
                {searchError === 'not-found' && (
                  <div className={styles.resultsMessage}>該当する場所が見つかりませんでした</div>
                )}
                {searchError === 'error' && (
                  <div className={styles.resultsMessage}>所在地を検索できませんでした。もう一度お試しください。</div>
                )}
                {!searchError && searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.resultItem}
                    role="option"
                    aria-selected="false"
                    onMouseDown={e => { e.preventDefault(); handleSelectResult(r) }}
                  >
                    <MapPin size={14} className={styles.resultIcon} aria-hidden />
                    <span className={styles.resultText}>{r.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Geo-denied notice */}
          {geoDenied && (
            <div className={styles.geoNotice} role="alert">
              <AlertCircle size={14} className={styles.geoNoticeIcon} aria-hidden />
              <span className={styles.geoNoticeText}>
                現在地を取得できませんでした。住所を検索するか、地図上で位置を指定してください。
              </span>
            </div>
          )}
        </div>

        {/* Map */}
        <div className={styles.mapSection} style={{ marginTop: 12 }}>
          {mapLoadError ? (
            <div className={styles.mapError} role="alert">
              <MapPin size={28} className={styles.mapErrorIcon} aria-hidden />
              <span className={styles.mapErrorText}>地図を読み込めませんでした。</span>
              <button type="button" className={styles.retryBtn} onClick={() => { setMapLoadError(false); window.location.reload() }}>
                再試行
              </button>
            </div>
          ) : (
            <div className={styles.mapWrap}>
              <div
                ref={mapRef}
                className={styles.mapContainer}
                aria-label="養蜂場の位置を選択する地図"
                role="application"
              />
              <button
                type="button"
                className={styles.geoBtn}
                aria-label="現在地を取得"
                onClick={handleCurrentLocation}
                disabled={geoLoading}
              >
                {geoLoading
                  ? <span className={styles.geoBtnSpinner} aria-hidden />
                  : <Crosshair size={18} aria-hidden />
                }
              </button>
            </div>
          )}
        </div>

        {/* Location card */}
        <button
          type="button"
          className={`${styles.locationCard}${locationError ? ` ${styles.locationCardError}` : ''}`}
          onClick={() => { if (location && leafletMap.current) leafletMap.current.setView([location.lat, location.lng], DEFAULT_ZOOM) }}
          aria-label="選択地点の詳細"
          style={{ marginTop: 10 }}
        >
          <div className={styles.locationIconWrap}>
            <MapPin size={20} color="#E39A16" aria-hidden />
          </div>
          <div className={styles.locationCardBody}>
            {location ? (
              <>
                <span className={styles.locationAddress}>{location.address || '位置が選択されています'}</span>
                <span className={styles.locationCoords}>{location.lat.toFixed(2)}, {location.lng.toFixed(2)}</span>
                <span className={styles.locationHint}>ピンを移動して位置を調整</span>
              </>
            ) : (
              <span className={styles.locationPlaceholder}>所在地を選択してください</span>
            )}
          </div>
          <ChevronRight size={18} className={styles.locationChevron} aria-hidden />
        </button>
        {locationError && (
          <span id={locationErrorId} className={styles.errorText} role="alert" style={{ marginTop: 4 }}>{locationError}</span>
        )}

        {/* Info box */}
        <div className={styles.infoBox} style={{ marginTop: 14 }}>
          <Info size={15} className={styles.infoIcon} aria-hidden />
          <span className={styles.infoText}>位置情報は天気の自動取得と移動案内に使用します。</span>
        </div>

        {/* Hint chip */}
        <div style={{ marginTop: 8 }}>
          <span className={styles.hintChip}>所在地は後から変更できます。</span>
        </div>

        {/* a11y submit status */}
        <span id={submitStatusId} className={styles.srOnly} aria-live="assertive">
          {isActuallySubmitting ? '登録中…' : ''}
        </span>

        {/* Bottom buttons */}
        <div className={styles.actions} style={{ marginTop: 24 }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onBack}
            disabled={isActuallySubmitting}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className={`${styles.submitBtn}${isActuallySubmitting ? ` ${styles.submitBtnLoading}` : ''}`}
            disabled={!canSubmit}
            aria-describedby={submitStatusId}
            aria-busy={isActuallySubmitting}
          >
            {isActuallySubmitting && <span className={styles.submitSpinner} aria-hidden />}
            養蜂場を登録
          </button>
        </div>
      </form>
    </div>
  )
}
