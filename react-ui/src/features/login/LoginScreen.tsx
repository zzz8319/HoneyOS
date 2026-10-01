import { useState, useId, useRef, type FormEvent } from 'react'
import { AlertCircle, WifiOff, Eye, EyeOff } from 'lucide-react'
import type { LoginViewState } from './types'
import styles from './LoginScreen.module.css'

interface Props {
  viewState?: LoginViewState
  onSuccess?: () => void
  onForgotPassword?: () => void
  onRegister?: () => void
}

/** HoneyOS ロゴ — 濃紺の巣箱 + オレンジ横線3本 */
function HiveLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* 屋根 */}
      <path d="M8 22 L28 10 L48 22" stroke="#17212B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {/* 本体 */}
      <rect x="10" y="22" width="36" height="22" rx="3" stroke="#17212B" strokeWidth="2.5" fill="none" />
      {/* 台座 */}
      <rect x="6" y="44" width="44" height="5" rx="2.5" stroke="#17212B" strokeWidth="2.5" fill="none" />
      {/* オレンジ横線 3本 */}
      <line x1="18" y1="29" x2="38" y2="29" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="34" x2="38" y2="34" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="39" x2="38" y2="39" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function LoginScreen({ viewState = 'normal', onSuccess, onForgotPassword, onRegister }: Props) {
  const emailId    = useId()
  const emailErrId = useId()
  const pwId       = useId()
  const pwErrId    = useId()
  const statusId   = useId()

  const [email, setEmail] = useState(() => {
    if (viewState === 'filled' || viewState === 'submitting' || viewState === 'auth-error') {
      return 'ryota@example.com'
    }
    return ''
  })
  const [password, setPassword] = useState(() => {
    if (viewState === 'filled' || viewState === 'submitting' || viewState === 'auth-error') {
      return 'password123'
    }
    return ''
  })
  const [showPassword, setShowPassword] = useState(viewState === 'password-visible')
  const [rememberMe, setRememberMe] = useState(viewState !== 'remember-me-off')

  const [emailError, setEmailError] = useState(() =>
    viewState === 'validation-error' ? 'メールアドレスを入力してください' : ''
  )
  const [passwordError, setPasswordError] = useState(() =>
    viewState === 'validation-error' ? 'パスワードを入力してください' : ''
  )
  const [authError, setAuthError] = useState(
    viewState === 'auth-error'
  )
  const [submitting, setSubmitting] = useState(viewState === 'submitting')
  const isOffline = viewState === 'offline'

  const submitRef = useRef<HTMLButtonElement>(null)

  function validate(): boolean {
    let ok = true
    if (!email.trim()) {
      setEmailError('メールアドレスを入力してください')
      ok = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('正しいメールアドレスを入力してください')
      ok = false
    } else {
      setEmailError('')
    }
    if (!password) {
      setPasswordError('パスワードを入力してください')
      ok = false
    } else {
      setPasswordError('')
    }
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isOffline || submitting) return
    setAuthError(false)
    if (!validate()) return

    setSubmitting(true)
    try {
      await window.HoneyDB.login(email, password)
      onSuccess?.()
    } catch {
      setAuthError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || isOffline

  return (
    <div className={styles.screen}>
      {/* ── バナー ── */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          <WifiOff size={16} className={styles.offlineBannerIcon} aria-hidden />
          <span className={styles.offlineBannerText}>
            オフラインのため、ログインできません。接続を確認してください。
          </span>
        </div>
      )}
      {authError && !isOffline && (
        <div className={styles.errorBanner} role="alert" id={statusId}>
          <AlertCircle size={16} className={styles.errorBannerIcon} aria-hidden />
          <span className={styles.errorBannerText}>
            メールアドレスまたはパスワードが正しくありません。
          </span>
        </div>
      )}

      {/* ── ロゴエリア ── */}
      <div className={styles.logoArea}>
        <HiveLogo />
        <div className={styles.logoText}>
          <span className={styles.logoHoney}>Honey</span><span className={styles.logoOS}>OS</span>
        </div>
        <p className={styles.catchCopy}>養蜂を、もっと見えるように。</p>
      </div>

      {/* ── ログインカード ── */}
      <div className={styles.card}>
        <form onSubmit={handleSubmit} noValidate>
          {/* メールアドレス */}
          <div className={styles.field}>
            <label htmlFor={emailId} className={styles.label}>
              メールアドレス
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              placeholder="例：ryota@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
              className={[styles.input, emailError ? styles.inputError : ''].join(' ')}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? emailErrId : undefined}
              disabled={disabled}
            />
            {emailError && (
              <span id={emailErrId} className={styles.errorText} role="alert">{emailError}</span>
            )}
          </div>

          {/* パスワード */}
          <div className={styles.field} style={{ marginTop: 14 }}>
            <label htmlFor={pwId} className={styles.label}>
              パスワード
            </label>
            <div className={styles.passwordWrap}>
              <input
                id={pwId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="パスワードを入力"
                value={password}
                onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError('') }}
                className={[styles.input, passwordError ? styles.inputError : ''].join(' ')}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? pwErrId : undefined}
                disabled={disabled}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
            {passwordError && (
              <span id={pwErrId} className={styles.errorText} role="alert">{passwordError}</span>
            )}
          </div>

          {/* 補助行 */}
          <div className={styles.auxRow}>
            <label className={styles.rememberLabel}>
              <input
                type="checkbox"
                className={styles.rememberCheckbox}
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span className={styles.rememberText}>ログイン状態を保持</span>
            </label>
            <button
              type="button"
              className={styles.forgotBtn}
              onClick={onForgotPassword}
            >
              パスワードを忘れた方
            </button>
          </div>

          {/* ログインボタン */}
          <button
            ref={submitRef}
            type="submit"
            className={[styles.submitBtn, submitting ? styles.submitBtnLoading : ''].join(' ')}
            disabled={disabled}
          >
            {submitting && <span className={styles.submitSpinner} aria-hidden />}
            ログイン
          </button>

          {/* 区切り線 */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>または</span>
            <span className={styles.dividerLine} />
          </div>

          {/* 新規登録ボタン */}
          <button
            type="button"
            className={styles.registerBtn}
            onClick={onRegister}
          >
            新規登録
          </button>
        </form>
      </div>

      {/* ── フッター ── */}
      <footer className={styles.footer}>
        <button type="button" className={styles.footerLink}>利用規約</button>
        <span className={styles.footerSep} aria-hidden>|</span>
        <button type="button" className={styles.footerLink}>プライバシーポリシー</button>
      </footer>
    </div>
  )
}
