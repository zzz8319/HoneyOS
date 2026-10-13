import { useState, useId, type FormEvent } from 'react'
import { ChevronLeft, AlertCircle, WifiOff, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'
import type { SignupViewState } from './types'
import styles from './SignupScreen.module.css'

interface Props {
  viewState?: SignupViewState
  onBack: () => void
  onLogin?: () => void
}

/** HoneyOS ロゴ — 濃紺の巣箱 + オレンジ横線3本 */
function HiveLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 22 L28 10 L48 22" stroke="#17212B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <rect x="10" y="22" width="36" height="22" rx="3" stroke="#17212B" strokeWidth="2.5" fill="none" />
      <rect x="6" y="44" width="44" height="5" rx="2.5" stroke="#17212B" strokeWidth="2.5" fill="none" />
      <line x1="18" y1="29" x2="38" y2="29" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="34" x2="38" y2="34" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="39" x2="38" y2="39" stroke="#E39A16" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function SignupScreen({ viewState = 'normal', onBack, onLogin }: Props) {
  const nameId    = useId()
  const nameErrId = useId()
  const emailId   = useId()
  const emailErrId = useId()
  const pwId      = useId()
  const pwErrId   = useId()
  const farmId    = useId()

  const isFilled = viewState === 'filled' || viewState === 'submitting' || viewState === 'signup-error'

  const [name,     setName]     = useState(() => isFilled ? '川添 良太' : '')
  const [email,    setEmail]    = useState(() => isFilled ? 'ryota@example.com' : '')
  const [password, setPassword] = useState(() => isFilled ? 'password123' : '')
  const [farmName, setFarmName] = useState(() => isFilled ? '川添養蜂場' : '')
  const [showPw,   setShowPw]   = useState(viewState === 'password-visible')

  const [nameError,  setNameError]  = useState(() => viewState === 'validation-error' ? '名前を入力してください' : '')
  const [emailError, setEmailError] = useState(() => viewState === 'validation-error' ? 'メールアドレスを入力してください' : '')
  const [pwError,    setPwError]    = useState(() => viewState === 'validation-error' ? 'パスワードは8文字以上で入力してください' : '')

  const [signupError, setSignupError] = useState(viewState === 'signup-error')
  const [submitting,  setSubmitting]  = useState(viewState === 'submitting')
  const [sentEmail,   setSentEmail]   = useState<string | null>(() =>
    viewState === 'confirmation-sent' ? 'ryota@example.com' : null
  )

  const isOffline = viewState === 'offline'

  function validate(): boolean {
    let ok = true
    if (!name.trim()) { setNameError('名前を入力してください'); ok = false }
    else setNameError('')
    if (!email.trim()) { setEmailError('メールアドレスを入力してください'); ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('正しいメールアドレスを入力してください'); ok = false }
    else setEmailError('')
    if (!password) { setPwError('パスワードを入力してください'); ok = false }
    else if (password.length < 8) { setPwError('パスワードは8文字以上で入力してください'); ok = false }
    else setPwError('')
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isOffline || submitting) return
    setSignupError(false)
    if (!validate()) return
    setSubmitting(true)
    try {
      await window.HoneyDB.signUp(email, password, name, farmName.trim() || undefined)
      setSentEmail(email)
    } catch {
      setSignupError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || isOffline

  // ── 送信完了画面 ──────────────────────────────────────────────────────────
  if (sentEmail) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerSide} />
          <h1 className={styles.headerTitle}>新規登録</h1>
          <div className={styles.headerSide} />
        </header>
        <div className={styles.confirmWrap}>
          <div className={styles.confirmCircle}>
            <Mail size={28} color="#E39A16" aria-hidden />
          </div>
          <h2 className={styles.confirmTitle}>確認メールを送信しました</h2>
          <p className={styles.confirmEmail}>{sentEmail}</p>
          <p className={styles.confirmDesc}>
            上記のメールアドレスに確認メールをお送りしました。{'\n'}
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <div className={styles.confirmNote}>
            <CheckCircle size={14} color="#16A34A" aria-hidden />
            <span>メールが届かない場合は迷惑メールフォルダもご確認ください。</span>
          </div>
          <button className={styles.loginBtn} onClick={onLogin}>
            ログイン画面へ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <div className={styles.headerSide}>
          <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
            <ChevronLeft size={24} aria-hidden />
          </button>
        </div>
        <h1 className={styles.headerTitle}>新規登録</h1>
        <div className={styles.headerSide} />
      </header>

      {/* ── バナー ── */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          <WifiOff size={15} className={styles.bannerIcon} aria-hidden />
          <span className={styles.bannerText}>オフラインのため、登録できません。接続を確認してください。</span>
        </div>
      )}
      {signupError && !isOffline && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={15} className={styles.bannerIcon} aria-hidden />
          <span className={styles.bannerText}>アカウントの作成に失敗しました。もう一度お試しください。</span>
        </div>
      )}

      {/* ── ロゴ ── */}
      <div className={styles.logoArea}>
        <HiveLogo />
        <div className={styles.logoText}>
          <span className={styles.logoHoney}>Honey</span><span className={styles.logoOS}>OS</span>
        </div>
        <p className={styles.catchCopy}>養蜂を、もっと見えるように。</p>
      </div>

      {/* ── フォーム ── */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* 名前 */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor={nameId} className={styles.label}>名前</label>
            <span className={styles.required}>必須</span>
          </div>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            placeholder="例：川添 良太"
            value={name}
            onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
            className={[styles.input, nameError ? styles.inputError : ''].join(' ')}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? nameErrId : undefined}
            disabled={disabled}
          />
          {nameError && <span id={nameErrId} className={styles.errorText} role="alert">{nameError}</span>}
        </div>

        {/* メールアドレス */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor={emailId} className={styles.label}>メールアドレス</label>
            <span className={styles.required}>必須</span>
          </div>
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
          {emailError && <span id={emailErrId} className={styles.errorText} role="alert">{emailError}</span>}
        </div>

        {/* パスワード */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor={pwId} className={styles.label}>パスワード</label>
            <span className={styles.required}>必須</span>
          </div>
          <div className={styles.pwWrap}>
            <input
              id={pwId}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="パスワードを入力"
              value={password}
              onChange={e => { setPassword(e.target.value); if (pwError) setPwError('') }}
              className={[styles.input, pwError ? styles.inputError : ''].join(' ')}
              aria-invalid={!!pwError}
              aria-describedby={pwError ? pwErrId : undefined}
              disabled={disabled}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
            >
              {showPw ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
          {pwError && <span id={pwErrId} className={styles.errorText} role="alert">{pwError}</span>}
        </div>

        {/* 養蜂場名（任意） */}
        <div className={styles.field}>
          <label htmlFor={farmId} className={styles.label}>養蜂場名<span className={styles.optional}>（任意）</span></label>
          <input
            id={farmId}
            type="text"
            autoComplete="organization"
            placeholder="例：宮田養蜂場"
            value={farmName}
            onChange={e => setFarmName(e.target.value)}
            className={styles.input}
            disabled={disabled}
          />
        </div>

        {/* 登録ボタン */}
        <button
          type="submit"
          className={[styles.submitBtn, submitting ? styles.submitBtnLoading : ''].join(' ')}
          disabled={disabled}
        >
          {submitting && <span className={styles.submitSpinner} aria-hidden />}
          アカウントを作成
        </button>
        <p className={styles.submitNote}>登録後、確認メールをお送りします。</p>

        {/* ── 下部導線 ── */}
        <div className={styles.footer}>
          <div className={styles.footerDivider} />
          <p className={styles.footerRow}>
            すでにアカウントをお持ちの方
            <button type="button" className={styles.loginLink} onClick={onLogin}>ログイン</button>
          </p>
        </div>
      </form>
    </div>
  )
}
