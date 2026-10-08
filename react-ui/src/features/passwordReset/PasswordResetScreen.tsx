import { useState, useEffect, useId, useRef } from 'react'
import {
  ChevronLeft,
  ChevronLeft as ChevronSmall,
  AlertCircle,
  WifiOff,
  Info,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import type { PasswordResetViewState } from './types'
import { getDB } from '../../lib/db'
import styles from './PasswordResetScreen.module.css'

interface Props {
  viewState?: PasswordResetViewState
  onBack: () => void
  onSuccess?: () => void
  recoveryMode?: boolean
  onRecoveryComplete?: () => void
  onCancel?: () => void
}

type Step = 1 | 2 | 3

function getInitialStep(vs: PasswordResetViewState): Step {
  if (vs === 'sent' || vs === 'resend-cooldown') return 2
  if (
    vs === 'new-password' ||
    vs === 'password-validation-error' ||
    vs === 'password-updating' ||
    vs === 'password-updated'
  ) return 3
  return 1
}

/** 封筒＋南京錠バッジアイコン */
function MailKeyIllustration() {
  return (
    <div style={{ position: 'relative', width: 72, height: 72 }} aria-hidden="true">
      <Mail size={72} strokeWidth={1.5} color="#1E293B" />
      <div style={{
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#E39A16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #FFFFFF',
      }}>
        <Lock size={14} strokeWidth={2.5} color="#FFFFFF" />
      </div>
    </div>
  )
}

export function PasswordResetScreen({ viewState = 'normal', onBack: _onBack, onSuccess, recoveryMode = false, onRecoveryComplete, onCancel }: Props) {
  const onBack = recoveryMode ? (onCancel ?? _onBack) : _onBack
  const emailId      = useId()
  const emailErrId   = useId()
  const pwId         = useId()
  const pwErrId      = useId()
  const cpwId        = useId()
  const cpwErrId     = useId()
  const statusId     = useId()

  const [step, setStep] = useState<Step>(() => recoveryMode ? 3 : getInitialStep(viewState))

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState(() =>
    viewState === 'filled' || viewState === 'sent' || viewState === 'resend-cooldown'
      ? 'ryota@example.com'
      : '',
  )
  const [emailError, setEmailError]   = useState(() =>
    viewState === 'validation-error' ? 'メールアドレスを入力してください' : '',
  )
  const [submitError, setSubmitError] = useState(() =>
    viewState === 'send-error' ? '処理に失敗しました。もう一度お試しください。' : '',
  )
  const [submitting, setSubmitting]   = useState(viewState === 'submitting')

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [sentEmail, setSentEmail]   = useState(() =>
    viewState === 'sent' || viewState === 'resend-cooldown' ? 'ryota@example.com' : '',
  )
  const [resendCountdown, setResendCountdown] = useState(() =>
    viewState === 'resend-cooldown' ? 45 : 0,
  )
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [passwordError, setPasswordError]     = useState(() =>
    viewState === 'password-validation-error' ? 'パスワードは8文字以上で入力してください' : '',
  )
  const [confirmError, setConfirmError] = useState(() =>
    viewState === 'password-validation-error' ? 'パスワードが一致しません' : '',
  )
  const [pwUpdateError, setPwUpdateError] = useState('')
  const [updating, setUpdating]           = useState(viewState === 'password-updating')
  const [updated, setUpdated]             = useState(viewState === 'password-updated')
  const [linkExpired, setLinkExpired]     = useState(false)

  const isOffline = viewState === 'offline'

  // countdown timer for resend cooldown
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setResendCountdown(c => {
          if (c <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [resendCountdown])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function validateEmail(): boolean {
    if (!email.trim()) {
      setEmailError('メールアドレスを入力してください')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('正しいメールアドレスを入力してください')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitError('')
    if (!validateEmail()) return
    if (isOffline || !navigator.onLine) {
      setSubmitError('オフラインのため、パスワードを再設定できません')
      return
    }
    setSubmitting(true)
    try {
      const db = getDB()
      if (db) {
        await db.resetPassword(email.trim())
      }
      // アカウント存在有無にかかわらず送信完了画面へ（情報漏洩防止）
      setSentEmail(email.trim())
      setStep(2)
    } catch {
      setSubmitError('処理に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0 || submitting) return
    setSubmitting(true)
    try {
      const db = getDB()
      if (db) {
        await db.resetPassword(sentEmail)
      }
      setResendCountdown(60)
    } catch {
      // サイレントフェイル — 送信完了画面のままにする
    } finally {
      setSubmitting(false)
    }
  }

  function validatePassword(): boolean {
    let ok = true
    if (!password) {
      setPasswordError('新しいパスワードを入力してください')
      ok = false
    } else if (password.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください')
      ok = false
    } else {
      setPasswordError('')
    }
    if (!confirmPassword || password !== confirmPassword) {
      setConfirmError('パスワードが一致しません')
      ok = false
    } else {
      setConfirmError('')
    }
    return ok
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (updating) return
    setPwUpdateError('')
    if (!validatePassword()) return
    if (isOffline || !navigator.onLine) {
      setPwUpdateError('オフラインのため、パスワードを再設定できません')
      return
    }
    setUpdating(true)
    const db = getDB()
    if (!db) {
      setPwUpdateError('接続エラー')
      setUpdating(false)
      return
    }
    try {
      const { error } = await db.updatePassword(password)
      setUpdating(false)
      if (error) {
        const msg = error.message ?? ''
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          setLinkExpired(true)
        } else {
          setPwUpdateError('パスワードの更新に失敗しました')
        }
        return
      }
      setUpdated(true)
      try {
        await db.signOut()
      } catch {
        // signOut failure doesn't undo the password update
      }
      setTimeout(() => {
        if (recoveryMode) {
          onRecoveryComplete?.()
        } else {
          onSuccess?.()
        }
      }, 2000)
    } catch {
      setUpdating(false)
      setPwUpdateError('処理に失敗しました。もう一度お試しください。')
    }
  }

  // ── Step indicator ────────────────────────────────────────────────────────
  const stepLabels = ['メール入力', '送信完了', '新規設定'] as const

  function stepClass(n: 1 | 2 | 3) {
    if (n < step) return `${styles.stepItem} ${styles.stepDone}`
    if (n === step) return `${styles.stepItem} ${styles.stepActive}`
    return styles.stepItem
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerSide}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
              aria-label="戻る"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
          </div>
          <h1 className={styles.headerTitle}>パスワード再設定</h1>
          <div className={styles.headerSide} />
        </div>
      </header>

      {/* Banners */}
      {submitError && step === 1 && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorBannerIcon} aria-hidden />
          <span className={styles.errorBannerText}>{submitError}</span>
        </div>
      )}
      {pwUpdateError && step === 3 && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorBannerIcon} aria-hidden />
          <span className={styles.errorBannerText}>{pwUpdateError}</span>
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOff size={16} className={styles.offlineBannerIcon} aria-hidden />
          <span className={styles.offlineBannerText}>オフラインのため、パスワードを再設定できません</span>
        </div>
      )}

      {/* Step indicator */}
      <nav
        className={styles.steps}
        aria-label="手順"
      >
        <span className={styles.srOnly} aria-live="polite">
          {`ステップ${step}：${stepLabels[step - 1]}`}
        </span>
        {([1, 2, 3] as const).map(n => (
          <div
            key={n}
            className={stepClass(n)}
            aria-current={n === step ? 'step' : undefined}
          >
            <div className={styles.stepCircle} aria-hidden>
              {n < step ? <Check size={14} /> : n}
            </div>
            <span className={styles.stepLabel}>{stepLabels[n - 1]}</span>
          </div>
        ))}
      </nav>

      {/* ── Step 1: email input ────────────────────────────────────────────── */}
      {step === 1 && (
        <form
          className={styles.body}
          onSubmit={handleSendEmail}
          noValidate
          aria-label="パスワード再設定フォーム"
        >
          {/* illustration */}
          <div className={styles.illustrationWrap}>
            <MailKeyIllustration />
          </div>

          <h2 className={styles.stepTitle}>登録メールアドレスを入力</h2>
          <p className={styles.stepDesc}>パスワード再設定用のリンクを送信します。</p>

          {/* email field */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={emailId}>メールアドレス</label>
              <span className={styles.required} aria-hidden="true">必須</span>
            </div>
            <input
              id={emailId}
              className={`${styles.input}${emailError ? ` ${styles.inputError}` : ''}`}
              type="email"
              placeholder="例：ryota@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? emailErrId : undefined}
              disabled={submitting}
            />
            {emailError && (
              <span id={emailErrId} className={styles.errorText} role="alert">{emailError}</span>
            )}
          </div>

          {/* submit */}
          <button
            type="submit"
            className={`${styles.submitBtn}${submitting ? ` ${styles.submitBtnLoading}` : ''}`}
            disabled={submitting || isOffline}
            style={{ marginTop: 16 }}
            aria-busy={submitting}
            aria-describedby={statusId}
          >
            {submitting && <span className={styles.submitSpinner} aria-hidden />}
            再設定メールを送信
          </button>
          <span id={statusId} className={styles.srOnly} aria-live="assertive">
            {submitting ? 'メールを送信中…' : ''}
          </span>

          {/* back link */}
          <button
            type="button"
            className={styles.backLink}
            onClick={onBack}
            style={{ marginTop: 4 }}
          >
            <ChevronSmall size={14} aria-hidden />
            ログインに戻る
          </button>

          {/* info box */}
          <div className={styles.infoBox} style={{ marginTop: 16 }}>
            <Info size={15} className={styles.infoIcon} aria-hidden />
            <span className={styles.infoText}>
              リンクの有効期限は60分です。{'\n'}メールが届かない場合は迷惑メールフォルダも確認してください。
            </span>
          </div>

          {/* divider */}
          <div className={styles.previewDivider} style={{ marginTop: 16 }}>
            <span className={styles.previewDividerLine} />
            <span className={styles.previewDividerText}>送信後の表示例</span>
            <span className={styles.previewDividerLine} />
          </div>

          {/* success preview card (design example) */}
          <div className={styles.previewCard} style={{ marginTop: 10 }}>
            <div className={styles.previewIconWrap}>
              <Check size={18} color="#FFFFFF" aria-hidden />
            </div>
            <div className={styles.previewBody}>
              <p className={styles.previewTitle}>メールを送信しました</p>
              <p className={styles.previewText}>
                パスワード再設定用のリンクを{'\n'}
                ryota@example.com に送信しました。{'\n'}
                メールをご確認ください。
              </p>
            </div>
          </div>
        </form>
      )}

      {/* ── Step 2: sent ────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.body} aria-label="送信完了">
          {/* icon */}
          <div className={styles.sentIconWrap}>
            <div className={styles.sentCircle}>
              <Mail size={28} color="#E39A16" aria-hidden />
            </div>
          </div>

          <h2 className={styles.sentTitle}>メールを送信しました</h2>
          <p className={styles.sentEmail}>{sentEmail}</p>
          <p className={styles.sentDesc}>
            パスワード再設定用のリンクを送信しました。{'\n'}
            メールをご確認ください。{'\n'}
            リンクの有効期限は60分です。
          </p>

          {/* resend */}
          <button
            type="button"
            className={styles.resendBtn}
            onClick={() => { void handleResend() }}
            disabled={resendCountdown > 0 || submitting}
          >
            <RefreshCw size={14} aria-hidden />
            {submitting ? 'メールを再送中…' : 'メールを再送'}
          </button>
          {resendCountdown > 0 && (
            <p className={styles.cooldownText} aria-live="polite">
              {resendCountdown}秒後に再送できます
            </p>
          )}

          {/* back link */}
          <button
            type="button"
            className={styles.backLink}
            onClick={onBack}
            style={{ marginTop: 16 }}
          >
            <ChevronSmall size={14} aria-hidden />
            ログインに戻る
          </button>
        </div>
      )}

      {/* ── Step 3: new password ─────────────────────────────────────────────── */}
      {step === 3 && (
        <form
          className={styles.body}
          onSubmit={handleUpdatePassword}
          noValidate
          aria-label="新しいパスワード設定フォーム"
        >
          {updated ? (
            /* success state */
            <div className={styles.successCard}>
              <div className={styles.successCircle}>
                <Check size={28} color="#FFFFFF" aria-hidden />
              </div>
              <h2 className={styles.successTitle}>パスワードを更新しました</h2>
              <p className={styles.successDesc}>
                新しいパスワードでログインできます。{'\n'}
                ログイン画面へ移動します…
              </p>
            </div>
          ) : (
            <>
              {linkExpired && (
                <div className={styles.expiredNotice} role="alert">
                  <AlertCircle size={15} className={styles.expiredIcon} aria-hidden />
                  <span className={styles.expiredText}>
                    リンクの有効期限が切れています。再設定メールをもう一度送信してください。
                  </span>
                </div>
              )}

              <h2 className={styles.stepTitle} style={{ textAlign: 'left' }}>新しいパスワードを設定</h2>
              <p className={styles.stepDesc} style={{ textAlign: 'left', marginBottom: 16 }}>
                新しいパスワードを入力してください。
              </p>

              {/* new password */}
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor={pwId}>新しいパスワード</label>
                  <span className={styles.required} aria-hidden="true">必須</span>
                </div>
                <div className={styles.passwordWrap}>
                  <input
                    id={pwId}
                    className={`${styles.input}${passwordError ? ` ${styles.inputError}` : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8文字以上"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError('') }}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? pwErrId : undefined}
                    disabled={updating || linkExpired}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                  </button>
                </div>
                {passwordError && (
                  <span id={pwErrId} className={styles.errorText} role="alert">{passwordError}</span>
                )}
              </div>

              {/* confirm password */}
              <div className={styles.field} style={{ marginTop: 16 }}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor={cpwId}>新しいパスワード（確認）</label>
                  <span className={styles.required} aria-hidden="true">必須</span>
                </div>
                <div className={styles.passwordWrap}>
                  <input
                    id={cpwId}
                    className={`${styles.input}${confirmError ? ` ${styles.inputError}` : ''}`}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="もう一度入力"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError('') }}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={confirmError ? 'true' : 'false'}
                    aria-describedby={confirmError ? cpwErrId : undefined}
                    disabled={updating || linkExpired}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'パスワードを非表示' : 'パスワードを表示'}
                    tabIndex={0}
                  >
                    {showConfirm ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                  </button>
                </div>
                {confirmError && (
                  <span id={cpwErrId} className={styles.errorText} role="alert">{confirmError}</span>
                )}
              </div>

              {/* submit */}
              <button
                type="submit"
                className={`${styles.submitBtn}${updating ? ` ${styles.submitBtnLoading}` : ''}`}
                disabled={updating || linkExpired}
                style={{ marginTop: 24 }}
                aria-busy={updating}
                aria-describedby={statusId}
              >
                {updating && <span className={styles.submitSpinner} aria-hidden />}
                新しいパスワードを保存
              </button>
              <span id={statusId} className={styles.srOnly} aria-live="assertive">
                {updating ? 'パスワードを保存中…' : ''}
              </span>

              {linkExpired && (
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => { setStep(1); setLinkExpired(false) }}
                  style={{ marginTop: 8 }}
                >
                  <ChevronSmall size={14} aria-hidden />
                  再設定メールを送り直す
                </button>
              )}
            </>
          )}
        </form>
      )}
    </div>
  )
}
